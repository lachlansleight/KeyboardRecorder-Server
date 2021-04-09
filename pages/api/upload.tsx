import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { resolve } from "path";
import { parseRecording } from "../../lib/data/parse";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    console.log("Received recording - /api/upload");

    const authResponse = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY}`,
        {
            email: process.env.NEXT_PUBLIC_FB_EMAIL,
            password: process.env.NEXT_PUBLIC_FB_PASSWORD,
            returnSecureToken: true,
        }
    );
    const idToken = authResponse.data.idToken;

    const auth = req.headers.authorization;
    if (!auth) {
        await axios.post(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/errors.json?auth=${idToken}`,
            {
                error: "No authorization mac address provided",
                type: "auth",
                timestamp: new Date(),
            }
        );
        console.error("No mac address provided");
        res.status(401);
        res.json(new Error("No authorization provided"));
        return;
    } else {
        const mac = auth.split(" ").slice(-1)[0];
        if (mac !== process.env.NEXT_PUBLIC_DEVICE_MAC_ADDRESS) {
            await axios.post(
                `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/errors.json?auth=${idToken}`,
                {
                    error: "Device " + mac + " not authorized to upload",
                    type: "auth",
                    timestamp: new Date(),
                }
            );
            console.error("Device " + mac + " not authorized to upload");
            res.status(401);
            res.json(new Error("Device not authorized to upload"));
            return;
        }
    }

    if (req.body) {
        res.statusCode = 400;
        res.json({ success: false });
        resolve();
        return;
    }

    const bytes: number[] = [];
    const errors = [];
    req.on("data", async chunk => {
        try {
            for (let i = 0; i < chunk.length; i++) {
                bytes.push(chunk.readUInt8(i));
            }
            console.log("Received " + bytes.length + " bytes");
        } catch (error) {
            errors.push("Failed to read bytes from chunk: " + error);
        }
    });

    if (errors.length > 0) {
        await axios.post(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/errors.json?auth=${idToken}`,
            {
                error: errors,
                type: "read",
                timestamp: new Date(),
            }
        );
        res.statusCode = 500;
        res.json({ success: false });
        resolve();
        return;
    }

    req.on("end", async () => {
        try {
            const recording = parseRecording(bytes);
            await axios.post(
                `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings.json?auth=${idToken}`,
                recording
            );
            console.log(recording);
            res.statusCode = 201;
            res.json({ success: true });
            resolve();
        } catch (error) {
            await axios.post(
                `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/errors.json?auth=${idToken}`,
                {
                    error: error,
                    type: "parse",
                    timestamp: new Date(),
                    rawData: bytes.join(","),
                }
            );
            res.statusCode = 500;
            res.json({ success: false });
            resolve();
            return;
        }
    });
};

export const config = {
    api: {
        bodyParser: false,
    },
};

import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { resolve } from "path";
import { parseRecording } from "../../lib/data/parse";

//todo
export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    console.log("Received recording - /api/upload");

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

    if (errors) {
        await axios.post(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/errors.json`, {
            readErrors: errors,
            timestamp: new Date(),
        });
        res.statusCode = 500;
        res.json({ success: false });
        resolve();
        return;
    }

    req.on("end", async () => {
        try {
            const recording = parseRecording(bytes);
            await axios.post(
                `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings.json`,
                recording
            );
            console.log(recording);
            res.statusCode = 201;
            res.json({ success: true });
            resolve();
        } catch (error) {
            await axios.post(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/errors.json`, {
                parseError: error,
                timestamp: new Date(),
                rawData: bytes.join(","),
            });
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

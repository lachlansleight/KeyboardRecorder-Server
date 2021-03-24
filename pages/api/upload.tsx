import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { resolve } from "path";
import { parseRecording } from "../../lib/data/parse";

//todo
export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    console.log("Received recording - /api/upload");

    try {
        if (!req.body) {
            const bytes = [];
            req.on("data", async chunk => {
                for (let i = 0; i < chunk.length; i++) {
                    bytes.push(chunk.readUInt8(i));
                }
                console.log("Received " + bytes.length + " bytes");
            });

            req.on("end", async () => {
                console.log("Data end");
                const recording = parseRecording(bytes);
                await axios.post(
                    `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings.json`,
                    recording
                );
                console.log(recording);
                res.statusCode = 201;
                res.json({ success: true });
                resolve();
            });
        }
    } catch (error) {
        console.error("Failed to upload recording: ", error);
        res.statusCode = error.statusCode || 200;
        res.json(error);
    }
};

export const config = {
    api: {
        bodyParser: false,
    },
};

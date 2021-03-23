import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { resolve } from "path";
import { parseRecording } from "../../lib/data/parse";

//todo
export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    console.log("Received recording - /api/upload");
    
    try {
        if(!req.body) {
            req.on("data", async chunk => {
                const bytes = [];
                for(let i = 0; i < chunk.length; i++) {
                    bytes.push(chunk.readUInt8(i));
                }
                const recording = parseRecording(bytes);
                await axios.post("https://midirecorder-default-rtdb.firebaseio.com/recordings.json", recording);
                console.log(recording);
            });

            req.on("end", () => {
                res.statusCode = 201;
                res.json({success: true});
                resolve();
            })
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
    }
}
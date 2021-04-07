import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    try {
        const currentResponse = await axios(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings.json`
        );
        const filteredRecordings = Object.keys(currentResponse.data).filter(key => {
            return req.body.ids.findIndex((k: string) => k === key) === -1;
        });
        const newRecordings = {};
        filteredRecordings.forEach(key => {
            newRecordings[key] = currentResponse.data[key];
        });
        await axios.put(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings.json`,
            newRecordings
        );
        res.status(200);
        res.json({ success: true });
    } catch (error) {
        res.status(500);
        res.json({ success: false, error });
    }
};

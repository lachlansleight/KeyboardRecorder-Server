import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    try {
        const authResponse = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY}`,
            {
                email: process.env.NEXT_PUBLIC_FB_EMAIL,
                password: process.env.NEXT_PUBLIC_FB_PASSWORD,
                returnSecureToken: true,
            }
        );
        const idToken = authResponse.data.idToken;

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
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings.json?auth=${idToken}`,
            newRecordings
        );
        res.status(200);
        res.json({ success: true });
    } catch (error) {
        res.status(500);
        res.json({ success: false, error });
    }
};

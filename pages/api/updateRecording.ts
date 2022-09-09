import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    try {
        const authResponse = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY}`,
            {
                email: process.env.FB_EMAIL,
                password: process.env.FB_PASSWORD,
                returnSecureToken: true,
            }
        );
        const idToken = authResponse.data.idToken;

        await axios.patch(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${req.body.id}.json?auth=${idToken}`,
            req.body
        );
        const metadata = await axios.patch(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordingList/${req.body.id}.json?auth=${idToken}`,
            req.body
        );

        res.status(200);
        res.json(metadata.data);
    } catch (error) {
        res.status(500);
        res.json({ success: false, error });
    }
};

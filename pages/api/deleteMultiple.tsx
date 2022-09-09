import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const removeIds = async (
    location: "recordings" | "recordingList",
    ids: string[],
    idToken: string
) => {
    const currentResponse = await axios(
        `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/${location}.json`
    );
    const filteredRecordings = Object.keys(currentResponse.data).filter(key => {
        return ids.findIndex((k: string) => k === key) === -1;
    });
    const newRecordings: Record<string, any> = {};
    filteredRecordings.forEach(key => {
        newRecordings[key] = currentResponse.data[key];
    });
    await axios.put(
        `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/${location}.json?auth=${idToken}`,
        newRecordings
    );
};

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

        console.log("Removing IDs", req.body.ids);

        //await removeIds("recordings", req.body.ids, idToken);
        await removeIds("recordingList", req.body.ids, idToken);

        res.status(200);
        res.json({ success: true });
    } catch (error) {
        res.status(500);
        res.json({ success: false });
    }
};

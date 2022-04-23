import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { RecordingMetadata, Recording, ExtractRecordingMetadata } from "../../lib/data/types";

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

        const recordings: Recording[] = (
            await axios(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings.json`)
        ).data;

        const recordingStubs: { [key: string]: RecordingMetadata } = {};

        Object.keys(recordings).forEach(key => {
            recordingStubs[key] = ExtractRecordingMetadata(recordings[key]);
        });

        await axios.put(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordingList.json?auth=${idToken}`,
            recordingStubs
        );

        res.status(200);
        res.json({ success: true });
    } catch (error) {
        res.status(500);
        res.json({ success: false, error });
    }
};

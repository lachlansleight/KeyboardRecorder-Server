import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { RecordingMetadata } from "lib/data/types";
import FirebaseUtils from "lib/FirebaseUtils";
import initFirebase from "lib/initFirebase";
import { createMidiFile } from "lib/midi/midiFile";

//This route will upload midi files for any recordings that are missing them.
//This is probably a one-time thing, where I bulk-uploaded files for all the recordings I made before I was creating midi files
export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const recordings: Record<string, RecordingMetadata> = (
        await axios(`${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordingList.json`)
    ).data;
    const missingRecordingKeys: string[] = Object.keys(recordings).filter(
        r => !recordings[r].midiUrl
    );

    const authResponse = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY}`,
        {
            email: process.env.FB_EMAIL,
            password: process.env.FB_PASSWORD,
            returnSecureToken: true,
        }
    );
    const idToken = authResponse.data.idToken;

    for (let i = 0; i < missingRecordingKeys.length; i++) {
        let newUrl = "";
        console.log(
            `[${i + 1}/${missingRecordingKeys.length}]: Creating and uploading midi file for ${
                missingRecordingKeys[i]
            }`
        );
        const recording = (
            await axios(
                `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${missingRecordingKeys[i]}.json`
            )
        ).data;
        try {
            const midi = createMidiFile(recording);
            initFirebase();
            newUrl = await FirebaseUtils.uploadBytes(
                midi,
                `recordings/${missingRecordingKeys[i]}.mid`
            );
        } catch (err: any) {
            console.error(err);
        }

        //duplicate a slightly simplified metadata to the list for displaying in lists
        recordings[missingRecordingKeys[i]].midiUrl = newUrl;
        await axios.put(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordingList/${missingRecordingKeys[i]}.json?auth=${idToken}`,
            recordings[missingRecordingKeys[i]]
        );
    }

    if (missingRecordingKeys.length === 0) {
        res.status(200).json({ message: "no midi files missing!" });
    } else {
        res.status(200).json({ message: "success", rawRecordings: missingRecordingKeys });
    }
};

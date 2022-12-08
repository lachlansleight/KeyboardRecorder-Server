import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { ExtractRecordingMetadata } from "lib/data/types";
import FirebaseUtils from "lib/FirebaseUtils";
import initFirebase from "lib/initFirebase";
import { createMidiFile } from "lib/midi/midiFile";

//This API route will take any recordings that exist in the /recordings path and properly create metadata and MIDI files
//Pretty sure I won't ever need this again, but if the upload process fails during file upload or similar, this will save the recording

//Also, note that as of 8th December, there's a weird situation where I'm kinda using /recordings as a backup
//So if I delete any recordings, this route will effectively un-delete them all, which is not ideal lol
export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const rawRecordings = await axios(
        `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings.json?shallow=true`
    );
    const recordings = await axios(
        `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordingList.json?shallow=true`
    );
    const missingRecordings = Object.keys(rawRecordings.data).filter(
        r => !recordings.data[r] && r !== "undefined"
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

    for (let i = 0; i < missingRecordings.length; i++) {
        let newUrl = "";
        console.log("Fixing up missing recording " + missingRecordings[i]);
        const recording = (
            await axios(
                `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${missingRecordings[i]}.json`
            )
        ).data;
        try {
            const midi = createMidiFile(recording);
            initFirebase();
            newUrl = await FirebaseUtils.uploadBytes(
                midi,
                `recordings/${missingRecordings[i]}.mid`
            );
        } catch (err: any) {
            console.error(err);
        }

        //duplicate a slightly simplified metadata to the list for displaying in lists
        const recordingMetadata = ExtractRecordingMetadata(recording);
        recordingMetadata.midiUrl = newUrl;
        await axios.put(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordingList/${missingRecordings[i]}.json?auth=${idToken}`,
            recordingMetadata
        );
    }

    res.status(200).json({ rawRecordings: missingRecordings });
};

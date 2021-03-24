import RecordingDetail from "../../components/pages/RecordingDetail";
const RecordingPage = ({ recording }: { recording: Recording }): JSX.Element => (
    <RecordingDetail recording={recording} />
);

import { GetServerSidePropsContext } from "next";
import { Recording } from "../../lib/data/types";
import axios from "axios";
export async function getServerSideProps(
    ctx: GetServerSidePropsContext
): Promise<{ props: { recording: Recording } }> {
    let recording: Recording = null;
    try {
        const response = await axios(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${ctx.query.recordingId}.json`
        );
        recording = { ...response.data, id: ctx.query.recordingId };
    } catch (error) {
        console.error(error);
    }

    return {
        props: { recording: recording },
    };
}

export default RecordingPage;

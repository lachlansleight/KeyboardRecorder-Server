import axios from "axios";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { useCallback, useEffect, useState } from "react";
import { Message, Recording } from "lib/data/types";
import Layout from "components/layout/FullscreenLayout";
import usePiano from "lib/piano/usePiano";
import Button from "components/controls/Button";

const RecordingAnalysisPage = ({ recording }: { recording: Recording }): JSX.Element => {

    useEffect(() => {
        //const getVolumeAmount = (message: Message) => {
        //    
        //}
        //const notes: {message: Message, volumeAmount: number} = [];
        //let pedalDown = false;
        //for(let i = 0; i < recording.messages.length; i++) {
        //    
        //}
        //const volumes = recording.messages.map(getVolumeAmount);
    }, [recording]);

   return (
        <Layout>
            
        </Layout>
    );
};

export default RecordingAnalysisPage;

export async function getServerSideProps(
    ctx: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{ recording: Recording }>> {
    try {
        const response = await axios(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${ctx.query.recordingId}.json`
        );
        return {
            props: {
                recording: { ...response.data, id: ctx.query.recordingId },
            },
        };
    } catch (error) {
        return {
            notFound: true,
        };
    }
}

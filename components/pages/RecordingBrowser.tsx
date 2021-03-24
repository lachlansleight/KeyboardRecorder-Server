import { useState, useEffect } from "react";
import Head from "next/head";
import Layout from "../layout/Layout";
import { Recording } from "../../lib/data/types";
import firebase from "firebase/app";
import "firebase/database";

import style from "./RecordingBrowser.module.scss";
import RecordingTile from "../recordings/RecordingTile";

export const RecordingBrowser = (): JSX.Element => {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        firebase
            .database()
            .ref("recordings")
            .on("value", snapshot => {
                //const newRecordingData = {...snapshot.val(), id: snapshot.key};
                setRecordings(
                    Object.keys(snapshot.val())
                        .map(key => ({ ...snapshot.val()[key], id: key }))
                        .sort(
                            (a, b) =>
                                new Date(b.recordedAt).valueOf() - new Date(a.recordedAt).valueOf()
                        )
                );
                setLoading(false);
            });
    }, []);

    return (
        <div>
            <Head>
                <title>Keyboard Recorder</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Layout>
                <h1>Recordings</h1>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className={style.recordingGrid}>
                        {recordings.map(recording => (
                            <RecordingTile
                                key={recording.recordedAt.valueOf()}
                                recording={recording}
                            />
                        ))}
                    </div>
                )}
            </Layout>
        </div>
    );
};

export default RecordingBrowser;

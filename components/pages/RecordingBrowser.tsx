import { useState, useEffect } from "react";
import Head from "next/head";
import Layout from "../layout/Layout";
import { Recording } from "../../lib/data/types";
import firebase from "firebase/app";
import "firebase/database";

import style from "./RecordingBrowser.module.scss";
import RecordingTile from "../recordings/RecordingTile";
import dayjs from "dayjs";

interface RecordingGroup {
    name: string;
    recordings: Recording[];
}

export const RecordingBrowser = (): JSX.Element => {
    const [recordings, setRecordings] = useState<RecordingGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        firebase
            .database()
            .ref("recordings")
            .on("value", snapshot => {
                //const newRecordingData = {...snapshot.val(), id: snapshot.key};
                const sortedRecordings = Object.keys(snapshot.val())
                    .map(key => ({ ...snapshot.val()[key], id: key }))
                    .sort(
                        (a, b) =>
                            new Date(b.recordedAt).valueOf() - new Date(a.recordedAt).valueOf()
                    );
                const todayRecordings = [];
                const thisWeekRecordings = [];
                const thisMonthRecordings = [];
                const monthRecordings = {};
                const yearRecordings = {};
                sortedRecordings.forEach(recording => {
                    const djs = dayjs(recording.recordedAt);
                    if (djs.format("DD/MM/YYYY") === dayjs().format("DD/MM/YYYY")) {
                        todayRecordings.push(recording);
                        return;
                    }
                    if (dayjs().diff(djs, "day") < 7) {
                        thisWeekRecordings.push(recording);
                        return;
                    }
                    if (djs.format("MM/YYYY") === dayjs().format("MM/YYYY")) {
                        thisMonthRecordings.push(recording);
                        return;
                    }
                    if (djs.format("YYYY") === dayjs().format("YYYY")) {
                        if (monthRecordings[djs.format("MMMM")]) {
                            monthRecordings[djs.format("MMMM")].push(recording);
                            return;
                        } else {
                            monthRecordings[djs.format("MMMM")] = [recording];
                        }
                        return;
                    }
                    if (yearRecordings[djs.format("YYYY")]) {
                        yearRecordings[djs.format("YYYY")].push(recording);
                        return;
                    } else {
                        yearRecordings[djs.format("YYYY")] = [recording];
                    }
                });
                const finalGroups: RecordingGroup[] = [];
                if (todayRecordings.length > 0)
                    finalGroups.push({
                        name: "Today",
                        recordings: todayRecordings,
                    });
                if (thisWeekRecordings.length > 0)
                    finalGroups.push({
                        name: "Earlier this week",
                        recordings: thisWeekRecordings,
                    });
                if (thisMonthRecordings.length > 0)
                    finalGroups.push({
                        name: "Earlier this month",
                        recordings: thisMonthRecordings,
                    });
                Object.keys(monthRecordings).forEach(month => {
                    finalGroups.push({
                        name: month,
                        recordings: monthRecordings[month],
                    });
                });
                Object.keys(yearRecordings).forEach(year => {
                    finalGroups.push({
                        name: year,
                        recordings: yearRecordings[year],
                    });
                });
                setRecordings(finalGroups);
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
                    <div>
                        {recordings.map(recordingGroup => {
                            return (
                                <div key={recordingGroup.name} className={style.recordingGrid}>
                                    <h2>{recordingGroup.name}</h2>
                                    <div>
                                        {recordingGroup.recordings.map(recording => {
                                            return (
                                                <RecordingTile
                                                    key={recording.recordedAt.valueOf()}
                                                    recording={recording}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Layout>
        </div>
    );
};

export default RecordingBrowser;

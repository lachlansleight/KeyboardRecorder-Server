import { useState, useEffect } from "react";
import { getDatabase, onValue, ref } from "firebase/database";
import dayjs from "dayjs";
import { FaCheckCircle, FaSync, FaTimesCircle, FaTrash } from "react-icons/fa";
import axios from "axios";
import useAuth from "lib/hooks/useAuth";
import Layout from "components/layout/Layout";
import RecordingTile from "components/recordings/RecordingTile";
import { RecordingMetadata } from "lib/data/types";

interface RecordingGroup {
    name: string;
    recordings: RecordingMetadata[];
}

const HomePage = (): JSX.Element => {
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [recordings, setRecordings] = useState<RecordingGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const db = getDatabase();
        const recordingListRef = ref(db, "recordingList");
        onValue(recordingListRef, snapshot => {
            //const newRecordingData = {...snapshot.val(), id: snapshot.key};
            const sortedRecordings = Object.keys(snapshot.val())
                .map(key => ({ ...snapshot.val()[key], id: key }))
                .sort(
                    (a, b) => new Date(b.recordedAt).valueOf() - new Date(a.recordedAt).valueOf()
                );
            const todayRecordings: RecordingMetadata[] = [];
            const yesterdayRecordings: RecordingMetadata[] = [];
            const thisWeekRecordings: RecordingMetadata[] = [];
            const thisMonthRecordings: RecordingMetadata[] = [];
            const monthRecordings: Record<string, RecordingMetadata[]> = {};
            const yearRecordings: Record<string, RecordingMetadata[]> = {};
            sortedRecordings.forEach(recording => {
                const djs = dayjs(recording.recordedAt);
                if (djs.format("DD/MM/YYYY") === dayjs().format("DD/MM/YYYY")) {
                    todayRecordings.push(recording);
                    return;
                } else if (dayjs().diff(djs, "day") < 1) {
                    yesterdayRecordings.push(recording);
                    return;
                } else if (dayjs().diff(djs, "day") < 7) {
                    thisWeekRecordings.push(recording);
                    return;
                } else if (djs.format("MM/YYYY") === dayjs().format("MM/YYYY")) {
                    thisMonthRecordings.push(recording);
                    return;
                } else if (djs.format("YYYY") === dayjs().format("YYYY")) {
                    if (monthRecordings[djs.format("MMMM")]) {
                        monthRecordings[djs.format("MMMM")].push(recording);
                        return;
                    } else {
                        monthRecordings[djs.format("MMMM")] = [recording];
                    }
                    return;
                } else if (yearRecordings[djs.format("MMMM YYYY")]) {
                    yearRecordings[djs.format("MMMM YYYY")].push(recording);
                    return;
                } else {
                    yearRecordings[djs.format("MMMM YYYY")] = [recording];
                }
            });
            const finalGroups: RecordingGroup[] = [];
            if (todayRecordings.length > 0)
                finalGroups.push({
                    name: "Today",
                    recordings: todayRecordings,
                });
            if (yesterdayRecordings.length > 0)
                finalGroups.push({
                    name: "Yesterday",
                    recordings: yesterdayRecordings,
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

    const handleSelectChanged = (id: string) => {
        if (selected.findIndex(i => i === id) !== -1) setSelected(selected.filter(i => i !== id));
        else setSelected([...selected, id]);
    };

    const deleteSelected = () => {
        const doDelete = async () => {
            setLoading(true);
            const response = await axios.post("/api/deleteMultiple", {
                ids: selected,
            });
            if (response.data.error) {
                console.error(response.data.error);
            }
            setSelecting(false);
            setSelected([]);
        };

        if (!window.confirm(`Really delete ${selected.length} recordings? This CANNOT be undone!`))
            return;
        doDelete();
    };

    return (
        <Layout>
            <div className={``}>
                <div className={``}>
                    <h1 className="text-5xl font-bold">Lachlan&apos;s Piano Recordings</h1>
                    <p className="text-sm italic mt-2">
                        Welcome! This is the playback engine for my MIDI recorder, an ESP32-based
                        electronic device that automatically records and uploads everything I play
                        on my digital piano. You can read all about how I built it on it&apos;s{" "}
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://lachlansleight.io/projects/midi-recorder"
                            className="text-primary-500 underline"
                        >
                            Weeklog project page.
                        </a>
                    </p>
                    <p className="text-sm italic mt-2">
                        This is an almost entirely-unfiltered record of every note played on my
                        piano, build with the intention of my eventually forgetting that it exists
                        and removing &quot;recording anxiety&quot;. Because I don&apos;t spend any
                        time curating these recordings, you shouldn&apos;t expect much quality, and
                        you should expect a lot of repetition. The colours of each tile indicate the
                        proportion of semitones that were played, and the opacity represents the
                        velocities.
                    </p>
                    <p className="text-sm italic mt-2">
                        Click a tile to open the player - space bar pauses and unpauses.
                    </p>
                </div>
                {user ? (
                    <div className={`mt-4 flex items-center gap-4 text-2xl`}>
                        {selecting && (
                            <button
                                className={`${
                                    selected.length === 0
                                        ? "bg-neutral-600 text-neutral-800"
                                        : "bg-neutral-100 text-black"
                                } rounded-full text-black text-xl p-2`}
                                onClick={() => deleteSelected()}
                                disabled={selected.length === 0}
                            >
                                <FaTrash />
                            </button>
                        )}
                        {selecting ? <span>{selected.length}</span> : <span>Select</span>}
                        <button
                            onClick={() => {
                                if (selecting) setSelected([]);
                                setSelecting(!selecting);
                            }}
                            className="text-4xl"
                        >
                            {selecting ? <FaTimesCircle /> : <FaCheckCircle />}
                        </button>
                    </div>
                ) : (
                    <div className={``}></div>
                )}
            </div>
            {loading ? (
                <div className="mt-8 h-36 grid place-items-center">
                    <FaSync className="text-6xl animate-spin" />
                </div>
            ) : (
                <div className="">
                    {recordings.map(recordingGroup => {
                        return (
                            <div key={recordingGroup.name} className="mt-4">
                                <h2 className="text-2xl font-bold">{recordingGroup.name}</h2>
                                <div className="grid md:grid-cols-4 gap-2">
                                    {recordingGroup.recordings.map(recording => {
                                        return (
                                            <RecordingTile
                                                key={recording.recordedAt.valueOf()}
                                                recording={recording}
                                                className={
                                                    selecting
                                                        ? selected.findIndex(
                                                              id => id === recording.id
                                                          ) !== -1
                                                            ? ""
                                                            : ""
                                                        : ""
                                                }
                                                selecting={selecting}
                                                selected={
                                                    selected.findIndex(
                                                        id => id === recording.id
                                                    ) !== -1
                                                }
                                                onSelectChange={handleSelectChanged}
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
    );
};

export default HomePage;

/*
//Leaving this here so that I don't have to keep looking up the syntax...
import { GetServerSidePropsContext } from "next/types";
export async function getServerSideProps(ctx: GetServerSidePropsContext): Promise<{ props: any }> {
    return {
        props: {  },
    };
}
*/

import { useState, useEffect } from "react";
import { getDatabase, onValue, ref } from "firebase/database";
import dayjs from "dayjs";
import { FaCheckCircle, FaSync, FaTimesCircle, FaTrash } from "react-icons/fa";
import axios from "axios";
import useAuth from "lib/hooks/useAuth";
import Layout from "components/layout/Layout";
import RecordingTile from "components/recordings/RecordingTile";
import { Recording, RecordingMetadata } from "lib/data/types";
import RecordingPlayer from "components/recordings/RecordingPlayer";

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
            const val = snapshot.val();
            const sortedRecordings = Object.keys(val)
                .map(key => ({ ...val[key], id: key }))
                .filter(r => r.duration > 10)
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

            const randomChoices: RecordingMetadata[] = [];
            for (let i = 0; i < 8; i++) {
                let choice = sortedRecordings[Math.floor(Math.random() * sortedRecordings.length)];
                while (randomChoices.findIndex(c => c.id === choice.id) !== -1) {
                    choice = sortedRecordings[Math.floor(Math.random() * sortedRecordings.length)];
                }
                randomChoices.push(choice);
            }
            //insert first
            finalGroups.unshift({
                name: "Eight Random Recordings",
                recordings: randomChoices,
            });
            setRecordings(finalGroups);
            console.log(finalGroups);
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

    const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
    const [playing, setPlaying] = useState(false);
    const [clickedStart] = useState(false);
    const [playbackTime, setPlaybackTime] = useState<number | null>(null);

    // const loadAndPlay = useCallback(
    //     async (metadata: RecordingMetadata) => {
    //         if (currentRecording?.id === metadata.id) return;
    //         if (!clickedStart) return;
    //         if (!metadata.id) {
    //             setCurrentRecording(null);
    //             setPlaying(false);
    //             setPlaybackTime(null);
    //             return;
    //         }
    //         const response = await axios(
    //             `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${metadata.id}.json`
    //         );
    //         const recording: Recording = { ...response.data, id: metadata.id };
    //         setCurrentRecording(recording);
    //         setPlaying(true);
    //         setPlaybackTime(0);
    //     },
    //     [currentRecording, clickedStart]
    // );

    return (
        <Layout>
            {clickedStart && (
                <RecordingPlayer
                    recording={currentRecording}
                    playing={playing}
                    paused={false}
                    onPlaybackTimeChanged={setPlaybackTime}
                />
            )}
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
                        piano, built with the intention of my eventually forgetting that it exists
                        and removing &quot;recording anxiety&quot;. 80% of what I play is
                        improvisation, 15% is exercizes and practicing, and 5% is (trying) to write
                        songs.
                    </p>
                    <p className="text-sm italic mt-2">
                        Because I don&apos;t spend any time curating these recordings, you should
                        expect basically every recording to be messy, halting and virtually
                        unlistenable. Walking past and pressing a few keys will result in a
                        recording, for example. Sometimes a recording is the result of me dusting my
                        piano! The colours of each tile indicate the proportion of semitones that
                        were played, and the opacity represents the velocities.
                    </p>
                    <p className="text-sm italic mt-2">
                        Click a tile to open the player - space bar pauses and unpauses. Plus/Minus
                        buttons to zoom in and out.
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
                {/* {!clickedStart && <p className="text-2xl border rounded-lg px-2 py-1 grid place-items-center cursor-pointer" onClick={() => setClickedStart(true)}>Click me to enable hover playback</p>} */}
            </div>
            {loading ? (
                <div className="mt-8 h-36 grid place-items-center">
                    <FaSync className="text-6xl animate-spin" />
                </div>
            ) : (
                <div className="">
                    {recordings.map((recordingGroup, i) => {
                        return (
                            // <p>{recordingGroup.name}</p>
                            <div key={i} className="mt-4">
                                {/* add tooltip: */}
                                <h2
                                    className="text-2xl font-bold text-center"
                                    title={`${(
                                        recordingGroup.recordings.reduce(
                                            (acc, rec) => acc + rec.duration,
                                            0
                                        ) / 3600
                                    ).toFixed(1)} hours across ${
                                        recordingGroup.recordings.length
                                    } recordings`}
                                >
                                    {recordingGroup.name}
                                </h2>
                                <div className="flex flex-wrap justify-center items-center gap-2">
                                    {recordingGroup.recordings.map(recording => {
                                        return (
                                            <RecordingTile
                                                key={recording.recordedAt.valueOf()}
                                                recording={recording}
                                                className={`${
                                                    selecting
                                                        ? selected.findIndex(
                                                              id => id === recording.id
                                                          ) !== -1
                                                            ? ""
                                                            : ""
                                                        : ""
                                                }`}
                                                style={{
                                                    width: `calc(1.5 * ${
                                                        recording.duration / 60
                                                    }rem + 8rem)`,
                                                }}
                                                selecting={selecting}
                                                selected={
                                                    selected.findIndex(
                                                        id => id === recording.id
                                                    ) !== -1
                                                }
                                                onSelectChange={handleSelectChanged}
                                                onMouseEnter={() => {
                                                    // loadAndPlay(recording);
                                                }}
                                                onMouseLeave={() => {
                                                    setCurrentRecording(null);
                                                    setPlaying(false);
                                                }}
                                                playbackTime={
                                                    currentRecording &&
                                                    recording.id === currentRecording.id &&
                                                    playbackTime !== null
                                                        ? playbackTime
                                                        : null
                                                }
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

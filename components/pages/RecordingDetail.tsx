import { useState, useEffect, FormEvent, useRef, useCallback } from "react";
import { useRouter } from "next/router";

import dayjs from "dayjs";
import { FaInfoCircle, FaWindowClose } from "react-icons/fa";

import { Recording } from "../../lib/data/types";
import style from "./RecordingDetail.module.scss";
import FullscreenLayout from "../layout/FullscreenLayout";
import RecordingCanvas from "../recordings/RecordingCanvas";
import axios from "axios";
import useMidi from "../../lib/midi/useMidi";
import StarToggle from "../recordings/StarToggle";
import usePiano from "../../lib/piano/usePiano";

const durationToString = (duration: number): string => {
    let output = "";
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration - hours * 3600) / 60);
    const seconds = duration - minutes * 60 - hours * 3600;
    if (hours > 0) {
        output += hours + ":";
        if (minutes > 10) output += minutes + ":";
        else if (minutes > 0) output += "0" + minutes + ":";
        else output += "00:";
    } else if (minutes > 0) {
        output += minutes + ":";
    } else output += "00:";
    if (seconds >= 10) output += seconds;
    else if (seconds > 0) output += "0" + seconds;
    else output += "00";
    return output;
};

const getNoteName = (pitch: number) => {
    const semitone = pitch % 12;
    const octave = Math.floor((pitch - 12) / 12);
    switch (semitone) {
        case 0:
            return "C" + octave;
        case 1:
            return "C#" + octave;
        case 2:
            return "D" + octave;
        case 3:
            return "D#" + octave;
        case 4:
            return "E" + octave;
        case 5:
            return "F" + octave;
        case 6:
            return "F#" + octave;
        case 7:
            return "G" + octave;
        case 8:
            return "G#" + octave;
        case 9:
            return "A" + octave;
        case 10:
            return "A#" + octave;
        case 11:
            return "B" + octave;
    }
    return "";
};

const RecordingTile = ({ recording }: { recording: Recording }): JSX.Element => {
    const { outputDevice } = useMidi();
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [editingTitle, setEditingTitle] = useState(false);
    const parentRef = useRef<HTMLDivElement>();
    const reqRef = useRef<number>();
    const prevTimeRef = useRef<number>();
    const startTimeRef = useRef<number>();
    const [playbackTime, setPlaybackTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(800);
    const [canvasHeight, setCanvasHeight] = useState(800);
    const infoPanelRef = useRef<HTMLDivElement>();
    const playbackBarRef = useRef<HTMLDivElement>();
    const [firstPlay, setFirstPlay] = useState(false);

    const piano = usePiano();

    useEffect(() => {
        setTitle(recording.title || "");
    }, [recording]);

    useEffect(() => {
        const handleResize = () => {
            if (!parentRef.current) return;
            setCanvasWidth(parentRef.current.offsetWidth);
            setCanvasHeight(parentRef.current.offsetHeight);
        };

        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [parentRef]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setEditingTitle(false);
        await axios.patch(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${recording.id}.json`,
            {
                title,
            }
        );
    };

    const runPlayback = (time: number) => {
        if (!startTimeRef.current) startTimeRef.current = time;

        const deltaTime = (time - (prevTimeRef.current || 0)) / 1000.0;
        const totalTime = (time - startTimeRef.current) / 1000.0;
        setPlaybackTime(totalTime);

        if (recording) {
            const messages = recording.messages.filter(message => {
                return (
                    (message.time < totalTime && message.time > totalTime - deltaTime) ||
                    (totalTime === 0 && message.time === 0)
                );
            });
            messages.forEach(message => {
                if (message.type === "noteOn") {
                    if (outputDevice) {
                        outputDevice.playNote(message.pitch, 1, {
                            velocity: message.velocity / 127.0,
                        });
                    }
                    if (piano && piano.loaded) {
                        piano.keyDown({
                            note: getNoteName(message.pitch),
                            velocity: message.velocity / 127.0,
                        });
                    }
                } else if (message.type === "noteOff") {
                    if (outputDevice) {
                        outputDevice.stopNote(message.pitch, 1);
                    }
                    if (piano && piano.loaded) {
                        piano.keyUp({ note: getNoteName(message.pitch), velocity: 0 });
                    }
                } else if (message.type === "pedalOn") {
                    if (outputDevice) {
                        outputDevice.sendControlChange(64, 0);
                        outputDevice.sendControlChange(64, 127);
                    }
                    if (piano) {
                        piano.pedalUp();
                        piano.pedalDown();
                    }
                } else if (message.type === "pedalOff") {
                    if (outputDevice) {
                        outputDevice.sendControlChange(64, 0);
                    }
                    if (piano) {
                        piano.pedalUp();
                    }
                }
            });
        }

        prevTimeRef.current = time;

        if (totalTime < recording.duration) reqRef.current = requestAnimationFrame(runPlayback);
        else stop();
    };

    const play = useCallback(() => {
        setFirstPlay(true);
        reqRef.current = requestAnimationFrame(runPlayback);
        setIsPlaying(true);
    }, [outputDevice]);

    const stop = () => {
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
        startTimeRef.current = 0;
        prevTimeRef.current = 0;
        setIsPlaying(false);
        setPlaybackTime(0);

        //also turn off all the MIDI notes and the pedal
        if (outputDevice) {
            outputDevice.sendControlChange(64, 0);
            for (let i = 0; i <= 127; i++) {
                outputDevice.stopNote(i, 1);
            }
        }
        if (piano) {
            piano.pedalUp();
            piano.stopAll();
        }
    };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === " ") {
                if (isPlaying) stop();
                else play();
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [outputDevice, isPlaying]);

    useEffect(() => {
        return () => stop();
    }, []);

    useEffect(() => {
        if (!playbackBarRef.current) return;

        if (!isPlaying || playbackTime === 0)
            playbackBarRef.current.style.setProperty("width", "0%");
        else
            playbackBarRef.current.style.setProperty(
                "width",
                (100 * playbackTime) / recording.duration + "%"
            );
    }, [isPlaying, playbackTime, playbackBarRef]);

    const deleteRecording = async () => {
        if (!window.confirm("Really delete recording? This CANNOT be undone!")) return;

        await axios.delete(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${recording.id}.json`
        );
        router.push("/");
    };

    const showInfoPanel = () => {
        if (!infoPanelRef.current) return;
        infoPanelRef.current.style.setProperty("right", "0px");
    };
    const hideInfoPanel = () => {
        if (!infoPanelRef.current) return;
        infoPanelRef.current.style.setProperty("right", "-24rem");
    };

    return (
        <FullscreenLayout>
            <div className={style.recording} ref={parentRef}>
                {editingTitle ? (
                    <form onSubmit={handleSubmit} className={style.editTitleForm}>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setTitle(e.target.value)
                            }
                            onBlur={() => {
                                setTitle("");
                                setEditingTitle(false);
                            }}
                            placeholder="Enter new title"
                            autoComplete="off"
                        />
                    </form>
                ) : (
                    <h1
                        className={isPlaying ? style.playing : null}
                        onClick={() => setEditingTitle(true)}
                    >
                        {title || dayjs(recording.recordedAt).format("D MMM YYYY - h:mm A")}
                    </h1>
                )}

                <button className={style.infoButton} onClick={showInfoPanel}>
                    <FaInfoCircle />
                </button>
                <StarToggle className={style.starButton} recording={recording} />
                <div className={style.infoPanel} ref={infoPanelRef}>
                    <h2>Recording Metadata</h2>
                    <div className={style.infoButton} onClick={hideInfoPanel}>
                        <FaWindowClose />
                    </div>
                    <div>
                        <label>Record Time</label>
                        <p>{dayjs(recording.recordedAt).format("h:mm a")}</p>
                    </div>
                    <div>
                        <label>Record Date</label>
                        <p>{dayjs(recording.recordedAt).format("DD MMMM YYYY")}</p>
                    </div>
                    <div>
                        <label>Duration</label>
                        <p>{durationToString(Math.round(recording.duration))}</p>
                    </div>
                    <div>
                        <label>Message Count</label>
                        <p>{recording.messageCount}</p>
                    </div>
                    <div>
                        <label>Average Velocity</label>
                        <p>{Math.round(recording.averageVelocity)}</p>
                    </div>
                    <div>
                        <label>Velocity Spread</label>
                        <p>{Math.round(recording.velocitySpread)}</p>
                    </div>
                    <button className={style.deleteButton} onClick={() => deleteRecording()}>
                        Delete Recording
                    </button>
                </div>

                <RecordingCanvas
                    recording={recording}
                    width={canvasWidth}
                    height={canvasHeight}
                    playbackTime={playbackTime}
                    displayDuration={10}
                    onClick={() => {
                        if (isPlaying) stop();
                        else play();
                    }}
                />
                <div className={style.playbackBar} ref={playbackBarRef}></div>

                <div className={style.firstPlay} style={firstPlay ? { opacity: 0 } : null}>
                    <p>Press space or tap the screen to play and stop</p>
                </div>
            </div>
        </FullscreenLayout>
    );
};

export default RecordingTile;

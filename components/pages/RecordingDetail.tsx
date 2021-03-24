import { useState, useEffect, FormEvent, useRef, useCallback } from "react";

import dayjs from "dayjs";

import { Recording } from "../../lib/data/types";
import style from "./RecordingDetail.module.scss";
import Layout from "../layout/Layout";
import RecordingCanvas from "../recordings/RecordingCanvas";
import axios from "axios";
import useMidi from "../../lib/midi/useMidi";

const RecordingTile = ({ recording }: { recording: Recording }): JSX.Element => {
    const { outputDevice } = useMidi();

    const [title, setTitle] = useState("");
    const [editingTitle, setEditingTitle] = useState(false);
    const parentRef = useRef<HTMLDivElement>();
    const reqRef = useRef<number>();
    const prevTimeRef = useRef<number>();
    const startTimeRef = useRef<number>();
    const [playbackTime, setPlaybackTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        setTitle(recording.title || "");
    }, [recording]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setEditingTitle(false);
        await axios.patch(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/${recording.id}.json`,
            { title }
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
            if (outputDevice) {
                messages.forEach(message => {
                    if (message.type === "noteOn") {
                        outputDevice.playNote(message.pitch, 1, {
                            velocity: message.velocity / 127.0,
                        });
                    } else if (message.type === "noteOff") {
                        outputDevice.stopNote(message.pitch, 1);
                    } else if (message.type === "pedalOn") {
                        outputDevice.sendControlChange(64, 0);
                        outputDevice.sendControlChange(64, 127);
                        console.log("pedal on");
                    } else if (message.type === "pedalOff") {
                        outputDevice.sendControlChange(64, 0);
                        console.log("pedal off");
                    }
                });
            }
        }

        prevTimeRef.current = time;

        if (totalTime < recording.duration) reqRef.current = requestAnimationFrame(runPlayback);
        else stop();
    };

    const play = useCallback(() => {
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
        outputDevice.sendControlChange(64, 0);
        for (let i = 0; i <= 127; i++) {
            outputDevice.stopNote(i, 1);
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

    return (
        <Layout>
            <div className={style.recording} ref={parentRef}>
                {editingTitle ? (
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setTitle(e.target.value)
                            }
                        />
                    </form>
                ) : (
                    <h1 onClick={() => setEditingTitle(true)}>
                        {title || dayjs(recording.recordedAt).format("D MMM YYYY - h:mm A")}
                    </h1>
                )}
                <RecordingCanvas
                    recording={recording}
                    width={!parentRef.current ? 800 : parentRef.current.offsetWidth}
                    height={!parentRef.current ? 600 : parentRef.current.offsetHeight}
                    playbackTime={playbackTime}
                    displayDuration={10}
                />
            </div>
        </Layout>
    );
};

export default RecordingTile;

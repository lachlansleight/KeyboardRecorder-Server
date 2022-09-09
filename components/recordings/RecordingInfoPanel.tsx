import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useRouter } from "next/router";

import dayjs from "dayjs";
import axios from "axios";
import { FaWindowClose } from "react-icons/fa";
import ReactMarkdown from "react-markdown";

import { Recording } from "lib/data/types";

import useAuth from "lib/hooks/useAuth";
import { createMidiFile } from "lib/midi/midiFile";
import useElementDimensions from "lib/hooks/useElementDimensions";

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

const RecordingInfoPanel = ({
    recording,
    showing,
    onCloseClicked,
}: {
    recording: Recording;
    showing?: boolean;
    onCloseClicked?: () => void;
}): JSX.Element => {
    const router = useRouter();
    const { user } = useAuth();

    const [note, setNote] = useState("");
    const [editingNote, setEditingNote] = useState(false);

    const divRef = useRef<HTMLDivElement>(null);
    const { width } = useElementDimensions(divRef);

    const deleteRecording = async () => {
        if (!window.confirm("Really delete recording? This CANNOT be undone!")) return;

        await axios.post("/api/delete", {
            id: recording.id
        });
        router.push("/");
    };

    const handleCloseClicked = () => {
        if (!onCloseClicked) return;
        onCloseClicked();
    };

    useEffect(() => {
        if (!recording) return;
        setNote(recording.note || "");
    }, [recording]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setNote(e.target.value);
    };

    const finishEditingNote = () => {
        const applyNote = async () => {
            await axios.post("/api/updateRecording", {
                id: recording.id,
                note
            });
        };

        setEditingNote(false);
        applyNote();
    };

    const [midiUrl, setMidiUrl] = useState("");
    useEffect(() => {
        setTimeout(() => {
            const data = createMidiFile(recording);
            setMidiUrl(URL.createObjectURL(new Blob([data], { type: "audio/midi" })));
        }, 1000);
    }, [recording]);

    return (
        <div
            className={`fixed z-10 bg-neutral-900 border-l border-white border-opacity-20 flex flex-col justify-between min-h-main px-4 py-8 transition-all top-14`}
            ref={divRef}
            style={{ right: showing ? "0px" : `-${width}px` }}
        >
            <div>
                <div className="flex justify-between gap-4 items-center">
                    <h2 className="text-3xl">Recording Metadata</h2>
                    <button className={`text-4xl`} onClick={handleCloseClicked}>
                        <FaWindowClose />
                    </button>
                </div>
                <div className={`flex flex-col gap-2 mt-4`}>
                    <div className="flex gap-4">
                        <label className="font-bold w-36 text-right">Record Time</label>
                        <p>{dayjs(recording.recordedAt).format("h:mm a")}</p>
                    </div>
                    <div className="flex gap-4">
                        <label className="font-bold w-36 text-right">Record Date</label>
                        <p>{dayjs(recording.recordedAt).format("DD MMMM YYYY")}</p>
                    </div>
                    <div className="flex gap-4">
                        <label className="font-bold w-36 text-right">Duration</label>
                        <p>{durationToString(Math.round(recording.duration))}</p>
                    </div>
                    <div className="flex gap-4">
                        <label className="font-bold w-36 text-right">Message Count</label>
                        <p>{recording.messageCount}</p>
                    </div>
                    <div className="flex gap-4">
                        <label className="font-bold w-36 text-right">Average Velocity</label>
                        <p>{Math.round(recording.averageVelocity)}</p>
                    </div>
                    <div className="flex gap-4">
                        <label className="font-bold w-36 text-right">Velocity Spread</label>
                        <p>{Math.round(recording.velocitySpread)}</p>
                    </div>
                    <div className="flex gap-4">
                        <label className="font-bold w-36 text-right">Note</label>
                        {editingNote ? (
                            <div className="flex flex-col items-start gap-2">
                                <textarea
                                    id="note"
                                    value={note}
                                    onChange={handleChange}
                                    onBlur={finishEditingNote}
                                    className="bg-neutral-800 resize-none rounded text-white"
                                ></textarea>
                                <button
                                    className="rounded bg-neutral-700 px-1"
                                    onClick={finishEditingNote}
                                >
                                    Set Note
                                </button>
                            </div>
                        ) : (
                            <div onClick={user ? () => setEditingNote(true) : undefined}>
                                <ReactMarkdown>
                                    {note || (user ? "Click to enter a note" : "")}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <a
                    href={midiUrl}
                    download={`${recording.id}.mid`}
                    className="bg-primary-800 text-center rounded"
                >
                    Download MIDI
                </a>
                {user ? (
                    <button
                        className={`bg-red-800 rounded text-md`}
                        onClick={() => deleteRecording()}
                    >
                        Delete Recording
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default RecordingInfoPanel;

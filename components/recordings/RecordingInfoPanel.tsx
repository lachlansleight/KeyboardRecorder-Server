import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/router";

import dayjs from "dayjs";
import axios from "axios";
import { FaWindowClose } from "react-icons/fa";
import ReactMarkdown from "react-markdown";

import { Recording } from "../../lib/data/types";

import style from "./RecordingInfoPanel.module.scss";
import useAuth from "lib/auth/useAuth";

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

    const deleteRecording = async () => {
        if (!window.confirm("Really delete recording? This CANNOT be undone!")) return;

        await axios.delete(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${recording.id}.json`
        );
        router.push("/");
    };

    const handleCloseClicked = () => {
        if (!onCloseClicked) return;
        onCloseClicked();
    };

    useEffect(() => {
        if (!recording) return;
        setNote(recording.note);
    }, [recording]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setNote(e.target.value);
    };

    const finishEditingNote = () => {
        const applyNote = async () => {
            await axios.patch(
                `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${recording.id}.json`,
                {
                    note,
                }
            );
        };

        setEditingNote(false);
        applyNote();
    };

    return (
        <div className={style.infoPanel} style={showing ? { right: "0px" } : null}>
            <h2>Recording Metadata</h2>
            <div className={style.closeButton} onClick={handleCloseClicked}>
                <FaWindowClose />
            </div>
            <div className={style.infoPanelInner}>
                <div>
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
                    <div className={style.note}>
                        <label>Note</label>
                        {editingNote ? (
                            <div>
                                <textarea
                                    id="note"
                                    value={note}
                                    onChange={handleChange}
                                    onBlur={finishEditingNote}
                                ></textarea>
                                <button onClick={finishEditingNote}>Set Note</button>
                            </div>
                        ) : (
                            <div onClick={user ? () => setEditingNote(true) : null}>
                                <ReactMarkdown
                                    source={note || (user ? "Click to enter a note" : "")}
                                />
                            </div>
                        )}
                    </div>
                </div>
                {user ? (
                    <button className={style.deleteButton} onClick={() => deleteRecording()}>
                        Delete Recording
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default RecordingInfoPanel;

import { useState, useEffect, FormEvent } from "react";

import dayjs from "dayjs";

import { Recording } from "../../lib/data/types";
import axios from "axios";

const RecordingTitle = ({
    recording,
    className,
}: {
    recording: Recording;
    className?: string;
}): JSX.Element => {
    const [editingTitle, setEditingTitle] = useState(false);
    const [title, setTitle] = useState("");

    useEffect(() => {
        if (!recording) return;
        setTitle(recording.title || "");
    }, [recording]);

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

    return (
        <div className={className || null}>
            {editingTitle ? (
                <form onSubmit={handleSubmit}>
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
                <h1 onClick={() => setEditingTitle(true)}>
                    {title || dayjs(recording.recordedAt).format("D MMM YYYY - h:mm A")}
                </h1>
            )}
        </div>
    );
};

export default RecordingTitle;

import { useState, useEffect, FormEvent } from "react";

import dayjs from "dayjs";

import axios from "axios";
import { Recording } from "lib/data/types";
import useAuth from "lib/hooks/useAuth";

const RecordingTitle = ({
    recording,
    className,
}: {
    recording: Recording;
    className?: string;
}): JSX.Element => {
    const [editingTitle, setEditingTitle] = useState(false);
    const [title, setTitle] = useState("");
    const { user } = useAuth();

    useEffect(() => {
        if (!recording) return;
        setTitle(recording.title || "");
    }, [recording]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setEditingTitle(false);
        await axios.post("/api/updateRecording", {
            id: recording.id,
            title
        });
    };

    return (
        <div
            className={className || ""}
            style={{
                transition: "opacity 5s",
            }}
        >
            {editingTitle ? (
                <form onSubmit={handleSubmit} className="relative -top-2">
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTitle(e.target.value)
                        }
                        onBlur={() => {
                            setTitle(recording.title || "");
                            setEditingTitle(false);
                        }}
                        placeholder="Enter new title"
                        autoComplete="off"
                        className="bg-transparent text-white outline-none p-0 m-0 text-center"
                    />
                </form>
            ) : (
                <h1 onClick={user ? () => setEditingTitle(true) : undefined}>
                    {title || dayjs(recording.recordedAt).format("D MMM YYYY - h:mm A")}
                </h1>
            )}
        </div>
    );
};

export default RecordingTitle;

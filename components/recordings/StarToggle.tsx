import axios from "axios";
import { useState, useEffect, useMemo } from "react";
import { FaStar, FaRegStar, FaSync } from "react-icons/fa";
import useAuth from "lib/hooks/useAuth";
import { RecordingMetadata } from "../../lib/data/types";

const StarToggle = ({
    className,
    recording,
    needsHover,
    onChange,
}: {
    className?: string;
    recording: RecordingMetadata;
    needsHover?: boolean;
    onChange?: (starred: boolean) => void;
}): JSX.Element => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [starred, setStarred] = useState(false);

    useEffect(() => {
        if (!recording) return;
        setStarred(recording.starred || false);
    }, [recording]);

    const toggleStar = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        const doToggle = async () => {
            setLoading(true);
            const result = await axios.post("/api/updateRecording", {
                id: recording.id,
                starred: !starred
            });
            setStarred(result.data.starred);
            if (onChange) onChange(result.data.starred);
            setLoading(false);
        };

        doToggle();
    };

    const buttonClass = useMemo(() => {
        let c = "transition-all";
        if (starred) {
            c += " text-yellow-500";
            c += " opacity-100";
            c += " hover:text-white";
        } else {
            if (needsHover) c += " opacity-0";
            else c += " opacity-50";
            if (user) {
                if (needsHover) c += " group-hover:opacity-50";
                c += " hover:!opacity-100";
            }
        }

        return c;
    }, [starred, user]);

    return (
        <button
            className={`${buttonClass} ${className || ""}`}
            onClick={toggleStar}
            disabled={loading || !user}
        >
            {loading ? <FaSync className="animate-spin" /> : starred ? <FaStar /> : <FaRegStar />}
        </button>
    );
};

export default StarToggle;

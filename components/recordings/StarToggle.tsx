import axios from "axios";
import useAuth from "lib/auth/useAuth";
import { useState, useEffect } from "react";
import { FaStar, FaRegStar, FaCircle } from "react-icons/fa";
import { Recording } from "../../lib/data/types";

const StarToggle = ({
    className,
    recording,
    onChange,
}: {
    className?: string;
    recording: Recording;
    onChange?: (starred: boolean) => void;
}): JSX.Element => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [starred, setStarred] = useState(false);

    useEffect(() => {
        if (!recording) return;
        setStarred(recording.starred || false);
    }, [recording]);

    const toggleStar = () => {
        const doToggle = async () => {
            setLoading(true);
            const result = await axios.patch(
                `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${recording.id}.json`,
                { starred: !starred }
            );
            console.log(result.data);
            setStarred(result.data.starred);
            if (onChange) onChange(result.data.starred);
            setLoading(false);
        };

        doToggle();
    };

    return (
        <button
            className={className}
            onClick={toggleStar}
            disabled={loading || !user}
            style={starred ? { color: "var(--color-yellow-600)" } : user ? null : { opacity: 0 }}
        >
            {loading ? <FaCircle /> : starred ? <FaStar /> : <FaRegStar />}
        </button>
    );
};

export default StarToggle;

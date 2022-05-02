import { useState, useEffect } from "react";

import dayjs from "dayjs";
import { FaCheckCircle, FaRegCircle } from "react-icons/fa";

import { RecordingMetadata } from "../../lib/data/types";
import style from "./RecordingTile.module.scss";
import Link from "next/link";
import { semitoneToHue } from "../../lib/utils";
import StarToggle from "./StarToggle";

interface GradientSemitone {
    semitone: number;
    proportion: number;
    hue: number;
}

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

const RecordingTile = ({
    recording,
    className,
    selecting,
    selected,
    onSelectChange,
}: {
    recording: RecordingMetadata;
    className?: string;
    selecting?: boolean;
    selected?: boolean;
    onSelectChange?: (id: string) => void;
}): JSX.Element => {
    const [gradient, setGradient] = useState("");

    const [mainClass, setMainClass] = useState(style.recordingTile);
    const [starred, setStarred] = useState(recording.starred);

    useEffect(() => {
        if (!recording) return;

        const newSemitones: GradientSemitone[] = recording.semitones
            .map((t, index) => {
                return {
                    semitone: index,
                    proportion: t,
                    hue: semitoneToHue(index),
                };
            })
            .filter(t => t.proportion > 0);

        let sortedSemitones = [...newSemitones];
        sortedSemitones.sort((a, b) => a.proportion - b.proportion);
        sortedSemitones = sortedSemitones.reverse().slice(0, 5).reverse();

        const proportionSum = sortedSemitones.reduce((acc, item) => acc + item.proportion, 0);

        const mainHue = sortedSemitones.slice(-1)[0].hue;
        const usefulSemitones = sortedSemitones
            .sort((a, b) => Math.abs(b.hue + 360 - mainHue) - Math.abs(a.hue + 360 - mainHue))
            .map(semi => ({
                ...semi,
                proportion: Math.round((100 * semi.proportion) / proportionSum),
            }));

        let totalProp = 0;
        let minAlpha = recording.averageVelocity - recording.velocitySpread;
        let maxAlpha = recording.averageVelocity + recording.velocitySpread;
        const offset = 40;
        minAlpha += offset;
        maxAlpha += offset;

        const keys = usefulSemitones.map((semi, index) => {
            const alpha = Math.min(1, Math.max(0, (minAlpha + (index / usefulSemitones.length) * (maxAlpha - minAlpha)) * 0.01));
            const key =
                index === 0
                    ? `hsla(${semi.hue}, 100%, 30%, ${alpha}) 0%`
                    : `hsla(${semi.hue}, 100%, 30%, ${alpha}) ${totalProp}%`;
            totalProp += usefulSemitones[index].proportion;
            return key;
        });
        setGradient(`linear-gradient(90deg, ${keys.join(", ")})`);
    }, [recording]);

    useEffect(() => {
        setMainClass(starred ? `${style.recordingTile} ${style.isStarred}` : style.recordingTile);
    }, [starred]);

    return (
        <div
            className={`${mainClass} ${className ? className : ""}`}
            style={{ background: gradient }}
        >
            {selecting ? (
                <div
                    onClick={() => {
                        if (onSelectChange) onSelectChange(recording.id);
                    }}
                >
                    <p>
                        {recording.title ||
                            dayjs(recording.recordedAt).format("D MMM YYYY - h:mm A")}
                    </p>
                    <p className={style.duration}>
                        {durationToString(Math.round(recording.duration))}
                    </p>
                </div>
            ) : (
                <Link href={`/recording/${recording.id}`}>
                    <a>
                        <p>
                            {recording.title ||
                                dayjs(recording.recordedAt).format("D MMM YYYY - h:mm A")}
                        </p>
                        <p className={style.duration}>
                            {durationToString(Math.round(recording.duration))}
                        </p>
                    </a>
                </Link>
            )}
            {selecting ? (
                selected ? (
                    <FaCheckCircle className={style.selectionIndicator} />
                ) : (
                    <FaRegCircle className={style.selectionIndicator} />
                )
            ) : (
                <StarToggle
                    recording={recording}
                    onChange={(starred: boolean) => setStarred(starred)}
                />
            )}
        </div>
    );
};

export default RecordingTile;

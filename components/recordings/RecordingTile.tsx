import { useState, useEffect } from "react";

import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { FaCheckCircle, FaRegCircle } from "react-icons/fa";
import { useRouter } from "next/router";

import { RecordingMetadata } from "../../lib/data/types";
import { semitoneToHue } from "../../lib/utils";
import StarToggle from "./StarToggle";

dayjs.extend(advancedFormat);

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
    const router = useRouter();

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
            const alpha = Math.min(
                1,
                Math.max(
                    0,
                    (minAlpha + (index / usefulSemitones.length) * (maxAlpha - minAlpha)) * 0.01
                )
            );
            const key: string =
                index === 0
                    ? `hsla(${semi.hue}, 100%, 30%, ${alpha}) 0%`
                    : `hsla(${semi.hue}, 100%, 30%, ${alpha}) ${totalProp}%`;
            totalProp += usefulSemitones[index].proportion;
            return key;
        });
        setGradient(`linear-gradient(90deg, ${keys.join(", ")})`);
    }, [recording]);

    return (
        <div
            className={`select-none cursor-pointer noselect group flex justify-between h-12 rounded relative px-4 border-2 border-white border-opacity-0 hover:border-opacity-50 transition-all text-shadow-md ${
                className ? className : ""
            }`}
            style={{
                backgroundImage: gradient,
                backgroundRepeat: "no-repeat",
                backgroundOrigin: "border-box",
            }}
            onClick={() => {
                if (!selecting) {
                    router.push(`/recording/${recording.id}`);
                } else {
                    if (onSelectChange && selecting) onSelectChange(recording.id || "");
                }
            }}
        >
            <div className="flex flex-col justify-center">
                <p className="text-sm font-bold">
                    {recording.title || dayjs(recording.recordedAt).format("Do MMM YYYY - h:mm A")}
                </p>
                <p className="text-xs">{durationToString(Math.round(recording.duration))}</p>
            </div>
            <div
                className="text-2xl h-full grid place-items-center"
                style={{
                    filter: "drop-shadow(3px 3px 2px rgb(0 0 0 / 50%))",
                }}
            >
                {selecting ? (
                    selected ? (
                        <FaCheckCircle className={""} />
                    ) : (
                        <FaRegCircle className={""} />
                    )
                ) : (
                    <StarToggle recording={recording} needsHover={true} />
                )}
            </div>
        </div>
    );
};

export default RecordingTile;

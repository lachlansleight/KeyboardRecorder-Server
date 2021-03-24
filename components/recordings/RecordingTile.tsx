import { useState, useEffect } from "react";

import dayjs from "dayjs";

import { Recording } from "../../lib/data/types";
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

const RecordingTile = ({ recording }: { recording: Recording }): JSX.Element => {
    const [gradient, setGradient] = useState("");

    const [mainClass, setMainClass] = useState(style.recordingTile);
    const [starred, setStarred] = useState(recording.starred);

    useEffect(() => {
        if (!recording) return;

        const newSemitones: GradientSemitone[] = recording.semitones
            .map((t, index) => {
                return {
                    semitone: index,
                    proportion: Math.round(t * 100),
                    hue: semitoneToHue(index),
                };
            })
            .filter(t => t.proportion > 0)
            .sort((a, b) => a.proportion - b.proportion);

        const mainHue = newSemitones.slice(-1)[0].hue;
        const usefulSemitones = newSemitones.sort(
            (a, b) => Math.abs(b.hue + 360 - mainHue) - Math.abs(a.hue + 360 - mainHue)
        );

        let totalProp = 0;
        const keys = usefulSemitones.map((semi, index) => {
            const key =
                index === 0
                    ? `hsl(${semi.hue}, 100%, 30%) 0%`
                    : `hsl(${semi.hue}, 100%, 30%) ${totalProp}%`;
            if (index > 0) totalProp += usefulSemitones[index - 1].proportion;
            return key;
        });
        setGradient(`linear-gradient(90deg, ${keys.join(", ")})`);
    }, [recording]);

    useEffect(() => {
        setMainClass(starred ? `${style.recordingTile} ${style.isStarred}` : style.recordingTile);
    }, [starred]);

    return (
        <div className={mainClass} style={{ background: gradient }}>
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
            <StarToggle
                recording={recording}
                onChange={(starred: boolean) => setStarred(starred)}
            />
        </div>
    );
};

export default RecordingTile;

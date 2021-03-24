import { useState, useEffect } from "react";

import dayjs from "dayjs";
import { FaStar, FaRegStar } from "react-icons/fa";

import { Recording } from "../../lib/data/types";
import style from "./RecordingTile.module.scss";
import Link from "next/link";
import { semitoneToHue } from "../../lib/utils";

interface GradientSemitone {
    semitone: number;
    proportion: number;
    hue: number;
}

const RecordingTile = ({ recording }: { recording: Recording }): JSX.Element => {
    const [gradient, setGradient] = useState("");
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
        //console.log(`linear-gradient(90deg, ${keys.join(", ")})`)
        setGradient(`linear-gradient(90deg, ${keys.join(", ")})`);
    }, [recording]);

    return (
        <div className={style.recordingTile} style={{ background: gradient }}>
            <Link href={`/recording/${recording.id}`}>
                <a>
                    <p>
                        {recording.title ||
                            dayjs(recording.recordedAt).format("D MMM YYYY - h:mm A")}
                    </p>
                </a>
            </Link>
            <button>{recording.starred ? <FaStar /> : <FaRegStar />}</button>
        </div>
    );
};

export default RecordingTile;

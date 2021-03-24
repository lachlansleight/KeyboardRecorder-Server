import { useState, useEffect, useRef } from "react";
import { Recording } from "../../lib/data/types";
import { isBlackKey, semitoneToHue } from "../../lib/utils";

interface Note {
    pitch: number;
    velocity: number;
    onTime: number;
    offTime?: number;
}

const RecordingCanvas = ({
    recording,
    width,
    height,
    playbackTime,
    displayDuration,
}: {
    recording: Recording;
    width: number;
    height: number;
    playbackTime?: number;
    displayDuration?: number;
}): JSX.Element => {
    const canvasRef = useRef<HTMLCanvasElement>();

    const [notes, setNotes] = useState<Note[]>([]);
    const [duration, setDuration] = useState(1);

    useEffect(() => {
        const notes: Note[] = [];
        let activeNotes: Note[] = [];
        let lastTime = 0;
        recording.messages.forEach(message => {
            if (message.type == "noteOn") {
                const currentNote = activeNotes.find(note => note.pitch === message.pitch);
                if (currentNote) {
                    //uh oh there was already a note playing! Set its off time to now, add it to the list, and remove it
                    console.error("Found a note on where a note was already playing...");
                    currentNote.offTime = message.time;
                    notes.push(currentNote);
                    activeNotes = activeNotes.filter(n => n.pitch !== message.pitch);
                }
                activeNotes.push({
                    pitch: message.pitch,
                    velocity: message.velocity,
                    onTime: message.time,
                });
            } else if (message.type === "noteOff") {
                const currentNote = activeNotes.find(note => note.pitch === message.pitch);
                if (!currentNote) {
                    //uh oh where's the start note!?
                    console.error("Found a note off where there was no note already playing...");
                } else {
                    currentNote.offTime = message.time;
                    notes.push(currentNote);
                    activeNotes = activeNotes.filter(n => n.pitch !== message.pitch);
                }
            }
            lastTime = message.time;
        });

        //add the stragglers, if there are any
        activeNotes.forEach(note => {
            note.offTime = lastTime;
            notes.push(note);
        });

        setNotes(notes);
        setDuration(lastTime);
    }, [recording]);

    useEffect(() => {
        const noteWidth = width / 88;
        const getNoteX = (note: number) => width * ((note - 20.5) / 89) + noteWidth * 0.5;
        const getTimeY = (time: number) =>
            height - 20 - (height - 20) * ((time - playbackTime) / (displayDuration || duration));

        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, width, height);

        const playingNotes: { active: boolean; time: number; progress: number }[] = [];
        for (let i = 0; i < 128; i++) playingNotes.push({ active: false, time: 0, progress: 0 });

        notes.forEach(note => {
            const x = getNoteX(note.pitch);
            const y1 = getTimeY(note.onTime);
            const y2 = getTimeY(note.offTime || note.onTime);
            let l = 50;
            let s = 50 + note.velocity / 2.54;
            const notePlaying =
                playbackTime && playbackTime > note.onTime && playbackTime < note.offTime;
            const noteProgress = !notePlaying
                ? 0
                : (playbackTime - note.onTime) / (note.offTime - note.onTime);
            if (notePlaying) {
                playingNotes[note.pitch] = {
                    active: true,
                    time: playbackTime - note.onTime,
                    progress: noteProgress,
                };
                l = 90 - 40 * Math.min(1, playingNotes[note.pitch].time * 2);
                s = 100;
            }
            ctx.fillStyle = `hsl(${semitoneToHue(note.pitch % 12)}, ${s}%, ${l}%)`;
            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x + noteWidth, y1);
            ctx.quadraticCurveTo(
                x + noteWidth * 0.5,
                y1 + (y2 - y1) * 0.5,
                x + noteWidth * 0.5,
                y2
            );
            ctx.quadraticCurveTo(x + noteWidth * 0.5, y1 + (y2 - y1) * 0.5, x, y1);
            ctx.fill();
            //ctx.fillRect(x, y1, noteWidth, y2 - y1);
        });

        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, height - 20, width, 20);
        for (let i = 21; i <= 109; i++) {
            const x = getNoteX(i);
            const hue = semitoneToHue(i % 12);
            const playingValue = Math.max(playingNotes[i].time, playingNotes[i].progress);

            const isBlack = isBlackKey(i);
            if (isBlack) {
                ctx.fillStyle = playingNotes[i].active ? `hsl(${hue}, 100%, 50%)` : "#111";
                ctx.fillRect(x, height - 20, noteWidth, 20);
            } else {
                if (playingNotes[i].active) {
                    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                    ctx.fillRect(x, height - 20, noteWidth, 20);
                } else {
                    ctx.strokeStyle = "#111";
                    ctx.strokeRect(x, height - 20, noteWidth, 20);
                }
            }

            if (!playingNotes[i].active) continue;
            const gradient = ctx.createLinearGradient(x, height - 140, x, height - 20);
            gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, ${1.0 - playingValue})`);
            gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - 140, noteWidth, 120);
        }

        //proper key widths - but needs to be replicated for the actual notes...
        // ctx.fillStyle = "#FFF";
        // ctx.fillRect(0, height - 20, width, 20);
        // let xPos = noteWidth * 0.5;
        // let lastWasBlack = false;
        // for(let i = 21; i <= 109; i++) {
        //     const isBlack = isBlackKey(i);
        //     if(isBlack) {
        //         ctx.fillStyle ="#111";
        //         ctx.fillRect(xPos + noteWidth / 6, height - 20, noteWidth / 1.5, 10);
        //         lastWasBlack = true;
        //     } else {
        //         if(!lastWasBlack) xPos += noteWidth * 0.5;
        //         ctx.strokeStyle = "#111";
        //         ctx.strokeRect(xPos, height - 20, noteWidth, 20);
        //         lastWasBlack = false;
        //     }
        //     xPos += noteWidth * 0.5;
        // }

        // if(playbackTime) {
        //     ctx.strokeStyle = "#FFF";
        //     ctx.beginPath();
        //     const y = getTimeY(playbackTime);
        //     ctx.moveTo(0, y);
        //     ctx.lineTo(width, y);
        //     ctx.stroke();
        // }
    }, [canvasRef, notes, duration, width, height, playbackTime, displayDuration]);

    return <canvas ref={canvasRef} width={width} height={height}></canvas>;
};

export default RecordingCanvas;

import { useState, useRef, useCallback, useEffect, useMemo } from "react";

import useMidi from "../../lib/midi/useMidi";
import usePiano from "../../lib/piano/usePiano";
import { Message, Recording } from "../../lib/data/types";

//turns a MIDI pitch into a note name (e.g. 61 => C#4)
const getNoteName = (pitch: number) => {
    const semitone = pitch % 12;
    const octave = Math.floor((pitch - 12) / 12);
    switch (semitone) {
        case 0:
            return "C" + octave;
        case 1:
            return "C#" + octave;
        case 2:
            return "D" + octave;
        case 3:
            return "D#" + octave;
        case 4:
            return "E" + octave;
        case 5:
            return "F" + octave;
        case 6:
            return "F#" + octave;
        case 7:
            return "G" + octave;
        case 8:
            return "G#" + octave;
        case 9:
            return "A" + octave;
        case 10:
            return "A#" + octave;
        case 11:
            return "B" + octave;
    }
    return "";
};

const RecordingPlayer = ({
    recording,
    playing,
    paused,
    onPlaybackTimeChanged,
}: {
    recording: Recording | null;
    playing?: boolean;
    paused?: boolean;
    onPlaybackTimeChanged?: (seconds: number) => void;
}): JSX.Element => {
    const { outputDevice } = useMidi();
    const { piano, ctx } = usePiano();

    const reqRef = useRef<number>();
    const prevTimeRef = useRef<number>();
    const startTimeRef = useRef<number>();
    const pausedRef = useRef<boolean>(false);

    const firstNote = useMemo(() => {
        if (!recording) return 0;
        return Math.max(0, recording.messages.filter(m => m.type === "noteOn")[0].time - 1);
    }, [recording]);
    const startPedal = useMemo(() => {
        if (!recording) return false;
        let pedal = false;
        for (let i = 0; i < recording.messages.length; i++) {
            if (recording.messages[i].type === "pedalOn") pedal = true;
            else if (recording.messages[i].type === "pedalOff") pedal = false;
            else if (recording.messages[i].type === "noteOn") {
                break;
            }
        }
        return pedal;
    }, [recording]);

    const [playbackTime, setPlaybackTime] = useState(firstNote);
    const [isPlaying, setIsPlaying] = useState(false);

    //send MIDI output
    const midiHandleMessage = useCallback(
        (message: Message) => {
            if (!outputDevice) return;
            switch (message.type) {
                case "noteOn":
                    outputDevice.playNote(message.pitch, 1, {
                        velocity: message.velocity / 127.0,
                    });
                    break;
                case "noteOff":
                    outputDevice.stopNote(message.pitch, 1);
                    break;
                case "pedalOn":
                    outputDevice.sendControlChange(64, 0);
                    outputDevice.sendControlChange(64, 127);
                    break;
                case "pedalOff":
                    outputDevice.sendControlChange(64, 0);
                    break;
                default:
                    console.error("Unexpected message type", message);
            }
        },
        [outputDevice]
    );

    //send audio output
    const audioHandleMessage = useCallback(
        (message: Message) => {
            if (!piano || !piano.loaded) return;
            switch (message.type) {
                case "noteOn":
                    piano.keyDown({
                        note: getNoteName(message.pitch),
                        velocity: message.velocity / 127.0,
                    });
                    break;
                case "noteOff":
                    piano.keyUp({ note: getNoteName(message.pitch), velocity: 0 });
                    break;
                case "pedalOn":
                    piano.pedalUp();
                    piano.pedalDown();
                    break;
                case "pedalOff":
                    piano.pedalUp();
                    break;
                default:
                    console.error("Unexpected message type", message);
            }
        },
        [piano]
    );

    //step through time and play messages as they come up
    const runPlayback = useCallback(
        (time: number) => {
            if (!startTimeRef.current) startTimeRef.current = time;

            const deltaTime = (time - (prevTimeRef.current || 0)) / 1000.0;
            if (pausedRef.current) {
                startTimeRef.current += deltaTime * 1000;
                prevTimeRef.current = time;
                reqRef.current = requestAnimationFrame(runPlayback);
                return;
            }
            const totalTime = firstNote + (time - startTimeRef.current) / 1000.0;
            if (totalTime < firstNote + 0.1 && startPedal) {
                midiHandleMessage({
                    type: "pedalOn",
                    pitch: 0,
                    velocity: 64,
                    time: totalTime,
                });
                audioHandleMessage({
                    type: "pedalOn",
                    pitch: 0,
                    velocity: 64,
                    time: totalTime,
                });
            }
            setPlaybackTime(totalTime);

            if (recording) {
                //find those messages which have a time between the last frame time and the current frame time
                const messages = recording.messages.filter(message => {
                    return (
                        (message.time < totalTime && message.time > totalTime - deltaTime) ||
                        (totalTime === 0 && message.time === 0)
                    );
                });
                messages.forEach(message => {
                    midiHandleMessage(message);
                    audioHandleMessage(message);
                });
            }

            prevTimeRef.current = time;

            //so long as there's still duration to go, continue playing
            //three extra seconds for effect
            if (recording && totalTime < recording.duration + 3)
                reqRef.current = requestAnimationFrame(runPlayback);
            else stop();
        },
        [recording]
    );

    //start playback
    const play = useCallback(() => {
        if (ctx != null && ctx.state !== "running") ctx.resume();
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
        if (!recording) {
            setIsPlaying(false);
            return;
        }
        reqRef.current = requestAnimationFrame(runPlayback);
        setIsPlaying(true);
        pausedRef.current = false;
    }, [recording, outputDevice, ctx]);

    //stop playback
    const stop = () => {
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
        startTimeRef.current = 0;
        prevTimeRef.current = 0;
        pausedRef.current = false;
        setIsPlaying(false);
        setPlaybackTime(firstNote);

        //also turn off all the MIDI notes and the pedal
        if (outputDevice) {
            outputDevice.sendControlChange(64, 0);
            for (let i = 0; i <= 127; i++) {
                outputDevice.stopNote(i, 1);
            }
        }
        if (piano) {
            piano.pedalUp();
            piano.stopAll();
        }
    };

    //on component unmount, stop playback
    useEffect(() => {
        return () => {
            stop();
        };
    }, [recording]);

    //update play state based on playing prop
    useEffect(() => {
        if (playing && !isPlaying) play();
        else if (!playing && isPlaying) stop();

        pausedRef.current = paused || false;
    }, [playing, isPlaying, paused, pausedRef]);

    //send playback time callbacks
    useEffect(() => {
        if (!onPlaybackTimeChanged) return;
        onPlaybackTimeChanged(playbackTime);
    }, [onPlaybackTimeChanged, playbackTime]);

    return <></>;
};

export default RecordingPlayer;

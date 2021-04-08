import { useState, useRef, useCallback, useEffect } from "react";

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
    onPlaybackTimeChanged,
}: {
    recording: Recording;
    playing?: boolean;
    onPlaybackTimeChanged?: (seconds: number) => void;
}): JSX.Element => {
    const { outputDevice } = useMidi();
    const piano = usePiano();

    const reqRef = useRef<number>();
    const prevTimeRef = useRef<number>();
    const startTimeRef = useRef<number>();

    const [playbackTime, setPlaybackTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    //send MIDI output
    const midiHandleMessage = (message: Message) => {
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
    };

    //send audio output
    const audioHandleMessage = (message: Message) => {
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
    };

    //step through time and play messages as they come up
    const runPlayback = (time: number) => {
        if (!startTimeRef.current) startTimeRef.current = time;

        const deltaTime = (time - (prevTimeRef.current || 0)) / 1000.0;
        const totalTime = (time - startTimeRef.current) / 1000.0;
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
        if (totalTime < recording.duration + 3) reqRef.current = requestAnimationFrame(runPlayback);
        else stop();
    };

    //start playback
    const play = useCallback(() => {
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
        reqRef.current = requestAnimationFrame(runPlayback);
        setIsPlaying(true);
    }, [outputDevice]);

    //stop playback
    const stop = () => {
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
        startTimeRef.current = 0;
        prevTimeRef.current = 0;
        setIsPlaying(false);
        setPlaybackTime(0);

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
    }, []);

    //update play state based on playing prop
    useEffect(() => {
        if (playing && !isPlaying) play();
        else if (!playing && isPlaying) stop();
    }, [playing, isPlaying]);

    //send playback time callbacks
    useEffect(() => {
        if (!onPlaybackTimeChanged) return;
        onPlaybackTimeChanged(playbackTime);
    }, [onPlaybackTimeChanged, playbackTime]);

    return null;
};

export default RecordingPlayer;

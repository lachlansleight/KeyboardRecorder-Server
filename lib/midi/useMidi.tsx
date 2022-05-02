import React, { useContext, createContext, useEffect, useState } from "react";
import Midi, { Input, Output, WebMidi } from "webmidi";

const midiContext = createContext<MidiContextValues>(null);

interface MidiContextValues {
    midi: WebMidi;
    inputDevice: Input | null;
    outputDevice: Output | null;
    setInputDevice: (dev: Input) => void;
    setOutputDevice: (dev: Output) => void;
    enabled: boolean;
    supported: boolean;
}

const useProvideMidi = () => {
    const [input, setInput] = useState(null);
    const [output, setOutput] = useState(null);
    const [enabled, setEnabled] = useState(false);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        Midi.enable(err => {
            if (err) {
                console.error(`Failed to enable MIDI: `, err);
                setSupported(false);
            } else {
                setEnabled(true);
                setSupported(true);

                const storedOutputDevice = localStorage.getItem("midiOutputDeviceName");
                if (storedOutputDevice) {
                    const output = Midi.getOutputByName(storedOutputDevice);
                    if (output) {
                        setOutput(output);
                    }
                }

                const storedInputDevice = localStorage.getItem("midiInputDeviceName");
                if (storedInputDevice) {
                    const input = Midi.getInputByName(storedInputDevice);
                    if (input) {
                        setInput(input);
                    }
                }
            }
        });
    }, []);

    return {
        midi: Midi,
        inputDevice: input,
        outputDevice: output,
        setInputDevice: (dev: Input) => {
            setInput(dev);
            if (dev) localStorage.setItem("midiInputDeviceName", dev.name);
            else localStorage.removeItem("midiInputDeviceName");
        },
        setOutputDevice: (dev: Output) => {
            setOutput(dev);
            if (dev) localStorage.setItem("midiOutputDeviceName", dev.name);
            else localStorage.removeItem("midiOutputDeviceName");
        },
        enabled,
        supported,
    };
};

const MidiProvider = ({
    children,
}: {
    children: JSX.Element[] | JSX.Element | null;
}): JSX.Element => {
    const midi = useProvideMidi();
    return <midiContext.Provider value={midi}>{children}</midiContext.Provider>;
};

const useMidi = (): MidiContextValues => {
    return useContext(midiContext);
};

export { MidiProvider };

export default useMidi;

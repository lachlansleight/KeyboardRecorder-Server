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
}

const useProvideMidi = () => {
    const [input, setInput] = useState(null);
    const [output, setOutput] = useState(null);
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        Midi.enable(err => {
            if (err) {
                console.error(`Failed to enable MIDI: `, err);
            } else {
                console.log("Enabled MIDI successfully", {
                    inputs: Midi.inputs,
                    outputs: Midi.outputs,
                });
                setEnabled(true);

                const storedDevice = localStorage.getItem("midiDeviceName");
                if (storedDevice) {
                    const output = Midi.getOutputByName(storedDevice);
                    if (output) {
                        console.log("Setting MIDI device from local storage value");
                        setOutput(output);
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
            localStorage.setItem("midiInputDeviceName", dev.name);
        },
        setOutputDevice: (dev: Output) => {
            setOutput(dev);
            localStorage.setItem("midiOutputDeviceName", dev.name);
        },
        enabled,
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

import React, { useContext, createContext, useEffect, useState } from "react";
import Midi, { Input, Output, WebMidi } from "webmidi";

const midiContext = createContext<MidiContextValues>({
    midi: Midi,
    inputDevice: null,
    outputDevice: null,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setInputDevice: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setOutputDevice: () => {},
    enabled: false,
    supported: false,
});

interface MidiContextValues {
    midi: WebMidi;
    inputDevice: Input | null;
    outputDevice: Output | null;
    setInputDevice: (dev: Input | null) => void;
    setOutputDevice: (dev: Output | null) => void;
    enabled: boolean;
    supported: boolean;
}

const useProvideMidi = () => {
    const [input, setInput] = useState<Input | null>(null);
    const [output, setOutput] = useState<Output | null>(null);
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
        setInputDevice: (dev: Input | null) => {
            setInput(dev);
            if (dev) localStorage.setItem("midiInputDeviceName", dev.name);
            else localStorage.removeItem("midiInputDeviceName");
        },
        setOutputDevice: (dev: Output | null) => {
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

import { useState, useEffect } from "react";
import { WebMidiEventConnected, WebMidiEventDisconnected } from "webmidi";
import useMidi from "../../lib/midi/useMidi";

import style from "./MidiOutputDevice.module.scss";

const defaultOption = (
    <option key={"none"} value={null}>
        Select MIDI Device
    </option>
);

const MidiOutputDevice = (): JSX.Element => {
    const { midi, enabled, outputDevice, setOutputDevice, supported } = useMidi();
    const [midiOutputDevices, setMidiOutputDevices] = useState<JSX.Element[]>([defaultOption]);

    const setMidiOutputDevice = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "Select MIDI Device") {
            setOutputDevice(null);
            return;
        }
        const output = midi.getOutputByName(e.target.value);
        if (output) {
            setOutputDevice(output);
        } else {
            console.error("Didn't find an output with that name!");
        }
    };

    useEffect(() => {
        const doSet = () => {
            setMidiOutputDevices([
                defaultOption,
                ...midi.outputs.map(output => {
                    return (
                        <option key={output.name} value={output.name}>
                            {output.name}
                        </option>
                    );
                }),
            ]);
        };

        const handleConnected = (e: WebMidiEventConnected) => {
            if (e.port.type === "output") doSet();
        };

        const handleDisconnected = (e: WebMidiEventDisconnected) => {
            if (e.port.type === "output") doSet();
        };

        if (!midi) return;
        if (!enabled) return;

        doSet();

        midi.addListener("connected", handleConnected);
        midi.addListener("disconnected", handleDisconnected);

        return () => {
            midi.removeListener("connected", handleConnected);
            midi.removeListener("disconnected", handleDisconnected);
        };
    }, [midi, enabled]);

    return (
        <div className={style.midiDropdown}>
            {!supported ? (
                <p>
                    MIDI not supported
                    <br />
                    on your browser!
                </p>
            ) : (
                <select
                    id={"midiDevice"}
                    value={outputDevice ? outputDevice.name : ""}
                    onChange={setMidiOutputDevice}
                >
                    {midiOutputDevices}
                </select>
            )}
        </div>
    );
};

export default MidiOutputDevice;

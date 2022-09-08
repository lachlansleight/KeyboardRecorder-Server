import {
    CalculateRecordingMetadata,
    ExtractRecordingMetadata,
    Message,
    Recording,
} from "lib/data/types";

const asciiToBytes = (ascii: string): number[] => {
    const bytes: number[] = [];
    for (let i = 0; i < ascii.length; i++) {
        bytes.push(ascii.charCodeAt(i));
    }
    return bytes;
};

// this encodes the bits of a single 32-bit integer
function vlqEncode(input: number, msb = 0): number[] {
    if (input === 0 && msb) return [];
    const byte = (msb << 7) | (input & 0x7f);
    return vlqEncode(input >>> 7, 1).concat(byte);
}
// decodes a vlq sequence representing one 32-bit integer
const vlqDecode = (bytes: number[]): number => {
    return bytes.reduce((acc, byte) => acc * (1 << 7) + (byte & 0x7f), 0);
};

const messageToMidi = (message: Message): number[] => {
    const bytes: number[] = [];
    switch (message.type) {
        case "noteOn":
            bytes.push(0x90);
            bytes.push(message.pitch);
            bytes.push(message.velocity);
            break;
        case "noteOff":
            bytes.push(0x80);
            bytes.push(message.pitch);
            bytes.push(message.velocity);
            break;
        case "pedalOn":
            bytes.push(0xb0);
            bytes.push(0x40);
            bytes.push(0xff);
            break;
        case "pedalOff":
            bytes.push(0xb0);
            bytes.push(0x40);
            bytes.push(0x00);
            break;
    }
    return bytes;
};

const getTextMetaEvent = (text: string) => {
    const bytes: number[] = [];
    bytes.push(0xff);
    bytes.push(0x01);
    bytes.push(text.length);
    bytes.push(...asciiToBytes(text));
    return bytes;
};

const getHeaderBlock = (): number[] => {
    const header: number[] = [];
    header.push(...asciiToBytes("MThd"));
    header.push(...[0, 0, 0, 6]);
    header.push(...[0, 0]);
    header.push(...[0, 1]);
    //1000 ticks per quarter note (@ 60bpm that means one tick per millisecond)
    header.push(...[0b00000011, 0b11101000]);
    return header;
};

const getTrackHeader = (trackBytes: number): number[] => {
    return [
        ...asciiToBytes("MTrk"),
        (trackBytes & 0xff000000) >> 24,
        (trackBytes & 0x00ff0000) >> 16,
        (trackBytes & 0x0000ff00) >> 8,
        trackBytes & 0x000000ff,
    ];
};

const getTrackMeta = (recordTime: Date): number[][] => {
    const blocks: number[][] = [];
    //track ID
    blocks.push([0x00, 0xff, 0x03, 0x01, 0x00]);

    //time signature
    blocks.push([0x00, 0xff, 0x58, 0x04, 0x04, 0x02, 0x24, 0x08]);

    //arbitrary text - for now just record time is probably enough
    blocks.push([0, ...getTextMetaEvent("recordTime: " + recordTime)]);
    // 60bpm (1,000,000 microseconds per quarter-note)
    blocks.push([0x00, 0xff, 0x51, 0x03, 0x0f, 0x42, 0x40]);
    // piano (program #1)
    blocks.push([0x00, 0xc0, 0x01]);

    return blocks;
};

export const getTestMidiBlocks = (): number[][] => {
    const messages: Message[] = [
        { type: "noteOn", time: 0, pitch: 60, velocity: 64 },
        { type: "noteOff", time: 0.1, pitch: 60, velocity: 64 },
        { type: "noteOn", time: 0.2, pitch: 61, velocity: 64 },
        { type: "noteOff", time: 0.3, pitch: 61, velocity: 64 },
        { type: "noteOn", time: 0.4, pitch: 62, velocity: 64 },
        { type: "noteOff", time: 0.5, pitch: 62, velocity: 64 },
        { type: "noteOn", time: 0.6, pitch: 63, velocity: 64 },
        { type: "noteOff", time: 0.7, pitch: 63, velocity: 64 },
    ];
    let curTime = 0;
    let trackLength = 0;
    const messageBlocks: number[][] = [];
    for (let i = 0; i < messages.length; i++) {
        const t = Math.round(messages[i].time * 1000);
        const deltaTime = t - curTime;
        messageBlocks.push([...vlqEncode(deltaTime), ...messageToMidi(messages[i])]);
        trackLength += messageBlocks[messageBlocks.length - 1].length;
        curTime = t;
    }

    const blocks: number[][] = [];
    messageBlocks.push([0, 0xff, 0x2f, 0x00]);
    trackLength += 4;

    //now we can produce all the necessary metadata and headers and stuff
    const header = getHeaderBlock();
    const meta = getTrackMeta(new Date());
    trackLength += meta.reduce((acc, block) => acc + block.length, 0);
    const trackHeader = getTrackHeader(trackLength);

    blocks.push(header);
    blocks.push(trackHeader);
    meta.forEach(b => blocks.push(b));
    messageBlocks.forEach(b => blocks.push(b));

    return blocks;
};

export const getTestMidiFile = (): Uint8Array => {
    const blocks = getTestMidiBlocks();
    const bytes: number[] = [];
    for (let i = 0; i < blocks.length; i++) {
        bytes.push(...blocks[i]);
    }
    return new Uint8Array(bytes);
};

export const getMidiFileBlocks = (recording: Recording): number[][] => {
    let curTime = 0;
    let trackLength = 0;
    const messageBlocks: number[][] = [];
    for (let i = 0; i < recording.messages.length; i++) {
        const t = Math.round(recording.messages[i].time * 1000);
        const deltaTime = t - curTime;
        messageBlocks.push([...vlqEncode(deltaTime), ...messageToMidi(recording.messages[i])]);
        trackLength += messageBlocks[messageBlocks.length - 1].length;
        curTime = t;
    }

    const blocks: number[][] = [];
    messageBlocks.push([0, 0xff, 0x2f, 0x00]);
    trackLength += 4;

    //now we can produce all the necessary metadata and headers and stuff
    const header = getHeaderBlock();
    const meta = getTrackMeta(recording.recordedAt);
    trackLength += meta.reduce((acc, block) => acc + block.length, 0);
    const trackHeader = getTrackHeader(trackLength);

    blocks.push(header);
    blocks.push(trackHeader);
    meta.forEach(b => blocks.push(b));
    messageBlocks.forEach(b => blocks.push(b));

    return blocks;
};

export const createMidiFile = (recording: Recording): Uint8Array => {
    const blocks = getMidiFileBlocks(recording);
    const bytes: number[] = [];
    for (let i = 0; i < blocks.length; i++) {
        bytes.push(...blocks[i]);
    }
    return new Uint8Array(bytes);
};

export const parseMidiFile = (file: Uint8Array): Recording => {
    let recording: Recording = {
        recordedAt: new Date(),
        duration: 0,
        semitones: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        averageVelocity: 0,
        velocitySpread: 0,
        messageCount: 0,
        messages: [],
    };
    //first we get through all the header and meta stuff
    let pos = 22; //skip header and MTrk + length
    let metadataString = "";
    while (pos <= file.byteLength) {
        if (file[pos] !== 0) break;
        pos++;
        if (file[pos] !== 0xff) {
            pos--;
            break;
        }
        pos++;
        const isText = file[pos] === 0x01;
        pos++;
        const length = file[pos];
        if (isText) {
            for (let i = 0; i < length; i++) {
                pos++;
                metadataString += String.fromCharCode(file[pos]);
            }
            const pieces = metadataString.split(": ");
            switch (pieces[0]) {
                case "recordTime":
                    recording.recordedAt = new Date(pieces[1]);
                    break;
            }
        } else {
            pos += length;
        }
        pos++;
    }
    let time = 0;
    while (pos <= file.byteLength) {
        let boundary = pos;
        for (let i = pos; i < file.byteLength; i++) {
            if (!(file[i] >> 7)) {
                boundary = i;
                break;
            }
        }
        const deltaTime = vlqDecode(Array.from(file.slice(pos, boundary + 1)));
        pos = boundary + 1;
        time += deltaTime;

        if (file[pos] === 0x90) {
            pos++;
            const pitch = file[pos];
            pos++;
            const velocity = file[pos];
            pos++;
            recording.messages.push({ type: "noteOn", time: time / 1000, pitch, velocity });
        } else if (file[pos] === 0x80) {
            pos++;
            const pitch = file[pos];
            pos++;
            const velocity = file[pos];
            pos++;
            recording.messages.push({ type: "noteOff", time: time / 1000, pitch, velocity });
        } else if (file[pos] === 0xb0) {
            pos++;
            pos++;
            recording.messages.push({
                type: file[pos] > 64 ? "pedalOn" : "pedalOff",
                time: time / 1000,
                pitch: 0,
                velocity: 0,
            });
        } else if (file[pos] === 0xff) {
            pos++;
            pos++;
        } else if (file[pos] === 0xc0) {
            pos++;
            pos++;
        } else {
            if (pos === file.byteLength) break;
            else {
                console.error(
                    "Unknown midi message " + file[pos].toString(16) + " at position " + pos
                );
            }
        }
    }
    const rawMetadata = CalculateRecordingMetadata(recording);
    recording = { ...recording, ...rawMetadata };
    recording = { ...recording, ...ExtractRecordingMetadata(recording) };
    return recording;
};

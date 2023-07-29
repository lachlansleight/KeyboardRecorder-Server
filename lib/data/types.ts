export type MessageType = "noteOn" | "noteOff" | "pedalOn" | "pedalOff";

export interface RecordingMetadata {
    recordedAt: Date;
    duration: number;
    semitones: number[];
    pitchCounts: number[];
    averageVelocity: number;
    velocitySpread: number;
    messageCount: number;

    id?: string;
    title?: string;
    starred?: boolean;
    note?: string;
    midiUrl?: string;
}

export interface Recording extends RecordingMetadata {
    messages: Message[];
}

export interface Message {
    type: MessageType;
    pitch: number;
    velocity: number;
    time: number;
}

export const CalculateRecordingMetadata = (recording: Recording): RecordingMetadata => {
    const duration = recording.messages.slice(-1)[0].time;

    const semitoneSums = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const pitchCounts = Array.from({ length: 128 }).map(() => 0);
    let noteCount = 0;
    let velocitySum = 0;
    for (let i = 0; i < recording.messages.length; i++) {
        if (recording.messages[i].type !== "noteOn" || recording.messages[i].pitch > 0) continue;
        semitoneSums[recording.messages[i].pitch % 12]++;
        pitchCounts[recording.messages[i].pitch]++;
        velocitySum += recording.messages[i].velocity;
        noteCount++;
    }
    const semitones = semitoneSums.map(count => count / noteCount);
    const averageVelocity = velocitySum / noteCount;

    let velocityErrorSum = 0;
    for (let i = 0; i < recording.messages.length; i++) {
        if (recording.messages[i].type !== "noteOn" || recording.messages[i].pitch > 0) continue;
        velocityErrorSum +=
            (averageVelocity - recording.messages[i].velocity) *
            (averageVelocity - recording.messages[i].velocity);
    }
    const velocitySpread = Math.sqrt(velocityErrorSum / noteCount);

    return {
        recordedAt: new Date(new Date().valueOf() - duration * 1000),
        duration,
        messageCount: recording.messages.length,
        averageVelocity,
        velocitySpread,
        semitones,
        pitchCounts,
    };
};

export const ExtractRecordingMetadata = (recording: Recording): RecordingMetadata => {
    const pitchCounts = Array.from({ length: 128 }).map(() => 0);
    recording.messages
        .filter(m => m.type === "noteOn" && m.pitch > 0)
        .forEach(m => pitchCounts[m.pitch]++);

    const recordingMetadata: RecordingMetadata = {
        recordedAt: new Date(recording.recordedAt),
        duration: recording.duration,
        semitones: recording.semitones.map((s: number) => Math.round(s * 1000) / 1000),
        averageVelocity: recording.averageVelocity,
        velocitySpread: Math.round(recording.velocitySpread * 1000) / 1000,
        messageCount: recording.messages.length,
        pitchCounts,
    };
    if (recording.title) recordingMetadata.title = recording.title;
    if (recording.starred) recordingMetadata.starred = recording.starred;
    if (recording.note) recordingMetadata.note = recording.note;

    return recordingMetadata;
};

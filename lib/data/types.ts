export type MessageType = "noteOn" | "noteOff" | "pedalOn" | "pedalOff";

export interface RecordingMetadata {
    recordedAt: Date;
    duration: number;
    semitones: number[];
    averageVelocity: number;
    velocitySpread: number;
    messageCount: number;

    id?: string;
    title?: string;
    starred?: boolean;
    note?: string;
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

export const ExtractRecordingMetadata = (recording: Recording): RecordingMetadata => {
    const recordingMetadata: RecordingMetadata = {
        recordedAt: new Date(recording.recordedAt),
        duration: recording.duration,
        semitones: recording.semitones.map((s: number) => Math.round(s * 1000) / 1000),
        averageVelocity: recording.averageVelocity,
        velocitySpread: Math.round(recording.velocitySpread * 1000) / 1000,
        messageCount: recording.messages.length,
    };
    if (recording.title) recordingMetadata.title = recording.title;
    if (recording.starred) recordingMetadata.starred = recording.starred;
    if (recording.note) recordingMetadata.note = recording.note;

    return recordingMetadata;
};

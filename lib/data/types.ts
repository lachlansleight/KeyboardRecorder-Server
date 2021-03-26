export type MessageType = "noteOn" | "noteOff" | "pedalOn" | "pedalOff";

export interface Recording {
    recordedAt: Date;
    duration: number;
    semitones: number[];
    averageVelocity: number;
    velocitySpread: number;
    messageCount: number;
    messages: Message[];

    id?: string;
    title?: string;
    starred?: boolean;
    note?: string;
}

export interface Message {
    type: MessageType;
    pitch: number;
    velocity: number;
    time: number;
}

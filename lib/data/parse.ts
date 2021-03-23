import { Message, MessageType, Recording } from "./types";

export const parseMessage = (bytes: number[]): Message => {
    if(bytes.length !== 5) throw new Error("Message must be 5 bytes");
    console.log(bytes);
    const noteStatus = bytes[0] >> 7;
    const pitch = bytes[0] & 0b01111111;
    const pedalStatus = bytes[1] >> 7;
    const velocity = bytes[1] & 0b01111111;
    const time = bytes[2] * 256 + bytes[3] + bytes[4] / 250;
    const type: MessageType = pedalStatus 
        ? noteStatus > 0 ? "pedalOn" : "pedalOff"
        : noteStatus > 0 ? "noteOn" : "noteOff";

    return {
        type,
        pitch,
        velocity,
        time
    }
}

export const parseRecording = (bytes: number[]): Recording => {
    if(bytes.length % 5 !== 0) throw new Error("Recording should be a set of 5-byte messages");
    const messages: Message[] = [];
    for(let i = 0; i < bytes.length; i += 5) {
        messages.push(parseMessage(bytes.slice(i, i + 5)));
    }
    const duration = messages.slice(-1)[0].time;

    const semitoneSums = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let noteCount = 0;
    let velocitySum = 0;
    for(let i = 0; i < messages.length; i++) {
        if(messages[i].type !== "noteOn") continue;
        semitoneSums[messages[i].pitch % 12]++;
        velocitySum += messages[i].velocity;
        noteCount++;
    }
    const semitones = semitoneSums.map(count => count / noteCount);
    const averageVelocity = velocitySum / noteCount;

    let velocityErrorSum = 0;
    for(let i = 0; i < messages.length; i++) {
        if(messages[i].type !== "noteOn") continue;
        velocityErrorSum += (averageVelocity - messages[i].velocity) * (averageVelocity - messages[i].velocity);
    }
    const velocitySpread = Math.sqrt(velocityErrorSum / noteCount);

    return {
        recordedAt: new Date((new Date().valueOf()) - duration * 1000),
        duration,
        messages,
        messageCount: messages.length,
        averageVelocity,
        velocitySpread,
        semitones
    }
}
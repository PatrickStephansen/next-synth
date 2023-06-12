const channelFromStatus = (status: number) => (status & 0xf) + 1;

export interface MidiEvent {
  channel: number;
  eventType:
    | "noteOn"
    | "noteOff"
    | "pitchBend"
    | "modWheel"
    | "volumeChange"
    | "notRecognized";
  keyNumber?: number;
  velocity: number;
  raw?: Uint8Array;
}

export const midiEventFromBytes = (eventData: Uint8Array): MidiEvent => {
  const [status, key, velocity] = eventData;
  if ((status & 0xf0) === 0x80) {
    return {
      channel: channelFromStatus(status),
      eventType: "noteOff",
      keyNumber: key,
      velocity: velocity / 127,
      raw: eventData,
    };
  } else if ((status & 0xf0) === 0x90) {
    return {
      channel: channelFromStatus(status),
      eventType: velocity === 0 ? "noteOff" : "noteOn",
      keyNumber: key,
      velocity: velocity / 127,
      raw: eventData,
    };
  } else if ((status & 0xf0) === 0xb0) {
    if (key === 7) {
      return {
        channel: channelFromStatus(status),
        eventType: "volumeChange",
        velocity: velocity / 127,
        raw: eventData,
      };
    }
    return {
      channel: channelFromStatus(status),
      eventType: "modWheel",
      velocity: velocity / 127,
      raw: eventData,
    };
  } else if ((status & 0xf0) === 0xe0) {
    return {
      channel: channelFromStatus(status),
      eventType: "pitchBend",
      velocity: (+(key === 127) + velocity - 64) / 64,
      raw: eventData,
    };
  }
  return {
    channel: 0,
    keyNumber: key,
    eventType: "notRecognized",
    velocity: velocity,
    raw: eventData,
  };
};
// A4 = 440Hz = key 69
export const keyNumberToOffsetInCents = (keyNumber: number) =>
  (keyNumber - 69) * 100;

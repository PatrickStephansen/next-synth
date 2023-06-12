"use client";
// for one key:
// oscillator with gain, pitch, bitcrusher, filter envelopes and lfos
// bitcrusher and pitch can perhaps be shared rather than per-channel

import { MidiEvent, keyNumberToOffsetInCents } from "./midi-input";

const OSCILLATOR_POOL_SIZE = 20;
const oscillatorPool: Voice[] = [];

const audioContext = new AudioContext();

interface Voice {
  oscillator: OscillatorNode;
  gain: GainNode;
  isBusy: boolean;
  lastInvocationTime: number;
  note?: number;
}

export const initializeSignalChain = async () => {
  await audioContext.suspend();
  for (let index = 0; index < OSCILLATOR_POOL_SIZE; index++) {
    const oscillator = new OscillatorNode(audioContext);
    const gain = new GainNode(audioContext, { gain: 0 });
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillatorPool.push({
      oscillator,
      gain,
      isBusy: false,
      lastInvocationTime: 0,
    });
  }
};

export const startAudioContext = audioContext.resume.bind(audioContext);
export const stopAudioContext = audioContext.suspend.bind(audioContext);

export const handleMidiEvent = (
  eventData: MidiEvent,
  selectedMidiChannel: number
) => {
  if (eventData.channel != selectedMidiChannel) {
    return;
  }
  if (eventData.eventType === "noteOn") {
    const firstFreeOscillator =
      oscillatorPool.find((o) => !o.isBusy) ||
      oscillatorPool.sort(
        (a, b) => b.lastInvocationTime - a.lastInvocationTime
      )[0];
    firstFreeOscillator.isBusy = true;
    firstFreeOscillator.lastInvocationTime = audioContext.currentTime;
    firstFreeOscillator.note = eventData.keyNumber;
    firstFreeOscillator.oscillator.detune.setValueAtTime(
      keyNumberToOffsetInCents(eventData?.keyNumber ?? 48),
      0
    );
    firstFreeOscillator.gain.gain.setValueAtTime(eventData.velocity, 0);
  }
  if (eventData.eventType === "noteOff") {
    const ringingNote = oscillatorPool
      .sort((a, b) => b.lastInvocationTime - a.lastInvocationTime)
      .find((o) => o.note == eventData.keyNumber);
    if (ringingNote) {
      ringingNote.isBusy = false;
      ringingNote.gain.gain.setValueAtTime(0, 0);
    }
  }
};

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
  envelopeGeneratorNode: AudioWorkletNode;
  isBusy: boolean;
  lastInvocationTime: number;
  note?: number;
}

const createModuleReadyPromise = (port: MessagePort) =>
  new Promise<void>((resolve) =>
    port.addEventListener("message", function moduleReady(event) {
      if (
        event.data &&
        event.data.type === "module-ready" &&
        event.data.value
      ) {
        resolve();
        port.removeEventListener("message", moduleReady);
      }
    })
  );

export const initializeSignalChain = async () => {
  await audioContext.suspend();
  await audioContext.audioWorklet.addModule("/worklets/envelope-generator.js");
  const envelopeGeneratorBinaryResponse = await fetch(
    "/worklets/reactive_synth_envelope_generator.wasm"
  );
  const envelopeGeneratorBinary =
    await envelopeGeneratorBinaryResponse.arrayBuffer();
  for (let index = 0; index < OSCILLATOR_POOL_SIZE; index++) {
    const oscillator = new OscillatorNode(audioContext);
    const gain = new GainNode(audioContext, { gain: 0 });
    const envelopeGeneratorNode = new AudioWorkletNode(
      audioContext,
      "reactive-synth-envelope-generator",
      {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        channelCount: 1,
        channelCountMode: "explicit",
        outputChannelCount: [1],
        processorOptions: { sampleRate: audioContext.sampleRate },
      }
    );
    envelopeGeneratorNode.port.postMessage({
      type: "wasm",
      wasmModule: envelopeGeneratorBinary,
    });
    envelopeGeneratorNode.port.start();
    await createModuleReadyPromise(envelopeGeneratorNode.port);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    envelopeGeneratorNode.connect(gain.gain);
    oscillator.start();
    oscillatorPool.push({
      oscillator,
      gain,
      envelopeGeneratorNode,
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
    firstFreeOscillator.envelopeGeneratorNode.parameters
      .get("trigger")
      ?.setValueAtTime(eventData.velocity, 0);
    firstFreeOscillator.envelopeGeneratorNode.parameters
      .get("attackValue")
      ?.setValueAtTime(eventData.velocity, 0);
    firstFreeOscillator.envelopeGeneratorNode.parameters
      .get("sustainValue")
      ?.setValueAtTime(eventData.velocity / 4, 0);
  }
  if (eventData.eventType === "noteOff") {
    const ringingNote = oscillatorPool
      .sort((a, b) => b.lastInvocationTime - a.lastInvocationTime)
      .find((o) => o.note == eventData.keyNumber);
    if (ringingNote) {
      ringingNote.isBusy = false;
      ringingNote.envelopeGeneratorNode.parameters
        .get("trigger")
        ?.setValueAtTime(0, 0);
    }
  }
};

"use client";
// for one key:
// oscillator with gain, pitch, bitcrusher, filter envelopes and lfos
// bitcrusher and pitch can perhaps be shared rather than per-channel

import { MidiEvent, keyNumberToOffsetInCents } from "./midi-input";

const OSCILLATOR_POOL_SIZE = 20;
const oscillatorPool: Voice[] = [];

const audioContext = new AudioContext();
const masterGain = new GainNode(audioContext, { gain: 0.2 });
masterGain.connect(audioContext.destination);

export interface EnvelopeParameters {
  attackValue: number;
  attackTime: number;
  holdTime: number;
  decayTime: number;
  sustainValue: number;
  releaseTime: number;
}
export interface EnvelopState {
  stage: "rest" | "attack" | "hold" | "decay" | "sustain" | "release";
  stageProgress: number;
  outputValue: number;
  parameters: EnvelopeParameters;
}

export interface EnvelopeDetails {
  processingNode: AudioWorkletNode;
  envelopeGain: GainNode;
  requestState: () => void;
  setEnvelopeStateUpdateCallback: (
    callback: (state: EnvelopState) => void
  ) => void;
}

export interface Voice {
  oscillator: OscillatorNode;
  gain: GainNode;
  isBusy: boolean;
  lastInvocationTime: number;
  note?: number;
  envelopes: { gain: EnvelopeDetails };
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
  await audioContext.audioWorklet.addModule("/worklets/envelope-generator.js");
  const envelopeGeneratorBinaryResponse = await fetch(
    "/worklets/reactive_synth_envelope_generator.wasm"
  );
  const envelopeGeneratorBinary =
    await envelopeGeneratorBinaryResponse.arrayBuffer();
  for (let index = 0; index < OSCILLATOR_POOL_SIZE; index++) {
    const oscillator = new OscillatorNode(audioContext);
    const gain = new GainNode(audioContext, { gain: 0 });
    const envelopeGain = new GainNode(audioContext, { gain: 0 });
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
    const getState = () => {
      envelopeGeneratorNode.port.postMessage({ type: "get-state" });
    };
    oscillator.connect(gain);
    gain.connect(masterGain);
    envelopeGeneratorNode.connect(envelopeGain);
    envelopeGain.connect(gain.gain);
    oscillator.start();
    oscillatorPool.push({
      oscillator,
      gain: gain,
      isBusy: false,
      lastInvocationTime: 0,
      envelopes: {
        gain: {
          processingNode: envelopeGeneratorNode,
          envelopeGain,
          requestState: getState,
          setEnvelopeStateUpdateCallback: (
            callback: (state: EnvelopState) => void
          ) => {
            envelopeGeneratorNode.port.onmessage = (event: MessageEvent) => {
              if (event.data.type === "state") {
                callback(event.data.state);
              }
            };
          },
        },
      },
    });
  }
  return oscillatorPool;
};

export const startAudioContext = audioContext.resume.bind(audioContext);
export const stopAudioContext = audioContext.suspend.bind(audioContext);

export const handleMidiEvent = (eventData: MidiEvent) => {
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
    firstFreeOscillator.envelopes.gain.processingNode.parameters
      .get("trigger")
      ?.setValueAtTime(1, 0);
    firstFreeOscillator.envelopes.gain.envelopeGain.gain.setValueAtTime(
      eventData.velocity,
      0
    );
  }
  if (eventData.eventType === "noteOff") {
    const ringingNote = oscillatorPool
      .sort((a, b) => b.lastInvocationTime - a.lastInvocationTime)
      .find((o) => o.note == eventData.keyNumber);
    if (ringingNote) {
      setTimeout(() => {
        ringingNote.isBusy = false;
      }, ringingNote.envelopes.gain.processingNode.parameters.get("release")?.value ?? 0 * 1000);
      ringingNote.envelopes.gain.processingNode.parameters
        .get("trigger")
        ?.setValueAtTime(0, 0);
    }
  }
  if (eventData.eventType === "volumeChange") {
    masterGain.gain.setValueAtTime(eventData.velocity, 0);
    return { masterGain: eventData.velocity };
  }
};

export const setMasterGain = (gain: number) => {
  if (audioContext.state !== "running") {
    audioContext
      .resume()
      .catch((e) =>
        console.error(
          "There's a problem with the audio context. Couldn't resume it.",
          e
        )
      );
  }
  masterGain.gain.linearRampToValueAtTime(
    gain,
    audioContext.currentTime + 0.01
  );
};

export const setOscillatorPoolWaveForm = (waveForm: string) => {
  oscillatorPool.forEach(
    (o) => (o.oscillator.type = waveForm as OscillatorType)
  );
};

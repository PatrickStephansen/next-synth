"use client";
import { useCallback, useEffect, useState } from "react";
import { EnvelopeVisualizer } from "./envelope-visualizer";
import { MidiInputSelector } from "./midi-input-selector";
import {
  Voice,
  initializeSignalChain,
  setMasterGain,
  setOscillatorPoolWaveForm,
  handleMidiEvent,
} from "@/lib/signal-chain";
import { GainSetting } from "./gain-setting";
import { Select, Option } from "./select";
import { MidiEvent } from "@/lib/midi-input";
import { MidiInputDebugger } from "./midi-event-debugger";
import { MidiNotesVisualizer } from "./midi-notes-visualizer";

const waveFormOptions = [
  { displayName: "Sine", value: "sine" },
  { displayName: "Triangle", value: "triangle" },
  { displayName: "Square", value: "square" },
  { displayName: "Sawtooth", value: "sawtooth" },
] as Option[];

export default function PolyPhonicMidiSynth() {
  const [oscillatorPool, setOscillatorPool] = useState<Voice[]>([]);
  const [waveform, setWaveForm] = useState("sine");
  const [latestMidiEvent, setLatestMidiEvent] = useState<MidiEvent>();
  const [masterVolume, setMasterVolume] = useState<number>(0);
  useState<boolean>(false);
  useEffect(() => {
    initializeSignalChain().then((op) => {
      setOscillatorPool(op);
    });
  }, []);
  const setOscillatorPoolWaveForms = useCallback(
    (waveForm: string) => {
      setOscillatorPoolWaveForm(waveForm);
      setWaveForm(waveForm);
    },
    [setOscillatorPoolWaveForm, setWaveForm]
  );
  const setMasterGainLevel = useCallback(
    (gain: number) => {
      setMasterGain(gain);
      setMasterVolume(gain);
    },
    [setMasterGain, setMasterVolume]
  );
  const onMidiEvent = useCallback(
    (midiEvent: MidiEvent) => {
      const signalChainState = handleMidiEvent(midiEvent);
      if (signalChainState?.masterGain !== undefined) {
        setMasterGainLevel(signalChainState.masterGain);
      }
      if (signalChainState?.voices) {
        setOscillatorPool(signalChainState.voices);
      }
      setLatestMidiEvent(midiEvent);
    },
    [handleMidiEvent, setLatestMidiEvent, setMasterGainLevel]
  );
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <MidiInputSelector onMidiEvent={onMidiEvent} />

      <GainSetting
        setGain={setMasterGainLevel}
        name="Master Gain"
        value={masterVolume}
      />
      <Select
        onChange={setOscillatorPoolWaveForms}
        label="Oscillator Waveform"
        options={waveFormOptions}
        value={waveform}
      />
      <div className="grid grid-cols-2 gap-4 place-content-center">
        <EnvelopeVisualizer envelopeType="gain" voices={oscillatorPool} />
        <MidiNotesVisualizer voices={oscillatorPool} />
      </div>
      <MidiInputDebugger midiEvent={latestMidiEvent} />
    </main>
  );
}

"use client";
import { useCallback, useEffect, useState } from "react";
import { EnvelopeVisualizer } from "./envelope-visualizer";
import { MidiInputSelector } from "./midi-input-selector";
import {
  Voice,
  initializeSignalChain,
  setMasterGain,
  setOscillatorPoolWaveForm,
} from "@/lib/signal-chain";
import { GainSetting } from "./gain-setting";
import { Select, Option } from "./select";
const waveFormOptions = [
  { displayName: "Sine", value: "sine" },
  { displayName: "Triangle", value: "triangle" },
  { displayName: "Square", value: "square" },
  { displayName: "Sawtooth", value: "sawtooth" },
] as Option[];
export default function PolyPhonicMidiSynth() {
  const [oscillatorPool, setOscillatorPool] = useState([] as Voice[]);
  const [waveform, setWaveForm] = useState("sine");
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
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <MidiInputSelector />
      <GainSetting setGain={setMasterGain} name="Master Gain" defaultGain={0} />
      <Select onChange={setOscillatorPoolWaveForms} label="Oscillator Waveform" options={waveFormOptions} value={waveform}/>
      <EnvelopeVisualizer envelopeType="gain" voices={oscillatorPool} />
    </main>
  );
}

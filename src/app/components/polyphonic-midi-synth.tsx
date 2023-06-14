"use client";
import { useEffect, useState } from "react";
import { EnvelopeVisualizer } from "./envelope-visualizer";
import { MidiInputSelector } from "./midi-input-selector";
import {
  Voice,
  getAudioContextActive,
  initializeSignalChain,
  setMasterGain,
} from "@/lib/signal-chain";
import { GainSetting } from "./gain-setting";
export default function PolyPhonicMidiSynth() {
  const [oscillatorPool, setOscillatorPool] = useState([] as Voice[]);
  useEffect(() => {
    initializeSignalChain().then((op) => {
      setOscillatorPool(op);
    });
  }, []);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <MidiInputSelector />
      <GainSetting
        setGain={setMasterGain}
        name="Master Gain"
        defaultGain={0}
      />
      <EnvelopeVisualizer envelopeType="gain" voices={oscillatorPool} />
    </main>
  );
}

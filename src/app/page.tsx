"use client";
import { useEffect, useState } from "react";
import { EnvelopeVisualizer } from "./components/envelope-visualizer";
import { MidiInputSelector } from "./components/midi-input-selector";
import { Voice, initializeSignalChain, setMasterGain } from "@/lib/signal-chain";
import { MasterGain } from "./components/master-gain";

export default function Home() {
  const [oscillatorPool, setOscillatorPool] = useState([] as Voice[]);
  useEffect(() => {
    initializeSignalChain().then((op) => setOscillatorPool(op));
  }, []);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <MidiInputSelector />
      <MasterGain setMasterGain={setMasterGain}/>
      <EnvelopeVisualizer envelopeType="gain" voices={oscillatorPool} />
    </main>
  );
}

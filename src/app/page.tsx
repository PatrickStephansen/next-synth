import { EnvelopeVisualizer } from "./components/envelope-visualizer";
import { MidiInputSelector } from "./components/midi-input-selector";
import { oscillatorPool } from "@/lib/signal-chain";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <MidiInputSelector />
      <EnvelopeVisualizer envelopeType="gain" voices={oscillatorPool} />
    </main>
  );
}

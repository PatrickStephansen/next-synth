import { MidiInputSelector } from "./components/midi-input-selector";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <MidiInputSelector />
    </main>
  );
}

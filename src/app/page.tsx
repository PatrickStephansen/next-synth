import { MidiInputs } from "./components/midi-inputs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <MidiInputs />
    </main>
  );
}

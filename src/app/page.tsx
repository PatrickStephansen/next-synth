import dynamic from "next/dynamic";
const SynthComponent = dynamic(
  () =>
    import("./components/polyphonic-midi-synth"),
  { ssr: false }
);
export default function Home() {
  return <SynthComponent />;
}

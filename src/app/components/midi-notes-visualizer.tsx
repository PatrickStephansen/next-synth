import { keyNumberToNoteName } from "@/lib/midi-input";
import { Voice } from "@/lib/signal-chain";

interface Props {
  voices: Voice[];
}

export const MidiNotesVisualizer = ({ voices: activeKeys }: Props) => {
  return (
    <div>
      <h2>Inputs</h2>
      <ul>
        {activeKeys
          .filter((k) => k.isBusy && !k.isReleasing)
          .map((k, i) => (
            <li key={i}>
              {k.note? `${k.note}: ${keyNumberToNoteName(k.note)}`: ``}
              <meter
                className="mx-2 border rounded"
                min="0"
                max="1"
                value={k.keyVelocity}
              ></meter>
            </li>
          ))}
      </ul>
    </div>
  );
};

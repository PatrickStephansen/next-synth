import { MidiEvent } from "@/lib/midi-input";
import { useState } from "react";

interface Props {
  midiEvent: MidiEvent | undefined;
}

export const MidiInputDebugger = ({ midiEvent }: Props) => {
  const [showLatestMidiEvent, setShowLatestMidiEvent] =
    useState<boolean>(false);
  return (
    <div>
      <label>
        <input
          type="checkbox"
          className="m-2"
          onChange={(e) => setShowLatestMidiEvent(e.target.checked)}
        />
        Show MIDI event data
      </label>
      {showLatestMidiEvent ? (
        <div>
          <h2 className="px-8">Last MIDI event:</h2>
          <dl className="px-12">
            <dt>channel</dt>
            <dd className="px-4">{midiEvent?.channel}</dd>
            <dt>event</dt>
            <dd className="px-4">{midiEvent?.eventType}</dd>
            <dt>key number</dt>
            <dd className="px-4">{midiEvent?.keyNumber}</dd>
            <dt>velocity</dt>
            <dd className="px-4">{midiEvent?.velocity}</dd>
            <dt>raw</dt>
            <dd className="px-4">{midiEvent?.raw?.toString()}</dd>
          </dl>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

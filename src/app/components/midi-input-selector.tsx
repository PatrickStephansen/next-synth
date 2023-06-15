import { MidiEvent, midiEventFromBytes } from "@/lib/midi-input";
import { handleMidiEvent } from "@/lib/signal-chain";
import { useEffect, useMemo, useState } from "react";
import { Select, Option } from "./select";

export const MidiInputSelector = ({}) => {
  const [instruments, setInstruments] = useState([] as MIDIInput[]);
  const [selectedInstrumentId, setSelectedInstrumentId] = useState("");
  const [midiEvent, setMidiEvent] = useState({} as MidiEvent);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  useEffect(() => {
    navigator.requestMIDIAccess().then(
      (midi) => {
        const inputs = [...midi.inputs.values()];
        setInstruments(inputs);
        const previouslySelectedInput = localStorage.getItem(
          "selectedMidiInputId"
        );
        if (previouslySelectedInput) {
          selectInstrumentById(previouslySelectedInput, inputs);
        } else if (inputs?.[0]?.id) {
          selectInstrumentById(inputs[0].id, inputs);
        }
      },
      (failure) => {
        console.error("could not connect to midi devices", failure);
        setInstruments([]);
      }
    );
  }, []);

  const selectInstrumentById = (id: string, instruments: MIDIInput[]) => {
    instruments.forEach((i) => (i.onmidimessage = null));
    const selectedInput = instruments.find((i) => i.id == id);
    localStorage.setItem("selectedMidiInputId", id);
    if (selectedInput)
      selectedInput.onmidimessage = (event) => {
        const parsedEvent = midiEventFromBytes(
          (event as MIDIMessageEvent).data
        );
        setMidiEvent(parsedEvent);
        handleMidiEvent(parsedEvent);
      };
    setSelectedInstrumentId(id);
  };

  const selectInstrument = (value: string) => {
    selectInstrumentById(value, instruments);
  };
  const instrumentOptions = useMemo(
    () => instruments.map((i) => ({ value: i.id, displayName: i.name })),
    [instruments]
  ) as Option[];
  return (
    <div>
      <Select
        label="MIDI input device"
        onChange={selectInstrument}
        value={selectedInstrumentId}
        options={instrumentOptions}
      />
      <label>
        <input
          type="checkbox"
          className="m-2"
          onChange={(e) => setShowDebugInfo(e.target.checked)}
        />
        Show debug info
      </label>

      {showDebugInfo ? (
        <div>
          <h2>Last MIDI event:</h2>
          <dl>
            <dt>channel</dt>
            <dd>{midiEvent.channel}</dd>
            <dt>event</dt>
            <dd>{midiEvent.eventType}</dd>
            <dt>key number</dt>
            <dd>{midiEvent.keyNumber}</dd>
            <dt>velocity</dt>
            <dd>{midiEvent.velocity}</dd>
            <dt>raw</dt>
            <dd>{midiEvent.raw?.toString()}</dd>
          </dl>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

import { MidiEvent, midiEventFromBytes } from "@/lib/midi-input";
import { useEffect, useMemo, useState } from "react";
import { Select, Option } from "./select";

interface Props {
  onMidiEvent: (event: MidiEvent) => void;
}

export const MidiInputSelector = ({ onMidiEvent }: Props) => {
  const [instruments, setInstruments] = useState<MIDIInput[]>([]);
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>("");
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
        onMidiEvent(parsedEvent);
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
    <Select
      label="MIDI input device"
      onChange={selectInstrument}
      value={selectedInstrumentId}
      options={instrumentOptions}
    />
  );
};

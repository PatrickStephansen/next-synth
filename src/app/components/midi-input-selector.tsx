"use client";
import { MidiEvent, midiEventFromBytes } from "@/lib/midi-input";
import { ChangeEvent, useEffect, useState } from "react";

export const MidiInputSelector = ({}) => {
  const [instruments, setInstruments] = useState([] as MIDIInput[]);
  const [selectedInstrumentId, setSelectedInstrumentId] = useState("");
  const [inputChannel, setInputChannel] = useState(1);
  const [midiEvent, setMidiEvent] = useState({} as MidiEvent);
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
        setMidiEvent(midiEventFromBytes((event as MIDIMessageEvent).data));
      };
    setSelectedInstrumentId(id);
  };
  const selectInstrument = (e: ChangeEvent<HTMLSelectElement>) => {
    selectInstrumentById(e.target.value, instruments);
  };
  const selectInputChannel = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = +e.target.value;
    if (inputValue >= 1 && inputValue <= 16){
      setInputChannel(inputValue)
    }
  }
  return (
    <div>
      <label>
        Input:
        <select
          className="ml-2 bg-black"
          onChange={selectInstrument}
          value={selectedInstrumentId}
        >
          {instruments.map((instrument) => (
            <option value={instrument.id} key={instrument.id}>
              {instrument.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Listen to channel: <input className="bg-black" type="number" name="inputChannel" id="" value={inputChannel} min="1" max="16" onChange={selectInputChannel} />
      </label>

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
  );
};

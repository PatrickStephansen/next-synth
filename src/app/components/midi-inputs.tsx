"use client";
import { useEffect, useState } from "react";

export const MidiInputs = ({}) => {
  const [instruments, setInstruments] = useState([] as MIDIInput[]);
  const [midiEvent, setMidiEvent] = useState([] as any[]);
  useEffect(() => {
    navigator.requestMIDIAccess().then(
      (midi) => {
        const inputs = [...midi.inputs.values()];
        if (inputs.length)
          inputs[0].onmidimessage = (event) => {
            console.log("midi message received", event);
            setMidiEvent(event.data);
          };
        setInstruments(inputs);
      },
      (failure) => {
        console.error("could not connect to midi devices", failure);
        setInstruments([]);
      }
    );
  }, []);
  const selectInstrument = (e) => {
    const selectedInput = instruments.find((i) => i.id == e.target.value);
    if (selectedInput)
      selectedInput.onmidimessage = (event) => {
        console.log("midi message received", event);
        setMidiEvent(event.data);
      };
  };
  return (
    <div>
      <label>
        Input:
        <select className="ml-2 bg-black" onChange={selectInstrument}>
          {instruments.map((instrument) => (
            <option value={instrument.id} key={instrument.id}>
              {instrument.name}
            </option>
          ))}
        </select>
      </label>

      <dl>
        <dt>status</dt>
        <dd>{midiEvent[0]}</dd>
        <dt>key number</dt>
        <dd>{midiEvent[1]}</dd>
        <dt>velocity</dt>
        <dd>{midiEvent[2]}</dd>
      </dl>
    </div>
  );
};

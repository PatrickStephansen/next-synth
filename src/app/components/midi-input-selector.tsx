"use client";
import { MidiEvent, midiEventFromBytes } from "@/lib/midi-input";
import { handleMidiEvent, initializeSignalChain, startAudioContext, stopAudioContext } from "@/lib/signal-chain";
import { ChangeEvent, useEffect, useState } from "react";

export const MidiInputSelector = ({}) => {
  const [instruments, setInstruments] = useState([] as MIDIInput[]);
  const [selectedInstrumentId, setSelectedInstrumentId] = useState("");
  const [inputChannel, setInputChannel] = useState(1);
  const [midiEvent, setMidiEvent] = useState({} as MidiEvent);
  const [isSoundOn, setSoundOn] = useState(false);
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
        initializeSignalChain();
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
        const parsedEvent = midiEventFromBytes((event as MIDIMessageEvent).data)
        setMidiEvent(parsedEvent);
        handleMidiEvent(parsedEvent, inputChannel);
      };
    setSelectedInstrumentId(id);
  };
  const selectInstrument = (e: ChangeEvent<HTMLSelectElement>) => {
    selectInstrumentById(e.target.value, instruments);
  };
  const selectInputChannel = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = +e.target.value;
    if (inputValue >= 1 && inputValue <= 16) {
      setInputChannel(inputValue);
    }
  };
  const toggleMute = (_) => {
    if (isSoundOn) {
      stopAudioContext().then(() => setSoundOn(false));
    } else {
      startAudioContext().then(() => setSoundOn(true));
    }
  };
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
        Listen to channel:
        <input
          className="ml-2 bg-black"
          type="number"
          name="inputChannel"
          id="input-channel"
          value={inputChannel}
          min="1"
          max="16"
          onChange={selectInputChannel}
        />
      </label>
      <label>
        <button type="button" onClick={toggleMute}>
          {isSoundOn ? "mute" : "unmute"}
        </button>
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

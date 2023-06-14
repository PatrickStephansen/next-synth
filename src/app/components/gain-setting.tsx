import { ChangeEvent, useCallback } from "react";

interface Props {
  setGain: (gain: number) => void;
  name: string;
  defaultGain: number;
}

const idFriendlyName = (name: string) => name.replace(/[^\w\d]/g, "-");

export const GainSetting = ({ setGain, name, defaultGain }: Props) => (
  <label className="flex items-center">
    {name}:
    <input
      className="m-2 p-2 border rounded bg-black"
      type="range"
      step="0.01"
      min="0"
      max="1"
      list={idFriendlyName(name) + "-gain-list"}
      defaultValue={defaultGain}
      onChange={useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
          const numberValue = +e.target?.value;
          if (numberValue >= 0 && numberValue <= 2) setGain(numberValue);
        },
        [setGain]
      )}
    />
    <datalist id={idFriendlyName(name) + "-gain-list"}>
      <option value="0" label="off"></option>
      <option value="0.2" label="recommended"></option>
      <option value="1" label="full"></option>
    </datalist>
  </label>
);

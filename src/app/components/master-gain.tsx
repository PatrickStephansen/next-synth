import { ChangeEvent, useCallback } from "react";

interface Props {
  setMasterGain: (gain: number)=> void
}

export const MasterGain = ({ setMasterGain }: Props) => (
  <label>
    Master gain:
    <input
      className="m-2 p-2 border rounded bg-black"
      type="number"
      step="0.01"
      min="0"
      max="2"
      defaultValue="0.2"
      onChange={useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
          const numberValue = +e.target?.value
          if (numberValue >= 0 && numberValue <= 2)
            setMasterGain(numberValue);
        },
        [setMasterGain]
      )}
    />
  </label>
);

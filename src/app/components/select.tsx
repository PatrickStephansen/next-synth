import { ChangeEvent, useCallback } from "react";

export interface Option {
  value: string;
  key?: string | number;
  displayName: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  label: string
}

export const Select = ({ value, onChange, options, label }: Props) => {
  return (
    <label>
      {label}:
      <select
        className="m-2 p-2 bg-black border rounded"
        onChange={useCallback(
          (e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value),
          [onChange]
        )}
        value={value}
      >
        {options.map((option) => (
          <option value={option.value} key={option.key ?? option.value}>
            {option.displayName}
          </option>
        ))}
      </select>
    </label>
  );
};

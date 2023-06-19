import { ChangeEvent } from "react";

interface Props {
  label: string;
  value?: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  step: number;
  min: number;
  max: number;
}

export const NumberInput = ({ label, value, onChange, step, min, max }: Props) => (
  <label className="flex items-center">
    {label}
    <input
      className="rounded border m-2 accent-cyan-500"
      type="range"
      title={value?.toFixed(3)}
      value={value}
      onChange={onChange}
      step={step}
      min={min}
      max={max}
    />
  </label>
);

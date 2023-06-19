import { PointerEvent } from "react";

interface Props {
  x: number;
  y: number;
  onGrab: (event: PointerEvent<SVGCircleElement>) => void;
}

export const SvgControlHandle = ({ x, y, onGrab }: Props) => (
  <circle
    className="stroke-white stroke-1 cursor-grab"
    vectorEffect="non-scaling-stroke"
    cx={x}
    cy={y}
    r="3%"
    onPointerDown={onGrab}
  />
);

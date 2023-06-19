import { EnvelopeParameters, ParameterMap, Voice } from "@/lib/signal-chain";
import { PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { NumberInput } from "./number-input";
import { SvgControlHandle } from "./svg-control-handle";

const height = 200;
const width = 500;

interface KeyEnvelopState {
  stage: "rest" | "attack" | "hold" | "decay" | "sustain" | "release";
  stageProgress: number;
  totalProgress: number;
  outputVelocity: number;
  keyVelocity: number;
  key: string;
}

interface Props {
  voices: Voice[];
  envelopeType: "gain";
  updateParameters: (
    envelopeType: keyof Voice["envelopes"]
  ) => (parameters: ParameterMap) => void;
}

type ControlPointActive = "none" | "attack" | "hold" | "decay" | "release";

export const EnvelopeVisualizer = ({
  voices,
  envelopeType,
  updateParameters,
}: Props) => {
  const [envelopeParams, setEnvelopeParams] = useState({
    attackTime: 0.001,
    attackValue: 1,
    holdTime: 0.0625,
    decayTime: 0.125,
    sustainValue: 0.25,
    releaseTime: 0.25,
  } as EnvelopeParameters);

  const [activeKeys, setActiveKeys] = useState([] as KeyEnvelopState[]);
  const envelopeElement = useRef<SVGSVGElement>(null);
  const [controlPoint, setControlPoint] = useState<ControlPointActive>("none");
  const [envelopeTypeDisplay, setEnvelopeTypeDisplay] = useState("");

  useEffect(() => {
    setEnvelopeTypeDisplay(envelopeType.replace(/^./, (m) => m.toUpperCase()));
    let keys = new Array(voices.length);
    voices.forEach((v, voiceIndex) =>
      v.envelopes[envelopeType].setEnvelopeStateUpdateCallback((state) => {
        keys[voiceIndex] = {
          stage: state.stage,
          stageProgress: state.stageProgress,
          key: voiceIndex.toString(),
          outputVelocity: state.outputValue,
          keyVelocity: v.envelopes[envelopeType].envelopeGain.gain.value,
          totalProgress:
            state.stage === "attack"
              ? state.stageProgress * state.parameters.attackTime
              : state.stage === "hold"
              ? state.parameters.attackTime +
                state.stageProgress * state.parameters.holdTime
              : state.stage === "decay"
              ? state.parameters.attackTime +
                state.parameters.holdTime +
                state.stageProgress * state.parameters.decayTime
              : state.stage === "sustain"
              ? state.parameters.attackTime +
                state.parameters.holdTime +
                state.parameters.decayTime +
                state.stageProgress
              : state.stage === "release"
              ? state.parameters.attackTime +
                state.parameters.holdTime +
                state.parameters.decayTime +
                1 +
                state.stageProgress * state.parameters.releaseTime
              : -1,
        } as KeyEnvelopState;
        if (voiceIndex === voices.length - 1) {
          setEnvelopeParams(state.parameters);
          setActiveKeys(keys);
        }
      })
    );
    const nextFrame = () => {
      voices.forEach((v) => v.envelopes[envelopeType].requestState());
      requestAnimationFrame(nextFrame);
    };
    nextFrame();
  }, [voices, envelopeType, setActiveKeys, setEnvelopeParams]);

  const attackPoint = {
    x: envelopeParams.attackTime,
    y: 1 - envelopeParams.attackValue,
  };
  const holdPoint = {
    x: envelopeParams.attackTime + envelopeParams.holdTime,
    y: 1 - envelopeParams.attackValue,
  };
  const decayPoint = {
    x:
      envelopeParams.attackTime +
      envelopeParams.holdTime +
      envelopeParams.decayTime,
    y: 1 - envelopeParams.sustainValue,
  };
  const releasePoint = {
    x:
      envelopeParams.attackTime +
      envelopeParams.holdTime +
      envelopeParams.decayTime +
      1,
    y: 1 - envelopeParams.sustainValue,
  };
  const viewWidth =
    envelopeParams.attackTime +
    envelopeParams.holdTime +
    envelopeParams.decayTime +
    envelopeParams.releaseTime +
    1;

  const grabControlPoint =
    (controlPoint: ControlPointActive) =>
    (event: PointerEvent<SVGCircleElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (envelopeElement.current) {
        envelopeElement.current?.setPointerCapture(event.pointerId);
      }
      setControlPoint(controlPoint);
    };

  const releaseControlPoint = (event: PointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    event.stopPropagation();
    envelopeElement.current?.releasePointerCapture(event.pointerId);
    setControlPoint("none");
  };

  const movePoint = (event: PointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    event.stopPropagation();
    switch (controlPoint) {
      case "attack":
        updateParameters(envelopeType)({
          attackTime: +event.nativeEvent.offsetX / width,
          attackValue: 1 - event.nativeEvent.offsetY / height,
        });
        break;
      case "hold":
        updateParameters(envelopeType)({
          holdTime: event.nativeEvent.offsetX / width - attackPoint.x,
          attackValue: 1 - event.nativeEvent.offsetY / height,
        });
        break;
      case "decay":
        updateParameters(envelopeType)({
          decayTime: event.nativeEvent.offsetX / width - holdPoint.x,
          sustainValue: 1 - event.nativeEvent.offsetY / height,
        });
        break;
      case "release":
        updateParameters(envelopeType)({
          releaseTime: (width - event.nativeEvent.offsetX) / width,
          sustainValue: 1 - event.nativeEvent.offsetY / height,
        });
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <h2>{envelopeTypeDisplay} Envelope</h2>
      <svg
        version="1.2"
        viewBox={`0 0 ${viewWidth} 1`}
        height={height}
        width={width}
        ref={envelopeElement}
        onPointerUp={releaseControlPoint}
        onPointerMove={movePoint}
        className={controlPoint !== "none" ? "cursor-grabbing" : ""}
      >
        <path
          className="stroke-white stroke-1"
          strokeLinecap="round"
          shapeRendering="crisp-edges"
          vectorEffect="non-scaling-stroke"
          d={`M0 1 L${attackPoint.x} ${attackPoint.y} L${holdPoint.x} ${holdPoint.y} L${decayPoint.x} ${decayPoint.y} L${releasePoint.x} ${releasePoint.y} L${viewWidth} 1`}
        />
        <SvgControlHandle
          key="attack"
          x={attackPoint.x}
          y={attackPoint.y}
          onGrab={grabControlPoint("attack")}
        />
        <SvgControlHandle
          key="hold"
          x={holdPoint.x}
          y={holdPoint.y}
          onGrab={grabControlPoint("hold")}
        />
        <SvgControlHandle
          key="decay"
          x={decayPoint.x}
          y={decayPoint.y}
          onGrab={grabControlPoint("decay")}
        />
        <SvgControlHandle
          key="release"
          x={releasePoint.x}
          y={releasePoint.y}
          onGrab={grabControlPoint("release")}
        />
        {activeKeys
          .filter((k) => k.stage !== "rest")
          .map((k) => (
            <g key={k.key} className="stroke-cyan-500 fill-cyan-500 stroke-1">
              <circle
                vectorEffect="non-scaling-stroke"
                cx={k.totalProgress}
                cy={1 - k.outputVelocity}
                r="2%"
              />
            </g>
          ))}
      </svg>
      <NumberInput
        label="Attack Time"
        value={envelopeParams.attackTime}
        onChange={useCallback(
          (e) =>
            updateParameters(envelopeType)({ attackTime: +e.target.value }),
          [updateParameters]
        )}
        min={0}
        max={10}
        step={0.001}
      />
      <NumberInput
        label="Attack Value"
        value={envelopeParams.attackValue}
        onChange={useCallback(
          (e) =>
            updateParameters(envelopeType)({ attackValue: +e.target.value }),
          [updateParameters]
        )}
        min={0}
        max={1}
        step={0.01}
      />
      <NumberInput
        label="Hold Time"
        value={envelopeParams.holdTime}
        onChange={useCallback(
          (e) => updateParameters(envelopeType)({ holdTime: +e.target.value }),
          [updateParameters]
        )}
        min={0}
        max={10}
        step={0.001}
      />
      <NumberInput
        label="Decay Time"
        value={envelopeParams.decayTime}
        onChange={useCallback(
          (e) => updateParameters(envelopeType)({ decayTime: +e.target.value }),
          [updateParameters]
        )}
        min={0}
        max={10}
        step={0.001}
      />
      <NumberInput
        label="Sustain Value"
        value={envelopeParams.sustainValue}
        onChange={useCallback(
          (e) =>
            updateParameters(envelopeType)({ sustainValue: +e.target.value }),
          [updateParameters]
        )}
        min={0}
        max={1}
        step={0.01}
      />
      <NumberInput
        label="Release Time"
        value={envelopeParams.releaseTime}
        onChange={useCallback(
          (e) =>
            updateParameters(envelopeType)({ releaseTime: +e.target.value }),
          [updateParameters]
        )}
        min={0}
        max={10}
        step={0.001}
      />
    </div>
  );
};

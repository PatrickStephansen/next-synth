import { EnvelopeParameters, ParameterMap, Voice } from "@/lib/signal-chain";
import { PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { NumberInput } from "./number-input";
import { SvgControlHandle } from "./svg-control-handle";
import { ControlHeading } from "./control-heading";

const height = 200;
const width = 800;
const viewWidth = width / height;
const totalSeconds = 22;
const secondsPerUnit = totalSeconds / viewWidth;

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
                state.stageProgress *
                  (totalSeconds -
                    (state.parameters.attackTime +
                      state.parameters.holdTime +
                      state.parameters.decayTime +
                      state.parameters.releaseTime))
              : state.stage === "release"
              ? state.parameters.attackTime +
                state.parameters.holdTime +
                state.parameters.decayTime +
                (totalSeconds -
                  (state.parameters.attackTime +
                    state.parameters.holdTime +
                    state.parameters.decayTime +
                    state.parameters.releaseTime)) +
                state.parameters.releaseTime * state.stageProgress
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
    x: envelopeParams.attackTime / secondsPerUnit,
    y: 1 - envelopeParams.attackValue,
  };
  const holdPoint = {
    x: (envelopeParams.attackTime + envelopeParams.holdTime) / secondsPerUnit,
    y: 1 - envelopeParams.attackValue,
  };
  const decayPoint = {
    x:
      (envelopeParams.attackTime +
        envelopeParams.holdTime +
        envelopeParams.decayTime) /
      secondsPerUnit,
    y: 1 - envelopeParams.sustainValue,
  };
  const releasePoint = {
    x: (totalSeconds - envelopeParams.releaseTime) / secondsPerUnit,
    y: 1 - envelopeParams.sustainValue,
  };

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
          attackTime: (totalSeconds * event.nativeEvent.offsetX) / width,
          attackValue: 1 - event.nativeEvent.offsetY / height,
        });
        break;
      case "hold":
        updateParameters(envelopeType)({
          holdTime:
            (totalSeconds * event.nativeEvent.offsetX) / width -
            attackPoint.x * secondsPerUnit,
          attackValue: 1 - event.nativeEvent.offsetY / height,
        });
        break;
      case "decay":
        updateParameters(envelopeType)({
          decayTime:
            (totalSeconds * event.nativeEvent.offsetX) / width -
            holdPoint.x * secondsPerUnit,
          sustainValue: 1 - event.nativeEvent.offsetY / height,
        });
        break;
      case "release":
        updateParameters(envelopeType)({
          releaseTime:
            totalSeconds * ((width - event.nativeEvent.offsetX) / width),
          sustainValue: 1 - event.nativeEvent.offsetY / height,
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="col-span-3">
      <ControlHeading>{envelopeTypeDisplay} Envelope</ControlHeading>
      <svg
        version="1.2"
        viewBox={`0 0 ${viewWidth} 1`}
        height={height}
        width={width}
        ref={envelopeElement}
        onPointerUp={releaseControlPoint}
        onPointerMove={movePoint}
        preserveAspectRatio="xMidYMid meet"
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
                cx={k.totalProgress / secondsPerUnit}
                cy={1 - k.outputVelocity}
                r="1%"
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
        max={5}
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
        max={5}
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
        max={5}
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
        max={5}
        step={0.001}
      />
    </div>
  );
};

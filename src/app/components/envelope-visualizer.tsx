import { EnvelopeParameters, ParameterMap, Voice } from "@/lib/signal-chain";
import { useCallback, useEffect, useRef, useState } from "react";
import { NumberInput } from "./number-input";

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

  useEffect(() => {
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
  }, [voices, envelopeType]);

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

  return (
    <div>
      <svg
        version="1.2"
        viewBox={`0 0 ${viewWidth} 1`}
        height={height}
        width={width}
        ref={envelopeElement}
      >
        <path
          className="stroke-white stroke-1"
          strokeLinecap="round"
          shapeRendering="crisp-edges"
          vectorEffect="non-scaling-stroke"
          d={`M0 1 L${attackPoint.x} ${attackPoint.y} L${holdPoint.x} ${holdPoint.y} L${decayPoint.x} ${decayPoint.y} L${releasePoint.x} ${releasePoint.y} L${viewWidth} 1`}
        />
        <circle
          key="attack"
          className="stroke-white stroke-1"
          vectorEffect="non-scaling-stroke"
          cx={attackPoint.x}
          cy={attackPoint.y}
          r="2%"
        />
        <circle
          key="hold"
          className="stroke-white stroke-1"
          vectorEffect="non-scaling-stroke"
          cx={holdPoint.x}
          cy={holdPoint.y}
          r="2%"
        />
        <circle
          key="decay"
          className="stroke-white stroke-1"
          vectorEffect="non-scaling-stroke"
          cx={decayPoint.x}
          cy={decayPoint.y}
          r="2%"
        />
        <circle
          key="release"
          className="stroke-white stroke-1"
          vectorEffect="non-scaling-stroke"
          cx={releasePoint.x}
          cy={releasePoint.y}
          r="2%"
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

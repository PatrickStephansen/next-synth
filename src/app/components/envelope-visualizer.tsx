"use client";
import { keyNumberToNoteName } from "@/lib/midi-input";
import { EnvelopeParameters, Voice } from "@/lib/signal-chain";
import { useEffect, useState } from "react";

const height = 200;
const width = 500;

interface KeyEnvelopState {
  stage: "rest" | "attack" | "hold" | "decay" | "sustain" | "release";
  stageProgress: number;
  totalProgress: number;
  keyNumber: number;
  noteName: string;
  velocity: number;
  key: string;
}

export const EnvelopeVisualizer = ({
  voices,
  envelopeType,
}: {
  voices: Voice[];
  envelopeType: "gain";
}) => {
  const [envelopeParams, setEnvelopeParams] = useState({
    attackTime: 0.001,
    attackValue: 1,
    holdTime: 0.0625,
    decayTime: 0.125,
    sustainValue: 0.25,
    releaseTime: 0.25,
  } as EnvelopeParameters);

  const [activeKeys, setActiveKeys] = useState([] as KeyEnvelopState[]);

  useEffect(() => {
    let keys = new Array(voices.length);
    voices.forEach((v, voiceIndex) =>
      v.envelopes[envelopeType].setEnvelopeStateUpdateCallback((state) => {
        const keyState = {
          stage: state.stage,
          stageProgress: state.stageProgress,
          keyNumber: v.note,
          noteName: v.note == null ? "no pitch" : keyNumberToNoteName(v.note),
          key: voiceIndex.toString(),
          velocity: state.outputValue,
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
        // keys needs to be reassigned at least once in the loop for change detection to work, so we can't just set a specific elemement.
        keys = keys
          .slice(0, voiceIndex)
          .concat(keyState)
          .concat(keys.slice(voiceIndex + 1));
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

  return (
    <div className="grid grid-cols-2 gap-4 place-content-center">
      <svg
        version="1.2"
        viewBox={`0 0 ${
          envelopeParams.attackTime +
          envelopeParams.holdTime +
          envelopeParams.decayTime +
          envelopeParams.releaseTime +
          1
        } 1`}
        height={height}
        width={width}
      >
        <line
          className="stroke-white stroke-1"
          strokeLinecap="round"
          shapeRendering="crisp-edges"
          vectorEffect="non-scaling-stroke"
          x1="0"
          x2={envelopeParams.attackTime}
          y1="1"
          y2={1 - envelopeParams.attackValue}
        ></line>
        <line
          className="stroke-white stroke-1"
          strokeLinecap="round"
          shapeRendering="crisp-edges"
          vectorEffect="non-scaling-stroke"
          x1={envelopeParams.attackTime}
          x2={envelopeParams.attackTime + envelopeParams.holdTime}
          y1={1 - envelopeParams.attackValue}
          y2={1 - envelopeParams.attackValue}
        ></line>
        <line
          className="stroke-white stroke-1"
          strokeLinecap="round"
          shapeRendering="crisp-edges"
          vectorEffect="non-scaling-stroke"
          x1={envelopeParams.attackTime + envelopeParams.holdTime}
          x2={
            envelopeParams.attackTime +
            envelopeParams.holdTime +
            envelopeParams.decayTime
          }
          y1={1 - envelopeParams.attackValue}
          y2={1 - envelopeParams.sustainValue}
        ></line>
        <line
          className="stroke-white stroke-1"
          strokeLinecap="round"
          shapeRendering="crisp-edges"
          vectorEffect="non-scaling-stroke"
          x1={
            envelopeParams.attackTime +
            envelopeParams.holdTime +
            envelopeParams.decayTime
          }
          x2={
            envelopeParams.attackTime +
            envelopeParams.holdTime +
            envelopeParams.decayTime +
            1
          }
          y1={1 - envelopeParams.sustainValue}
          y2={1 - envelopeParams.sustainValue}
        ></line>
        <line
          className="stroke-white stroke-1"
          strokeLinecap="round"
          shapeRendering="crisp-edges"
          vectorEffect="non-scaling-stroke"
          x1={
            envelopeParams.attackTime +
            envelopeParams.holdTime +
            envelopeParams.decayTime +
            1
          }
          x2={
            envelopeParams.attackTime +
            envelopeParams.holdTime +
            envelopeParams.decayTime +
            1 +
            envelopeParams.releaseTime
          }
          y1={1 - envelopeParams.sustainValue}
          y2="1"
        ></line>
        {activeKeys
          .filter((k) => k.stage !== "rest")
          .map((k) => (
            <g key={k.key} className="stroke-white stroke-1">
              <line
                strokeLinecap="round"
                shapeRendering="crisp-edges"
                vectorEffect="non-scaling-stroke"
                x1={k.totalProgress}
                x2={k.totalProgress}
                y1="0"
                y2="1"
              ></line>
              <circle
                vectorEffect="non-scaling-stroke"
                cx={k.totalProgress}
                cy={1 - k.velocity}
                r="1%"
              ></circle>
            </g>
          ))}
      </svg>
      <div>
        <h2>Inputs</h2>
        <ul>
          {activeKeys
            .filter((k) => k.stage !== "rest")
            .map((k) => (
              <li key={k.key}>
                {k.keyNumber}: {k.noteName}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

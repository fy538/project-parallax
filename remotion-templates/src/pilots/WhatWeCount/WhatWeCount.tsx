import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { fonts, layout, palette } from "../../design/theme";
import { anticipatoryReveal } from "../../utils/animation";
import { Link, Mind } from "../shared/scene";
import { NarrationTrack, StudyFrame } from "../shared/StudyFrame";
import { Grove } from "./Grove";
import { WhatWeCountProps } from "./schema";
import { BEAT_KEYS, BeatKey, buildPlantingEvents, buildTimeline, samplePlanting } from "./timeline";

const HEADLINES: Record<BeatKey, string> = {
  goal: "A living woodland. A measurable instruction.",
  rule: "One point for every planting.",
  plant: "For a moment, the measure works.",
  loophole: "The same tree. Another point.",
  repeat: "More points. No more forest.",
  diagnosis: "We rewarded an action. We wanted an outcome.",
  repair: "A better measure still leaves choices.",
  mirror: "Now look at our own measures.",
};
const META = { fontFamily: fonts.metadata, fontSize: 19, letterSpacing: 1.4 };
const GROVE_SIZE = 510;
const GROVE_Y = 620;

const Counter: React.FC<{ value: number; label: string; y: number; opacity: number; color: string; pulse: number }> = React.memo(function Counter({ value, label, y, opacity, color, pulse }) {
  return <g transform={`translate(760 ${y})`} opacity={opacity}>
    <text textAnchor="middle" fill={color} fontFamily={fonts.data} fontSize="82" fontWeight="500">{String(value).padStart(2, "0")}</text>
    <text y="37" textAnchor="middle" fill={palette.walnut} fontFamily={fonts.body} fontSize="25">{label}</text>
    <text x="94" y="-39" fill={palette.gold} fontFamily={fonts.metadata} fontSize="25" opacity={pulse}>+1</text>
  </g>;
});

export const WhatWeCount: React.FC<WhatWeCountProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeline = useMemo(() => buildTimeline(props, fps), [props.pauses, props.endingHoldSec, fps]);
  const cues = useMemo(() => Object.fromEntries(timeline.beats.map((b) => [b.key, b.start])) as Record<BeatKey, number>, [timeline]);
  const events = useMemo(() => buildPlantingEvents(timeline), [timeline]);
  const state = useMemo(() => samplePlanting(frame, events), [frame, events]);
  const reveal = (key: BeatKey) => anticipatoryReveal(frame, cues[key]);
  const rule = reveal("rule");
  const diagnosis = reveal("diagnosis");
  const repair = reveal("repair");
  const mirror = reveal("mirror");
  const metrics = rule * (1 - repair);
  const forestX = props.positions.forestX;
  const forestLeft = forestX - GROVE_SIZE / 2;
  const captions = timeline.beats.map((beat, i) => ({
    key: beat.key, text: HEADLINES[beat.key],
    opacity: reveal(beat.key) * (timeline.beats[i + 1] ? 1 - reveal(timeline.beats[i + 1].key) : 1),
  }));

  return <>
    <NarrationTrack beats={timeline.beats} volume={props.narrationVolume} />
    <StudyFrame title={props.title} number="002" topic="INTENT · INCENTIVES" captions={captions} progress={BEAT_KEYS.map(reveal)}>
      <div style={{ position: "absolute", left: forestLeft, top: GROVE_Y - GROVE_SIZE / 2, width: GROVE_SIZE, height: GROVE_SIZE, borderRadius: "50%", overflow: "hidden", outline: `1px solid ${palette.taupe}`, outlineOffset: 12 }}>
        <Grove state={state} />
      </div>
      <svg width={layout.width} height={layout.height} style={{ position: "absolute", inset: 0 }}>
        <Link from={{ x: props.positions.machineX + 89, y: 595 }} to={{ x: forestLeft - 15, y: 650 }} progress={reveal("goal")} opacity={1 - mirror} color={palette.gold} />
        <Mind position={{ x: props.positions.machineX, y: 595 }} label={props.labels.machine} note="follows the reward" opacity={1 - repair * 0.35} accent={palette.walnut} />
        <text x={forestX} y="332" textAnchor="middle" fill={palette.walnut} fontFamily={fonts.serifBody} fontSize="30">“{props.labels.goal}”</text>
        <text x={forestX} y="927" textAnchor="middle" fill={palette.ink} fontFamily={fonts.body} fontSize="30">{props.labels.forest}</text>
        <text x={forestX} y="959" textAnchor="middle" fill={palette.umber} fontFamily={fonts.metadata} fontSize="18">{state.totalTrees} trees here · 4 at the start</text>

        <g opacity={metrics}>
          <text x="760" y="378" textAnchor="middle" fill={palette.umber} style={META}>REWARD RULE</text>
          <text x="760" y="421" textAnchor="middle" fill={palette.walnut} fontFamily={fonts.serifBody} fontSize="30">{props.labels.reward}</text>
        </g>
        <Counter value={state.score} label="planting events" y={538} opacity={metrics} color={palette.walnut} pulse={state.pulse} />
        <Counter value={state.added} label="new trees" y={777} opacity={metrics} color={palette.ink} pulse={state.active?.kind === "new" || state.score <= 4 ? state.pulse : 0} />
        <g opacity={diagnosis * (1 - repair)}>
          <path d="M622 590 H898 M622 823 H898" fill="none" stroke={palette.gold} strokeWidth="2" />
          <text x="983" y="638" textAnchor="middle" fontFamily={fonts.serifBody} fontSize="55" fill={palette.walnut}>≠</text>
        </g>
        <g opacity={repair * (1 - mirror)}>
          <text x="760" y="408" textAnchor="middle" fill={palette.umber} style={META}>A BETTER MEASURE?</text>
          <text x="760" y="488" textAnchor="middle" fill={palette.ink} fontFamily={fonts.serifBody} fontSize="42">New trees</text>
          <text x="760" y="543" textAnchor="middle" fill={palette.ink} fontFamily={fonts.serifBody} fontSize="42">that survive.</text>
          <text x="760" y="726" textAnchor="middle" fill={palette.walnut} fontFamily={fonts.body} fontSize="28">Which trees?</text>
          <text x="760" y="770" textAnchor="middle" fill={palette.walnut} fontFamily={fonts.body} fontSize="28">What kind of forest?</text>
          <text x="760" y="814" textAnchor="middle" fill={palette.walnut} fontFamily={fonts.body} fontSize="28">At what cost?</text>
        </g>
        <g opacity={mirror}>
          <text x="760" y="476" textAnchor="middle" fill={palette.ink} fontFamily={fonts.serifBody} fontSize="39">What we count</text>
          <path d="M760 514 V558 M760 675 V719" fill="none" stroke={palette.taupe} strokeWidth="1.5" />
          <text x="760" y="641" textAnchor="middle" fill={palette.walnut} fontFamily={fonts.serifBody} fontSize="68">?</text>
          <text x="760" y="780" textAnchor="middle" fill={palette.ink} fontFamily={fonts.serifBody} fontSize="39">What we value</text>
        </g>
      </svg>
      <div style={{ position: "absolute", left: 100, top: 913, fontFamily: fonts.serifBody, fontSize: 31, color: palette.walnut, opacity: diagnosis * (1 - repair) }}>Specification gaming</div>
      <div style={{ position: "absolute", left: 100, top: 913, fontFamily: fonts.serifBody, fontSize: 31, color: palette.walnut, opacity: mirror }}>Who decides what counts as progress?</div>
    </StudyFrame>
  </>;
};

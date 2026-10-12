import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { fonts, layout, palette } from "../design/theme";
import { anticipatoryReveal } from "../utils/animation";
import { Grove } from "../pilots/WhatWeCount/Grove";
import { PlantingEvent, samplePlanting } from "../pilots/WhatWeCount/timeline";
import audio from "../pilots/WhatWeCount/audio-manifest.json";
import { NarrationTrack, StudyFrame } from "../pilots/shared/StudyFrame";
import { buildNarratedTimeline } from "../pilots/shared/timeline";
import { IllustratedGrove } from "./IllustratedGrove";

/** Shared narration and event trace for the illustration and code comparisons. */
const KEYS = ["goal", "rule", "plant", "loophole", "repeat", "diagnosis"] as const;
type Key = (typeof KEYS)[number];
const PAUSES: Record<Key, number> = {
  goal: 0.4,
  rule: 0.25,
  plant: 0.25,
  loophole: 0.25,
  repeat: 0.25,
  diagnosis: 0.35,
};
const timeline = buildNarratedTimeline(KEYS, audio, PAUSES, 1, layout.fps);
const beats = Object.fromEntries(timeline.beats.map((beat) => [beat.key, beat])) as Record<Key, (typeof timeline.beats)[number]>;

const makeEvents = (kind: PlantingEvent["kind"], count: number, start: number, end: number): PlantingEvent[] => {
  const span = (end - start) / count;
  return Array.from({ length: count }, (_, i) => ({
    kind,
    treeId: kind === "new" ? i + 4 : 7,
    start: Math.round(start + i * span),
    end: Math.round(start + (i + 1) * span),
  }));
};

const EVENTS: PlantingEvent[] = [
  ...makeEvents("new", 4, beats.plant.start, beats.plant.start + Math.round(beats.plant.durationInFrames * 0.55)),
  ...makeEvents("replant", 4, beats.loophole.start, beats.loophole.end),
  ...makeEvents("replant", 4, beats.repeat.start, beats.repeat.end),
];

const HEADLINES: Record<Key, string> = {
  goal: "The goal is a living forest.",
  rule: "The reward counts planting events.",
  plant: "At first, the measure works.",
  loophole: "The same tree can be planted again.",
  repeat: "The score rises. The forest does not.",
  diagnosis: "An action is not the outcome we wanted.",
};

export const FOREST_ARGUMENT_DURATION = timeline.durationInFrames;

export const ForestArgumentStudy: React.FC<{ artwork: "illustrated" | "code" | "cutout" }> = ({ artwork }) => {
  const frame = useCurrentFrame();
  const reveal = (key: Key) => anticipatoryReveal(frame, beats[key].start);
  const state = samplePlanting(frame, EVENTS);
  // The generated forest has more saplings than the toy model's counted events.
  // Use it to establish the situation; all exact counts stay with the code grove.
  const illustrativeBeat = frame < beats.plant.start;
  const showIllustration = artwork === "illustrated" && illustrativeBeat;
  const showMetrics = frame >= beats.plant.start;
  const diagnosis = reveal("diagnosis");
  const captions = KEYS.map((key, i) => ({
    key,
    text: HEADLINES[key],
    opacity: reveal(key) * (KEYS[i + 1] ? 1 - reveal(KEYS[i + 1]) : 1),
  }));

  return <>
    <NarrationTrack beats={timeline.beats} volume={1} />
    <StudyFrame
      title="When the score becomes the goal"
      number="002"
      topic="INTENT · INCENTIVES"
      captions={captions}
      progress={KEYS.map(reveal)}
    >
      <div style={{ position: "absolute", left: 96, top: 328, width: 1080, height: 608, overflow: "hidden", backgroundColor: palette.bone, border: `1px solid ${palette.taupe}` }}>
        {artwork === "cutout" ? <IllustratedGrove state={state} /> : showIllustration ? <Img
          src={staticFile("style-lab/constructivist-forest-score-v2.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        /> : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 608, height: 608 }}><Grove state={state} /></div>
        </div>}
        <div style={{ position: "absolute", left: 22, bottom: 18, padding: "8px 12px", backgroundColor: palette.paper, color: palette.umber, fontFamily: fonts.metadata, fontSize: 15, letterSpacing: 1.3 }}>
          {showIllustration ? "EDITORIAL ILLUSTRATION" : artwork === "cutout" ? "COUNTED PLOT · 4 TREES AT START" : "AUTHORED TOY EXAMPLE"}
        </div>
      </div>

      <div style={{ position: "absolute", left: 1238, top: 332, width: 580, color: palette.ink }}>
        <div style={{ fontFamily: fonts.metadata, fontSize: 19, letterSpacing: 1.8, color: palette.umber }}>{frame < beats.rule.start ? "THE QUESTION" : "THE RULE"}</div>
        <div style={{ marginTop: 18, fontFamily: fonts.serifBody, fontSize: 43, lineHeight: 1.14 }}>
          {frame < beats.rule.start ? <>What would count<br />as progress?</> : <>One point for<br />every planting.</>}
        </div>
        <div style={{ marginTop: 42, height: 1, backgroundColor: palette.taupe }} />
        <div style={{ marginTop: 34, opacity: showMetrics ? 1 : 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontFamily: fonts.data, fontSize: 98, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: palette.walnut }}>{String(state.score).padStart(2, "0")}</span>
            <span style={{ fontFamily: fonts.body, fontSize: 40 }}>planting events</span>
          </div>
          <div style={{ marginTop: 34, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontFamily: fonts.data, fontSize: 98, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{String(state.added).padStart(2, "0")}</span>
            <span style={{ fontFamily: fonts.body, fontSize: 40 }}>new trees</span>
          </div>
        </div>
        <div style={{ marginTop: 28, height: 1, backgroundColor: palette.taupe }} />
        <div style={{ marginTop: 31, opacity: diagnosis, fontFamily: fonts.serifBody, fontSize: 32, lineHeight: 1.2, color: palette.walnut }}>
          We rewarded an action.<br />We wanted an outcome.
        </div>
      </div>
    </StudyFrame>
  </>;
};

export const ForestArgumentHybrid: React.FC = () => <ForestArgumentStudy artwork="illustrated" />;
export const ForestArgumentCode: React.FC = () => <ForestArgumentStudy artwork="code" />;
export const ForestArgumentCutout: React.FC = () => <ForestArgumentStudy artwork="cutout" />;

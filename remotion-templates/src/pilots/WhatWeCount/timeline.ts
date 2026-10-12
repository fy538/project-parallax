import { CalculateMetadataFunction } from "remotion";
import { layout, timing } from "../../design/theme";
import { buildNarratedTimeline } from "../shared/timeline";
import audio from "./audio-manifest.json";
import { WhatWeCountProps, whatWeCountSchema } from "./schema";

export const BEAT_KEYS = ["goal", "rule", "plant", "loophole", "repeat", "diagnosis", "repair", "mirror"] as const;
export type BeatKey = (typeof BEAT_KEYS)[number];

export function buildTimeline(props: Pick<WhatWeCountProps, "pauses" | "endingHoldSec">, fps = layout.fps) {
  return buildNarratedTimeline(BEAT_KEYS, audio, props.pauses, props.endingHoldSec, fps);
}

export const whatWeCountMetadata: CalculateMetadataFunction<WhatWeCountProps> = ({ props }) => {
  whatWeCountSchema.parse(props);
  return { durationInFrames: buildTimeline(props).durationInFrames };
};

export type PlantingEvent = { kind: "new" | "replant"; treeId: number; start: number; end: number };

/** Authored demonstration, not a trained agent: 4 new trees, then 8 replants. */
export function buildPlantingEvents(timeline: ReturnType<typeof buildTimeline>): PlantingEvent[] {
  const cue = Object.fromEntries(timeline.beats.map((b) => [b.key, b])) as Record<BeatKey, (typeof timeline.beats)[number]>;
  const run = (kind: PlantingEvent["kind"], count: number, start: number, end: number): PlantingEvent[] => {
    const span = (end - start) / count;
    return Array.from({ length: count }, (_, i) => ({
      kind, treeId: kind === "new" ? i + 4 : 7,
      start: Math.round(start + i * span),
      end: Math.round(start + (i + 1) * span),
    }));
  };
  return [
    ...run("new", 4, cue.plant.start, cue.plant.start + Math.round(cue.plant.durationInFrames * 0.55)),
    ...run("replant", 4, cue.loophole.start, cue.loophole.end),
    ...run("replant", 4, cue.repeat.start, cue.repeat.end),
  ];
}

/** Counters and tree positions read the same trace, including after seeking backwards. */
export function samplePlanting(frame: number, events: readonly PlantingEvent[]) {
  const completed = events.filter((e) => frame >= e.end);
  const active = events.find((e) => frame >= e.start && frame < e.end);
  const added = completed.filter((e) => e.kind === "new").length;
  const progress = active ? (frame - active.start) / (active.end - active.start) : 0;
  // A smooth lift-and-return, with zero velocity at both endpoints.
  const lift = active ? Math.sin(Math.PI * progress) ** 2 : 0;
  const last = completed[completed.length - 1];
  const pulse = last ? Math.max(0, 1 - (frame - last.end) / timing.entrance.slow) : 0;
  return { score: completed.length, added, totalTrees: 4 + added, active, progress, lift, pulse };
}

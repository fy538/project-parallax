import { CalculateMetadataFunction } from "remotion";
import { layout } from "../../design/theme";
import audio from "./audio-manifest.json";
import { promiseAndCopySchema, PromiseAndCopyProps } from "./schema";
import { buildNarratedTimeline } from "../shared/timeline";

export const BEAT_KEYS = ["promise", "copy", "question", "possibility", "human", "closing"] as const;
export type BeatKey = (typeof BEAT_KEYS)[number];

/** Measured clips + editable pauses. Rounding UP prevents clipping a last syllable. */
export function buildTimeline(props: Pick<PromiseAndCopyProps, "pauses" | "endingHoldSec">, fps = layout.fps) {
  return buildNarratedTimeline(BEAT_KEYS, audio, props.pauses, props.endingHoldSec, fps);
}

export const promiseAndCopyMetadata: CalculateMetadataFunction<PromiseAndCopyProps> = ({ props }) => {
  promiseAndCopySchema.parse(props);
  return { durationInFrames: buildTimeline(props).durationInFrames };
};

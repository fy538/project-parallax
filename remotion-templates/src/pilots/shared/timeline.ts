export type NarrationClip = { src: string; durationSec: number };

/** Shared by both pilots: audio and visual cues are generated in one pass. */
export function buildNarratedTimeline<Key extends string>(
  keys: readonly Key[],
  audio: Record<Key, NarrationClip>,
  pauses: Record<Key, number>,
  endingHoldSec: number,
  fps: number,
) {
  let cursor = 0;
  const beats = keys.map((key) => {
    const durationInFrames = Math.ceil(audio[key].durationSec * fps);
    const start = cursor + Math.round(pauses[key] * fps);
    const beat = { key, start, end: start + durationInFrames, durationInFrames, src: audio[key].src };
    cursor = beat.end;
    return beat;
  });
  return { beats, durationInFrames: cursor + Math.round(endingHoldSec * fps) };
}

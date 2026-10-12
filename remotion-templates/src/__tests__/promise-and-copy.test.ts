import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildTimeline, BEAT_KEYS } from "../pilots/PromiseAndCopy/timeline";
import { promiseAndCopySchema } from "../pilots/PromiseAndCopy/schema";
import audio from "../pilots/PromiseAndCopy/audio-manifest.json";
import narration from "../pilots/PromiseAndCopy/narration.json";

const timing = {
  pauses: { promise: 1.2, copy: 1.8, question: 1.8, possibility: 1.5, human: 1.8, closing: 1.8 },
  endingHoldSec: 3,
};

describe("promise-and-copy authoring loop", () => {
  it("moves later narration and visuals together when one pause changes", () => {
    const before = buildTimeline(timing);
    const after = buildTimeline({ ...timing, pauses: { ...timing.pauses, question: 3.8 } });
    expect(after.beats.slice(0, 2)).toEqual(before.beats.slice(0, 2));
    after.beats.slice(2).forEach((beat, i) => {
      expect(beat.start - before.beats[i + 2].start).toBe(60);
      expect(beat.end - before.beats[i + 2].end).toBe(60);
    });
    expect(after.durationInFrames - before.durationInFrames).toBe(60);
  });

  it("never overlaps or cuts a clip, including at other frame rates", () => {
    for (const fps of [24, 30, 60]) {
      const { beats, durationInFrames } = buildTimeline(timing, fps);
      beats.forEach((beat, i) => {
        expect(beat.durationInFrames / fps).toBeGreaterThanOrEqual(audio[beat.key].durationSec);
        expect(beat.start).toBeGreaterThan(i === 0 ? 0 : beats[i - 1].end);
      });
      expect(durationInFrames - beats[5].end).toBe(3 * fps);
    }
  });

  it("includes all six current script passages and actual RIFF audio assets", () => {
    expect(Object.keys(audio)).toEqual([...BEAT_KEYS]);
    for (const key of BEAT_KEYS) {
      expect(audio[key].text).toBe(narration[key]);
      expect(audio[key].durationSec).toBeGreaterThan(0);
      const header = readFileSync(join(process.cwd(), "public", audio[key].src));
      expect(header.subarray(0, 4).toString()).toBe("RIFF");
      expect(header.subarray(8, 12).toString()).toBe("WAVE");
    }
    const seconds = buildTimeline(timing).durationInFrames / 30;
    expect(seconds).toBeGreaterThanOrEqual(60);
    expect(seconds).toBeLessThanOrEqual(90);
  });

  it("rejects pauses that would erase the anticipatory reveal or create negative sequences", () => {
    expect(promiseAndCopySchema.shape.pauses.safeParse({ ...timing.pauses, copy: -1 }).success).toBe(false);
    expect(promiseAndCopySchema.shape.pauses.safeParse({ ...timing.pauses, copy: 0 }).success).toBe(false);
    expect(promiseAndCopySchema.shape.pauses.safeParse(timing.pauses).success).toBe(true);
  });
});

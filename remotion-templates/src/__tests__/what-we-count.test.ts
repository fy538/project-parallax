import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import audio from "../pilots/WhatWeCount/audio-manifest.json";
import narration from "../pilots/WhatWeCount/narration.json";
import { BEAT_KEYS, buildTimeline, buildPlantingEvents, samplePlanting } from "../pilots/WhatWeCount/timeline";

const settings = { pauses: { goal: 1.2, rule: 1.3, plant: 1.3, loophole: 1.6, repeat: 1.1, diagnosis: 1.8, repair: 1.8, mirror: 1.8 }, endingHoldSec: 3 };
const timeline = buildTimeline(settings);
const events = buildPlantingEvents(timeline);

describe("what-we-count demonstration", () => {
  it("counts every new planting and replant, but only new IDs enlarge the grove", () => {
    const planted = samplePlanting(events[3].end, events);
    expect([planted.score, planted.added, planted.totalTrees]).toEqual([4, 4, 8]);
    const replanted = samplePlanting(events[11].end, events);
    expect([replanted.score, replanted.added, replanted.totalTrees]).toEqual([12, 4, 8]);
    expect(new Set(events.slice(4).map((event) => event.treeId)).size).toBe(1);
  });
  it("awards a point on completion, not at lift-off, and seeks deterministically", () => {
    const event = events[4];
    expect(samplePlanting(event.start, events).score).toBe(4);
    expect(samplePlanting(event.end - 1, events).score).toBe(4);
    expect(samplePlanting(event.end, events).score).toBe(5);
    samplePlanting(timeline.durationInFrames, events);
    expect(samplePlanting(0, events)).toMatchObject({ score: 0, added: 0, totalTrees: 4, active: undefined });
  });
  it("retimes narration and its action trace together after a pause edit", () => {
    const revised = buildTimeline({ ...settings, pauses: { ...settings.pauses, loophole: 3.6 } });
    const laterEvents = buildPlantingEvents(revised);
    expect(laterEvents.slice(0, 4)).toEqual(events.slice(0, 4));
    laterEvents.slice(4).forEach((event, i) => {
      expect(event.start - events[i + 4].start).toBe(60);
      expect(event.end - events[i + 4].end).toBe(60);
    });
    expect(revised.durationInFrames - timeline.durationInFrames).toBe(60);
  });
  it("has monotonic, non-overlapping actions and narration", () => {
    events.forEach((event, i) => {
      expect(event.end).toBeGreaterThan(event.start);
      if (i) expect(event.start).toBeGreaterThanOrEqual(events[i - 1].end);
    });
    timeline.beats.forEach((beat, i) => {
      expect(beat.durationInFrames / 30).toBeGreaterThanOrEqual(audio[beat.key].durationSec);
      if (i) expect(beat.start).toBeGreaterThan(timeline.beats[i - 1].end);
    });
  });
  it("ships current narration, all WAVs, and a 60–90 second cut", () => {
    for (const key of BEAT_KEYS) {
      expect(audio[key].text).toBe(narration[key]);
      const file = readFileSync(join(process.cwd(), "public", audio[key].src));
      expect(file.subarray(0, 4).toString()).toBe("RIFF");
      expect(file.subarray(8, 12).toString()).toBe("WAVE");
    }
    expect(timeline.durationInFrames / 30).toBeGreaterThanOrEqual(60);
    expect(timeline.durationInFrames / 30).toBeLessThanOrEqual(90);
  });
});

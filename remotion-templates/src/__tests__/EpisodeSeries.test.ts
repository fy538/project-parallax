/**
 * Unit tests for the episode-series sequence math (L52).
 *
 * Tests the pure `computeSequenceProps` function — the component just renders
 * the result, so the offset logic is fully testable without React/Remotion.
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_CROSSFADE_FRAMES,
  computeSequenceProps,
  type EpisodeClip,
} from "../components/EpisodeSeries";

// A throwaway component is needed for the EpisodeClip type — the math doesn't touch it.
const Stub: React.FC<{ data: unknown }> = () => null;

const clip = (key: string, durationFrames: number): EpisodeClip => ({
  key,
  component: Stub,
  data: {},
  durationFrames,
});

describe("computeSequenceProps", () => {
  it("first clip has offset 0; subsequent clips offset by -DEFAULT_CROSSFADE_FRAMES", () => {
    const out = computeSequenceProps([
      clip("a", 90),
      clip("b", 60),
      clip("c", 120),
    ]);
    expect(out[0].offset).toBe(0);
    expect(out[1].offset).toBe(-DEFAULT_CROSSFADE_FRAMES);
    expect(out[2].offset).toBe(-DEFAULT_CROSSFADE_FRAMES);
  });

  it("preserves durationInFrames from each clip", () => {
    const out = computeSequenceProps([clip("a", 90), clip("b", 60)]);
    expect(out[0].durationInFrames).toBe(90);
    expect(out[1].durationInFrames).toBe(60);
  });

  it("uses provided clip key when present", () => {
    const out = computeSequenceProps([clip("custom-key", 30)]);
    expect(out[0].key).toBe("custom-key");
  });

  it("falls back to clip-N key when none provided", () => {
    const out = computeSequenceProps([
      { component: Stub, data: {}, durationFrames: 30 },
      { component: Stub, data: {}, durationFrames: 60 },
    ]);
    expect(out[0].key).toBe("clip-0");
    expect(out[1].key).toBe("clip-1");
  });

  it("respects custom crossfadeFrames", () => {
    const out = computeSequenceProps([clip("a", 30), clip("b", 30)], 8);
    expect(out[1].offset).toBe(-8);
  });

  it("zero crossfade produces back-to-back clips", () => {
    const out = computeSequenceProps([clip("a", 30), clip("b", 30)], 0);
    expect(out[0].offset).toBe(0);
    expect(out[1].offset).toBe(0);
  });

  it("empty clips array returns empty result", () => {
    expect(computeSequenceProps([])).toEqual([]);
  });

  it("single clip still has offset 0 (no overlap with anything)", () => {
    const out = computeSequenceProps([clip("solo", 90)]);
    expect(out).toHaveLength(1);
    expect(out[0].offset).toBe(0);
  });

  it("DEFAULT_CROSSFADE_FRAMES matches POLISH.md A7 (15 at 30fps)", () => {
    expect(DEFAULT_CROSSFADE_FRAMES).toBe(15);
  });
});

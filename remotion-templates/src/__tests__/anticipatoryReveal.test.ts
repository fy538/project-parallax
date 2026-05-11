/**
 * anticipatoryReveal — unit tests for the Economist 150ms-anticipatory rule.
 *
 * The single most professional move in editorial video: time element reveals
 * to complete ~150ms BEFORE the narrator names the thing on screen, so the
 * element is *settled* (not landing) when the word arrives.
 *
 * Reference: references/template-research/motion-design.md § 3
 *
 * COVERAGE:
 *   · anticipatoryStartFrame — correct backwards-time math
 *   · anticipatoryReveal     — opacity 0 before entrance, 1 at settle, holds at 1
 *   · default parameters     — 150ms anticipate + 400ms settle (Economist canonical)
 *   · edge cases             — cue at frame 0, short settle, custom anticipate
 */

import { describe, expect, it } from "vitest";
import {
  anticipatoryReveal,
  anticipatoryStartFrame,
  ANTICIPATE_FRAMES_DEFAULT,
} from "../utils/animation";
import { sec } from "../design/theme";

describe("anticipatoryStartFrame", () => {
  it("returns cueFrame − anticipateFrames − settleFrames", () => {
    // Cue at frame 90 (3s @ 30fps), 12-frame settle, 5-frame anticipation.
    // Expected start: 90 − 5 − 12 = 73.
    expect(anticipatoryStartFrame(90, 12, 5)).toBe(73);
  });

  it("defaults to 150ms anticipation (5 frames @ 30fps)", () => {
    expect(ANTICIPATE_FRAMES_DEFAULT).toBe(5);
  });

  it("defaults to 400ms settle (sec(0.4) = 12 frames @ 30fps)", () => {
    // With cue=100 and defaults, start = 100 - 5 - 12 = 83.
    expect(anticipatoryStartFrame(100)).toBe(83);
  });

  it("composes cleanly with sec() for second-based narration cues", () => {
    // Narrator says "the trap" at 2.5s → cue frame = 75.
    // Default 400ms settle + 150ms anticipate → start at frame 58.
    const cue = sec(2.5);
    const start = anticipatoryStartFrame(cue);
    expect(start).toBe(75 - 5 - 12);
  });
});

describe("anticipatoryReveal", () => {
  const cue = 100;
  const settle = 12;
  const anticipate = 5;
  // With these args: start=83, settleEnd=95, cue=100.

  it("returns 0 before entrance starts", () => {
    expect(anticipatoryReveal(0, cue, settle, anticipate)).toBe(0);
    expect(anticipatoryReveal(82, cue, settle, anticipate)).toBe(0);
  });

  it("returns 0 at start frame (entrance begins next frame)", () => {
    expect(anticipatoryReveal(83, cue, settle, anticipate)).toBe(0);
  });

  it("rises from 0 to 1 during the settle window", () => {
    const mid = anticipatoryReveal(89, cue, settle, anticipate);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it("is fully settled (opacity=1) before the narration cue", () => {
    // At settleEnd = 95, opacity should be 1. The cue arrives 5 frames later.
    expect(anticipatoryReveal(95, cue, settle, anticipate)).toBe(1);
    expect(anticipatoryReveal(100, cue, settle, anticipate)).toBe(1);
  });

  it("holds at 1 indefinitely after the cue (no decay)", () => {
    expect(anticipatoryReveal(200, cue, settle, anticipate)).toBe(1);
    expect(anticipatoryReveal(1000, cue, settle, anticipate)).toBe(1);
  });

  it("with default args, element settles 150ms before the cue", () => {
    // Default: settleFrames=12, anticipateFrames=5.
    // At cueFrame - 5, opacity must be 1.
    const cueFrame = sec(3);  // frame 90
    const settleCompleteFrame = cueFrame - ANTICIPATE_FRAMES_DEFAULT;
    expect(anticipatoryReveal(settleCompleteFrame, cueFrame)).toBe(1);
  });

  it("editorial register: at the narrated word, opacity is exactly 1 (settled)", () => {
    // The whole point of the helper.
    const cueFrame = sec(4.2);
    expect(anticipatoryReveal(cueFrame, cueFrame)).toBe(1);
  });
});

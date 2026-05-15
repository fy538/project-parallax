/**
 * Tests for src/utils/stepFramework.ts
 *
 * Covers:
 *   1. computeStepBoundaries — cumulative window construction
 *   2. getCurrentStepIndex   — active-step finder, clamping behavior
 *   3. cinematicEasings      — callable easing functions, output in [0,1]
 *   4. Pipeline regression   — computeStepBoundaries → getCurrentStepIndex
 *      on inputs matching the AtlasPlate tests (atlasProjection.test.ts).
 */

import { describe, it, expect } from "vitest";
import {
  computeStepBoundaries,
  getCurrentStepIndex,
  cinematicEasings,
} from "../utils/stepFramework";

// ── 1. computeStepBoundaries ────────────────────────────────────────────────

describe("computeStepBoundaries", () => {
  it("returns empty array for empty input", () => {
    expect(computeStepBoundaries([])).toEqual([]);
  });

  it("single step: [0, dur)", () => {
    const result = computeStepBoundaries([60]);
    expect(result).toEqual([{ start: 0, end: 60 }]);
  });

  it("multi-step: cumulates correctly", () => {
    const result = computeStepBoundaries([60, 90, 45]);
    expect(result).toEqual([
      { start: 0,   end: 60 },
      { start: 60,  end: 150 },
      { start: 150, end: 195 },
    ]);
  });

  it("baseOffset shifts all windows", () => {
    const result = computeStepBoundaries([60, 90], 15);
    expect(result).toEqual([
      { start: 15, end: 75 },
      { start: 75, end: 165 },
    ]);
  });

  it("default baseOffset is 0", () => {
    const withDefault = computeStepBoundaries([30]);
    const withExplicit = computeStepBoundaries([30], 0);
    expect(withDefault).toEqual(withExplicit);
  });

  it("last boundary end equals sum of all durations plus baseOffset", () => {
    const durations = [40, 50, 60, 70];
    const base = 10;
    const result = computeStepBoundaries(durations, base);
    const expected = base + durations.reduce((s, d) => s + d, 0);
    expect(result[result.length - 1].end).toBe(expected);
  });

  it("each step start equals previous step end", () => {
    const result = computeStepBoundaries([20, 30, 40, 10]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].start).toBe(result[i - 1].end);
    }
  });
});

// ── 2. getCurrentStepIndex ──────────────────────────────────────────────────

describe("getCurrentStepIndex", () => {
  const boundaries = [
    { start: 0,   end: 60 },
    { start: 60,  end: 150 },
    { start: 150, end: 195 },
  ];

  it("frame 0 → index 0", () => {
    expect(getCurrentStepIndex(0, boundaries)).toBe(0);
  });

  it("mid-first-step → index 0", () => {
    expect(getCurrentStepIndex(30, boundaries)).toBe(0);
  });

  it("exact start of second step → index 1", () => {
    expect(getCurrentStepIndex(60, boundaries)).toBe(1);
  });

  it("mid-second-step → index 1", () => {
    expect(getCurrentStepIndex(100, boundaries)).toBe(1);
  });

  it("exact start of third step → index 2", () => {
    expect(getCurrentStepIndex(150, boundaries)).toBe(2);
  });

  it("mid-third-step → index 2", () => {
    expect(getCurrentStepIndex(170, boundaries)).toBe(2);
  });

  it("frame at last step end → clamps to last step (index 2)", () => {
    expect(getCurrentStepIndex(195, boundaries)).toBe(2);
  });

  it("frame past all steps → clamps to last step", () => {
    expect(getCurrentStepIndex(9999, boundaries)).toBe(2);
  });

  it("frame before first step (negative) → clamps to first step (index 0)", () => {
    // frame -1 < 0 (start of step 0), backward scan finds no matching step, returns 0
    expect(getCurrentStepIndex(-1, boundaries)).toBe(0);
  });

  it("single-step boundaries always returns 0", () => {
    const single = [{ start: 0, end: 100 }];
    expect(getCurrentStepIndex(0, single)).toBe(0);
    expect(getCurrentStepIndex(50, single)).toBe(0);
    expect(getCurrentStepIndex(200, single)).toBe(0);
  });

  it("with baseOffset: frame inside offset zone stays at index 0", () => {
    const offsetBounds = computeStepBoundaries([60, 90], 15);
    // frame 10 is before step 0 start (15) — clamps to 0
    expect(getCurrentStepIndex(10, offsetBounds)).toBe(0);
    // frame 15 is exactly at step 0 start
    expect(getCurrentStepIndex(15, offsetBounds)).toBe(0);
    // frame 75 is exactly at step 1 start
    expect(getCurrentStepIndex(75, offsetBounds)).toBe(1);
  });
});

// ── 3. cinematicEasings ────────────────────────────────────────────────────

describe("cinematicEasings", () => {
  const inputs = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];

  for (const key of ["track", "snap", "zoom"] as const) {
    it(`${key}: returns a callable function`, () => {
      expect(typeof cinematicEasings[key]).toBe("function");
    });

    it(`${key}: maps 0 → ~0 and 1 → ~1`, () => {
      expect(cinematicEasings[key](0)).toBeCloseTo(0, 5);
      expect(cinematicEasings[key](1)).toBeCloseTo(1, 5);
    });

    it(`${key}: output is always in [0, 1] for input in [0, 1]`, () => {
      for (const t of inputs) {
        const out = cinematicEasings[key](t);
        expect(out).toBeGreaterThanOrEqual(-0.0001); // tiny float tolerance
        expect(out).toBeLessThanOrEqual(1.0001);
      }
    });

    it(`${key}: monotonically non-decreasing (no over-shoot check)`, () => {
      // track and zoom are standard bezier — no overshoot.
      // snap IS outExpo-like with a very fast rise; still monotone.
      let prev = cinematicEasings[key](0);
      for (let i = 1; i <= 100; i++) {
        const t = i / 100;
        const curr = cinematicEasings[key](t);
        expect(curr).toBeGreaterThanOrEqual(prev - 0.0001); // float tolerance
        prev = curr;
      }
    });
  }

  it("snap easing reaches 0.9 of its output before t=0.5 (fast arrival)", () => {
    // The snap easing is outExpo-like: most of the value reached early.
    // This validates the cinematic intent (fast arrival, soft settle).
    const snap50 = cinematicEasings.snap(0.5);
    expect(snap50).toBeGreaterThan(0.9);
  });

  it("track easing at t=0.5 has already covered most of the range (ease-out bias)", () => {
    // bezier(0.25, 0.1, 0.25, 1) is ease-out-biased: by t=0.5 it has
    // already covered >0.7 of the output range. This validates the
    // cinematic intent: motion starts fast and decelerates into the hold.
    const track50 = cinematicEasings.track(0.5);
    expect(track50).toBeGreaterThan(0.7);
    expect(track50).toBeLessThan(1.0);
  });
});

// ── 4. Pipeline regression ──────────────────────────────────────────────────

describe("computeStepBoundaries → getCurrentStepIndex pipeline", () => {
  it("AtlasPlate 3-phase scenario: step indices correct at every boundary", () => {
    // Mirroring the atlasProjection.test.ts scenario conceptually:
    // 3 phases of 2s, 3s, 1.5s at 30fps = 60, 90, 45 frames
    const boundaries = computeStepBoundaries([60, 90, 45]);

    // Before, at, and inside each phase
    expect(getCurrentStepIndex(0,   boundaries)).toBe(0);
    expect(getCurrentStepIndex(30,  boundaries)).toBe(0);
    expect(getCurrentStepIndex(59,  boundaries)).toBe(0);
    expect(getCurrentStepIndex(60,  boundaries)).toBe(1);
    expect(getCurrentStepIndex(100, boundaries)).toBe(1);
    expect(getCurrentStepIndex(149, boundaries)).toBe(1);
    expect(getCurrentStepIndex(150, boundaries)).toBe(2);
    expect(getCurrentStepIndex(194, boundaries)).toBe(2);
    expect(getCurrentStepIndex(195, boundaries)).toBe(2); // post-end clamp
    expect(getCurrentStepIndex(999, boundaries)).toBe(2); // far future
  });

  it("RouteAnimation 0.5s offset scenario: index 0 before offset zone", () => {
    // RouteAnimation uses sec(0.5) = 15 frames initial offset at 30fps
    const SEC = (s: number) => Math.round(s * 30);
    const boundaries = computeStepBoundaries(
      [SEC(3), SEC(4), SEC(5)],
      SEC(0.5),
    );
    // frames in the pre-delay zone clamp to step 0
    expect(getCurrentStepIndex(0,       boundaries)).toBe(0);
    expect(getCurrentStepIndex(SEC(0.5) - 1, boundaries)).toBe(0);
    // frame at step 0 start
    expect(getCurrentStepIndex(SEC(0.5), boundaries)).toBe(0);
    // frame at step 1 start
    expect(getCurrentStepIndex(SEC(0.5) + SEC(3), boundaries)).toBe(1);
    // frame at step 2 start
    expect(getCurrentStepIndex(SEC(0.5) + SEC(3) + SEC(4), boundaries)).toBe(2);
  });
});

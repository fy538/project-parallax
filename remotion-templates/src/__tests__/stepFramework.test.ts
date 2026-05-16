/**
 * Tests for src/utils/stepFramework.ts
 *
 * Covers:
 *   1. computeStepBoundaries — cumulative window construction (+ optional ids)
 *   2. getCurrentStepIndex   — active-step finder, clamping behavior
 *   3. getStepProgress       — clamped 0–1 inside a boundary (incl. exact-end)
 *   4. motionEasings         — callable easing functions, output in [0,1]
 *   5. EMPTY_BOUNDARY        — sentinel identity and immutability
 *   6. cinematicEasings      — deprecated alias still works
 *   7. Pipeline regression   — full computeStepBoundaries → index → progress
 *      pipeline on inputs matching the AtlasPlate tests.
 */

import { describe, it, expect } from "vitest";
import {
  computeStepBoundaries,
  getCurrentStepIndex,
  getStepProgress,
  motionEasings,
  cinematicEasings,
  EMPTY_BOUNDARY,
  type StepBoundary,
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

  it("attaches optional ids when provided", () => {
    const result = computeStepBoundaries(
      [30, 40, 50],
      0,
      ["intro", "zoom-in", "hold"],
    );
    expect(result[0].id).toBe("intro");
    expect(result[1].id).toBe("zoom-in");
    expect(result[2].id).toBe("hold");
  });

  it("omits id field entirely when ids array is undefined", () => {
    const result = computeStepBoundaries([30, 40]);
    expect(result[0]).not.toHaveProperty("id");
    expect(result[1]).not.toHaveProperty("id");
  });

  it("handles partial ids (some indices undefined)", () => {
    // sparse ids: only step 1 named; steps 0 and 2 unlabelled
    const result = computeStepBoundaries(
      [30, 40, 50],
      0,
      [undefined, "named", undefined],
    );
    expect(result[0]).not.toHaveProperty("id");
    expect(result[1].id).toBe("named");
    expect(result[2]).not.toHaveProperty("id");
  });

  it("ignores empty-string id (falsy)", () => {
    // empty string id should be treated as "no id" to avoid leaking
    // unintentional defaults from authoring tools.
    const result = computeStepBoundaries([30], 0, [""]);
    expect(result[0]).not.toHaveProperty("id");
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

// ── 3. getStepProgress ─────────────────────────────────────────────────────

describe("getStepProgress", () => {
  const boundary: StepBoundary = { start: 60, end: 150 }; // span 90

  it("frame at start → 0", () => {
    expect(getStepProgress(60, boundary)).toBe(0);
  });

  it("frame at midpoint → 0.5", () => {
    expect(getStepProgress(105, boundary)).toBeCloseTo(0.5, 10);
  });

  it("frame at exact end → 1 (off-by-one regression)", () => {
    // This is THE bug that bit every legacy consumer. The interval is
    // half-open [start, end), but for progress reporting we want
    // boundary.end → 1 (not 0). Lock it in.
    expect(getStepProgress(150, boundary)).toBe(1);
  });

  it("frame past end clamps to 1", () => {
    expect(getStepProgress(9999, boundary)).toBe(1);
  });

  it("frame before start clamps to 0", () => {
    expect(getStepProgress(0, boundary)).toBe(0);
    expect(getStepProgress(-100, boundary)).toBe(0);
  });

  it("zero-span boundary returns 0 (degenerate but defined)", () => {
    const zero: StepBoundary = { start: 50, end: 50 };
    expect(getStepProgress(50, zero)).toBe(0);
    expect(getStepProgress(100, zero)).toBe(0);
  });

  it("negative-span boundary returns 0 (malformed input guard)", () => {
    const reversed: StepBoundary = { start: 100, end: 50 };
    expect(getStepProgress(75, reversed)).toBe(0);
  });

  it("monotonically non-decreasing across frame sweep", () => {
    let prev = getStepProgress(0, boundary);
    for (let f = 0; f <= 200; f += 5) {
      const curr = getStepProgress(f, boundary);
      expect(curr).toBeGreaterThanOrEqual(prev);
      prev = curr;
    }
  });
});

// ── 4. motionEasings ───────────────────────────────────────────────────────

describe("motionEasings", () => {
  const inputs = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];

  for (const key of ["track", "snap", "zoom"] as const) {
    it(`${key}: returns a callable function`, () => {
      expect(typeof motionEasings[key]).toBe("function");
    });

    it(`${key}: maps 0 → ~0 and 1 → ~1`, () => {
      expect(motionEasings[key](0)).toBeCloseTo(0, 5);
      expect(motionEasings[key](1)).toBeCloseTo(1, 5);
    });

    it(`${key}: output is always in [0, 1] for input in [0, 1]`, () => {
      for (const t of inputs) {
        const out = motionEasings[key](t);
        expect(out).toBeGreaterThanOrEqual(-0.0001); // tiny float tolerance
        expect(out).toBeLessThanOrEqual(1.0001);
      }
    });

    it(`${key}: monotonically non-decreasing (no over-shoot check)`, () => {
      // track and zoom are standard bezier — no overshoot.
      // snap IS outExpo-like with a very fast rise; still monotone.
      let prev = motionEasings[key](0);
      for (let i = 1; i <= 100; i++) {
        const t = i / 100;
        const curr = motionEasings[key](t);
        expect(curr).toBeGreaterThanOrEqual(prev - 0.0001); // float tolerance
        prev = curr;
      }
    });
  }

  it("snap easing reaches 0.9 of its output before t=0.5 (fast arrival)", () => {
    // The snap easing is outExpo-like: most of the value reached early.
    // This validates the motion intent (fast arrival, soft settle).
    const snap50 = motionEasings.snap(0.5);
    expect(snap50).toBeGreaterThan(0.9);
  });

  it("track easing at t=0.5 has already covered most of the range (ease-out bias)", () => {
    // bezier(0.25, 0.1, 0.25, 1) is ease-out-biased: by t=0.5 it has
    // already covered >0.7 of the output range. This validates the intent:
    // motion starts fast and decelerates into the hold.
    const track50 = motionEasings.track(0.5);
    expect(track50).toBeGreaterThan(0.7);
    expect(track50).toBeLessThan(1.0);
  });
});

// ── 5. EMPTY_BOUNDARY ──────────────────────────────────────────────────────

describe("EMPTY_BOUNDARY", () => {
  it("is {start: 0, end: 0}", () => {
    expect(EMPTY_BOUNDARY.start).toBe(0);
    expect(EMPTY_BOUNDARY.end).toBe(0);
  });

  it("is frozen — cannot be mutated by consumers", () => {
    expect(Object.isFrozen(EMPTY_BOUNDARY)).toBe(true);
  });

  it("getStepProgress on EMPTY_BOUNDARY returns 0 for any frame", () => {
    expect(getStepProgress(0,   EMPTY_BOUNDARY)).toBe(0);
    expect(getStepProgress(100, EMPTY_BOUNDARY)).toBe(0);
  });
});

// ── 6. cinematicEasings (deprecated alias) ─────────────────────────────────

describe("cinematicEasings (deprecated alias)", () => {
  it("points to motionEasings (same identity)", () => {
    expect(cinematicEasings).toBe(motionEasings);
  });

  it("exposes the same three keys", () => {
    expect(cinematicEasings.track).toBe(motionEasings.track);
    expect(cinematicEasings.snap).toBe(motionEasings.snap);
    expect(cinematicEasings.zoom).toBe(motionEasings.zoom);
  });
});

// ── 7. Pipeline regression ──────────────────────────────────────────────────

describe("computeStepBoundaries → getCurrentStepIndex → getStepProgress pipeline", () => {
  it("full pipeline: progress is continuous across boundary transitions", () => {
    // 3 phases of 2s, 3s, 1.5s at 30fps = 60, 90, 45 frames
    const boundaries = computeStepBoundaries([60, 90, 45]);

    // Just before frame 60 → step 0, progress near 1
    const beforeIdx = getCurrentStepIndex(59, boundaries);
    expect(beforeIdx).toBe(0);
    expect(getStepProgress(59, boundaries[beforeIdx])).toBeGreaterThan(0.98);

    // Frame 60 → step 1, progress = 0
    const atBoundaryIdx = getCurrentStepIndex(60, boundaries);
    expect(atBoundaryIdx).toBe(1);
    expect(getStepProgress(60, boundaries[atBoundaryIdx])).toBe(0);

    // Frame 105 → step 1, progress = 0.5
    const midIdx = getCurrentStepIndex(105, boundaries);
    expect(midIdx).toBe(1);
    expect(getStepProgress(105, boundaries[midIdx])).toBeCloseTo(0.5, 10);

    // End of last step → step 2, progress = 1
    const endIdx = getCurrentStepIndex(195, boundaries);
    expect(endIdx).toBe(2);
    expect(getStepProgress(195, boundaries[endIdx])).toBe(1);
  });
});

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

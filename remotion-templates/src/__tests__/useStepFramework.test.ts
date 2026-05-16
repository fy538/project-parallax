/**
 * useStepFramework — unit tests for the pure compute helper.
 *
 * The hook itself is a thin wrapper around `computeStepFrameworkState` that
 * handles Remotion's `useCurrentFrame()` and useMemo'd boundary computation.
 * The load-bearing math (active-index resolution, EMPTY_BOUNDARY fallback,
 * progress clamping) lives in `computeStepFrameworkState`. Tests target the
 * pure function so we don't need to render a composition.
 *
 * Convention matches useBeatSync.test.ts and usePhase.test.ts.
 */

import { describe, it, expect } from "vitest";
import { computeStepFrameworkState } from "../hooks/useStepFramework";
import {
  computeStepBoundaries,
  EMPTY_BOUNDARY,
} from "../utils/stepFramework";

const STANDARD_BOUNDARIES = computeStepBoundaries([60, 90, 45]);
// [{start:0,end:60}, {start:60,end:150}, {start:150,end:195}]

describe("computeStepFrameworkState — index resolution", () => {
  it("frame 0 → index 0, boundary [0,60)", () => {
    const s = computeStepFrameworkState(0, STANDARD_BOUNDARIES);
    expect(s.index).toBe(0);
    expect(s.boundary).toEqual({ start: 0, end: 60 });
  });

  it("mid-step → correct index and boundary", () => {
    const s = computeStepFrameworkState(100, STANDARD_BOUNDARIES);
    expect(s.index).toBe(1);
    expect(s.boundary).toEqual({ start: 60, end: 150 });
  });

  it("exact boundary start → next step (frame = boundary.start)", () => {
    const s = computeStepFrameworkState(60, STANDARD_BOUNDARIES);
    expect(s.index).toBe(1);
    expect(s.progress).toBe(0);
  });

  it("frame past last step → clamps to last index", () => {
    const s = computeStepFrameworkState(9999, STANDARD_BOUNDARIES);
    expect(s.index).toBe(2);
    expect(s.progress).toBe(1);
  });
});

describe("computeStepFrameworkState — progress", () => {
  it("at boundary.start → 0", () => {
    expect(computeStepFrameworkState(0, STANDARD_BOUNDARIES).progress).toBe(0);
    expect(computeStepFrameworkState(60, STANDARD_BOUNDARIES).progress).toBe(0);
    expect(computeStepFrameworkState(150, STANDARD_BOUNDARIES).progress).toBe(0);
  });

  it("at boundary.end → 1 (off-by-one regression)", () => {
    // Critical regression: frame === boundary.end should yield progress=1
    // for the boundary the frame STARTS, not the boundary just exited.
    // Since frame=60 enters step 1, progress within step 1 is 0; the test
    // here is about the LAST step's end-frame clamping to 1.
    const s = computeStepFrameworkState(195, STANDARD_BOUNDARIES);
    expect(s.index).toBe(2);
    expect(s.progress).toBe(1);
  });

  it("monotone progress strictly inside one step", () => {
    // Stay in [60, 150) — step 1 only. At frame=150 the index transitions
    // to step 2 and progress resets to 0; that boundary case is covered
    // separately (see "frame === boundary.end" coverage in stepFramework.test.ts).
    let prev = 0;
    for (let f = 60; f < 150; f += 5) {
      const s = computeStepFrameworkState(f, STANDARD_BOUNDARIES);
      expect(s.index).toBe(1);
      expect(s.progress).toBeGreaterThanOrEqual(prev);
      prev = s.progress;
    }
  });
});

describe("computeStepFrameworkState — empty boundaries", () => {
  it("returns EMPTY_BOUNDARY fallback when input is empty", () => {
    const s = computeStepFrameworkState(0, []);
    expect(s.boundary).toBe(EMPTY_BOUNDARY);
    expect(s.index).toBe(0);
    expect(s.progress).toBe(0);
  });

  it("EMPTY_BOUNDARY fallback returns 0 progress for any frame", () => {
    expect(computeStepFrameworkState(100, []).progress).toBe(0);
    expect(computeStepFrameworkState(-50, []).progress).toBe(0);
  });
});

describe("computeStepFrameworkState — id pass-through", () => {
  it("preserves StepBoundary.id when boundaries were built with ids", () => {
    const labelled = computeStepBoundaries(
      [60, 90],
      0,
      ["intro", "reveal"],
    );
    const introState = computeStepFrameworkState(30, labelled);
    expect(introState.boundary.id).toBe("intro");
    const revealState = computeStepFrameworkState(75, labelled);
    expect(revealState.boundary.id).toBe("reveal");
  });
});

describe("computeStepFrameworkState — boundaries reference passes through", () => {
  it("returned boundaries array is the same reference passed in", () => {
    // Important for downstream useMemo deps in consuming hooks — the React
    // wrapper relies on this stability.
    const s = computeStepFrameworkState(0, STANDARD_BOUNDARIES);
    expect(s.boundaries).toBe(STANDARD_BOUNDARIES);
  });
});

describe("computeStepBoundaries — id arrays that previously collided", () => {
  // These two arrays both contain three logical ids but stringify
  // identically under a naive `arr.join(",")` cache key:
  //   ["a,b", "c"].join(",")  === "a,b,c"
  //   ["a", "b,c"].join(",")  === "a,b,c"
  // Lock that they produce distinguishable boundary arrays so any future
  // cache-key change in useStepFramework can't silently reintroduce the bug.
  it("['a,b','c'] vs ['a','b,c'] produce distinguishable boundary ids", () => {
    const a = computeStepBoundaries([30, 40], 0, ["a,b", "c"]);
    const b = computeStepBoundaries([30, 40], 0, ["a", "b,c"]);
    expect(a[0].id).toBe("a,b");
    expect(a[1].id).toBe("c");
    expect(b[0].id).toBe("a");
    expect(b[1].id).toBe("b,c");
    // Sanity: the arrays differ in observable content.
    expect(a[0].id).not.toBe(b[0].id);
  });
});

describe("computeStepFrameworkState — single-step degenerate", () => {
  it("works with one step", () => {
    const oneStep = computeStepBoundaries([100]);
    expect(computeStepFrameworkState(0, oneStep).progress).toBe(0);
    expect(computeStepFrameworkState(50, oneStep).progress).toBeCloseTo(0.5, 10);
    expect(computeStepFrameworkState(100, oneStep).progress).toBe(1);
    expect(computeStepFrameworkState(150, oneStep).progress).toBe(1); // post-end clamp
  });
});

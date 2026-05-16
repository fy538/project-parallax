/**
 * @vitest-environment happy-dom
 *
 * useStepFramework — unit tests for the pure compute helper PLUS the React
 * hook itself.
 *
 * Pure-function tests follow the codebase convention (useBeatSync,
 * usePhase): test the load-bearing math directly without rendering.
 *
 * The renderHook block at the bottom of the file is the exception —
 * `useStepFramework`'s value-add over the pure function is the
 * cacheKey-based useMemo, and the cacheKey behaviour is observable only
 * through the hook. happy-dom is enabled for this file via the directive
 * above; other unit tests stay in node environment per vitest.config.ts.
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { computeStepFrameworkState, useStepFramework } from "../hooks/useStepFramework";
import {
  computeStepBoundaries,
  EMPTY_BOUNDARY,
} from "../utils/stepFramework";

// useCurrentFrame is read once per render; we mock it to a fixed value so
// the renderHook tests assert memoisation behaviour without composition setup.
vi.mock("remotion", async () => {
  const actual = await vi.importActual<typeof import("remotion")>("remotion");
  return { ...actual, useCurrentFrame: () => 30 };
});

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
  // Pure-function sanity: the two arrays produce distinguishable boundaries.
  // This DOES NOT exercise the useStepFramework cacheKey — the cacheKey
  // contract is locked separately in the renderHook block below.
  it("['a,b','c'] vs ['a','b,c'] produce distinguishable boundary ids", () => {
    const a = computeStepBoundaries([30, 40], 0, ["a,b", "c"]);
    const b = computeStepBoundaries([30, 40], 0, ["a", "b,c"]);
    expect(a[0].id).toBe("a,b");
    expect(a[1].id).toBe("c");
    expect(b[0].id).toBe("a");
    expect(b[1].id).toBe("b,c");
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

// ── React-side: useStepFramework cacheKey contract ──────────────────────────
//
// The hook's value-add over the pure function is its `useMemo`-based
// boundary cache, keyed by a JSON-stringified `[baseOffset, durations, ids]`
// tuple. The old `arr.join(",")` cacheKey collided on comma-containing ids
// (`["a,b","c"]` and `["a","b,c"]` both stringified to `"a,b,c"`); switching
// to JSON.stringify fixed it. These tests lock that contract — if a future
// refactor reverts the cacheKey to a naive join, the collision case below
// will fail (the memo would not bust between renders).
describe("useStepFramework — memoisation contract", () => {
  it("re-uses the boundaries array reference when inputs are content-equal", () => {
    const durations = [30, 40];
    const ids = ["a", "b"];
    const { result, rerender } = renderHook(
      ({ d, i }: { d: number[]; i: string[] }) => useStepFramework(d, 0, i),
      { initialProps: { d: durations, i: ids } },
    );
    const firstBoundaries = result.current.boundaries;

    // Re-render with NEW array references but identical content — memo
    // should still hit because cacheKey is content-derived.
    rerender({ d: [30, 40], i: ["a", "b"] });
    expect(result.current.boundaries).toBe(firstBoundaries);
  });

  it("busts the cache on collision-prone id arrays ['a,b','c'] vs ['a','b,c']", () => {
    // This is THE bug the JSON.stringify cacheKey fixes. Under the legacy
    // `arr.join(",")` impl both arrays produced cacheKey `"a,b,c"` and the
    // memo did not bust — boundaries[1].id would still be "c" after the
    // re-render with ["a","b,c"]. The proper impl distinguishes them.
    const { result, rerender } = renderHook(
      ({ i }: { i: string[] }) => useStepFramework([30, 40], 0, i),
      { initialProps: { i: ["a,b", "c"] } },
    );
    expect(result.current.boundaries[0].id).toBe("a,b");
    expect(result.current.boundaries[1].id).toBe("c");

    rerender({ i: ["a", "b,c"] });
    expect(result.current.boundaries[0].id).toBe("a");
    expect(result.current.boundaries[1].id).toBe("b,c");
  });

  it("busts the cache when baseOffset changes (same durations)", () => {
    const { result, rerender } = renderHook(
      ({ offset }: { offset: number }) => useStepFramework([60, 90], offset),
      { initialProps: { offset: 0 } },
    );
    expect(result.current.boundaries[0].start).toBe(0);

    rerender({ offset: 15 });
    expect(result.current.boundaries[0].start).toBe(15);
  });

  it("distinguishes ids=undefined from ids=[] (JSON null vs JSON empty-array)", () => {
    // Edge case the legacy `ids?.join(",") ?? ""` impl conflated: both
    // produced "" in the cacheKey. With JSON.stringify, `ids ?? null` is
    // `null` for undefined and `[]` for an empty array — different keys.
    const { result, rerender } = renderHook(
      ({ i }: { i: string[] | undefined }) => useStepFramework([30], 0, i),
      { initialProps: { i: undefined as string[] | undefined } },
    );
    const undefinedRefBoundaries = result.current.boundaries;

    // Re-render with an empty array — content-distinct from undefined, so
    // the memo must bust (produces a new array reference).
    rerender({ i: [] });
    expect(result.current.boundaries).not.toBe(undefinedRefBoundaries);
  });
});

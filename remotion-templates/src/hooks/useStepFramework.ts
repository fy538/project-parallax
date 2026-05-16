/**
 * useStepFramework — React-side wrapper around the stepFramework primitives.
 *
 * The three Mapbox camera hooks (useNarratedCamera, useTimelineCamera,
 * useTreeCamera) each duplicated this exact pattern at the top of their
 * implementation:
 *
 *   const stepBoundaries = useMemo(
 *     () => computeStepBoundaries(cameraPath.map((s) => sec(s.duration))),
 *     [cameraPath],
 *   );
 *   const stepIndex = getCurrentStepIndex(frame, stepBoundaries);
 *   const currentBounds = stepBoundaries[stepIndex];
 *   const stepProgress = getStepProgress(frame, currentBounds);
 *
 * This hook consolidates that into one call:
 *
 *   const { boundaries, index, boundary, progress } = useStepFramework(durations);
 *
 * Memoised on a stable key derived from the durations array so the boundaries
 * array is referentially stable across frames — the camera hooks' downstream
 * useMemo dependencies relied on this and we preserve it here.
 *
 * Why a hook instead of inlining the three calls? Three reasons:
 *   1. The `useMemo` dependency mistake is easy to make (pass `durations` and
 *      bust the cache every render); the hook owns it once.
 *   2. The frame-read + clamp-to-last-step logic was subtly different across
 *      the three legacy hooks (useTreeCamera scanned forward, the others
 *      didn't). The unified primitive gives identical semantics.
 *   3. Future camera hooks (e.g. when Layer B's useWaypointCamera lands)
 *      have a canonical building block to compose with.
 *
 * Does NOT replace `usePhase` — that hook is a higher-level named-phase
 * manager with `isPhase("intro")` / `isPast("labels")` / per-phase easing
 * semantics. usePhase already delegates to computeStepBoundaries internally;
 * useStepFramework is the simpler index-based subset used by the camera hooks.
 *
 * Testing convention: like useBeatSync / usePhase, the load-bearing math
 * lives in a pure `computeStepFrameworkState` function — the hook is a thin
 * wrapper that reads useCurrentFrame and memoises. Tests target the pure
 * function so we don't need to render a composition to verify boundary math.
 */

import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import {
  computeStepBoundaries,
  getCurrentStepIndex,
  getStepProgress,
  EMPTY_BOUNDARY,
  type StepBoundary,
} from "../utils/stepFramework";

export interface StepFrameworkState {
  /** Cumulative [start, end) frame windows for each step. */
  boundaries: StepBoundary[];
  /** Index of the active step for the current frame (clamped to last). */
  index: number;
  /** The active step's boundary; falls back to EMPTY_BOUNDARY if input empty. */
  boundary: StepBoundary;
  /** Clamped 0–1 progress within the active boundary. */
  progress: number;
}

/**
 * Pure compute — no React dependencies, exported for unit tests.
 *
 * Takes already-built boundaries (so callers that build them once via
 * useMemo can avoid recomputing). Use `computeStepBoundaries` upstream.
 */
export function computeStepFrameworkState(
  frame: number,
  boundaries: StepBoundary[],
): StepFrameworkState {
  const index = getCurrentStepIndex(frame, boundaries);
  const boundary = boundaries[index] ?? EMPTY_BOUNDARY;
  const progress = getStepProgress(frame, boundary);
  return { boundaries, index, boundary, progress };
}

/**
 * React-side wrapper. Memoises the boundaries computation so callers can
 * pass `durations` (often `cameraPath.map(s => sec(s.duration))`) without
 * worrying about referential equality every frame.
 *
 * @param durations  - Per-step frame durations (already converted via sec()).
 * @param baseOffset - Optional initial offset; matches computeStepBoundaries.
 * @param ids        - Optional sparse debug labels per step (StepBoundary.id).
 */
export const useStepFramework = (
  durations: number[],
  baseOffset = 0,
  ids?: readonly (string | undefined)[],
): StepFrameworkState => {
  const frame = useCurrentFrame();

  // Stable cache key for the boundaries memo.
  //
  // Why JSON.stringify and not `durations.join(",")`? Comma-joined keys
  // collide when string ids contain commas — `["a,b","c"]` and `["a","b,c"]`
  // both render as `"a,b,c"`. JSON encoding escapes the separator and
  // preserves null/undefined distinctly. Cost is negligible: camera hooks
  // have N ≤ ~20 steps; stringification is microseconds.
  const cacheKey = JSON.stringify([baseOffset, durations, ids ?? null]);

  const boundaries = useMemo(
    () => computeStepBoundaries(durations, baseOffset, ids),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKey],
  );

  return computeStepFrameworkState(frame, boundaries);
};

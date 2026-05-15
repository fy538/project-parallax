/**
 * stepFramework — domain-neutral step/phase boilerplate shared across every
 * camera hook and phase manager in the template library.
 *
 * Three primitives appear verbatim in atlasCamera.ts, useNarratedCamera,
 * useTimelineCamera, useTreeCamera, usePhase, and RouteAnimation:
 *   1. computeStepBoundaries — cumulative [start, end] frame windows
 *   2. getCurrentStepIndex   — active-step finder
 *   3. cinematicEasings      — three shared Bezier easing presets
 *
 * Extracted here (May 2026) so a single fix (e.g., switching to binary
 * search on very long sequences) propagates everywhere instead of
 * requiring edits across six files.
 *
 * Intentionally NOT included:
 *   - computePhasePose / interpolatePose   (AtlasPlate, SVG-transform space)
 *   - interpolateCamera / resolveCameraPose (Mapbox 5-tuple / FreeCamera)
 *   - computeAutoCamera                    (RouteAnimation, geopolitical heuristics)
 *   - Per-element focus/blur/scale effects (template-specific editorial logic)
 *
 * These remain in their domain files because they diverge across Mapbox GL,
 * d3-geo SVG projections, and CSS viewport transforms — consolidating them
 * would produce an abstraction that obscures rather than clarifies.
 *
 * Layer B note: a shared `useWaypointCamera` hook should be revisited when
 * a second template extracts and aligns its camera math, making the higher-
 * level pattern clear from 2+ real examples.
 */

import { Easing } from "remotion";

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * A half-open [start, end) frame interval for one step or phase.
 * `start` is the first frame of this step; `end` is the first frame of the
 * NEXT step (or the composition end). Matches the convention used by every
 * camera hook in the library.
 */
export interface StepBoundary {
  start: number;
  end: number;
}

// ── computeStepBoundaries ──────────────────────────────────────────────────

/**
 * Convert a list of per-step frame durations into cumulative [start, end]
 * windows, optionally starting at `baseOffset` frames instead of 0.
 *
 * @param frameDurations - Duration (frames) for each step, in order.
 * @param baseOffset     - First step's start frame. Default: 0.
 *
 * @example
 * computeStepBoundaries([60, 90, 45])
 * // [{start:0,end:60}, {start:60,end:150}, {start:150,end:195}]
 *
 * computeStepBoundaries([60, 90], sec(0.5))
 * // [{start:15,end:75}, {start:75,end:165}]  (at 30fps)
 */
export function computeStepBoundaries(
  frameDurations: number[],
  baseOffset = 0,
): StepBoundary[] {
  const boundaries: StepBoundary[] = [];
  let cursor = baseOffset;
  for (const dur of frameDurations) {
    boundaries.push({ start: cursor, end: cursor + dur });
    cursor += dur;
  }
  return boundaries;
}

// ── getCurrentStepIndex ────────────────────────────────────────────────────

/**
 * Return the index of the active step for a given frame.
 *
 * Scans backwards (takes the LAST step whose start ≤ frame) so the result
 * is always clamped to [0, boundaries.length - 1] even when frame is
 * before the first step or after the last step ends.
 *
 * Produces the same result as a forward "first step whose end > frame" scan
 * for sequential non-overlapping intervals (the library's only use case).
 *
 * @param frame      - Current Remotion frame.
 * @param boundaries - Pre-computed windows from computeStepBoundaries.
 */
export function getCurrentStepIndex(
  frame: number,
  boundaries: StepBoundary[],
): number {
  let idx = 0;
  for (let i = 0; i < boundaries.length; i++) {
    if (frame >= boundaries[i].start) idx = i;
  }
  return idx;
}

// ── cinematicEasings ───────────────────────────────────────────────────────

/**
 * Shared Bezier easing presets for canvas-viewport camera hooks.
 * Originally defined identically in useNarratedCamera, useTimelineCamera,
 * and useTreeCamera — centralised here so a calibration change to (e.g.)
 * the zoom easing propagates everywhere.
 *
 * track — smooth cinematic dolly: gentle ease-in-out, no over-shoot.
 *         Use for positional panning between steps.
 * snap  — fast arrival with soft settle: outExpo-like. Use for `"snap"`
 *         step behavior where the camera should land quickly.
 * zoom  — zoom leads pan: arrives at destination zoom before pan completes,
 *         matching the natural eye-tracking behavior of cinematic zooms.
 */
export const cinematicEasings = {
  track: Easing.bezier(0.25, 0.1, 0.25, 1),
  snap:  Easing.bezier(0.16, 1,   0.3,  1),
  zoom:  Easing.bezier(0.22, 0.68, 0.36, 1),
} as const;

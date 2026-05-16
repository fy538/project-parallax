/**
 * stepFramework — domain-neutral step/phase boilerplate shared across every
 * camera hook and phase manager in the template library.
 *
 * Five primitives appear verbatim in atlasCamera.ts, useNarratedCamera,
 * useTimelineCamera, useTreeCamera, usePhase, and RouteAnimation:
 *   1. computeStepBoundaries — cumulative [start, end] frame windows
 *   2. getCurrentStepIndex   — active-step finder
 *   3. getStepProgress       — clamped 0–1 progress within an active boundary
 *   4. motionEasings         — three shared Bezier easing presets
 *   5. EMPTY_BOUNDARY        — sentinel for empty-boundaries guards
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
 * would produce an abstraction that obscures rather than clarifies. See
 * project/CAMERA_CONSOLIDATION_RESEARCH.md §4 for the external survey that
 * validated this split (Theatre.js, drei, GSAP, Framer Motion all do the same).
 *
 * Why not Remotion <Series>? <Series.Sequence> handles mount/unmount at
 * boundaries, but camera hooks need continuous frame access ACROSS boundaries
 * to interpolate the pose during transitions. Manual boundary math is the
 * right primitive here. (See Remotion discussion #639.)
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
 *
 * Optional `id` is a GSAP-style debug label (e.g. "zoom-in", "hold-on-taipei").
 * Future debug tooling can reference boundaries by name instead of by index;
 * authors only supply it when useful.
 */
export interface StepBoundary {
  start: number;
  end: number;
  id?: string;
}

/**
 * Sentinel for empty-boundaries guards. Consumers that index into a possibly
 * empty boundaries array can fall back to this instead of redefining their
 * own per-domain fallback ({start:0,end:0} appeared in 6 places before).
 */
export const EMPTY_BOUNDARY: Readonly<StepBoundary> = Object.freeze({
  start: 0,
  end: 0,
});

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
  ids?: readonly (string | undefined)[],
): StepBoundary[] {
  const boundaries: StepBoundary[] = [];
  let cursor = baseOffset;
  for (let i = 0; i < frameDurations.length; i++) {
    const dur = frameDurations[i];
    const id = ids?.[i];
    boundaries.push(id ? { start: cursor, end: cursor + dur, id } : { start: cursor, end: cursor + dur });
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
  // TODO: switch to binary search when boundaries.length > 50 (currently N≤20).
  let idx = 0;
  for (let i = 0; i < boundaries.length; i++) {
    if (frame >= boundaries[i].start) idx = i;
  }
  return idx;
}

// ── getStepProgress ────────────────────────────────────────────────────────

/**
 * Return clamped 0–1 progress through `boundary` at `frame`.
 *
 * Five of six legacy camera files duplicated this exact (frame-start)/(end-start)
 * line right after `getCurrentStepIndex`. Centralised so the off-by-one at
 * `frame === boundary.end` (the universal bug here) is handled in one place.
 *
 * - frame ≤ boundary.start  → 0
 * - frame ≥ boundary.end    → 1
 * - zero-span boundary      → 0  (defined as "fully entered, not yet exited")
 *
 * @example
 * const b = { start: 60, end: 150 };
 * getStepProgress(60,  b); // 0
 * getStepProgress(105, b); // 0.5
 * getStepProgress(150, b); // 1
 */
export function getStepProgress(frame: number, boundary: StepBoundary): number {
  const span = boundary.end - boundary.start;
  if (span <= 0) return 0;
  const raw = (frame - boundary.start) / span;
  if (raw < 0) return 0;
  if (raw > 1) return 1;
  return raw;
}

// ── motionEasings ──────────────────────────────────────────────────────────

/**
 * Shared Bezier easing presets for canvas-viewport camera hooks.
 * Originally defined identically in useNarratedCamera, useTimelineCamera,
 * and useTreeCamera — centralised here so a calibration change to (e.g.)
 * the zoom easing propagates everywhere.
 *
 * track — smooth dolly: gentle ease-in-out, no over-shoot
 *         (≈ CSS `ease`, Penner `easeInOutCubic`-ish).
 *         Use for positional panning between steps.
 * snap  — fast arrival with soft settle: outExpo-like
 *         (≈ Penner `easeOutExpo`).
 *         Use for `"snap"` step behavior where the camera should land quickly.
 * zoom  — zoom leads pan: arrives at destination zoom before pan completes,
 *         matching the natural eye-tracking behavior of cinematic zooms.
 *         (Parallax-specific curve; no standard library name.)
 *
 * Naming note: this constant was originally `cinematicEasings`. Renamed to
 * `motionEasings` after external research (see CAMERA_CONSOLIDATION_RESEARCH.md
 * §3) showed industry vocabulary prefers motion-intent names over aesthetic
 * register. The `cinematicEasings` export is kept as a deprecated alias for
 * one migration cycle; consumers should destructure from `motionEasings`.
 */
export const motionEasings = {
  track: Easing.bezier(0.25, 0.1, 0.25, 1),
  snap:  Easing.bezier(0.16, 1,   0.3,  1),
  zoom:  Easing.bezier(0.22, 0.68, 0.36, 1),
} as const;

/**
 * @deprecated Renamed to `motionEasings`. Will be removed once all consumers
 * migrate (target: commit 5 of the camera-consolidation series). Kept here so
 * intermediate commits stay green during the rolling migration.
 */
export const cinematicEasings = motionEasings;

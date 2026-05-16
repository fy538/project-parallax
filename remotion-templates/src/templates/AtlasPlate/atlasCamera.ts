/**
 * atlasCamera — phase-window + camera-pose utilities for AtlasPlate.
 *
 * Extracted from AtlasPlate.tsx (May 2026, 1,566 → ~1,100 line split).
 * Pure functions only; no React, no SVG. The AtlasPlate component
 * imports these, threads them through `useMemo`, and applies the pose
 * to its outer `<g transform>`.
 *
 * Why extracted: this math sits inside a 1,566-line file alongside the
 * SVG render code, making both harder to read AND obscuring that
 * **the same waypoint-interpolation pattern is used by 5 other hooks**
 * (`useNarratedCamera`, `useTimelineCamera`, `useTreeCamera`,
 * `useCameraStagger`, `CinematicCamera`). Moving these into their own
 * file is step 1 toward eventually consolidating into a shared
 * `useWaypointCamera` primitive — but only AFTER 2-3 new consumers
 * justify the abstraction. For now: same code, distinct file.
 *
 * Reference: code-review audit § 1.3 (1-week task).
 */

import type { Feature, Geometry } from "geojson";
import {
  fitProjectionToFeatures,
  fitProjectionToWorld,
  getCountryByAlpha3,
  resolveProjection,
  type ProjectionName,
} from "../../utils/atlasProjection";
import { warnIf } from "../../utils/dataWarnings";
import { sec } from "../../design/theme";
import {
  computeStepBoundaries,
  getCurrentStepIndex,
  EMPTY_BOUNDARY,
  type PhaseWindow as StepPhaseWindow,
} from "../../utils/stepFramework";
import type { AtlasPhase } from "./types";

// ── Constants ─────────────────────────────────────────────────────────

/** Default padding (px) inside which countries are fit when focused. */
export const DEFAULT_FRAME_PADDING = 80;

/** Camera transition duration (frames). */
export const CAMERA_TRANSITION_FRAMES = sec(1.2);

// ── Phase windows ─────────────────────────────────────────────────────

/**
 * AtlasPlate-specific PhaseWindow — `StepBoundary` + `phase: AtlasPhase` +
 * `index`. The generic in `stepFramework.ts` owns the shape; this alias
 * keeps grep-discoverability ("what shape does AtlasPlate's window have?")
 * while sharing the underlying type across the five phase-driven map
 * templates (AtlasPlate, ChoroplethMap, DensityMap, CartogramMap,
 * ProportionalSymbolMap).
 *
 * Field-name note: pre-May-2026 this interface used `startFrame` / `endFrame`.
 * Renamed to `start` / `end` to align with `StepBoundary` so the generic
 * step-framework primitives (`getCurrentStepIndex`, `getStepProgress`) can
 * consume PhaseWindow arrays directly without a `.map(...)` adapter.
 */
export type PhaseWindow = StepPhaseWindow<AtlasPhase>;

/**
 * Fallback phase window — used when `data.phases` is somehow empty (the
 * Zod schema enforces `.min(1)`, so this should be unreachable, but a
 * fallback keeps all hooks executable until the early-return at the
 * bottom of the component runs. See B4 defensive-guard pattern.
 *
 * Composes `EMPTY_BOUNDARY` (the shared step-framework sentinel) with an
 * empty `AtlasPhase` and index 0, so the zero-window shape lives in exactly
 * one place across the library.
 */
export const FALLBACK_PHASE_WINDOW: PhaseWindow = Object.freeze({
  ...EMPTY_BOUNDARY,
  phase: { title: "", durationSec: 0, countries: [] },
  index: 0,
}) as PhaseWindow;

/**
 * Convert phase durations (seconds) into cumulative frame windows.
 * Pure — exported for unit tests + downstream tooling.
 *
 * Delegates frame arithmetic to `computeStepBoundaries` (stepFramework.ts)
 * and augments each boundary with the originating `AtlasPhase` and its
 * sequential index — the fields specific to the AtlasPlate domain.
 */
export const computePhaseWindows = (phases: AtlasPhase[]): PhaseWindow[] => {
  const boundaries = computeStepBoundaries(
    phases.map((p) => sec(p.durationSec)),
  );
  return boundaries.map((b, index) => ({
    ...b,
    phase: phases[index],
    index,
  }));
};

/**
 * Find the index of the phase active at a given frame. Returns the
 * last phase's index when `frame >= last.end` (post-end clamp).
 *
 * Thin wrapper around `getCurrentStepIndex` (stepFramework.ts) — now that
 * `PhaseWindow extends StepBoundary`, the array passes through directly
 * with no adapter `.map(...)`.
 */
export const getCurrentPhaseIndex = (
  frame: number,
  windows: PhaseWindow[],
): number => getCurrentStepIndex(frame, windows);

// ── Camera pose ───────────────────────────────────────────────────────

export interface CameraPose {
  /** Multiplicative scale relative to the base (world-fit) projection. */
  scale: number;
  /** Pixel translate after scaling. */
  translate: [number, number];
}

/**
 * Compute a camera pose for a phase. Result is in "outer transform" space —
 * SVG group transform = `translate(...) scale(s)`.
 *
 * - When `focus.iso3` is set, fits to those countries' bounds with padding.
 * - When `focus.center` is set, recenters the projection on that point
 *   and applies `scaleHint` (1.0 = world fit, 2.0 = 2× zoom).
 * - Without focus, returns the identity pose (world fit, scale 1.0).
 *
 * Orthographic special-case: rotation is animated in the projection
 * itself (`phase.rotation` → `d3-geo.rotate()`), so the outer transform
 * is identity. Warns when `focus` is also set on an orthographic phase
 * since the focus is silently ignored.
 */
export const computePhasePose = (
  phase: AtlasPhase,
  projectionName: ProjectionName | undefined,
  viewport: { width: number; height: number },
  framePadding: number,
  baseScale: number,
  baseTranslate: [number, number],
): CameraPose => {
  if (!phase.focus) {
    return { scale: 1, translate: [0, 0] };
  }

  // Orthographic = globe projection. The outer-<g> scale+translate trick
  // doesn't apply — the orthographic render path animates the projection's
  // ROTATION per frame instead. Return identity so `focus` settings on
  // orthographic phases are ignored without crashing; use `phase.rotation`
  // instead. Warn loudly so authors don't silently lose their focus config.
  if (projectionName === "orthographic") {
    warnIf(
      !!phase.focus,
      "AtlasPlate",
      `Phase "${phase.title}" has \`focus\` on orthographic projection — ` +
        `focus is IGNORED for orthographic. Use \`phase.rotation: [lon, lat]\` ` +
        `instead to spin the globe to face that point.`,
    );
    warnIf(
      phase.cameraTransition === "via-globe",
      "AtlasPlate",
      `Phase "${phase.title}" has \`cameraTransition: "via-globe"\` on ` +
        `orthographic projection — the pull-back-then-push-in pose curve has ` +
        `no effect on the globe (outer transform is identity). Use ` +
        `"cinematic" or "linear" for the rotation easing instead.`,
    );
    return { scale: 1, translate: [0, 0] };
  }

  const proj = resolveProjection(projectionName);

  if (phase.focus.iso3 && phase.focus.iso3.length > 0) {
    const features: Feature<Geometry>[] = [];
    for (const code of phase.focus.iso3) {
      const c = getCountryByAlpha3(code);
      if (c) features.push(c.feature);
    }
    if (features.length === 0) {
      return { scale: 1, translate: [0, 0] };
    }
    const fc: Feature<Geometry> | { type: "FeatureCollection"; features: typeof features } =
      features.length === 1
        ? features[0]
        : { type: "FeatureCollection", features };
    // no-as-any-ok: d3-geo interop — TopoJSON converter output type
    // doesn't match d3's FeatureCollection exactly.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fitProjectionToFeatures(proj, fc as any, viewport, framePadding);
  } else if (phase.focus.center) {
    fitProjectionToWorld(proj, viewport, framePadding);
    const [lon, lat] = phase.focus.center;
    const scaleHint = phase.focus.scaleHint ?? 1;
    proj.scale(proj.scale() * scaleHint);
    const projected = proj([lon, lat]);
    if (projected) {
      const [cx, cy] = projected;
      const [tx0, ty0] = proj.translate();
      proj.translate([
        tx0 + (viewport.width / 2 - cx),
        ty0 + (viewport.height / 2 - cy),
      ]);
    }
  } else {
    return { scale: 1, translate: [0, 0] };
  }

  const targetScale = proj.scale();
  const targetTranslate = proj.translate() as [number, number];

  // Convert (targetScale, targetTranslate) into an outer-group transform
  // applied AFTER the base projection. For any point (x0, y0) projected
  // under the base, its position under the target is:
  //   (x1, y1) = ((x0 - T0x) * s + T1x, (y0 - T0y) * s + T1y)
  // where s = targetScale / baseScale.
  //
  // Equivalent outer transform: translate(T1x - T0x*s, T1y - T0y*s) scale(s).
  const s = targetScale / baseScale;
  return {
    scale: s,
    translate: [
      targetTranslate[0] - baseTranslate[0] * s,
      targetTranslate[1] - baseTranslate[1] * s,
    ],
  };
};

/** Linear interpolation of two poses. */
export const interpolatePose = (
  a: CameraPose,
  b: CameraPose,
  t: number,
): CameraPose => ({
  scale: a.scale + (b.scale - a.scale) * t,
  translate: [
    a.translate[0] + (b.translate[0] - a.translate[0]) * t,
    a.translate[1] + (b.translate[1] - a.translate[1]) * t,
  ],
});

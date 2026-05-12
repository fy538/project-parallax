/**
 * mapUtils — shared utilities for Mapbox GL map templates.
 *
 * Provides color conversion, camera interpolation presets,
 * and coordinate projection helpers for ChoroplethMap and RouteAnimation
 * after the react-simple-maps → Mapbox GL migration.
 */

// ── Color conversion ───────────────────────────────────────────────────

/**
 * Convert hex color to RGBA array for deck.gl layers.
 * deck.gl expects [r, g, b, a] with values 0-255.
 */
export const hexToRgba = (
  hex: string,
  alpha: number = 255
): [number, number, number, number] => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b, alpha];
};

/**
 * Convert hex color to CSS rgba string.
 */
export const hexToRgbaString = (hex: string, alpha: number = 1): string => {
  const [r, g, b] = hexToRgba(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ── Scale → Zoom conversion ───────────────────────────────────────────
// react-simple-maps used d3 geo projection `scale` (e.g., 150 for world).
// Mapbox GL uses `zoom` levels. This converts old data files seamlessly.

const SCALE_ZOOM_TABLE: [number, number][] = [
  [100, 1.2],
  [150, 1.8],
  [200, 2.5],
  [250, 3.0],
  [300, 3.4],
  [400, 4.0],
  [500, 4.5],
  [700, 5.0],
  [1000, 5.8],
];

/**
 * Convert react-simple-maps projection scale to Mapbox GL zoom level.
 * Uses piecewise linear interpolation from an empirical mapping table.
 */
export const scaleToZoom = (scale: number): number => {
  if (scale <= SCALE_ZOOM_TABLE[0][0]) return SCALE_ZOOM_TABLE[0][1];
  for (let i = 1; i < SCALE_ZOOM_TABLE.length; i++) {
    const [s0, z0] = SCALE_ZOOM_TABLE[i - 1];
    const [s1, z1] = SCALE_ZOOM_TABLE[i];
    if (scale <= s1) {
      const t = (scale - s0) / (s1 - s0);
      return z0 + t * (z1 - z0);
    }
  }
  const last = SCALE_ZOOM_TABLE[SCALE_ZOOM_TABLE.length - 1];
  return last[1];
};

// ── Camera state type ──────────────────────────────────────────────────

export interface CameraState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

// ── Camera presets ─────────────────────────────────────────────────────

export const cameraPresets = {
  /** Global view — shows full world */
  world: {
    longitude: 20,
    latitude: 25,
    zoom: 1.8,
    pitch: 30,
    bearing: 0,
  } satisfies CameraState,

  /** East Asia focus — China, Japan, Taiwan, Korea */
  eastAsia: {
    longitude: 116,
    latitude: 32,
    zoom: 4.0,
    pitch: 40,
    bearing: 0,
  } satisfies CameraState,

  /** Europe focus — Netherlands, Germany, UK */
  europe: {
    longitude: 10,
    latitude: 50,
    zoom: 4.5,
    pitch: 35,
    bearing: 0,
  } satisfies CameraState,

  /** North America focus — US */
  northAmerica: {
    longitude: -95,
    latitude: 38,
    zoom: 4.0,
    pitch: 35,
    bearing: 0,
  } satisfies CameraState,

  /** Middle East focus */
  middleEast: {
    longitude: 45,
    latitude: 30,
    zoom: 4.5,
    pitch: 35,
    bearing: 0,
  } satisfies CameraState,

  /** Taiwan Strait close-up */
  taiwanStrait: {
    longitude: 120.5,
    latitude: 24,
    zoom: 6.5,
    pitch: 45,
    bearing: -10,
  } satisfies CameraState,
} as const;

// ── Camera interpolation ───────────────────────────────────────────────

/**
 * Interpolate between two camera states.
 * Used with Remotion's useCurrentFrame() to animate map camera.
 *
 * @param from - starting camera state
 * @param to - ending camera state
 * @param progress - 0 to 1 interpolation progress
 */
export const interpolateCamera = (
  from: CameraState,
  to: CameraState,
  progress: number
): CameraState => ({
  longitude: from.longitude + (to.longitude - from.longitude) * progress,
  latitude: from.latitude + (to.latitude - from.latitude) * progress,
  zoom: from.zoom + (to.zoom - from.zoom) * progress,
  pitch: from.pitch + (to.pitch - from.pitch) * progress,
  bearing: from.bearing + (to.bearing - from.bearing) * progress,
});

// ── Common camera moves ────────────────────────────────────────────────

export const cameraMoves = {
  /** World → region zoom (2 seconds at 30fps = 60 frames) */
  worldToRegion: {
    durationSec: 2,
    fromZoom: 1.8,
    toZoom: 4.5,
    fromPitch: 30,
    toPitch: 45,
  },

  /** Region → city zoom */
  regionToCity: {
    durationSec: 1.5,
    fromZoom: 4.5,
    toZoom: 8,
    fromPitch: 45,
    toPitch: 50,
  },

  /** Slow orbit (subtle rotation during holds) */
  slowOrbit: {
    durationSec: 5,
    bearingDelta: 15,
  },

  /** Pull back (reverse world-to-region) */
  pullBack: {
    durationSec: 2,
    fromZoom: 4.5,
    toZoom: 1.8,
    fromPitch: 45,
    toPitch: 30,
  },
} as const;

// ── Cinematic camera-path easing ──────────────────────────────────────────
//
// Standard d3 easing is a linear-time → easy-output remap of a SINGLE
// pose-to-pose interpolation. Cinematic transitions want richer behavior:
//   - bezier curves through control points (cubic Bezier 1D)
//   - "via-globe" arcs: pull BACK at midpoint then push IN (used when
//     the start and end are far apart geographically)
//   - dwell windows: clamp at 0 or 1 for a configurable duration so the
//     camera holds steady before/after the actual transition motion
//
// These are pure functions on `t ∈ [0,1]`. The caller still maps frames
// to `t`; this module just owns the shape of the curve.

/**
 * Cubic Bezier *shape* in one dimension — given t ∈ [0, 1], returns the
 * Bezier value where the curve runs from (0, 0) → (1, 1) and the two
 * y-axis control points are `p1` and `p2`. Not equivalent to CSS
 * `cubic-bezier(x1, y1, x2, y2)` because we don't solve for x — we treat
 * `t` as the curve parameter directly. The resulting curve is still a
 * valid monotonic easing shape; it just doesn't precisely match CSS
 * semantics.
 *
 * Suggested control-point pairs for editorial easings:
 *   - smooth ease-in-out:  (0, 1)      — gentle S-curve
 *   - cinematic snap:      (0.65, 0.35) — accelerates harder mid-curve
 *   - dramatic settle:     (0.3, 0.95)  — long ramp, late landing
 */
export const cubicBezier1D = (
  p1: number,
  p2: number,
  t: number,
): number => {
  const u = 1 - t;
  return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
};

/**
 * "Via-globe" pose interpolation — pulls the scale UNDER 1.0 (zoomed out)
 * at the midpoint of the transition, then back to the target scale. Use
 * when start and end camera poses are far enough apart that a direct
 * linear interpolation would look like a teleport. Editorial equivalent
 * of the NYT/Apple Maps "pull back, fly to, zoom in" motion.
 *
 * `pullbackFactor` controls how far the scale dips at midpoint
 * (default 0.6 = 60% of the smaller of the two scales). Translates
 * interpolate linearly.
 *
 * Pure pose math; pair with whatever easing curve you want for t.
 */
export const viaGlobePoseInterpolate = <
  P extends { scale: number; translate: [number, number] },
>(
  a: P,
  b: P,
  t: number,
  pullbackFactor: number = 0.6,
): { scale: number; translate: [number, number] } => {
  // 4-point Bezier in scale-space: a.scale, pulled_scale, pulled_scale, b.scale.
  const pulled = Math.min(a.scale, b.scale) * pullbackFactor;
  const u = 1 - t;
  const scale =
    u * u * u * a.scale +
    3 * u * u * t * pulled +
    3 * u * t * t * pulled +
    t * t * t * b.scale;
  return {
    scale,
    translate: [
      a.translate[0] + (b.translate[0] - a.translate[0]) * t,
      a.translate[1] + (b.translate[1] - a.translate[1]) * t,
    ],
  };
};

/**
 * Apply a dwell window to a transition time. `dwellBefore` and `dwellAfter`
 * are fractions ∈ [0, 1] of the total transition window during which the
 * camera holds at 0 (start pose) or 1 (end pose) respectively. The middle
 * fraction (1 - dwellBefore - dwellAfter) is the actual motion.
 *
 * Example: `applyDwell(0.5, 0.1, 0.1)` → 10% dwell at start, 80% motion,
 * 10% dwell at end. At t=0.5 (halfway through window), motion is at 0.5.
 *
 * Returns 0/1 clamped during dwell windows; otherwise remaps to [0, 1].
 */
export const applyDwell = (
  t: number,
  dwellBefore: number,
  dwellAfter: number,
): number => {
  const totalDwell = dwellBefore + dwellAfter;
  if (totalDwell >= 1) return t < 0.5 ? 0 : 1; // degenerate — all dwell
  if (t < dwellBefore) return 0;
  if (t > 1 - dwellAfter) return 1;
  const motionLen = 1 - totalDwell;
  return (t - dwellBefore) / motionLen;
};

/** Named cinematic-transition presets. */
export type CameraTransition = "linear" | "cinematic" | "via-globe";

/**
 * Compute the eased `t'` for a given camera transition style.
 *
 * - `linear`: t unchanged (caller is expected to apply CLAMP_CUBIC_INOUT
 *   or equivalent themselves — this is the v1 behavior we never change
 *   for compositions that don't opt in).
 * - `cinematic`: cubic Bezier (0.65, 0, 0.35, 1) — accelerates hard
 *   through the middle.
 * - `via-globe`: same eased-t as `cinematic`; caller uses
 *   `viaGlobePoseInterpolate` for the pose itself.
 */
export const easeCameraT = (t: number, transition: CameraTransition): number => {
  if (transition === "linear") return t;
  // cinematic + via-globe share the same time-easing (the cinematic Bezier
  // curve). The pose curve itself differs (linear vs. via-globe arc).
  return cubicBezier1D(0.65, 0.35, t);
};

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

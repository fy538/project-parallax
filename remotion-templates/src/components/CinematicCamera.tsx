/**
 * CinematicCamera — Mapbox FreeCamera wrapper driven by Remotion frames.
 *
 * Wired into RouteAnimation as of May 14 2026: when a data file authors
 * `_direction.cameraPath` (an array of `CinematicDirective` objects),
 * RouteAnimation translates them via `buildKeyframesFromDirectives` and
 * renders `<CinematicCamera>` as a sibling of `<MapGL>` to drive
 * FreeCamera per frame. Pending wiring into ChoroplethMap / DensityMap
 * when a script needs it there too.
 *
 * The default `<MapGL>` camera is declarative: pass `longitude / latitude /
 * zoom / pitch / bearing` and react-map-gl snaps to it each render. That's
 * fine for static or piecewise-linear shots, but it doesn't expose the
 * cinematic dimensions that make Mapbox feel less like a web app:
 *
 *   • Camera *altitude* in meters (vs. zoom level — non-linear above 6378km)
 *   • Off-axis `lookAt` (camera here, looking there) — for parallax shots
 *     where the focal point isn't directly below the lens
 *   • Sub-globe positions (camera under the surface, looking up) — useful
 *     for atmosphere-rim cold opens
 *   • Smooth altitude pulls that respect Earth curvature
 *
 * Mapbox's FreeCamera API exposes all of this via
 * `map.setFreeCameraOptions(opts)`. This component wraps that surface in a
 * Remotion-friendly form:
 *
 *   1. Accepts an array of keyframes (`{frame, position, lookAt}`)
 *   2. On each rendered frame, interpolates between the bracketing pair
 *   3. Builds a `FreeCameraOptions` from the interpolated values and calls
 *      `setFreeCameraOptions` on the underlying Mapbox instance
 *
 * The interpolation is in-component (linear in lng/lat/altitude with smooth
 * easing) — Remotion already drives the frame clock, so we don't pull in
 * any animation library. Each frame is independent; rewind / scrub works
 * without state.
 *
 * ## DIR: cam translation
 *
 * The Parallax directing vocabulary (`project/DIRECTING_LANGUAGE.md`) uses
 * the cam shorthand `push-in`, `pull-back`, `orbit`, `pivot`. Use the
 * `cinematicPathFromDirective` helper to convert one of those into the
 * keyframe array this component expects.
 *
 * ## Usage
 *
 *   const [mapInstance, setMapInstance] = useState<MapInstance | null>(null);
 *   <MapGL onMapReady={setMapInstance} ... />
 *   <CinematicCamera
 *     map={mapInstance}
 *     keyframes={[
 *       { frame: 0,   center: [104, 35], altitudeM: 8_000_000, bearing: 0 },
 *       { frame: 90,  center: [104, 35], altitudeM: 3_500_000, bearing: 12 },
 *     ]}
 *   />
 *
 * The component renders no DOM — it's a side-effect-only orchestrator.
 *
 * ## Graceful fallback
 *
 * If the map instance doesn't expose `setFreeCameraOptions` (older Mapbox,
 * non-globe projection, mocked test environment), the component falls
 * through to `jumpTo({center, zoom, bearing, pitch})` — the result is
 * still continuous, just without the cinematic altitude curve. A one-shot
 * console warning fires so the user knows they're in fallback mode.
 *
 * See: docs.mapbox.com/mapbox-gl-js/api/free-camera/
 */

import React, { useEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";

// ── Types ────────────────────────────────────────────────────────────

/**
 * A single keyframe in a cinematic camera path. `frame` is the Remotion
 * frame number (NOT seconds) at which the camera reaches the given
 * position. Interpolation between adjacent keyframes is smoothed by a
 * default ease-in-out cubic; pass `easing: "linear"` for raw lerp.
 *
 * `center` is the lng/lat the camera *looks at* (NOT the camera's own
 * lng/lat — that's derived from center + altitude + bearing + pitch).
 * Most editorial shots want this implicit lookAt model; if you need
 * off-axis parallax (camera here, looking there), pass an explicit
 * `lookAt` field instead of `center`.
 */
export interface CameraKeyframe {
  /** Remotion frame number at which this keyframe applies. */
  frame: number;
  /** Lng/lat the camera looks at. Required unless `lookAt` is provided. */
  center?: [number, number];
  /**
   * Off-axis look-at target — camera position is computed from
   * `position` (or derived from center + bearing/pitch), and it looks at
   * `lookAt`. Use for parallax shots where the focal point isn't below
   * the camera.
   */
  lookAt?: [number, number];
  /**
   * Camera altitude in meters above the WGS84 ellipsoid. The FreeCamera
   * model: 0 m = surface, ~400_000 m ≈ ISS orbit, ~12_000_000 m ≈ full
   * globe in frame. Linear in meters — unlike zoom, which is logarithmic.
   * Default: derived from `zoom` if provided, else 5_000_000.
   */
  altitudeM?: number;
  /** Equivalent zoom level — converted to altitude if altitudeM is omitted. */
  zoom?: number;
  /** Bearing in degrees, 0 = north up. Default 0. */
  bearing?: number;
  /** Pitch in degrees, 0 = looking straight down. Default 30. */
  pitch?: number;
  /** Easing curve from PREVIOUS keyframe to THIS one. Default "ease-in-out". */
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

/**
 * Subset of the Mapbox map instance that CinematicCamera needs. We accept
 * a structural type rather than `import('mapbox-gl').Map` so consumers
 * don't need to install mapbox-gl types just to type their state.
 */
export interface CinematicMapInstance {
  setFreeCameraOptions?: (opts: unknown) => void;
  jumpTo?: (opts: {
    center?: [number, number];
    zoom?: number;
    bearing?: number;
    pitch?: number;
  }) => void;
}

export interface CinematicCameraProps {
  /**
   * The Mapbox map instance. Pass `null` while the map is still loading —
   * the component no-ops until a valid instance arrives. Get this from
   * `<MapGL onMapReady={setMapInstance} />`.
   */
  map: CinematicMapInstance | null;
  /**
   * Keyframes in ascending `frame` order. The component clamps to the
   * first / last keyframe before / after the path's frame range, so a
   * single keyframe = static cinematic pose.
   */
  keyframes: ReadonlyArray<CameraKeyframe>;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Convert a zoom level to an approximate altitude in meters. The Mapbox
 * empirical formula: altitude = 7_000_000 / 2^(zoom - 1). At zoom 0 the
 * camera sits ~14M m up (whole globe in frame); zoom 4 ≈ 875K m
 * (continental); zoom 8 ≈ 55K m (regional); zoom 12 ≈ 3K m (city).
 * Exported for tests.
 */
export const zoomToAltitudeM = (zoom: number): number =>
  7_000_000 / Math.pow(2, zoom - 1);

const EASINGS: Record<NonNullable<CameraKeyframe["easing"]>, (t: number) => number> = {
  linear: (t) => t,
  "ease-in": (t) => t * t,
  "ease-out": (t) => 1 - (1 - t) * (1 - t),
  // Standard cubic ease-in-out (smoothstep-like).
  "ease-in-out": (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Shortest-arc longitude interpolation — going from 170° to -170° the
 * short way is +20°, not -340°. Critical for `orbit` paths that cross
 * the antimeridian. Exported for tests.
 */
export const lerpLongitude = (a: number, b: number, t: number): number => {
  let delta = b - a;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return a + delta * t;
};

/**
 * Resolve the camera pose at a given Remotion frame. Returns the
 * interpolated lng/lat/altitude/bearing/pitch. Exported for unit tests so
 * the interpolation contract is locked.
 */
export const resolveCameraPose = (
  keyframes: ReadonlyArray<CameraKeyframe>,
  frame: number,
): {
  center: [number, number];
  altitudeM: number;
  bearing: number;
  pitch: number;
  lookAt?: [number, number];
} => {
  if (keyframes.length === 0) {
    return { center: [0, 0], altitudeM: 12_000_000, bearing: 0, pitch: 30 };
  }
  // Single keyframe — static pose.
  if (keyframes.length === 1) {
    const k = keyframes[0];
    return {
      center: k.center ?? [0, 0],
      altitudeM: k.altitudeM ?? (k.zoom != null ? zoomToAltitudeM(k.zoom) : 5_000_000),
      bearing: k.bearing ?? 0,
      pitch: k.pitch ?? 30,
      lookAt: k.lookAt,
    };
  }
  // Clamp before / after the path.
  if (frame <= keyframes[0].frame) {
    const k = keyframes[0];
    return {
      center: k.center ?? [0, 0],
      altitudeM: k.altitudeM ?? (k.zoom != null ? zoomToAltitudeM(k.zoom) : 5_000_000),
      bearing: k.bearing ?? 0,
      pitch: k.pitch ?? 30,
      lookAt: k.lookAt,
    };
  }
  const last = keyframes[keyframes.length - 1];
  if (frame >= last.frame) {
    return {
      center: last.center ?? [0, 0],
      altitudeM: last.altitudeM ?? (last.zoom != null ? zoomToAltitudeM(last.zoom) : 5_000_000),
      bearing: last.bearing ?? 0,
      pitch: last.pitch ?? 30,
      lookAt: last.lookAt,
    };
  }
  // Find the bracketing pair.
  let i = 0;
  while (i < keyframes.length - 1 && keyframes[i + 1].frame <= frame) i++;
  const a = keyframes[i];
  const b = keyframes[i + 1];
  const span = b.frame - a.frame;
  const tRaw = span <= 0 ? 0 : (frame - a.frame) / span;
  const ease = EASINGS[b.easing ?? "ease-in-out"];
  const t = ease(Math.min(1, Math.max(0, tRaw)));

  const aCenter = a.center ?? b.center ?? [0, 0];
  const bCenter = b.center ?? aCenter;
  const aAlt = a.altitudeM ?? (a.zoom != null ? zoomToAltitudeM(a.zoom) : 5_000_000);
  const bAlt = b.altitudeM ?? (b.zoom != null ? zoomToAltitudeM(b.zoom) : aAlt);
  const aBear = a.bearing ?? 0;
  const bBear = b.bearing ?? aBear;
  const aPitch = a.pitch ?? 30;
  const bPitch = b.pitch ?? aPitch;

  return {
    center: [
      lerpLongitude(aCenter[0], bCenter[0], t),
      lerp(aCenter[1], bCenter[1], t),
    ],
    altitudeM: lerp(aAlt, bAlt, t),
    bearing: lerp(aBear, bBear, t),
    pitch: lerp(aPitch, bPitch, t),
    lookAt: b.lookAt ?? a.lookAt,
  };
};

// ── DIR: cam directive translator ───────────────────────────────────

/**
 * Translate a DIR: cam directive into a CinematicCamera keyframe array.
 * Supports the four cinematic modes from the directing vocab:
 *
 *   • push-in   — start wide, end tight on the center. Altitude halves.
 *   • pull-back — start tight, end wide. Altitude doubles.
 *   • orbit     — fixed altitude + center, bearing sweeps `bearingDelta`.
 *   • pivot     — fixed center, pitch sweeps `pitchDelta` (camera tilts).
 *
 * Caller passes the anchor pose (`center`, `altitudeM`, `bearing`,
 * `pitch`) and the move duration in frames; the helper returns a two-
 * keyframe array suitable for `<CinematicCamera keyframes={...}>`.
 *
 * Reference: project/DIRECTING_LANGUAGE.md § "Camera (cam)".
 */
// ── Schema for data-driven cameraPath directives ────────────────────
//
// What script writers author in `_direction.cameraPath`:
//
//   "_direction": {
//     "cameraPath": [
//       { "mode": "push-in", "startSec": 0, "durationSec": 6,
//         "center": [104, 35], "zoom": 3 },
//       { "mode": "orbit", "startSec": 6, "durationSec": 4,
//         "center": [104, 35], "zoom": 3, "bearingDelta": 45 }
//     ]
//   }
//
// Validated at template-data parse time. Each directive translates to
// a 2-keyframe segment via `cinematicPathFromDirective`. Sequencing
// works via the `startSec` field — directives that overlap in time
// produce overlapping keyframes which `resolveCameraPose` handles
// (later keyframes win because the bracketing pair finder advances).

export const CinematicDirectiveSchema = z.object({
  mode: z.enum(["push-in", "pull-back", "orbit", "pivot"]),
  /** Start time in SECONDS (not frames — script-writer ergonomic). */
  startSec: z.number().nonnegative(),
  /** Duration in SECONDS. */
  durationSec: z.number().positive(),
  /** Lng/lat the camera looks at. */
  center: z.tuple([z.number(), z.number()]),
  /** Camera altitude in meters. Default 5,000,000. */
  altitudeM: z.number().positive().optional(),
  /** Equivalent zoom (converted to altitude if altitudeM is omitted). */
  zoom: z.number().optional(),
  /** Initial bearing in degrees. Default 0. */
  bearing: z.number().optional(),
  /** Initial pitch in degrees. Default 30. */
  pitch: z.number().optional(),
  /** Bearing sweep for `orbit`. Default 30. */
  bearingDelta: z.number().optional(),
  /** Pitch sweep for `pivot`. Default 15. */
  pitchDelta: z.number().optional(),
});

export type CinematicDirective = z.infer<typeof CinematicDirectiveSchema>;

/**
 * Translate an array of script-authored directives into the keyframe
 * array `<CinematicCamera>` consumes. Each directive becomes a
 * 2-keyframe segment (start pose + end pose); the resulting array is
 * flat-concatenated. `resolveCameraPose` finds the bracketing pair per
 * frame so adjacent / overlapping directives compose naturally.
 *
 * The translation is pure — exported for unit tests so the JSON →
 * keyframe contract is locked.
 */
export const buildKeyframesFromDirectives = (
  directives: ReadonlyArray<CinematicDirective>,
  fps: number,
): CameraKeyframe[] => {
  const out: CameraKeyframe[] = [];
  for (const d of directives) {
    out.push(
      ...cinematicPathFromDirective({
        mode: d.mode,
        startFrame: Math.round(d.startSec * fps),
        durationFrames: Math.round(d.durationSec * fps),
        center: d.center,
        altitudeM: d.altitudeM,
        zoom: d.zoom,
        bearing: d.bearing,
        pitch: d.pitch,
        bearingDelta: d.bearingDelta,
        pitchDelta: d.pitchDelta,
      }),
    );
  }
  return out;
};

export const cinematicPathFromDirective = (opts: {
  mode: "push-in" | "pull-back" | "orbit" | "pivot";
  startFrame: number;
  durationFrames: number;
  center: [number, number];
  altitudeM?: number;
  zoom?: number;
  bearing?: number;
  pitch?: number;
  /** Bearing sweep for orbit mode (degrees). Default 30. */
  bearingDelta?: number;
  /** Pitch sweep for pivot mode (degrees). Default 15. */
  pitchDelta?: number;
}): CameraKeyframe[] => {
  const baseAlt =
    opts.altitudeM ?? (opts.zoom != null ? zoomToAltitudeM(opts.zoom) : 5_000_000);
  const bearing = opts.bearing ?? 0;
  const pitch = opts.pitch ?? 30;
  const start: CameraKeyframe = {
    frame: opts.startFrame,
    center: opts.center,
    altitudeM: baseAlt,
    bearing,
    pitch,
    easing: "ease-in-out",
  };
  const end: CameraKeyframe = {
    frame: opts.startFrame + opts.durationFrames,
    center: opts.center,
    altitudeM: baseAlt,
    bearing,
    pitch,
    easing: "ease-in-out",
  };
  switch (opts.mode) {
    case "push-in":
      end.altitudeM = baseAlt * 0.5;
      break;
    case "pull-back":
      end.altitudeM = baseAlt * 2;
      break;
    case "orbit":
      end.bearing = bearing + (opts.bearingDelta ?? 30);
      break;
    case "pivot":
      end.pitch = pitch + (opts.pitchDelta ?? 15);
      break;
  }
  return [start, end];
};

// ── Component ────────────────────────────────────────────────────────

let fallbackWarned = false;

export const CinematicCamera: React.FC<CinematicCameraProps> = ({
  map,
  keyframes,
}) => {
  const frame = useCurrentFrame();
  const lastPoseRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map) return;
    const pose = resolveCameraPose(keyframes, frame);
    // Cheap dedupe — only push pose changes to Mapbox. Avoids 30 calls
    // per second when the camera is paused on a keyframe.
    const sig = `${pose.center[0].toFixed(4)},${pose.center[1].toFixed(4)},${pose.altitudeM.toFixed(0)},${pose.bearing.toFixed(2)},${pose.pitch.toFixed(2)}`;
    if (sig === lastPoseRef.current) return;
    lastPoseRef.current = sig;

    // FreeCamera path — preferred for cinematic altitude curves.
    // Mapbox's FreeCamera lives on the global `mapboxgl` object, NOT the
    // map instance. We dynamically require it so this component doesn't
    // tank server-side bundles or tests that mock the map.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const mapboxgl = require("mapbox-gl");
      if (
        mapboxgl?.FreeCameraOptions &&
        mapboxgl?.MercatorCoordinate &&
        typeof map.setFreeCameraOptions === "function"
      ) {
        const lookAt = pose.lookAt ?? pose.center;
        // Position camera at `center` altitudeM up; look at `lookAt`.
        // FreeCameraOptions handles bearing/pitch internally via lookAtPoint.
        const cameraPosition = mapboxgl.MercatorCoordinate.fromLngLat(
          { lng: pose.center[0], lat: pose.center[1] },
          pose.altitudeM,
        );
        const opts = new mapboxgl.FreeCameraOptions(cameraPosition, [0, 0, 0, 1]);
        opts.lookAtPoint({ lng: lookAt[0], lat: lookAt[1] });
        map.setFreeCameraOptions(opts);
        return;
      }
    } catch {
      // mapbox-gl not resolvable (test env, SSR) — fall through to jumpTo.
    }

    // Fallback: declarative jumpTo. Loses the altitude curve but keeps
    // motion continuous. Warn once so we know we're in fallback mode.
    if (typeof map.jumpTo === "function") {
      // Approximate zoom from altitude (inverse of zoomToAltitudeM).
      const zoom = Math.log2(7_000_000 / pose.altitudeM) + 1;
      map.jumpTo({
        center: pose.center,
        zoom,
        bearing: pose.bearing,
        pitch: pose.pitch,
      });
      if (!fallbackWarned && typeof console !== "undefined") {
        fallbackWarned = true;
        // eslint-disable-next-line no-console
        console.warn(
          "[CinematicCamera] FreeCamera unavailable — falling back to " +
            "jumpTo. Altitude curves will be approximated as zoom levels. " +
            "Verify mapbox-gl is installed and FreeCameraOptions is exported.",
        );
      }
    }
  }, [map, frame, keyframes]);

  return null;
};

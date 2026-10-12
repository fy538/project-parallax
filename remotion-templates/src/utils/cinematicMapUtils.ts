/**
 * cinematicMapUtils — helpers for the CinematicMap template.
 *
 * Two exports:
 *
 *   buildKeyframesFromSec(keyframes, fps)
 *     Converts sec-based CinematicMap keyframe inputs into the frame-based
 *     CameraKeyframe[] that `<CinematicCamera>` consumes.
 *
 *   warmTiles(map, keyframes)
 *     Tile pre-warmer: visits each keyframe position via `jumpTo()` to
 *     trigger DEM tile fetches, polls `areTilesLoaded()` per position, then
 *     resets the camera to keyframe[0] before CinematicCamera takes over.
 *
 * The warmTiles strategy is the difference between a clean render (terrain
 * relief visible on every frame) and a patchy one (DEM patches still
 * loading mid-fly-through). The max 10s per keyframe / 90s total limits
 * keep the startup cost bounded; on a fast connection with primed CDN the
 * typical cost is 2–5s per unique tile level.
 *
 * Two-pass fallback (document-only, not code):
 *   If terrain patches persist despite warmTiles, use:
 *   `npx remotion render --fps-override=1` (loads tiles at every position)
 *   then `npx remotion render` at 30fps (tiles already in browser cache).
 *   See references/template-research/cinematic-map.md § Tile pre-warmer.
 *
 * Exported for unit tests — the sec→frame conversion and the
 * warmTiles poll loop can both be tested in isolation.
 */

import { zoomToAltitudeM } from "../components/CinematicCamera";
import type { CameraKeyframe } from "../components/CinematicCamera";
import type { CinematicKeyframeInput } from "../templates/CinematicMap/types";

// ── sec → frame conversion ─────────────────────────────────────────────────

/**
 * Convert the sec-based keyframes authored in CinematicMap JSON data into
 * the frame-based CameraKeyframe[] consumed by `<CinematicCamera>`.
 *
 * Preserves all optional fields (lookAt, bearing, pitch, easing). When
 * both `altitudeM` and `zoom` are omitted, the frame-based keyframe leaves
 * them undefined — `resolveCameraPose` in CinematicCamera falls through to
 * its 5,000,000 m default.
 */
export function buildKeyframesFromSec(
  keyframes: ReadonlyArray<CinematicKeyframeInput>,
  fps: number,
): CameraKeyframe[] {
  return keyframes.map((kf) => {
    const frame = Math.round(kf.sec * fps);
    const altitudeM =
      kf.altitudeM != null
        ? kf.altitudeM
        : kf.zoom != null
          ? zoomToAltitudeM(kf.zoom)
          : undefined;

    const out: CameraKeyframe = {
      frame,
      center: kf.center,
    };
    if (altitudeM != null) out.altitudeM = altitudeM;
    if (kf.pitch != null) out.pitch = kf.pitch;
    if (kf.bearing != null) out.bearing = kf.bearing;
    if (kf.lookAt != null) out.lookAt = kf.lookAt;
    if (kf.easing != null) out.easing = kf.easing;
    return out;
  });
}

// ── Tile pre-warmer ────────────────────────────────────────────────────────

/**
 * Map instance surface used by warmTiles. We accept a structural type
 * (not the full mapbox-gl Map) so callers don't need to install @types/mapbox-gl
 * just to type their state, and so the function can be tested with a mock.
 */
export interface WarmableMapInstance {
  jumpTo: (opts: {
    center: [number, number];
    zoom: number;
    bearing?: number;
    pitch?: number;
  }) => void;
  areTilesLoaded: () => boolean;
}

const PER_POSITION_TIMEOUT_MS = 10_000; // 10s max per keyframe position
const TOTAL_TIMEOUT_MS = 90_000;        // 90s absolute ceiling
const POLL_INTERVAL_MS = 200;           // check areTilesLoaded every 200ms

/**
 * Visit each keyframe position in sequence, waiting for tiles to load at
 * each one before moving on. Resets the camera to keyframe[0] when done
 * (or when the total timeout is hit) so CinematicCamera starts from the
 * correct initial pose.
 *
 * The function resolves (never rejects) — on timeout it logs a warning and
 * resolves anyway so the caller can still call `continueRender()`. Terrain
 * DEM patches may appear in some frames in that case; the two-pass fallback
 * in the dossier handles the systematic case.
 *
 * Note on high-pitch shots: warmTiles uses pitch=0 (overhead) at each
 * position to maximise tile footprint. For shots at pitch 60–75°, the
 * visible far-horizon tile frustum differs from the overhead footprint, so
 * distant ridgeline tiles may still be patchy despite warmTiles completing
 * cleanly. Budget extra warm time or use the two-pass fallback
 * (fps-override=1 first) for high-pitch terrain shots.
 *
 * @param map        Mapbox instance with jumpTo + areTilesLoaded
 * @param keyframes  Sec-based keyframes from CinematicMapData. Only center,
 *                   altitudeM/zoom, bearing, and pitch are used — frame
 *                   values are not needed for tile warming.
 */
export function warmTiles(
  map: WarmableMapInstance,
  keyframes: ReadonlyArray<CinematicKeyframeInput>,
): Promise<void> {
  return new Promise<void>((resolve) => {
    const startMs = Date.now();
    let positionIndex = 0;

    function checkTotalTimeout(): boolean {
      if (Date.now() - startMs >= TOTAL_TIMEOUT_MS) {
        // eslint-disable-next-line no-console
        console.warn(
          "[CinematicMap] warmTiles: 90s total timeout reached. " +
            "Some terrain DEM tiles may not be fully loaded. " +
            "Re-render or use the two-pass strategy (fps-override=1 first). " +
            "See references/template-research/cinematic-map.md § Tile pre-warmer.",
        );
        resetAndResolve();
        return true;
      }
      return false;
    }

    function altMForKf(kf: CinematicKeyframeInput): number {
      if (kf.altitudeM != null) return kf.altitudeM;
      if (kf.zoom != null) return zoomToAltitudeM(kf.zoom);
      return 5_000_000; // continental default
    }

    function resetAndResolve(): void {
      // Reset to the first keyframe position so CinematicCamera starts
      // from the correct initial pose (not whatever the last warmed position was).
      const first = keyframes[0];
      if (first) {
        const altM = altMForKf(first);
        const zoom = Math.log2(7_000_000 / altM) + 1;
        map.jumpTo({
          center: first.center,
          zoom,
          bearing: first.bearing ?? 0,
          pitch: first.pitch ?? 30,
        });
      }
      resolve();
    }

    function warmPosition(): void {
      if (checkTotalTimeout()) return;

      if (positionIndex >= keyframes.length) {
        // All positions warmed — reset and hand control back.
        resetAndResolve();
        return;
      }

      const kf = keyframes[positionIndex];
      const altM = altMForKf(kf);
      const zoom = Math.log2(7_000_000 / altM) + 1;

      // Jump to this keyframe position — purely to trigger tile fetches.
      // CinematicCamera will re-drive the camera from frame 0 once
      // continueRender() is called.
      map.jumpTo({
        center: kf.center,
        zoom,
        bearing: kf.bearing ?? 0,
        pitch: kf.pitch ?? 0, // flat pitch maximises overhead tile coverage
      });

      const positionStartMs = Date.now();

      function poll(): void {
        if (checkTotalTimeout()) return;

        if (map.areTilesLoaded()) {
          // This position is warm — move to the next one.
          positionIndex += 1;
          warmPosition();
          return;
        }

        if (Date.now() - positionStartMs >= PER_POSITION_TIMEOUT_MS) {
          // This position timed out — log and continue to the next.
          // eslint-disable-next-line no-console
          console.warn(
            `[CinematicMap] warmTiles: position ${positionIndex} ` +
              `(${kf.center[0].toFixed(2)}, ${kf.center[1].toFixed(2)}) ` +
              `timed out after ${PER_POSITION_TIMEOUT_MS / 1000}s. ` +
              "DEM tiles may be incomplete at this position.",
          );
          positionIndex += 1;
          warmPosition();
          return;
        }

        // Still loading — poll again.
        setTimeout(poll, POLL_INTERVAL_MS);
      }

      poll();
    }

    warmPosition();
  });
}

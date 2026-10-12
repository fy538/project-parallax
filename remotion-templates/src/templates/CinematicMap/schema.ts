/**
 * Zod schema for CinematicMap template.
 *
 * The primary field is `keyframes[]` — a sec-based camera path. Every other
 * field is either a map-register choice (terrain, fogPreset, lightPreset) or
 * an optional overlay (annotations, graticule). There is no title field by
 * design — cinematic maps don't title.
 *
 * See: references/template-research/cinematic-map.md
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { MapAnnotationSchema } from "../../components/MapAnnotations.types";
import { GraticuleSchema } from "../../components/Graticule.types";
import {
  RegisterSchema,
  LightPresetSchema,
} from "../../components/MapGL.types";

// ── Keyframe schema ────────────────────────────────────────────────────────

/**
 * A single time-positioned camera pose, authored in seconds.
 * In the component, `sec` is converted to frames via `fps`.
 *
 * Either `altitudeM` or `zoom` must be provided; `altitudeM` wins if both
 * are present. Omitting both defaults to 5,000,000 m (continental scale).
 */
export const CinematicKeyframeSchema = z.object({
  /** Time in seconds at which the camera reaches this pose. Min 0. */
  sec: z.number().nonnegative(),
  /** Lng/lat the camera looks at. Required on every keyframe. */
  center: z.tuple([z.number(), z.number()]),
  /**
   * Camera altitude in meters above WGS84.
   *   200 m   — helicopter / very tight
   *   4 000 m — valley-floor approach
   *  80 000 m — regional (strait-width)
   * 500 000 m — entering atmosphere
   * 9 000 000 m — full globe
   */
  altitudeM: z.number().positive().optional(),
  /** Equivalent zoom level — converted to altitudeM if altitudeM is absent. */
  zoom: z.number().optional(),
  /** Camera pitch in degrees. 0 = straight down; 85 = nearly horizontal. */
  pitch: z.number().min(0).max(85).optional(),
  /** Camera bearing in degrees. 0 = north up. */
  bearing: z.number().optional(),
  /**
   * Off-axis look-at target [lng, lat]. When set, the camera position is
   * derived from center + altitude + pitch/bearing and it looks AT lookAt
   * instead of straight down. Use for parallax shots where the focal point
   * is not directly below the camera.
   *
   * Note: lookAt is NOT interpolated between keyframes — CinematicCamera
   * snaps to the next keyframe's lookAt value at the frame boundary. Design
   * shots with a single consistent lookAt if you need continuous off-axis
   * tracking; for a smooth lookAt transition, author more keyframes.
   */
  lookAt: z.tuple([z.number(), z.number()]).optional(),
  /**
   * Easing curve from the PREVIOUS keyframe to this one.
   * Default "ease-in-out" for smooth cinematic motion.
   */
  easing: z
    .enum(["linear", "ease-in", "ease-out", "ease-in-out"])
    .optional(),
});

// ── Top-level schema ───────────────────────────────────────────────────────

export const CinematicMapDataSchema = z.object({
  /** Episode slug — links back to the episode directory. */
  episode: z.string(),
  /** Source attribution string (shown in FooterStrip if provided). */
  source: z.string().optional(),
  /**
   * Total duration in seconds. When provided, overrides the max keyframe
   * `sec` value for durationInFrames. Useful when the last keyframe holds
   * for longer than its position suggests (e.g., freeze on final pose).
   */
  durationSec: z.number().positive().optional(),

  // ── Camera path ──────────────────────────────────────────────────────────
  /**
   * Ordered camera keyframes. At least two are required (start + end).
   * Rendered duration = max(keyframes[].sec) when durationSec is unset.
   */
  keyframes: z.array(CinematicKeyframeSchema).min(2),

  // ── Map register ─────────────────────────────────────────────────────────
  /**
   * Visual register. Default "dark" — cinematic maps use the dark register
   * by convention (terrain pop is highest against dark tiles; atmospheric
   * fog reads best against dark space). See MapGL.types.ts.
   */
  register: RegisterSchema.optional(),
  /**
   * Atmospheric / fog preset. Default "atmospheric" — star intensity +
   * warm horizon reads as cinematic; the editorial (paper-tinted) preset
   * would fight the dark register.
   */
  fogPreset: z
    .enum(["editorial", "atmospheric", "vintage", "none"])
    .optional(),
  /**
   * Mapbox Standard scene lighting preset. Default "dusk" — twilight
   * register suits terrain fly-throughs (long shadows, warm ambient).
   * Use "night" for covert ops / late-hour narration.
   */
  lightPreset: LightPresetSchema.optional(),
  /**
   * Enable terrain hillshading. Default TRUE — terrain is the point of
   * this template. The only reason to set false is if you're using
   * CinematicMap purely for the smooth camera motion but the shot is over
   * water (no DEM terrain to show).
   */
  terrain: z.boolean().optional(),
  /**
   * Terrain exaggeration factor. 1.0 = real elevation; 1.5 = 50% relief
   * boost (editorial default — slight exaggeration reads better at altitude
   * than real-world muted relief). Max 3.0 per Mapbox API.
   */
  terrainExaggeration: z.number().min(0).max(3).optional(),

  // ── Optional overlays ─────────────────────────────────────────────────────
  /**
   * Editorial annotations layered on the map. Same schema as RouteAnimation
   * annotations — lon/lat anchor, hierarchy, optional leader line.
   * See: components/MapAnnotations.types.ts.
   */
  annotations: z.array(MapAnnotationSchema).optional(),
  /**
   * Parallels-and-meridians graticule. On-brand for the atlas register.
   * Pass `true` for defaults (10° spacing, 0.10 opacity) or a config object.
   */
  graticule: GraticuleSchema.optional(),

  // ── Standard fields ───────────────────────────────────────────────────────
  /** Directing-language block — camera paths, drift, atmosphere overrides. */
  _direction: DirectionBlockSchema.optional(),
  /** Background mode override — usually "dark" for cinematic maps. */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
});

/** Top-level wrapper consumed by Remotion Composition schema prop. */
export const CinematicMapSchema = z.object({
  data: CinematicMapDataSchema,
});

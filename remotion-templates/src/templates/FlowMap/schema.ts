/**
 * Zod schemas for the FlowMap template.
 *
 * FlowMap renders directional volume flows between geographic regions.
 * Arc width ∝ sqrt(volume) — the magnitude comparison IS the editorial argument.
 *
 * Two reveal modes:
 *   - "simultaneous": all flows fade in together (comparative magnitude argument)
 *   - "stagger": each flow has revealAtSec (sequential causation argument)
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — Flow & Composition family.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { MapAnnotationSchema } from "../../components/MapAnnotations.types";
import { GraticuleSchema } from "../../components/Graticule.types";
import { LightPresetSchema, RegisterSchema } from "../../components/MapGL.types";

// ── FlowArc ────────────────────────────────────────────────────────────────

export const FlowArcSchema = z.object({
  /** Unique identifier for this flow arc. */
  id: z.string(),
  /** Origin [lng, lat]. */
  from: z.tuple([z.number(), z.number()]),
  /** Destination [lng, lat]. */
  to: z.tuple([z.number(), z.number()]),
  /**
   * Raw volume in consistent units across all flows.
   * Used for relative arc-width sizing: width ∝ sqrt(volume / maxVolume).
   */
  volume: z.number().positive(),
  /** Optional destination label rendered as a Marker. */
  label: z.string().optional(),
  /**
   * Actor key — maps to actors[id].fill for color grouping.
   * All flows with the same actor share a color (e.g. "chip", "oil", "primary").
   */
  actor: z.string().optional(),
  /**
   * Stagger reveal time in seconds. Only used in "stagger" mode.
   * Each flow fades in over 0.6s starting at this timestamp.
   */
  revealAtSec: z.number().nonnegative().optional(),
  /**
   * Optional haversine distance override in km.
   * When omitted, distance is auto-computed from `from`/`to` coordinates.
   * Affects arc height heuristic: arcs < 3000km render flat (no great-circle bow).
   */
  distanceKm: z.number().positive().optional(),
});

// ── FlowActor ─────────────────────────────────────────────────────────────

export const FlowActorSchema = z.object({
  /** Hex fill color for all arcs belonging to this actor. */
  fill: z.string(),
  /** Human-readable label for the legend. */
  label: z.string().optional(),
});

// ── FlowMapData ───────────────────────────────────────────────────────────

export const FlowMapDataSchema = z.object({
  // ── Episode metadata ────────────────────────────────────────────────────
  episode: z.string(),
  title: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),

  // ── Flow data ───────────────────────────────────────────────────────────
  /** At least one flow arc required. */
  flows: z.array(FlowArcSchema).min(1),
  /**
   * Named actor groups for color assignment and legend labeling.
   * Key matches FlowArc.actor. Omit for single-color flows.
   */
  actors: z.record(z.string(), FlowActorSchema).optional(),
  /**
   * Explicit normalization ceiling. When absent, auto-computed as
   * max(flows[].volume). Set explicitly when comparing across episodes or
   * when an outlier flow would compress all other arc widths.
   */
  maxVolume: z.number().positive().optional(),

  // ── Reveal mode ─────────────────────────────────────────────────────────
  /**
   * "simultaneous" (default): all flows fade in together at t=0.3s.
   *   The comparative magnitude is the editorial argument.
   * "stagger": each flow has revealAtSec, fades in over 0.6s.
   *   Sequential causation is the editorial argument.
   */
  mode: z.enum(["simultaneous", "stagger"]).optional(),
  /**
   * Render SVG arrowheads at each arc's destination. Default false.
   * Use when the directionality needs explicit reinforcement (stagger mode,
   * or when particles alone don't read at small arc widths).
   */
  showArrowheads: z.boolean().optional(),
  /**
   * Animate particles traveling along arcs to show directionality.
   * Default true. Set false for a purely static comparative map.
   */
  showParticles: z.boolean().optional(),

  // ── Particle tuning ──────────────────────────────────────────────────────
  /**
   * Particle travel speed in cycles per frame. Default 0.0035.
   * Matches the RouteAnimation particle speed for visual consistency.
   */
  particleSpeed: z.number().positive().optional(),
  /**
   * Base particle count per arc before volume scaling. Default 3.
   * Actual count = max(2, ceil(sqrt(volume / maxVolume) * particlesPerArc * 2)).
   * More particles = denser stream, reinforcing the "high volume" signal.
   */
  particlesPerArc: z.number().int().positive().optional(),

  // ── Map settings ─────────────────────────────────────────────────────────
  /** Map center [lng, lat]. Required. */
  center: z.tuple([z.number(), z.number()]),
  /** Mapbox GL zoom level. Required. */
  zoom: z.number(),
  /** Camera pitch in degrees. Default 25 (slight tilt; flows read better with perspective). */
  pitch: z.number().min(0).max(85).optional(),
  /** Camera bearing in degrees. Default 0 (north up). */
  bearing: z.number().optional(),
  /** Visual register. Default "dark" for flow maps (arcs pop on dark basemap). */
  register: RegisterSchema.optional(),
  /** Atmospheric fog preset. Default "editorial". */
  fogPreset: z.enum(["editorial", "atmospheric", "vintage", "none"]).optional(),
  /** Mapbox Standard scene lighting preset. */
  lightPreset: LightPresetSchema.optional(),
  /** Enable terrain hillshading. Default false (flow maps focus on routes, not relief). */
  terrain: z.boolean().optional(),

  // ── Overlays ─────────────────────────────────────────────────────────────
  /** Editorial annotation overlays (lon/lat anchored labels with optional leader lines). */
  annotations: z.array(MapAnnotationSchema).optional(),
  /** Parallels-and-meridians graticule. On-brand atlas register. */
  graticule: GraticuleSchema.optional(),
  /**
   * Volume legend in bottom-left. Default true.
   * Shows three reference arc widths (small/medium/large) with relative volume labels.
   * Set false when the arc sizes are already self-explanatory or labeled.
   */
  showLegend: z.boolean().optional(),

  // ── Standard fields ───────────────────────────────────────────────────────
  /** Background mode — "light" for analytical editorial, "dark" for cinematic. */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Directing-language block (_direction JSON from visual-spec). */
  _direction: DirectionBlockSchema.optional(),
})
.superRefine((d, ctx) => {
  if (d.mode === "stagger") {
    const missing = d.flows.filter((f) => f.revealAtSec === undefined);
    if (missing.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `stagger mode: ${missing.length} flow(s) are missing revealAtSec`,
        path: ["flows"],
      });
    }
  }
  if (d.actors) {
    for (const flow of d.flows) {
      if (flow.actor && !(flow.actor in d.actors)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `flow "${flow.id}" references actor "${flow.actor}" which is not defined in actors`,
          path: ["flows"],
        });
      }
    }
  }
});

/** Top-level wrapper consumed by Remotion Composition schema prop. */
export const FlowMapSchema = z.object({
  data: FlowMapDataSchema,
});

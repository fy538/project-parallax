/**
 * Zod schemas for AnnotatedZoom template — runtime validation + Remotion
 * Studio editing.
 *
 * AnnotatedZoom is the "pure camera movement on a 2D canvas" form.
 * It progressively zooms into sequential regions of a brand-treated base
 * image. The framing IS the argument — no annotation callouts needed.
 *
 * Editorial register: directional — "look here, then here, then here."
 * Sibling of ScrollyReveal (which combines zoom + annotation callouts).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const AnnotatedZoomRegionSchema = z.object({
  /** Time (in seconds) when this zoom region fires. Must be ascending. */
  revealAtSec: z.number().nonnegative(),
  /** Horizontal focus point as % of image width (0 = left, 100 = right). */
  centerX: z.number().min(0).max(100),
  /** Vertical focus point as % of image height (0 = top, 100 = bottom). */
  centerY: z.number().min(0).max(100),
  /** Zoom scale: 1.0 = full frame, 5.0 = 5× magnification. */
  scale: z.number().min(1).max(5),
  /** Duration of the zoom transition into this region (seconds, default 0.8). */
  transitionSec: z.number().positive().optional(),
  /** Overlay text label shown during this region's active window. */
  label: z.string().optional(),
  /** Secondary overlay text shown below the label. */
  sublabel: z.string().optional(),
  /**
   * When true, render thin crosshair hairlines (horizontal + vertical) at
   * the zoom target center. Editorial register: tactical precision, targeting.
   * Default false.
   */
  showCrosshair: z.boolean().optional(),
});

export const AnnotatedZoomDataSchema = z.object({
  episode: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),

  /** The base image to zoom into. */
  base: z.object({
    /** Asset path relative to public/ or a full https:// URL. */
    src: z.string(),
    /** Alt text for accessibility / catalog metadata. */
    alt: z.string().optional(),
    /** Brand duotone ramp applied to the image. Default "standard". */
    duotoneRamp: z.enum(["standard", "conflict", "editorial"]).optional(),
    /** CSS object-position override. Default "center". */
    objectPosition: z.string().optional(),
  }),

  /**
   * Sequential zoom regions. At least one required; max 8 (editorial
   * constraint — more than 8 zoom moves tax the viewer's spatial model).
   */
  regions: z.array(AnnotatedZoomRegionSchema).min(1).max(8),

  /**
   * Whether to hold at the last region until the end of composition.
   * Default true. When false, the camera returns to full frame (scale 1.0)
   * over 1s before the composition ends.
   */
  holdAtLastRegion: z.boolean().optional(),
});

export const AnnotatedZoomSchema = z.object({ data: AnnotatedZoomDataSchema });

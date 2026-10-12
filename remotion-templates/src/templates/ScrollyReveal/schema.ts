/**
 * ScrollyReveal schema — progressive annotation reveal over a brand-treated image.
 *
 * Each `step` reveals one or more annotations at a declared time offset.
 * The base image can pan/zoom to a focus region as steps progress.
 * Annotations accumulate (all remain) or replace (only current step shown).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// One annotation within a step
export const ScrollyAnnotationSchema = z.object({
  id: z.string(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  label: z.string(),
  detail: z.string().optional(),
  placement: z.enum(["top", "bottom", "left", "right"]).optional(),
  color: z.string().optional(),
  type: z.enum(["callout", "highlight", "trace"]).optional(),
  /** "trace" only — ring radius in canvas px (default 100). */
  radius: z.number().positive().optional(),
});

// One "step" — a beat in the scrollytelling sequence
export const ScrollyStepSchema = z.object({
  /** Time (seconds from composition start) at which this step's annotations appear. */
  revealAtSec: z.number().nonnegative(),
  /** Annotations that appear at this step. */
  annotations: z.array(ScrollyAnnotationSchema).min(1),
  /**
   * Optional pan/zoom focus for the base image at this step.
   * The image CSS transform transitions to this focus over `durationSec`.
   */
  focus: z
    .object({
      /** Horizontal center of focus region, 0–100% of image width. */
      centerX: z.number().min(0).max(100),
      /** Vertical center of focus region, 0–100% of image height. */
      centerY: z.number().min(0).max(100),
      /** Zoom level: 1.0 = full frame, 1.5 = 150% zoom, 2.0 = 200% zoom. Max 2.5. */
      scale: z.number().min(1).max(2.5),
      /** Pan/zoom transition duration in seconds. Default 0.6. */
      durationSec: z.number().positive().optional(),
    })
    .optional(),
  /** Optional label for this step (shown in debug/Studio mode only). */
  stepLabel: z.string().optional(),
});

export const ScrollyRevealDataSchema = z.object({
  episode: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),

  /** Base visual — the image that anchors the composition. */
  base: z.object({
    /** Path or URL to the image. */
    src: z.string(),
    alt: z.string().optional(),
    /** Brand duotone treatment applied to the image. Default "standard". */
    duotoneRamp: z.enum(["standard", "conflict", "editorial"]).optional(),
    /** Object-fit position for the image within its container. Default "center". */
    objectPosition: z.string().optional(),
  }),

  /**
   * Ordered sequence of annotation steps.
   * Steps are revealed in order by revealAtSec.
   * Minimum 1 step; a single step is a static annotation.
   */
  steps: z.array(ScrollyStepSchema).min(1),

  /**
   * Whether annotations from previous steps remain visible.
   * "accumulate" (default): all previous annotations stay on screen.
   * "replace": only the current step's annotations are shown (previous fade out).
   */
  annotationMode: z.enum(["accumulate", "replace"]).optional(),

  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const ScrollyRevealSchema = z.object({ data: ScrollyRevealDataSchema });

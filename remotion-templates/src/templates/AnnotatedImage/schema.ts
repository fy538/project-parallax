/**
 * Zod schemas for AnnotatedImage template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down). See StatReveal for
 * the canonical migration pattern.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const CalloutSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  label: z.string(),
  detail: z.string().optional(),
  placement: z.enum(["top", "bottom", "left", "right"]).optional(),
  leaderLength: z.number().positive().optional(),
  color: z.string().optional(),
});

export const AnnotatedImageDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  imageSrc: z.string(),
  imageAlt: z.string().optional(),
  duotoneRamp: z.enum(["standard", "conflict", "editorial"]).optional(),
  callouts: z.array(CalloutSchema),
  source: z.string().optional(),
  durationSec: z.number().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const AnnotatedImageSchema = z.object({
  data: AnnotatedImageDataSchema,
});

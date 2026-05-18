/**
 * Zod schemas for RidgelinePlot template — runtime validation +
 * Remotion Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const DensitySampleSchema = z.object({
  x: z.number(),
  y: z.number().min(0, {
    message:
      "Density values must be non-negative — a probability density cannot be < 0.",
  }),
});

export const RidgelineGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string().optional(),
  density: z
    .array(DensitySampleSchema)
    .min(3, {
      message:
        "RidgelinePlot group requires at least 3 density samples — fewer than that does not form a curve.",
    }),
});

export const RidgelinePlotDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  groups: z.array(RidgelineGroupSchema).min(2, {
    message:
      "RidgelinePlot requires at least two groups — a single ridge is just a density plot.",
  }),
  xAxisLabel: z.string(),
  xUnit: z.string().optional(),
  overlap: z.number().min(0).max(0.8).optional(),
  highlightIds: z.array(z.string()).optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  backgroundTint: z.string().optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const RidgelinePlotSchema = z.object({
  data: RidgelinePlotDataSchema,
});

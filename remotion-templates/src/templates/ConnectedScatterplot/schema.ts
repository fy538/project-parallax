/**
 * Zod schemas for ConnectedScatterplot template — runtime validation +
 * Remotion Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const ScatterPointSchema = z.object({
  year: z.number(),
  x: z.number(),
  y: z.number(),
  label: z.string().optional(),
  highlight: z.boolean().optional(),
});

export const ConnectedScatterplotDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  points: z.array(ScatterPointSchema).min(2, {
    message:
      "ConnectedScatterplot requires at least two points — a single observation has no trajectory to draw.",
  }),
  xAxisLabel: z.string(),
  yAxisLabel: z.string(),
  xUnit: z.string().optional(),
  yUnit: z.string().optional(),
  valueFormat: z.enum(["number", "percent", "currency"]).optional(),
  trajectoryColor: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  backgroundTint: z.string().optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const ConnectedScatterplotSchema = z.object({
  data: ConnectedScatterplotDataSchema,
});

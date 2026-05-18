/**
 * Zod schema for BulletChart template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { EditorialFrameSchema } from "../../components/EditorialFrame/schema";

export const BulletMeasureSchema = z.object({
  label: z.string(),
  actual: z.number(),
  target: z.number(),
  qualitativeRanges: z.array(z.number()).min(1, {
    message: "At least one qualitative range upper bound is required.",
  }),
  color: z.string().optional(),
});

export const BulletChartDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  measures: z.array(BulletMeasureSchema).min(1),
  unit: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  backgroundTint: z.string().optional(),
  frame: EditorialFrameSchema.optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const BulletChartSchema = z.object({
  data: BulletChartDataSchema,
});

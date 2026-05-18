/**
 * Zod schema for KPICard template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { EditorialFrameSchema } from "../../components/EditorialFrame/schema";

export const KPICardDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  value: z.string(),
  unit: z.string().optional(),
  change: z.string().optional(),
  changeColor: z.string().optional(),
  context: z.string().optional(),
  trend: z.array(z.number()).optional(),
  trendColor: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  backgroundTint: z.string().optional(),
  frame: EditorialFrameSchema.optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const KPICardSchema = z.object({
  data: KPICardDataSchema,
});

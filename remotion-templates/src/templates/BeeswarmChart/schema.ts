/**
 * Zod schemas for BeeswarmChart — runtime validation + Remotion Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const BeeswarmItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
  highlight: z.boolean().optional(),
  group: z.string().optional(),
});

export const BeeswarmReferenceLineSchema = z.object({
  value: z.number(),
  label: z.string(),
});

export const BeeswarmDataSchema = z.object({
  episode: z.string(),
  title: z
    .string()
    .describe(
      "State the finding, not the topic. 'Most NATO members fall under 2%' beats 'Defense Spending by Country'.",
    ),
  subtitle: z.string().optional(),
  items: z
    .array(BeeswarmItemSchema)
    .min(3, {
      message:
        "BeeswarmChart needs at least 3 items — for 1–2 entities use StatReveal.",
    })
    .describe(
      "Items get sorted by value internally. Set `highlight: true` to call out specific entities.",
    ),
  axisLabel: z.string().optional(),
  unit: z.string().optional(),
  valueFormat: z.enum(["number", "percent", "currency"]).optional(),
  referenceLine: BeeswarmReferenceLineSchema.optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  backgroundTint: z.string().optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const BeeswarmChartSchema = z.object({
  data: BeeswarmDataSchema,
});

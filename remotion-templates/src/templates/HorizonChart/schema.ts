/**
 * Zod schemas for HorizonChart template — runtime validation + Remotion
 * Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const HorizonDatumSchema = z.object({
  x: z.number(),
  value: z.number(),
});

export const HorizonSeriesSchema = z.object({
  id: z.string(),
  label: z.string(),
  sublabel: z.string().optional(),
  color: z.string().optional(),
  values: z.array(HorizonDatumSchema).min(2, {
    message:
      "HorizonChart series requires at least two observations — a single point has no shape to encode as bands.",
  }),
});

export const HorizonChartDataSchema = z.object({
  episode: z.string(),
  title: z
    .string()
    .describe(
      "State the structural finding, not the topic. Write: 'BRICS+ currencies diverged in mid-2024' not 'BRICS+ currency dashboard'. The title IS the editorial argument.",
    ),
  subtitle: z.string().optional(),
  series: z.array(HorizonSeriesSchema).min(2, {
    message:
      "HorizonChart needs at least two series — a single horizon strip is just a folded area chart. Use TimeSeriesChart with areaFill for one series.",
  }),
  xAxisLabel: z.string().optional(),
  valueFormat: z.enum(["number", "percent", "currency"]).optional(),
  positiveColor: z.string().optional(),
  negativeColor: z.string().optional(),
  bands: z.number().int().min(1).max(5).optional(),
  baseline: z.number().optional(),
  scaleMode: z
    .enum(["per-series", "shared"])
    .optional()
    .describe(
      "Band-height scaling. 'per-series' (default) auto-scales each strip to its own ±range — Tufte canon, optimised for coincidence detection. 'shared' uses a single global range across all series — use when the magnitude difference between series IS the editorial argument.",
    ),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  backgroundTint: z.string().optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const HorizonChartSchema = z.object({
  data: HorizonChartDataSchema,
});

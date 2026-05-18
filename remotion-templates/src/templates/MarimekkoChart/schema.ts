/**
 * Zod schemas for MarimekkoChart template — runtime validation +
 * Remotion Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const MarimekkoSegmentSchema = z.object({
  key: z.string(),
  label: z.string(),
  color: z.string().optional(),
  value: z.number().nonnegative(),
});

export const MarimekkoColumnSchema = z.object({
  id: z.string(),
  label: z.string(),
  sublabel: z.string().optional(),
  width: z.number().positive(),
  segments: z.array(MarimekkoSegmentSchema).min(1, {
    message:
      "MarimekkoChart: each column needs at least one segment — an empty stack has nothing to render.",
  }),
});

export const MarimekkoChartDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  columns: z.array(MarimekkoColumnSchema).min(2, {
    message:
      "MarimekkoChart: at least two columns are required — a single column reads as a plain stacked bar, not a Marimekko.",
  }),
  widthMode: z.enum(["absolute", "percent"]).optional(),
  segmentColorMap: z.record(z.string(), z.string()).optional(),
  emphasisKey: z.string().optional(),
  valueFormat: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  backgroundTint: z.string().optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const MarimekkoChartSchema = z.object({
  data: MarimekkoChartDataSchema,
});

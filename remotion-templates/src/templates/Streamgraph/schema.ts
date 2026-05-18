/**
 * Zod schemas for Streamgraph template — runtime validation + Remotion
 * Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const StreamPointSchema = z.object({
  x: z.number(),
  value: z.number().min(0, {
    message:
      "Streamgraph values must be non-negative — a stacked area cannot stack a negative band. Bucket the offending series or transform the data.",
  }),
});

export const StreamSeriesSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string().optional(),
  values: z.array(StreamPointSchema).min(2, {
    message:
      "Each Streamgraph series needs at least two points — a single point has no temporal shape to render.",
  }),
});

export const StreamOffsetSchema = z.enum(["silhouette", "wiggle", "zero"]);
export const StreamValueFormatSchema = z.enum(["number", "percent", "currency"]);

export const StreamAggregateOtherSchema = z.object({
  maxSeries: z.number().int().min(2).optional(),
  otherLabel: z.string().optional(),
  otherColor: z.string().optional(),
});

export const StreamgraphDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  series: z.array(StreamSeriesSchema).min(2, {
    message:
      "Streamgraph needs at least two series — a single band has no composition to show. Use TimeSeriesChart for a single-series story.",
  }),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  valueFormat: StreamValueFormatSchema.optional(),
  offset: StreamOffsetSchema.optional(),
  aggregateOther: StreamAggregateOtherSchema.optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  backgroundTint: z.string().optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const StreamgraphSchema = z.object({
  data: StreamgraphDataSchema,
});

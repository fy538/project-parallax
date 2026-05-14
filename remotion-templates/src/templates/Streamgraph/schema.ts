/**
 * Zod schemas for Streamgraph template — runtime validation + Remotion
 * Studio editing.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

const StreamPointSchema = z.object({
  x: z.number(),
  value: z.number().min(0, {
    message:
      "Streamgraph values must be non-negative — a stacked area cannot stack a negative band. Bucket the offending series or transform the data.",
  }),
});

const StreamSeriesSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string().optional(),
  values: z.array(StreamPointSchema).min(2, {
    message:
      "Each Streamgraph series needs at least two points — a single point has no temporal shape to render.",
  }),
});

export const StreamgraphSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    series: z.array(StreamSeriesSchema).min(2, {
      message:
        "Streamgraph needs at least two series — a single band has no composition to show. Use TimeSeriesChart for a single-series story.",
    }),
    xAxisLabel: z.string().optional(),
    yAxisLabel: z.string().optional(),
    valueFormat: z.enum(["number", "percent", "currency"]).optional(),
    offset: z.enum(["silhouette", "wiggle", "zero"]).optional(),
    aggregateOther: z
      .object({
        maxSeries: z.number().int().min(2).optional(),
        otherLabel: z.string().optional(),
        otherColor: z.string().optional(),
      })
      .optional(),
    source: z.string().optional(),
    durationSec: z.number().positive().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    backgroundTint: z.string().optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});

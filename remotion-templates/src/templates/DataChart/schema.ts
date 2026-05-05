/**
 * Zod schemas for DataChart template — runtime validation + Remotion Studio editing.
 */

import { z } from "zod";

const DataPointSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
  sublabel: z.string().optional(),
});

const ComparisonPairSchema = z.object({
  label: z.string(),
  leftValue: z.number(),
  rightValue: z.number(),
  leftLabel: z.string().optional(),
  rightLabel: z.string().optional(),
});

export const DataChartSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    variant: z.enum(["bar", "comparison", "horizontal"]),
    unit: z.string().optional(),
    dataPoints: z.array(DataPointSchema).optional(),
    comparisonPairs: z.array(ComparisonPairSchema).optional(),
    leftGroupLabel: z.string().optional(),
    rightGroupLabel: z.string().optional(),
    leftGroupColor: z.string().optional(),
    rightGroupColor: z.string().optional(),
    formatAsYear: z.boolean().optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
  }),
});

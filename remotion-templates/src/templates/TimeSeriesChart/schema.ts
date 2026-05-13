/**
 * Zod schemas for TimeSeriesChart template — runtime validation + Remotion Studio editing.
 */

import { z } from "zod";

const TimeSeriesPointSchema = z.object({
  x: z.union([z.number(), z.string()]),
  y: z.number(),
});

const TimeSeriesLineSchema = z.object({
  label: z.string(),
  color: z.string(),
  points: z.array(TimeSeriesPointSchema),
  width: z.number().optional(),
  dashed: z.boolean().optional(),
  areaFill: z.boolean().optional(),
  areaOpacity: z.number().optional(),
  hero: z.boolean().optional(),
});

const TimeSeriesAnnotationSchema = z.object({
  x: z.union([z.number(), z.string()]),
  label: z.string(),
  sublabel: z.string().optional(),
  line: z.boolean().optional(),
  dot: z.boolean().optional(),
  color: z.string().optional(),
});

const TimeSeriesEraSchema = z.object({
  from: z.union([z.number(), z.string()]),
  to: z.union([z.number(), z.string()]),
  label: z.string(),
  color: z.string(),
  opacity: z.number().optional(),
});

const TimeSeriesReferenceLineSchema = z.object({
  y: z.number(),
  label: z.string(),
  color: z.string().optional(),
  dashed: z.boolean().optional(),
});

const TimeSeriesReferenceBandSchema = z.object({
  y1: z.number(),
  y2: z.number(),
  label: z.string().optional(),
  color: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const TimeSeriesChartSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string().describe("State the finding, not the topic. Write: 'China semiconductor investment doubled in five years' not 'Semiconductor investment trends'. The title IS the editorial argument."),
    subtitle: z.string().optional(),
    variant: z.enum(["line", "slope", "small-multiples"]).optional(),
    lines: z.array(TimeSeriesLineSchema).min(1, {
      message: "TimeSeriesChart requires at least one line. Empty `lines` would also cause divide-by-zero in the small-multiples panel grid.",
    }),
    annotations: z.array(TimeSeriesAnnotationSchema).optional(),
    eras: z.array(TimeSeriesEraSchema).optional(),
    referenceLines: z.array(TimeSeriesReferenceLineSchema).optional(),
    referenceBands: z.array(TimeSeriesReferenceBandSchema).optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
    yUnit: z.string().optional(),
    yRange: z.tuple([z.number(), z.number()]).optional(),
    heroStat: z.object({
      value: z.string(),
      label: z.string(),
    }).optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    holdAfterRevealSec: z.number().min(0).max(10).optional()
      .describe("Deliberate pause (seconds) after all lines finish drawing, before exit fade. Must fit within durationSec. Default: 0."),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    backgroundTint: z.string().optional(),
    _direction: z.unknown().optional(),
  }),
});

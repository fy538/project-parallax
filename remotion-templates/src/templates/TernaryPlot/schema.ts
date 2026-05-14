/**
 * Zod schemas for TernaryPlot template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

const TernaryPointSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  a: z.number().min(0),
  b: z.number().min(0),
  c: z.number().min(0),
  color: z.string().optional(),
  highlight: z.boolean().optional(),
  size: z.number().positive().optional(),
});

const TernaryAxisLabelsSchema = z.object({
  a: z.string(),
  b: z.string(),
  c: z.string(),
});

export const TernaryPlotSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string().describe(
      "State the finding, not the topic. Write: 'Most resolutions cluster around the US bloc — but climate splits three ways' not 'UN voting alignment'. The title IS the editorial argument.",
    ),
    subtitle: z.string().optional(),
    points: z.array(TernaryPointSchema).min(1),
    axisLabels: TernaryAxisLabelsSchema,
    readingCue: z
      .string()
      .optional()
      .describe(
        "Optional first-ternary reading cue, e.g. 'Read corners as 100%; centroid is balanced 33/33/33.' Renders as a small italic mono-uppercase line beneath the title.",
      ),
    gridlines: z.boolean().optional(),
    centroid: z.boolean().optional(),
    source: z.string().optional(),
    durationSec: z.number().positive().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});

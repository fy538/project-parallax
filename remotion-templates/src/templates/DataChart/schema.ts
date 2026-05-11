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

const ReferenceLineSchema = z.object({
  value: z.number(),
  label: z.string(),
  color: z.string().optional(),
});

const SpotlightStepSchema = z.object({
  barIndices: z.array(z.number()),
  duration: z.number(),
  zoom: z.number().optional(),
  annotation: z.string().optional(),
  behavior: z.enum(["track", "snap"]).optional(),
  label: z.string().optional(),
});

export const DataChartSchema = z.object({
  data: z
    .object({
      episode: z.string(),
      title: z.string(),
      subtitle: z.string().optional(),
      variant: z.enum(["bar", "comparison", "horizontal", "lollipop"]),
      unit: z.string().optional(),
      dataPoints: z.array(DataPointSchema).optional(),
      comparisonPairs: z.array(ComparisonPairSchema).optional(),
      leftGroupLabel: z.string().optional(),
      rightGroupLabel: z.string().optional(),
      leftGroupColor: z.string().optional(),
      rightGroupColor: z.string().optional(),
      domainLabels: z.array(z.string()).optional(),
      formatAsYear: z.boolean().optional(),
      source: z.string().optional(),
      durationSec: z.number().positive().optional(),
      referenceLine: ReferenceLineSchema.optional(),
      highlightIndex: z.number().optional(),
      contextNote: z.string().optional(),
      spotlightSequence: z.array(SpotlightStepSchema).optional(),
      ambientParticles: z.boolean().optional(),
      _direction: z.unknown().optional(),
      backgroundTint: z.string().optional(),
      transparentBackground: z.boolean().optional(),
    })
    .superRefine((d, ctx) => {
      if (
        (d.variant === "bar" || d.variant === "horizontal" || d.variant === "lollipop") &&
        (!d.dataPoints || d.dataPoints.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `variant '${d.variant}' requires at least one dataPoint`,
          path: ["dataPoints"],
        });
      }
      if (
        d.variant === "comparison" &&
        (!d.comparisonPairs || d.comparisonPairs.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "variant 'comparison' requires at least one comparisonPair",
          path: ["comparisonPairs"],
        });
      }
    }),
});

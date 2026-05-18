/**
 * Zod schema for DumbbellPlot — runtime validation + Remotion Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const DumbbellItemSchema = z.object({
  label: z.string(),
  low: z.number(),
  high: z.number(),
  mid: z
    .number()
    .optional()
    .describe(
      "Optional midpoint (e.g. median). Renders a small vertical tick on the connector at this x-value, revealing skew vs uniform spread."
    ),
  lowLabel: z.string().optional(),
  highLabel: z.string().optional(),
  color: z.string().optional(),
  highlight: z.boolean().optional(),
});

export const ReferenceLineSchema = z.object({
  value: z.number(),
  label: z.string(),
});

export const DumbbellValueFormatSchema = z.enum(["number", "percent", "currency"]);

export const DumbbellPlotDataSchema = z.object({
  episode: z.string(),
  title: z
    .string()
    .describe(
      "State the finding, not the topic. Write: 'Income Inequality, by Country' as the structural claim — the spread, not the topic of income."
    ),
  subtitle: z.string().optional(),
  items: z
    .array(DumbbellItemSchema)
    .describe(
      "Each row encodes a low–high range. Set highlight: true on rows you want to call out (fuller opacity + heavier label)."
    ),
  xAxisLabel: z.string().describe("Axis caption rendered below the tick row."),
  xUnit: z.string().optional(),
  valueFormat: DumbbellValueFormatSchema
    .optional()
    .describe(
      "Controls tick + annotation formatting. 'currency' renders as $11K / $1.4M abbreviations."
    ),
  lowLegendLabel: z
    .string()
    .optional()
    .describe("Legend caption for the smaller, muted low dot."),
  highLegendLabel: z
    .string()
    .optional()
    .describe("Legend caption for the accent-colored high dot."),
  midLegendLabel: z
    .string()
    .optional()
    .describe(
      "Legend caption for the midpoint tick. Only surfaced when any item has `mid` set. Default 'Median'."
    ),
  sortBy: z
    .enum(["label", "low", "high", "range"])
    .optional()
    .describe(
      "Default 'range' — widest (high - low) gap first, which is what makes the chart legible."
    ),
  referenceLine: ReferenceLineSchema.optional().describe(
    "Optional dashed reference line drawn at a benchmark value."
  ),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const DumbbellPlotSchema = z.object({
  data: DumbbellPlotDataSchema,
});

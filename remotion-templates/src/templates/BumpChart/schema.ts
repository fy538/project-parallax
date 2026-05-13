/**
 * Zod schemas for BumpChart template — runtime validation + Remotion Studio editing.
 */

import { z } from "zod";

const BumpChartEntitySchema = z.object({
  id: z.string().describe("Unique identifier for this entity — used for highlightIds matching."),
  label: z.string().describe("Display name shown as end-of-line label."),
  color: z.string().optional().describe("Override color. If omitted, uses getCategoricalColor(i)."),
  values: z
    .array(
      z.object({
        period: z.union([z.string(), z.number()]).describe("Period label — must match a value in the top-level periods array."),
        value: z.number().describe("Numeric value used to compute rank (higher = rank 1 in desc mode)."),
      })
    )
    .min(1)
    .describe("Value per period. Length must match the top-level periods array."),
});

export const BumpChartSchema = z.object({
  data: z.object({
    episode: z.string().describe("Episode slug displayed in HeaderStrip metadata."),
    title: z
      .string()
      .describe(
        "State the finding, not the topic. Write: 'China overtakes Japan as World #2 GDP in 2010' not 'GDP rankings over time'. The title IS the editorial argument."
      ),
    subtitle: z.string().optional().describe("Optional subtitle adding analytical context."),
    source: z.string().optional().describe("Data source attribution shown at bottom-right."),
    durationSec: z
      .number()
      .positive()
      .optional()
      .describe("Total composition duration in seconds. Default: 14."),
    holdAfterRevealSec: z
      .number()
      .min(0)
      .max(10)
      .optional()
      .describe("Deliberate pause (seconds) after all lines finish animating, before exit fade."),
    periods: z
      .array(z.string())
      .min(2)
      .describe("Ordered time-period labels for the x-axis (e.g. ['1990','1995','2000'])."),
    entities: z
      .array(BumpChartEntitySchema)
      .min(2)
      .describe("Entities to trace — ranks are computed from their values per period."),
    rankDirection: z
      .enum(["asc", "desc"])
      .optional()
      .describe("'desc' = highest value is rank 1 (default). 'asc' = lowest value is rank 1."),
    highlightIds: z
      .array(z.string())
      .optional()
      .describe("Entity IDs to bold (strokeWidth 3, full opacity). Others render at 60% opacity."),
    unit: z
      .string()
      .optional()
      .describe("Context annotation, e.g. 'GDP in current USD'. Shown in FooterStrip scale field."),
    _direction: z.unknown().optional(),
  }),
});

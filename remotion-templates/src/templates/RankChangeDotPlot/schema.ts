/**
 * Zod schema for RankChangeDotPlot — runtime validation + Remotion Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const RankChangeDotPlotItemSchema = z.object({
  label: z.string(),
  before: z.number(),
  after: z.number(),
  color: z.string().optional(),
});

export const RankChangeDotPlotDataSchema = z.object({
  episode: z.string(),
  title: z
    .string()
    .describe(
      "State the finding, not the topic. Write: 'Export Controls Reshuffled the Foundry Rankings' not 'Foundry Rankings'. The title IS the editorial argument."
    ),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  holdAfterRevealSec: z
    .number()
    .min(0)
    .max(10)
    .optional()
    .describe(
      "Deliberate pause (seconds) after all elements finish animating in, before exit fade. Must fit within durationSec. Default: 0."
    ),
  items: z
    .array(RankChangeDotPlotItemSchema)
    .describe(
      "Each item has a before and after rank/value. Color is auto-computed from delta direction unless overridden."
    ),
  beforeLabel: z
    .string()
    .optional()
    .describe("Column header labels, e.g. '2018' and '2025'."),
  afterLabel: z
    .string()
    .optional()
    .describe("Column header labels, e.g. '2018' and '2025'."),
  sortBy: z
    .enum(["change", "after", "before", "label"])
    .optional()
    .describe(
      "Default 'change' — items with the largest absolute change appear first."
    ),
  unit: z.string().optional(),
  highlightIds: z
    .array(z.string())
    .optional()
    .describe("Item labels to emphasize with bolder text and full opacity."),
  isRankData: z
    .boolean()
    .optional()
    .describe(
      "Set explicitly: true for rank data (1=best, lower=better), false for score/value data (higher=better). Affects up/down color auto-assignment. Defaults to false."
    ),
  backgroundVariant: z
    .enum(["light", "dark"])
    .optional()
    .describe("Background mode. 'light' (default) for analytical; 'dark' for atmospheric segments."),
  _direction: DirectionBlockSchema.optional(),
});

export const RankChangeDotPlotSchema = z.object({
  data: RankChangeDotPlotDataSchema,
});

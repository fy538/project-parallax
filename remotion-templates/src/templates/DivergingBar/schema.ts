/**
 * Zod schemas for DivergingBar template — runtime validation + Remotion
 * Studio editing.
 *
 * DivergingBar is a centered horizontal bar chart where positive values
 * extend right and negative values extend left. The center axis is the
 * editorial division — the split IS the argument.
 *
 * Editorial uses:
 *   - Opinion splits: "67% approve, 33% disapprove" across N countries
 *   - Alliance/neutrality scores: countries ranging from -10 to +10
 *   - Policy before/after: deficit left, surplus right
 *   - Trade position: net exporter (right) vs. net importer (left)
 *
 * Reference: FT "poll of polls", Economist approval ratings, Pew
 * cross-country sentiment comparisons.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const DivergingBarItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  sublabel: z.string().optional(),
  color: z.string().optional(),
});

export const DivergingBarDataSchema = z.object({
  episode: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),

  items: z.array(DivergingBarItemSchema).min(2).max(20),

  // Axis configuration
  axisLabel: z.string().optional(),
  zeroLabel: z.string().optional(),
  positiveLabel: z.string().optional(),
  negativeLabel: z.string().optional(),

  // Visual options
  sortOrder: z
    .enum(["data", "value-desc", "value-asc", "label-asc"])
    .optional(),
  showValues: z.boolean().optional(),
  colorMode: z.enum(["split", "gradient", "categorical"]).optional(),

  positiveColor: z.string().optional(),
  negativeColor: z.string().optional(),
});

export const DivergingBarSchema = z.object({ data: DivergingBarDataSchema });

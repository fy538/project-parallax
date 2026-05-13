/**
 * Zod schemas for StatReveal template.
 */

import { z } from "zod";

const ComparisonBarSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
  source: z.string().optional(),
});

export const StatRevealSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string().describe("State the finding, not the topic. Write: 'One company makes 92% of the world's most advanced chips' not 'TSMC market share'. The title IS the editorial argument."),
    subtitle: z.string().optional(),
    stat: z.object({
      value: z.number(),
      prefix: z.string().optional(),
      suffix: z.string().optional(),
      label: z.string(),
      decimals: z.number().optional(),
    }),
    comparisons: z.array(ComparisonBarSchema),
    heroIsMax: z.boolean().optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    holdAfterRevealSec: z.number().min(0).max(10).optional()
      .describe("Deliberate pause (seconds) after stat and comparisons finish animating in, before exit fade. Must fit within durationSec. Default: 0."),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    _direction: z.unknown().optional(),
  }),
});

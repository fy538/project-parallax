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
    title: z.string(),
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
    backgroundVariant: z.enum(["dark", "light"]).optional(),
  }),
});

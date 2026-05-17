/**
 * Zod schemas for StatReveal template.
 */

import { z } from "zod";
import { compositionBase, holdAfterRevealSec } from "../_shared/compositionBase";

const ComparisonBarSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
  source: z.string().optional(),
});

export const StatRevealSchema = z.object({
  data: z.object({
    ...compositionBase,
    holdAfterRevealSec,
    // ── template-specific fields ──
    stat: z.object({
      value: z.number(),
      prefix: z.string().optional(),
      suffix: z.string().optional(),
      label: z.string(),
      decimals: z.number().optional(),
      countUp: z.boolean().optional().describe("When true (default), count up from 0 to value. Set false to render statically."),
    }),
    comparisons: z.array(ComparisonBarSchema),
    heroIsMax: z.boolean().optional(),
  }),
});

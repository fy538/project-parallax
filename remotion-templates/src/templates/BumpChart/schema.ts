/**
 * Zod schemas for BumpChart template — runtime validation + Remotion Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 — see StatReveal for canonical
 * pattern). Inner shapes exported so types.ts can `z.infer` from each.
 */

import { z } from "zod";
import { compositionBase, holdAfterRevealSec } from "../_shared/compositionBase";

export const BumpChartEntitySchema = z.object({
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

export const BumpChartDataSchema = z.object({
  ...compositionBase,
  holdAfterRevealSec,
  // ── template-specific fields ──
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
});

export const BumpChartSchema = z.object({
  data: BumpChartDataSchema,
});

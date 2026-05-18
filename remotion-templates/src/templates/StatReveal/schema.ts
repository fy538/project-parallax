/**
 * Zod schemas for StatReveal template.
 *
 * Schema-derived types (May 2026 audit #3 — canonical example). Pattern:
 *   1. Export every sub-schema as a named const (ComparisonBarSchema, ...).
 *   2. Export the inner `data` shape as `<Name>DataSchema` so types.ts
 *      can `z.infer` it directly (no need to peel the outer wrapper).
 *   3. Outer `<Name>Schema` is just `z.object({ data: <Name>DataSchema })`
 *      — what the runtime validator expects when called from
 *      Episodes/templateSchemas.ts.
 *   4. types.ts becomes a re-export shim: `export type X = z.infer<...>`.
 *
 * This eliminates the "I added a Zod field, forgot to update TS" class of
 * bugs that the old hand-duplicated types.ts + schema.ts pattern produced.
 */

import { z } from "zod";
import { compositionBase, holdAfterRevealSec } from "../_shared/compositionBase";

export const ComparisonBarSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
  source: z.string().optional(),
});

export const StatRevealDataSchema = z.object({
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
});

export const StatRevealSchema = z.object({
  data: StatRevealDataSchema,
});

/**
 * ComparisonPair template types.
 *
 * Renders two registered templates side-by-side at 50/50 with synchronized
 * timing. The structural-comparison form for "1914 vs 2024", "Athens vs
 * Sparta", "Theory vs Reality" arguments where the editorial point requires
 * two visualisations seen at the same moment.
 *
 * Types derived from Zod schemas. The Pane type is a discriminated union
 * over the 10 splittable templates — see `schema.ts` for the list.
 */

import type { z } from "zod";
import type {
  ComparisonPairDataSchema,
  PaneSchema,
} from "./schema";

export type ComparisonPane = z.infer<typeof PaneSchema>;
export type ComparisonPairData = z.infer<typeof ComparisonPairDataSchema>;
export type SplittableTemplateName = ComparisonPane["template"];

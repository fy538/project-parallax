/**
 * BumpChart — N entities tracing their rank position over M time periods.
 *
 * The "power transition" chart where rank crossings are the editorial
 * argument. Ranks are COMPUTED from entity values — not authored directly.
 *
 * Types derived from Zod schemas (May 2026 audit #3 — see StatReveal for
 * the canonical pattern). Field semantics live on `.describe()` calls in
 * schema.ts.
 */

import type { z } from "zod";
import type {
  BumpChartEntitySchema,
  BumpChartDataSchema,
} from "./schema";

export type BumpChartEntity = z.infer<typeof BumpChartEntitySchema>;
export type BumpChartData = z.infer<typeof BumpChartDataSchema>;

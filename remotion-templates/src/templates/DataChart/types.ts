/**
 * DataChart — bar / horizontal / comparison / lollipop / small-multiples
 * variants. The workhorse chart template.
 *
 * Types derived from Zod schemas (May 2026 audit #3 — see StatReveal for
 * the canonical pattern explanation). What used to be 130 lines of
 * hand-typed interfaces is now a 6-line re-export shim. Per-template JSDoc
 * on field semantics lives on the Zod `.describe()` calls in schema.ts.
 */

import type { z } from "zod";
import type {
  DataPointSchema,
  ComparisonPairSchema,
  ReferenceLineSchema,
  SpotlightStepSchema,
  DataChartDataSchema,
} from "./schema";

export type DataPoint = z.infer<typeof DataPointSchema>;
export type ComparisonPair = z.infer<typeof ComparisonPairSchema>;
export type ReferenceLine = z.infer<typeof ReferenceLineSchema>;
export type SpotlightStep = z.infer<typeof SpotlightStepSchema>;
export type DataChartData = z.infer<typeof DataChartDataSchema>;

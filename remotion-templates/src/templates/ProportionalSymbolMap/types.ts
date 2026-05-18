/**
 * ProportionalSymbolMap — country-anchored circles sized by a numeric
 * value. Right form for COUNT data (fabs, bases, GDP); use ChoroplethMap
 * for rate/density data.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 *
 * Dossier: references/template-research/proportional-symbol-map.md
 */

import type { z } from "zod";
import type {
  SymbolDatumSchema,
  ProportionalPhaseSchema,
  ProportionalSymbolMapDataSchema,
} from "./schema";

export type SymbolDatum = z.infer<typeof SymbolDatumSchema>;
export type ProportionalPhase = z.infer<typeof ProportionalPhaseSchema>;
export type ProportionalSymbolMapData = z.infer<typeof ProportionalSymbolMapDataSchema>;

/**
 * Data types for the ChoroplethMap template.
 *
 * To use this template, create a JSON file matching ChoroplethMapData
 * and pass it as inputProps to the composition.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  AnimationPhaseSchema,
  ChoroplethColorRampSchema,
  ChoroplethInsetSchema,
  ChoroplethLegendSchema,
  ChoroplethMapDataSchema,
  CountryDataSchema,
} from "./schema";

export type CountryData = z.infer<typeof CountryDataSchema>;
export type AnimationPhase = z.infer<typeof AnimationPhaseSchema>;
export type ChoroplethColorRamp = z.infer<typeof ChoroplethColorRampSchema>;
export type ChoroplethLegend = z.infer<typeof ChoroplethLegendSchema>;
export type ChoroplethInset = z.infer<typeof ChoroplethInsetSchema>;
export type ChoroplethMapData = z.infer<typeof ChoroplethMapDataSchema>;

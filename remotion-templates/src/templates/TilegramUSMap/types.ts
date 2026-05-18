/**
 * TilegramUSMap — US states rendered as a hex grid where every state is the
 * same size, regardless of geographic area. Solves the "Wyoming dominates
 * California by area" distortion in the geographic ChoroplethMap.
 *
 * Editorial precedent: NPR introduced the canonical US hex tilegram in 2015;
 * Bloomberg, the Economist, and FiveThirtyEight have used variants for
 * election coverage and state-by-state policy maps.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  USStateCodeSchema,
  TilegramStateValueSchema,
  TilegramColorScaleSchema,
  TilegramColorScaleInputSchema,
  TilegramUSMapDataSchema,
} from "./schema";

export type USStateCode = z.infer<typeof USStateCodeSchema>;
export type TilegramStateValue = z.infer<typeof TilegramStateValueSchema>;
export type TilegramColorScale = z.infer<typeof TilegramColorScaleSchema>;
export type TilegramColorScaleInput = z.infer<typeof TilegramColorScaleInputSchema>;
export type TilegramUSMapData = z.infer<typeof TilegramUSMapDataSchema>;

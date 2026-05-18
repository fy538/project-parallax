/**
 * DensityMap — point-density visualization on a Mapbox basemap (deck.gl
 * HexagonLayer / HeatmapLayer / GridLayer). For *where things concentrate*
 * stories: chip fabs, military bases, refugee origins, conflict events.
 *
 * Dossier: references/template-research/density-map.md
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  DensityMapDataSchema,
  DensityModeSchema,
  DensityPhaseSchema,
  DensityPointSchema,
} from "./schema";

export type DensityPoint = z.infer<typeof DensityPointSchema>;
export type DensityMode = z.infer<typeof DensityModeSchema>;
export type DensityPhase = z.infer<typeof DensityPhaseSchema>;
export type DensityMapData = z.infer<typeof DensityMapDataSchema>;

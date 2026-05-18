/**
 * Data types for the AtlasPlate template.
 *
 * Pure-SVG editorial cartography rendered from Natural Earth TopoJSON via
 * d3-geo. The Tufte/Fortune/Bartholomew register — flat, high-contrast,
 * no tiles. Use when atmospheric Mapbox renders would distract from an
 * analytical point.
 *
 * Dossier: references/template-research/atlas-plate.md
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  AtlasCameraDwellSchema,
  AtlasCameraTransitionSchema,
  AtlasCountryFillSchema,
  AtlasDetailInsetSchema,
  AtlasDisputedBoundariesSchema,
  AtlasFillTransitionSchema,
  AtlasFocusSchema,
  AtlasInsetCornerSchema,
  AtlasInsetSchema,
  AtlasLabelStrategySchema,
  AtlasPhaseSchema,
  AtlasPlateDataSchema,
  AtlasProjectionSchema,
  AtlasSeaLabelItemSchema,
  AtlasSeaLabelsSchema,
} from "./schema";

// Re-export the inferred AtlasAesthetic alias from schema (declared inline there).
export type { AtlasAesthetic } from "./schema";

export type AtlasProjection = z.infer<typeof AtlasProjectionSchema>;
export type AtlasLabelStrategy = z.infer<typeof AtlasLabelStrategySchema>;
export type AtlasCountryFill = z.infer<typeof AtlasCountryFillSchema>;
export type AtlasFocus = z.infer<typeof AtlasFocusSchema>;
export type AtlasCameraTransition = z.infer<typeof AtlasCameraTransitionSchema>;
export type AtlasCameraDwell = z.infer<typeof AtlasCameraDwellSchema>;
export type AtlasFillTransition = z.infer<typeof AtlasFillTransitionSchema>;
export type AtlasPhase = z.infer<typeof AtlasPhaseSchema>;
export type AtlasDisputedBoundaries = z.infer<typeof AtlasDisputedBoundariesSchema>;
export type AtlasSeaLabelItem = z.infer<typeof AtlasSeaLabelItemSchema>;
export type AtlasSeaLabels = z.infer<typeof AtlasSeaLabelsSchema>;
export type AtlasInsetCorner = z.infer<typeof AtlasInsetCornerSchema>;
export type AtlasInset = z.infer<typeof AtlasInsetSchema>;
export type AtlasDetailInset = z.infer<typeof AtlasDetailInsetSchema>;
export type AtlasPlateData = z.infer<typeof AtlasPlateDataSchema>;

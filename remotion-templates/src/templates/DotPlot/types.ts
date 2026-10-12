/**
 * DotPlot — types derived from Zod schemas.
 *
 * All types are inferred from the schema so there is a single source of
 * truth. Never hand-declare interfaces that shadow Zod types.
 *
 * May 2026 pattern — see StatReveal for the canonical form.
 */

import type { z } from "zod";
import type {
  DotPlotDataSchema,
  DotPlotEntitySchema,
  DotPlotGroupSchema,
  DotPlotReferenceLineSchema,
  DotPlotSchema,
} from "./schema";

export type DotPlotData = z.infer<typeof DotPlotDataSchema>;
export type DotPlotEntity = z.infer<typeof DotPlotEntitySchema>;
export type DotPlotGroup = z.infer<typeof DotPlotGroupSchema>;
export type DotPlotReferenceLine = z.infer<typeof DotPlotReferenceLineSchema>;
export type DotPlotProps = z.infer<typeof DotPlotSchema>;

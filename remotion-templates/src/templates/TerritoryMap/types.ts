/**
 * Data types for the TerritoryMap template.
 *
 * Derived from Zod schemas via z.infer — do not hand-edit.
 * Modify schema.ts instead; types update automatically.
 *
 * Use cases: Ottoman retreat 1700–1920, ISIS caliphate growth/shrink
 * 2014–2019, COCOM membership evolution.
 */

import type { z } from "zod";
import type {
  TerritoryActorSchema,
  TerritoryTimestepSchema,
  TerritoryRegionSchema,
  TerritoryMapDataSchema,
} from "./schema";

export type TerritoryActor = z.infer<typeof TerritoryActorSchema>;
export type TerritoryTimestep = z.infer<typeof TerritoryTimestepSchema>;
export type TerritoryRegion = z.infer<typeof TerritoryRegionSchema>;
export type TerritoryMapData = z.infer<typeof TerritoryMapDataSchema>;

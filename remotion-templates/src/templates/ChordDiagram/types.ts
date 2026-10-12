/**
 * ChordDiagram — bilateral flow relationships between entities on a circle.
 *
 * Arc length encodes total traffic volume per entity; chord thickness encodes
 * bilateral flow magnitude. The editorial form for trade interdependence,
 * alliance webs, and migration networks where EVERY pair-relationship matters
 * (unlike SankeyFlow, which emphasizes directional flow from sources to sinks).
 *
 * Types derived from Zod schemas.
 */

import type { z } from "zod";
import type {
  ChordEntitySchema,
  ChordFlowSchema,
  ChordDiagramDataSchema,
} from "./schema";

export type ChordEntity = z.infer<typeof ChordEntitySchema>;
export type ChordFlow = z.infer<typeof ChordFlowSchema>;
export type ChordDiagramData = z.infer<typeof ChordDiagramDataSchema>;

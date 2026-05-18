/**
 * CartogramMap — Dorling cartogram. The right form when the editorial
 * point is "structural weight ≠ geographic size."
 *
 * Dossier: references/template-research/cartogram-map.md
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  CartogramDatumSchema,
  CartogramMapDataSchema,
  CartogramPhaseSchema,
} from "./schema";

export type CartogramDatum = z.infer<typeof CartogramDatumSchema>;
export type CartogramPhase = z.infer<typeof CartogramPhaseSchema>;
export type CartogramMapData = z.infer<typeof CartogramMapDataSchema>;

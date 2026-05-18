/**
 * BeeswarmChart — 1D scatter where many entities are placed along a single
 * METRIC axis, with collision-resolved vertical offsets so individual dots
 * remain legible.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  BeeswarmDataSchema,
  BeeswarmItemSchema,
  BeeswarmReferenceLineSchema,
} from "./schema";

export type BeeswarmItem = z.infer<typeof BeeswarmItemSchema>;
export type BeeswarmReferenceLine = z.infer<typeof BeeswarmReferenceLineSchema>;
export type BeeswarmData = z.infer<typeof BeeswarmDataSchema>;

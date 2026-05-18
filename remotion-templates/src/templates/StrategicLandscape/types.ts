/**
 * StrategicLandscape — 2D matrix of actors/entities positioned on two
 * continuous axes; bubbles with labels and optional quadrant annotations.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  ActorSchema,
  StrategicLandscapeDataSchema,
} from "./schema";

export type Actor = z.infer<typeof ActorSchema>;
export type StrategicLandscapeData = z.infer<typeof StrategicLandscapeDataSchema>;

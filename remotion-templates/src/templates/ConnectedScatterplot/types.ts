/**
 * ConnectedScatterplot — two-variable scatter where points are connected in
 * temporal order; the shape of the trajectory (loops, reversals, regime
 * breaks) is the editorial point.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  ConnectedScatterplotDataSchema,
  ScatterPointSchema,
} from "./schema";

export type ScatterPoint = z.infer<typeof ScatterPointSchema>;
export type ConnectedScatterplotData = z.infer<typeof ConnectedScatterplotDataSchema>;

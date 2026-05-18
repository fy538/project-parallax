/**
 * Slopegraph — Tufte's signature "before/after at two points in time" chart.
 *
 * Each entity has a left value and a right value; a line connects the pair.
 * The SLOPE carries the editorial argument (rose, fell, stayed flat). When
 * most entities trend one direction and one bucks the trend, the slopegraph
 * makes the exception unmistakable. Used for: policy before/after, electoral
 * shifts, sector rebalancing, "which countries moved which direction."
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type { SlopegraphEntitySchema, SlopegraphDataSchema } from "./schema";

export type SlopegraphEntity = z.infer<typeof SlopegraphEntitySchema>;
export type SlopegraphData = z.infer<typeof SlopegraphDataSchema>;

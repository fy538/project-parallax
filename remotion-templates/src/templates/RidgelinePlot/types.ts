/**
 * RidgelinePlot — N stacked density curves (joyplot), one per group.
 * Editorial form for "distributions across groups" stories where the
 * shape of the curve itself is the argument.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  DensitySampleSchema,
  RidgelineGroupSchema,
  RidgelinePlotDataSchema,
} from "./schema";

export type DensitySample = z.infer<typeof DensitySampleSchema>;
export type RidgelineGroup = z.infer<typeof RidgelineGroupSchema>;
export type RidgelinePlotData = z.infer<typeof RidgelinePlotDataSchema>;

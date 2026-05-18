/**
 * RadarChart — multi-axis polygon comparison. Plots entities across N
 * dimensions as filled polygons; polygons can morph between states.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  RadarAxisSchema,
  RadarSubjectSchema,
  AxisFocusStepSchema,
  RadarChartDataSchema,
} from "./schema";

export type RadarAxis = z.infer<typeof RadarAxisSchema>;
export type RadarSubject = z.infer<typeof RadarSubjectSchema>;
export type AxisFocusStep = z.infer<typeof AxisFocusStepSchema>;
export type RadarChartData = z.infer<typeof RadarChartDataSchema>;

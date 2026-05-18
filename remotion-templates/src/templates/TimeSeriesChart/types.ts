/**
 * TimeSeriesChart template types.
 *
 * Animated line charts showing change over time with annotations,
 * era shading, and reference lines. Used for yield curves, market share
 * shifts, spending timelines, etc.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  TimeSeriesAnnotationSchema,
  TimeSeriesChartDataSchema,
  TimeSeriesEraSchema,
  TimeSeriesHeroStatSchema,
  TimeSeriesLineSchema,
  TimeSeriesPointSchema,
  TimeSeriesReferenceBandSchema,
  TimeSeriesReferenceLineSchema,
  TimeSeriesXValueSchema,
} from "./schema";

export type TimeSeriesXValue = z.infer<typeof TimeSeriesXValueSchema>;
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;
export type TimeSeriesLine = z.infer<typeof TimeSeriesLineSchema>;
export type TimeSeriesAnnotation = z.infer<typeof TimeSeriesAnnotationSchema>;
export type TimeSeriesEra = z.infer<typeof TimeSeriesEraSchema>;
export type TimeSeriesReferenceLine = z.infer<typeof TimeSeriesReferenceLineSchema>;
export type TimeSeriesReferenceBand = z.infer<typeof TimeSeriesReferenceBandSchema>;
export type TimeSeriesHeroStat = z.infer<typeof TimeSeriesHeroStatSchema>;
export type TimeSeriesChartData = z.infer<typeof TimeSeriesChartDataSchema>;

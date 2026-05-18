/**
 * MarimekkoChart — variable-width stacked columns where both dimensions
 * encode magnitude (FT's industry-by-region canonical idiom).
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  MarimekkoSegmentSchema,
  MarimekkoColumnSchema,
  MarimekkoChartDataSchema,
} from "./schema";

export type MarimekkoSegment = z.infer<typeof MarimekkoSegmentSchema>;
export type MarimekkoColumn = z.infer<typeof MarimekkoColumnSchema>;
export type MarimekkoChartData = z.infer<typeof MarimekkoChartDataSchema>;

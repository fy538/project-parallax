/**
 * DumbbellPlot — for each category, two dots (low + high) connected by a
 * thick line. Encodes a min-max range or before-after pair. Cleveland-
 * canonical form for "ranges across categories."
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  DumbbellItemSchema,
  DumbbellPlotDataSchema,
  DumbbellValueFormatSchema,
} from "./schema";

export type DumbbellItem = z.infer<typeof DumbbellItemSchema>;
export type DumbbellValueFormat = z.infer<typeof DumbbellValueFormatSchema>;
export type DumbbellPlotData = z.infer<typeof DumbbellPlotDataSchema>;

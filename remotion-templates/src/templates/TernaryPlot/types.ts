/**
 * TernaryPlot — three-way composition plot on an equilateral triangle.
 * Each point sits at a barycentric position where its three values (a, b, c)
 * sum to 1.0 (or 100, normalized internally).
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  TernaryPointSchema,
  TernaryAxisLabelsSchema,
  TernaryPlotDataSchema,
} from "./schema";

export type TernaryPoint = z.infer<typeof TernaryPointSchema>;
export type TernaryAxisLabels = z.infer<typeof TernaryAxisLabelsSchema>;
export type TernaryPlotData = z.infer<typeof TernaryPlotDataSchema>;

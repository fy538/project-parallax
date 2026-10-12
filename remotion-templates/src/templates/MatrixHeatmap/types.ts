/**
 * MatrixHeatmap — N×M comparison grid where cells are colored by value intensity.
 *
 * For: countries × dimensions, alliance matrices, policy adoption grids,
 * any editorial argument of the form "how does entity X score on dimension Y?"
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down pattern).
 */

import type { z } from "zod";
import type {
  MatrixRowSchema,
  MatrixColumnSchema,
  MatrixCellSchema,
  MatrixHeatmapDataSchema,
} from "./schema";

export type MatrixRow = z.infer<typeof MatrixRowSchema>;
export type MatrixColumn = z.infer<typeof MatrixColumnSchema>;
export type MatrixCell = z.infer<typeof MatrixCellSchema>;
export type MatrixHeatmapData = z.infer<typeof MatrixHeatmapDataSchema>;

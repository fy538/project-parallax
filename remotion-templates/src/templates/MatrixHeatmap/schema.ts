/**
 * Zod schemas for MatrixHeatmap template — runtime validation +
 * Remotion Studio editing.
 *
 * Schema-derived types follow the May 2026 audit #3 burn-down canonical
 * pattern (see StatReveal, CalendarHeatmap).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const MatrixRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  sublabel: z.string().optional(),
});

export const MatrixColumnSchema = z.object({
  id: z.string(),
  label: z.string(),
  sublabel: z.string().optional(),
});

export const MatrixCellSchema = z.object({
  row: z.string(),   // row id reference
  col: z.string(),   // col id reference
  value: z.number(),
  label: z.string().optional(),  // text override for cell display
  annotation: z.string().optional(), // small text below the value
  highlight: z.boolean().optional(), // accent this cell
});

export const MatrixHeatmapDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  rows: z.array(MatrixRowSchema).min(1).max(20),
  columns: z.array(MatrixColumnSchema).min(1).max(12),
  cells: z.array(MatrixCellSchema),
  colorScale: z.enum(["sequential", "diverging"]).optional(), // default "sequential"
  colorLow: z.string().optional(),   // hex for min value (default palette.midnight)
  colorHigh: z.string().optional(),  // hex for max value (default palette.dustblue or gold)
  colorMid: z.string().optional(),   // hex for midpoint (diverging only, default palette.walnut)
  valueFormat: z.enum(["number", "percent", "currency"]).optional(), // default "number"
  showValues: z.boolean().optional(), // default true — show value text inside cells
  highlightRow: z.string().optional(), // row id to accent with gold border
  highlightCol: z.string().optional(), // col id to accent with gold border
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const MatrixHeatmapSchema = z.object({ data: MatrixHeatmapDataSchema });

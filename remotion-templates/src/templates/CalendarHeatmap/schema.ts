/**
 * Zod schemas for CalendarHeatmap template — runtime validation +
 * Remotion Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const CalendarDaySchema = z.object({
  date: z
    .string()
    .regex(ISO_DATE_RE, {
      message: "CalendarHeatmap day.date must be ISO YYYY-MM-DD",
    }),
  value: z.number(),
  label: z.string().optional(),
});

export const CalendarHighlightSchema = z.object({
  date: z
    .string()
    .regex(ISO_DATE_RE, {
      message: "CalendarHeatmap highlight.date must be ISO YYYY-MM-DD",
    }),
  label: z.string(),
});

export const CalendarColorScaleSchema = z.enum([
  "sequential",
  "diverging",
  "intensity",
]);

export const CalendarHeatmapDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  year: z.number().int().min(1900).max(2200),
  days: z.array(CalendarDaySchema),
  colorScale: CalendarColorScaleSchema.optional(),
  maxValue: z.number().positive().optional(),
  valueLabel: z.string().optional(),
  legendLabels: z
    .object({
      low: z.string(),
      high: z.string(),
      zero: z.string().optional(),
    })
    .optional(),
  weekStart: z.enum(["sunday", "monday"]).optional(),
  highlights: z.array(CalendarHighlightSchema).optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  backgroundTint: z.string().optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const CalendarHeatmapSchema = z.object({
  data: CalendarHeatmapDataSchema,
});

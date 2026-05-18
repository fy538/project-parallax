/**
 * Zod schemas for RadarChart template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const RadarAxisSchema = z.object({
  label: z.string(),
  short: z.string().optional(),
});

export const RadarSubjectSchema = z.object({
  name: z.string(),
  values: z.array(z.number().min(0).max(100)),
  color: z.string(),
  fillOpacity: z.number().min(0).max(1).optional(),
});

export const AxisFocusStepSchema = z.object({
  axisIndex: z.number().int().nonnegative().describe("Index of axis to focus (0-based, matches axes array order)"),
  duration: z.number().positive().describe("Duration to dwell on this axis in seconds"),
  annotation: z.string().optional().describe("Optional annotation shown near the focused vertex"),
  label: z.string().optional().describe("Optional label overlay"),
});

export const RadarChartDataSchema = z.object({
  episode: z.string(),
  title: z.string().describe("State the finding, not the topic. Write: 'China leads on yield but lags on node size and equipment' not 'Capability comparison'. The title IS the editorial argument."),
  subtitle: z.string().optional(),
  axes: z.array(RadarAxisSchema).min(3),
  subjects: z.array(RadarSubjectSchema).min(1),
  morphFrom: z.array(RadarSubjectSchema).optional(),
  gridLevels: z.array(z.number()).optional(),
  axisFocusSequence: z.array(AxisFocusStepSchema).optional().describe("Optional axis focus sequence — camera rotates to highlight each axis in turn."),
  ambientParticles: z.boolean().optional().describe("Show ambient particles (default: false)"),
  source: z.string().optional(),
  durationSec: z.number().optional(),
  holdAfterRevealSec: z.number().min(0).max(10).optional()
    .describe("Deliberate pause (seconds) after radar polygons finish drawing, before exit fade. Must fit within durationSec. Default: 0."),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const RadarChartSchema = z.object({
  data: RadarChartDataSchema,
});

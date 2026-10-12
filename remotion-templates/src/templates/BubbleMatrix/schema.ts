/**
 * Zod schemas for BubbleMatrix template — runtime validation + Remotion
 * Studio editing.
 *
 * BubbleMatrix is a multi-dimensional scatter chart encoding four simultaneous
 * variables: X-position, Y-position, bubble size (proportional area), and
 * color (group membership or explicit override). The authoritative reference
 * is the Gapminder "wealth & health of nations" bubble chart form.
 *
 * Schema-derived types (see StatReveal for the canonical pattern).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const BubbleEntitySchema = z.object({
  id: z.string(),
  label: z.string(),           // entity name displayed on/beside bubble
  x: z.number(),               // x-axis value
  y: z.number(),               // y-axis value
  size: z.number().positive(), // raw size value (template scales to radius using proportional area)
  color: z.string().optional(), // hex OR palette token OR group id — overrides group color
  group: z.string().optional(), // group membership (for shared color from groups[])
  sublabel: z.string().optional(), // small secondary label (e.g., "2023 est." or institution name)
  emphasis: z.enum(["primary", "secondary", "muted"]).optional(), // default "secondary"
  annotation: z.string().optional(), // callout note near this bubble
});

export const BubbleGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string(),
});

export const AxisSchema = z.object({
  label: z.string(),
  min: z.number().optional(),
  max: z.number().optional(),
  format: z.string().optional(),  // e.g., "%.0f%%", "$%.1fT", "%.0fB"
  tickCount: z.number().int().min(2).max(8).optional(),  // default 5
  logScale: z.boolean().optional(),  // default false
});

export const ReferenceLineSchema = z.object({
  axis: z.enum(["x", "y"]),
  value: z.number(),
  label: z.string().optional(),
  style: z.enum(["solid", "dashed"]).optional(),  // default "dashed"
  color: z.string().optional(),
});

export const BubbleMatrixDataSchema = z.object({
  episode: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),

  entities: z.array(BubbleEntitySchema).min(2).max(40),
  groups: z.array(BubbleGroupSchema).optional(),

  xAxis: AxisSchema,
  yAxis: AxisSchema,

  // Size encoding
  sizeLabel: z.string().optional(),   // label for size legend (e.g., "GDP (PPP, $T)")
  minBubbleRadius: z.number().min(4).max(20).optional(),   // default 8
  maxBubbleRadius: z.number().min(16).max(60).optional(),  // default 40

  // Reference lines
  referenceLines: z.array(ReferenceLineSchema).optional(),

  // Label placement
  labelPosition: z.enum(["inside", "above", "right", "auto"]).optional(),  // default "auto"

  // Group legend placement
  showLegend: z.boolean().optional(),  // default true when groups defined
  revealOrder: z.enum(["simultaneous", "by-group", "by-x-position"]).optional(),  // default "simultaneous"
});

export const BubbleMatrixSchema = z.object({ data: BubbleMatrixDataSchema });

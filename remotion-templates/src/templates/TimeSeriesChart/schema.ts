/**
 * Zod schemas for TimeSeriesChart template — runtime validation + Remotion Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { EditorialFrameSchema } from "../../components/EditorialFrame/schema";

export const TimeSeriesXValueSchema = z.union([z.number(), z.string()]);

export const TimeSeriesPointSchema = z.object({
  x: TimeSeriesXValueSchema,
  y: z.number(),
});

export const TimeSeriesLineSchema = z.object({
  label: z.string(),
  color: z.string(),
  points: z.array(TimeSeriesPointSchema),
  width: z.number().optional(),
  dashed: z.boolean().optional(),
  areaFill: z.boolean().optional(),
  areaOpacity: z.number().optional(),
  hero: z.boolean().optional(),
});

export const TimeSeriesAnnotationSchema = z.object({
  x: TimeSeriesXValueSchema,
  label: z.string(),
  sublabel: z.string().optional(),
  line: z.boolean().optional(),
  dot: z.boolean().optional(),
  color: z.string().optional(),
});

export const TimeSeriesEraSchema = z.object({
  from: TimeSeriesXValueSchema,
  to: TimeSeriesXValueSchema,
  label: z.string(),
  color: z.string(),
  opacity: z.number().optional(),
});

export const TimeSeriesReferenceLineSchema = z.object({
  y: z.number(),
  label: z.string(),
  color: z.string().optional(),
  dashed: z.boolean().optional(),
});

export const TimeSeriesReferenceBandSchema = z.object({
  y1: z.number(),
  y2: z.number(),
  label: z.string().optional(),
  color: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const TimeSeriesHeroStatSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const TimeSeriesChartDataSchema = z.object({
  episode: z.string(),
  title: z.string().describe("State the finding, not the topic. Write: 'China semiconductor investment doubled in five years' not 'Semiconductor investment trends'. The title IS the editorial argument."),
  subtitle: z.string().optional(),
  variant: z.enum(["line", "slope", "small-multiples"]).optional(),
  lines: z.array(TimeSeriesLineSchema).min(1, {
    message: "TimeSeriesChart requires at least one line. Empty `lines` would also cause divide-by-zero in the small-multiples panel grid.",
  }),
  annotations: z.array(TimeSeriesAnnotationSchema).optional(),
  eras: z.array(TimeSeriesEraSchema).optional(),
  referenceLines: z.array(TimeSeriesReferenceLineSchema).optional(),
  referenceBands: z.array(TimeSeriesReferenceBandSchema).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  yUnit: z.string().optional(),
  yRange: z.tuple([z.number(), z.number()]).optional(),
  heroStat: TimeSeriesHeroStatSchema.optional(),
  source: z.string().optional(),
  durationSec: z.number().optional(),
  holdAfterRevealSec: z.number().min(0).max(10).optional()
    .describe("Deliberate pause (seconds) after all lines finish drawing, before exit fade. Must fit within durationSec. Default: 0."),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  backgroundTint: z.string().optional(),
  /**
   * Opt-in editorial frame. When set, the chart renders inside EditorialFrame
   * with publication-grade composition (kicker + heroStat + title + dek +
   * top legend + multi-callout annotations + reference lines + era bands +
   * publication chrome). Existing TitleBlock / HeaderStrip / FooterStrip
   * chrome is suppressed. See EDITORIAL_FRAME_ARCHITECTURE.md.
   */
  frame: EditorialFrameSchema.optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const TimeSeriesChartSchema = z.object({
  data: TimeSeriesChartDataSchema,
});

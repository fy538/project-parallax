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
  /**
   * Mark this series as a counterfactual projection.
   * Counterfactual lines render at 45% opacity with a wider dash pattern
   * ("12,6") and no leading-edge dot marker. The glow filter is suppressed.
   * Implies `dashed: true` — no need to set both.
   * Editorial discipline: a counterfactual series should always be named via
   * an annotation or the line label itself ("Without sanctions", "Pre-1989
   * trajectory"). See: project/COUNTERFACTUAL_REGISTER.md
   */
  counterfactual: z.boolean().optional(),
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

/**
 * Counterfactual zone — a shaded vertical band on the chart marking the
 * "what-if" region. Renders as a taupe/bone fill + dashed left-edge border
 * + right-edge label. Use when the editorial argument is "everything in this
 * zone would have been different if X hadn't happened."
 *
 * Example: shade 1991–2001 as "Without WTO accession" to contrast with the
 * actual post-2001 trajectory. Pair with a counterfactual line in the same
 * zone for maximum editorial clarity.
 */
export const CounterfactualZoneSchema = z.object({
  fromX: TimeSeriesXValueSchema,
  toX: TimeSeriesXValueSchema,
  label: z.string().optional(),
  color: z.string().optional(),
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
  /**
   * A shaded "what-if" zone — spans fromX to toX with a faint fill and a
   * dashed left border. Pairs with counterfactual lines inside the zone.
   * See: project/COUNTERFACTUAL_REGISTER.md
   */
  counterfactualZone: CounterfactualZoneSchema.optional(),
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

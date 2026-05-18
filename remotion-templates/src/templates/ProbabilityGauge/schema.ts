/**
 * Zod schemas for ProbabilityGauge template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { EditorialFrameSchema } from "../../components/EditorialFrame/schema";

export const GaugeItemSchema = z.object({
  label: z.string(),
  value: z.number().min(0).max(100),
  color: z.string().optional(),
  marketSource: z.string().optional(),
});

export const ShiftItemSchema = z.object({
  label: z.string(),
  before: z.number().min(0).max(100),
  after: z.number().min(0).max(100),
  trigger: z.string().optional(),
  color: z.string().optional(),
});

export const ScorecardItemSchema = z.object({
  prediction: z.string(),
  yourEstimate: z.number().min(0).max(100),
  marketPrice: z.number().optional(),
  outcome: z.enum(["correct", "wrong", "pending"]),
});

export const ForecastDataSchema = z.object({
  probability: z.number().min(0).max(100),
  verbalTag: z.string(),
  baseRate: z.string(),
  keyDriver: z.string(),
  keyDisconfirmer: z.string(),
  benchmark: z.string(),
  resolution: z.string(),
});

export const ProbabilityGaugeDataSchema = z.object({
  episode: z.string(),
  title: z.string().describe("State the forecast outcome, not the topic. Write: 'Markets price a 71% chance of TSMC expansion disruption by 2028' not 'Disruption probability'. The title IS the editorial argument."),
  subtitle: z.string().optional(),
  variant: z.enum(["gauge", "strip", "shift", "scorecard", "forecast"]),
  gauges: z.array(GaugeItemSchema).optional(),
  shifts: z.array(ShiftItemSchema).optional(),
  scorecard: z.array(ScorecardItemSchema).optional(),
  forecast: ForecastDataSchema.optional(),
  source: z.string().optional(),
  durationSec: z.number().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  /**
   * Opt-in editorial frame. When set on a `forecast` variant, the chart
   * renders inside EditorialFrame with publication-grade composition.
   * Other variants (gauge / strip / shift / scorecard) currently fall
   * through to the legacy render path even when frame is set.
   */
  frame: EditorialFrameSchema.optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const ProbabilityGaugeSchema = z.object({
  data: ProbabilityGaugeDataSchema,
});

/**
 * Zod schemas for ProbabilityGauge template.
 */

import { z } from "zod";

const GaugeItemSchema = z.object({
  label: z.string(),
  value: z.number().min(0).max(100),
  color: z.string().optional(),
  marketSource: z.string().optional(),
});

const ShiftItemSchema = z.object({
  label: z.string(),
  before: z.number().min(0).max(100),
  after: z.number().min(0).max(100),
  trigger: z.string().optional(),
  color: z.string().optional(),
});

const ScorecardItemSchema = z.object({
  prediction: z.string(),
  yourEstimate: z.number().min(0).max(100),
  marketPrice: z.number().optional(),
  outcome: z.enum(["correct", "wrong", "pending"]),
});

const ForecastDataSchema = z.object({
  probability: z.number().min(0).max(100),
  verbalTag: z.string(),
  baseRate: z.string(),
  keyDriver: z.string(),
  keyDisconfirmer: z.string(),
  benchmark: z.string(),
  resolution: z.string(),
});

export const ProbabilityGaugeSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    variant: z.enum(["gauge", "strip", "shift", "scorecard", "forecast"]),
    gauges: z.array(GaugeItemSchema).optional(),
    shifts: z.array(ShiftItemSchema).optional(),
    scorecard: z.array(ScorecardItemSchema).optional(),
    forecast: ForecastDataSchema.optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    _direction: z.unknown().optional(),
  }),
});

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

export const ProbabilityGaugeSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    variant: z.enum(["gauge", "shift", "scorecard"]),
    gauges: z.array(GaugeItemSchema).optional(),
    shifts: z.array(ShiftItemSchema).optional(),
    scorecard: z.array(ScorecardItemSchema).optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
  }),
});

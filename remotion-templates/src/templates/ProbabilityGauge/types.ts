/**
 * ProbabilityGauge — five variants for forecast display (gauge, strip,
 * shift, scorecard, forecast). Prefer `strip` when 2+ sources estimate
 * the same probability (Cleveland & McGill position-on-a-common-axis).
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  GaugeItemSchema,
  ShiftItemSchema,
  ScorecardItemSchema,
  ForecastDataSchema,
  ProbabilityGaugeDataSchema,
} from "./schema";

export type GaugeItem = z.infer<typeof GaugeItemSchema>;
export type ShiftItem = z.infer<typeof ShiftItemSchema>;
export type ScorecardItem = z.infer<typeof ScorecardItemSchema>;
export type ForecastData = z.infer<typeof ForecastDataSchema>;
export type ProbabilityGaugeData = z.infer<typeof ProbabilityGaugeDataSchema>;

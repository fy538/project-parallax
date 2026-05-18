/**
 * StepLine — stepped time-series for discrete/threshold data.
 *
 * Unlike TimeSeriesChart's smooth interpolated lines, StepLine renders each
 * value as a flat horizontal then a vertical jump at the next x position.
 * Correct form for data that changes discretely (interest rates, policy
 * rates, sanctions tiers, regulatory thresholds) where a smooth line would
 * lie about the change being gradual.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  StepPointXSchema,
  StepPointSchema,
  StepLineDataSchema,
} from "./schema";

export type StepPointX = z.infer<typeof StepPointXSchema>;
export type StepPoint = z.infer<typeof StepPointSchema>;
export type StepLineData = z.infer<typeof StepLineDataSchema>;

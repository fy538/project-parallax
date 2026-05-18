/**
 * BulletChart — Stephen Few's "target vs actual + qualitative ranges" form.
 *
 * One horizontal bar per measure. Behind the bar: shaded qualitative ranges
 * (bad / ok / good). On the bar: an actual-value fill. Across the bar: a
 * target marker. Use for: forecast accuracy, capacity vs commitment,
 * performance scorecards.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type { BulletMeasureSchema, BulletChartDataSchema } from "./schema";

export type BulletMeasure = z.infer<typeof BulletMeasureSchema>;
export type BulletChartData = z.infer<typeof BulletChartDataSchema>;

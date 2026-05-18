/**
 * HorizonChart — Tufte's compressed horizon-chart form for many parallel
 * time-series compared at a glance.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  HorizonDatumSchema,
  HorizonSeriesSchema,
  HorizonChartDataSchema,
} from "./schema";

export type HorizonDatum = z.infer<typeof HorizonDatumSchema>;
export type HorizonSeries = z.infer<typeof HorizonSeriesSchema>;
export type HorizonChartData = z.infer<typeof HorizonChartDataSchema>;
export type HorizonValueFormat = "number" | "percent" | "currency";
export type HorizonScaleMode = "per-series" | "shared";

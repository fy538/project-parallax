/**
 * RankChangeDotPlot — "Before → After" ranking chart with each entity's
 * dots connected by a line, sorted by magnitude of change.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  RankChangeDotPlotItemSchema,
  RankChangeDotPlotDataSchema,
} from "./schema";

export type RankChangeDotPlotItem = z.infer<typeof RankChangeDotPlotItemSchema>;
export type RankChangeDotPlotData = z.infer<typeof RankChangeDotPlotDataSchema>;

/**
 * CalendarHeatmap — year-as-grid heatmap (7 rows × ~53 columns), each cell
 * colored by intensity. For dense daily time-series stories where the
 * PATTERN of days — the rhythm, the clusters, the gaps — is the point.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  CalendarColorScaleSchema,
  CalendarDaySchema,
  CalendarHeatmapDataSchema,
  CalendarHighlightSchema,
} from "./schema";

export type CalendarDay = z.infer<typeof CalendarDaySchema>;
export type CalendarHighlight = z.infer<typeof CalendarHighlightSchema>;
export type CalendarColorScale = z.infer<typeof CalendarColorScaleSchema>;
export type CalendarHeatmapData = z.infer<typeof CalendarHeatmapDataSchema>;

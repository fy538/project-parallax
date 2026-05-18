/**
 * TimelineComparison — two parallel timelines (historical + modern) side by
 * side. Events fade in sequentially, visually drawing the parallel.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  TimelineEventSchema,
  TimelineConnectionSchema,
  TimelineComparisonDataSchema,
} from "./schema";

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type TimelineConnection = z.infer<typeof TimelineConnectionSchema>;
export type TimelineComparisonData = z.infer<typeof TimelineComparisonDataSchema>;

/**
 * SpiralTimeline template types.
 *
 * A timeline rendered as a spiral so recurring patterns stack visually at
 * the same angular position across different revolutions. Use for "history
 * rhymes" arguments — Thucydides-trap instances, hegemonic transitions,
 * financial crises, succession crises — where the editorial claim is that
 * the same structural event recurs across centuries.
 *
 * Types derived from Zod schemas — see `schema.ts`.
 */

import type { z } from "zod";
import type {
  SpiralTimelineCategorySchema,
  SpiralTimelineDataSchema,
  SpiralTimelineEventSchema,
} from "./schema";

export type SpiralTimelineCategory = z.infer<typeof SpiralTimelineCategorySchema>;
export type SpiralTimelineEvent = z.infer<typeof SpiralTimelineEventSchema>;
export type SpiralTimelineData = z.infer<typeof SpiralTimelineDataSchema>;

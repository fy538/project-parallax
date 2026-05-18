/**
 * DualTimeline — two parallel timelines that alternate focus with cinematic
 * crossfade intercutting. Era A focus → crossfade → Era B focus → pullback
 * with connecting lines between paired events.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  DualTimelineDataSchema,
  DualTimelineEventSchema,
  DualTimelinePairSchema,
} from "./schema";

export type DualTimelineEvent = z.infer<typeof DualTimelineEventSchema>;
export type DualTimelinePair = z.infer<typeof DualTimelinePairSchema>;
export type DualTimelineData = z.infer<typeof DualTimelineDataSchema>;

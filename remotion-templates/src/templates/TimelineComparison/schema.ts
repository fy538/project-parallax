/**
 * Zod schemas for TimelineComparison template.
 */

import { z } from "zod";

const TimelineEventSchema = z.object({
  year: z.string(),
  title: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const ConnectionSchema = z.object({
  leftIndex: z.number(),
  rightIndex: z.number(),
  label: z.string().optional(),
});

export const TimelineComparisonSchema = z.object({
  data: z.object({
    episode: z.string(),
    leftLabel: z.string(),
    rightLabel: z.string(),
    leftColor: z.string().optional(),
    rightColor: z.string().optional(),
    leftEvents: z.array(TimelineEventSchema).min(1),
    rightEvents: z.array(TimelineEventSchema).min(1),
    connections: z.array(ConnectionSchema).optional(),
    secondsPerEvent: z.number().optional(),
  }),
});

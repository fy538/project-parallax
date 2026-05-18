/**
 * Zod schemas for TimelineComparison template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const TimelineEventSchema = z.object({
  year: z.string(),
  title: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const TimelineConnectionSchema = z.object({
  leftIndex: z.number(),
  rightIndex: z.number(),
  label: z.string().optional(),
});

export const TimelineComparisonDataSchema = z.object({
  episode: z.string(),
  leftLabel: z.string(),
  rightLabel: z.string(),
  leftColor: z.string().optional(),
  rightColor: z.string().optional(),
  leftEvents: z.array(TimelineEventSchema).min(1),
  rightEvents: z.array(TimelineEventSchema).min(1),
  connections: z.array(TimelineConnectionSchema).optional(),
  secondsPerEvent: z.number().optional(),
  _direction: DirectionBlockSchema.optional(),
  backgroundTint: z.string().optional(),
});

export const TimelineComparisonSchema = z.object({
  data: TimelineComparisonDataSchema,
});

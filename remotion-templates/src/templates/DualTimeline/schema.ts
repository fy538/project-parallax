/**
 * Zod schemas for DualTimeline template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const DualTimelineEventSchema = z.object({
  label: z.string().describe("Year/date label for the event"),
  text: z.string().describe("Event description"),
  textCn: z.string().optional().describe("Chinese translation"),
});

export const DualTimelinePairSchema = z.object({
  eraA: DualTimelineEventSchema,
  eraB: DualTimelineEventSchema,
  connection: z.string().optional().describe("Label for connecting line between events"),
});

export const DualTimelineDataSchema = z.object({
  title: z.string().describe("Main title of the dual timeline"),
  titleCn: z.string().optional().describe("Chinese translation of title"),
  subtitle: z.string().optional().describe("Optional subtitle"),
  eraATitle: z.string().describe("Label for era A column"),
  eraBTitle: z.string().describe("Label for era B column"),
  eraAColor: z.string().describe("Accent color for era A (hex)"),
  eraBColor: z.string().describe("Accent color for era B (hex)"),
  pairs: z.array(DualTimelinePairSchema),
  episode: z.string().optional().describe("Episode identifier"),
  backgroundVariant: z.enum(["light", "dark"]).optional().default("light"),
  durationSec: z.number().optional().describe("Total duration in seconds"),
  _direction: DirectionBlockSchema.optional(),
});

export const DualTimelineSchema = z.object({
  data: DualTimelineDataSchema,
});

/**
 * Zod schemas for DuelingFrameworks template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const FrameworkTenetSchema = z.object({
  text: z.string(),
  textCn: z.string().optional(),
});

export const FrameworkSchema = z.object({
  name: z.string(),
  nameCn: z.string().optional(),
  color: z.string(),
  tenets: z.array(FrameworkTenetSchema),
  score: z.number().min(0).max(100),
  verdict: z.string().optional(),
  verdictCn: z.string().optional(),
});

export const DuelingFrameworksDataSchema = z.object({
  title: z.string(),
  titleCn: z.string().optional(),
  subtitle: z.string().optional(),
  subtitleCn: z.string().optional(),
  frameworkA: FrameworkSchema,
  frameworkB: FrameworkSchema,
  phenomenon: z.string(),
  phenomenonCn: z.string().optional(),
  verdictLabel: z.string().optional(),
  verdictLabelCn: z.string().optional(),
  episode: z.string().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  durationSec: z.number().optional(),
  cinematicMode: z.boolean().optional().describe("When true, uses cinematic horizontal camera that tracks between frameworks"),
  ambientParticles: z.boolean().optional().describe("Enable ambient particles for depth"),
  _direction: DirectionBlockSchema.optional(),
});

export const DuelingFrameworksSchema = z.object({
  data: DuelingFrameworksDataSchema,
});

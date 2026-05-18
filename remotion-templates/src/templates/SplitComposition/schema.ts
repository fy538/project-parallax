/**
 * Zod schemas for SplitComposition template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const SplitSideSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  items: z.array(z.string()),
  accentColor: z.string().optional(),
  bgTint: z.string().optional(),
  tag: z.string().optional(),
});

export const SplitCompositionDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  left: SplitSideSchema,
  right: SplitSideSchema,
  dividerLabel: z.string().optional(),
  noDivider: z.boolean().optional(),
  source: z.string().optional(),
  durationSec: z.number().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  /** Cinematic mode: progressive spotlight with camera focus per side */
  cinematicMode: z.boolean().optional(),
  /** Enable ambient particles for depth */
  ambientParticles: z.boolean().optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const SplitCompositionSchema = z.object({
  data: SplitCompositionDataSchema,
});

/**
 * Zod schemas for ConceptEvolutionTimeline — Foucauldian genealogy diagram.
 *
 * A single concept that changes its meaning across historical moments, shown
 * as a horizontal spine with labeled nodes. Each node has a definition panel
 * below it showing how the concept was defined at that moment. Drift labels
 * on the connecting arrows describe how the concept shifted between moments.
 *
 * Editorial use: "Sovereignty: 1648 Westphalia (territorial exclusivity) →
 * 1919 Versailles (self-determination) → 1945 UN Charter (non-interference)
 * → 2005 R2P (conditional on behavior)."
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const ConceptEvolutionEventSchema = z.object({
  year: z.string(),
  title: z.string(),
  definition: z.string(),
  keyPassage: z.string().optional(),
  color: z.string().optional(),
});

export const ConceptEvolutionDriftSchema = z.object({
  fromIndex: z.number().int().nonnegative(),
  toIndex: z.number().int().nonnegative(),
  label: z.string(),
  emphasis: z.enum(["shift", "rupture", "continuity"]).optional(),
});

export const ConceptEvolutionTimelineDataSchema = z.object({
  episode: z.string(),
  concept: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),
  events: z
    .array(ConceptEvolutionEventSchema)
    .min(2, {
      message:
        "ConceptEvolutionTimeline requires at least 2 events to show a genealogy.",
    })
    .max(7, {
      message:
        "ConceptEvolutionTimeline supports up to 7 events. Above that, definition panels overlap.",
    }),
  drifts: z.array(ConceptEvolutionDriftSchema).optional(),
});

export const ConceptEvolutionTimelineSchema = z.object({
  data: ConceptEvolutionTimelineDataSchema,
});

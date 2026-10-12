/**
 * Type exports for ConceptEvolutionTimeline — derived from Zod schema.
 * No hand-declared interfaces: all types are inferred from the schema.
 */

import type { z } from "zod";
import type {
  ConceptEvolutionTimelineDataSchema,
  ConceptEvolutionEventSchema,
  ConceptEvolutionDriftSchema,
} from "./schema";

export type ConceptEvolutionTimelineData = z.infer<
  typeof ConceptEvolutionTimelineDataSchema
>;

export type ConceptEvolutionEvent = z.infer<typeof ConceptEvolutionEventSchema>;

export type ConceptEvolutionDrift = z.infer<typeof ConceptEvolutionDriftSchema>;

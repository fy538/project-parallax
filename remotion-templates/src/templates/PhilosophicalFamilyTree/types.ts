/**
 * Types for PhilosophicalFamilyTree — all inferred from Zod schemas
 * so there is a single source of truth.
 */

import type { z } from "zod";
import type {
  PhilosophicalFamilyTreeDataSchema,
  PhilosophicalFamilyTreeThinkerSchema,
  PhilosophicalFamilyTreeInfluenceSchema,
} from "./schema";

export type PhilosophicalFamilyTreeData = z.infer<
  typeof PhilosophicalFamilyTreeDataSchema
>;

export type PhilosophicalFamilyTreeThinker = z.infer<
  typeof PhilosophicalFamilyTreeThinkerSchema
>;

export type PhilosophicalFamilyTreeInfluence = z.infer<
  typeof PhilosophicalFamilyTreeInfluenceSchema
>;

/**
 * ConditionalArgument template types.
 *
 * "If X, then Y; if not-X, then Z" — binary conditional branching with
 * two consequences shown side-by-side. Distinct from DecisionTree
 * (hierarchical N-way) and ComparisonPair (general comparison).
 */

import type { z } from "zod";
import type {
  ConditionalArgumentDataSchema,
  ConditionalBranchSchema,
} from "./schema";

export type ConditionalBranch = z.infer<typeof ConditionalBranchSchema>;
export type ConditionalArgumentData = z.infer<typeof ConditionalArgumentDataSchema>;

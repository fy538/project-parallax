/**
 * CounterfactualPath template types.
 *
 * Horizontal timeline with branching point — the actual historical path
 * (solid gold) + 1-2 dashed counterfactual branches diverging at a named
 * decision point. The "road not taken" visualisation.
 */

import type { z } from "zod";
import type {
  CounterfactualBranchSchema,
  CounterfactualPathDataSchema,
} from "./schema";

export type CounterfactualBranch = z.infer<typeof CounterfactualBranchSchema>;
export type CounterfactualPathData = z.infer<typeof CounterfactualPathDataSchema>;

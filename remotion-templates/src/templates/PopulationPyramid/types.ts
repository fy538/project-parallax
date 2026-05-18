/**
 * PopulationPyramid — back-to-back horizontal bars by age cohort
 * (left = male, right = female). Canonical demographics visualization
 * for youth bulges, demographic cliffs, dependency ratios.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type { PyramidCohortSchema, PopulationPyramidDataSchema } from "./schema";

export type PyramidCohort = z.infer<typeof PyramidCohortSchema>;
export type PopulationPyramidData = z.infer<typeof PopulationPyramidDataSchema>;

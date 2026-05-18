/**
 * DuelingFrameworks — two frameworks compared head-to-head with animated
 * scoring and verdict phase.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  DuelingFrameworksDataSchema,
  FrameworkSchema,
  FrameworkTenetSchema,
} from "./schema";

export type FrameworkTenet = z.infer<typeof FrameworkTenetSchema>;
export type Framework = z.infer<typeof FrameworkSchema>;
export type DuelingFrameworksData = z.infer<typeof DuelingFrameworksDataSchema>;

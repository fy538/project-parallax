/**
 * StatReveal — dramatic single-statistic reveal with comparison bars.
 *
 * Types derived from Zod schemas (May 2026 audit #3). This file used to
 * hand-duplicate the schema's shape, which silently drifted whenever a
 * field was added to schema.ts without the corresponding TS update.
 * Now it's a re-export shim — the schema is the single source of truth.
 *
 * The runtime structure: hero number counts up from zero, then comparison
 * bars grow in to provide context. Designed for the "holy shit" number
 * moment — when a single data point lands with visceral impact.
 *
 * Example: "$280 billion" counting up, then three bars showing
 * what that figure dwarfs or matches.
 */

import type { z } from "zod";
import type {
  ComparisonBarSchema,
  StatRevealDataSchema,
} from "./schema";

export type ComparisonBar = z.infer<typeof ComparisonBarSchema>;
export type StatRevealData = z.infer<typeof StatRevealDataSchema>;

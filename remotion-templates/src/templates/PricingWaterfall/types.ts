/**
 * PricingWaterfall — value-chain decomposition. Fixed total split into
 * stage segments with the smallest sliver in accent color (FT iPhone /
 * Bloomberg cocoa / SCA farmgate-share idiom).
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  PricingWaterfallStageSchema,
  PricingWaterfallDataSchema,
} from "./schema";

export type PricingWaterfallStage = z.infer<typeof PricingWaterfallStageSchema>;
export type PricingWaterfallData = z.infer<typeof PricingWaterfallDataSchema>;

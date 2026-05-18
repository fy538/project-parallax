/**
 * SplitComposition — full-bleed vertical split for "Translator"/"Dialectician"
 * format episodes (Western vs Chinese lens, thesis vs antithesis).
 *
 * Layout: 1920×1080 split vertically down the center (960px divider).
 * Each half has its own subtitle, tag, title, and staggered item list.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  SplitSideSchema,
  SplitCompositionDataSchema,
} from "./schema";

export type SplitSide = z.infer<typeof SplitSideSchema>;
export type SplitCompositionData = z.infer<typeof SplitCompositionDataSchema>;

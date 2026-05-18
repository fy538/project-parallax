/**
 * KineticTypography — animated quotes, definitions, bilingual text,
 * single statistics.
 *
 * Types derived from Zod schemas (May 2026 audit #3 — see StatReveal for
 * the canonical pattern explanation). The pre-existing hand-typed
 * `QuoteData` interface silently drifted whenever a field was added to
 * schema.ts without the corresponding TS update; now it's a one-line
 * re-export.
 *
 * Variants: "quote" (with optional attribution), "definition" (with
 * pinyin + translation for Chinese terms), "bilingual" (paired EN/CN),
 * "statistic" (single hero number with label + context).
 */

import type { z } from "zod";
import type { QuoteDataDataSchema } from "./schema";

export type QuoteData = z.infer<typeof QuoteDataDataSchema>;

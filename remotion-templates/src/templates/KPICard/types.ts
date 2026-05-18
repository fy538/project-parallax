/**
 * KPICard — single hero stat + change indicator + optional inline sparkline.
 *
 * Use for: episode-summary stats, year-over-year movement, forecast vs
 * actual, "the number that matters." Less verbose than DataChart, more
 * editorial than a raw StatReveal.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type { KPICardDataSchema } from "./schema";

export type KPICardData = z.infer<typeof KPICardDataSchema>;

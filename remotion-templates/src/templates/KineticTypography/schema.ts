/**
 * Zod schemas for KineticTypography template.
 */

import { z } from "zod";

export const QuoteDataSchema = z.object({
  data: z.object({
    episode: z.string(),
    variant: z.enum(["quote", "definition", "bilingual", "statistic"]),
    text: z.string().optional(),
    attribution: z.string().optional(),
    attributionContext: z.string().optional(),
    term: z.string().optional(),
    termPinyin: z.string().optional(),
    termTranslation: z.string().optional(),
    definitionText: z.string().optional(),
    chineseText: z.string().optional(),
    englishText: z.string().optional(),
    statValue: z.string().optional(),
    statLabel: z.string().optional(),
    statContext: z.string().optional(),
    accentColor: z.string().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    durationSec: z.number().optional(),
    _direction: z.unknown().optional(),
    backgroundTint: z.string().optional(),
  }),
});

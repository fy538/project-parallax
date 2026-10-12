/**
 * Zod schemas for KineticTypography template.
 *
 * Schema-derived types (May 2026 audit #3): the inner `data` object is
 * exported as `QuoteDataDataSchema` so types.ts can `z.infer` from it.
 * Outer `QuoteDataSchema` keeps its historic name (manifest dispatch in
 * Episodes/templateSchemas.ts references it as `KineticTypographySchema`
 * via import alias).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const QuoteDataDataSchema = z
  .object({
    episode: z.string(),
    variant: z.enum(["quote", "definition", "bilingual", "statistic"]),
    text: z.string().optional(),
    attribution: z.string().optional(),
    attributionContext: z.string().optional(),
    /**
     * quote-attribution only. Typing speed in characters per second
     * (default 22). Speech runs at about 14, so set that when the narrator
     * reads the quote aloud and the text should not outrun the voice.
     */
    typingCps: z.number().positive().optional(),
    /** quote-attribution only. Seconds into the card at which typing starts. Default 0. */
    typingStartSec: z.number().min(0).optional(),
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
    durationSec: z.number().positive().optional(),
    _direction: DirectionBlockSchema.optional(),
    backgroundTint: z.string().optional(),
  })
  .superRefine((d, ctx) => {
      if (d.variant === "quote" && !d.text) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "variant 'quote' requires text",
          path: ["text"],
        });
      }
      if (d.variant === "definition" && !d.term) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "variant 'definition' requires term",
          path: ["term"],
        });
      }
      if (d.variant === "definition" && !d.definitionText) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "variant 'definition' requires definitionText",
          path: ["definitionText"],
        });
      }
      if (d.variant === "bilingual" && !d.chineseText) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "variant 'bilingual' requires chineseText",
          path: ["chineseText"],
        });
      }
      if (d.variant === "bilingual" && !d.englishText) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "variant 'bilingual' requires englishText",
          path: ["englishText"],
        });
      }
      if (d.variant === "statistic" && !d.statValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "variant 'statistic' requires statValue",
          path: ["statValue"],
        });
      }
    });

export const QuoteDataSchema = z.object({
  data: QuoteDataDataSchema,
});

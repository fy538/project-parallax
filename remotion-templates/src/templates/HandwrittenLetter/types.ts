/**
 * HandwrittenLetter template types.
 *
 * Two modes:
 *   • photograph (canonical) — show a real archival image of the letter
 *     with Ken Burns pan + paragraph fade-ins synced to narration
 *   • typeset     (fallback) — render the text in a script font with
 *     paragraph fade-ins; optional ink-trail draw-on per paragraph
 *
 * Types derived from Zod schemas. See `schema.ts`.
 */

import type { z } from "zod";
import type {
  HandwrittenLetterDataSchema,
  HandwrittenParagraphSchema,
} from "./schema";

export type HandwrittenParagraph = z.infer<typeof HandwrittenParagraphSchema>;
export type HandwrittenLetterData = z.infer<typeof HandwrittenLetterDataSchema>;

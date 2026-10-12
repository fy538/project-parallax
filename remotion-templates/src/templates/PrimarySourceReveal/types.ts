/**
 * PrimarySourceReveal template types.
 *
 * Renders a primary-source text passage (treaty clause, speech excerpt,
 * diplomatic cable) with timed annotations — underlines, circles, margin
 * notes, strike-throughs, translations. The "reading history closely"
 * editorial form: the text IS the visual, animations are the analysis.
 *
 * Types derived from Zod schemas.
 */

import type { z } from "zod";
import type {
  PrimarySourceAnnotationSchema,
  PrimarySourceDataSchema,
} from "./schema";

export type PrimarySourceAnnotation = z.infer<typeof PrimarySourceAnnotationSchema>;
export type PrimarySourceData = z.infer<typeof PrimarySourceDataSchema>;

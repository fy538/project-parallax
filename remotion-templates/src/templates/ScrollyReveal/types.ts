/**
 * ScrollyReveal template types.
 *
 * All types derived from Zod schemas — no hand-declared interfaces.
 * Extend the schemas in schema.ts; types update automatically.
 */

import type { z } from "zod";
import type {
  ScrollyAnnotationSchema,
  ScrollyStepSchema,
  ScrollyRevealDataSchema,
} from "./schema";

export type ScrollyAnnotation = z.infer<typeof ScrollyAnnotationSchema>;
export type ScrollyStep = z.infer<typeof ScrollyStepSchema>;
export type ScrollyRevealData = z.infer<typeof ScrollyRevealDataSchema>;

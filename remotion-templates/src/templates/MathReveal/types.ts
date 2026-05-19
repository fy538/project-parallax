/**
 * Types for MathReveal — derived from schema.ts via z.infer (audit #3
 * pattern; types.ts is a re-export shim, schema is the single source of truth).
 */

import type { z } from "zod";
import type { MathRevealDataSchema } from "./schema";

export type MathRevealData = z.infer<typeof MathRevealDataSchema>;

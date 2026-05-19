/**
 * Types for MathDerivation — derived from schema.ts via z.infer
 * (audit #3 pattern; schema is the single source of truth).
 */

import type { z } from "zod";
import type { MathDerivationDataSchema, MathStepSchema } from "./schema";

export type MathStep = z.infer<typeof MathStepSchema>;
export type MathDerivationData = z.infer<typeof MathDerivationDataSchema>;

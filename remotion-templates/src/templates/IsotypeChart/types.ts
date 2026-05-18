/**
 * Types for the IsotypeChart template.
 *
 * Quantities expressed as N repeated icons instead of bars — abstract
 * numbers feel human-scale. "92 of 100 advanced chips come from one
 * company" expressed as 92 chip icons in amber and 8 in muted ink.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  IsotypeChartDataSchema,
  IsotypeIconTypeSchema,
  IsotypeRowSchema,
} from "./schema";

export type IsotypeIconType = z.infer<typeof IsotypeIconTypeSchema>;
export type IsotypeRow = z.infer<typeof IsotypeRowSchema>;
export type IsotypeChartData = z.infer<typeof IsotypeChartDataSchema>;

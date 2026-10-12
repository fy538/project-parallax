/**
 * SmallMultiples template types.
 *
 * Grid of N synchronized line-chart cells — the NYT/Economist signature
 * comparison form. Each cell shows the same chart type applied to a
 * different entity (country, decade, election, etc.) with shared axes
 * so structural patterns become legible at a glance.
 *
 * Types derived from Zod schemas.
 */

import type { z } from "zod";
import type {
  SmallMultiplesCellSchema,
  SmallMultiplesDataSchema,
  SmallMultiplesPointSchema,
} from "./schema";

export type SmallMultiplesPoint = z.infer<typeof SmallMultiplesPointSchema>;
export type SmallMultiplesCell = z.infer<typeof SmallMultiplesCellSchema>;
export type SmallMultiplesData = z.infer<typeof SmallMultiplesDataSchema>;

/**
 * TypeScript types for AnnotatedZoom — derived from Zod schemas.
 *
 * Always infer from the schema (not hand-written) so the types stay
 * in sync with runtime validation automatically.
 */

import type { z } from "zod";
import type {
  AnnotatedZoomDataSchema,
  AnnotatedZoomRegionSchema,
} from "./schema";

export type AnnotatedZoomData = z.infer<typeof AnnotatedZoomDataSchema>;
export type AnnotatedZoomRegion = z.infer<typeof AnnotatedZoomRegionSchema>;

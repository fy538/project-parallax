/**
 * ArchivalReel template types.
 *
 * Film-stock register applied to an image — 8mm/16mm/VHS-era grain, color
 * cast, gate weave, scanlines, chroma bleed. The image is the historical
 * evidence; the film treatment signals "this is period footage."
 */

import type { z } from "zod";
import type {
  ArchivalReelDataSchema,
} from "./schema";

export type ArchivalReelData = z.infer<typeof ArchivalReelDataSchema>;
export type FilmStock = "8mm" | "16mm" | "vhs";

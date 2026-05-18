/**
 * AnnotatedImage — image with animated callout labels.
 *
 * Brand-treated image fills the frame; callout labels animate in at
 * specific positions to explain what the viewer is looking at. Each
 * callout has a dot, leader line, and text label that fades in
 * sequentially. Use cases: chip die shots, satellite imagery, historical
 * photos, military hardware, geographic features.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down — see
 * StatReveal for the canonical pattern).
 */

import type { z } from "zod";
import type { CalloutSchema, AnnotatedImageDataSchema } from "./schema";

export type Callout = z.infer<typeof CalloutSchema>;
export type AnnotatedImageData = z.infer<typeof AnnotatedImageDataSchema>;

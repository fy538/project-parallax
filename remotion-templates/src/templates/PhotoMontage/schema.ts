/**
 * Zod schemas for PhotoMontage template — runtime validation + Remotion Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const MontageImageSchema = z.object({
  src: z.string(),
  durationSec: z.number().positive(),
  treatment: z.enum(["standard", "conflict", "editorial"]),
  compositeMode: z.enum(["background", "inset"]),
  compositeOpacity: z.number().min(0).max(1).optional(),
  kenBurns: z.boolean().optional().describe("Enable Ken Burns effect for this image (default: true)."),
  overlay: z
    .object({
      text: z.string(),
      position: z.enum(["bottom-left", "bottom-right", "center", "top-right"]),
      style: z.enum(["stat", "label", "caption"]),
    })
    .optional(),
  secondaryOverlay: z
    .object({
      text: z.string(),
      position: z.enum(["top-left", "top-right"]),
    })
    .optional(),
});

export const PhotoMontageDataSchema = z.object({
  episode: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  images: z.array(MontageImageSchema),
  // Between-photo transition (NOT segment-to-segment — independent of
  // TRANSITION_GRAMMAR.md). `wipe-left` is retained here for back-compat
  // with shipped data; new montages should pick `cut` or `dissolve`.
  transition: z.enum(["cut", "dissolve", "wipe-left"]),
  transitionDurationSec: z.number().optional(),
  source: z.string().optional(),
  durationSec: z.number().optional(),
  backgroundTint: z.string().optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const PhotoMontageSchema = z.object({
  data: PhotoMontageDataSchema,
});

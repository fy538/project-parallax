/**
 * Zod schemas for PhotoMontage template — runtime validation + Remotion Studio editing.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

const MontageImageSchema = z.object({
  src: z.string(),
  durationSec: z.number().positive(),
  treatment: z.enum(["standard", "conflict", "editorial"]),
  compositeMode: z.enum(["background", "inset"]),
  compositeOpacity: z.number().min(0).max(1).optional(),
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

export const PhotoMontageSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    images: z.array(MontageImageSchema),
    transition: z.enum(["cut", "dissolve", "wipe-left"]),
    transitionDurationSec: z.number().optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundTint: z.string().optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});

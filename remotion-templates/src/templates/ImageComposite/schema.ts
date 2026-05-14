/**
 * Zod schemas for ImageComposite template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const ImageCompositeSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    caption: z.string().optional(),
    imagePath: z.string(),
    variant: z.enum(["background", "inset", "portrait"]),
    duotone: z.enum(["standard", "conflict", "editorial"]).optional(),
    grainOpacity: z.number().optional(),
    textPosition: z.enum(["bottom-left", "bottom-right", "center"]).optional(),
    personName: z.string().optional(),
    personTitle: z.string().optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});

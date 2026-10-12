/**
 * Zod schemas for ImageComposite template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const ImageCompositeDataSchema = z.object({
  episode: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  caption: z.string().optional(),
  imagePath: z.string(),
  variant: z.enum(["background", "inset", "portrait"]),
  /**
   * Duotone ramp. "none" shows the image in its own tones — right for
   * engravings and prints that are already ink-on-paper, and for evidence
   * photos where the colour carries information.
   */
  duotone: z.enum(["standard", "conflict", "editorial", "none"]).optional(),
  /** Portrait variant: how the image fills its panel. Default "cover". */
  imageFit: z.enum(["cover", "contain"]).optional(),
  grainOpacity: z.number().optional(),
  textPosition: z.enum(["bottom-left", "bottom-right", "center"]).optional(),
  personName: z.string().optional(),
  personTitle: z.string().optional(),
  /**
   * portrait only. Quotations typed beside the portrait, each starting at its
   * own time — the person stays on screen while their words appear, instead
   * of a name plate followed by a separate quote card. Give a quotation the
   * narrator reads in two pieces as two entries. `cps` defaults to 14, the
   * pace of speech. With quotes present the name is set smaller, as a credit.
   */
  quotes: z
    .array(
      z.object({
        text: z.string().min(1),
        atSec: z.number().min(0),
        cps: z.number().positive().optional(),
      }),
    )
    .optional(),
  source: z.string().optional(),
  durationSec: z.number().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const ImageCompositeSchema = z.object({
  data: ImageCompositeDataSchema,
});

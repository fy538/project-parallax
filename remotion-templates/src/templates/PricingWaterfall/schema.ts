import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

const PricingWaterfallStageSchema = z.object({
  label: z.string(),
  share: z.number(),
  descriptor: z.string().optional(),
  hero: z.boolean().optional(),
  color: z.string().optional(),
});

export const PricingWaterfallSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    total: z.object({
      value: z.string(),
      label: z.string(),
    }),
    stages: z.array(PricingWaterfallStageSchema),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    backgroundTint: z.string().optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});

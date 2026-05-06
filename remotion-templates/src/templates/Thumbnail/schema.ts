import { z } from "zod";

export const ThumbnailSchema = z.object({
  data: z.object({
    layout: z.enum(["juxtaposition", "data-provocation", "symbolic"]),
    episode: z.string(),
    episodeLabel: z.string().optional(),
    imageSrc: z.string().optional(),
    imageRamp: z.enum(["standard", "conflict", "editorial"]).optional(),
    titleText: z.string().optional(),
    statPrimary: z.string().optional(),
    statPrimaryLabel: z.string().optional(),
    statContrast: z.string().optional(),
    statContrastLabel: z.string().optional(),
    statContrastColor: z.string().optional(),
    heroText: z.string().optional(),
    subText: z.string().optional(),
    illustrationSrc: z.string().optional(),
    symbolTitle: z.string().optional(),
  }),
});

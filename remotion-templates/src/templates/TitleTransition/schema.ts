/**
 * Zod schemas for TitleTransition template.
 */

import { z } from "zod";

export const TitleTransitionSchema = z.object({
  data: z.object({
    episode: z.string(),
    variant: z.enum(["episode-title", "section", "end-card"]),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    episodeLabel: z.string().optional(),
    seriesName: z.string().optional(),
    sectionNumber: z.string().optional(),
    sectionTitle: z.string().optional(),
    ctaText: z.string().optional(),
    nextEpisodeTeaser: z.string().optional(),
    accentColor: z.string().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    durationSec: z.number().optional(),
  }),
});

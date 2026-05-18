/**
 * Zod schemas for TitleTransition template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const TitleTransitionVariantSchema = z.enum([
  "episode-title",
  "section",
  "end-card",
  "editorial-title",
]);

export const TitleTransitionBrandMarkSchema = z.enum([
  "top-right",
  "bottom-left",
  "none",
]);

export const TitleTransitionDataSchema = z.object({
  episode: z.string(),
  variant: TitleTransitionVariantSchema,
  title: z.string().optional(),
  subtitle: z.string().optional(),
  episodeLabel: z.string().optional(),
  seriesName: z.string().optional(),
  kicker: z.string().optional(),
  dek: z.string().optional(),
  brandMark: TitleTransitionBrandMarkSchema.optional(),
  sectionNumber: z.string().optional(),
  sectionTitle: z.string().optional(),
  ctaText: z.string().optional(),
  nextEpisodeTeaser: z.string().optional(),
  /**
   * Photo/asset credits to surface on the end-card. One line per attribution
   * — typically "Subject — Photographer (License via Source)". Required for
   * CC BY-SA compliance when the episode uses such photos. See
   * `episodes/<slug>/CREDITS.md` for the canonical attribution record.
   * Only rendered when variant === "end-card".
   */
  credits: z.array(z.string()).optional(),
  accentColor: z.string().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  durationSec: z.number().optional(),
  _direction: DirectionBlockSchema.optional(),
  backgroundTint: z.string().optional(),
});

export const TitleTransitionSchema = z.object({
  data: TitleTransitionDataSchema,
});

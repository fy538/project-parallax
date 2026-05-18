/**
 * Zod schemas for Thumbnail template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";

export const ThumbnailLayoutSchema = z.enum([
  "juxtaposition",
  "data-provocation",
  "symbolic",
]);

export const ThumbnailRampSchema = z.enum(["standard", "conflict", "editorial"]);

export const ThumbnailDataSchema = z.object({
  layout: ThumbnailLayoutSchema,
  episode: z.string(),
  episodeLabel: z.string().optional(),
  imageSrc: z.string().optional(),
  imageRamp: ThumbnailRampSchema.optional(),
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
});

export const ThumbnailSchema = z.object({
  data: ThumbnailDataSchema,
});

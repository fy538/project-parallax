/**
 * Zod schemas for SplitComposition template.
 */

import { z } from "zod";

const SplitSideSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  items: z.array(z.string()),
  accentColor: z.string().optional(),
  bgTint: z.string().optional(),
  tag: z.string().optional(),
});

export const SplitCompositionSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    left: SplitSideSchema,
    right: SplitSideSchema,
    dividerLabel: z.string().optional(),
    noDivider: z.boolean().optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
  }),
});

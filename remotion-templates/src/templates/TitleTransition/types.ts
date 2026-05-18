/**
 * TitleTransition — episode title cards, section dividers, and end cards.
 * Clean, cinematic text with optional subtitle and episode number.
 *
 * Variants:
 *   - `episode-title`    — cinematic open with bloom / lens-focus / beat-sync.
 *   - `section`          — chapter dividers between acts.
 *   - `end-card`         — CTA + next-episode teaser (+ credits).
 *   - `editorial-title`  — Kicker + Title + Dek three-line stack on paper,
 *                          fade-only entrance, ∴ brand mark in corner.
 *                          The Atlantic/FT magazine convention. Default for
 *                          analytical-essay register (Philosopher's Lens).
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  TitleTransitionVariantSchema,
  TitleTransitionBrandMarkSchema,
  TitleTransitionDataSchema,
} from "./schema";

export type TitleTransitionVariant = z.infer<typeof TitleTransitionVariantSchema>;
export type TitleTransitionBrandMark = z.infer<typeof TitleTransitionBrandMarkSchema>;
export type TitleTransitionData = z.infer<typeof TitleTransitionDataSchema>;

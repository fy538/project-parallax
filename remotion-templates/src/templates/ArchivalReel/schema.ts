/**
 * Zod schema for ArchivalReel template.
 *
 * Film-stock register applied to a still image. Three canonical stocks:
 *
 *   • 8mm   — Super-8 home-movie register. Heavy grain, warm-magenta cast
 *             (Kodachrome shift), 18 fps judder, soft corners. Soviet
 *             family-camera footage, post-war home movies.
 *   • 16mm  — Newsreel/news-film register. Fine grain, neutral-to-cool
 *             color, 24 fps, slight gate weave, vertical scratches, deeper
 *             blacks. Vietnam-era network news, 1950s-70s documentary film.
 *   • VHS   — Magnetic-tape 1976-1995. Scanlines, chroma bleed, horizontal
 *             tracking band, saturation lift, soft luma. Perestroika footage,
 *             80s/90s home video, Berlin Wall fall, Gulf War coverage.
 *
 * Apollo 11 doctrine (Miller, 2019): when you have native archive film,
 * DO NOT add grain on top. The film already has its own grain. Set
 * `nativeFootage: true` to suppress the heavier treatment.
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — ArchivalReel entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Top-level data ─────────────────────────────────────────────────────────

export const ArchivalReelDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /** Optional title overlay. */
  title: z.string().optional(),
  /** Optional subtitle. */
  subtitle: z.string().optional(),
  /** Total duration in seconds. Default 8s. */
  durationSec: z.number().positive().optional(),

  /**
   * Film stock — drives the entire visual signature. Match to the era of
   * the source footage:
   *   • 8mm  → 1932-1990 (home movie / amateur film)
   *   • 16mm → 1923-present (newsreel, documentary, network news)
   *   • vhs  → 1976-1995 (consumer video, late-Cold-War broadcast)
   *
   * Era-mismatched treatment is the canonical failure mode (8mm grain on
   * a 1990s photo, VHS scanlines on a 1940s photo).
   */
  stock: z.enum(["8mm", "16mm", "vhs"]),

  /** Image URL or path. The historical evidence. */
  imageUrl: z.string(),
  /** Image fit. Default "cover". */
  imageFit: z.enum(["cover", "contain"]).optional(),

  /**
   * Treatment intensity 0-1. Default 0.5 (medium).
   * Apollo 11 doctrine: use 0.3-0.4 when the source IS real archive film
   * (let the source's own grain breathe). Use 0.6-0.8 only when you're
   * applying period register to a modern photograph — the more "real" the
   * source film, the lower the intensity should be.
   */
  intensity: z.number().min(0).max(1).optional(),
  /**
   * Flag: source is native archive footage, NOT a modern photo. When true,
   * grain/scratch treatment is reduced by ~60%, gate weave is preserved.
   * The Apollo 11 doctrine flag.
   */
  nativeFootage: z.boolean().optional(),
  /**
   * Gate weave on/off. Default true for 8mm/16mm (real film weaves slightly
   * in the projector gate), false for VHS (tape doesn't weave; it tears).
   */
  gateWeave: z.boolean().optional(),
  /**
   * Optional color-cast override (hex). When unset, defaults by stock:
   *   • 8mm  → warm magenta (Kodachrome shift)
   *   • 16mm → neutral
   *   • vhs  → saturation lift, slight cyan in shadows
   */
  colorCast: z.string().optional(),

  /**
   * Optional caption strip — dateline + source. Renders bottom-left in mono
   * with a slight rubber-stamp register ("16MM · 1968 · NBC ARCHIVE").
   */
  caption: z
    .object({
      text: z.string(),
      dateline: z.string().optional(),
      source: z.string().optional(),
    })
    .optional(),

  /** Archive citation for SourceAttribution. */
  source: z.string(),

  /** Background variant. Default "dark" — film artifacts read better against dark. */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const ArchivalReelSchema = z.object({
  data: ArchivalReelDataSchema,
});

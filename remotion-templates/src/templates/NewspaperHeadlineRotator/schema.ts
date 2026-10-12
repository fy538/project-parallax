/**
 * Zod schema for NewspaperHeadlineRotator template.
 *
 * "The world saw it this way" sequence — 3-5 period newspaper front pages
 * revealed in sequence. The compounding evidence of multiple outlets making
 * the same point at the same moment IS the editorial argument.
 *
 * Authoring rule (enforced by docs, not schema): mastheads MUST be real
 * scanned crops, not typeset reconstructions. Typesetting a "NYT" masthead
 * always looks wrong — period typography is hard to fake. Sources for real
 * masthead crops:
 *   • Library of Congress: Chronicling America (historical US papers)
 *   • Wikimedia Commons (most major mastheads, especially pre-1923)
 *   • newspapers.com (subscription — has higher-res crops)
 *   • National archives of source countries (Pravda, Le Monde, Asahi)
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — NewspaperHeadlineRotator entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Single headline ────────────────────────────────────────────────────────

export const NewspaperHeadlineSchema = z.object({
  /**
   * URL or path to the real scanned masthead crop (just the publication
   * nameplate, NOT the full front page). Recommended crop: outlet name
   * + tagline + date strip if visible. ~600px wide, transparent or matched
   * paper background. Required — typeset mastheads are forbidden by doctrine.
   */
  mastheadImageUrl: z.string(),
  /**
   * The headline text the page ran that day. This IS typeset (in IBM Plex
   * Sans bold or similar) — the editorial gloss, not a recreation of the
   * page's own typography.
   */
  headlineText: z.string(),
  /**
   * Optional sub-deck (the secondary line below the main headline). Typeset
   * in italic serif, smaller than headline.
   */
  deck: z.string().optional(),
  /**
   * Dateline — city + date in small caps. E.g., "BERLIN · NOV 11 1918".
   * Renders in mono small-caps strip.
   */
  dateline: z.string(),
  /**
   * Publication name (fallback if not visible in the masthead crop). Most
   * cropped mastheads include the nameplate, so this is usually redundant
   * but available for sources that don't.
   */
  publicationName: z.string().optional(),
  /**
   * Optional reveal-time override in seconds. Default: sequential — each
   * headline appears at (i × holdSec) from clip start.
   */
  appearAtSec: z.union([z.literal("auto"), z.number().nonnegative()]).optional(),
});

// ── Top-level data ─────────────────────────────────────────────────────────

export const NewspaperHeadlineRotatorDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /** Title overlay. Often "WORLD HEADLINES, NOV 11 1918" or similar. */
  title: z.string().optional(),
  /** Subtitle. */
  subtitle: z.string().optional(),
  /** Total clip duration in seconds. Default 16s. */
  durationSec: z.number().positive().optional(),
  /** Archive citation summary, shown bottom-right. */
  source: z.string(),

  /**
   * The headlines, ordered. Min 2 (rotation needs at least 2); max ~6
   * (more than 6 reads as a montage, not a rotator).
   */
  headlines: z.array(NewspaperHeadlineSchema).min(2).max(6),

  /**
   * Reveal pattern.
   *   • "stack-shift"     — new page enters from right, previous shrinks
   *                         and shifts left (The Pudding idiom)
   *   • "crossfade-scale" — previous fades + scales down, new fades + scales
   *                         up from below (FT idiom)
   *   • "cut"             — hard cut, no transition (newsreel idiom)
   *
   * Default "crossfade-scale".
   */
  transition: z.enum(["stack-shift", "crossfade-scale", "cut"]).optional(),
  /**
   * Per-page hold duration in seconds. The total clip length should be
   * roughly `headlines.length × holdSec` + transitions. Default 3s.
   */
  holdSec: z.number().positive().optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const NewspaperHeadlineRotatorSchema = z.object({
  data: NewspaperHeadlineRotatorDataSchema,
});

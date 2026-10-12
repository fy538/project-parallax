/**
 * Zod schema for Syllogism template.
 *
 * Renders a three-line formal deductive argument:
 *   1. Major Premise (general claim)
 *   2. Minor Premise (specific claim)
 *   3. ∴ Conclusion (follows from 1+2)
 *
 * The brand mark (∴) IS the logical hinge — Parallax's brand glyph
 * doubles as visual structure. When `validity: "fallacy"`, the ∴ renders
 * struck-through (the editorial signal that the conclusion DOESN'T follow).
 *
 * Editorial use case: when the argument structure itself is the point.
 * "All sovereign powers fear loss of sovereignty / Russia is a sovereign
 * power / ∴ Russia fears loss of sovereignty" — laying out the deductive
 * skeleton makes the assumption explicit and audit-able.
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — Syllogism entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const SyllogismDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /** Optional title overlay ("THE STRUCTURAL ARGUMENT"). */
  title: z.string().optional(),
  /** Optional subtitle. */
  subtitle: z.string().optional(),
  /** Source attribution. */
  source: z.string().optional(),
  /** Total duration in seconds. Default 10s. */
  durationSec: z.number().positive().optional(),

  /**
   * Major premise — the general claim. Typically begins with a universal
   * quantifier ("All sovereign powers…", "Empires that overstretch…",
   * "Whenever a leader feels…"). Kept ≤ 18 words.
   */
  majorPremise: z.string(),
  /**
   * Minor premise — the specific instance. Usually a particular case
   * ("Russia is a sovereign power", "The US has overstretched").
   * Kept ≤ 14 words.
   */
  minorPremise: z.string(),
  /**
   * Conclusion — what follows from premises 1 and 2. Rendered with the
   * brand mark (∴) prefix. Kept ≤ 18 words.
   */
  conclusion: z.string(),

  /**
   * Validity register:
   *   • "valid"   — the conclusion follows; ∴ renders normally (default)
   *   • "fallacy" — the conclusion DOESN'T follow; ∴ renders struck-through
   *                 in accent color. Use when the editorial point is to
   *                 expose a flaw in someone else's syllogism.
   */
  validity: z.enum(["valid", "fallacy"]).optional(),
  /**
   * Optional fallacy name when `validity: "fallacy"`. Rendered as a small
   * editorial annotation beneath the struck conclusion ("Affirming the
   * consequent", "Undistributed middle", "Hasty generalization").
   */
  fallacyType: z.string().optional(),

  /** Optional attribution for the argument (e.g., "Mearsheimer 2014"). */
  argumentAttribution: z.string().optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const SyllogismSchema = z.object({
  data: SyllogismDataSchema,
});

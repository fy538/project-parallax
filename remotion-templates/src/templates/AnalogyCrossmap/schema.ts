/**
 * Zod schema for AnalogyCrossmap template.
 *
 * Visualizes the structural mapping between two domains in a bounded analogy —
 * the core editorial move of the Parallax channel. Two columns (source domain
 * and target domain) connected by curved SVG paths. Some connections are
 * "useful" (solid gold), others reveal WHERE THE ANALOGY BREAKS (dashed/muted,
 * following the COUNTERFACTUAL REGISTER from project/COUNTERFACTUAL_REGISTER.md).
 *
 * The editorial revelation moment is when break connections appear and are
 * labeled — this is the "bounded analogy" form that differentiates Parallax.
 *
 * Example: Prisoner's Dilemma ↔ Nuclear Deterrence
 *   "mutual defection" → "mutual strike" (strong — holds)
 *   "one-shot game" → "indefinitely repeated game" (break — doesn't hold)
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — Argument Primitives § AnalogyCrossmap
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const AnalogyCrossmapDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /** Optional title overlay. */
  title: z.string().optional(),
  /** Optional subtitle. */
  subtitle: z.string().optional(),
  /** Source attribution. */
  source: z.string().optional(),
  /** Total duration in seconds. Default 12s. */
  durationSec: z.number().positive().optional(),

  /** Source (left) domain label and optional subtitle. */
  sourceDomain: z.object({
    /** Primary domain label, e.g. "PRISONER'S DILEMMA". */
    label: z.string(),
    /** Optional context gloss, e.g. "Formal game theory". */
    subtitle: z.string().optional(),
  }),
  /** Target (right) domain label and optional subtitle. */
  targetDomain: z.object({
    /** Primary domain label, e.g. "NUCLEAR DETERRENCE". */
    label: z.string(),
    /** Optional context gloss, e.g. "Cold War doctrine". */
    subtitle: z.string().optional(),
  }),

  /**
   * Source domain elements listed top-to-bottom.
   * Their vertical order determines path anchor positions.
   */
  sourceElements: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        description: z.string().optional(),
      }),
    )
    .min(2),

  /**
   * Target domain elements listed top-to-bottom.
   * Their vertical order determines path anchor positions.
   */
  targetElements: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        description: z.string().optional(),
      }),
    )
    .min(2),

  /**
   * Structural mappings between source and target elements.
   *
   * Strength determines visual register:
   *   "strong" — solid palette.gold 2.5px (analogy holds, default)
   *   "weak"   — thin palette.umber dashed 8/4 (partial mapping, use sparingly)
   *   "break"  — palette.taupe dashed 12/6 at 45% opacity
   *              (COUNTERFACTUAL REGISTER — where the analogy fails)
   *
   * Break connections reveal AFTER strong/weak ones — this is the editorial
   * revelation moment, the "bounded analogy" move. Any connection without an
   * explicit revealAtSec gets auto-staggered within its phase.
   */
  mappings: z
    .array(
      z.object({
        sourceId: z.string(),
        targetId: z.string(),
        /**
         * Visual register for this connection.
         * Default "strong" (gold, solid line — analogy holds).
         */
        strength: z.enum(["strong", "weak", "break"]).optional(),
        /**
         * Optional path annotation label, e.g. "MAPS TO" or "BREAKS HERE".
         * Rendered as a small mono-caps badge at path midpoint.
         */
        label: z.string().optional(),
        /**
         * Explicit reveal time in seconds from composition start.
         * When omitted, auto-staggered within the appropriate phase
         * (strong/weak phase at t≈2.8s; break phase at t≈4.5s).
         */
        revealAtSec: z.number().nonnegative().optional(),
      }),
    )
    .min(1),

  /**
   * Optional editorial callout naming where the analogy breaks.
   * Rendered in a highlighted box below the diagram after break paths appear.
   * The "bounded analogy" editorial signpost.
   *
   * Example: "The analogy breaks at repeated-game dynamics — nuclear
   * deterrence is indefinitely iterated; the prisoner's dilemma is one-shot."
   */
  breakNote: z.string().optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block (camera, hold, atmosphere, pace, sync). */
  _direction: DirectionBlockSchema.optional(),
});

export const AnalogyCrossmapSchema = z.object({
  data: AnalogyCrossmapDataSchema,
});

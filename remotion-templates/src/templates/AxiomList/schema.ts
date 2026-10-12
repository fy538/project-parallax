/**
 * Zod schema for AxiomList template.
 *
 * Numbered foundational claims — the "here are the N assumptions this
 * analysis rests on" form. Used at the start of long analyses to lay
 * groundwork, or as a structural recap of a worldview's pillars.
 *
 * References:
 *   • Euclid's Elements (the canonical numbered-proposition form)
 *   • Spinoza's Ethics (axioms + propositions + scholia)
 *   • Wittgenstein's Tractatus (numbered propositions with decimal indent)
 *   • Realist IR: "the four assumptions of structural realism" form
 *
 * Editorial register: stable, formal, deliberate. The axioms are
 * presented as foundational — the viewer should be ABLE to dispute them,
 * not asked to accept them as obvious.
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — AxiomList entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Axiom ──────────────────────────────────────────────────────────────────

export const AxiomSchema = z.object({
  /** The axiom text. Keep ≤ 22 words — these are headlined claims. */
  text: z.string(),
  /**
   * Optional gloss — italic serif annotation below the axiom. Used to
   * cite the originator ("Waltz 1979") or note a known disputation
   * ("Disputed by constructivists").
   */
  gloss: z.string().optional(),
  /**
   * Emphasis tier:
   *   • "key"      — accent left-rail + heavier weight (max 1 per list)
   *   • "disputed" — italic struck-through (when listing axioms a school
   *                  rejects)
   *   • "normal"   — default
   */
  emphasis: z.enum(["key", "disputed", "normal"]).optional(),
  /**
   * When this row appears, in seconds from the start of the card. Use it to
   * land each row on the sentence that speaks it. Rows without it fall back
   * to the even `staggerSec` cadence.
   */
  atSec: z.number().min(0).optional(),
});

// ── Top-level data ─────────────────────────────────────────────────────────

export const AxiomListDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /** Optional title overlay ("THE FOUR AXIOMS OF CONTAINMENT"). */
  title: z.string().optional(),
  /** Optional subtitle. */
  subtitle: z.string().optional(),
  /** Source / attribution. */
  source: z.string().optional(),
  /** Total duration in seconds. Default 14s. */
  durationSec: z.number().positive().optional(),

  /**
   * The axioms, in order. Min 2, max 7 (any more and the form becomes a
   * list, not an axiom system).
   */
  axioms: z.array(AxiomSchema).min(2).max(7),

  /**
   * Optional framing line displayed above the list — the "Here are the N
   * axioms of X" intro. E.g., "Containment doctrine rests on four claims:"
   */
  framing: z.string().optional(),
  /** Seconds between row reveals. Default 0.55; raise it to land each row as the narrator reaches it. */
  staggerSec: z.number().positive().optional(),

  /**
   * Numeral style:
   *   • "arabic"     — 1. 2. 3. (default)
   *   • "roman"      — I. II. III.
   *   • "lower-roman"— i. ii. iii.
   *   • "decimal"    — 1.1, 1.2 (Wittgensteinian — pair with `decimalRoot`)
   */
  numbering: z.enum(["arabic", "roman", "lower-roman", "decimal"]).optional(),
  /**
   * Decimal root for "decimal" numbering. Default 1. So axioms render as
   * `{root}.1`, `{root}.2`, etc. — Wittgenstein's Tractatus style.
   */
  decimalRoot: z.number().int().positive().optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const AxiomListSchema = z.object({
  data: AxiomListDataSchema,
});

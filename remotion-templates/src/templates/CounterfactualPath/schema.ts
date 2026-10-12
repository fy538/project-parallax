/**
 * Zod schema for CounterfactualPath template.
 *
 * "What if?" — horizontal timeline showing the actual historical path
 * + 1-2 counterfactual branches diverging at a named decision point.
 *
 * Visual: a horizontal line runs left-to-right. At the `branchYear` it
 * splits into the actual path (solid gold, continues forward) and the
 * counterfactuals (dashed muted lines branching above and/or below).
 * Each path terminates with an outcome label.
 *
 * Editorial use case: "What if Khrushchev had ordered the invasion?"
 * "What if Eisenhower had intervened at Dien Bien Phu?" "What if Lenin
 * had died before October 1917?" The form makes counterfactual reasoning
 * structurally legible — the divergence point, the alternative paths,
 * the comparative outcomes.
 *
 * Reference: Niall Ferguson, *Virtual History* (1997); Geoffrey Hawthorn,
 * *Plausible Worlds* (1991). Both establish counterfactual history as a
 * disciplined form, not idle speculation.
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — CounterfactualPath entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Branch ─────────────────────────────────────────────────────────────────

export const CounterfactualBranchSchema = z.object({
  /** Branch label — short noun phrase ("Soviet intervention", "Détente"). */
  label: z.string(),
  /** The outcome at the end of this branch. Keep ≤ 16 words. */
  outcome: z.string(),
  /**
   * Direction the branch arcs from the decision point:
   *   • "up"   — arcs upward (default for first counterfactual)
   *   • "down" — arcs downward (use for second counterfactual)
   */
  direction: z.enum(["up", "down"]).optional(),
  /**
   * Optional probability gloss — how plausible was this counterfactual?
   * Used to discipline counterfactual reasoning (Hawthorn's "plausibility
   * test"). "Highly plausible", "Marginal", "Unlikely given known facts".
   */
  plausibility: z.string().optional(),
});

// ── Top-level data ─────────────────────────────────────────────────────────

export const CounterfactualPathDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /** Optional title overlay. */
  title: z.string().optional(),
  /** Optional subtitle. */
  subtitle: z.string().optional(),
  /** Source attribution. */
  source: z.string().optional(),
  /** Total duration in seconds. Default 14s. */
  durationSec: z.number().positive().optional(),

  /**
   * The year (or short label) at the branching point. Renders as a
   * vertical marker on the timeline. Use "1962" or "OCT 1962" — not a
   * full date.
   */
  branchYear: z.union([z.number(), z.string()]),
  /**
   * The event at the branching point. Short noun phrase — "Cuban Missile
   * Crisis", "Munich Agreement", "Bay of Pigs".
   */
  branchEvent: z.string(),

  /**
   * The actual historical path that was taken. Outcome describes the
   * downstream consequence. The path renders in solid gold (or accent).
   */
  actual: z.object({
    label: z.string(),
    outcome: z.string(),
  }),

  /**
   * The counterfactual branches — 1 or 2. Render as dashed muted lines
   * branching above/below the actual path. Each terminates with its own
   * outcome label.
   */
  counterfactuals: z.array(CounterfactualBranchSchema).min(1).max(2),

  /**
   * Optional pre-branch context label, shown on the left of the timeline
   * before the divergence point ("Pre-crisis trajectory: stable").
   */
  preBranchLabel: z.string().optional(),
  /**
   * Optional caption beneath the entire diagram, framing the
   * counterfactual claim. Ferguson-style discipline: name the
   * plausibility test you're applying.
   */
  caption: z.string().optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const CounterfactualPathSchema = z.object({
  data: CounterfactualPathDataSchema,
});

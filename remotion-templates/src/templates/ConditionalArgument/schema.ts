/**
 * Zod schema for ConditionalArgument template.
 *
 * "If X, then Y; if not-X, then Z" — binary conditional branching.
 *
 * Visual: condition statement top-centered, two branches below
 * (left=if-true, right=if-false) with explicit logical operators
 * (✓ and ✗) and consequence text.
 *
 * Distinct from:
 *   • DecisionTree   — hierarchical N-way branching with probabilities
 *   • ComparisonPair — general comparison of two visualisations
 *   • DialecticFlow  — Hegelian thesis/antithesis/synthesis (3 panels)
 *
 * Editorial use case: scenario forecasts where the future bifurcates on
 * a single uncertain variable. "If China invades Taiwan → credibility
 * test. If China blockades → deterrence test."
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — ConditionalArgument entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Branch ─────────────────────────────────────────────────────────────────

export const ConditionalBranchSchema = z.object({
  /** Short label for the branch ("Invasion", "Blockade", "Status quo"). */
  label: z.string(),
  /** The consequence text — what happens if this branch is taken. */
  consequence: z.string(),
  /** Optional hero figure shown large above the consequence (e.g. "14%"). */
  stat: z.string().optional(),
  /**
   * When this branch's figure and consequence appear, in seconds from the
   * start of the card. Defaults to the branch reveal. Set it so a number
   * lands as the narrator says it, not when the branch label first shows.
   */
  statAtSec: z.number().nonnegative().optional(),
  /**
   * Severity tier — drives colour intensity of the branch arrow/marker:
   *   • "low"      — dustblue (cool, manageable)
   *   • "medium"   — gold (default — significant but containable)
   *   • "high"     — china (warning red — major consequence)
   *   • "critical" — china + bold + underline (existential / catastrophic)
   */
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  /** Optional probability gloss ("~30% per analyst consensus"). */
  probabilityGloss: z.string().optional(),
});

// ── Top-level data ─────────────────────────────────────────────────────────

export const ConditionalArgumentDataSchema = z.object({
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

  /**
   * The IF condition statement (the uncertain variable). Rendered top-centre
   * in display face with "IF" prefix. Keep ≤ 18 words.
   */
  condition: z.string(),
  /** When the IF line appears (seconds). Default 0.4. */
  conditionAtSec: z.number().nonnegative().optional(),
  /**
   * When the two branch panels appear (seconds). Default 3.6. The pivot mark
   * and the arrows lead it by 1.6s and 0.8s, as in the default timing.
   */
  branchesAtSec: z.number().nonnegative().optional(),

  /** The "if true" branch (left). */
  ifTrue: ConditionalBranchSchema,
  /** The "if false" branch (right). */
  ifFalse: ConditionalBranchSchema,

  /**
   * Optional determinant — a small footnote explaining what would trigger
   * one branch over the other. Renders below both branches in italic serif.
   */
  determinant: z.string().optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const ConditionalArgumentSchema = z.object({
  data: ConditionalArgumentDataSchema,
});

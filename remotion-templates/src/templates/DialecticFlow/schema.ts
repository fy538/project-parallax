/**
 * Zod schema for DialecticFlow template.
 *
 * Hegelian thesis → antithesis → synthesis. The dynamic structure of
 * contradictory claims producing a higher-order resolution. Used to
 * show how arguments evolve through dialectical tension.
 *
 * Visual register: T top-left, A top-right, tension marker between them,
 * S below-center with convergence arrows. Distinct from ConditionalArgument
 * (which is binary if/then) — DialecticFlow is specifically Hegelian
 * (contradiction → resolution at higher level).
 *
 * Editorial use case: arguments that resolve contradictions, not just
 * comparisons. "Free trade benefits all (T). Free trade harms domestic
 * producers (A). Managed trade with strategic protection (S)."
 *
 * Reference: Hegel's Phenomenology of Spirit, Adorno's Negative Dialectics,
 * Marx's Capital (commodity → labor-power → surplus-value).
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — DialecticFlow entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Panel ──────────────────────────────────────────────────────────────────

export const DialecticPanelSchema = z.object({
  /** Panel label — short noun phrase ("Sovereignty", "Globalism"). */
  label: z.string(),
  /** Body — the claim itself. Keep ≤ 24 words. */
  body: z.string(),
  /** Optional attribution ("Hobbes", "Locke"). */
  attribution: z.string().optional(),
});

// ── Top-level data ─────────────────────────────────────────────────────────

export const DialecticFlowDataSchema = z.object({
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

  /** Thesis — the initial claim. */
  thesis: DialecticPanelSchema,
  /** Antithesis — the contradicting claim. */
  antithesis: DialecticPanelSchema,
  /** Synthesis — the higher-order resolution. */
  synthesis: DialecticPanelSchema,

  /**
   * Optional tension label rendered between thesis and antithesis. E.g.,
   * "Contradiction", "Aporia", "Paradox". Default "Contradiction".
   */
  tensionLabel: z.string().optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const DialecticFlowSchema = z.object({
  data: DialecticFlowDataSchema,
});

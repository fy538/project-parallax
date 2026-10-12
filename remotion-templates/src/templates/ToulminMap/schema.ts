/**
 * Zod schema for ToulminMap template.
 *
 * Visualizes Stephen Toulmin's argument structure from "The Uses of Argument"
 * (1958). The canonical six-element model: Data, Claim, Warrant, Backing,
 * Qualifier, Rebuttal.
 *
 * Editorial power: making the WARRANT visible is the core editorial
 * contribution. Arguments that seem airtight often have unexamined warrants.
 * Parallax's geopolitical arguments benefit from explicit warrant examination.
 *
 * Layout: horizontal argument flow (Data → Warrant → Claim) with subordinate
 * elements branching below (Backing, Qualifier, Rebuttal).
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — ToulminMap entry (Argument Primitives).
 * Reference: Toulmin, S. (1958). The Uses of Argument. Cambridge University Press.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const ToulminMapDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /** Optional title overlay. */
  title: z.string().optional(),
  /** Optional subtitle. */
  subtitle: z.string().optional(),
  /** Source attribution. */
  source: z.string().optional(),
  /** Total duration in seconds. Default 14s (sequential reveal needs time to breathe). */
  durationSec: z.number().positive().optional(),

  /**
   * DATA (grounds/evidence) — one or more factual grounding items.
   * These are the raw evidence that initiates the argument.
   * Keep each item ≤ 20 words. Minimum 1 item.
   */
  data: z.array(
    z.object({
      text: z.string(),
      /** Optional citation. E.g., "TSMC Annual Report 2024". */
      attribution: z.string().optional(),
    })
  ).min(1),

  /**
   * CLAIM — the conclusion being argued.
   * What the argument is trying to establish.
   * Keep ≤ 20 words.
   */
  claim: z.object({
    text: z.string(),
    /**
     * If true, render claim in gold accent background — signal that this
     * is the editorial thesis of the segment.
     */
    emphasis: z.boolean().optional(),
  }),

  /**
   * WARRANT — the logical bridge connecting data to claim.
   * The unstated assumption made explicit. This is the editorial focal point —
   * the element that makes ToulminMap different from a simple data→conclusion slide.
   * Keep ≤ 25 words.
   */
  warrant: z.object({
    text: z.string(),
    /** Label override. Default "WARRANT". */
    label: z.string().optional(),
  }),

  /**
   * BACKING (optional) — evidence or authority that supports the warrant itself.
   * Warrants can themselves be grounded; backing provides that grounding.
   * E.g., historical precedent, expert consensus, formal theory.
   */
  backing: z
    .object({
      text: z.string(),
      /** Label override. Default "BACKING". */
      label: z.string().optional(),
    })
    .optional(),

  /**
   * QUALIFIER (optional) — degree of certainty with which the claim is held.
   * Toulmin's modal operators: "probably", "necessarily", "in most cases",
   * "as long as", "presumably". Makes epistemic status explicit.
   */
  qualifier: z
    .object({
      text: z.string(),
      /** Label override. Default "QUALIFIER". */
      label: z.string().optional(),
    })
    .optional(),

  /**
   * REBUTTAL (optional) — conditions under which the warrant does NOT hold.
   * Toulmin's classic form: "UNLESS X". Making the rebuttal explicit is
   * Parallax's "bounded analogy" move applied to formal argument structure.
   */
  rebuttal: z
    .object({
      text: z.string(),
      /**
       * Prefix for the rebuttal. Defaults to "UNLESS" (Toulmin canonical).
       * Can override to "EXCEPT WHEN", "BUT IF", etc.
       */
      prefix: z.string().optional(),
    })
    .optional(),

  /**
   * Reveal mode:
   * - "sequential" (default): elements reveal in Toulmin's logical order —
   *   Data → Warrant → Claim → Backing → Qualifier → Rebuttal.
   *   Use for analytical segments where the argument is being built step by step.
   * - "simultaneous": all elements appear at once. Use for dense editorial
   *   segments where the full argument map is the reference, not the reveal.
   */
  revealMode: z.enum(["sequential", "simultaneous"]).optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const ToulminMapSchema = z.object({
  data: ToulminMapDataSchema,
});

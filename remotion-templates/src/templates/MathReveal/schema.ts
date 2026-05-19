/**
 * Zod schema for the MathReveal template — full-screen single-equation
 * reveal. Phase 1 of the math-rendering register.
 *
 * Spreads `compositionBase` for the editorial-shell fields (episode,
 * title, subtitle, source, durationSec, backgroundVariant, _direction)
 * + the template-specific math fields.
 */

import { z } from "zod";
import { compositionBase, holdAfterRevealSec } from "../_shared/compositionBase";

export const MathRevealDataSchema = z.object({
  ...compositionBase,
  holdAfterRevealSec,

  // ── template-specific fields ──

  /**
   * LaTeX formula source. Plain TeX — KaTeX dialect. Use double backslashes
   * in JSON strings (so `\\mathbb{E}` in the file → `\mathbb{E}` to KaTeX).
   * The composition's centerpiece. Phase 2 will accept an array of
   * `steps` for derivation chains; v1 takes a single formula.
   */
  formula: z.string().min(1).describe(
    "LaTeX source for the equation. KaTeX dialect; see katex.org/docs/supported.html.",
  ),

  /**
   * Display mode controls KaTeX layout: `display` gives the centered,
   * larger-operator render typical for hero equations; inline gives the
   * tighter inline-text render. Default `display`.
   */
  display: z.boolean().optional().describe(
    "True (default) = displaystyle (centered, larger operators). False = inline.",
  ),

  /**
   * Reveal duration in seconds — the left-to-right sweep. Defaults to 1.2s.
   * Pair with `holdAfterRevealSec` for the post-reveal pause before exit fade.
   */
  revealSec: z.number().positive().optional().describe(
    "Seconds for the left-to-right reveal sweep. Default 1.2.",
  ),

  /**
   * Pixel font size at the KaTeX root. Default 72 for the hero math feel.
   * Subscripts/superscripts/fractions scale relative to this.
   */
  fontSize: z.number().positive().optional().describe(
    "Pixel font size at KaTeX root. Default 72 (hero-display). Inline math is typically 28-36.",
  ),

  /**
   * Optional caption shown below the equation in IBM Plex Mono — translates
   * the math into prose. Pairs with the bounded-equation editorial pattern.
   */
  caption: z.string().optional().describe(
    "Plain-language caption shown below the equation. Use to gloss notation or call out the editorial claim.",
  ),
});

export const MathRevealSchema = z.object({
  data: MathRevealDataSchema,
});

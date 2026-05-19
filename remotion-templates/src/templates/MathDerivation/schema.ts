/**
 * Zod schema for MathDerivation — multi-step derivation chain.
 *
 * One step = one formula + how long it holds + an optional annotation.
 * The template's overall duration is computed from the sum of holdSecs
 * (via `crossfadeDurationFrames`) — authors don't pass `durationSec`.
 */

import { z } from "zod";
import { compositionBase } from "../_shared/compositionBase";

export const MathStepSchema = z.object({
  /**
   * LaTeX source for this step. KaTeX dialect. Use `\textcolor{HEX}{...}`
   * for term-highlighting; brand color hexes are documented in
   * `MathCrossfade.tsx`'s header. For substitution, write a sibling step
   * with the variable replaced by its numeric value in the source.
   */
  formula: z.string().min(1),

  /**
   * Seconds this step holds at full opacity before crossfading to the
   * next. The final step's holdSec covers the dwell before the parent's
   * exit fade. Typical: 2.0–3.5s — long enough to read but not stall.
   */
  holdSec: z.number().positive().describe(
    "Seconds this step holds at full opacity before crossfading to the next.",
  ),

  /**
   * Optional plain-language gloss shown below the equation. Same Plex
   * Mono register as captions; translates notation into prose. Authors:
   * keep these short (one breath of narration) — sayability matters.
   */
  annotation: z.string().optional(),
});

export const MathDerivationDataSchema = z.object({
  // Drop `durationSec` from compositionBase — MathDerivation derives its
  // own duration from sum(holdSec). Pass the rest of the editorial shell.
  episode: compositionBase.episode,
  title: compositionBase.title,
  subtitle: compositionBase.subtitle,
  source: compositionBase.source,
  backgroundVariant: compositionBase.backgroundVariant,
  _direction: compositionBase._direction,

  // ── template-specific fields ──
  steps: z.array(MathStepSchema).min(1).describe(
    "Ordered derivation steps. Each step crossfades to the next.",
  ),

  /** Crossfade duration in seconds between adjacent steps. Default 0.5. */
  crossfadeSec: z.number().min(0).max(2).optional(),

  /** Font size in px at the KaTeX root. Default 56. */
  fontSize: z.number().positive().optional(),

  /** Display mode (centered, larger operators). Default true. */
  display: z.boolean().optional(),

  /** Show the "Step N of M" counter at the top. Default true. */
  showStepCounter: z.boolean().optional(),
});

export const MathDerivationSchema = z.object({
  data: MathDerivationDataSchema,
});

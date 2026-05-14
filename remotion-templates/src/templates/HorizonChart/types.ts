/**
 * HorizonChart template types.
 *
 * Tufte's compressed horizon-chart form. Each series occupies a thin
 * strip; the strip's vertical extent is split into N "bands" of equal
 * value range, with each band drawn at progressively higher color
 * intensity. Negative values are folded back ABOVE the baseline using
 * a contrasting hue, so a series with values that swing ±range still
 * fits inside a constant-height strip.
 *
 * ── When to use this template ─────────────────────────────────────────
 *
 * USE for:
 *   - Many parallel time-series compared at a glance (10+ series)
 *   - Volatility indices, FX baskets, commodity baskets, yield-curve
 *     deltas, polling residuals — the Bloomberg / FT canonical idiom
 *   - Stories where the QUESTION is "which series spiked when?" rather
 *     than "what is the exact value?"
 *
 * DO NOT USE when:
 *   - You have ≤ 3 series — use TimeSeriesChart (the values matter)
 *   - The exact value at each point is the editorial argument — horizon
 *     charts trade precision for density on purpose
 *   - The series share a baseline of 0 trivially and the dynamic range
 *     is similar across all of them — TimeSeriesChart with `areaFill`
 *     is the cleaner read
 *
 * ── Visual form ──────────────────────────────────────────────────────
 *
 * Each series is independently auto-scaled to its own ±range, then
 * sliced into `bands` (default 3) horizontal value-bands. Positive
 * bands stack from the baseline upward in `positiveColor`; negative
 * bands are flipped (folded) above the baseline in `negativeColor`.
 * Band 1 is lightest, band `bands` is darkest. This is the standard
 * Tufte/Few/Heer horizon construction — the eye reads color intensity
 * as "how far this series has departed from baseline."
 *
 * Editorial precedents: Bloomberg Terminal volatility panels, Stephen
 * Few's "Time on the Horizon" (2008), FT Markets dashboards.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

/** One observation in a series. */
export interface HorizonDatum {
  /** X-axis position (e.g., day index, week number, timestamp). */
  x: number;
  /** The value at this x. Can be negative — the chart folds it. */
  value: number;
}

export interface HorizonSeries {
  /** Stable id for this series (used for keying and label lookup). */
  id: string;
  /** Primary label rendered to the left of the strip. */
  label: string;
  /** Optional secondary label under the primary (e.g., ticker, region). */
  sublabel?: string;
  /**
   * Color override — palette token or hex. When set, this overrides
   * BOTH positive and negative coloring for this single strip. Use
   * sparingly — uniform palette across strips is the canonical form.
   */
  color?: string;
  /** Observations, ordered by x. */
  values: HorizonDatum[];
}

export type HorizonValueFormat = "number" | "percent" | "currency";

/**
 * Per-strip vs shared band scaling.
 *
 * - `"per-series"` (default, Tufte canon): each strip auto-scales to its
 *   OWN `max(|value − baseline|)`. Every strip uses its full vertical
 *   extent, so the eye reads *shape coincidence* across rows — a market-
 *   wide event becomes a vertical column of dark intensity. This is the
 *   form Tufte/Few/Heer codified and Bloomberg/FT ship. Use when the
 *   editorial question is "WHICH series spiked WHEN?".
 *
 * - `"shared"`: a SINGLE global `max(|value − baseline|)` is computed
 *   across every series and used to derive one `bandHeight` for the whole
 *   chart. Series with a smaller actual range now render as a smaller
 *   wave inside their strip; series with a larger range fill more of it.
 *   The trade-off Tufte's canonical form makes — per-strip auto-scaling
 *   hides absolute magnitude differences — is reversed. Use when the
 *   editorial argument *is* the magnitude difference itself ("RUB and IRR
 *   swing 5–10× more than CNY"). Reference: Few & Heer, "Time on the
 *   Horizon" (2009) § comparing across series.
 */
export type HorizonScaleMode = "per-series" | "shared";

export interface HorizonChartData {
  episode: string;
  title: string;
  subtitle?: string;

  /** The series to render, in editorial order (top → bottom). */
  series: HorizonSeries[];

  /** Optional axis label rendered under the x-axis ticks. */
  xAxisLabel?: string;

  /**
   * Value format for any displayed numeric chrome (axis ticks, hovers).
   * Default `"number"`. Horizon charts deliberately suppress per-point
   * values — this only affects axis decoration and tooltips.
   */
  valueFormat?: HorizonValueFormat;

  /**
   * Color used for POSITIVE bands (light → dark stack). Palette token
   * or hex. Default: `palette.gold` (amber) — the channel's "above
   * baseline" warm hue.
   */
  positiveColor?: string;

  /**
   * Color used for NEGATIVE bands (folded above the baseline). Default:
   * `semantic.china` (rust) — the channel's contrast hue.
   */
  negativeColor?: string;

  /**
   * Number of value-bands per side. Tufte's canonical default is 3;
   * 2 and 4 are sometimes used. Higher = finer color discrimination
   * but more visual noise. Clamped to [1, 5] at render time.
   */
  bands?: number;

  /**
   * The baseline value against which positive/negative is measured.
   * Default 0. For series with a natural non-zero centre (e.g., a
   * fixed peg rate, an inflation target), set this so deviations are
   * coloured correctly.
   */
  baseline?: number;

  /**
   * How band height is computed across series. Default `"per-series"`
   * (Tufte canon — every strip uses its full height, optimised for
   * coincidence detection). Set to `"shared"` when the magnitude
   * difference between series is the editorial argument and per-strip
   * auto-scaling would flatten it. See {@link HorizonScaleMode}.
   */
  scaleMode?: HorizonScaleMode;

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

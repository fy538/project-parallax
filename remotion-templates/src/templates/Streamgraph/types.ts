/**
 * Streamgraph template types.
 *
 * A stacked area chart with a CENTERED baseline (silhouette offset) so the
 * total composition flows as a "river" rather than rising from a zero axis.
 * The editorial form for "X composition shifted over decades" stories where
 * the question is which constituent went up / down / vanished, not the raw
 * total. Canonical NYT / Pudding form (oil import sources, immigration
 * origin countries, currency reserve composition, alliance memberships).
 *
 * ── When to use this template ────────────────────────────────────────────
 *
 * USE for:
 *   - Categorical composition shifts over time (5–8 series)
 *   - Stories where relative-share movement is the editorial point
 *   - Long time horizons (decades) where individual lines would tangle
 *   - "The Saudi era yields to the neighbors" / "old majority becomes minority"
 *
 * DO NOT USE when:
 *   - Total magnitude matters more than composition (use stacked-bar / line)
 *   - There are >10 series (collapses to noise; bucket smaller series into "Other")
 *   - One series so dominates that the others read as a flat baseline
 *
 * ── Visual form ──────────────────────────────────────────────────────────
 *
 * Each series is a filled SVG path whose top and bottom edges are smooth
 * (monotone-cubic interpolated) curves. The vertical offset of each band
 * at each x-position is determined by the chosen stacking offset
 * ("silhouette" = symmetric around midline; "wiggle" = minimum-slope-sum
 * baseline; "zero" = standard stacked area). Labels sit on top of the
 * band at the x where that series is widest. No legend.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface StreamPoint {
  /** Numeric x-position (year, time index). Series must share the same x grid. */
  x: number;
  /** Non-negative magnitude at this x-position. */
  value: number;
}

export interface StreamSeries {
  id: string;
  label: string;
  /**
   * Fill color. Hex, "accent" brand token, or any palette token.
   * Defaults to a categorical ramp slot.
   */
  color?: string;
  values: StreamPoint[];
}

export type StreamOffset = "silhouette" | "wiggle" | "zero";

export type StreamValueFormat = "number" | "percent" | "currency";

export interface StreamgraphData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Series stacked bottom-up in array order. */
  series: StreamSeries[];

  /** X-axis tick label (e.g., "Year"). Optional. */
  xAxisLabel?: string;
  /**
   * Y-axis label. Optional — streamgraph y-values are relative, so the
   * y-axis is suppressed by default; this label appears in small caps
   * near the top-left if set.
   */
  yAxisLabel?: string;

  /**
   * How total values are formatted in (rare) value tooltips / annotations.
   * Default `"number"`.
   */
  valueFormat?: StreamValueFormat;

  /**
   * Stacking offset. Default `"silhouette"` (centered on the midline —
   * the canonical NYT streamgraph look).
   *   - `"silhouette"` symmetric around midline
   *   - `"wiggle"` minimum slope-sum baseline (Byron & Wattenberg 2008)
   *   - `"zero"` standard stacked area from the bottom up
   */
  offset?: StreamOffset;

  /**
   * Auto-aggregate small series into a single "Other" band when the input
   * has more series than reads cleanly. When set, the template ranks
   * series by total area (sum of `value` across all x-columns), keeps the
   * top `maxSeries - 1` as named bands, and sums the remainder column-
   * by-column into one rolled-up series placed at the BOTTOM of the
   * stack (so the named series read in rank order above it).
   *
   * Unset → no aggregation, all series render verbatim (back-compat).
   */
  aggregateOther?: {
    /** Maximum number of named series to show. Smaller series rolled into "Other". Default: 6 */
    maxSeries?: number;
    /** Label for the rolled-up band. Default: "Other" */
    otherLabel?: string;
    /** Color for the rolled-up band. Default: palette.bone */
    otherColor?: string;
  };

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
  _direction?: DirectionBlock;
}

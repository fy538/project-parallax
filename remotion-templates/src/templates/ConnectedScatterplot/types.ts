/**
 * ConnectedScatterplot template types.
 *
 * Two-variable scatter where points are connected in temporal order by a
 * line and labeled at decision-pivot positions, with an arrowhead at the
 * most recent point.
 *
 * ── When to use this template ─────────────────────────────────────────
 *
 * USE for:
 *   - Phillips curve (unemployment × inflation across decades)
 *   - GDP per capita × CO₂ emissions over time
 *   - Inflation × interest rate path
 *   - Any "two macro indicators evolving together" story where the
 *     EDITORIAL POINT is the shape of the trajectory — loops, reversals,
 *     regime breaks — not the level of either variable
 *
 * DO NOT USE when:
 *   - You only have one variable over time (use TimeSeriesChart)
 *   - The two variables aren't time-indexed (use DataChart scatter)
 *   - The point is single-snapshot correlation, not trajectory (use
 *     DataChart scatter with a trend line)
 *
 * ── Visual form ──────────────────────────────────────────────────────
 *
 * Full XY axes with nice round ticks. Each year's observation is a small
 * disc; consecutive years are connected by a smooth curve. Highlighted
 * pivot years get a larger amber disc and a year label with a short
 * leader line. The most recent point ends in a small arrowhead pointing
 * along the trajectory tangent — "this is where we are now."
 *
 * Editorial precedents: FT Visual Vocabulary "connected scatter,"
 * NYT Upshot Phillips-curve treatments, Hannah Ritchie / Our World In
 * Data carbon-vs-income trajectories.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface ScatterPoint {
  /** Year (or other ordinal time index — determines connection order). */
  year: number;
  /** X-axis value. */
  x: number;
  /** Y-axis value. */
  y: number;
  /**
   * Optional editorial label for this point (e.g., "stagflation",
   * "Volcker shock"). Reads as a short caption beside the year.
   */
  label?: string;
  /**
   * Mark as a decision-pivot moment. Highlighted points get a larger
   * amber disc and a year label with a leader line. First, last, and
   * highlighted points always show their year.
   */
  highlight?: boolean;
}

export interface ConnectedScatterplotData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Time-indexed observations. Connected in YEAR order, not array order. */
  points: ScatterPoint[];

  /** X-axis title (e.g., "Unemployment (% of labor force)"). */
  xAxisLabel: string;
  /** Y-axis title (e.g., "Inflation (CPI YoY %)"). */
  yAxisLabel: string;

  /** Optional unit suffix on x ticks (e.g., "%"). */
  xUnit?: string;
  /** Optional unit suffix on y ticks (e.g., "%"). */
  yUnit?: string;

  /**
   * How to format axis tick values.
   *   - "number"   → plain decimals (default)
   *   - "percent"  → appends "%" (data is assumed already in percent units)
   *   - "currency" → prefixes "$"
   * The optional `xUnit`/`yUnit` is appended on top of this when present.
   */
  valueFormat?: "number" | "percent" | "currency";

  /**
   * Color of the trajectory line and default fill of unhighlighted
   * points. Brand token "accent" resolves to amber. Defaults to amber.
   */
  trajectoryColor?: string;

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
  _direction?: DirectionBlock;
}

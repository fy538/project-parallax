/**
 * CalendarHeatmap template types.
 *
 * Year-as-grid heatmap: 7 rows (days of week) × ~53 columns (ISO weeks),
 * each cell colored by an intensity value. The editorial form for dense
 * daily time-series stories where the PATTERN of days — the rhythm, the
 * clusters, the gaps — is the point.
 *
 * ── When to use this template ─────────────────────────────────────────
 *
 * USE for:
 *   - Day-level event cadence over a year (protest days, sanctions, strikes)
 *   - Conflict-day rhythm and quiet stretches between flashpoints
 *   - Market volatility regimes (COVID-era VIX, crisis spikes)
 *   - Adherence / compliance series where weekday vs. weekend matters
 *
 * DO NOT USE when:
 *   - Series spans multiple years (use TimeSeriesChart with annotations)
 *   - The story is magnitude alone, not temporal rhythm (use DataChart)
 *   - Fewer than ~20 non-zero days (the grid will look empty — use a dot plot)
 *
 * ── Visual form ──────────────────────────────────────────────────────
 *
 * Canonical WaPo / NYT / Pudding form (post-2020 COVID era). GitHub
 * contribution graph for the layout idiom; editorial outlets adopted it
 * for any "year of X" framing. Month dividers at the top, weekday
 * labels (Mon/Wed/Fri) on the left, optional highlight rings around
 * editorial-key cells, low/high color-ramp legend bottom-right.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface CalendarDay {
  /** ISO date string YYYY-MM-DD. Treated as UTC to avoid TZ drift. */
  date: string;
  /** Intensity value. Color-mapped via colorScale + maxValue. */
  value: number;
  /** Optional tooltip / debug label (not rendered on screen). */
  label?: string;
}

export interface CalendarHighlight {
  /** ISO date YYYY-MM-DD. Must match a day in `days` to be visible. */
  date: string;
  /** Short caption rendered with a leader line to the cell. */
  label: string;
}

export type CalendarColorScale = "sequential" | "diverging" | "intensity";

export interface CalendarHeatmapData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Calendar year (e.g., 2024). Determines grid extent and Jan 1 anchor. */
  year: number;

  /** All days with values. Days omitted from this list render as faint placeholders. */
  days: CalendarDay[];

  /**
   * Color mapping mode. Default `"intensity"`.
   *   - `sequential`: low → bg.base, high → palette.oxblood (single-direction series)
   *   - `intensity`: low → palette.bone, high → palette.amber (default — "events happened")
   *   - `diverging`: negative → china color, zero → bg.base, positive → us color
   */
  colorScale?: CalendarColorScale;

  /**
   * Reference maximum for the color ramp. If unset, computed from
   * `Math.max(|values|)` in the data.
   */
  maxValue?: number;

  /** Label for what the value represents (rendered in the legend). */
  valueLabel?: string;

  /**
   * Legend tick labels. Default `{ low: "Less", high: "More" }`.
   * `zero` is shown only when `colorScale === "diverging"` (anchors the
   * neutral midpoint of the symmetric −maxAbs → 0 → +maxAbs ramp). For
   * sequential / intensity scales the `zero` field is ignored.
   */
  legendLabels?: { low: string; high: string; zero?: string };

  /** First day of the week. Default `"sunday"` (US convention, NYT/WaPo). */
  weekStart?: "sunday" | "monday";

  /** Editorial callouts. Best with 2–3; more clutters the year grid. */
  highlights?: CalendarHighlight[];

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
  _direction?: DirectionBlock;
}

/**
 * TimeSeriesChart template types.
 *
 * Animated line charts showing change over time with annotations,
 * era shading, and reference lines. Used for yield curves, market share
 * shifts, spending timelines, etc.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface TimeSeriesPoint {
  /** X-axis value (year, date string, or number) */
  x: number | string;
  /** Y-axis value */
  y: number;
}

export interface TimeSeriesLine {
  label: string;
  color: string;
  points: TimeSeriesPoint[];
  /** Line width. Default: 5 (hero) or 3 (supporting). */
  width?: number;
  /** Dashed line? Default: false */
  dashed?: boolean;
  /** Show area fill below line? Default: false */
  areaFill?: boolean;
  /** Area fill opacity. Default: 0.15 */
  areaOpacity?: number;
  /**
   * Editorial hierarchy: when at least one line is `hero`, supporting lines
   * are rendered thinner and de-emphasized so the protagonist's trajectory
   * dominates the eye. Use sparingly — at most one hero per chart.
   */
  hero?: boolean;
}

export interface TimeSeriesAnnotation {
  /** X position to annotate */
  x: number | string;
  /**
   * Annotation label — describe *WHY* the line bent, not *WHAT* the line shows.
   *
   * Right: "OPEC embargo", "Volcker tightening", "2008 collapse"
   * Wrong: "CO₂ rises sharply", "Inflation peaks", "Stocks crash"
   *
   * The chart itself shows what — your label exists to name the cause or
   * the moment of recognition. If your label just describes the visible
   * shape of the line, delete it: the data already says that.
   *
   * Dossier failure mode: "Annotations describing *what* the chart shows
   * instead of *why* it bent" — annotations are editorial calls, not
   * captions. See: references/template-research/time-series-chart.md § 7
   */
  label: string;
  /** Optional second line — typically a date, attribution, or qualifier. */
  sublabel?: string;
  /** Vertical line from axis to data point? Default: true */
  line?: boolean;
  /** Dot marker on the data point? Default: true */
  dot?: boolean;
  color?: string;
}

export interface TimeSeriesEra {
  /** Start x value */
  from: number | string;
  /** End x value */
  to: number | string;
  /** Label shown inside the era band */
  label: string;
  color: string;
  /** Opacity of the background band. Default: 0.08 */
  opacity?: number;
}

export interface TimeSeriesReferenceLine {
  /** Y value for horizontal reference line */
  y: number;
  label: string;
  color?: string;
  dashed?: boolean;
}

/**
 * Horizontal reference band — a shaded range between two y values, with an
 * optional label. Right for "deviation from baseline" stories where the
 * editorial point is "the data left the normal range" — e.g., temperature
 * anomaly bands, Fed-target inflation corridor, sustainable-yield ranges.
 *
 * The band renders below all data lines, in the line color at low opacity,
 * so the active series remains the eye's primary anchor.
 *
 * See: references/template-research/time-series-chart.md § 6.5
 */
export interface TimeSeriesReferenceBand {
  /** Lower bound. */
  y1: number;
  /** Upper bound. */
  y2: number;
  /** Optional label shown inside the band (right-aligned). */
  label?: string;
  /** Band fill color. Default: muted gray. */
  color?: string;
  /** Fill opacity. Default 0.1. */
  opacity?: number;
}

export interface TimeSeriesChartData {
  episode: string;
  title: string;
  subtitle?: string;

  /**
   * Chart variant.
   *
   * - `line` (default) — standard multi-line chart with continuous time series.
   * - `slope` — slope chart: each line has exactly two points (start, end).
   *    Right form for "ranking 2000 vs 2024" / "approval start vs end of term"
   *    where the *change between two moments* is the argument. Lines that
   *    cross indicate ranking inversions; lines that diverge indicate
   *    widening gaps. Tufte called this "ranking change at a glance."
   *    See: references/template-research/time-series-chart.md § 6.2
   * - `small-multiples` — N small panels in a grid, each rendering one line
   *    against the same shared y-domain. Right when series count exceeds 4
   *    and a multi-line chart would read as spaghetti. Each panel gets a
   *    title and a sparse mini-axis; the hero panel (`line.hero: true`) gets
   *    accent color + heavier stroke. Tufte's small-multiples principle:
   *    "at the heart of quantitative reasoning is a single question: compared
   *    to what?"
   *    See: references/template-research/time-series-chart.md § 6.3
   */
  variant?: "line" | "slope" | "small-multiples";

  lines: TimeSeriesLine[];
  annotations?: TimeSeriesAnnotation[];
  eras?: TimeSeriesEra[];
  referenceLines?: TimeSeriesReferenceLine[];
  /**
   * Horizontal shaded bands behind the data. Use for "deviation from baseline"
   * stories. See `TimeSeriesReferenceBand` for the editorial convention.
   */
  referenceBands?: TimeSeriesReferenceBand[];

  /** X-axis label */
  xLabel?: string;
  /** Y-axis label */
  yLabel?: string;
  /** Y-axis unit (e.g., "%", "$B") */
  yUnit?: string;
  /** Force Y-axis range [min, max] */
  yRange?: [number, number];

  /** Hero stat shown large in corner */
  heroStat?: { value: string; label: string };

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

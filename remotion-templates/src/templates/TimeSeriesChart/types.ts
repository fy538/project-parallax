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
  /** Line width. Default: 3 */
  width?: number;
  /** Dashed line? Default: false */
  dashed?: boolean;
  /** Show area fill below line? Default: false */
  areaFill?: boolean;
  /** Area fill opacity. Default: 0.15 */
  areaOpacity?: number;
}

export interface TimeSeriesAnnotation {
  /** X position to annotate */
  x: number | string;
  /** Label text */
  label: string;
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

export interface TimeSeriesChartData {
  episode: string;
  title: string;
  subtitle?: string;

  lines: TimeSeriesLine[];
  annotations?: TimeSeriesAnnotation[];
  eras?: TimeSeriesEra[];
  referenceLines?: TimeSeriesReferenceLine[];

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

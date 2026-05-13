/**
 * RadarChart — multi-axis polygon comparison.
 *
 * Plots entities (countries, strategies, systems) across N dimensions
 * as filled polygons on a radar/spider chart. Polygons can morph from
 * one state to another to show change over time.
 *
 * Each axis has a label and a 0-100 scale. Multiple subjects are
 * overlaid with distinct colors and transparency.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface RadarAxis {
  /** Axis label (e.g., "Military", "Economic") */
  label: string;
  /** Optional short label for tight layouts */
  short?: string;
}

export interface RadarSubject {
  /** Subject name (e.g., "United States", "China") */
  name: string;
  /** Values for each axis (0-100), same order as axes array */
  values: number[];
  /** Fill/stroke color */
  color: string;
  /** Fill opacity (0-1, default: 0.2) */
  fillOpacity?: number;
}

export interface RadarChartData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Axis definitions — one per spoke */
  axes: RadarAxis[];

  /** Subjects to plot — each gets a polygon */
  subjects: RadarSubject[];

  /** Whether to animate a morph from prior values to current (default: false) */
  morphFrom?: RadarSubject[];

  /** Show axis value gridlines at these levels (default: [25, 50, 75, 100]) */
  gridLevels?: number[];

  /**
   * Optional axis focus sequence — camera rotates to highlight each axis in turn.
   * When provided, the chart rotates so the focused axis is at the top,
   * with a pulsing vertex highlight and value callout.
   */
  axisFocusSequence?: AxisFocusStep[];

  /** Show ambient particles (default: false) */
  ambientParticles?: boolean;

  /** Source attribution */
  source?: string;
  durationSec?: number;
  /** Deliberate pause in seconds after radar polygons finish drawing, before exit fade. Default: 0. */
  holdAfterRevealSec?: number;
  backgroundVariant?: "dark" | "light";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

export interface AxisFocusStep {
  /** Index of axis to focus (0-based, matches axes array order) */
  axisIndex: number;
  /** Duration to dwell on this axis in seconds */
  duration: number;
  /** Optional annotation shown near the focused vertex */
  annotation?: string;
  /** Optional label overlay */
  label?: string;
}

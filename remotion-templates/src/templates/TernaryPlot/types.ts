/**
 * TernaryPlot — three-way composition plot on an equilateral triangle.
 *
 * Each point sits at a barycentric position where its three values
 * (a, b, c) sum to 1.0 (or 100, normalized internally). The three
 * corners represent the pure states; points cluster toward the corner
 * that dominates and toward the centroid when the three values are
 * balanced.
 *
 * Editorial form for three-bloc alignment, left/center/right
 * composition, or any "share of three" decomposition where the
 * triangle's geometry makes the trade-off visually unavoidable.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface TernaryPoint {
  /** Stable identifier (used as React key) */
  id: string;
  /** Optional label — only drawn when `highlight` is true */
  label?: string;
  /** Share of axis A (top corner). Values may sum to 1 or 100. */
  a: number;
  /** Share of axis B (bottom-right corner). */
  b: number;
  /** Share of axis C (bottom-left corner). */
  c: number;
  /** Override marker color. Defaults to muted text token. */
  color?: string;
  /** Draw amber-accented enlarged disc + label callout. */
  highlight?: boolean;
  /**
   * Optional weight (relative scale factor for the disc radius).
   * Defaults to 1.0; clamped to [0.4, 3.0] at render time.
   */
  size?: number;
}

export interface TernaryAxisLabels {
  /** Top corner label (axis A). */
  a: string;
  /** Bottom-right corner label (axis B). */
  b: string;
  /** Bottom-left corner label (axis C). */
  c: string;
}

export interface TernaryPlotData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Points to plot. Each `a + b + c` must normalize to 1.0. */
  points: TernaryPoint[];

  /** Labels for the three triangle corners. */
  axisLabels: TernaryAxisLabels;

  /**
   * Optional "how to read this" caption rendered as a small italic
   * mono-uppercase line beneath the title block, above the triangle.
   *
   * The TernaryPlot is unfamiliar to many viewers — first-time readers
   * don't intuit how an equilateral triangle of barycentric points
   * encodes a three-way share. A short reading cue lets the form land
   * at video-scrubbing speed without making it feel patronizing for
   * repeat viewers. Set it on the first ternary in an episode; omit it
   * on subsequent ones once the audience has learned the convention.
   *
   * Example: "Read corners as 100%; centroid is balanced 33/33/33."
   */
  readingCue?: string;

  /** Draw faint 25/50/75% gridlines + tick percentage labels. Default: true. */
  gridlines?: boolean;

  /** Mark the mean of all points with a + glyph + "Mean" caption. Default: false. */
  centroid?: boolean;

  /** Source attribution caption. */
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

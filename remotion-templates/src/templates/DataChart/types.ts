/**
 * Data types for the DataChart template.
 *
 * Supports animated bar charts and comparison charts.
 * Bars grow upward; values count up.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface DataPoint {
  label: string;
  value: number;
  /** Override bar color. */
  color?: string;
  /** Secondary label (e.g., country name under a year). */
  sublabel?: string;
}

export interface ComparisonPair {
  label: string;
  leftValue: number;
  rightValue: number;
  leftLabel?: string;
  rightLabel?: string;
}

export interface DataChartData {
  episode: string;
  title: string;
  subtitle?: string;
  /**
   * Chart variant.
   *
   * - `bar` — vertical bars, ≤8 items, simple comparison.
   * - `horizontal` — horizontal bars, sorted descending. The default for ranked
   *    comparisons with 5+ items per Cleveland-McGill perceptual hierarchy.
   * - `comparison` — paired side-by-side bars (US vs. USSR style).
   * - `lollipop` — horizontal lollipop chart: thin stem + terminal dot.
   *    For 10+ item rankings where bars would visually saturate the canvas
   *    (Axelrod tournament strategy rankings, country-by-country indicator).
   *    Cleveland's perceptual hierarchy: position-along-common-scale survives
   *    in lollipop form while ink-to-data ratio drops dramatically.
   *    See: references/template-research/data-chart.md § 6.4
   * - `small-multiples` — grid of small panels, each with the same item
   *    list rendered as mini horizontal bars sharing a value scale.
   *    Right for cross-category comparison ("show me the rankings across
   *    six countries / six years / six demographics"). Tufte's signature
   *    form for "compared to what?" Pair with `panels` field.
   *    See: references/template-research/data-chart.md § 6.5
   */
  variant: "bar" | "comparison" | "horizontal" | "lollipop" | "small-multiples";

  /**
   * Panels for `small-multiples` variant. Each panel renders the same item
   * structure (a list of DataPoint) but for a different category — e.g.,
   * "GDP rankings by region," each panel showing the same six countries'
   * GDP, panels labeled "Asia / Europe / Americas." Maximum value is
   * computed across ALL panels so the value axis is shared.
   *
   * Required when `variant: "small-multiples"`. Ignored otherwise.
   */
  panels?: Array<{
    title: string;
    dataPoints: DataPoint[];
    /** Optional subtitle / context for this panel. */
    subtitle?: string;
  }>;
  /** Unit label (e.g., "%", "passes", "$B"). */
  unit?: string;
  /** For bar charts. */
  dataPoints?: DataPoint[];
  /** For comparison charts (side-by-side bars). */
  comparisonPairs?: ComparisonPair[];
  /** Left group label for comparisons. */
  leftGroupLabel?: string;
  /** Right group label for comparisons. */
  rightGroupLabel?: string;
  leftGroupColor?: string;
  rightGroupColor?: string;
  /** Domain category labels rendered below the chart (e.g., discipline names grouping bars). */
  domainLabels?: string[];
  /**
   * When true, bar values render WITHOUT thousand-separators (e.g. "1958"
   * instead of "1,958"). Use for year values, postal codes, or any
   * 4-digit identifier where comma-separation reads as a category error.
   * Affects bar value labels and y-axis tick labels.
   */
  formatAsYear?: boolean;
  /** Source attribution shown at bottom. */
  source?: string;
  /** Total duration in seconds. */
  durationSec?: number;

  // ── Information Design (POLISH Layer 1) ────────────────────────────────
  /** Optional horizontal reference line — e.g. a target, threshold, or comparison baseline. */
  referenceLine?: {
    value: number;
    label: string;
    /** Defaults to dashed amber. */
    color?: string;
  };
  /** Index of the "hero" bar to visually emphasize (accent glow + larger label). -1 = none. */
  highlightIndex?: number;
  /** Context note shown below the chart — one sentence framing what the data means. */
  contextNote?: string;
  /** Subtle color tint for emotional temperature (Layer 3). Hex color, e.g. "#3266AD" for US-blue, "#C23B22" for China-red. */
  backgroundTint?: string;
  /**
   * When true, `<Background>` uses variant `"transparent"` so a parent atmospheric
   * layer (e.g. SegmentBackdrop under FullEpisode) is visible behind chart chrome.
   */
  transparentBackground?: boolean;

  // ── Narrated Camera ("Hans Rosling" mode) ─────────────────────────────
  /**
   * Optional spotlight sequence for cinematic data narration.
   * Each step spotlights one or more bars, dimming others.
   * Camera zooms into the spotlighted bars with annotations.
   * When omitted, uses the standard static animation.
   */
  spotlightSequence?: SpotlightStep[];

  /** Show ambient particles (default: false) */
  ambientParticles?: boolean;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

export interface SpotlightStep {
  /** Indices of bars to spotlight (others get dimmed) */
  barIndices: number[];
  /** Duration of this spotlight in seconds */
  duration: number;
  /** Zoom level (default: 1.3) */
  zoom?: number;
  /** Optional annotation text that appears near the spotlighted bar */
  annotation?: string;
  /** Camera behavior */
  behavior?: "track" | "snap";
  /** Optional label overlay */
  label?: string;
}

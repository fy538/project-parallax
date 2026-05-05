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
  /** Chart variant. */
  variant: "bar" | "comparison" | "horizontal";
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

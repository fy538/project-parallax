/**
 * Data types for the DataChart template.
 *
 * Supports animated bar charts and comparison charts.
 * Bars grow upward; values count up.
 */

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
  /** Source attribution shown at bottom. */
  source?: string;
  /** Total duration in seconds. */
  durationSec?: number;
}

/**
 * Data types for the DumbbellPlot template.
 *
 * For each category, two dots (low + high) are connected by a thick line.
 * Encodes a min-max range or before-after pair across categories. Sister of
 * RankChangeDotPlot, but for ranges/intervals rather than rank changes.
 * Cleveland-canonical form for "ranges across categories."
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface DumbbellItem {
  /** Category label rendered to the left of the row. */
  label: string;
  /** Lower bound (e.g. 10th percentile, "before" value). */
  low: number;
  /** Upper bound (e.g. 90th percentile, "after" value). */
  high: number;
  /**
   * Optional midpoint (e.g. median / 50th percentile). When set, a small
   * vertical tick is drawn on the connector line at this x-value. Lets the
   * viewer see distribution skew — a tick close to `low` reveals heavy
   * right-skew (e.g. US income) vs a centered tick (uniform spread).
   * Omitted = no tick on that row (full back-compat).
   */
  mid?: number;
  /** Optional per-row override for the low-dot text annotation. */
  lowLabel?: string;
  /** Optional per-row override for the high-dot text annotation. */
  highLabel?: string;
  /** Optional explicit color override (defaults to theme accent). */
  color?: string;
  /** Highlighted rows get full opacity, heavier weight, and slightly larger dots. */
  highlight?: boolean;
}

export type DumbbellValueFormat = "number" | "percent" | "currency";

export interface DumbbellPlotData {
  episode: string;
  title: string;
  subtitle?: string;
  items: DumbbellItem[];
  /** Axis caption rendered below the tick row. */
  xAxisLabel: string;
  /** Optional unit string surfaced in the FooterStrip scale slot. */
  xUnit?: string;
  /** Controls how numeric values are formatted (axis ticks + value labels). */
  valueFormat?: DumbbellValueFormat;
  /** Legend label for the low (smaller, muted) dot. */
  lowLegendLabel?: string;
  /** Legend label for the high (larger, accent) dot. */
  highLegendLabel?: string;
  /**
   * Legend caption for the midpoint tick. Only surfaced when at least one
   * item has `mid` set. Defaults to "Median".
   */
  midLegendLabel?: string;
  /**
   * Sort order. Default "range" — widest (high - low) gap appears first.
   * - "label": alphabetical by label
   * - "low":   ascending by low value
   * - "high":  ascending by high value
   * - "range": descending by (high - low)
   */
  sortBy?: "label" | "low" | "high" | "range";
  /** Optional dashed reference line drawn at this x-value (with caption). */
  referenceLine?: {
    value: number;
    label: string;
  };
  source?: string;
  durationSec?: number;
  /** Background mode passed to <Background variant=...>. Default "light". */
  backgroundVariant?: "light" | "dark";
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

/**
 * MarimekkoChart template types.
 *
 * Variable-width stacked columns where BOTH dimensions encode magnitude:
 *   - Column WIDTH  = first dimension  (e.g., country's share of regional GDP)
 *   - Column HEIGHT-STACK = second dimension breakdown (e.g., energy mix)
 *
 * Every cell's area = column.width × segment.value, so the eye reads
 * "fossil fuels' share of total G7 energy" at a glance via cell area.
 *
 * ── When to use this template ─────────────────────────────────────────
 *
 * USE for:
 *   - Industry-vs-region (FT's canonical case): "manufacturing's share
 *     of each economy, sized by economy"
 *   - Trade-vs-commodity: "what each country exports, sized by export volume"
 *   - Energy-vs-economy: "energy mix per country, sized by total demand"
 *   - Budget-vs-department: composition × scale, two dimensions on one chart
 *
 * DO NOT USE when:
 *   - Only one magnitude matters → DataChart / TimeSeriesChart
 *   - Composition matters but scale doesn't → stacked bar, no width variation
 *   - More than ~10 columns or ~6 segments → wall-of-rectangles becomes noise
 *
 * Editorial precedents: FT (industry-by-region energy/trade), Economist
 * (commodity exports), Bloomberg Opinion (sector composition × cap).
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface MarimekkoSegment {
  /**
   * Shared identity across columns. Same `key` in different columns gets
   * the same color, so the viewer can track "fossil" or "renewable"
   * across countries. Use a stable slug ("fossil", "nuclear", "renewable").
   */
  key: string;
  /** Display label for this segment (rendered inside large-enough cells, also in legend). */
  label: string;
  /**
   * Optional explicit color (hex or theme token). When omitted, the
   * segment auto-assigns from `segmentColorMap` or a palette ramp keyed
   * on segment order.
   */
  color?: string;
  /**
   * Magnitude on the height axis. In percent mode, columns are
   * normalized so each column's segments sum to 100%. In absolute mode,
   * the largest column-sum is used to set the chart's vertical scale.
   */
  value: number;
}

export interface MarimekkoColumn {
  id: string;
  /** Column label rendered ABOVE the column. */
  label: string;
  /** Small-caps secondary line under the column label (e.g., dates, region). */
  sublabel?: string;
  /**
   * First-dimension magnitude. In percent mode, the chart normalizes
   * across all columns so they sum to the full chart width. In absolute
   * mode, the largest width sets full chart width and the rest scale.
   */
  width: number;
  /** Vertical-stack segments. In percent mode each column's segments should sum to 100. */
  segments: MarimekkoSegment[];
}

export interface MarimekkoChartData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Variable-width, segmented columns in editorial order (left → right). */
  columns: MarimekkoColumn[];

  /**
   * Width / height mode. Default `"percent"` — both axes normalized so
   * each column reads as 100% composition vertically and the entire
   * chart fills the content rectangle horizontally. Use `"absolute"` to
   * preserve raw magnitudes (largest column hugs the right edge; others
   * scale; vertical totals can vary per column).
   */
  widthMode?: "absolute" | "percent";

  /**
   * Optional segment color overrides, keyed by `MarimekkoSegment.key`.
   * Recommended when the editorial story needs specific brand colors
   * (e.g., "fossil" = rust). Falls back to a palette ramp.
   */
  segmentColorMap?: Record<string, string>;

  /**
   * Editorial emphasis — when set, segments whose `key` matches render
   * at full saturation (accent register) and all sibling segments fade
   * to ~0.45 opacity (muted register). The emphasized segment's in-cell
   * label is also bumped to heavier weight + larger size when the cell
   * is large enough to host it.
   *
   * Use when narration names ONE segment as the story
   * (e.g., "fossil fuels' share of every G7 economy"). Mirrors
   * SankeyFlow's `link.emphasis` pattern. Column labels and
   * width-percent stamps stay full saturation — they're entity IDs,
   * not part of the segment hierarchy.
   *
   * Omit for the default audit-style read where every segment competes
   * for attention at full saturation.
   */
  emphasisKey?: string;

  /**
   * Optional display formatter hint for the width % label. Currently
   * unused by the renderer (kept for future numeric formatting hooks).
   */
  valueFormat?: string;

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
  _direction?: DirectionBlock;
}

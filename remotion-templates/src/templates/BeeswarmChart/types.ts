/**
 * BeeswarmChart template types.
 *
 * 1D scatter where many entities are placed along a single METRIC axis,
 * with collision-resolved vertical offsets so individual dots remain
 * legible. Selected entities are highlighted (larger radius + amber
 * fill + leader-line label).
 *
 * ── When to use this template ──────────────────────────────────────
 *
 * USE for:
 *   - "N countries by metric X" reveals where individual-entity
 *     legibility matters (military spending % of GDP, R&D intensity,
 *     fertility rate, life expectancy by country).
 *   - Distributional stories ("most members cluster here; outliers
 *     run hot") where DataChart bars would compress illegibly.
 *   - "Where does country Y sit relative to the pack?" framings.
 *
 * DO NOT USE when:
 *   - The metric is two-dimensional → use a true scatter / RadarChart.
 *   - Time evolution is the editorial point → TimeSeriesChart.
 *   - Only a handful of entities matter → DataChart or StatReveal.
 *
 * ── Visual form ─────────────────────────────────────────────────────
 *
 * One horizontal axis runs across the content area. Each item is
 * positioned at its `value` along x, then collision-resolved upward
 * (alternating directions per cluster) so adjacent dots don't overlap.
 * Highlighted items pop forward with a bigger disc and a leader-line
 * label that names the entity and shows its value.
 *
 * Editorial precedents: NYT Upshot (life expectancy by county), FT
 * (NATO spending swarm), Bloomberg Opinion (R&D intensity beeswarm).
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface BeeswarmItem {
  /** Display label (country name, company name, etc.). */
  label: string;
  /** Numeric metric value used for x-positioning. */
  value: number;
  /**
   * Color override (hex or palette token). When omitted, non-highlighted
   * items use `theme.text.muted` and highlighted items use amber.
   */
  color?: string;
  /** When true, item gets larger radius + leader-line label. */
  highlight?: boolean;
  /** group label — items with the same group string share a color and appear in the legend strip. */
  group?: string;
}

export interface BeeswarmReferenceLine {
  /** x-axis value where the dashed reference line is drawn. */
  value: number;
  /** Label rendered above the reference line (e.g., "NATO target: 2.0%"). */
  label: string;
}

export interface BeeswarmData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Items to plot. Order is irrelevant — items get sorted by value. */
  items: BeeswarmItem[];

  /** Axis title, e.g. "% of GDP". Rendered as small caps near the axis. */
  axisLabel?: string;

  /**
   * Unit suffix used in highlighted-item value labels (e.g., "%"). Pure
   * cosmetic; if `valueFormat` is "percent" the "%" sign is appended
   * automatically and `unit` may be left empty.
   */
  unit?: string;

  /**
   * How to format displayed values on tick labels + highlight callouts.
   *   - "number"   → e.g. "3.4"     (default)
   *   - "percent"  → e.g. "3.4%"
   *   - "currency" → e.g. "$3.4"
   */
  valueFormat?: "number" | "percent" | "currency";

  /** Optional vertical dashed line at a reference value (mean, target, etc.). */
  referenceLine?: BeeswarmReferenceLine;

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
  _direction?: DirectionBlock;
}

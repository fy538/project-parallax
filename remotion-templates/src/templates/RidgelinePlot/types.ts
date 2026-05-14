/**
 * RidgelinePlot template types — N stacked density curves (joyplot),
 * one per group, with slight vertical overlap.
 *
 * Editorial form for "distributions across groups" stories:
 *   - Life expectancy by continent
 *   - Income distribution by decade
 *   - Age distribution by country
 *   - Test scores by school district
 *
 * Canonical since The Economist ~2017 (originally from Joy Division's
 * "Unknown Pleasures" cover, popularized in stats by Claus Wilke). The
 * key editorial affordance is that *shape* itself becomes the story —
 * a peaked, narrow distribution next to a flat, wide one tells you
 * something a mean-and-bar comparison cannot.
 *
 * ── When to use this template ─────────────────────────────────────────
 *
 * USE for:
 *   - Comparing the *shape* of a distribution across groups
 *   - Showing skew, multimodality, or spread differences
 *   - Conveying "the gap isn't just in averages, it's in the whole curve"
 *
 * DO NOT USE when:
 *   - You only have a single summary statistic per group (use bar/dot plot)
 *   - Groups overlap in time and order matters more than shape (TimeSeriesChart)
 *   - More than ~8 groups: ridges start to stack into noise
 *
 * ── Density samples ──────────────────────────────────────────────────
 *
 * Each group provides PRE-COMPUTED density samples — the template does
 * not run kernel density estimation at render time. Data files emit
 * arrays of `{x, y}` points sorted ascending by `x`. `y` is a density
 * estimate (peak typically 0.05–0.25 for normalized Gaussians).
 *
 * The shared X axis spans `min(all x) → max(all x)` across every group.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

/** One sample point on a group's density curve. */
export interface DensitySample {
  /** Position along the shared X axis (e.g. years, dollars, age). */
  x: number;
  /** Density / probability estimate at this x. Non-negative. */
  y: number;
}

/** One row of the joyplot — a single group's density curve. */
export interface RidgelineGroup {
  /** Stable id used for highlight matching. */
  id: string;
  /** Display label shown to the left of the ridge. */
  label: string;
  /**
   * Fill / stroke color. Brand token name (`"rust"`, `"amber"`, `"olive"`,
   * `"bronze"`, `"bone"`, `"gold"`, etc.) or any hex. Defaults to a
   * categorical color when omitted.
   */
  color?: string;
  /**
   * Pre-computed density samples, sorted ascending by `x`. 12–25 points
   * is typical; the curve smoothing handles modest sample counts well.
   */
  density: DensitySample[];
}

export interface RidgelinePlotData {
  episode: string;
  title: string;
  subtitle?: string;

  /**
   * Groups in display order — the TOP ridge is `groups[0]` and ridges
   * stack downward. Ordering carries editorial weight (continents
   * sorted by life-expectancy median, decades chronologically, etc.).
   */
  groups: RidgelineGroup[];

  /** Axis title for the shared X axis (e.g. "Life expectancy (years)"). */
  xAxisLabel: string;
  /** Optional unit suffix appended to tick labels (e.g. "yrs", "$"). */
  xUnit?: string;

  /**
   * How much each ridge overlaps the row above it, 0.0–0.8.
   *   0.0 → ridges fully separated, no overlap (faceted small multiples feel)
   *   0.4 → default, classic joyplot density
   *   0.7 → dense stacking, dramatic shape comparison
   * Default 0.4.
   */
  overlap?: number;

  /**
   * Group ids that get hero treatment — heavier stroke, higher fill
   * opacity, peak-value callout, and bold label. Use sparingly (1–2 ids).
   */
  highlightIds?: string[];

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
  _direction?: DirectionBlock;
}

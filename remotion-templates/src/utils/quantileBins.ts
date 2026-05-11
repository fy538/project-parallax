/**
 * Bin-computation helpers for choropleth / discrete-data visualizations.
 *
 * Forces the data writer to *declare* the binning strategy rather than letting
 * each per-episode JSON file invent its own. The dossier's failure mode is
 * "Equal-interval bins on skewed distributions (everything one color)" —
 * the quantile strategy here is the safer default for most real-world data
 * (income, GDP per capita, infection rates) where the distribution is skewed.
 *
 * Reference: references/template-research/choropleth-map.md § 6.3
 *
 * Recommended use in a per-episode JSON pre-processing step:
 *
 *   import { quantileBreaks, normalizeForRamp, binAndNormalize } from "@/utils/quantileBins";
 *
 *   const values = countries.map(c => c.gdpPerCapita);
 *   const breaks = quantileBreaks(values, 5);   // 4 internal breakpoints, 5 bins
 *   const enriched = countries.map(c => ({
 *     ...c,
 *     value: normalizeForRamp(c.gdpPerCapita, breaks),  // → [0,1] for the ramp
 *   }));
 *
 * The ChoroplethMap template will then render bin-indexed colors directly.
 */

/**
 * Compute quantile break points for `numBins` equal-count bins.
 *
 * Returns the (numBins - 1) internal breakpoints in sorted ascending order.
 * Example: for 5 bins, returns 4 numbers — the 20th, 40th, 60th, 80th
 * percentiles of the values array.
 *
 * Pass these to `assignBin()` or `normalizeForRamp()` to index into a
 * color ramp.
 */
export function quantileBreaks(values: number[], numBins: number): number[] {
  if (numBins < 2) return [];
  const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const breaks: number[] = [];
  for (let i = 1; i < numBins; i++) {
    const p = i / numBins;
    // Linear interpolation between adjacent ranks (Type 7 — R/Python default).
    const idx = (sorted.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    const frac = idx - lo;
    breaks.push(sorted[lo] + (sorted[hi] - sorted[lo]) * frac);
  }
  return breaks;
}

/**
 * Compute equal-interval break points (uniform splits of [min, max]).
 *
 * Use ONLY when the underlying distribution is approximately uniform.
 * For skewed data (income, population, area), prefer `quantileBreaks` —
 * equal-interval bins on a skewed distribution color everything the same.
 */
export function equalIntervalBreaks(values: number[], numBins: number): number[] {
  if (numBins < 2) return [];
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const step = (max - min) / numBins;
  const breaks: number[] = [];
  for (let i = 1; i < numBins; i++) breaks.push(min + step * i);
  return breaks;
}

/**
 * Assign a raw value to a bin index given internal breakpoints.
 *
 * Returns 0..(breaks.length) inclusive. Values ≤ breaks[0] → bin 0; values >
 * breaks[breaks.length - 1] → top bin. Total bin count = breaks.length + 1.
 */
export function assignBin(value: number, breaks: number[]): number {
  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]) return i;
  }
  return breaks.length;
}

/**
 * Normalize a raw value into the [0,1] range expected by ChoroplethMap's
 * `country.value` field. Maps each bin to its index proportion in a
 * (breaks.length + 1)-bin scale.
 *
 * Use this when the template hasn't been refactored to accept raw values
 * directly — preprocess the data with this helper.
 */
export function normalizeForRamp(value: number, breaks: number[]): number {
  const bin = assignBin(value, breaks);
  const totalBins = breaks.length + 1;
  if (totalBins <= 1) return 0;
  return bin / (totalBins - 1);
}

/**
 * Convenience: one-step transform from raw values to `{ value: 0..1 }` records
 * ready to drop into ChoroplethMap data.
 *
 * Default strategy is `quantile` (the safer choice for real-world data).
 * Default bins is 5 (NYT / Reuters Graphics convention for choropleth).
 *
 * Returns a tuple of (enriched records, breakpoints) — keep the breakpoints
 * so the legend strip can label each bin's range.
 */
export function binAndNormalize<T extends { value?: number }>(
  records: T[],
  options: {
    extractValue?: (r: T) => number;
    strategy?: "quantile" | "equal-interval";
    bins?: number;
  } = {},
): { records: Array<T & { value: number }>; breaks: number[] } {
  // Renamed from `valueOf` to avoid shadowing Object.prototype.valueOf, which
  // some JS engines invoke implicitly during type coercion.
  const extract = options.extractValue ?? ((r: T) => r.value ?? 0);
  const strategy = options.strategy ?? "quantile";
  const numBins = options.bins ?? 5;
  const rawValues = records.map(extract);
  const breaks = strategy === "quantile"
    ? quantileBreaks(rawValues, numBins)
    : equalIntervalBreaks(rawValues, numBins);
  const enriched = records.map((r) => ({
    ...r,
    value: normalizeForRamp(extract(r), breaks),
  }));
  return { records: enriched, breaks };
}

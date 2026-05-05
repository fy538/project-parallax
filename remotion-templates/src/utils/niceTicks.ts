/**
 * Nice axis ticks — D3-style 1/2/5 × 10ⁿ tick spacing.
 *
 * Why this exists: linear interpolation between data min/max produces
 * ugly tick labels (e.g. "1,051", "2,427", "3,803" instead of "1,000",
 * "2,000", "3,000"). The functions here snap a domain to "nice" round
 * numbers so axis labels are scannable at a glance.
 *
 * Used by TimeSeriesChart, DataChart (bar variant), and any future
 * cartesian chart that needs a y-axis. Keep the chart-specific logic
 * (domain inference rules — clamp at 0 for non-negative data, etc.)
 * in the template; this module only handles the math.
 */

/**
 * Compute a nice tick spacing for a given data range. Spacing is always
 * 1, 2, or 5 × 10ⁿ, picked so that range / spacing ≈ targetTicks.
 */
function niceTickSpacing(range: number, targetTicks: number): number {
  const rough = range / targetTicks;
  const exponent = Math.floor(Math.log10(rough));
  const fraction = rough / Math.pow(10, exponent);
  let niceFraction: number;
  if (fraction < 1.5) niceFraction = 1;
  else if (fraction < 3) niceFraction = 2;
  else if (fraction < 7) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * Math.pow(10, exponent);
}

/**
 * Snap a [min, max] domain to "nice" boundaries — round numbers that
 * land on multiples of 1, 2, or 5 × 10ⁿ.
 *
 * @example niceDomain(133, 4721, 5) → [0, 5000]
 * @example niceDomain(2018, 2024, 5) → [2018, 2024]
 * @example niceDomain(-12, 87, 5) → [-20, 100]
 */
export function niceDomain(
  min: number,
  max: number,
  targetTicks: number = 5
): [number, number] {
  if (max <= min) return [min, max];
  const range = max - min;
  const tickSpacing = niceTickSpacing(range, targetTicks);
  const niceMin = Math.floor(min / tickSpacing) * tickSpacing;
  const niceMax = Math.ceil(max / tickSpacing) * tickSpacing;
  return [niceMin, niceMax];
}

/**
 * Generate tick values at integer multiples of nice spacing within
 * [min, max]. Unlike a naive linear divide, this guarantees every
 * tick lands on a round number (e.g. 0, 1000, 2000 — never 1051.4).
 *
 * Caller should pass an already-niced domain (use `niceDomain` first).
 * The number of ticks returned is range/spacing + 1, which is close to
 * but may differ from targetTicks by ±1.
 *
 * @example niceTicks(0, 5000, 5) → [0, 1000, 2000, 3000, 4000, 5000]
 *          niceTicks(0, 4000, 5) → [0, 1000, 2000, 3000, 4000]
 */
export function niceTicks(
  min: number,
  max: number,
  targetTicks: number = 5
): number[] {
  if (max <= min) return [min];
  const range = max - min;
  const spacing = niceTickSpacing(range, targetTicks);
  const ticks: number[] = [];
  // Start at the smallest multiple of spacing that's >= min.
  const start = Math.ceil(min / spacing) * spacing;
  for (let v = start; v <= max + 1e-9; v += spacing) {
    // Round trips through Number to mitigate floating-point drift
    // (e.g. 0.1 + 0.2 = 0.30000000000000004).
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks;
}

/**
 * Compute a sensible y-axis domain given raw data values.
 *
 * Rules:
 *   - All-non-negative data → bottom at 0 (population can't be -325)
 *   - All-non-positive data → top at 0 (mirror case)
 *   - Mixed sign → pad both ends 10%
 *   - Always snapped to nice round numbers
 *
 * Pass `forceIncludeZero: false` if your data has natural baseline
 * other than zero and you don't want the axis to clamp.
 */
export function computeYDomain(
  values: number[],
  options?: { targetTicks?: number; forceIncludeZero?: boolean }
): [number, number] {
  const targetTicks = options?.targetTicks ?? 5;
  const includeZero = options?.forceIncludeZero ?? true;
  if (values.length === 0) return [0, 1];
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin || 1;
  let yMin: number;
  let yMax: number;
  if (includeZero && dataMin >= 0) {
    yMin = 0;
    yMax = dataMax + range * 0.1;
  } else if (includeZero && dataMax <= 0) {
    yMin = dataMin - range * 0.1;
    yMax = 0;
  } else {
    yMin = dataMin - range * 0.1;
    yMax = dataMax + range * 0.1;
  }
  return niceDomain(yMin, yMax, targetTicks);
}

/**
 * Format a tick value with a data unit. Handles both prefix-style ("$")
 * and suffix-style (" m", "%", " mph") units. The data tick is the
 * actual data value — no percent-of-max shenanigans.
 */
export function formatTick(value: number, unit?: string): string {
  // Drop trailing .0 — "1000" reads cleaner than "1000.0".
  const text = Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (!unit) return text;
  // Heuristic: leading-symbol units are prefixes ($, €, ¥)
  if (/^[$€¥£]/.test(unit)) return `${unit}${text}`;
  return `${text}${unit}`;
}

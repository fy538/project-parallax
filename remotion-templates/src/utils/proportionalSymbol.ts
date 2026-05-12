/**
 * proportionalSymbol — pure helpers for the ProportionalSymbolMap template.
 *
 * Core math: area-proportional radius (NOT radius-proportional — that would
 * encode the value squared visually, the classic proportional-symbol lie).
 * This is `radius = sqrt(value / maxValue) * maxRadius` — the same
 * relationship d3-scale's `scaleSqrt` provides. We inline it here so the
 * template stays self-contained and the math is one place to read + test.
 *
 * Reference: references/template-research/proportional-symbol-map.md
 */

// ── Radius scaling ────────────────────────────────────────────────────────

export type ScaleType = "sqrt" | "linear";

/**
 * Compute the rendered radius for a value given a max-value reference and
 * a max-radius pixel budget. Default scale is `sqrt` (area-proportional),
 * the editorially-honest choice. `linear` is provided for completeness but
 * should almost never be used — it makes the value visually look like its
 * square. Audit lint should flag `scaleType: "linear"`.
 *
 * Floors at 0 for non-positive inputs (a zero-value symbol renders nothing).
 */
export const computeRadius = (
  value: number,
  maxValue: number,
  maxRadiusPx: number,
  scaleType: ScaleType = "sqrt",
): number => {
  if (value <= 0 || maxValue <= 0) return 0;
  const normalized = Math.min(1, value / maxValue);
  if (scaleType === "linear") return normalized * maxRadiusPx;
  return Math.sqrt(normalized) * maxRadiusPx;
};

/**
 * Inverse of `computeRadius` — given a radius, recover the value the symbol
 * is encoding. Used by the legend to label reference circles.
 */
export const radiusToValue = (
  radius: number,
  maxValue: number,
  maxRadiusPx: number,
  scaleType: ScaleType = "sqrt",
): number => {
  if (radius <= 0 || maxRadiusPx <= 0) return 0;
  const r = Math.min(1, radius / maxRadiusPx);
  if (scaleType === "linear") return r * maxValue;
  return r * r * maxValue;
};

// ── Legend tick generation ────────────────────────────────────────────────

/**
 * Generate "nice" reference values for a proportional-symbol legend.
 * Returns three values: small (≈1/16 of max), medium (≈1/4 of max), large
 * (= max, rounded to a clean number).
 *
 * The 1/16 ratio is intentional under sqrt scaling — the small circle's
 * radius is sqrt(1/16) = 1/4 of the max radius, the mid is 1/2, the
 * large is full. That gives equal *visual* spacing in the legend (eye
 * reads area linearly).
 *
 * Edge case: when max is small (< 10), we round to 1 decimal; otherwise
 * to nearest "nice" number (powers of 10, sometimes halves).
 */
export const generateLegendTicks = (
  maxValue: number,
): { small: number; medium: number; large: number } => {
  if (maxValue <= 0) return { small: 0, medium: 0, large: 0 };
  const large = niceCeil(maxValue);
  const medium = niceCeil(large / 4);
  const small = niceCeil(large / 16);
  return { small, medium, large };
};

/**
 * Round up to the nearest "nice" number — 1, 2, 5, 10, 20, 50, 100, ...
 * This is the standard chart-axis tick-nicing algorithm. Exported for tests.
 */
export const niceCeil = (n: number): number => {
  if (n <= 0) return 0;
  const exp = Math.floor(Math.log10(n));
  const base = Math.pow(10, exp);
  const f = n / base;
  let nice: number;
  if (f <= 1) nice = 1;
  else if (f <= 2) nice = 2;
  else if (f <= 5) nice = 5;
  else nice = 10;
  return nice * base;
};

// ── Value formatting ──────────────────────────────────────────────────────

/**
 * Format a numeric value for legend display: "1.2K", "45M", "$3.4B", etc.
 * Optional unit suffix (no thinspace — keep tight to the number).
 */
export const formatLegendValue = (
  value: number,
  unit?: string,
): string => {
  let body: string;
  if (Math.abs(value) >= 1e9) body = `${(value / 1e9).toFixed(1)}B`;
  else if (Math.abs(value) >= 1e6) body = `${(value / 1e6).toFixed(1)}M`;
  else if (Math.abs(value) >= 1e3) body = `${(value / 1e3).toFixed(1)}K`;
  else if (Math.abs(value) >= 10) body = `${Math.round(value)}`;
  else body = `${value.toFixed(1)}`;
  // Trim trailing ".0"
  body = body.replace(/\.0([KMB]?)$/, "$1");
  return unit ? `${body} ${unit}` : body;
};

// ── Symbol sorting ────────────────────────────────────────────────────────

export interface SymbolDatumLike {
  iso3: string;
  value: number;
}

/**
 * Sort largest-to-smallest so that small circles render LAST in SVG (and
 * therefore on top). In dense regions (Europe), this prevents small circles
 * from vanishing under larger ones. Exported so the component and tests
 * share the same ordering contract.
 */
export const sortSymbolsLargestFirst = <T extends SymbolDatumLike>(
  symbols: readonly T[],
): T[] => [...symbols].sort((a, b) => b.value - a.value);

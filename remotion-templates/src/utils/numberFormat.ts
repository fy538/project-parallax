/**
 * Number formatting — consistent thousands separators, decimals, and abbreviations.
 *
 * Use these instead of `value.toLocaleString()` or `value.toFixed()` directly so
 * every chart renders numbers the same way: 1,234,567 / 7.4M / 3.2B.
 *
 * Locale defaults to en-US (matches the channel's English narration). Pass an
 * explicit locale for bilingual variants where Chinese number formatting differs.
 */

export type NumberStyle = "decimal" | "abbreviated" | "percent" | "currency";

export interface FormatNumberOptions {
  /** Number of decimals to show. Default: 0 for ints, 1 for floats. */
  decimals?: number;
  /** Style: decimal | abbreviated (1.2M) | percent (38%) | currency ($1.2B) */
  style?: NumberStyle;
  /** Currency code if style="currency". Default "USD". */
  currency?: string;
  /** Locale BCP-47 string. Default "en-US". */
  locale?: string;
  /** Optional prefix prepended to the formatted output. */
  prefix?: string;
  /** Optional suffix appended after the formatted output. */
  suffix?: string;
}

const ABBREV_THRESHOLDS: Array<[number, string]> = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

/**
 * Format a number per the channel's display conventions.
 *
 * Examples:
 *   formatNumber(1234567)           → "1,234,567"
 *   formatNumber(1234567, { style: "abbreviated" })  → "1.2M"
 *   formatNumber(0.382, { style: "percent" })  → "38%"
 *   formatNumber(0.382, { style: "percent", decimals: 1 })  → "38.2%"
 *   formatNumber(1234567, { style: "currency", currency: "USD" })  → "$1,234,567"
 *   formatNumber(1234567000, { style: "currency", style: "abbreviated" }) — combine via prefix
 */
export const formatNumber = (
  value: number,
  options: FormatNumberOptions = {}
): string => {
  const {
    decimals,
    style = "decimal",
    currency = "USD",
    locale = "en-US",
    prefix = "",
    suffix = "",
  } = options;

  if (!Number.isFinite(value)) return `${prefix}${suffix}`;

  let formatted: string;

  if (style === "abbreviated") {
    const abs = Math.abs(value);
    let suffixChar = "";
    let scaled = value;
    for (const [threshold, char] of ABBREV_THRESHOLDS) {
      if (abs >= threshold) {
        scaled = value / threshold;
        suffixChar = char;
        break;
      }
    }
    const d = decimals ?? (Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : 1);
    formatted = scaled.toLocaleString(locale, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }) + suffixChar;
  } else if (style === "percent") {
    const d = decimals ?? 0;
    // Heuristic: if value is in [0,1] treat as fraction; otherwise as already-percent
    const pct = Math.abs(value) <= 1 ? value * 100 : value;
    formatted = pct.toLocaleString(locale, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }) + "%";
  } else if (style === "currency") {
    const d = decimals ?? 0;
    formatted = value.toLocaleString(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  } else {
    // decimal
    const d = decimals ?? (Number.isInteger(value) ? 0 : 1);
    formatted = value.toLocaleString(locale, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  }

  return `${prefix}${formatted}${suffix}`;
};

/**
 * Format an integer count-up value smoothly during animation.
 * Avoids jitter from toFixed/toLocaleString rounding on the same target value.
 *
 * Example for an animated counter:
 *   const display = formatCountUp(currentValue, targetValue, { decimals: 0 });
 */
export const formatCountUp = (
  current: number,
  target: number,
  options: FormatNumberOptions = {}
): string => {
  // If target is integer and within 1 of integer current, lock to integer
  const decimals = options.decimals ?? (Number.isInteger(target) ? 0 : 1);
  const value = decimals === 0 ? Math.round(current) : current;
  return formatNumber(value, { ...options, decimals });
};

/**
 * countUp — animated number counter with formatting.
 *
 * Used by TimeSeriesChart hero stats, SankeyFlow value labels,
 * NetworkDiagram stat callouts, and DataChart value labels.
 *
 * Partially extracted from DataChart's inline counter logic,
 * now available as a shared utility.
 */

import { interpolate, Easing } from "remotion";

// ── Core counter ───────────────────────────────────────────────────────

export interface CountUpOptions {
  /** Start value. Default: 0 */
  from?: number;
  /** Target value */
  to: number;
  /** Frame when counting starts */
  startFrame: number;
  /** Duration of the count-up in frames */
  duration: number;
  /** Current frame */
  frame: number;
  /** Easing function. Default: ease-out cubic */
  easing?: (t: number) => number;
  /**
   * Overshoot: briefly exceed target then settle back.
   * 0 = no overshoot, 0.04 = 4% overshoot. Default: 0.
   */
  overshoot?: number;
  /** Settle duration in frames after overshoot. Default: 9 */
  settleDuration?: number;
}

/**
 * Returns the current display value for an animated counter.
 * Value counts from `from` to `to` over `duration` frames,
 * optionally overshooting then settling back.
 */
export const countUpValue = (options: CountUpOptions): number => {
  const {
    from = 0,
    to,
    startFrame,
    duration,
    frame,
    easing = Easing.out(Easing.cubic),
    overshoot = 0,
    settleDuration = 9,
  } = options;

  if (frame < startFrame) return from;

  const range = to - from;

  if (overshoot > 0) {
    const endFrame = startFrame + duration;
    const settleEnd = endFrame + settleDuration;

    // Phase 1: count up to target + overshoot
    const rawProgress = interpolate(
      frame,
      [startFrame, endFrame, settleEnd],
      [0, 1 + overshoot, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return from + range * Math.min(rawProgress, 1 + overshoot);
  }

  // Simple count-up (no overshoot)
  const progress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing }
  );

  return from + range * progress;
};

// ── Formatting helpers ─────────────────────────────────────────────────

/**
 * Format a number for display in video graphics.
 *
 * Examples:
 *   formatValue(92, { suffix: "%" })          → "92%"
 *   formatValue(165000000000, { compact: true, prefix: "$" })  → "$165B"
 *   formatValue(0.67, { asPercent: true })     → "67%"
 *   formatValue(1234567, { commas: true })     → "1,234,567"
 */
export const formatValue = (
  value: number,
  options?: {
    /** Decimal places. Default: 0 */
    decimals?: number;
    /** Prefix string (e.g., "$", "¥") */
    prefix?: string;
    /** Suffix string (e.g., "%", "nm") */
    suffix?: string;
    /** Use compact notation (K, M, B, T) */
    compact?: boolean;
    /** Multiply by 100 and add %. Overrides suffix. */
    asPercent?: boolean;
    /** Add thousands separators */
    commas?: boolean;
  }
): string => {
  const {
    decimals = 0,
    prefix = "",
    suffix = "",
    compact = false,
    asPercent = false,
    commas = false,
  } = options || {};

  let displayValue = value;
  let displaySuffix = suffix;

  if (asPercent) {
    displayValue = value * 100;
    displaySuffix = "%";
  }

  if (compact) {
    const abs = Math.abs(displayValue);
    if (abs >= 1e12) {
      displayValue = displayValue / 1e12;
      displaySuffix = "T" + displaySuffix;
    } else if (abs >= 1e9) {
      displayValue = displayValue / 1e9;
      displaySuffix = "B" + displaySuffix;
    } else if (abs >= 1e6) {
      displayValue = displayValue / 1e6;
      displaySuffix = "M" + displaySuffix;
    } else if (abs >= 1e3) {
      displayValue = displayValue / 1e3;
      displaySuffix = "K" + displaySuffix;
    }
  }

  let formatted = displayValue.toFixed(decimals);

  if (commas && !compact) {
    const parts = formatted.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    formatted = parts.join(".");
  }

  return `${prefix}${formatted}${displaySuffix}`;
};

/**
 * Depth & shadow utilities.
 *
 * Implements POLISH.md V1-V4: three-layer depth system, content shadows,
 * accent glows, and chart bar gradients.
 *
 * Usage:
 *   import { contentShadow, accentGlow, barGradient, gradientDivider } from "../utils/depth";
 *
 *   <div style={{ boxShadow: contentShadow() }}>...</div>
 *   <div style={{ boxShadow: accentGlow(palette.amber) }}>...</div>
 *   <div style={{ background: barGradient("#3266AD") }}>...</div>
 */

import React from "react";
import { dark, light } from "../design/theme";

// ── Shadow Presets ─────────────────────────────────────────────────────────

/** Subtle lift shadow for content-layer elements (z=1). Per POLISH.md V3. */
export const contentShadow = (isDark: boolean = true): string =>
  isDark
    ? "0 2px 12px rgba(0, 0, 0, 0.25)"
    : "0 1px 8px rgba(0, 0, 0, 0.08)";

/** Medium shadow for highlighted elements. */
export const mediumShadow = (isDark: boolean = true): string =>
  isDark
    ? "0 4px 20px rgba(0, 0, 0, 0.35)"
    : "0 2px 12px rgba(0, 0, 0, 0.12)";

/** Accent glow for key data points (z=2). Color + 25% opacity halo. */
export const accentGlow = (accentColor: string, spread: number = 16): string =>
  `0 0 ${spread}px ${accentColor}40`;

/** Combined content shadow + accent glow for highlighted content elements. */
export const highlightShadow = (
  accentColor: string,
  isDark: boolean = true
): string => `${contentShadow(isDark)}, ${accentGlow(accentColor)}`;

/**
 * Element glow whose intensity scales with a 0–1 weight (e.g. focus/emphasis).
 * Inline replacement for the `boxShadow: \`0 0 ${8 + w * 4}px ${color}60\``
 * pattern repeated in HorizontalTimeline, TimelineMorph, EscalationLadder.
 *
 *   intensity 0   → no glow
 *   intensity 1   → strongest (~12px spread, ~38% alpha)
 */
export const glow = (
  color: string,
  intensity: number = 1,
  baseSpreadPx: number = 8,
  scaleSpreadPx: number = 4,
): string => {
  if (intensity <= 0) return "none";
  const spread = baseSpreadPx + scaleSpreadPx * intensity;
  // 0x60 ≈ 38% alpha. Fades with intensity so a half-emphasized element reads
  // as a softer halo, not a half-bright halo.
  const alphaHex = Math.round(0x60 * intensity).toString(16).padStart(2, "0");
  return `0 0 ${spread}px ${color}${alphaHex}`;
};

/**
 * Stack multiple shadows in one CSS string. Replaces the inline
 * `[contentShadow, glow, mediumShadow].filter(Boolean).join(", ")` pattern.
 * Skip falsy/empty entries. Order matters: top-most shadow is rendered LAST.
 */
export const layeredShadow = (...layers: (string | null | undefined | false)[]): string => {
  const real = layers.filter((s): s is string => Boolean(s) && s !== "none");
  return real.length === 0 ? "none" : real.join(", ");
};

/** Text shadow for body text over dark backgrounds. Per POLISH.md V7. */
export const textShadow = (isDark: boolean = true): string =>
  isDark ? "0 1px 3px rgba(0, 0, 0, 0.5)" : "none";

// ── Gradient Helpers ───────────────────────────────────────────────────────

/**
 * Internal gradient for chart bars. Per POLISH.md V4.
 * Base color at top → 15% darker at bottom, simulating overhead lighting.
 */
export const barGradient = (baseColor: string): string =>
  `linear-gradient(to bottom, ${baseColor}, ${darkenHex(baseColor, 0.15)})`;

/**
 * Gradient divider — full opacity center → transparent edges. Per POLISH.md V5.
 * Returns a CSS background for a horizontal line element.
 */
export const gradientDivider = (
  color: string,
  widthPercent: number = 70
): React.CSSProperties => ({
  height: 2,
  width: `${widthPercent}%`,
  margin: "0 auto",
  background: `linear-gradient(to right, transparent, ${color}, transparent)`,
  border: "none",
});

/**
 * Card container styles — consistent padding + shadow + optional border.
 * Per POLISH.md L3: 24px vertical, 28px horizontal.
 */
export const cardStyle = (
  isDark: boolean = true,
  highlighted: boolean = false
): React.CSSProperties => ({
  padding: "24px 28px",
  borderRadius: 4,
  backgroundColor: isDark ? dark.bg.elevated : light.bg.elevated,
  boxShadow: highlighted
    ? mediumShadow(isDark)
    : contentShadow(isDark),
  border: isDark
    ? `1px solid rgba(255, 255, 255, 0.06)`
    : `1px solid ${light.bg.border}`,
});

// ── Color Math ─────────────────────────────────────────────────────────────

/** Darken a hex color by a percentage (0-1). Simple channel-wise multiply. */
function darkenHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  const dr = Math.round(r * (1 - amount));
  const dg = Math.round(g * (1 - amount));
  const db = Math.round(b * (1 - amount));

  return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`;
}

/** Lighten a hex color by a percentage (0-1). Moves toward white. */
export function lightenHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);

  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

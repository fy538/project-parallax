/**
 * Depth & shadow utilities.
 *
 * Implements POLISH.md V1-V4: three-layer depth system, content shadows,
 * accent glows, and chart bar gradients.
 *
 * Shadow functions are thin delegates to `shadows.*` in theme.ts — that
 * object is the single source of truth for all shadow tokens. Gradient and
 * color-math utilities (barGradient, gradientDivider, lightenHex) live here
 * as they have no parallel in the design system.
 *
 * Usage:
 *   import { contentShadow, accentGlow, barGradient, gradientDivider } from "../utils/depth";
 *
 *   <div style={{ boxShadow: contentShadow() }}>...</div>
 *   <div style={{ boxShadow: accentGlow(palette.amber) }}>...</div>
 *   <div style={{ background: barGradient("#3266AD") }}>...</div>
 *
 * Prefer importing `shadows` directly from theme.ts for new code.
 */

import React from "react";
import { shadows } from "../design/theme";

// ── Shadow Presets — delegates to shadows.* ────────────────────────────────

/** Subtle lift shadow for content-layer elements (z=1). Per POLISH.md V3.
 *  Delegates to `shadows.subtle` / `shadows.subtleLight`. */
export const contentShadow = (isDark: boolean = true): string =>
  isDark ? shadows.subtle : shadows.subtleLight;

/** Medium shadow for highlighted elements.
 *  Delegates to `shadows.medium` / `shadows.mediumLight`. */
export const mediumShadow = (isDark: boolean = true): string =>
  isDark ? shadows.medium : shadows.mediumLight;

/** Accent glow for key data points (z=2). Color + 25% opacity halo.
 *  Delegates to `shadows.accentGlow`. */
export const accentGlow = (accentColor: string, spread: number = 16): string =>
  shadows.accentGlow(accentColor, spread);

/** Combined content shadow + accent glow for highlighted content elements.
 *  Delegates to `shadows.layer(shadows.subtle, shadows.accentGlow(...))`. */
export const highlightShadow = (
  accentColor: string,
  isDark: boolean = true
): string => shadows.layer(contentShadow(isDark), shadows.accentGlow(accentColor));

/** Intensity-scaled glow (0–1). Delegates to `shadows.glow`. */
export const glow = (
  color: string,
  intensity: number = 1,
  baseSpreadPx: number = 8,
  scaleSpreadPx: number = 4,
): string => shadows.glow(color, intensity, baseSpreadPx, scaleSpreadPx);

/** Stack multiple shadows, skipping falsy/"none" entries.
 *  Delegates to `shadows.layer`. */
export const layeredShadow = (...layers: (string | null | undefined | false)[]): string =>
  shadows.layer(...layers);

/** Text shadow for body text over dark backgrounds. Per POLISH.md V7.
 *  Delegates to `shadows.textLift` / `"none"`. */
export const textShadow = (isDark: boolean = true): string =>
  isDark ? shadows.textLift : "none";

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

/**
 * colorContrast — luminance helpers for substrate-contrast validation.
 *
 * Lightweight, allocation-free helpers for catching the "invisible ridge"
 * class of bug: a fill color that has valid syntax, passes Zod schema
 * validation, and renders correctly — but happens to match the paper
 * background so the shape disappears into the substrate.
 *
 * Use case: a template fill (ridge, bar, region) is data-driven and the
 * author can pick any palette token or hex. Static analysis can't tell
 * "bone" is wrong on a paper substrate. These helpers run in render
 * body (always paired with `warnIf` from dataWarnings.ts so the message
 * fires once per mount, not 30× per second).
 */

/**
 * Rec. 709 relative-luminance of a hex color in [0,1].
 *
 * Accepts 3- or 6-digit hex with or without a leading "#". Returns 0.5
 * (mid-gray) as a safe fallback for unparseable strings — callers
 * comparing against this value will see a neutral delta and skip the
 * warning rather than fire a misleading one.
 */
export const hexToLuminance = (hex: string): number => {
  const m = hex.replace("#", "");
  if (m.length !== 3 && m.length !== 6) return 0.5;
  const full =
    m.length === 3
      ? m.split("").map((c) => c + c).join("")
      : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return 0.5;
  }
  // Perceptual luminance (Rec. 709 weights — same model used elsewhere
  // in the codebase, e.g. TilegramUSMap's tile-vs-text contrast pick).
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Absolute luminance delta between two colors, both as hex strings.
 * Returns NaN-safe value in [0,1].
 */
export const contrastDelta = (a: string, b: string): number =>
  Math.abs(hexToLuminance(a) - hexToLuminance(b));

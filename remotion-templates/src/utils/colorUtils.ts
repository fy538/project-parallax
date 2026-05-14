/**
 * Color math utilities — hex parsing, sRGB linear interpolation, darken.
 *
 * Extracted from ChoroplethMap (inline) and MapTitleFrame (inline) so the
 * three SVG-based atlas templates (AtlasPlate, CartogramMap,
 * ProportionalSymbolMap) can share the same primitives for color
 * crossfades and tone-shift utilities. Cheap pure functions; no
 * dependencies.
 *
 * sRGB interpolation is the editorial-friendly choice for *tone-shift*
 * fills (bone → blue, bone → red) — perceptually close to what you'd
 * expect when fading between two atlas-fill colors. For full hue rotations
 * (red ↔ green) HSL interpolation would be closer to perceptual; we don't
 * need that yet (no atlas episode crossfades across the color wheel).
 */

/** Parse a hex color "#RRGGBB" into [r, g, b] tuples in 0..255. */
export function parseHex(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const num = parseInt(m, 16);
  if (Number.isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/** Format an [r, g, b] tuple as "#RRGGBB". */
export function formatHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${((clamp(r) << 16) | (clamp(g) << 8) | clamp(b))
    .toString(16)
    .padStart(6, "0")}`;
}

/**
 * Linear interpolate between two hex colors in sRGB space.
 * `t = 0` → `from`, `t = 1` → `to`. Clamps outside that range.
 *
 * Returns `to` immediately if the strings are identical — saves a parse
 * pass when phase fills don't change for a country across a boundary.
 */
export function lerpHex(from: string, to: string, t: number): string {
  if (from === to) return to;
  const clampedT = Math.max(0, Math.min(1, t));
  const [fr, fg, fb] = parseHex(from);
  const [tr, tg, tb] = parseHex(to);
  return formatHex(
    fr + (tr - fr) * clampedT,
    fg + (tg - fg) * clampedT,
    fb + (tb - fb) * clampedT,
  );
}

/**
 * Multiply each RGB channel by `(1 - amt)` to darken toward black.
 * `amt = 0` → unchanged, `amt = 1` → black.
 */
export function darkenHex(hex: string, amt = 0.05): string {
  const [r, g, b] = parseHex(hex);
  return formatHex(r * (1 - amt), g * (1 - amt), b * (1 - amt));
}

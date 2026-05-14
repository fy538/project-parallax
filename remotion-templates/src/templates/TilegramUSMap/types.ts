/**
 * TilegramUSMap template types.
 *
 * US states rendered as a hex grid where every state is the same size,
 * regardless of geographic area. Each hex tile is one state with its
 * postal abbreviation. Solves the "Wyoming dominates California by area"
 * distortion in the geographic ChoroplethMap.
 *
 * ── When to use this template ─────────────────────────────────────────
 *
 * USE for:
 *   - US electoral / policy stories where every state should weigh equally
 *   - Comparing per-state values (votes, sanction counts, policy adoption)
 *     without geographic-area bias
 *   - "All 50 states" visual checks (does the pattern hold coast-to-coast?)
 *
 * DO NOT USE when:
 *   - The story is about geographic proximity, distance, or borders
 *     (use ChoroplethMap with `albers` projection instead)
 *   - The story is about a single region (use a real-geography map)
 *   - Sub-state geography matters (counties, districts)
 *
 * ── Visual form ──────────────────────────────────────────────────────
 *
 * Hex tiles arranged in a canonical NPR-style grid (50 states + DC).
 * Pointy-top hexagons with odd-row horizontal stagger. Each tile shows
 * the state postal abbreviation. Fill color drawn from a value-to-color
 * scale (diverging or sequential).
 *
 * Editorial precedent: NPR introduced the canonical US hex tilegram in
 * 2015; Bloomberg, the Economist, and FiveThirtyEight have used variants
 * for election coverage and state-by-state policy maps. The form's
 * editorial promise is "every state equal" — don't betray it by adding
 * geographic decoration.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

/**
 * Valid US postal abbreviations (50 states + DC).
 * Used as the union type for tilegram state values.
 */
export type USStateCode =
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "GA"
  | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY" | "LA" | "ME" | "MD"
  | "MA" | "MI" | "MN" | "MS" | "MO" | "MT" | "NE" | "NV" | "NH" | "NJ"
  | "NM" | "NY" | "NC" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI" | "SC"
  | "SD" | "TN" | "TX" | "UT" | "VT" | "VA" | "WA" | "WV" | "WI" | "WY"
  | "DC";

/** A single state's value in the tilegram. */
export interface TilegramStateValue {
  /** US postal abbreviation. */
  state: USStateCode;
  /**
   * Numeric value driving the color scale. For diverging scales, sign
   * matters (negative → low color, positive → high color, ~0 → mid).
   * For sequential scales, magnitude drives intensity.
   */
  value: number;
  /**
   * Optional secondary label drawn beneath the postal abbreviation
   * (e.g., electoral votes "54" under "CA"). Keep to 3-4 chars to
   * stay legible inside the tile.
   */
  label?: string;
  /**
   * Override fill color — when set, bypasses the value-to-color scale.
   * Brand tokens "accent" / "muted" resolve to amber / theme.text.muted.
   */
  color?: string;
}

/** Color-scale configuration for the tilegram. */
export interface TilegramColorScale {
  /** Numeric value mapped to the `low` color end. */
  min: number;
  /** Numeric value mapped to the `high` color end. */
  max: number;
  /** Color at the `min` end. Hex, palette key, or brand token. */
  low: string;
  /** Optional color at the midpoint — when set, scale is diverging. */
  mid?: string;
  /** Color at the `max` end. */
  high: string;
}

/** Full data input for the TilegramUSMap composition. */
export interface TilegramUSMapData {
  /** Episode identifier (e.g., "prisoners-dilemma"). */
  episode: string;
  /** Segment title. */
  title: string;
  /** Optional subtitle. */
  subtitle?: string;

  /** State values. States omitted from this array render with neutral fill. */
  states: TilegramStateValue[];

  /**
   * Color scale. Pass an object for full control, or one of the named
   * presets:
   *   - `"diverging"` — auto-derived from data, blue-to-red around 0.
   *     Right for swing maps, partisan splits, or "above vs below baseline."
   *   - `"sequential"` — auto-derived from data, gold ramp.
   *     Right for intensity-only data (counts, density).
   *
   * Default: `"sequential"`.
   */
  colorScale?: TilegramColorScale | "diverging" | "sequential";

  /**
   * Label rendered above the color legend (e.g., "Electoral votes",
   * "Sanctioned firms"). When omitted, the legend renders without a
   * caption.
   */
  valueLabel?: string;

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  _direction?: DirectionBlock;
}

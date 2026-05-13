/**
 * Types for the IsotypeChart template.
 *
 * Quantities expressed as N repeated icons instead of bars — abstract
 * numbers feel human-scale. "92 of 100 advanced chips come from one
 * company" expressed as 92 chip icons in amber and 8 in muted ink.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export type IsotypeIconType =
  | "person"
  | "soldier"
  | "ship"
  | "plane"
  | "chip"
  | "dollar"
  | "house"
  | "circle";

export interface IsotypeRow {
  label: string;
  total: number;
  highlighted: number;
  color?: string;      // highlighted icon color (defaults to palette.gold)
  mutedColor?: string; // non-highlighted icon color (defaults to palette.ink at 30% opacity)
  icon?: IsotypeIconType;
}

export interface IsotypeChartData {
  episode: string;
  title: string;
  subtitle?: string;
  source?: string;
  durationSec?: number;
  holdAfterRevealSec?: number;
  /**
   * "proportion" — single row showing highlighted/total ratio (e.g. "92 of 100")
   * "comparison" — multiple rows for side-by-side entity comparison
   */
  variant: "proportion" | "comparison";
  /** For proportion variant */
  total?: number;
  highlighted?: number;
  highlightLabel?: string; // e.g. "TSMC" or "advanced"
  totalLabel?: string;     // e.g. "global output"
  /** For comparison variant */
  rows?: IsotypeRow[];
  /** The icon to use (applies to all rows if not overridden per row) */
  icon?: IsotypeIconType;
  /** Size of each icon in px (default 36) */
  iconSize?: number;
  /** Icons per row in the grid (default: auto-computed from total) */
  iconsPerRow?: number;
  /** Legend text below the grid, e.g. "= 1 aircraft carrier" */
  unitLabel?: string;
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

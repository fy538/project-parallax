/**
 * Slopegraph types — Tufte's signature "before/after at two points in time"
 * chart. Each entity has a left value and a right value; a line connects
 * the pair. The SLOPE of the line carries the editorial argument (rose, fell,
 * stayed flat). When most entities trend one direction and one bucks the
 * trend, the slopegraph makes the exception unmistakable.
 *
 * Used for: policy before/after, electoral shifts, sector rebalancing,
 * "which countries moved which direction."
 */

import type { DirectionBlock } from "../../hooks/useDirection";
import type { EditorialFrameProps } from "../../components/EditorialFrame/schema";

export interface SlopegraphEntity {
  label: string;
  leftValue: number;
  rightValue: number;
  /** Hex color override. When omitted, derives from the slope direction
   *  (default neutral; emphasized hero entities get accent). */
  color?: string;
  /** True for the hero entity — rendered with thicker stroke and accent color. */
  hero?: boolean;
}

export interface SlopegraphData {
  episode: string;
  title: string;
  subtitle?: string;
  leftLabel: string;
  rightLabel: string;
  entities: SlopegraphEntity[];
  unit?: string;
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
  frame?: EditorialFrameProps;
  _direction?: DirectionBlock;
}

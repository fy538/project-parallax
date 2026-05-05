/**
 * Data types for the StrategicLandscape template.
 *
 * 2D matrix visualization showing actors/entities positioned on two continuous axes.
 * Actors are rendered as bubbles with labels and optional quadrant annotations.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface Actor {
  name: string;
  nameCn?: string;      // Chinese name
  x: number;            // position 0-100 on X axis
  y: number;            // position 0-100 on Y axis
  size?: number;        // bubble radius multiplier (default 1)
  color?: string;       // override color
  icon?: string;        // optional short label inside bubble (e.g., "US", "CN")
}

export interface StrategicLandscapeData {
  title: string;
  subtitle?: string;
  xAxisLabel: string;       // e.g., "Aggressive"
  xAxisLabelEnd: string;    // e.g., "Cooperative"
  yAxisLabel: string;       // e.g., "Short-term"
  yAxisLabelEnd: string;    // e.g., "Long-term"
  actors: Actor[];
  quadrantLabels?: [string, string, string, string];  // TL, TR, BL, BR
  episode?: string;
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

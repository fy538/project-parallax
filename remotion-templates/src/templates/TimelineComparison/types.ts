/**
 * Data types for the TimelineComparison template.
 *
 * Two parallel timelines (historical + modern) displayed side by side.
 * Events fade in sequentially, visually drawing the parallel.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface TimelineEvent {
  /** Year or date label. */
  year: string;
  /** Short title (1-2 lines max). */
  title: string;
  /** Optional longer description. */
  description?: string;
  /** Accent color override. */
  color?: string;
  /** Icon label (emoji or short text shown in the dot). */
  icon?: string;
}

export interface TimelineComparisonData {
  episode: string;
  /** Title for the left column. */
  leftLabel: string;
  /** Title for the right column. */
  rightLabel: string;
  /** Color accent for left column. */
  leftColor?: string;
  /** Color accent for right column. */
  rightColor?: string;
  /** Events on the left (historical). */
  leftEvents: TimelineEvent[];
  /** Events on the right (modern). */
  rightEvents: TimelineEvent[];
  /** Connecting lines between left[i] and right[i] to show the parallel. */
  connections?: Array<{ leftIndex: number; rightIndex: number; label?: string }>;
  /** Seconds each event is visible before the next appears. */
  secondsPerEvent?: number;
  /** Subtle color tint for emotional temperature (Layer 3). Hex color, e.g. "#3266AD" for US-blue, "#C23B22" for China-red. */
  backgroundTint?: string;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

/**
 * Data types for the RankChangeDotPlot template.
 *
 * "Before → After" ranking chart: each entity has a dot at its before-rank
 * and a dot at its after-rank, connected by a line. Sorted by magnitude of
 * change. Used for "what did policy X change in the rankings?"
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface RankChangeDotPlotItem {
  label: string;
  before: number; // rank or value before (lower = better if ranks, higher = better if values)
  after: number;  // rank or value after
  /**
   * "up"/"down"/"neutral" semantic aliases, or a literal hex/palette color string.
   * If omitted, color is auto-computed from delta direction.
   */
  color?: "up" | "down" | "neutral" | string;
}

export interface RankChangeDotPlotData {
  episode: string;
  title: string;
  subtitle?: string;
  source?: string;
  durationSec?: number;
  holdAfterRevealSec?: number;
  items: RankChangeDotPlotItem[];
  /** Column header for the "before" dot — e.g. "2018" */
  beforeLabel?: string;
  /** Column header for the "after" dot — e.g. "2025" */
  afterLabel?: string;
  /**
   * How to sort items (default "change" — largest absolute delta first):
   * "change" | "after" | "before" | "label"
   */
  sortBy?: "change" | "after" | "before" | "label";
  /** Unit string shown in FooterStrip and value annotations */
  unit?: string;
  /** Item labels to highlight (bolder, full opacity) */
  highlightIds?: string[];
  /**
   * Whether "before" and "after" values are ranks (true = lower is better, rank 1 is best)
   * or plain values (false = higher is better). Affects color-coding direction.
   * Default: true (ranks)
   */
  isRankData?: boolean;
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

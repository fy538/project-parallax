/**
 * KPICard — single hero stat + change indicator + optional inline sparkline.
 *
 * Use for: episode-summary stats, year-over-year movement, forecast vs
 * actual, "the number that matters." Less verbose than DataChart, more
 * editorial than a raw StatReveal.
 */

import type { DirectionBlock } from "../../hooks/useDirection";
import type { EditorialFrameProps } from "../../components/EditorialFrame/schema";

export interface KPICardData {
  episode: string;
  title: string;
  subtitle?: string;
  /** The hero stat value (e.g. "82%", "$890M", "3:1"). */
  value: string;
  /** Optional unit suffix appended after value (e.g. " articles"). */
  unit?: string;
  /**
   * Change indicator — e.g. "+2.4×", "-12%", "↑ 5pp". Rendered to the right
   * of the hero value in a smaller weight. Color derives from direction
   * unless `changeColor` is set explicitly.
   */
  change?: string;
  /** Override the auto-derived change color (default: green ↑ / red ↓). */
  changeColor?: string;
  /** Italic dek beneath the hero stat. */
  context?: string;
  /** Optional inline sparkline beneath the hero stat — pass a numeric series. */
  trend?: number[];
  /** Color for the sparkline stroke (default ink). */
  trendColor?: string;
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
  frame?: EditorialFrameProps;
  _direction?: DirectionBlock;
}

/**
 * StepLine — stepped time-series for discrete/threshold data.
 *
 * Unlike TimeSeriesChart's smooth interpolated lines, StepLine renders each
 * value as a flat horizontal then a vertical jump at the next x position.
 * Correct form for data that changes discretely (interest rates, policy
 * rates, sanctions tiers, regulatory thresholds) where a smooth line would
 * lie about the change being gradual.
 */

import type { DirectionBlock } from "../../hooks/useDirection";
import type { EditorialFrameProps } from "../../components/EditorialFrame/schema";

export interface StepPoint {
  /** X value — typically a date string (YYYY-MM-DD) or year number. */
  x: string | number;
  /** Y value. */
  y: number;
  /** Optional event label (shown as a tick + small annotation at this step). */
  event?: string;
}

export interface StepLineData {
  episode: string;
  title: string;
  subtitle?: string;
  /** Stepped data series. Each point's value holds until the next point. */
  points: StepPoint[];
  /** Line color (default amber). */
  color?: string;
  /** Area fill beneath the steps. */
  areaFill?: boolean;
  areaOpacity?: number;
  xLabel?: string;
  yLabel?: string;
  yUnit?: string;
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
  frame?: EditorialFrameProps;
  _direction?: DirectionBlock;
}

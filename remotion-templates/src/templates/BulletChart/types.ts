/**
 * BulletChart — Stephen Few's "target vs actual + qualitative ranges" form.
 *
 * One horizontal bar per measure. Behind the bar: shaded qualitative ranges
 * (bad / ok / good). On the bar: an actual-value fill. Across the bar: a
 * target marker. Each measure tells the viewer three things at once:
 *   - Where actual sits within the qualitative range
 *   - How actual compares to target
 *   - Where target sits within the qualitative range
 *
 * Use for: forecast accuracy, capacity vs commitment, performance scorecards.
 */

import type { DirectionBlock } from "../../hooks/useDirection";
import type { EditorialFrameProps } from "../../components/EditorialFrame/schema";

export interface BulletMeasure {
  label: string;
  /** Actual achieved value. */
  actual: number;
  /** Target / goal marker. */
  target: number;
  /** Qualitative range upper bounds, ascending — e.g. [50, 75, 100] means
   *  0–50 = bad, 50–75 = ok, 75–100 = good. The largest value is the bar's
   *  max scale. */
  qualitativeRanges: number[];
  /** Override actual-value bar color. */
  color?: string;
}

export interface BulletChartData {
  episode: string;
  title: string;
  subtitle?: string;
  measures: BulletMeasure[];
  unit?: string;
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
  frame?: EditorialFrameProps;
  _direction?: DirectionBlock;
}

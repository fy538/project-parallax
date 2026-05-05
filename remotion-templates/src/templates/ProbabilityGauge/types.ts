/**
 * Data types for the ProbabilityGauge template.
 *
 * Supports three variants:
 *   - gauge: Semi-circular probability arcs with market prices
 *   - shift: Probability transitions (before → after) with triggers
 *   - scorecard: Prediction tracking with calibration stats
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface GaugeItem {
  label: string;
  /** Probability value 0-100 */
  value: number;
  /** Optional color override */
  color?: string;
  /** Optional market source label (e.g., "Kalshi", "Polymarket") */
  marketSource?: string;
}

export interface ShiftItem {
  label: string;
  /** Before probability 0-100 */
  before: number;
  /** After probability 0-100 */
  after: number;
  /** What triggered the shift */
  trigger?: string;
  color?: string;
}

export interface ScorecardItem {
  prediction: string;
  /** Your estimate 0-100 */
  yourEstimate: number;
  /** Market price 0-100 (optional) */
  marketPrice?: number;
  /** Actual outcome: "correct" | "wrong" | "pending" */
  outcome: "correct" | "wrong" | "pending";
}

export interface ProbabilityGaugeData {
  episode: string;
  title: string;
  subtitle?: string;
  variant: "gauge" | "shift" | "scorecard";
  /** For gauge variant — one or more probability arcs */
  gauges?: GaugeItem[];
  /** For shift variant — probability changes */
  shifts?: ShiftItem[];
  /** For scorecard variant — prediction track record */
  scorecard?: ScorecardItem[];
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

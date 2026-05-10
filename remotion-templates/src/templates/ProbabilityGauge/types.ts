/**
 * Data types for the ProbabilityGauge template.
 *
 * Supports four variants:
 *   - gauge: Semi-circular probability arcs (single value, dashboard-style)
 *   - strip: Horizontal probability rule with named markers (multi-source comparison)
 *   - shift: Probability transitions (before → after) with triggers
 *   - scorecard: Prediction tracking with calibration stats
 *
 * Use `strip` whenever you have 2+ sources estimating the same probability.
 * Cleveland & McGill (1984): position-on-a-common-axis is the most accurate
 * visual encoding. Reach for `gauge` only with a single value.
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

/**
 * 6-layer forecast format from CALIBRATION_LANGUAGE.md.
 * All six fields are required — a forecast missing any layer reads as advocacy, not analysis.
 */
export interface ForecastData {
  /** Whole number probability 0–100. Displayed largest on screen. */
  probability: number;
  /** Verbal tag anchored to the number, not replacing it (e.g., "above even odds") */
  verbalTag: string;
  /** Outside view / historical base rate stated first (e.g., "Historical precedent for this class: ~50%") */
  baseRate: string;
  /** Single main case-specific factor pushing the estimate up or down */
  keyDriver: string;
  /** Evidence that would push the estimate in the opposite direction — required for credibility */
  keyDisconfirmer: string;
  /**
   * Prediction market comparison with one-sentence divergence note.
   * Format: "Kalshi: 58% / Metaculus: 61% — Parallax diverges because [reason]"
   */
  benchmark: string;
  /**
   * Clairvoyance-test resolution criteria with specific date.
   * Must be scoreable by a hypothetical person with perfect knowledge of the future.
   */
  resolution: string;
}

export interface ProbabilityGaugeData {
  episode: string;
  title: string;
  subtitle?: string;
  variant: "gauge" | "strip" | "shift" | "scorecard" | "forecast";
  /** For gauge variant — one or more probability arcs */
  gauges?: GaugeItem[];
  /** For shift variant — probability changes */
  shifts?: ShiftItem[];
  /** For scorecard variant — prediction track record */
  scorecard?: ScorecardItem[];
  /** For forecast variant — 6-layer superforecasting display */
  forecast?: ForecastData;
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

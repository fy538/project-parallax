/**
 * BayesianUpdate — animated probability distribution that shifts as evidence arrives.
 *
 * Visualizes Bayesian reasoning: prior belief → evidence → posterior.
 * The distribution curve morphs in real time as evidence cards flip in,
 * making the process of belief updating visible and intuitive.
 *
 * Two variants:
 *   - single: one question with a prior, evidence items, and posterior
 *   - compare: two competing hypotheses updated by the same evidence
 *
 * Serves the "Honest Oracle" identity direction and prediction market layer.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface EvidenceItem {
  /** Short label for the evidence (e.g., "DeepSeek R1 success") */
  label: string;
  /** Direction of the update: does this evidence push probability up or down? */
  direction: "up" | "down";
  /**
   * Magnitude of the shift (1-5 scale).
   * 1 = marginal nudge, 3 = moderate, 5 = dramatic shift.
   */
  magnitude: number;
  /** Optional color override for this evidence card */
  color?: string;
  /** Optional source/date annotation */
  source?: string;
}

export interface HypothesisTrack {
  /** Hypothesis label (e.g., "Controls succeed", "Controls backfire") */
  label: string;
  /** Starting probability (0-100) */
  prior: number;
  /** Color for this track's curve */
  color?: string;
}

export interface BayesianUpdateData {
  episode: string;
  title: string;
  subtitle?: string;

  variant: "single" | "compare" | "multi";

  // ── Single variant ──────────────────────────────────────────────────────
  /** Starting probability (0-100) for single variant */
  prior?: number;
  /** Label for what's being estimated (e.g., "P(export controls succeed)") */
  question?: string;

  // ── Compare variant ─────────────────────────────────────────────────────
  /** Two competing hypotheses for compare variant */
  hypotheses?: [HypothesisTrack, HypothesisTrack];

  // ── Multi variant ─────────────────────────────────────────────────────────
  /** Multiple competing hypotheses for multi variant (3-6 hypotheses) */
  multiHypotheses?: Array<{
    label: string;
    prior: number;        // starting probability (0-100, all should sum to ~100)
    color?: string;
  }>;

  // ── Credible interval bracket ──────────────────────────────────────────────
  /**
   * Credible interval for the posterior distribution, shown as a bracket
   * overlay on the probability axis. E.g. [0.15, 0.45] means the bracket
   * spans 15%–45% of the probability axis.
   */
  credibleInterval?: [number, number];
  /** Label for the credible interval bracket (default: "90% CI") */
  credibleIntervalLabel?: string;

  // ── Shared ──────────────────────────────────────────────────────────────
  /** Evidence items that arrive sequentially, each shifting the distribution */
  evidence: EvidenceItem[];

  /** Optional market price benchmark (shown as vertical reference line) */
  marketPrice?: number;
  /** Market source label (e.g., "Kalshi", "Polymarket") */
  marketSource?: string;

  /** Source attribution */
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

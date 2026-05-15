/**
 * EscalationLadder — vertical event sequence with severity indicators.
 *
 * Shows how situations escalate (or de-escalate) step by step.
 * Each rung has a severity level that maps to a color band,
 * with a connecting line showing progression. Rungs animate in
 * from top to bottom.
 *
 * Supports optional cameraPath for cinematic vertical camera climb
 * that dwells on each rung, progressively increasing tension with
 * color temperature shift and shake at critical thresholds.
 *
 * Use cases: sanctions escalation, crisis timelines, diplomatic
 * deterioration sequences, military posturing chains.
 */

import type { NarratedCameraStep } from "../../hooks/useNarratedCamera";
import type { DirectionBlock } from "../../hooks/useDirection";

export type SeverityLevel =
  | "low"
  | "moderate"
  | "elevated"
  | "high"
  | "critical";

export interface LadderRung {
  /** Event label */
  label: string;
  /** Date or time marker */
  date?: string;
  /** Severity level — determines color coding */
  severity: SeverityLevel;
  /** Optional detail text */
  detail?: string;
  /** Whether this is the current/latest step (shows pulse indicator) */
  current?: boolean;
}

export interface EscalationLadderData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Sequence of events from first to latest */
  rungs: LadderRung[];

  /** Direction of the sequence (default: "escalation") */
  direction?: "escalation" | "de-escalation";

  /**
   * Optional camera path for cinematic vertical climb.
   * When provided, camera dwells on each rung with increasing tension.
   * Shake intensity auto-increases with severity if not specified per step.
   */
  cameraPath?: NarratedCameraStep[];

  /** Show ambient particles (default: true when cameraPath present) */
  ambientParticles?: boolean;

  /** Source attribution */
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";

  /**
   * Fine-tune the ladder block's visual centering. The default centering
   * is geometric (splits surplus area as equal left/right padding), but the
   * visible mass is asymmetric — short dates on the left, longer card text
   * on the right — so the optical center sits slightly left of geometric
   * center. Use this to nudge.
   *
   * - `x`: px to shift right (negative = left)
   * - `y`: px to shift DOWN (negative = up)
   *
   * Typical episode-side values for a 6-rung ladder on a 1920×1080 canvas:
   * `{ x: 100–160, y: -40 to -60 }`. See POLISH.md T6 (Use the canvas).
   */
  contentOffset?: { x?: number; y?: number };

  /**
   * Optional dashed boundary markers rendered between rungs — typically used
   * for doctrinal thresholds like "NUCLEAR THRESHOLD" or "ESCALATION DOMINANCE".
   * Each entry draws a dashed rule after the specified rung with a right-aligned
   * label.
   */
  thresholds?: Array<{
    /**
     * Draw the threshold line AFTER this rung index (0-based).
     * The line appears between rungs[afterRungIndex] and rungs[afterRungIndex + 1].
     */
    afterRungIndex: number;
    /** Label shown at the right end of the rule, e.g. "NUCLEAR THRESHOLD". */
    label: string;
    /**
     * Color for the rule and label. Defaults to the severity color of
     * rungs[afterRungIndex].
     */
    color?: string;
  }>;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

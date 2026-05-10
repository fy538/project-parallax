/**
 * PricingWaterfall — value-chain decomposition.
 *
 * The canonical editorial form for value-capture stories: a fixed total
 * ($1, $5, $100) split into stage segments, with the smallest sliver
 * rendered in accent color so the punchline ("3% to the farmer") lands
 * visually before the viewer reads the number.
 *
 * Use cases: supply-chain margin extraction, where-your-tax-dollar-goes,
 * cost-of-goods decomposition, fair-trade analysis. Outlets that converge
 * on this idiom: FT (iPhone breakdown), Bloomberg Opinion (oil/cocoa),
 * Reuters (commodity pricing), Specialty Coffee Association reports.
 *
 * NOT for: pure sequence-of-stages stories without value math (use
 * FrameworkDiagram flow), or relationship/network structure (use
 * NetworkDiagram).
 */

import type { DirectionBlock } from "../../hooks/useDirection";
import type { MotionIdentity } from "../../design/motion";

export interface PricingWaterfallStage {
  /** Stage name displayed prominently. */
  label: string;
  /** Share of the total, as a percentage (0–100). Stages should sum to ~100. */
  share: number;
  /** Optional descriptor — location, role, or detail (e.g., "Yirgacheffe, Ethiopia"). */
  descriptor?: string;
  /** Mark this stage as the editorial protagonist. Renders in accent color
   *  with a glow + label emphasis. The "3% to the farmer" stage. */
  hero?: boolean;
  /** Optional explicit color override for the segment (otherwise muted bone). */
  color?: string;
}

export interface PricingWaterfallData {
  episode: string;
  title: string;
  subtitle?: string;

  /** The fixed total being decomposed — anchors the viewer. */
  total: {
    /** Display value, e.g. "$5", "100", "1¢". */
    value: string;
    /** Caption, e.g. "of every $5 cup of coffee", "Where each tax dollar goes". */
    label: string;
  };

  /** Stages from origin to destination (Farm → Shop). Rendered bottom-up so
   *  the bar visually "builds" through the chain. */
  stages: PricingWaterfallStage[];

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
  /** Substrate-motion preset (grain + atmosphere + wobble combination).
   *  Default: channel-wide "briefing". See design/motion.ts. */
  motionIdentity?: MotionIdentity;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

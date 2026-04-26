/**
 * Shared types for vertical Shorts compositions (1080×1920).
 *
 * Shorts are 30-60 second vertical videos for TikTok, YouTube Shorts,
 * and Douyin. They share the same data schemas as their landscape
 * counterparts but render in 9:16 with larger text and faster pacing.
 */

// Re-export landscape types — Shorts use the same data schemas
export { QuoteData } from "../KineticTypography/types";
export { DataChartData, DataPoint } from "../DataChart/types";
export { SplitCompositionData, SplitSide } from "../SplitComposition/types";

/** Vertical layout constants — override landscape layout for 9:16 */
export const shortsLayout = {
  width: 1080,
  height: 1920,
  fps: 30,
  /** Tighter safe area for mobile */
  safeArea: { top: 100, right: 48, bottom: 120, left: 48 },
  /** Title area sits higher to avoid mobile UI overlaps */
  titleTop: 160,
  /** Content area starts after title */
  contentTop: 320,
} as const;

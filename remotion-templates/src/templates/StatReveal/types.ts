/**
 * StatReveal — dramatic single-statistic reveal with comparison bars.
 *
 * The hero number counts up from zero, then comparison bars grow in
 * to provide context. Designed for the "holy shit" number moment —
 * when a single data point lands with visceral impact.
 *
 * Example: "$280 billion" counting up, then three bars showing
 * what that figure dwarfs or matches.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface ComparisonBar {
  /** Label for this comparison item */
  label: string;
  /** Numeric value */
  value: number;
  /** Optional color override */
  color?: string;
  /** Optional source annotation */
  source?: string;
}

export interface StatRevealData {
  episode: string;
  title: string;
  subtitle?: string;

  /** The hero statistic — the big number */
  stat: {
    /** The numeric value to count up to */
    value: number;
    /** Prefix before the number (e.g., "$", "¥") */
    prefix?: string;
    /** Suffix after the number (e.g., "B", "%", " million") */
    suffix?: string;
    /** Label below the number explaining what it is */
    label: string;
    /** Number of decimal places (default: 0) */
    decimals?: number;
  };

  /** Comparison bars shown below/beside the hero number */
  comparisons: ComparisonBar[];

  /** Whether the hero stat is the largest value (default: true) */
  heroIsMax?: boolean;

  /** Source attribution */
  source?: string;
  durationSec?: number;
  /** Deliberate pause in seconds after stat and comparisons finish animating, before exit fade. Default: 0. */
  holdAfterRevealSec?: number;
  backgroundVariant?: "dark" | "light";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

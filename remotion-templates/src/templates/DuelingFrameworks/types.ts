/**
 * Type definitions for DuelingFrameworks template.
 *
 * Two frameworks compared head-to-head with animated scoring and verdict phase.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface FrameworkTenet {
  text: string;
  textCn?: string;
}

export interface Framework {
  name: string;
  nameCn?: string;
  color: string; // accent color (hex)
  tenets: FrameworkTenet[];
  score: number; // 0-100 explanatory power
  verdict?: string; // e.g., "Explains escalation logic"
  verdictCn?: string;
}

export interface DuelingFrameworksData {
  title: string;
  titleCn?: string;
  subtitle?: string;
  subtitleCn?: string;
  frameworkA: Framework;
  frameworkB: Framework;
  phenomenon: string; // what's being analyzed
  phenomenonCn?: string;
  verdictLabel?: string; // e.g., "Which lens fits better?"
  verdictLabelCn?: string;
  episode?: string;
  backgroundVariant?: "light" | "dark";
  durationSec?: number;
  /** When true, uses cinematic horizontal camera that tracks between frameworks */
  cinematicMode?: boolean;
  /** Enable ambient particles for depth */
  ambientParticles?: boolean;
  /** Visual card style: "inset" (default bordered cards) | "editorial" (ruled + numbered) | "magazine" (accent sidebar + asymmetric) */
  cardStyle?: "inset" | "editorial" | "magazine";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

/**
 * Data types for the TimelineMorph template.
 *
 * Shows eras morphing into each other — same data structure, animated
 * position/color/label transitions. Events from era A transform into their
 * era B counterparts (e.g., 1941 oil embargo → 2022 chip controls).
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface MorphEvent {
  /** Era A label (e.g., "1941") */
  eraALabel: string;
  /** Era A description */
  eraAText: string;
  /** Era B label (e.g., "2022") */
  eraBLabel: string;
  /** Era B description */
  eraBText: string;
  /** Optional icon */
  icon?: string;
}

export interface TimelineMorphData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Label for era A (e.g., "Imperial Japan, 1941") */
  eraATitle: string;
  /** Label for era B (e.g., "Modern China, 2022") */
  eraBTitle: string;

  /** Color for era A */
  eraAColor?: string;
  /** Color for era B */
  eraBColor?: string;

  /** Paired events that morph from A → B */
  events: MorphEvent[];

  /** How long era A is displayed before morphing begins (seconds) */
  holdDurationSec?: number; // default: 3
  /** How long the morph transition takes (seconds) */
  morphDurationSec?: number; // default: 2

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

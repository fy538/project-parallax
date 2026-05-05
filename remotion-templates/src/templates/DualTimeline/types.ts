/**
 * DualTimeline — Two parallel timelines that alternate focus with cinematic crossfade intercutting.
 *
 * Unlike TimelineComparison (static side-by-side) or TimelineMorph (in-place transform),
 * DualTimeline intercuts between perspectives, showing era A in focus while era B is dimmed,
 * then crossfading to focus on era B.
 *
 * Animation phases:
 * 1. Intro (~1s): Title + era labels fade/slide in. Both timelines visible but dimmed.
 * 2. Era A Focus (~3-4s): Left timeline brightens to full opacity, right dims to 0.2.
 *    Era A events reveal with stagger.
 * 3. Crossfade (~0.5s): Smooth opacity crossfade — left dims, right brightens.
 * 4. Era B Focus (~3-4s): Right timeline at full opacity, left dimmed. Era B events reveal with stagger.
 * 5. Pullback (~1.5s): Both timelines brighten to full. Connecting lines draw between paired events.
 * 6. Exit (0.5s): Exit fade.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface DualTimelineEvent {
  /** Year/label for this event (e.g., "1941" or "2022") */
  label: string;
  /** Event description text */
  text: string;
  /** Chinese translation of text (optional) */
  textCn?: string;
}

export interface DualTimelinePair {
  /** Event from era A */
  eraA: DualTimelineEvent;
  /** Event from era B */
  eraB: DualTimelineEvent;
  /** Optional label for the connecting line (e.g., "Resource denial") */
  connection?: string;
}

export interface DualTimelineData {
  /** Main title (e.g., "The Oil-Chip Parallel") */
  title: string;
  /** Chinese translation of title */
  titleCn?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Label for era A column (e.g., "1940s Pacific") */
  eraATitle: string;
  /** Label for era B column (e.g., "2020s Semiconductors") */
  eraBTitle: string;
  /** Accent color for era A column */
  eraAColor: string;
  /** Accent color for era B column */
  eraBColor: string;
  /** Paired events (each has eraA and eraB counterpart) */
  pairs: DualTimelinePair[];
  /** Episode identifier (e.g., "silicon-trap") */
  episode?: string;
  /** Background variant: "light" or "dark" (default: "light") */
  backgroundVariant?: "light" | "dark";
  /** Total duration in seconds (auto-calculated if not provided) */
  durationSec?: number;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

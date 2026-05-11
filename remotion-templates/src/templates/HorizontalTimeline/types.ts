/**
 * HorizontalTimeline — cinematic horizontal camera track through time.
 *
 * Replaces TimelineComparison, DualTimeline, and TimelineMorph with a single
 * configurable template that uses horizontal camera tracking (Vox/documentary style).
 *
 * Modes:
 * - "single": One timeline spine, events above/below
 * - "dual": Two parallel spines (era A top, era B bottom) with connections
 * - "morph": Single spine, events cross-fade between era A and era B content
 *
 * Camera behaviors:
 * - track: smooth horizontal pan to event (default)
 * - snap: smash zoom/cut to event (dramatic moments)
 * - pullback: zoom out to reveal full timeline
 * - hold: camera stays, content animates (for morph)
 */

import type { DirectionBlock } from "../../hooks/useDirection";

// ── Camera step ────────────────────────────────────────────────────────────

export interface TimelineCameraStep {
  /** Which event to focus on (index into events array, or "pullback" for full view) */
  focus: number | "pullback";
  /** Zoom level: 1.0 = show ~3 events, 1.5 = tight on one, 0.6 = wide pullback */
  zoom: number;
  /** Duration of this step in seconds */
  duration: number;
  /** Camera behavior: how to arrive at this position */
  behavior?: "track" | "snap" | "hold";
  /** Optional overlay label shown during this step */
  label?: string;
  /** Dim non-focused events during this step (default: true) */
  dimOthers?: boolean;
}

// ── Event types ────────────────────────────────────────────────────────────

export interface TimelineEventData {
  /** Year or date label (e.g., "1941", "Oct 1941", "2022 Q4") */
  year: string;
  /** Event title — short, punchy */
  title: string;
  /** Optional description (shown when focused) */
  description?: string;
  /** Optional accent color override for this event */
  color?: string;
  /** Importance weight: affects node size and card prominence (1-3, default 1) */
  weight?: 1 | 2 | 3;
  /** Optional icon/emoji shown in the node marker */
  icon?: string;
}

/** For dual mode: paired events from two eras */
export interface TimelinePairData {
  /** Event from era A (top spine) */
  eraA: TimelineEventData;
  /** Event from era B (bottom spine) */
  eraB: TimelineEventData;
  /** Connection label drawn between paired events (shown on pullback) */
  connection?: string;
  /**
   * Phase position on the shared axis (e.g., week-of-outbreak, year-of-war,
   * months-since-coup). Required when `phaseAxis` is set on the parent data.
   * Both eraA and eraB align at this position — the vertical alignment IS the
   * editorial argument ("peak hospitalization happened at week 7 both times").
   *
   * See: references/template-research/timeline-comparison.md § 3
   */
  phasePosition?: number;
}

/**
 * Configures the shared phase axis for dual-mode timelines.
 *
 * When set, event x-positions are computed from each pair's `phasePosition`
 * value (mapped to the [min, max] range) rather than equal spacing. The
 * axis label and tick marks render at the bottom of the timeline area.
 *
 * This is the canonical Parallax form for historical-parallel visualization:
 * the spatial alignment of events is by phase, not calendar date. Use this
 * whenever the editorial claim is "the shape of this thing rhymes with the
 * shape of that thing." Don't use for absolute-calendar comparisons.
 *
 * See: references/template-research/timeline-comparison.md
 */
export interface PhaseAxisConfig {
  /** Axis label, e.g., "Weeks since outbreak", "Year of revolution". */
  label: string;
  /** Optional unit suffix on tick labels (e.g., "wk", "mo"). */
  unit?: string;
  /** Domain minimum (default: min phasePosition across pairs). */
  min?: number;
  /** Domain maximum (default: max phasePosition across pairs). */
  max?: number;
  /** Explicit tick values; auto-generated from domain if omitted. */
  ticks?: number[];
}

/**
 * For morph mode: events that transform between eras.
 *
 * EDITORIAL GATE — use morph form only for INSTITUTIONAL rhymes (same lever
 * across eras, different machinery: blockade-as-instrument, delegated rule,
 * monetary discipline). Morph implies institutional continuity; using it for
 * coincidental parallels implies a causal connection that doesn't exist.
 *
 * Rule of thumb: if you can't fill in "the same X in different clothing,"
 * use dual mode instead. Morph is a once-per-episode analytical punchline.
 *
 * See: references/template-research/timeline-comparison.md § 6.5
 */
export interface TimelineMorphEventData {
  /** Era A state */
  eraAYear: string;
  eraATitle: string;
  eraADescription?: string;
  /** Era B state (morphs to this) */
  eraBYear: string;
  eraBTitle: string;
  eraBDescription?: string;
  /** Importance weight */
  weight?: 1 | 2 | 3;
}

// ── Main data type ─────────────────────────────────────────────────────────

export interface HorizontalTimelineData {
  /** Composition title */
  title: string;
  /** Chinese translation */
  titleCn?: string;
  /** Optional subtitle */
  subtitle?: string;

  /** Timeline mode */
  mode: "single" | "dual" | "morph";

  // ── Single mode events ──
  /** Events for single-spine mode */
  events?: TimelineEventData[];

  // ── Dual mode events ──
  /** Paired events for dual-spine mode */
  pairs?: TimelinePairData[];
  /** Era A label (e.g., "1940s Pacific") — for dual mode */
  eraATitle?: string;
  /** Era B label (e.g., "2020s Semiconductors") — for dual mode */
  eraBTitle?: string;
  /**
   * Enforce phase-position alignment along a shared x-axis (dual mode only).
   * When set, each pair must declare its `phasePosition` and both eras align
   * at that position. This is the Parallax canonical form — see
   * `references/template-research/timeline-comparison.md`.
   */
  phaseAxis?: PhaseAxisConfig;

  // ── Morph mode events ──
  /** Events that morph between eras */
  morphEvents?: TimelineMorphEventData[];
  /** Era A title for morph header */
  morphEraATitle?: string;
  /** Era B title for morph header */
  morphEraBTitle?: string;

  // ── Styling ──
  /** Primary accent color for era A / single spine (default: brand amber) */
  eraAColor?: string;
  /** Secondary accent color for era B (default: brand rust) */
  eraBColor?: string;
  /** Background variant */
  backgroundVariant?: "light" | "dark";
  /** Background tint color */
  backgroundTint?: string;

  // ── Camera ──
  /** Camera keyframe sequence (auto-generated if omitted) */
  cameraPath?: TimelineCameraStep[];

  // ── Meta ──
  /** Episode identifier */
  episode: string;
  /** Total duration in seconds */
  durationSec?: number;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

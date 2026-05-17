/**
 * Data types for the TitleTransition template.
 *
 * Episode title cards, section dividers, and end cards.
 * Clean, cinematic text with optional subtitle and episode number.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface TitleTransitionData {
  episode: string;

  /**
   * Card type.
   *
   * - `episode-title` — cinematic episode-title card with bloom/lens-focus/beat-sync.
   *   The legacy "high-energy" treatment. Use when the episode warrants a dramatic
   *   open. Silicon-trap and similar editorial-action episodes.
   * - `section` — chapter dividers between acts.
   * - `end-card` — CTA + next-episode teaser.
   * - `editorial-title` — Kicker + Title + Dek three-line stack on paper, fade-only
   *   entrance, measured 2.0s hold, ∴ brand mark in corner. The Atlantic/FT magazine
   *   convention. Default for analytical-essay register (Philosopher's Lens, deep-dive).
   *   See: references/template-research/title-card.md.
   */
  variant: "episode-title" | "section" | "end-card" | "editorial-title";

  // ── Episode title variant ──
  /** Main title (e.g., "The Chip War"). */
  title?: string;
  /** Subtitle (e.g., "When America Tried to Strangle China's AI"). */
  subtitle?: string;
  /** Episode number display (e.g., "EPISODE 01"). */
  episodeLabel?: string;
  /** Series name if applicable. */
  seriesName?: string;

  // ── Editorial title variant ──
  /**
   * Small mono kicker rendered above the title (e.g., "PARALLAX · PHILOSOPHER'S LENS"
   * or "EPISODE 03 · OPENING"). Plex Mono, ink @ 60%.
   *
   * Used only by `editorial-title` variant. Falls back to `seriesName` or
   * `episodeLabel` if not provided, in that order.
   */
  kicker?: string;
  /**
   * Italic serif dek rendered beneath the title — a one-line summary that does
   * the work a punchy title can't (e.g., "Why rational actors choose the worst
   * outcome — and what it takes to escape"). Plex Serif Italic, ink @ 80%.
   *
   * Used only by `editorial-title` variant.
   */
  dek?: string;
  /**
   * Position of the ∴ brand mark on `editorial-title` cards.
   * - "top-right" (default for title cards) — small amber glyph in the corner
   * - "bottom-left" — chapter-card alternative
   * - "none" — suppress entirely (use for section dividers or chapter cards)
   */
  brandMark?: "top-right" | "bottom-left" | "none";

  // ── Section variant ──
  /** Section number (e.g., "I", "II", "III"). */
  sectionNumber?: string;
  /** Section title. */
  sectionTitle?: string;

  // ── End card variant ──
  /** Call-to-action text. */
  ctaText?: string;
  /** Next episode teaser. */
  nextEpisodeTeaser?: string;
  /**
   * Photo / asset credits to surface on the end-card. One line per attribution
   * — typically "Subject — Photographer (License via Source)". Required for
   * CC BY-SA compliance when the episode uses such photos. See
   * `episodes/<slug>/CREDITS.md` for the canonical attribution record.
   *
   * Rendered as a small mono block beneath the next-episode teaser.
   * Only applied when `variant === "end-card"`.
   */
  credits?: string[];

  // ── Styling ──
  accentColor?: string;
  backgroundVariant?: "dark" | "light";
  /** Subtle color tint for emotional temperature (Layer 3). Hex color, e.g. "#3266AD" for US-blue, "#C23B22" for China-red. */
  backgroundTint?: string;
  durationSec?: number;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

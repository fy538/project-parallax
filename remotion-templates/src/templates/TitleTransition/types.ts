/**
 * Data types for the TitleTransition template.
 *
 * Episode title cards, section dividers, and end cards.
 * Clean, cinematic text with optional subtitle and episode number.
 */

export interface TitleTransitionData {
  episode: string;

  /** Card type. */
  variant: "episode-title" | "section" | "end-card";

  // ── Episode title variant ──
  /** Main title (e.g., "The Chip War"). */
  title?: string;
  /** Subtitle (e.g., "When America Tried to Strangle China's AI"). */
  subtitle?: string;
  /** Episode number display (e.g., "EPISODE 01"). */
  episodeLabel?: string;
  /** Series name if applicable. */
  seriesName?: string;

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

  // ── Styling ──
  accentColor?: string;
  backgroundVariant?: "dark" | "light";
  /** Subtle color tint for emotional temperature (Layer 3). Hex color, e.g. "#3266AD" for US-blue, "#C23B22" for China-red. */
  backgroundTint?: string;
  durationSec?: number;
}

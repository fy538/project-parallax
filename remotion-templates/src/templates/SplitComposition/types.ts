/**
 * Data types for the SplitComposition template.
 *
 * Full-bleed vertical split compositions for "Translator" and "Dialectician"
 * format episodes — e.g., left side = Western analytical lens, right side = Chinese
 * analytical lens. Or thesis vs antithesis.
 *
 * Layout: 1920×1080 split vertically down the center (960px divider).
 * Each half has its own subtitle, tag, title, and staggered item list.
 * Center divider with optional label creates the "vs" visual metaphor.
 */

export interface SplitSide {
  title: string;
  subtitle?: string;
  items: string[];
  /** Accent color for this side */
  accentColor?: string;
  /** Background tint — shifts the base background slightly toward this color */
  bgTint?: string;
  /** Optional label at top (e.g., "WESTERN LENS", "THESIS") */
  tag?: string;
}

export interface SplitCompositionData {
  episode: string;
  title: string;
  subtitle?: string;
  left: SplitSide;
  right: SplitSide;
  /** Label on the center divider (default: "vs") */
  dividerLabel?: string;
  /** Hide the divider entirely */
  noDivider?: boolean;
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
}

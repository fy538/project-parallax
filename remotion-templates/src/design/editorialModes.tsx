/**
 * editorialModes — Mode-aware foreground color tokens for EditorialFrame
 * (and any future component that has to read on both light paper and dark
 * backdrops).
 *
 * Why this exists: the Meridian dual-register system (BRAND.md) has Light
 * and Dark moods. Until May 11, 2026 every EditorialFrame text element was
 * hardcoded to `palette.ink` — fine on paper backdrops, ~2:1 contrast on
 * the 9 dark-register backdrops (night-operations, abyss-depth,
 * foundry-ember, city-noir, archive-nocturne, constellation-grid,
 * switchyard-night, rift-silhouette, night-grid).
 *
 * Mode is FULLY DERIVED from the active backdrop's `register` field in
 * `data/backdrop-manifest.json`. No per-segment script tag, no episode
 * toggle. Pick a dark backdrop → text auto-flips to bone.
 *
 * Tokens cover only EditorialFrame today. Other templates (DataChart,
 * KineticTypography, etc.) still hardcode ink and will need similar
 * mode-awareness in follow-up work.
 */

import React from "react";
import { palette } from "./theme";

export type EditorialMode = "light" | "dark";

export interface EditorialModeColors {
  /** Primary body text — hero number, headline, body copy. */
  text: string;
  /** Secondary text — kicker, byline, byline rule (with caller's opacity). */
  textSecondary: string;
  /** Muted text — captions and disabled states (currently unused but reserved). */
  textMuted: string;
  /** Accent — amber/gold, same in both registers (gold reads at ~4:1 on either). */
  accent: string;
  /** Brand mark stroke + glyph. Tracks `text` (full presence) by default. */
  brandMark: string;
  /** Hairline rule / decorative-stroke color. Subtler than text. */
  rule: string;
}

/**
 * Color tokens per editorial mode.
 *
 * Light mode uses ink-on-paper (4.7:1 contrast on palette.paper). Dark mode
 * uses bone-on-near-black (~14:1 on a #1C1814 backdrop) — well above WCAG AA
 * for body copy AND for the small kicker/byline lines. Amber sits at ~4:1 on
 * both surfaces so it works as accent in either register without remapping.
 *
 * Rule color in dark mode is `umber` — warmer than bone, dimmer than text,
 * preserves the hairline-rule visual register without competing with the
 * accent rule (kicker color comes from useEpisodeColorEmphasis and is left
 * untouched; only the byline ink-rule and decorative strokes use this).
 */
export const EDITORIAL_COLORS: Record<EditorialMode, EditorialModeColors> = {
  light: {
    text: palette.ink,
    textSecondary: palette.ink,
    textMuted: palette.walnut,
    accent: palette.gold,
    brandMark: palette.ink,
    rule: palette.ink,
  },
  dark: {
    text: palette.bone,
    textSecondary: palette.bone,
    textMuted: palette.umber,
    accent: palette.gold,
    brandMark: palette.bone,
    rule: palette.umber,
  },
};

/**
 * Convenience: resolve mode tokens. Equivalent to `EDITORIAL_COLORS[mode]`
 * but keeps the call site readable when mode is computed inline.
 */
export const editorialColors = (mode: EditorialMode): EditorialModeColors =>
  EDITORIAL_COLORS[mode];

// ── Context ──────────────────────────────────────────────────────────────────
//
// FullEpisode wraps each segment in an EditorialModeProvider whose value is
// derived from the segment's backdropId → backdrop manifest register lookup.
// Any descendant EditorialFrame (or other mode-aware component) consumes the
// context with `useEditorialMode()`. The default outside any provider is
// `"light"` — preserves pre-May-11 behavior for compositions that don't opt
// into the cascade.

const EditorialModeContext = React.createContext<EditorialMode>("light");

export interface EditorialModeProviderProps {
  mode: EditorialMode;
  children: React.ReactNode;
}

/**
 * Provide an editorial mode to a subtree. Place at the segment-renderer level
 * (FullEpisode) so every descendant template that needs mode-aware tokens can
 * pick it up without prop-drilling.
 */
export const EditorialModeProvider: React.FC<EditorialModeProviderProps> = ({
  mode,
  children,
}) => (
  <EditorialModeContext.Provider value={mode}>
    {children}
  </EditorialModeContext.Provider>
);

/** Read the active editorial mode. Returns `"light"` outside any provider. */
export const useEditorialMode = (): EditorialMode =>
  React.useContext(EditorialModeContext);

// ── Backdrop-register → mode resolver ────────────────────────────────────────

/**
 * Map a backdrop's `register` field to an editorial mode.
 *
 * - `register: "dark"` → `"dark"`
 * - `register: "light"` (or anything else, including `undefined`) → `"light"`
 *
 * Kept as a tiny pure helper so the resolution is testable in isolation and
 * the FullEpisode wiring stays a one-liner.
 */
export const modeFromBackdropRegister = (
  register: "light" | "dark" | undefined | null,
): EditorialMode => (register === "dark" ? "dark" : "light");

/**
 * Per-Episode Color Emphasis Hook
 *
 * React context + hook that lets Remotion templates consume the per-episode
 * color emphasis specified in `assembly-manifest.json` (or the episode's
 * `visual-identity.json`). Mirrors the per-typography palette emphasis
 * architecture in `tools/recraft/recraft.py` for AI-generated content,
 * creating per-episode visual unity between the AI-generated cover
 * illustrations (Registers 2/3) and the Remotion analytical inside-layout
 * (Register 1).
 *
 * Usage in templates:
 *   const emphasis = useEpisodeColorEmphasis();
 *   <Bar fill={emphasis.primaryAccent} />
 *
 * Usage in FullEpisode.tsx (and any composition that wraps templates):
 *   <EpisodeColorEmphasisProvider value={manifest.episodeColorEmphasis ?? "neutral"}>
 *     {children}
 *   </EpisodeColorEmphasisProvider>
 *
 * Standalone template renders (e.g., `npx remotion still`) inherit the
 * provider's default value via `getEpisodeColorEmphasis(undefined)`,
 * which returns the neutral emphasis (full palette, amber accents).
 * This preserves backward compatibility — existing data files render
 * identically until an episode opts in to non-neutral emphasis.
 *
 * See:
 *   - remotion-templates/BRAND.md → "Per-Episode Color Emphasis"
 *   - remotion-templates/src/design/theme.ts → getEpisodeColorEmphasis
 *   - data/visual-identity.schema.json → episodeColorEmphasis field
 */

import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  type EpisodeColorEmphasis,
  type PaletteEmphasis,
  getEpisodeColorEmphasis,
} from "../design/theme";

// ── Context ─────────────────────────────────────────────────────────────────

const EpisodeColorEmphasisContext = createContext<PaletteEmphasis>(
  getEpisodeColorEmphasis("neutral")
);

EpisodeColorEmphasisContext.displayName = "EpisodeColorEmphasisContext";

// ── Provider ────────────────────────────────────────────────────────────────

export interface EpisodeColorEmphasisProviderProps {
  /**
   * The episode's color emphasis. Reads from `manifest.episodeColorEmphasis`
   * in FullEpisode.tsx; defaults to "neutral" if unset.
   */
  value: EpisodeColorEmphasis | string | undefined | null;
  children: ReactNode;
}

export const EpisodeColorEmphasisProvider: React.FC<EpisodeColorEmphasisProviderProps> = ({
  value,
  children,
}) => {
  const emphasis = useMemo(() => getEpisodeColorEmphasis(value), [value]);
  return (
    <EpisodeColorEmphasisContext.Provider value={emphasis}>
      {children}
    </EpisodeColorEmphasisContext.Provider>
  );
};

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Consume the current episode's color emphasis.
 *
 * Returns a PaletteEmphasis object with primaryAccent, secondaryAccent,
 * dominantText, surfaceTone, and chartFillSequence. Templates use these
 * instead of pulling directly from the full palette.
 *
 * Falls back to neutral emphasis when called outside a provider — standalone
 * template renders get the channel default automatically.
 */
export function useEpisodeColorEmphasis(): PaletteEmphasis {
  return useContext(EpisodeColorEmphasisContext);
}

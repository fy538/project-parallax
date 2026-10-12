/**
 * useChromeLevel — how much brand chrome the surrounding episode wants.
 *
 *   "briefing" (default) — the intelligence-briefing strips as designed for
 *     the geopolitics episodes: wordmark + slug in the header, REC timer and
 *     FILED date in the footer, slug watermark on text cards.
 *   "wordmark" — the wordmark alone. No slug, no REC timer, no FILED date,
 *     no watermark. For essays where the briefing frame is off-register.
 *
 * Chrome components read this instead of taking a prop, because HeaderStrip
 * and FooterStrip are rendered explicitly by ~85 templates. An episode opts in
 * by wrapping its composition:
 *
 *   <ChromeLevelProvider level="wordmark"><FullEpisode … /></ChromeLevelProvider>
 */

import React, { createContext, useContext } from "react";

export type ChromeLevel = "briefing" | "wordmark";

const ChromeLevelContext = createContext<ChromeLevel>("briefing");

export const ChromeLevelProvider: React.FC<{
  level: ChromeLevel;
  children: React.ReactNode;
}> = ({ level, children }) => (
  <ChromeLevelContext.Provider value={level}>{children}</ChromeLevelContext.Provider>
);

export const useChromeLevel = (): ChromeLevel => useContext(ChromeLevelContext);

/**
 * Renders its children only at chrome level "briefing". Wrap a template's
 * episode-slug watermark in this so "wordmark" episodes drop it.
 */
export const SlugGate: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  useChromeLevel() === "briefing" ? <>{children}</> : null;

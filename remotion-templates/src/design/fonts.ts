/**
 * Font preloading — ensures all Meridian brand fonts are loaded
 * before the first frame renders.
 *
 * Uses @remotion/google-fonts for reliable font delivery.
 * Import this file in Root.tsx to trigger preloading.
 *
 * Font mapping (matches theme.ts font families):
 *   - Space Grotesk → display, heading
 *   - IBM Plex Mono → body, metadata
 *   - JetBrains Mono → data, mono
 *   - Noto Sans SC → Chinese text
 */

import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadNotoSansSC } from "@remotion/google-fonts/NotoSansSC";

// Load all weights/styles for each font (no args = load everything)
const { fontFamily: spaceGrotesk } = loadSpaceGrotesk();
const { fontFamily: ibmPlexMono } = loadIBMPlexMono();
const { fontFamily: jetBrainsMono } = loadJetBrainsMono();
// NOTE: Don't pass `subsets` here. Google Fonts now chunks Noto Sans SC's
// CJK glyphs across many numeric subsets ([4], [5], [21]-[91], [97]-[119], etc.)
// while still listing "chinese-simplified" as a subset *name* — passing that
// name throws "weight: 400 subset: chinese-simplified is not available."
// Letting the loader pull all subsets for the requested weights is the
// reliable path. ignoreTooManyRequestsWarning suppresses the perf warning.
const { fontFamily: notoSansSC } = loadNotoSansSC("normal", {
  weights: ["400", "700"],
  ignoreTooManyRequestsWarning: true,
});

/**
 * Loaded font family strings — use these if you need the exact
 * @font-face family name (includes quotes and fallback).
 * In practice, theme.ts font names already match Google Fonts naming.
 */
export const loadedFonts = {
  display: spaceGrotesk,
  body: ibmPlexMono,
  data: jetBrainsMono,
  chinese: notoSansSC,
} as const;

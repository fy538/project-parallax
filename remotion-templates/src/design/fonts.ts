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
 *   - Noto Sans SC → Chinese text (chinese-state emphasis)
 *
 * Emphasis-specific fonts (mirror recraft.py text_treatment voices for
 * EMPHASIS_MAP entries in theme.ts — needed because the original chains
 * lead with macOS-native fonts (PingFang SC, Songti SC, Hiragino Kaku
 * Gothic ProN) that don't exist on Linux render hosts (CI, Lambda) and
 * silently fall through to generic sans-serif/serif:
 *   - Noto Serif SC → chinese-traditional (Songti substitute)
 *   - Noto Sans JP  → japanese-showa     (Hiragino Kaku Gothic substitute)
 *   - Oswald        → soviet             (Rodchenko/Klutsis condensed weight)
 */

import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadNotoSansSC } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadNotoSerifSC } from "@remotion/google-fonts/NotoSerifSC";
import { loadFont as loadNotoSansJP } from "@remotion/google-fonts/NotoSansJP";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";

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
const { fontFamily: notoSerifSC } = loadNotoSerifSC("normal", {
  weights: ["400", "700"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: notoSansJP } = loadNotoSansJP("normal", {
  weights: ["400", "700"],
  ignoreTooManyRequestsWarning: true,
});
// Oswald ships only a normal-style condensed sans; weight 700 covers the
// heavy poster voice. Single subset (latin) is enough — used for soviet
// emphasis display only, not for body/data text.
const { fontFamily: oswald } = loadOswald("normal", {
  weights: ["500", "700"],
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
  chineseSerif: notoSerifSC,
  japanese: notoSansJP,
  sovietDisplay: oswald,
} as const;

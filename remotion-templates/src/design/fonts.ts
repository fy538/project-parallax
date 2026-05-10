/**
 * Font preloading — ensures all Meridian brand fonts are loaded
 * before the first frame renders.
 *
 * Uses @remotion/google-fonts for reliable font delivery.
 * Import this file in Root.tsx to trigger preloading.
 *
 * Font mapping (matches theme.ts font families):
 *   - IBM Plex Sans  → display, heading (was Space Grotesk pre-May 10, 2026)
 *   - IBM Plex Serif → long-form body / editorial-register passages
 *   - IBM Plex Mono  → body metadata, kicker, byline, axis labels
 *   - JetBrains Mono → data, code, mono fallback
 *   - Noto Sans SC   → Chinese text (chinese-state emphasis)
 *
 * The Plex superfamily (Sans + Serif + Mono, all by Bold Monday for IBM, 2017)
 * was designed as a coherent system honoring Paul Rand's mid-century IBM
 * corporate-modernist heritage. Plex Sans is explicitly Franklin Gothic-derived,
 * which is the actual lineage Burtin and Beall set Fortune magazine in during
 * 1945-55 — the Bauhaus → Swiss → mid-century editorial register Parallax is
 * reaching for. See BRAND.md → Typography for the May 10, 2026 Space Grotesk
 * → Plex Sans migration rationale.
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

import { loadFont as loadIBMPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadIBMPlexSerif } from "@remotion/google-fonts/IBMPlexSerif";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadNotoSansSC } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadNotoSerifSC } from "@remotion/google-fonts/NotoSerifSC";
import { loadFont as loadNotoSansJP } from "@remotion/google-fonts/NotoSansJP";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";

// Constrain Latin fonts to the weights we actually use in templates. The
// default "load everything" path triggers dozens of network requests per font
// in render tests and floods QA output with perf warnings.
const commonLatinWeights = ["400", "500", "600", "700"] as const;
const { fontFamily: ibmPlexSans } = loadIBMPlexSans("normal", {
  weights: [...commonLatinWeights],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: ibmPlexSerif } = loadIBMPlexSerif("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: ibmPlexMono } = loadIBMPlexMono("normal", {
  weights: [...commonLatinWeights],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: jetBrainsMono } = loadJetBrainsMono("normal", {
  weights: [...commonLatinWeights],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
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
  display: ibmPlexSans,
  serifBody: ibmPlexSerif,
  body: ibmPlexMono,
  data: jetBrainsMono,
  chinese: notoSansSC,
  chineseSerif: notoSerifSC,
  japanese: notoSansJP,
  sovietDisplay: oswald,
} as const;

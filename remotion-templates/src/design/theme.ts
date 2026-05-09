/**
 * Channel design system — Meridian.
 *
 * Canonical code implementation of BRAND.md.
 * Every template pulls colors, fonts, spacing, and timing from here
 * so the visual identity stays consistent across episodes.
 *
 * Two registers: Dark (cinematic, in-video) and Light (editorial, title cards).
 * Both share the same palette DNA, type pair, and compositional rules.
 *
 * Last synced with BRAND.md: April 26, 2026
 */

// ── Shared Palette ─────────────────────────────────────────────────────────
// Loaded from palette.json (single source of truth for all color tooling).
// Direction A: Monochrome Warm ramp + muted semantics + gold accent.
// Python tools (treat.py, treat_video.py, check.py) read the same file.
// To change a color: edit palette.json → regenerate LUTs → Remotion picks it up automatically.

import paletteData from "../../../tools/brand-treatment/palette.json";

export const palette = {
  ink: paletteData.palette.ink,
  midnight: paletteData.palette.midnight,
  walnut: paletteData.palette.walnut,
  umber: paletteData.palette.umber,
  taupe: paletteData.palette.taupe,
  sand: paletteData.palette.sand,
  bone: paletteData.palette.bone,
  paper: paletteData.palette.paper,
  gold: paletteData.palette.gold,
  // Legacy aliases — keep for backward compat during migration
  amber: paletteData.palette.gold,
  rust: paletteData.semantic.china,
  folder: paletteData.palette.sand,
  oxblood: paletteData.palette.walnut,
  olive: paletteData.palette.umber,
  bronze: paletteData.palette.umber,
} as const;

// ── Semantic Colors (Geopolitical) ─────────────────────────────────────────
// Direction A: 3 colors only. All at matched muted saturation (~40-50%).
// Hierarchy comes from size/position, not color intensity.

export const semantic = {
  us: paletteData.semantic.us,        // #4A7BA7 — muted blue
  china: paletteData.semantic.china,   // #A64D46 — muted rust-red
  neutral: paletteData.semantic.neutral, // #888780
  // Legacy aliases — map to closest Direction A equivalent
  highlight: paletteData.palette.gold,
  success: paletteData.semantic.us,
  danger: paletteData.semantic.china,
} as const;

// ── Per-Episode Color Emphasis ─────────────────────────────────────────────
// Mirrors the per-typography palette emphasis architecture in tools/recraft/
// recraft.py for AI-generated content. The brand palette range stays constant
// (palette.json above); what varies per episode is which subset of the palette
// gets foregrounded for chart fills, accent labels, and highlight elements.
// This creates per-episode visual unity between AI-generated cover illustrations
// (Registers 2 and 3) and Remotion analytical inside-layout (Register 1).
//
// See BRAND.md → "Per-Episode Color Emphasis" section for the editorial
// rationale, the emphasis values, and which templates consume this.
//
// The emphasis is read from the assembly manifest's `episodeColorEmphasis`
// field (or from episodes/<slug>/visual-identity.json). Templates consume
// `getEpisodeColorEmphasis(emphasis)` instead of pulling from the full
// palette directly.

export type EpisodeColorEmphasis =
  | "neutral"
  | "soviet"
  | "american-modernist"
  | "chinese-state"
  | "chinese-traditional"
  | "japanese-showa";

export interface PaletteEmphasis {
  /** Primary accent — used for highlight elements, key data points, hero callouts. */
  primaryAccent: string;
  /** Secondary accent — used for secondary highlights, alternative emphasis. */
  secondaryAccent: string;
  /** Dominant text color for accented text elements (overrides default amber/oxblood). */
  dominantText: string;
  /** Surface tone for elevated surfaces or filled panels. */
  surfaceTone: string;
  /** Sequential color stops for multi-series chart fills (5-stop gradient or categorical sequence). */
  chartFillSequence: readonly string[];
  /**
   * Optional display-font override for titles + hero text. When set, takes
   * precedence over `fonts.heading` in TitleBlock. Mirrors the
   * `text_treatment` axis in tools/recraft/recraft.py — same emphasis name
   * should produce typographic voice continuity between AI cover art and
   * Remotion overlays. Falls back to channel default when undefined.
   *
   * Note: emphasis-specific FOSS fallbacks (Noto Sans SC, Noto Serif SC,
   * Noto Sans JP, Oswald) are preloaded via design/fonts.ts so the
   * typographic voice survives on Linux render hosts (CI, Lambda) that
   * don't ship macOS-native faces (PingFang SC, Songti SC, Hiragino Kaku
   * Gothic ProN, Helvetica Neue). macOS-native names lead each chain
   * for preview parity; the Google-Fonts substitute sits next so the
   * render doesn't degrade to a generic sans-serif/serif.
   */
  displayFont?: string;
  /**
   * Optional body-font override. Currently exposed but only opt-in;
   * TitleBlock uses displayFont. Future templates can read this for
   * subtitle/body emphasis when the editorial voice calls for it.
   */
  bodyFont?: string;
}

const EMPHASIS_MAP: Record<EpisodeColorEmphasis, PaletteEmphasis> = {
  // Default — channel-wide American/British/Bauhaus-leaning soft modernist
  // baseline. Backward compatible with existing data files that don't
  // specify emphasis. Bilateral US/China content that needs explicit actor
  // colors should pull from `semantic.us` / `semantic.china` directly per
  // BRAND.md Color Assignment Rule 1; this chartFillSequence is for
  // non-bilateral multi-series content where actor coloring is not the
  // editorial point. Leads with soft amber/umber/walnut palette so that
  // episodes without specific cultural geography don't pull rust prominently
  // by default. Per VIS-11 and the May 4 risk-mitigation calibration: the
  // channel default should NOT lean Soviet revolutionary-rust intensity
  // when no cultural context warrants it.
  neutral: {
    primaryAccent: palette.gold,           // amber/gold (channel default accent)
    secondaryAccent: palette.umber,
    dominantText: palette.gold,
    surfaceTone: palette.bone,
    chartFillSequence: [
      palette.gold,                        // soft amber primary
      palette.umber,                       // earthy brown
      palette.walnut,                      // deep brown
      palette.taupe,                       // warm tan
      palette.sand,                        // soft cream
      semantic.us,                         // US blue (only when explicitly bilateral)
      semantic.china,                      // rust (only when explicitly bilateral)
    ],
  },
  // Soviet/Russian content — full saturated revolutionary palette
  // mirrors text_treatment: russian_constructivist (rust + gold + ink + bone)
  soviet: {
    primaryAccent: semantic.china,         // rust as primary (revolutionary intensity)
    secondaryAccent: palette.gold,
    dominantText: semantic.china,
    surfaceTone: palette.bone,
    chartFillSequence: [
      semantic.china,                      // rust dominant
      palette.gold,                        // gold accent
      palette.ink,
      palette.umber,
      palette.walnut,
      palette.taupe,
    ],
    // Heavy condensed sans approximating Rodchenko/Klutsis poster
    // typography. Oswald is preloaded via design/fonts.ts (FOSS, Google
    // Fonts) so the Rodchenko voice survives on Linux render hosts where
    // Helvetica Neue isn't available; Helvetica Neue stays in the chain
    // for macOS preview parity, then bold Space Grotesk as last resort.
    displayFont: 'Oswald, "Helvetica Neue", "Arial Black", "Space Grotesk", Inter, sans-serif',
  },
  // American mid-century / contemporary tech — softer subset
  // mirrors text_treatment: english_modernist (walnut + umber + gold + bone)
  // rust as sparing accent only, NOT dominant. Saul Bass / Push Pin restraint.
  "american-modernist": {
    primaryAccent: palette.gold,           // gold/amber as primary, restrained
    secondaryAccent: palette.walnut,
    dominantText: palette.walnut,
    surfaceTone: palette.bone,
    chartFillSequence: [
      palette.walnut,                      // walnut + umber dominant
      palette.umber,
      palette.gold,
      palette.taupe,
      palette.sand,
      semantic.china,                      // rust ONLY as last/sparing accent
    ],
  },
  // Chinese contemporary state — Chinese vermillion (lacquer-influenced,
  // distinct from Soviet crimson), more saturated golden-yellow, deep ink
  // mirrors text_treatment: chinese_propaganda
  "chinese-state": {
    primaryAccent: semantic.china,         // vermillion (palette.json's china is closest)
    secondaryAccent: palette.gold,
    dominantText: palette.ink,
    surfaceTone: palette.paper,            // ivory paper background
    chartFillSequence: [
      semantic.china,                      // vermillion
      palette.gold,                        // gold/yellow more prominent
      palette.ink,                         // calligraphic black
      palette.umber,
      palette.walnut,
      palette.bone,
    ],
    // Heiti (黑体) sans for CJK-aware text rendering. PingFang SC is
    // macOS-native; Noto Sans SC is preloaded via design/fonts.ts so the
    // Heiti voice survives on Linux render hosts that don't ship PingFang.
    displayFont: '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Space Grotesk", sans-serif',
  },
  // Pre-revolutionary Chinese / classical — ink wash dominant
  // mirrors text_treatment: chinese_traditional (literati restraint)
  "chinese-traditional": {
    primaryAccent: palette.ink,            // ink dominant
    secondaryAccent: palette.walnut,       // sparse red seal substitute
    dominantText: palette.ink,
    surfaceTone: palette.paper,
    chartFillSequence: [
      palette.ink,                         // ink wash dominant
      palette.walnut,
      palette.umber,
      palette.taupe,
      palette.bone,
      palette.paper,
    ],
    // Songti (宋体) serif for literati/classical voice — calligraphic
    // weight, contrast strokes. Songti SC / STSong are macOS-native;
    // Noto Serif SC is preloaded via design/fonts.ts so the literati
    // serif voice survives on Linux render hosts.
    displayFont: '"Songti SC", "STSong", "Noto Serif SC", "Source Han Serif SC", "Hiragino Mincho ProN", Georgia, serif',
  },
  // Japanese Showa-era (1930s-40s) — minimal palette, 2-3 colors
  // mirrors text_treatment: japanese_showa
  "japanese-showa": {
    primaryAccent: semantic.china,         // bold red (Showa-era red)
    secondaryAccent: palette.ink,
    dominantText: palette.ink,
    surfaceTone: palette.bone,             // cream
    chartFillSequence: [
      semantic.china,                      // red
      palette.ink,                         // black
      palette.bone,                        // cream
      palette.umber,                       // single warm tone for variation
      palette.walnut,
      palette.taupe,
    ],
    // Hiragino Kaku Gothic for Japanese sans-serif voice — minimalist
    // Showa-era poster typography. Hiragino is macOS-native, Yu Gothic
    // is Windows; Noto Sans JP is preloaded via design/fonts.ts so the
    // JP gothic voice survives on Linux render hosts.
    displayFont: '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", "Helvetica Neue", sans-serif',
  },
};

/**
 * Returns the palette emphasis for a given episode color emphasis value.
 * Falls back to "neutral" (full brand palette, amber accents) if emphasis is
 * unknown or unset. This preserves backward compatibility with existing data
 * files that don't specify emphasis.
 *
 * Templates should consume this via the `useEpisodeColorEmphasis()` hook
 * (which reads the manifest's `episodeColorEmphasis` field) rather than
 * calling this function directly with a hardcoded value.
 */
export function getEpisodeColorEmphasis(
  emphasis: EpisodeColorEmphasis | string | undefined | null
): PaletteEmphasis {
  if (!emphasis || !(emphasis in EMPHASIS_MAP)) {
    return EMPHASIS_MAP.neutral;
  }
  return EMPHASIS_MAP[emphasis as EpisodeColorEmphasis];
}

/**
 * The full set of valid emphasis values. Use for runtime validation or to
 * iterate (e.g., generating reference renders for each emphasis).
 */
export const EMPHASIS_VALUES = Object.keys(EMPHASIS_MAP) as readonly EpisodeColorEmphasis[];

// ── Animation Timing Tokens ────────────────────────────────────────────────
// Named primitives for entrance, exit, stagger, and hold durations. Use
// these instead of raw `sec(0.X)` literals so motion stays consistent
// across templates and is tunable from one place. The `sec()` helper
// converts seconds to frames at the project's fps; `secValue` is the
// raw seconds (use this when you need a number, not a frame count).
//
// Example migration:
//   const fadeStart = sec(0.5);    // before
//   const fadeStart = timing.entrance.medium;  // after — same value, named meaning
//
// Adopt incrementally — `sec(0.X)` calls still work, just gradually
// replace them when touching a template.
export const timing = {
  entrance: {
    snap: 6,       // sec(0.2) — instant micro-reveals, axis ticks, grid lines
    fast: 9,       // sec(0.3) — secondary elements, subtle reveals
    crisp: 12,     // sec(0.4) — chart bars, labels — crisper than medium
    medium: 15,    // sec(0.5) — default for most chart elements
    slow: 24,      // sec(0.8) — hero moments, dramatic reveals
  },
  exit: {
    quick: 9,      // sec(0.3) — fast fade-out, e.g. for chart segments
    medium: 15,    // sec(0.5) — default exit
    slow: 24,      // sec(0.8) — graceful departure
  },
  stagger: {
    tight: 2,      // sec(0.08) — close stagger between sibling elements
    normal: 5,     // sec(0.15) — default stagger
    loose: 9,      // sec(0.3) — narrative-paced sibling staggers
  },
  hold: {
    short: 18,     // sec(0.6) — brief settle time
    medium: 36,    // sec(1.2) — meaningful dwell on a value
    long: 75,      // sec(2.5) — let viewer absorb
  },
} as const;

// ── Categorical Palette ────────────────────────────────────────────────────
// Distinct hues for multi-series charts when data doesn't specify per-element
// colors. Kept narrow (6 entries) so individual hues remain memorable rather
// than blurring into a bouquet. Order chosen so adjacent indices contrast
// (blue → rust → gold) — sequential indexing produces high-contrast chart
// visuals instead of degrading to one-color-per-side.
//
// Use via `getCategoricalColor(index)` — wraps around for >6 series.
//
// This replaces the universal `color || palette.amber` fallback that made
// undecorated multi-series charts go monochrome.
export const categorical = [
  paletteData.semantic.us,        // muted blue
  paletteData.semantic.china,     // muted rust
  paletteData.palette.gold,       // gold
  paletteData.palette.umber,      // earthy brown
  paletteData.palette.walnut,     // deep brown
  paletteData.palette.taupe,      // warm tan
] as const;

/**
 * Categorical color for series index `i`. Wraps when i exceeds the
 * sequence length so an arbitrary number of series each get a color.
 */
export function getCategoricalColor(i: number): string {
  return categorical[((i % categorical.length) + categorical.length) % categorical.length];
}

// ── Sequential Ramps (light → dark) ──────────────────────────────────────

export const ramps = {
  warm: paletteData.ramps.warm as readonly string[],
  blue: paletteData.ramps.blue as readonly string[],
  red: paletteData.ramps.red as readonly string[],
  gold: paletteData.ramps.gold as readonly string[],
  gray: paletteData.ramps.gray as readonly string[],
  // Legacy alias
  amber: paletteData.ramps.gold as readonly string[],
} as const;

// ── Mode Tokens ────────────────────────────────────────────────────────────

export const dark = {
  bg: {
    base: "#12100E",
    surface: palette.ink,      // #1C1814
    elevated: palette.midnight, // #2A2520
    map: "#1A1612",
  },
  text: {
    primary: palette.sand,     // #D9C9B0 — warm, readable
    secondary: palette.taupe,  // #B8A189
    muted: palette.umber,      // #8B7355
    accent: palette.gold,      // #C4A747 — hero moments only
  },
  accent: palette.gold,
  mark: palette.gold,          // ∴ brand mark
  crosshair: palette.gold,
  crosshairOpacity: 0.5,
  shadow: "0 2px 12px rgba(0,0,0,0.25)",
} as const;

export const light = {
  bg: {
    base: palette.paper,       // #F5F0E8
    surface: "#EDE7DB",
    elevated: "#FFFFFF",
    border: palette.sand,      // #D9C9B0
    map: "#EDE7DB",
  },
  text: {
    primary: palette.ink,      // #1C1814
    secondary: palette.walnut, // #5C4A3D
    muted: palette.umber,      // #8B7355
    accent: palette.walnut,    // #5C4A3D — warm, restrained
  },
  accent: palette.walnut,
  mark: palette.umber,         // ∴ brand mark — warm brown
  crosshair: palette.walnut,
  crosshairOpacity: 0.35,
  shadow: "0 1px 8px rgba(0,0,0,0.08)",
} as const;

// Convenience type for templates that accept either mode
export type Mode = "dark" | "light";

// ── Typography ─────────────────────────────────────────────────────────────

export const fonts = {
  display: "Space Grotesk, Inter, Arial, sans-serif",
  heading: "Space Grotesk, Inter, Arial, sans-serif", // alias for display
  body: "IBM Plex Mono, JetBrains Mono, Menlo, monospace",
  data: "JetBrains Mono, Menlo, monospace",
  mono: "IBM Plex Mono, JetBrains Mono, Menlo, monospace", // alias for body
  chinese: "Noto Sans SC, PingFang SC, sans-serif",
} as const;

export const fontSizes = {
  display: 96,
  title: 64, // alias for h1
  h1: 64,
  h2: 48,
  h3: 36,
  body: 22,
  label: 18,
  caption: 14,
  meta: 11,
  // legacy aliases
  small: 14,
} as const;

export const fontWeights = {
  bold: 700,
  semibold: 600,
  medium: 500,
  regular: 400,
} as const;

export const letterSpacing = {
  display: 3,
  h1: 2,
  h2: 2,
  h3: 1.5,
  body: 0,
  label: 1,
  caption: 0.5,
  meta: 2.5, // 2-3px range
} as const;

export const lineHeight = {
  display: 1.0,
  h1: 1.1,
  h2: 1.1,
  h3: 1.2,
  body: 1.5,
  label: 1.2,
  caption: 1.4,
  meta: 1.0,
} as const;

// ── Bilingual Typography ──────────────────────────────────────────────────
// CJK text needs looser line height and slightly larger sizes for readability.
// Use these when rendering Chinese text alongside English.

export const cjk = {
  /** CJK font sizes — 10-15% larger than EN equivalents for optical balance */
  fontSizes: {
    display: 108,
    h1: 72,
    h2: 54,
    h3: 40,
    body: 24,
    label: 20,
    caption: 16,
  },
  /** CJK line heights — looser than EN for stroke clarity */
  lineHeight: {
    display: 1.1,
    h1: 1.2,
    h2: 1.2,
    h3: 1.3,
    body: 1.7,
    label: 1.3,
    caption: 1.5,
  },
  /** CJK letter spacing — tighter than EN (characters are self-spacing) */
  letterSpacing: {
    display: 4,
    h1: 3,
    h2: 2,
    h3: 1,
    body: 0,
    label: 0.5,
    caption: 0,
  },
} as const;

// ── Layout ─────────────────────────────────────────────────────────────────

export const layout = {
  width: 1920,
  height: 1080,
  fps: 30,
  padding: 80,
  safeArea: { top: 80, right: 80, bottom: 80, left: 80 },
  /**
   * Tiered safe areas for different template densities.
   * Templates that feel cramped should use safeAreaTier.generous.
   * Templates with centered single-element layouts can use safeAreaTier.tight.
   *
   * "standard" (80px)  — default, matches existing safeArea
   * "generous" (120px) — data-dense templates, many labels near edges
   * "tight" (48px)     — centered compositions (KineticTypography, TitleTransition)
   * "broadcast" (108px) — matches TV broadcast safe (10% inset)
   */
  safeAreaTier: {
    tight:     { top: 48, right: 48, bottom: 48, left: 48 },
    standard:  { top: 80, right: 80, bottom: 80, left: 80 },
    broadcast: { top: 108, right: 108, bottom: 108, left: 108 },
    generous:  { top: 120, right: 120, bottom: 120, left: 120 },
  },
  // 8px spacing grid
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64,
    xxxl: 80,
  },
  // Thumbnail
  thumbnail: { width: 1280, height: 720 },
  // Social crops
  social: {
    youtube: { width: 1280, height: 720 },
    instagram: { width: 1080, height: 1080 },
    tiktok: { width: 1080, height: 1920 },
    community: { width: 1200, height: 675 },
  },
} as const;

// ── Timing ─────────────────────────────────────────────────────────────────

export const sec = (s: number): number => Math.round(s * layout.fps);

export const durations = {
  // Crosshair animation
  hairlinesExtend: sec(0.2),
  outerCircleDraw: sec(0.3),
  innerCircleAppear: sec(0.2),
  crosshairTrack: sec(0.7), // 600-800ms
  lockOnPulse: sec(0.2),

  // General
  fadeIn: sec(0.5),
  fadeOut: sec(0.5),
  quickFade: sec(0.3),
  beatPause: sec(1),
  sectionTransition: sec(1.5),
  mapZoom: sec(2),
  chartGrow: sec(1.5),
  textReveal: sec(0.8),

  // Per-element entrance durations (ms for spring config)
  titleEnter: 500, // 400-600ms
  sectionNumber: 300,
  chartBar: 650, // 500-800ms
  dataLabel: 250, // 200-300ms
  mapCountry: 350, // 300-400ms
  timelineEvent: 400,
  frameworkItem: 350,
  routeSegment: 800, // 600-1000ms
} as const;

// Stagger delays (ms)
export const staggers = {
  dense: 50, // dense lists
  medium: 100, // default
  sparse: 150, // hero elements, lines of title text
  route: 200, // route segments
} as const;

/** Mapbox GL configuration — see NEW_TEMPLATES_SPEC.md Section 0. */
export const mapConfig = {
  /** Light mode is primary. Replace with custom Meridian Light style after Mapbox Studio setup. */
  styleUrl: "mapbox://styles/mapbox/light-v11",
  /** Dark fallback for optional dark-mode compositions. */
  darkStyleUrl: "mapbox://styles/mapbox/dark-v11",
  terrain: {
    source: "mapbox-dem" as const,
    exaggeration: 1.5,
  },
  defaultCamera: {
    longitude: 20,
    latitude: 25,
    zoom: 1.8,
    pitch: 30,
    bearing: 0,
  },
  /** Globe projection for wide shots (zoom < 3). */
  projection: "globe" as const,
  /** Meridian Light palette mapping for custom Mapbox Studio style. */
  styleColors: {
    ocean: "#E4DDD3",
    land: light.bg.base,
    landBorder: "#D4CAB8",
    waterLabel: "#8A8070",
    countryLabel: palette.ink,
  },
  /** Dark palette mapping (secondary). */
  darkStyleColors: {
    ocean: "#100E0C",
    land: palette.ink,
    landBorder: "#3A3530",
    waterLabel: "#5A5448",
    countryLabel: palette.bone,
  },
} as const;

// ── Duotone Ramps (Image Treatment Pipeline) ──────────────────────────────

export const duotone = {
  standard: {
    shadows: palette.ink,
    midtones: palette.umber,
    highlights: palette.gold,
  },
  conflict: {
    shadows: palette.ink,
    midtones: "#7A2E1A",
    highlights: semantic.china,
  },
  editorial: {
    shadows: palette.taupe,
    midtones: palette.bone,
    highlights: palette.paper,
  },
} as const;

// ── Border Radius Scale ──────────────────────────────────────────────────
export const radii = {
  xs: 2,    // bar chart top corners, progress bars
  sm: 4,    // small UI elements, chart axis ticks
  md: 6,    // matrix cells, sankey nodes
  lg: 8,    // cards, panels, decision nodes (default)
  pill: 20, // badges, status pills
} as const;

// ── Card Style Presets ───────────────────────────────────────────────────
// Hierarchy-aware card system. Container treatment scales with content importance:
//   hero → standard → supporting → bare text (no container)
//
// Principle: cinema uses shadows, tints, and negative space to define
// composition. Visible border-radius boxes = PowerPoint. Earn your edges.
//
// Default for most content: "inset" (pressed-into-paper, editorial).
// Hero moments: "accentEdge" (left accent line + tint).
// Floating overlays: "shadowFloat" (depth without edges).

export const cardPresets = {
  // ── Hierarchy tier: HERO ────────────────────────────────────────────────
  // For highlighted events, key moments, active states.
  // Accent edge + warm tint = strongest visual weight.

  /** Accent edge — left line + tinted background. Hero treatment.
   *  The accent line signals "this matters." No full border. */
  accentEdge: (color: string, isDark: boolean = false) => ({
    backgroundColor: isDark ? `${color}12` : `${color}0A`,  // 7% / 4%
    border: "none",
    borderLeft: `2px solid ${color}80`,  // 50% opacity
    borderRadius: radii.xs,  // 2px — editorial, not UI-kit
    padding: cardPadding.css,
    overflow: "hidden" as const,
    overflowWrap: "break-word" as const,
  }),

  // ── Hierarchy tier: STANDARD ────────────────────────────────────────────
  // For most content cards. Subtle, non-competing, editorial.

  /** Inset — pressed-into-paper effect. Default card style.
   *  Tinted background + border + inner shadow = clear containment.
   *  Body cards must have EQUAL or MORE visual definition than titles. */
  inset: (isDark: boolean) => ({
    backgroundColor: isDark ? "rgba(0,0,0,0.10)" : "rgba(0,0,0,0.04)",
    border: isDark
      ? "0.5px solid rgba(255,255,255,0.08)"
      : "0.5px solid rgba(0,0,0,0.10)",
    borderRadius: radii.xs,  // 2px
    padding: cardPadding.css,
    boxShadow: isDark
      ? "inset 0 1px 4px rgba(0,0,0,0.35), inset 0 0 1px rgba(0,0,0,0.20)"
      : "inset 0 1px 3px rgba(0,0,0,0.06), inset 0 0 1px rgba(0,0,0,0.03)",
    overflow: "hidden" as const,
    overflowWrap: "break-word" as const,
  }),

  /** Shadow float — depth without edges. No border at all.
   *  Layered soft shadows create presence. Modern, Apple-esque.
   *  Best for: floating data cards, tooltips, stat callouts. */
  shadowFloat: (isDark: boolean) => ({
    backgroundColor: isDark ? "rgba(42,37,32,0.85)" : "rgba(255,255,255,0.75)",
    border: "none",
    borderRadius: radii.sm,  // 4px
    padding: cardPadding.css,
    boxShadow: isDark
      ? "0 8px 24px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)"
      : "0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
    overflow: "hidden" as const,
    overflowWrap: "break-word" as const,
  }),

  // ── Hierarchy tier: SUPPORTING ──────────────────────────────────────────
  // For secondary content. Barely-there containers.

  /** Minimal — bottom separator only. Lightest possible container.
   *  Content earns its space through typography, not boxing. */
  minimal: (color: string) => ({
    backgroundColor: "transparent",
    border: "none",
    borderBottom: `0.5px solid ${color}14`, // 8% opacity
    borderRadius: 0,
    padding: cardPadding.css,
    overflow: "hidden" as const,
    overflowWrap: "break-word" as const,
  }),

  /** Ruled — horizontal top/bottom lines only. Editorial, print-inspired.
   *  For lists and secondary information. */
  ruled: (color: string) => ({
    backgroundColor: "transparent",
    border: "none",
    borderTop: `0.5px solid ${color}20`,    // 12% opacity
    borderBottom: `0.5px solid ${color}20`,
    borderRadius: 0,
    padding: cardPadding.css,
    overflow: "hidden" as const,
    overflowWrap: "break-word" as const,
  }),

  // ── Special purpose ─────────────────────────────────────────────────────

  /** Glass — semi-transparent backdrop. For overlays on imagery/maps.
   *  Subtle border provides edge definition against busy backgrounds. */
  glass: (bgColor: string, isDark: boolean) => ({
    backgroundColor: isDark ? `${bgColor}26` : `${bgColor}99`,
    border: `0.5px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
    borderRadius: radii.sm,  // 4px
    padding: cardPadding.css,
    overflow: "hidden" as const,
    overflowWrap: "break-word" as const,
  }),

  /** Elevated panel — floating container with background fill + shadow.
   *  For: tooltips, popovers, stat panels that need separation. */
  elevated: (modeTokens: typeof dark | typeof light) => ({
    backgroundColor: modeTokens.bg.elevated,
    border: `0.5px solid rgba(128,128,128,0.04)`,
    borderRadius: radii.sm,  // 4px
    padding: cardPadding.css,
    boxShadow: modeTokens.shadow,
    overflow: "hidden" as const,
    overflowWrap: "break-word" as const,
  }),

  // ── Legacy (backward compat) ────────────────────────────────────────────

  /** Outlined — DEPRECATED. Thin border + transparent bg.
   *  Reads as PowerPoint. Use inset or accentEdge instead.
   *  Kept for backward compatibility during migration. */
  outlined: (color: string) => ({
    backgroundColor: "transparent",
    border: `0.5px solid ${color}14`,  // reduced from 1px/16% to 0.5px/8%
    borderRadius: radii.xs,  // reduced from 8px to 2px
    padding: cardPadding.css,
    overflow: "hidden" as const,
    overflowWrap: "break-word" as const,
  }),
} as const;

// ── Bar Style ────────────────────────────────────────────────────────────
export const barStyle = {
  borderRadius: `${radii.sm}px ${radii.sm}px 0 0`,
  labelOffset: 8,  // px above bar for value label
  gap: 12,         // px between bars
} as const;

// ── Badge Style ──────────────────────────────────────────────────────────
export const badgeStyle = {
  borderRadius: radii.pill,
  paddingH: 14,
  paddingV: 6,
  borderOpacity: 0.2,  // subtle border, no colored fill
} as const;

// ── Divider Style ────────────────────────────────────────────────────────
export const dividerStyle = {
  thickness: 1,
  opacity: 0.2,
} as const;

// ── Depth System ───────────────────────────────────────────────────────────

export const depth = {
  background: { zIndex: 0, shadow: "none" },
  content: { zIndex: 1, shadow: "0 2px 12px rgba(0,0,0,0.25)" },
  accent: (accentColor: string) => ({
    zIndex: 2,
    shadow: `0 0 16px ${accentColor}40`,
  }),
} as const;

// ── Shadow Tokens (POLISH.md V3) ──────────────────────────────────────────

export const shadows = {
  /** Barely visible lift — default for cards, chart bars, framework nodes */
  subtle: "0 2px 12px rgba(0,0,0,0.25)",
  /** Highlighted elements — active states, hovered items */
  medium: "0 4px 20px rgba(0,0,0,0.35)",
  /** Colored halo — key data, active map countries. Pass accent color. */
  accentGlow: (color: string) => `0 0 16px ${color}40`,
  /** Tighter halo for mid-sized glowing elements */
  accentGlowMd: (color: string) => `0 0 12px ${color}40`,
  /** Subtle halo for small labels and icon badges */
  accentGlowSm: (color: string) => `0 0 8px ${color}40`,
  /** Text lift on dark backgrounds (POLISH.md V7) */
  textLift: "0 1px 3px rgba(0,0,0,0.5)",
} as const;

// ── Gradient Helpers (POLISH.md V2, V4) ────────────────────────────────────

export const gradients = {
  /** Dark mode background vignette (V2) — secondary use */
  darkVignette: `radial-gradient(ellipse at center, ${dark.bg.surface} 0%, ${dark.bg.base} 100%)`,
  /** Linear gradient slightly lighter at top (V2 alt for charts) — secondary use */
  darkLinear: `linear-gradient(180deg, ${dark.bg.surface} 0%, ${dark.bg.base} 100%)`,
  /** Light mode subtle surface gradient (primary) */
  lightSurface: `linear-gradient(180deg, ${light.bg.base} 0%, ${light.bg.surface} 100%)`,
  /** Internal bar gradient — base color at top, 15% darker at bottom (V4) */
  barFill: (baseColor: string) =>
    `linear-gradient(180deg, ${baseColor} 0%, ${baseColor}D9 100%)`,
  /** Divider fade: full opacity center, transparent edges (V5) */
  dividerFade: (color: string) =>
    `linear-gradient(90deg, transparent 0%, ${color} 20%, ${color} 80%, transparent 100%)`,
} as const;

// ── Crosshair Config ───────────────────────────────────────────────────────

export const crosshair = {
  outerStroke: 0.8,
  innerStroke: 0.5,
  hairlineStroke: 0.4,
  springConfig: { damping: 14, mass: 1.0 },
} as const;

// ── Layout Primitives (POLISH.md enforcement) ─────────────────────────────
// These helpers make spacing violations hard by computing derived values
// from the canonical tokens above. Templates consume these instead of
// inventing their own magic numbers.

/**
 * Title block height estimate by variant.
 * Used to compute where content starts below the title.
 */
export const titleHeight = {
  /** Episode title (label + series + title + divider + subtitle) */
  episode: 220,
  /** Section title (number + title + underline) */
  section: 160,
  /** Chart/diagram title (h2 + optional subtitle) — safe for 2-line titles (two-line title + subtitle ≈ 147px) */
  content: 150,
  /** Minimal (single line h3) */
  minimal: 56,
} as const;

/**
 * Content area — the usable rectangle after safe area + title gap.
 * Every template should position its main content within this rect.
 *
 * Usage: const area = contentArea("content");
 *        <div style={{ top: area.top, left: area.left, width: area.width, height: area.height }}>
 */
export const contentArea = (
  titleVariant: keyof typeof titleHeight = "content",
  // L69: generous (120px) is the channel-wide default. Templates that need
  // a different tier must opt in explicitly (centered-only → "tight", etc.).
  safeAreaTier: keyof typeof layout.safeAreaTier = "generous"
) => {
  const safe = layout.safeAreaTier[safeAreaTier];
  const top =
    safe.top + titleHeight[titleVariant] + layout.spacing.xl; // 48px title-to-content gap
  const left = safe.left;
  const right = safe.right;
  const bottom = safe.bottom;
  return {
    top,
    left,
    right,
    bottom,
    width: layout.width - left - right,
    height: layout.height - top - bottom,
  } as const;
};

/**
 * Column layout — computes column widths and gap for N-column layouts.
 * Gap defaults to layout.spacing.xl (48px). Columns are equal width.
 *
 * Usage: const cols = columnLayout(2);
 *        // cols.columnWidth = 796, cols.gap = 48, cols.columns = 2
 */
export const columnLayout = (
  columns: number,
  opts?: {
    /** Override the gap between columns. Default: layout.spacing.xl (48) */
    gap?: number;
    /** Title variant to compute available height. Default: "content" */
    titleVariant?: keyof typeof titleHeight;
    /** Safe area tier — MUST match TitleBlock's safeAreaTier to avoid overlap. Default: "generous" (channel-wide standard per L69). */
    safeAreaTier?: keyof typeof layout.safeAreaTier;
  }
) => {
  const gap = opts?.gap ?? layout.spacing.xl;
  const area = contentArea(opts?.titleVariant ?? "content", opts?.safeAreaTier ?? "generous");
  const totalGapWidth = gap * (columns - 1);
  const columnWidth = Math.floor((area.width - totalGapWidth) / columns);
  return {
    columns,
    columnWidth,
    gap,
    totalWidth: columnWidth * columns + totalGapWidth,
    ...area,
  } as const;
};

/**
 * Text safety — CSS properties to prevent text from being cut off at edges.
 * Apply these to any text container that might grow beyond its allocated space.
 *
 * Usage:
 *   <div style={{ ...textSafe.clamp(2) }}>Long text here</div>
 *   <div style={{ ...textSafe.ellipsis }}>Single line that might overflow</div>
 *   <div style={{ ...textSafe.wrap }}>Multi-line text in a bounded box</div>
 */
export const textSafe = {
  /** Single-line ellipsis truncation */
  ellipsis: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  /** Multi-line wrap with word-break safety */
  wrap: {
    overflow: "hidden",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  } as React.CSSProperties,

  /** Line-clamped text (N visible lines, then ellipsis) */
  clamp: (lines: number): React.CSSProperties => ({
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
  }),

  /** Ensure element stays within safe area regardless of content */
  bounded: {
    maxWidth: `calc(100% - ${layout.safeArea.left + layout.safeArea.right}px)`,
    overflow: "hidden",
  } as React.CSSProperties,
} as const;

/**
 * Map camera presets — regional zooms so compositions don't default to
 * showing two dots on opposite sides of a globe.
 * Zoom levels: 1.5 = globe, 3 = continent, 4-5 = region, 6+ = country.
 */
export const cameraPresets = {
  globe: { longitude: 20, latitude: 20, zoom: 1.5, pitch: 20, bearing: 0 },
  eastAsia: { longitude: 116, latitude: 32, zoom: 4, pitch: 30, bearing: 0 },
  china: { longitude: 104, latitude: 35, zoom: 4.5, pitch: 30, bearing: 0 },
  taiwan: { longitude: 121, latitude: 23.5, zoom: 7, pitch: 35, bearing: 0 },
  usPacific: {
    longitude: -160,
    latitude: 25,
    zoom: 2.5,
    pitch: 25,
    bearing: 0,
  },
  transatlantic: {
    longitude: -30,
    latitude: 40,
    zoom: 2.5,
    pitch: 20,
    bearing: 0,
  },
  europe: { longitude: 15, latitude: 50, zoom: 4, pitch: 25, bearing: 0 },
  middleEast: { longitude: 45, latitude: 30, zoom: 4.5, pitch: 30, bearing: 0 },
  semiconductorBelt: {
    longitude: 125,
    latitude: 28,
    zoom: 3.5,
    pitch: 30,
    bearing: 10,
  },
} as const;

/**
 * Text constraints — maxWidth values for text at each tier to prevent
 * overflow and ensure readability.
 */
export const textMaxWidth = {
  /** Hero title, episode title */
  h1: 1400,
  /** Section title, chart title */
  h2: 1200,
  /** Subsection, card header */
  h3: 900,
  /** Body text, descriptions */
  body: 1100,
  /** Labels, captions in constrained containers */
  label: 600,
  /** Node/cell text in diagrams */
  node: 280,
} as const;

/**
 * Card padding — consistent inner padding for all card-like containers
 * (framework nodes, timeline events, chart legends, info panels).
 * POLISH.md L3: 24px vertical, 28px horizontal.
 * Rounded to 8px grid: 24 × 32.
 */
export const cardPadding = {
  vertical: layout.spacing.md, // 24
  horizontal: layout.spacing.lg, // 32
  css: `${layout.spacing.md}px ${layout.spacing.lg}px`,
} as const;

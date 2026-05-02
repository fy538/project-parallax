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
// Brand DNA — these work across both dark and light modes.

export const palette = {
  ink: "#1C1814",
  midnight: "#2A2520",
  amber: "#E5A544",
  rust: "#C23B22",
  bone: "#F0E6D0",
  paper: "#F5F0E8",
  folder: "#C8B89A",
  oxblood: "#6B1D1D",
  olive: "#4A5A24",
  bronze: "#8B5E2B",
} as const;

// ── Semantic Colors (Geopolitical) ─────────────────────────────────────────

export const semantic = {
  us: "#3266AD",
  china: "#C23B22", // = palette.rust
  neutral: "#888780",
  highlight: "#F5A623", // close to amber
  success: "#5DAA68",
  danger: "#D64545",
} as const;

// ── Sequential Ramps (5-stop, light → dark) ───────────────────────────────

export const ramps = {
  blue: ["#E6F1FB", "#85B7EB", "#378ADD", "#185FA5", "#042C53"] as const,
  red: ["#FCEBEB", "#F09595", "#E24B4A", "#A32D2D", "#501313"] as const,
  amber: ["#FFF3D6", "#F5D78E", "#E5A544", "#B07A28", "#5C3F12"] as const,
  gray: ["#F1EFE8", "#B4B2A9", "#888780", "#5F5E5A", "#2C2C2A"] as const,
} as const;

// ── Mode Tokens ────────────────────────────────────────────────────────────

export const dark = {
  bg: {
    base: "#12100E",
    surface: "#1C1814", // = palette.ink
    elevated: "#2A2520", // = palette.midnight
    map: "#1A1612",
  },
  text: {
    primary: "#F0E6D0", // = palette.bone
    secondary: "#B8AE9C",
    muted: "#7A6E60",
    accent: "#E5A544", // = palette.amber
  },
  accent: palette.amber,
  mark: palette.amber, // ∴ brand mark
  crosshair: palette.amber,
  crosshairOpacity: 0.5, // 40-60% range
  shadow: "0 2px 12px rgba(0,0,0,0.25)",
} as const;

export const light = {
  bg: {
    base: "#F5F0E8", // = palette.paper
    surface: "#EDE7DB",
    elevated: "#FFFFFF",
    border: "#D4CAB8",
    map: "#EDE7DB", // light map background (= surface)
  },
  text: {
    primary: "#1C1814", // = palette.ink
    secondary: "#4A4538",
    muted: "#8A8070",
    accent: "#6B1D1D", // = palette.oxblood
  },
  accent: palette.oxblood,
  mark: palette.oxblood, // ∴ brand mark
  crosshair: palette.oxblood,
  crosshairOpacity: 0.35, // 30-40% range
  shadow: "0 1px 8px rgba(0,0,0,0.08)",
} as const;

// Convenience type for templates that accept either mode
export type Mode = "dark" | "light";
export const modes = { dark, light } as const;

// ── Backward Compat ────────────────────────────────────────────────────────
// Old token names → new. Keeps existing templates running while we migrate.
// TODO: remove once all templates reference palette/dark/light directly.

export const colors = {
  navy: palette.ink,
  teal: palette.amber, // closest accent replacement
  slate: palette.midnight,
  warmGray: palette.bone,
  white: "#FFFFFF",

  us: semantic.us,
  china: semantic.china,
  neutral: semantic.neutral,
  highlight: semantic.highlight,
  success: semantic.success,
  danger: semantic.danger,

  rampBlue: [...ramps.blue],
  rampRed: [...ramps.red],
  rampTeal: [...ramps.amber], // replaced teal ramp with amber
  rampGray: [...ramps.gray],

  bgDark: dark.bg.base,
  bgLight: light.bg.base,
  bgMap: light.bg.map,
  bgMapLight: light.bg.surface,

  textPrimary: light.text.primary,
  textSecondary: light.text.secondary,
  textOnDark: dark.text.primary,
  textMuted: light.text.muted,
} as const;

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

// ── Layout ─────────────────────────────────────────────────────────────────

export const layout = {
  width: 1920,
  height: 1080,
  fps: 30,
  padding: 80,
  safeArea: { top: 80, right: 80, bottom: 80, left: 80 },
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

// ── Map Defaults ───────────────────────────────────────────────────────────

export const mapDefaults = {
  projection: "geoMercator" as const,
  projectionConfig: {
    scale: 150,
    center: [0, 20] as [number, number],
  },
  defaultFill: ramps.gray[1],
  hoverFill: ramps.gray[2],
  strokeColor: dark.bg.map,
  strokeWidth: 0.5,
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
    midtones: palette.bronze,
    highlights: palette.amber,
  },
  conflict: {
    shadows: palette.ink,
    midtones: "#7A2E1A",
    highlights: palette.rust,
  },
  editorial: {
    shadows: palette.folder,
    midtones: palette.bone,
    highlights: palette.paper,
  },
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
  /** Chart/diagram title (h2 + optional subtitle) */
  content: 92,
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
  titleVariant: keyof typeof titleHeight = "content"
) => {
  const top =
    layout.safeArea.top + titleHeight[titleVariant] + layout.spacing.xl; // 48px title-to-content gap
  const left = layout.safeArea.left;
  const right = layout.safeArea.right;
  const bottom = layout.safeArea.bottom;
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
  }
) => {
  const gap = opts?.gap ?? layout.spacing.xl;
  const area = contentArea(opts?.titleVariant ?? "content");
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

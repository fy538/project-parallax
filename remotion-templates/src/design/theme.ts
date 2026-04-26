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
  ink: "#1A1A2E",
  midnight: "#252540",
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
    base: "#0D0D1A",
    surface: "#1A1A2E", // = palette.ink
    elevated: "#252540", // = palette.midnight
    map: "#141428",
  },
  text: {
    primary: "#F0E6D0", // = palette.bone
    secondary: "#B8AE9C",
    muted: "#6A6458",
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
  },
  text: {
    primary: "#1A1A2E", // = palette.ink
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
  bgMap: dark.bg.map,
  bgMapLight: light.bg.surface,

  textPrimary: dark.text.primary,
  textSecondary: dark.text.secondary,
  textOnDark: dark.text.primary,
  textMuted: dark.text.muted,
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

// ── Crosshair Config ───────────────────────────────────────────────────────

export const crosshair = {
  outerStroke: 0.8,
  innerStroke: 0.5,
  hairlineStroke: 0.4,
  springConfig: { damping: 14, mass: 1.0 },
} as const;

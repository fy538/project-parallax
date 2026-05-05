/**
 * FilmOverlayPresets — named configurations for the FilmOverlay component.
 *
 * Used by:
 * - Assembly manifest: filmOverlay.preset field references these by name
 * - visual-spec skill: recommends preset per episode mood
 * - Manual composition wrapping
 *
 * Each preset specifies which effects to enable and at what intensity.
 * Presets are designed to layer well with the Meridian brand system.
 */

export interface FilmOverlayPreset {
  /** Human-readable name */
  name: string;
  /** Description of when to use this preset */
  description: string;
  /** Effects to enable */
  effects: Array<"grain" | "vignette" | "light-leak" | "dust" | "scratch" | "flicker">;
  /** Overall intensity (0-1) */
  intensity: number;
}

/**
 * Preset library — 5 standard looks covering the full cinematic spectrum.
 */
export const FILM_OVERLAY_PRESETS: Record<string, FilmOverlayPreset> = {
  /**
   * Clean — minimal texture, just enough to avoid digital sterility.
   * Use for: data-heavy segments, charts, maps, any composition where
   * clarity matters more than atmosphere.
   */
  clean: {
    name: "Clean",
    description: "Subtle grain only — avoids digital sterility without competing with content",
    effects: ["grain"],
    intensity: 0.3,
  },

  /**
   * Documentary — the default Parallax look. Warm grain + breathing vignette.
   * Use for: most episodes, editorial content, analysis segments.
   * This is the recommended baseline for full-episode filmOverlay config.
   */
  documentary: {
    name: "Documentary",
    description: "Warm grain + vignette — the standard Parallax editorial look",
    effects: ["grain", "vignette"],
    intensity: 0.5,
  },

  /**
   * Cinematic — richer texture with light leak warmth.
   * Use for: narrative-heavy episodes, historical segments, storytelling beats
   * where atmosphere enhances the content.
   */
  cinematic: {
    name: "Cinematic",
    description: "Full texture suite — grain, vignette, warm light leak for narrative richness",
    effects: ["grain", "vignette", "light-leak"],
    intensity: 0.5,
  },

  /**
   * Dramatic — heavy atmosphere for climactic or tense moments.
   * Use for: conflict sequences, escalation beats, moments of high tension.
   * Apply per-segment, not full-episode — this is too heavy for sustained use.
   */
  dramatic: {
    name: "Dramatic",
    description: "Heavy grain + vignette + flicker — climactic tension, use sparingly",
    effects: ["grain", "vignette", "flicker"],
    intensity: 0.7,
  },

  /**
   * Archival — period-film aesthetic with scratches and dust.
   * Use for: historical flashback sequences, archival footage segments,
   * or the "looking back through time" narrative device.
   */
  archival: {
    name: "Archival",
    description: "Period-film look — grain, scratches, dust, vignette for historical sequences",
    effects: ["grain", "vignette", "scratch", "dust"],
    intensity: 0.6,
  },
} as const;

/**
 * Get a preset by name. Returns undefined if not found.
 */
export const getPreset = (name: string): FilmOverlayPreset | undefined =>
  FILM_OVERLAY_PRESETS[name];

/**
 * Template category → recommended preset mapping.
 * Used by visual-spec skill when auto-assigning overlay presets.
 */
export const TEMPLATE_PRESET_MAP: Record<string, string> = {
  // Data-heavy templates — keep clean so numbers are legible
  DataChart: "clean",
  TimeSeriesChart: "clean",
  RadarChart: "clean",
  BayesianUpdate: "clean",
  StatReveal: "clean",
  ProbabilityGauge: "clean",
  SankeyFlow: "clean",

  // Editorial/structural — standard documentary look
  FrameworkDiagram: "documentary",
  SplitComposition: "documentary",
  DecisionTree: "documentary",
  NetworkDiagram: "documentary",
  DualTimeline: "documentary",
  TimelineComparison: "documentary",
  TimelineMorph: "documentary",
  DuelingFrameworks: "documentary",

  // Narrative/visual — richer cinematic texture
  KineticTypography: "cinematic",
  TitleTransition: "cinematic",
  ImageComposite: "cinematic",
  PhotoMontage: "cinematic",
  AnnotatedImage: "cinematic",

  // Tension/conflict — dramatic atmosphere
  EscalationLadder: "dramatic",
  GameBoard: "documentary",

  // Geographic — clean for readability
  ChoroplethMap: "clean",
  RouteAnimation: "clean",
  BifurcationRoute: "clean",
  StrategicLandscape: "documentary",
};

export default FILM_OVERLAY_PRESETS;

/**
 * Data types for the ChoroplethMap template.
 *
 * To use this template, create a JSON file matching ChoroplethMapData
 * and pass it as inputProps to the composition.
 */

import type { DirectionBlock } from "../../hooks/useDirection";
import type { MapAnnotation } from "../../components/MapAnnotations.types";
import type { GraticuleConfig } from "../../components/Graticule.types";
import type { MapTitleConfig } from "../../components/MapTitleFrame";

/** A single country's data for one phase of the animation. */
export interface CountryData {
  /** Country name — must match the name in the TopoJSON file. */
  name: string;
  /** ISO 3166-1 alpha-3 code (e.g., "USA", "CHN", "TWN"). */
  iso3?: string;
  /** Numeric value for color scaling (GDP, trade volume, etc.). */
  value?: number;
  /** Override fill color — use instead of value-based scaling. */
  fill?: string;
  /** Label to display on or near the country. */
  label?: string;
  /**
   * Flag this country as having no data (rather than zero). When true, the
   * fill is set to a distinct neutral umber that's distinguishable from the
   * lightest bin of the active color ramp — so "no data" reads as a separate
   * category, not as "low value."
   *
   * The dossier failure mode this prevents: "Gray for 'no data'
   * indistinguishable from the lightest bin." Using a brand neutral
   * (`palette.umber`) rather than the ramp's gray avoids that collision.
   *
   * See: references/template-research/choropleth-map.md § 6.5
   */
  noData?: boolean;
}

/** A phase in the animation — countries change color/state at each phase. */
export interface AnimationPhase {
  /** Phase title displayed on screen (e.g., "2022: Export Controls"). */
  title: string;
  /** Optional subtitle or context. */
  subtitle?: string;
  /** Duration of this phase in seconds. */
  durationSec: number;
  /** Countries to highlight in this phase. Unmentioned countries use default fill. */
  countries: CountryData[];
  /** Optional map center override [longitude, latitude]. */
  center?: [number, number];
  /** Optional zoom/scale override. */
  scale?: number;
  /**
   * Optional camera pitch override (degrees). When omitted, defaults to
   * `0` for flat projections (naturalEarth / equalEarth / mercator / albers)
   * and `30` for globe — analytical maps render flat; globes get a slight
   * tilt for the 3D atmospheric register. Per-phase override here for
   * deliberate transitions (e.g., easing INTO a tilted close-up).
   */
  pitch?: number;
  /** Optional camera bearing override (degrees). Defaults to 0. */
  bearing?: number;
}

/** Full data input for the ChoroplethMap composition. */
export interface ChoroplethMapData {
  /** Episode identifier (e.g., "silicon-trap"). */
  episode: string;
  /** Segment title. */
  title: string;
  /**
   * Map projection to use.
   *
   * - `globe` — 3D sphere, best for global narratives at zoom <3.
   * - `mercator` — flat web-mercator, default for regional views (zoom ≥3).
   *    DO NOT use for world-scale quantitative comparison — area distortion
   *    near the poles inflates Greenland / Russia and reads as editorial bias.
   * - `equalEarth` (recommended default for world-scale choropleth) —
   *    area-preserving, the only world projection that's editorially honest
   *    for quantitative comparison.
   * - `naturalEarth` — compromise projection, NYT/National Geographic default.
   * - `albers` — best for North America–centric views.
   *
   * Defaults: `globe` for zoom <3, `mercator` for zoom ≥3 (preserves legacy
   * behavior). When set, overrides the auto-choice.
   *
   * Reference: references/template-research/choropleth-map.md § 6.1
   */
  projection?: "globe" | "mercator" | "equalEarth" | "naturalEarth" | "albers";
  /** Default map center [longitude, latitude]. */
  center?: [number, number];
  /** Default scale. */
  scale?: number;
  /**
   * Color ramp name or custom array of hex colors.
   *
   * Recommended defaults (ColorBrewer-vetted, brand-aligned):
   * - `ylOrBr` (default) — sequential warm ramp: bone → gold → rust → oxblood.
   *    Right for single-direction quantitative data (intensity, density,
   *    income per capita). The editorially safe choice.
   * - `rdBu` — diverging ramp: oxblood → bone (midpoint) → blue.
   *    Right for diff maps or anything with a meaningful midpoint
   *    (deviation from baseline, swing maps).
   *
   * Legacy ramps preserved for back-compat: `blue`, `red`, `teal`, `gray`.
   *
   * Per the dossier failure mode "diverging palette on non-diverging data":
   * only use `rdBu` when the data actually has a midpoint. Quantitative-only
   * data should use `ylOrBr` (or a custom sequential array).
   *
   * Reference: references/template-research/choropleth-map.md § 6.2
   */
  colorRamp?: "blue" | "red" | "teal" | "gray" | "ylOrBr" | "rdBu" | string[];
  /**
   * Optional legend strip configuration. When set, renders a horizontal
   * color-ramp legend above the FooterStrip at the bottom of the map.
   * Mandatory for choropleths that show *quantitative* data — without a
   * legend, the color encoding is illegible.
   *
   * - `breaks` — numeric breakpoints between bins (length = bins - 1).
   *    Pair with `quantileBreaks()` from `src/utils/quantileBins.ts`.
   *    When omitted, renders a continuous-gradient legend.
   * - `unit` — suffix appended to break values ("%", " GDP", "/cap").
   * - `label` — caption shown left of the swatches (e.g., "GDP per capita").
   *
   * See: references/template-research/choropleth-map.md § 6.4
   */
  legend?: {
    /** Internal break values between bins (length = numBins - 1). */
    breaks?: number[];
    /** Unit suffix for break-value labels. */
    unit?: string;
    /** Caption to the left of the swatches. */
    label?: string;
    /**
     * Label for the "no data" swatch, which is auto-appended to the legend
     * when any country in any phase has `noData: true`. Default "No data".
     * Set explicitly when the editorial frame uses different language
     * (e.g., "Not included", "Sanctioned countries excluded").
     */
    noDataLabel?: string;
  };
  /** The phases of the animation, played sequentially. */
  phases: AnimationPhase[];
  /** Subtle color tint for emotional temperature (Layer 3). Hex color, e.g. "#3266AD" for US-blue, "#C23B22" for China-red. */
  backgroundTint?: string;
  /** Map style mode — selects Mapbox style (Meridian Light or Meridian Dark). Default "light". */
  backgroundVariant?: "light" | "dark";

  /**
   * Enable terrain hillshading. Default false (atlas register, May 11 2026).
   * Set true per-shot when relief is the editorial point. See: LESSONS.md L99.
   */
  terrain?: boolean;

  /**
   * Label-density register. ChoroplethMap defaults to `"editorial"` —
   * country labels at globe scale for orientation, auto-suppress at
   * regional zoom (>= 4) where the choropleth fill is the editorial
   * point. Per-shot override to `"minimal"` for shots where country
   * labels would duplicate explicit MapAnnotations.
   * See MapGL `labelDensity` for the full taxonomy.
   */
  labelDensity?: "atlas" | "editorial" | "minimal" | "off";

  /**
   * Editorial annotations — labels pinned to lon/lat with optional leader
   * lines. Use to name regions, chokepoints, or label countries with values
   * the choropleth fill can't convey on its own. Use the `phase` shorthand
   * to scope to a specific animation phase.
   *
   * See: components/MapAnnotations.tsx
   * See: references/template-research/map-annotations.md
   */
  annotations?: MapAnnotation[];

  /**
   * Parallels-and-meridians overlay. Faint grid that reads as "atlas
   * plate." See: components/Graticule.tsx.
   */
  graticule?: GraticuleConfig;

  /**
   * Locator inset — small overview map in a corner showing where the
   * main map is zoomed. See: components/MapInset.tsx.
   *
   * Default: hidden. Pass `{ show: true }` to display.
   */
  inset?: {
    show?: boolean;
    position?: "tl" | "tr" | "bl" | "br";
    size?: number;
    framed?: boolean;
  };

  /**
   * OPTIONAL title placement. ChoroplethMap is Mapbox-backed; by doctrine
   * the title comes from the script's voice-over or a preceding
   * TitleTransition composition (the "atmospheric register only" policy
   * established May 13, 2026). Setting `mapTitle` opts INTO an overlay
   * title — the banner mode is the safe choice (paper band keeps the
   * title from cutting into the map).
   *
   * Smart placement (`mode: "cartouche", placement: "auto"`) is NOT
   * supported on Mapbox-backed templates — falls back to "top-left" with
   * a dev warning. Use AtlasPlate for cartouche placement.
   */
  mapTitle?: MapTitleConfig;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

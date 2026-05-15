/**
 * Data types for the AtlasPlate template.
 *
 * Pure-SVG editorial cartography rendered from Natural Earth TopoJSON via
 * d3-geo. The Tufte/Fortune/Bartholomew register — flat, high-contrast,
 * no tiles. Use when atmospheric Mapbox renders would distract from an
 * analytical point.
 *
 * Dossier: references/template-research/atlas-plate.md
 */

import type { DirectionBlock } from "../../hooks/useDirection";
import type { MapAnnotation } from "../../components/MapAnnotations.types";
import type { GraticuleConfig } from "../../components/Graticule.types";
import type { ProjectionName } from "../../utils/atlasProjection";
import type { MapTitleConfig } from "../../components/MapTitleFrame";
import type { SeaLabelInput } from "../../utils/seaLabels";
import type { AtlasAesthetic } from "./schema";

/** A country's fill assignment within a phase. */
export interface AtlasCountryFill {
  /** ISO 3166-1 alpha-3 code (e.g., "USA", "CHN", "TWN"). */
  iso3: string;
  /** Override fill color (hex). Wins over palette/value-based mapping. */
  fill?: string;
  /** Optional label rendered at the country's centroid for this phase. */
  label?: string;
  /**
   * Flag as having no data (rather than zero). Renders with the distinct
   * "no data" neutral, separate from the base land color. Same semantics
   * as ChoroplethMap → choropleth-map.md § 6.5.
   */
  noData?: boolean;
  /**
   * Country-label placement strategy.
   *
   * - `"auto"` (default) — collision-aware placer decides. Tiny countries
   *   auto-skip, small countries get leader-out placement, others sit
   *   inside the polygon at centroid.
   * - `"inside"` — force label inside the polygon at centroid; no leader.
   *   Use when polygon is large enough to host the label.
   * - `"leader"` — force a leader-out placement (label outside polygon
   *   with a thin connector line). Use for tiny countries where
   *   inside-placement is illegible.
   * - `"skip"` — render no label at all.
   */
  labelStrategy?: "auto" | "inside" | "leader" | "skip";
}

/** A single phase of the atlas animation. */
export interface AtlasPhase {
  /** Phase title rendered as overlay. */
  title: string;
  /** Optional subtitle. */
  subtitle?: string;
  /** How long this phase is visible, in seconds. */
  durationSec: number;
  /** Countries to highlight in this phase. */
  countries: AtlasCountryFill[];
  /**
   * Camera focus. Set EITHER:
   *   - `iso3`: list of country codes to fit the camera around (computes
   *     bounds + applies fit-extent with padding).
   *   - `center` + `scaleHint`: explicit center [lon, lat] + multiplicative
   *     scale relative to the world-fit scale (1.0 = world, 2.0 = 2× zoom).
   *
   * When unset, the camera holds the previous phase's pose (or the
   * world fit if this is phase 0).
   */
  focus?: {
    iso3?: string[];
    center?: [number, number];
    scaleHint?: number;
  };

  /**
   * Orthographic-only: which point should face the viewer in this phase.
   * `[longitude, latitude]` — the projection rotates so this point is at
   * the apparent center of the globe. Ignored when `projection` is not
   * `"orthographic"`.
   *
   * Cinematic use: phase 1 facing [-100, 40] (North America), phase 2
   * facing [115, 35] (East Asia) → the globe rotates ~215° between phases,
   * giving a "spinning earth" cold-open effect.
   *
   * When unset on phase 0: defaults to `[0, 20]` (Greenwich, slightly
   * north of equator). When unset on phase N > 0: holds previous phase's
   * rotation.
   */
  rotation?: [number, number];

  /**
   * Cinematic camera transition INTO this phase. Default `"linear"`
   * (cubic ease — current behavior, no opt-in needed).
   *
   * - `"cinematic"` — cubic Bezier (0.65, 0, 0.35, 1) — accelerates hard
   *   through the middle. Good for dramatic phase changes.
   * - `"via-globe"` — pulls the camera OUT (zoom decreases) at the
   *   midpoint of the transition, then back IN. The NYT/Apple Maps
   *   "fly to" motion. Use when this phase's focus is far from the
   *   previous phase's (different continent / hemisphere).
   *
   * See: src/utils/mapUtils.ts (`easeCameraT`, `viaGlobePoseInterpolate`).
   */
  cameraTransition?: "linear" | "cinematic" | "via-globe";

  /**
   * Optional dwell windows (in fraction-of-transition, 0-1) at the start
   * and/or end of the transition. Use to hold the previous pose for a
   * beat before motion, or hold the new pose to settle before the next
   * phase's animation begins.
   *
   * Example: `{ before: 0.2 }` holds the previous pose for the first 20%
   * of the transition window, then moves to this phase's pose in the
   * remaining 80%.
   */
  cameraDwell?: { before?: number; after?: number };

  /**
   * How country fills transition INTO this phase from the previous phase's
   * fills.
   *
   * - `"lerp"` (default) — sRGB color interpolation over the camera
   *   transition window. Soft, editorial — countries crossfade between
   *   their previous-phase fill and this-phase fill. Right default for
   *   analogy / structural-reveal beats.
   * - `"instant"` — hard color swap at the phase boundary. Use for
   *   dramatic moments where the suddenness IS the editorial point
   *   ("the bloc collapses," "Russia invades"). Matches the v1 (pre-May
   *   14 2026) behavior of all phases.
   */
  fillTransition?: "lerp" | "instant";

  /**
   * When true, render a dashed rust rectangle on THIS phase's view showing
   * the NEXT phase's focus countries' bounding box. Standard editorial
   * cartography device (FT, NatGeo) for "here is where we're zooming next."
   * Only meaningful when the NEXT phase has `focus.iso3` set; silently
   * ignored otherwise.
   */
  showExtentBox?: boolean;
}

/** Full data input for an AtlasPlate composition. */
export interface AtlasPlateData {
  /** Episode identifier (e.g., "prisoners-dilemma"). */
  episode: string;
  /** Composition title. */
  title: string;
  /** Optional subtitle. */
  subtitle?: string;
  /**
   * Map projection. Default `equalEarth` — area-honest world map.
   *
   * - `equalEarth` (default) — Šavrič 2018, the modern Bartholomew successor.
   * - `naturalEarth` — compromise projection, NYT/National Geographic register.
   * - `mercator` — conformal, navigational; DO NOT use for area comparison.
   * - `orthographic` — globe view, good for "looking at the planet" moments.
   * - `albersUsa` — North America-centric (includes inset Alaska + Hawaii).
   * - `equirectangular` — simplest flat projection, lat/lon grid is square.
   */
  projection?: ProjectionName;
  /** The phases of the animation, played sequentially. */
  phases: AtlasPhase[];
  /** Total composition duration override — defaults to sum of phase durations. */
  durationSec?: number;
  /** Source attribution rendered in the bottom-right via FooterStrip. */
  source?: string;
  /**
   * Padding (in pixels) around fitted features when the camera focuses on
   * countries. Larger = more breathing room around the focus. Default 80.
   */
  framePadding?: number;
  /**
   * Editorial annotations rendered as SVG text in projection space. Uses
   * the same `MapAnnotation` schema as Mapbox templates; AtlasPlate
   * projects lon/lat → SVG coords using the active projection.
   *
   * See: components/MapAnnotations.types.ts
   */
  annotations?: MapAnnotation[];
  /**
   * Parallels-and-meridians overlay rendered as SVG paths. Same `spacing`
   * / `opacity` / `emphasize30` semantics as the Mapbox graticule. See:
   * components/Graticule.types.ts.
   */
  graticule?: GraticuleConfig;

  /**
   * Disputed-boundary overlay (Taiwan Strait, S China Sea nine-dash,
   * Kashmir LoC, Crimea, Western Sahara berm). Rendered as dashed rust
   * lines layered above country borders.
   *
   * Use cases — *editorial* (not legal):
   *   - `true`: show all curated disputes (good for a "contested world" map).
   *   - `["nine-dash"]`: just the specific disputes the script names.
   *   - omit: no dispute lines (a clean recognized-only world).
   *
   * The curated set + per-dispute notes live in
   * `src/utils/disputedBoundaries.ts`. Add new disputes there.
   */
  disputedBoundaries?: true | string[];

  /**
   * Sea/ocean labels — opt-in tracked-uppercase labels along projected
   * geodesic arcs. Atlas-plate convention; the single highest-impact
   * "this reads as an atlas, not data-vis" addition.
   *
   * Pass tag strings from the curated set (Pacific, Atlantic, Indian,
   * Arctic, Southern, Mediterranean, Caribbean, North Sea, Baltic, Red
   * Sea, Persian Gulf, S. China Sea, Bay of Bengal, Gulf of Mexico, Sea
   * of Japan) OR inline `SeaLabel` objects for niche labels not in the
   * curated registry.
   *
   * Example: `seaLabels: ["pacific", "atlantic", "mediterranean"]`.
   *
   * Curated registry: `src/utils/seaLabels.ts`.
   */
  seaLabels?: SeaLabelInput[];

  /**
   * Locator inset — a small Equal Earth world map at a corner, showing
   * the camera's current focus as a rust extent rectangle. Standard
   * editorial-atlas device that anchors the viewer when the main view
   * is zoomed in on a region.
   *
   * - `show: true` — render the inset.
   * - `corner` — anchor position. Default `"top-right"`.
   * - `size` — width in px. Default 180. Height auto-scales (3:2 aspect).
   *
   * When `phase.focus.iso3` is set, the inset draws a rust rectangle
   * around those countries' world-space bbox. Otherwise no rectangle.
   */
  inset?: {
    show: true;
    corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    size?: number;
  };

  /**
   * Detail inset — a small zoomed corner panel showing a specific set of
   * countries in close-up while the main view holds its own camera.
   * The NatGeo / FT regional-supplement idiom: main view provides
   * geographic context; inset shows the editorial subject at readable scale.
   *
   * Distinct from `inset` (which shows the world-map "you are here" box).
   * Use both together when you want: main=world context, detail=zoomed
   * subject, AND the "you are here" locator.
   *
   * - `iso3`: countries to fit the detail projection around.
   * - `corner`: anchor position. Default `"bottom-right"`.
   * - `size`: width in px. Default 220.
   */
  detailInset?: {
    iso3: string[];
    corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    size?: number;
  };

  /** Map mode — light (default) or dark. */
  backgroundVariant?: "light" | "dark";

  /**
   * Visual register. Default `"atlas"` — modern Tufte/Fortune flat
   * cartography (current default behavior, unchanged).
   *
   * `"vintage"` — mid-century period-atlas register: tea-stained paper,
   * brown ink borders, paper-grain SVG filter, soft vignette. Use for
   * Cold-War / historical-analogy episodes where the map should signal
   * "period reference," not "live data." Per-phase highlight colors
   * default to the muted cold-war navy/oxblood palette.
   *
   * Ignored when `backgroundVariant: "dark"` (vintage is a light-register
   * aesthetic; no dark-vintage equivalent yet).
   *
   * `"atlas-relief"` — modern atlas register PLUS a Tom Patterson hand-
   * painted shaded-relief raster underlay (public-domain Natural Earth).
   * The relief sits under country fills + strokes, tinted into the bone/
   * paper palette so it reads as "atlas plate with terrain" rather than
   * "satellite photo." Use when terrain is structurally relevant to the
   * argument (mountain frontiers, Himalayan supply routes, alpine border
   * disputes) — i.e., the cases that historically escaped to Mapbox
   * terrain. Falls back to plain `"atlas"` when the projection-warped
   * raster asset is missing (run `cd remotion-templates && node scripts/prepare-shaded-relief.mjs`
   * after the initial Natural Earth download — see
   * `tools/shaded-relief-setup.md`).
   *
   * Today supports `projection: "equalEarth" | "naturalEarth" |
   * "equirectangular"`. Orthographic globe relief is deferred (would need
   * a separate per-rotation rasterizer); a warn-and-skip path fires when
   * combined with orthographic.
   *
   * Reference: references/template-research/atlas-plate.md § Aesthetic register.
   */
  aesthetic?: AtlasAesthetic;

  /** Subtle color tint for emotional temperature. Hex. */
  backgroundTint?: string;

  /**
   * Title placement — see `MapTitleFrame` in components/.
   *
   * Default when omitted: `{ placement: "auto" }`. The title floats at the
   * corner with maximum clearance from highlighted (data-bearing) country
   * centroids in the current phase. Phase label (`phase.title` /
   * `phase.subtitle`) stacks below it in the same corner.
   *
   * Override `placement` to one of `top-left | top-right | bottom-left |
   * bottom-right` to pin the title to a fixed corner instead.
   *
   * @see src/components/MapTitleFrame.tsx
   */
  mapTitle?: MapTitleConfig;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

/**
 * Data types for the RouteAnimation template.
 *
 * Animated paths on a world map showing trade routes, supply chains,
 * or movement of resources/technology between locations.
 */

import type { DirectionBlock } from "../../hooks/useDirection";
import type { MapAnnotation } from "../../components/MapAnnotations.types";
import type { GraticuleConfig } from "../../components/Graticule.types";
import type { MapTitleConfig } from "../../components/MapTitleFrame";

export interface RoutePoint {
  /** Display name. */
  name: string;
  /** [longitude, latitude]. */
  coordinates: [number, number];
  /** Label shown on map. */
  label?: string;
  /** Point color override. */
  color?: string;
  /** Secondary info shown below the label. */
  sublabel?: string;
  /** Where to position the label relative to the dot. Default "above". */
  labelPosition?: "above" | "below" | "left" | "right";
}

export interface RouteSegment {
  /** Index into the points array — start of this segment. */
  from: number;
  /** Index into the points array — end of this segment. */
  to: number;
  /** Label on the route line. */
  label?: string;
  /** Segment color override. */
  color?: string;
  /** Dashed line? Default false. */
  dashed?: boolean;
}

export interface RoutePhase {
  /** Phase title shown as overlay. */
  title: string;
  subtitle?: string;
  /** How long this phase is visible (seconds). */
  durationSec: number;
  /** Which segments to show (indices into segments array). */
  activeSegments: number[];
  /** Which points to highlight (indices into points array). */
  activePoints: number[];
  /** Optional map center override [lon, lat]. */
  center?: [number, number];
  /** Optional map scale override (react-simple-maps legacy — converted to zoom). */
  scale?: number;
  /** Camera state for this phase (preferred over center/scale). */
  camera?: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
  };
}

export interface RouteAnimationData {
  episode: string;
  title: string;
  subtitle?: string;

  /** All route points (cities, factories, etc.). */
  points: RoutePoint[];
  /** All route segments connecting points. */
  segments: RouteSegment[];
  /** Animation phases — segments appear in sequence. */
  phases: RoutePhase[];

  /**
   * Radial mode — one hub city + N destinations radiating outward.
   *
   * When set, the template auto-generates segments from `hubIndex` to every
   * other point and reveals them simultaneously with bearing-sorted stagger
   * (each destination's segment starts slightly after the one to its
   * clockwise neighbor). Any explicit `segments` array is IGNORED in radial
   * mode — the segments derive from the hub geometry.
   *
   * Phases can still be used to focus the camera on subsets of destinations.
   * If `phases` is omitted, all destinations reveal in a single pass.
   *
   * Use case: trade-route hubs ("all roads led to Rome"), military campaigns
   * radiating from a command center, supply lanes from a single port.
   *
   * See: CLAUDE.md "Known gaps" → Hub-with-radial-routes map
   * See: references/template-research/route-animation.md § 6.1
   */
  radial?: {
    /** Index into `points` of the hub city. */
    hubIndex: number;
    /** Per-arc stagger in seconds (default 0.15 → 30 fps × 0.15 = ~4.5 frames). */
    staggerSec?: number;
    /** Color for the hub marker (default amber). */
    hubColor?: string;
    /** Color for the arcs (default rust). */
    arcColor?: string;
  };

  /** Map projection center [lon, lat]. */
  center?: [number, number];
  /** Map projection scale. */
  scale?: number;

  /** Route line color. */
  routeColor?: string;
  /** Source attribution. */
  source?: string;
  durationSec?: number;
  /** Subtle color tint for emotional temperature (Layer 3). Hex color, e.g. "#3266AD" for US-blue, "#C23B22" for China-red. */
  backgroundTint?: string;
  /** Map style mode — selects Mapbox style (Meridian Light or Meridian Dark). Default "light". */
  backgroundVariant?: "light" | "dark";

  /**
   * Enable terrain hillshading. Default false (atlas register, May 11 2026).
   * Set true per-shot when relief is the editorial point — Himalayan supply
   * routes, alpine border disputes, etc. See: LESSONS.md L99.
   */
  terrain?: boolean;

  /**
   * Label-density register — controls how aggressively Mapbox's automatic
   * place/road/transit labels are suppressed so editorial annotations win
   * the typographic hierarchy. See MapGL `labelDensity` for the full
   * register taxonomy. Defaults to `"editorial"` for RouteAnimation:
   * country labels visible at globe scale (orientation), auto-suppress at
   * regional zoom (>= 4) where MapAnnotations dominate. Override per shot
   * if you want a different register.
   *
   * - `"atlas"` — full Mapbox labels at every zoom
   * - `"editorial"` (default) — country labels at globe, suppress at regional
   * - `"minimal"` — hide all place/road/transit labels regardless of zoom
   * - `"off"` — total suppression (every label on canvas is editorial)
   */
  labelDensity?: "atlas" | "editorial" | "minimal" | "off";

  /**
   * Editorial annotations — labels pinned to lon/lat with optional leader
   * lines. Use to name features, regions, or chokepoints that aren't route
   * nodes. Use the `phase` shorthand to scope to a specific route phase.
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
   * OPTIONAL title overlay — opt-in for Mapbox-backed templates per the
   * atmospheric-register doctrine. See `MapTitleFrame`. Smart cartouche
   * placement (`placement: "auto"`) is unsupported here — falls back to
   * "top-left" with a dev warning.
   */
  mapTitle?: MapTitleConfig;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}

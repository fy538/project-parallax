/**
 * Data types for the RouteAnimation template.
 *
 * Animated paths on a world map showing trade routes, supply chains,
 * or movement of resources/technology between locations.
 */

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
}

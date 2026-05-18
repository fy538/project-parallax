/**
 * MapGL — shared Mapbox GL wrapper for map-based templates.
 *
 * Wraps react-map-gl v8 with Parallax defaults:
 *   - Meridian Dark map style (dark-v11, or custom Mapbox Studio style)
 *   - Terrain (mapbox-dem-v1, exaggeration 1.5)
 *   - delayRender / continueRender lifecycle for tile loading
 *   - deck.gl overlay layer support via MapboxOverlay
 *   - All mouse/touch interaction disabled (this is video, not interactive)
 *
 * Usage:
 *   <MapGL
 *     longitude={116}
 *     latitude={32}
 *     zoom={4.5}
 *     pitch={40}
 *     layers={[countryHighlightLayer, routeArcLayer]}
 *   >
 *     <Marker longitude={120} latitude={24}>...</Marker>
 *   </MapGL>
 */

import React, { useCallback, useRef, useState, useEffect } from "react";
import { AbsoluteFill, delayRender, continueRender } from "remotion";
import Map, { Source, useControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import type { MapEvent } from "mapbox-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Layer } from "@deck.gl/core";
import { layout, mapConfig, palette } from "../design/theme";
import { buildGraticuleLayers } from "./Graticule";
import type { GraticuleConfig } from "./Graticule.types";
import { MapVignette } from "./MapVignette";
import { MapAttribution } from "./MapAttribution";
import type { LabelDensity, LightPreset, Register } from "./MapGL.types";
import "mapbox-gl/dist/mapbox-gl.css";

// ── deck.gl ↔ Mapbox bridge ────────────────────────────────────────────

/**
 * Renders deck.gl layers inside a react-map-gl Map.
 * Uses MapboxOverlay (interleaved mode) so deck.gl layers
 * composite correctly with Mapbox's terrain and label layers.
 */
const DeckGLOverlay: React.FC<{ layers: Layer[] }> = ({ layers }) => {
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ interleaved: true })
  );

  useEffect(() => {
    overlay.setProps({ layers });
  }, [overlay, layers]);

  return null;
};

// ── Configuration ─────────────────────────────────────────────────────

export const MAP_CONFIG = {
  /** Default Mapbox style — Meridian Light if configured, else mapbox light-v11. */
  styleUrl: mapConfig.styleUrl,
  /** Dark variant — Meridian Dark if configured, else mapbox dark-v11. */
  darkStyleUrl: mapConfig.darkStyleUrl,
  /** Sepia variant — Meridian Sepia if configured, else light-v11 + runtime tint. */
  sepiaStyleUrl: mapConfig.sepiaStyleUrl,
  /** Toner variant — Meridian Toner via Stadia if configured, else
   *  light-v11 + runtime contrast filter. The atmospheric atlas register. */
  tonerStyleUrl: mapConfig.tonerStyleUrl,
  /** Read from .env at build time. Never commit this token. */
  accessToken: process.env.MAPBOX_ACCESS_TOKEN || "",
  terrain: mapConfig.terrain,
  projection: mapConfig.projection,
} as const;

/**
 * Register → style-URL dict. Single source of truth that replaces the
 * implicit precedence chain (`toner ? toner : vintage ? sepia : dark ?
 * dark : light`) that lived in MapGL's body. Adding a new register
 * means appending one entry here + extending RegisterSchema in
 * MapGL.types.ts.
 */
export const MAP_STYLES: Record<Register, string> = {
  light: mapConfig.styleUrl,
  dark: mapConfig.darkStyleUrl,
  vintage: mapConfig.sepiaStyleUrl,
  toner: mapConfig.tonerStyleUrl,
};

/**
 * Register → fallback CSS filter applied to the map wrapper when the
 * matching `MAPBOX_STYLE_*_URL` env var is unset (i.e., we're falling
 * through to a stock Mapbox style). Approximates the register visually
 * until the Studio fork is published.
 *
 *   • `light` / `dark` — no filter (stock looks register-appropriate enough)
 *   • `vintage`        — warm sepia overlay
 *   • `toner`          — high-contrast grayscale
 *
 * Resolved against `MAP_STYLES[register] === mapConfig.styleUrl` (i.e.,
 * we're in fallback because the env var collapsed to the same URL as
 * the default Light style).
 */
const REGISTER_FALLBACK_FILTERS: Record<Register, string | undefined> = {
  light: undefined,
  dark: undefined,
  vintage: "sepia(0.55) saturate(0.85) contrast(0.95) hue-rotate(-8deg)",
  toner: "grayscale(1) contrast(1.35) brightness(1.05)",
};

// ── Fog / atmosphere presets ──────────────────────────────────────────
//
// The Mapbox default `setFog({})` produces a CYAN-BLUE space halo around
// a globe — the single biggest "this is Google Earth" tell. Each preset
// below pairs with a Parallax visual register:
//
//   • editorial — paper-tinted atmosphere; muted horizon; no stars. The
//     default register for analytical world maps.
//   • atmospheric — cinematic register for cold-open globes; deeper space,
//     warmer horizon, slight star intensity. Used when the globe itself
//     is the focal element.
//   • vintage — brown-tinted atmosphere matching the AtlasPlate vintage
//     palette. For period / historical episodes.
//   • none — disable fog entirely (no atmosphere). Use when graticule +
//     vignette overlays carry the "this is an atlas" signal alone.
//
// Each preset is applied via `map.setFog(...)` on style.load. The shape
// is Mapbox's standard fog spec — see https://docs.mapbox.com/style-spec/reference/fog/
// Each preset is applied via `map.setFog(...)` on style.load.
//
// IMPORTANT — the `space-color` property fills the area AROUND the globe
// outside the sphere. Setting it to ink/black creates a "globe floating
// in space" feel that fights an editorial paper-surface composition.
// For the analytical / editorial register the trick is to make space the
// SAME color as the page so the globe blends into the surface rather
// than sitting on a black void — that's the FT / Reuters / NYT idiom.
// Only the `atmospheric` preset opts into a dark space (for cinematic
// cold-open globes where the globe IS the focal element and the page is
// dark too).
const FOG_PRESETS = {
  editorial: {
    // Space matches paper — globe blends into editorial surface.
    "space-color": palette.paper,
    // Atmosphere halo: paper-bone gradient. horizon-blend controls how wide
    // the atmospheric ring spreads from the globe edge — 0.02 gives a barely-
    // there halo (halved from 0.04 which was noticeably glowy at globe zoom).
    color: palette.bone,
    "high-color": palette.taupe,
    "horizon-blend": 0.02,
    "star-intensity": 0,
  },
  atmospheric: {
    // Cinematic cold-open — space is dark (use against dark backgrounds).
    "space-color": "#0E0B09",
    color: palette.paper,
    "high-color": palette.amber,
    "horizon-blend": 0.12,
    "star-intensity": 0.15,
  },
  vintage: {
    // Period register — warm tea-stained space, brown horizon.
    "space-color": "#E8DCC0",
    color: "#E8DCC0",
    "high-color": "#9B7849",
    "horizon-blend": 0.08,
    "star-intensity": 0,
  },
  /** No atmosphere — graticule + vignette overlays carry the atlas signal alone. */
  none: null,
} as const;

type FogPreset = keyof typeof FOG_PRESETS;

// ── Light presets ─────────────────────────────────────────────────────
//
// Mapbox Standard's basemap import exposes a `lightPreset` config that
// shifts the entire scene's lighting model (sun angle, ambient color,
// shadow direction). The four built-in values are `day`, `dawn`, `dusk`,
// `night`. We expose them as a typed prop on MapGL so templates can:
//
//   • Match an episode's diegetic time-of-day ("at dawn, the convoy
//     crossed the strait" → `lightPreset="dawn"`)
//   • Shift register between segments without restyling the entire map
//   • Combine with fog presets for compound moods (atmospheric + dusk =
//     editorial twilight cold-open)
//
// Applied via `map.setConfigProperty('basemap', 'lightPreset', value)`.
// Like labelDensity, this is a no-op on classic non-Standard styles —
// the one-shot warning in `applyLabelDensity` covers the graceful-fallback
// case for that whole config family.
//
// The `LightPreset` type + Zod schema live in MapGL.types.ts so map
// template schemas can validate the field without dragging in MapGL's
// React render code at validation time.

const LIGHT_PRESETS: ReadonlyArray<LightPreset> = [
  "day",
  "dawn",
  "dusk",
  "night",
] as const;

/**
 * Apply the lightPreset to Mapbox Standard's basemap import via
 * setConfigProperty. Returns `true` when the API was available, `false`
 * when the style doesn't support it. Exported for unit tests + audit.
 */
export const applyLightPreset = (
  map: {
    setConfigProperty?: (
      importId: string,
      configName: string,
      value: unknown,
    ) => void;
    getStyle?: () => { imports?: Array<{ id: string }> };
  },
  preset: LightPreset,
): boolean => {
  if (typeof map.setConfigProperty !== "function") return false;
  let importId = "basemap";
  try {
    const imports = map.getStyle?.()?.imports ?? [];
    if (imports.length > 0) {
      importId = imports.find((i) => i.id === "basemap")?.id ?? imports[0].id;
    }
  } catch {
    // getStyle() throws pre-style-load; fall through to default.
  }
  try {
    map.setConfigProperty(importId, "lightPreset", preset);
    return true;
  } catch {
    return false;
  }
};

// ── Label density: zoom threshold for `editorial` mode ────────────────
//
// At zooms below this threshold, `editorial` keeps Mapbox place labels
// visible for orientation; above it, labels suppress so editorial
// MapAnnotations dominate. Empirically chosen at 4 — globe + continent
// scale shots stay context-rich; regional + country shots become clean.
// Override per-shot via `labelDensity: "atlas"` (always show) or
// `labelDensity: "minimal" | "off"` (always suppress).
//
// The full `LabelDensity` type + zod schema live in MapGL.types.ts so
// they can be shared across map template schemas without dragging in
// MapGL's React render code at validation time.
const EDITORIAL_SUPPRESSION_ZOOM = 4;

/**
 * Compute the effective label register at a given zoom, applying the
 * `editorial`-mode zoom threshold. Exported for unit tests + audit skills.
 */
export const resolveEffectiveLabelDensity = (
  density: LabelDensity,
  zoom: number,
): "atlas" | "minimal" | "off" => {
  if (density === "editorial") {
    return zoom >= EDITORIAL_SUPPRESSION_ZOOM ? "minimal" : "atlas";
  }
  return density;
};

// ── Label density runtime API ─────────────────────────────────────────
//
// Mapbox Standard exposes runtime label toggles via `setConfigProperty`
// on the imported basemap. The import is named `basemap` in our
// published Meridian Light / Sepia styles. We probe `map.getStyle()
// .imports` to confirm the import exists before calling — graceful no-op
// when the style is a classic non-Standard fallback (e.g., when the
// user hasn't published the Meridian styles yet).
//
// One-shot dev warning fires if the API is missing — prevents the
// silent-failure bug where the code claims to be suppressing labels but
// is actually doing nothing.

let importNameWarned = false;

/**
 * Apply the resolved label register to the Mapbox map via setConfigProperty.
 * Returns `true` when the API was available and the call succeeded;
 * `false` when the style doesn't support it (classic fallback).
 *
 * Exported for unit testing. In the component, called from a useEffect
 * watching zoom + labelDensity so the register updates as the camera
 * animates across the editorial-suppression threshold.
 */
export const applyLabelDensity = (
  map: {
    setConfigProperty?: (
      importId: string,
      configName: string,
      value: unknown,
    ) => void;
    getStyle?: () => { imports?: Array<{ id: string }> };
  },
  effective: "atlas" | "minimal" | "off",
): boolean => {
  if (typeof map.setConfigProperty !== "function") {
    if (!importNameWarned && typeof console !== "undefined") {
      importNameWarned = true;
      // eslint-disable-next-line no-console
      console.warn(
        "[MapGL] setConfigProperty unavailable — label-density register " +
          "is a no-op on this style. Publish Meridian Light / Sepia (see " +
          "tools/mapbox-meridian-setup.md) for full editorial label control.",
      );
    }
    return false;
  }

  // Probe for the actual basemap import ID. Our published Meridian styles
  // name the import `basemap`; if a future style uses a different name,
  // we still find it as long as ONE import exists. If there are multiple
  // (unusual), we prefer the one literally named `basemap`.
  let importId = "basemap";
  try {
    const imports = map.getStyle?.()?.imports ?? [];
    if (imports.length > 0) {
      importId =
        imports.find((i) => i.id === "basemap")?.id ?? imports[0].id;
    }
  } catch {
    // getStyle() can throw before the style is fully loaded. Stick with
    // the default "basemap" and let setConfigProperty fail loudly below.
  }

  try {
    // Symmetric on/off — every label config we touch in non-atlas must be
    // explicitly re-enabled in atlas, otherwise a render that transitions
    // minimal → atlas (e.g., camera zooms out) leaves layers off. Earlier
    // bug: pedestrian roads were only ever set to `false`, never `true`,
    // so a zoom-out reveal silently kept them hidden.
    const showLayers = effective === "atlas";
    map.setConfigProperty(importId, "showPointOfInterestLabels", showLayers);
    map.setConfigProperty(importId, "showTransitLabels", showLayers);
    map.setConfigProperty(importId, "showRoadLabels", showLayers);
    map.setConfigProperty(importId, "showPedestrianRoads", showLayers);

    // Place labels (country / state / city / settlement names): visible
    // in atlas register; suppressed in minimal / off.
    map.setConfigProperty(importId, "showPlaceLabels", showLayers);
    return true;
  } catch (err) {
    if (!importNameWarned && typeof console !== "undefined") {
      importNameWarned = true;
      // eslint-disable-next-line no-console
      console.warn(
        `[MapGL] setConfigProperty('${importId}', ...) failed — label-density ` +
          `register is a no-op. Either the import ID is wrong (expected ` +
          `'basemap') or the style is a classic non-Standard fallback. ` +
          `Error: ${(err as Error)?.message ?? err}`,
      );
    }
    return false;
  }
};

/**
 * Validate Mapbox access token presence. Call before rendering map components.
 * Without this, an unset MAPBOX_ACCESS_TOKEN silently produces an empty
 * token, every tile request 401s, and the render hangs for the 30-second
 * tile-load timeout before falling back. Far better to fail fast here with
 * an actionable message.
 */
export const assertMapboxToken = (): void => {
  if (!MAP_CONFIG.accessToken) {
    throw new Error(
      "MAPBOX_ACCESS_TOKEN is not set. Map templates require a Mapbox access " +
        "token in remotion-templates/.env (and as a Lambda env var for Lambda " +
        "renders). Get one at https://account.mapbox.com/access-tokens/. " +
        "Set MAPBOX_ACCESS_TOKEN=pk.... and re-run the render.",
    );
  }
};

// ── Props ─────────────────────────────────────────────────────────────

export interface MapGLProps {
  /** Camera longitude */
  longitude: number;
  /** Camera latitude */
  latitude: number;
  /** Zoom level */
  zoom: number;
  /** Camera pitch in degrees (default 30) */
  pitch?: number;
  /** Camera bearing in degrees (default 0) */
  bearing?: number;
  /** deck.gl layers to overlay */
  layers?: Layer[];
  /** Callback when map + terrain are fully loaded */
  onLoad?: () => void;
  /**
   * Callback fired with the underlying Mapbox GL map instance once tiles
   * are idle. Parent templates can use this to call `map.project()` for
   * auto-label collision avoidance (see RouteAnimation greedy point-label
   * placement, May 14, 2026). Fires AFTER `onLoad`.
   */
  onMapReady?: (map: {
    project: (lonLat: [number, number]) => { x: number; y: number };
    unproject?: (xy: [number, number]) => { lng: number; lat: number };
    // FreeCamera API surface — exposed so the `<CinematicCamera>`
    // wrapper can drive `setFreeCameraOptions()` directly from the same
    // map instance. Optional because non-Mapbox-Standard styles / older
    // mapbox-gl builds may not expose it; CinematicCamera falls back to
    // `jumpTo()` when missing.
    setFreeCameraOptions?: (opts: unknown) => void;
    jumpTo?: (opts: {
      center?: [number, number];
      zoom?: number;
      bearing?: number;
      pitch?: number;
    }) => void;
  }) => void;
  /** Whether to use globe projection (default: true for zoom < 3) */
  globe?: boolean;
  /**
   * Explicit Mapbox projection name. When set, overrides the `globe`
   * auto-choice and the `globe`/`mercator` defaults. Use `equalEarth` for
   * editorially honest world-scale choropleth (area-preserving).
   *
   * See: references/template-research/choropleth-map.md § 6.1
   */
  projection?: "globe" | "mercator" | "equalEarth" | "naturalEarth" | "albers";
  /**
   * Enable terrain hillshading (default: **false** as of May 11, 2026).
   *
   * Flipped from true→false to drop the single biggest "Google Earth" tell
   * — 3D relief on by default reads as satellite app, not atlas plate.
   * Enable per-shot via the template data field when relief is genuinely
   * the editorial point (e.g., a Himalayan supply route, an alpine border
   * dispute). See: remotion-templates/LESSONS.md L99 +
   * references/template-research/map-annotations.md.
   */
  terrain?: boolean;
  /**
   * Visual register — one of `light`, `dark`, `vintage`, `toner`.
   *
   * Default `"light"`. Replaces the previous mutex booleans (`dark`,
   * `vintage`, `toner`) that allowed contradictory combinations. The
   * register chooses both the Mapbox style URL AND a fallback CSS
   * filter to apply when the matching `MAPBOX_STYLE_*_URL` env var is
   * unset (so stock-Mapbox renders approximate the intended look).
   *
   * Orthogonal modulators stay separate (`fogPreset`, `lightPreset`,
   * `labelDensity`, `vignette`, `terrain`) — they compose on top.
   *
   *   • `light`   — default Meridian Light atlas register
   *   • `dark`    — Meridian Dark (typically passed when
   *                 `data.backgroundVariant === "dark"`)
   *   • `vintage` — Meridian Sepia (period episodes; same intent as
   *                 AtlasPlate's `aesthetic: "vintage"`)
   *   • `toner`   — Stadia × Stamen Toner (atmospheric atlas — closer
   *                 to FT / NYT static-print than Mapbox Standard reaches)
   *
   * See: MapGL.types.ts § Register, tools/meridian-toner-setup.md.
   */
  register?: Register;
  /**
   * Atmospheric / fog preset — controls the globe halo via Mapbox's
   * `setFog()` API. Default `editorial` (paper-tinted, no stars, muted
   * horizon). Set `atmospheric` for cinematic cold-open globes;
   * `vintage` for period episodes; `none` to disable atmosphere entirely.
   * Has no visual effect outside globe projection (Mercator + flat
   * projections ignore fog). See: docs.mapbox.com/style-spec/reference/fog/
   */
  fogPreset?: FogPreset;
  /**
   * Mapbox Standard scene lighting preset. Shifts the entire basemap's
   * lighting model (sun angle, ambient color, shadow direction). Default
   * unset — uses whatever the style's `lightPreset` config defaults to
   * (typically `day` for Meridian Light, `night` for Meridian Dark).
   *
   * Use cases:
   *   • `dawn` / `dusk` — twilight register for cold-open globes or
   *     historical episodes ("at dawn the convoy crossed…")
   *   • `night` — diegetic match for late-night narration or covert ops
   *   • `day` — explicit reset when an upstream segment used a different
   *     preset and you want neutral analytical light
   *
   * No-op on classic non-Standard styles (graceful fallback shared with
   * labelDensity). See: docs.mapbox.com/style-spec/reference/imports/
   * (Standard style config) and tools/mapbox-meridian-setup.md.
   */
  lightPreset?: LightPreset;
  /**
   * Show Mapbox's default attribution control (the white "© Mapbox © OSM"
   * pill, bottom-right). Default **false** — license-compliant because
   * the `attribution` prop renders an editorial chip in its place. The
   * default pill is a screaming "this is a web app" signal; editorial
   * outlets always relocate or restyle it.
   */
  showDefaultAttribution?: boolean;
  /**
   * Editorial attribution chip — small Plex Mono small-caps in the
   * bottom-right by default ("MAPBOX · OSM"). Pass an object to add extra
   * source credits (e.g. `{ extras: ["NATURAL EARTH"] }`); pass `false`
   * to suppress entirely (only do this when an enclosing layout puts a
   * MapAttribution chip in FooterStrip directly).
   */
  attribution?: { extras?: ReadonlyArray<string> } | false;
  /**
   * Render a graticule overlay (parallels + meridians) via deck.gl
   * `GeoJsonLayer` interleaved into the Mapbox layer stack. Pass `true`
   * for editorial defaults (10° spacing, opacity 0.10, 30° emphasis), or
   * a `GraticuleConfig` object to override. Pass `false` (default) to
   * omit — graticule is opt-in because it implies an atlas register that
   * not every shot wants.
   *
   * Internally delegates to `buildGraticuleLayers` (see Graticule.tsx) so
   * there's a single canonical graticule implementation across all map
   * templates. Templates that build their own `layers` array already
   * have this path; pass `graticule` here for templates that don't need
   * custom layer composition.
   *
   * Reference: references/template-research/atlas-plate.md § 2e;
   * references/template-research/map-annotations.md § Graticule.
   */
  graticule?: boolean | GraticuleConfig;
  /**
   * Paper-vignette overlay to blend the Mapbox canvas into the editorial
   * surface. `false` (default) for no vignette; `"editorial"` for soft
   * top/bottom darken; `"atlas"` for full corner radial darken; vintage
   * is auto-applied when the `vintage` prop is on.
   */
  vignette?: "editorial" | "atlas" | false;
  /**
   * Label-density register — controls how aggressively Mapbox's automatic
   * place/road/transit labels are suppressed so editorial annotations
   * (MapAnnotations, MapTextArc) win the typographic hierarchy.
   *
   * Default `"editorial"` — country labels visible at globe scale (for
   * orientation), auto-suppress at regional zoom (>= 4). The FT canonical
   * idiom: when the data is the focal element, ambient labels recede.
   *
   * See LabelDensity type above for the other registers.
   */
  labelDensity?: LabelDensity;
  /** Override the Mapbox style URL entirely (bypasses dark/light/vintage selection). */
  styleUrl?: string;
  /**
   * Override the rendered map width in pixels. Defaults to the full frame
   * (layout.width). Set when composing a smaller map — e.g., MapInset
   * renders a ~240px globe in a corner. The wrapping container must be
   * positioned at this size; this prop only sets the inner Mapbox canvas
   * dimensions so they don't bleed out of the container.
   */
  width?: number;
  /** Override the rendered map height in pixels. See `width`. */
  height?: number;
  /** Additional React children — Marker, Source, Layer from react-map-gl */
  children?: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────

export const MapGL: React.FC<MapGLProps> = ({
  longitude,
  latitude,
  zoom,
  pitch = 30,
  bearing = 0,
  layers = [],
  onLoad,
  onMapReady,
  globe,
  projection,
  terrain = false,
  register = "light",
  fogPreset = "editorial",
  lightPreset,
  showDefaultAttribution = false,
  attribution,
  graticule = false,
  vignette = false,
  labelDensity = "editorial",
  styleUrl,
  width,
  height,
  children,
}) => {
  const renderWidth = width ?? layout.width;
  const renderHeight = height ?? layout.height;
  // Fail fast if the Mapbox token isn't configured — without this, every
  // tile request 401s and the render hangs for the delayRender timeout.
  assertMapboxToken();

  // ── Delay render until map tiles are loaded ─────────────────────────
  const [handle] = useState(() => delayRender("Loading map tiles..."));
  const [loaded, setLoaded] = useState(false);
  const mapRef = useRef<MapRef | null>(null);

  // Wait for 'idle' (all tiles downloaded + composited), NOT just 'load'
  // (style JSON parsed). The delta is exactly the "warm-up" visible in
  // Studio and renders: tiles are fetched after 'load', so firing
  // continueRender on 'load' lets Remotion capture a frame with partially-
  // blank tile slots. See: remotion.dev/docs/maps, LESSONS.md L102.
  //
  // Apply fogPreset via setFog() ON the map instance — must happen after
  // the style is loaded but before we wait for tile-idle. The fog spec
  // affects horizon + atmosphere rendering, not tile loading. Wrapped in
  // try/catch because pre-globe Mapbox builds throw on setFog().
  const handleLoad = useCallback((evt: MapEvent) => {
    // evt.target is the underlying Mapbox `Map` instance. We only need
    // `once` to wait for tile-idle; cast through `unknown` to the narrow
    // shape we use here (mapbox-gl's exported Map type carries hundreds of
    // methods we don't touch).
    const map = evt.target as unknown as {
      once: (event: string, cb: () => void) => void;
    };
    // NOTE: fog and label-density application both moved OUT of
    // handleLoad into useEffects that watch their respective deps. This
    // keeps the runtime reactive — a prop change after mount (e.g.,
    // camera zooming across the editorial-suppression threshold, or a
    // future template wanting to toggle fogPreset mid-render) re-applies
    // automatically. handleLoad now just waits for tile-idle and fires
    // continueRender.
    map.once("idle", () => {
      setLoaded(true);
      continueRender(handle);
      onLoad?.();
      // Fire onMapReady with the underlying Mapbox instance once tiles
      // are idle. Parent templates use this to access map.project() for
      // greedy label-collision avoidance.
      try {
        onMapReady?.(map as never);
      } catch {
        // onMapReady is an optional consumer hook; failures shouldn't
        // affect tile rendering.
      }
    });
  }, [handle, onLoad, onMapReady]);

  // ── Fog-preset effect — symmetric with labelDensity. Re-applies when
  // the fogPreset prop changes after mount. Most templates don't change
  // fogPreset per-frame (it's a template-level constant), but the symmetric
  // reactivity prevents a future bug where a script transitions registers
  // dramatically (editorial cold-open → atmospheric globe reveal) and the
  // fog stays stuck on the initial preset.
  const lastFogRef = useRef<FogPreset | null>(null);
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    if (lastFogRef.current === fogPreset) return;
    // MapRef intentionally omits style-mutation methods (setFog, setStyle,
    // addLayer, …) to discourage call sites that would break the React
    // binding. We want them: this template renders a static map per frame
    // and explicitly re-applies the fog spec. Reach through .getMap() to
    // the raw mapbox-gl `Map` instance which carries the full API.
    const mapInstance = mapRef.current.getMap();
    // setFog may not exist on pre-globe Mapbox builds; guard at runtime.
    if (!mapInstance || typeof mapInstance.setFog !== "function") return;

    try {
      const spec = FOG_PRESETS[fogPreset];
      mapInstance.setFog(spec === null ? null : (spec as Record<string, unknown>));
      lastFogRef.current = fogPreset;
    } catch {
      // setFog() throws on non-globe projections; the projection logic
      // gates this in practice, but we swallow defensively. The map renders
      // fine without fog.
    }
  }, [loaded, fogPreset]);

  // ── Light-preset effect — Mapbox Standard `setConfigProperty` for the
  // basemap import's `lightPreset` config. Reactive so a script can
  // transition `day → dusk` between segments without remounting the map.
  // Skipped entirely when the prop is undefined (lets the style's own
  // default win — typically `day` for Meridian Light).
  const lastLightRef = useRef<LightPreset | null>(null);
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    if (!lightPreset) return;
    if (lastLightRef.current === lightPreset) return;
    if (!LIGHT_PRESETS.includes(lightPreset)) return;
    const wrapper = mapRef.current;
    const mapInstance =
      typeof wrapper.getMap === "function" ? wrapper.getMap() : wrapper;
    if (!mapInstance) return;
    const ok = applyLightPreset(mapInstance, lightPreset);
    if (ok) lastLightRef.current = lightPreset;
  }, [loaded, lightPreset]);

  // ── Label-density effect — re-apply as camera zoom crosses the editorial
  // threshold. Tracks the last applied register in a ref so we only call
  // setConfigProperty on TRANSITIONS, not every frame — setConfigProperty
  // triggers a style reparse internally, so 30 calls/sec would tank
  // framerate. With the transition-only gate we apply once at mount, then
  // again only when the zoom crosses 4 (the editorial threshold).
  const lastEffectiveRef = useRef<"atlas" | "minimal" | "off" | null>(null);
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const effective = resolveEffectiveLabelDensity(labelDensity, zoom);
    if (lastEffectiveRef.current === effective) return; // no transition

    // Get the underlying Mapbox GL map from react-map-gl's wrapper.
    // react-map-gl v8 exposes `.getMap()` on its ref; older versions
    // and bare Mapbox instances expose the methods directly on the ref.
    // We require ONE of the two paths to produce something with
    // `setConfigProperty` — if neither, the call is a no-op (one-shot
    // warning fires from applyLabelDensity). This is stricter than
    // `getMap?.() ?? mapRef.current` which would silently fall through
    // to the wrapper (which lacks setConfigProperty) and lose the warning.
    const wrapper = mapRef.current;
    const mapInstance =
      typeof wrapper.getMap === "function" ? wrapper.getMap() : wrapper;
    if (!mapInstance) return;
    const ok = applyLabelDensity(mapInstance, effective);
    if (ok) {
      lastEffectiveRef.current = effective;
    }
  }, [loaded, labelDensity, zoom]);

  // Safety: continue render after timeout to avoid infinite hang
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!loaded) {
        // One-shot safety warning after a 30s map-load timeout — fires at most
        // once per mount, not per frame. Lint rule allowance documented.
        // eslint-disable-next-line no-console
        console.warn("MapGL: Timed out waiting for map load, continuing render");
        continueRender(handle);
      }
    }, 30000);
    return () => clearTimeout(timeout);
  }, [handle, loaded]);

  // Register-derived shorthands — locals consumed by sub-components
  // (Graticule, Vignette, Attribution) that need "is this dark / vintage
  // context?" without re-implementing the register taxonomy.
  const isDark = register === "dark";
  const isVintage = register === "vintage";

  // Merge user `layers` with graticule layers (when graticule prop is set).
  // The graticule layers come first so they render UNDER the user's content
  // (arcs, scatter, country fills) but OVER the base tiles.
  const graticuleLayers =
    graticule === false || graticule === undefined
      ? []
      : buildGraticuleLayers(
          graticule === true ? {} : graticule,
          { dark: isDark },
        );
  const composedLayers = graticuleLayers.length
    ? [...graticuleLayers, ...layers]
    : layers;

  const useGlobe = globe ?? zoom < 3;
  // Explicit projection prop wins over the globe/mercator auto-choice.
  const resolvedProjection = projection ?? (useGlobe ? "globe" : "mercator");

  // Style URL: `styleUrl` override wins; otherwise lookup by register.
  // The dict-driven model replaced an implicit precedence chain
  // (`toner ? sepia : vintage ? sepia : dark ? dark : light`) where
  // simultaneous booleans were silently resolved. Now the register IS
  // the choice — the type system enforces "one at a time."
  const resolvedStyleUrl = styleUrl ?? MAP_STYLES[register];
  // Fallback CSS filter — when the register's style URL collapsed to
  // the default Light style (i.e., `MAPBOX_STYLE_<REGISTER>_URL` env
  // var unset), apply a register-appropriate filter so renders
  // approximate the intended register until the Studio fork is published.
  // Light + Dark have no filter (stock light-v11 / dark-v11 look
  // register-appropriate enough); Vintage + Toner get the warm sepia /
  // grayscale tints respectively.
  const usesFallback = register !== "light" && MAP_STYLES[register] === MAP_STYLES.light;
  const wrapperFilter = usesFallback ? REGISTER_FALLBACK_FILTERS[register] : undefined;

  return (
    <AbsoluteFill style={{ overflow: "hidden", filter: wrapperFilter }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAP_CONFIG.accessToken}
        mapStyle={resolvedStyleUrl}
        // Hide the default white "© Mapbox © OSM Improve this map" pill
        // unless explicitly opted in. Editorial outlets relocate this to
        // a custom chip; FooterStrip carries the equivalent via
        // <MapAttribution>. License-compliant because attribution still
        // renders, just in the right register.
        attributionControl={showDefaultAttribution}
        longitude={longitude}
        latitude={latitude}
        zoom={zoom}
        pitch={pitch}
        bearing={bearing}
        projection={resolvedProjection}
        onLoad={handleLoad}
        // Render quality: antialiasing smooths line edges (country borders,
        // route arcs) at the cost of GPU; for offline video render this is
        // essentially free since we're not chasing 60fps interactivity.
        antialias={true}
        // Disable all interaction — this is video, not interactive
        scrollZoom={false}
        boxZoom={false}
        dragRotate={false}
        dragPan={false}
        keyboard={false}
        doubleClickZoom={false}
        touchZoomRotate={false}
        touchPitch={false}
        // Suppress Mapbox's built-in 300ms tile-fade-in animation.
        // Without this, tiles are present in the framebuffer but opacity-
        // animating toward 1 — producing the visible "warm-up" in renders.
        // See: remotion.dev/docs/maps § "Disable animations".
        fadeDuration={0}
        // Prevent WebGL from clearing its framebuffer between paints.
        // Required for Remotion's screenshot mechanism to read the canvas
        // reliably; without it the captured frame may be all-black.
        preserveDrawingBuffer={true}
        // Fill the Remotion frame (or the provided width/height override).
        style={{ width: renderWidth, height: renderHeight }}
      >
        {/* Terrain DEM source — provides hillshading and 3D relief */}
        {terrain && (
          <Source
            id="mapbox-dem"
            type="raster-dem"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
            maxzoom={14}
          />
        )}

        {/* deck.gl overlay — country fills, arcs, scatterplots, AND
            graticule lines when the graticule prop is set. */}
        {composedLayers.length > 0 && <DeckGLOverlay layers={composedLayers} />}

        {/* Template-specific children: Markers, Sources, Layers */}
        {children}
      </Map>
      {/* Editorial overlay: paper vignette to blend the map canvas into
          the page chrome. Auto-applies vintage variant when register is
          `vintage`; otherwise uses the requested `vignette` value (or none). */}
      {(vignette || isVintage) && (
        <MapVignette
          variant={isVintage ? "vintage" : (vignette as "editorial" | "atlas")}
          dark={isDark}
        />
      )}
      {/* Editorial attribution chip (MAPBOX · OSM · …). Opt-out by passing
          attribution={false} — only do this when an enclosing layout puts
          a MapAttribution chip in FooterStrip directly. */}
      {attribution !== false && (
        <MapAttribution
          extras={attribution?.extras}
          dark={isDark}
          placement="bottom-right"
        />
      )}
    </AbsoluteFill>
  );
};

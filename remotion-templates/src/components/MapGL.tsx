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
import { MapboxOverlay } from "@deck.gl/mapbox";
import { layout, mapConfig } from "../design/theme";
import "mapbox-gl/dist/mapbox-gl.css";

// ── deck.gl ↔ Mapbox bridge ────────────────────────────────────────────

/**
 * Renders deck.gl layers inside a react-map-gl Map.
 * Uses MapboxOverlay (interleaved mode) so deck.gl layers
 * composite correctly with Mapbox's terrain and label layers.
 */
const DeckGLOverlay: React.FC<{ layers: any[] }> = ({ layers }) => {
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
  /** Read from .env at build time. Never commit this token. */
  accessToken: process.env.MAPBOX_ACCESS_TOKEN || "",
  terrain: mapConfig.terrain,
  projection: mapConfig.projection,
} as const;

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
  layers?: any[];
  /** Callback when map + terrain are fully loaded */
  onLoad?: () => void;
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
  /** Enable terrain hillshading (default: true) */
  terrain?: boolean;
  /** Use the dark Meridian style instead of light (default: false). Templates pass this when the episode is in dark mode. */
  dark?: boolean;
  /** Override the Mapbox style URL entirely (bypasses dark/light selection). */
  styleUrl?: string;
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
  globe,
  projection,
  terrain = true,
  dark = false,
  styleUrl,
  children,
}) => {
  // Fail fast if the Mapbox token isn't configured — without this, every
  // tile request 401s and the render hangs for the delayRender timeout.
  assertMapboxToken();

  // ── Delay render until map tiles are loaded ─────────────────────────
  const [handle] = useState(() => delayRender("Loading map tiles..."));
  const [loaded, setLoaded] = useState(false);
  const mapRef = useRef<any>(null);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    continueRender(handle);
    onLoad?.();
  }, [handle, onLoad]);

  // Safety: continue render after timeout to avoid infinite hang
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!loaded) {
        console.warn("MapGL: Timed out waiting for map load, continuing render");
        continueRender(handle);
      }
    }, 30000);
    return () => clearTimeout(timeout);
  }, [handle, loaded]);

  const useGlobe = globe ?? zoom < 3;
  // Explicit projection prop wins over the globe/mercator auto-choice.
  const resolvedProjection = projection ?? (useGlobe ? "globe" : "mercator");

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAP_CONFIG.accessToken}
        mapStyle={styleUrl ?? (dark ? MAP_CONFIG.darkStyleUrl : MAP_CONFIG.styleUrl)}
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
        // Fill the Remotion frame
        style={{ width: layout.width, height: layout.height }}
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

        {/* deck.gl overlay layers (country fills, arcs, scatterplots) */}
        {layers.length > 0 && <DeckGLOverlay layers={layers} />}

        {/* Template-specific children: Markers, Sources, Layers */}
        {children}
      </Map>
    </AbsoluteFill>
  );
};

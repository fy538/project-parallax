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
  /** Mapbox Studio style — replace with custom Meridian Dark style ID. */
  styleUrl: mapConfig.styleUrl,
  /** Read from .env at build time. Never commit this token. */
  accessToken: process.env.MAPBOX_ACCESS_TOKEN || "",
  terrain: mapConfig.terrain,
  projection: mapConfig.projection,
} as const;

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
  /** Enable terrain hillshading (default: true) */
  terrain?: boolean;
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
  terrain = true,
  children,
}) => {
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

  return (
    <AbsoluteFill>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAP_CONFIG.accessToken}
        mapStyle={MAP_CONFIG.styleUrl}
        longitude={longitude}
        latitude={latitude}
        zoom={zoom}
        pitch={pitch}
        bearing={bearing}
        projection={useGlobe ? "globe" : "mercator"}
        onLoad={handleLoad}
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

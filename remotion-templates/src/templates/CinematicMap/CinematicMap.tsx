/**
 * CinematicMap — terrain fly-through template.
 *
 * Editorial use case: camera pitched 30–75°, flying along terrain at
 * 200–10,000 m altitude. Terrain relief visible. No data layers required
 * (pure camera story). Examples: Khyber Pass approach, strait chokepoint
 * reveal, alpine border context.
 *
 * Architecture:
 *   <MapGL>                  — Mapbox canvas, terrain DEM, fog, dark register
 *     [MapAnnotations]       — optional editorial labels (inside MapGL as child)
 *   <CinematicCamera>        — drives FreeCamera per-frame (outside MapGL)
 *
 * The tile pre-warmer (warmTiles) runs in the onMapReady callback. It
 * visits each keyframe position via jumpTo() to trigger DEM tile fetches,
 * polls areTilesLoaded(), then resets to keyframe[0] before releasing the
 * Remotion delay handle. Both MapGL's own 'idle' handle AND this warmTiles
 * handle must resolve before frame 0 is captured.
 *
 * Doctrine (enforced here, not by data):
 *   • NO title overlay — cinematic maps don't title. The shot IS the argument.
 *   • NO phase system — the camera path IS the temporal structure.
 *   • NO data layers (deck.gl) — use RouteAnimation if you need arcs/points.
 *   • @composition-animation: delegated — CinematicCamera owns all motion.
 *     useCompAnim is intentionally omitted (no Ken Burns drift).
 *
 * See: references/template-research/cinematic-map.md
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  useVideoConfig,
} from "remotion";
import { MapGL } from "../../components/MapGL";
import {
  CinematicCamera,
  zoomToAltitudeM,
  type CinematicMapInstance,
} from "../../components/CinematicCamera";
import { MapAnnotations } from "../../components/MapAnnotations";
import { Background } from "../../components/Background";
import { layout } from "../../design/theme";
import {
  buildKeyframesFromSec,
  warmTiles,
  type WarmableMapInstance,
} from "../../utils/cinematicMapUtils";
import type { CinematicMapData } from "./types";

// ── Defaults ──────────────────────────────────────────────────────────────
//
// Dark register + atmospheric fog + dusk light is the cinematic stack that
// makes terrain relief pop (long shadows, warm ambient, dark space). Authors
// can override per shot via data fields.

const DEFAULT_REGISTER = "dark" as const;
const DEFAULT_FOG_PRESET = "atmospheric" as const;
const DEFAULT_LIGHT_PRESET = "dusk" as const;
const DEFAULT_TERRAIN = true;
const DEFAULT_TERRAIN_EXAGGERATION = 1.5;
const DEFAULT_PITCH = 30;
const DEFAULT_BEARING = 0;
const DEFAULT_ALTITUDE_M = 5_000_000;

// ── Component ─────────────────────────────────────────────────────────────

export const CinematicMap: React.FC<{ data: CinematicMapData }> = ({ data }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const compositionDurationSec = durationInFrames / fps;

  // ── Remotion delay-render lifecycle ──────────────────────────────────────
  //
  // Two delay handles:
  //   1. MapGL's own handle — fires continueRender on the map's 'idle' event
  //      at the INITIAL camera position. Managed entirely by MapGL internally.
  //   2. warmTiles handle — we hold this open while visiting all keyframe
  //      positions to pre-fetch DEM tiles. Released when warmTiles resolves.
  //
  // Both handles must resolve before Remotion captures frame 0.
  const [warmHandle] = useState(() =>
    delayRender("CinematicMap: warming terrain tiles at keyframe positions..."),
  );
  const [mapInstance, setMapInstance] = useState<CinematicMapInstance | null>(null);

  // ── Frame-based keyframes (computed once) ─────────────────────────────────
  //
  // Convert sec-based authoring keyframes → frame-based CameraKeyframe[].
  // useMemo prevents recomputation on every 30fps render tick.
  const frameKeyframes = useMemo(
    () => buildKeyframesFromSec(data.keyframes, fps),
    // data.keyframes is stable (from JSON); fps is constant per composition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fps, data.keyframes],
  );

  // ── Initial camera position ───────────────────────────────────────────────
  //
  // MapGL needs longitude/latitude/zoom/pitch/bearing for its initial static
  // pose (before CinematicCamera takes over via FreeCamera). Derived from
  // keyframes[0] so the first frame renders the correct start position.
  const firstKf = data.keyframes[0];
  const firstAltM =
    firstKf.altitudeM != null
      ? firstKf.altitudeM
      : firstKf.zoom != null
        ? zoomToAltitudeM(firstKf.zoom)
        : DEFAULT_ALTITUDE_M;
  const initialZoom = Math.log2(7_000_000 / firstAltM) + 1;
  const initialLng = firstKf.center[0];
  const initialLat = firstKf.center[1];
  const initialPitch = firstKf.pitch ?? DEFAULT_PITCH;
  const initialBearing = firstKf.bearing ?? DEFAULT_BEARING;

  // ── Tile pre-warmer callback ──────────────────────────────────────────────
  //
  // onMapReady fires AFTER MapGL's own 'idle' event — the initial camera
  // position is already fully loaded. We then:
  //   1. Visit remaining keyframe positions to pre-fetch DEM tiles
  //   2. Call continueRender(warmHandle) when done
  //
  // terrain exaggeration is now handled by MapGL's own useEffect (via the
  // terrainExaggeration prop), so we no longer need to call setTerrain() here.
  const terrainExaggeration =
    data.terrainExaggeration ?? DEFAULT_TERRAIN_EXAGGERATION;
  const terrain = data.terrain ?? DEFAULT_TERRAIN;

  const handleMapReady = useCallback(
    (map: {
      project: (lonLat: [number, number]) => { x: number; y: number };
      setFreeCameraOptions?: (opts: unknown) => void;
      jumpTo?: (opts: {
        center?: [number, number];
        zoom?: number;
        bearing?: number;
        pitch?: number;
      }) => void;
    }) => {
      // Store for CinematicCamera.
      setMapInstance(map as CinematicMapInstance);

      // Tile pre-warm. Guard on the required API surface — in test environments
      // or older Mapbox builds, skip gracefully (tiles may be patchy).
      const warmableMap = map as unknown as Partial<WarmableMapInstance>;
      const canWarm =
        typeof warmableMap.jumpTo === "function" &&
        typeof warmableMap.areTilesLoaded === "function";

      if (!canWarm) {
        // eslint-disable-next-line no-console
        console.warn(
          "[CinematicMap] warmTiles: map.jumpTo or map.areTilesLoaded " +
            "unavailable — skipping tile pre-warm. DEM tiles may be incomplete. " +
            "Ensure mapbox-gl >= 2.0 is installed.",
        );
        continueRender(warmHandle);
        return;
      }

      warmTiles(warmableMap as WarmableMapInstance, data.keyframes)
        .then(() => { continueRender(warmHandle); })
        .catch(() => { continueRender(warmHandle); });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [warmHandle, data.keyframes],
  );

  // ── Resolved register props ───────────────────────────────────────────────
  const register = data.register ?? DEFAULT_REGISTER;
  const fogPreset = data.fogPreset ?? DEFAULT_FOG_PRESET;
  const lightPreset = data.lightPreset ?? DEFAULT_LIGHT_PRESET;
  const backgroundVariant = data.backgroundVariant ?? "dark";
  const isDark = register === "dark";

  return (
    <Background variant={backgroundVariant}>
      {/*
        @composition-animation: delegated
        useCompAnim is intentionally omitted — CinematicCamera
        owns all motion. No Ken Burns drift should be applied on top.
      */}
      <AbsoluteFill>
        <MapGL
          longitude={initialLng}
          latitude={initialLat}
          zoom={initialZoom}
          pitch={initialPitch}
          bearing={initialBearing}
          register={register}
          fogPreset={fogPreset}
          lightPreset={lightPreset}
          terrain={terrain}
          terrainExaggeration={terrainExaggeration}
          graticule={data.graticule ?? false}
          vignette="editorial"
          labelDensity="minimal"
          onMapReady={handleMapReady}
          attribution={
            data.source
              ? { extras: [data.source.toUpperCase()] }
              : undefined
          }
        >
          {/*
            MapAnnotations goes INSIDE MapGL (as a child) so it renders
            as a sibling in the Map's JSX tree — this matches the RouteAnimation
            pattern and lets react-map-gl track the camera transform for
            projection (lon/lat → screen-xy).

            No phaseWindows — CinematicMap has no phase system. Annotations
            use explicit appearAtSec/exitAtSec or persist for the whole shot.
          */}
          {data.annotations && data.annotations.length > 0 && (
            <MapAnnotations
              annotations={data.annotations}
              compositionDurationSec={compositionDurationSec}
              dark={isDark}
            />
          )}
        </MapGL>

        {/*
          CinematicCamera goes OUTSIDE MapGL (as a sibling in AbsoluteFill).
          Renders null — pure side-effect: calls setFreeCameraOptions() or
          jumpTo() on the map instance every frame. mapInstance is null until
          onMapReady fires, which CinematicCamera handles gracefully (no-op).
        */}
        <CinematicCamera map={mapInstance} keyframes={frameKeyframes} />
      </AbsoluteFill>
    </Background>
  );
};

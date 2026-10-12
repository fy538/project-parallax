/**
 * TerritoryMap — animated territorial control map.
 *
 * Shows how territorial control changed over time. Each frame corresponds
 * to a point in a timestep sequence; region fills crossfade from one
 * actor's color to another as control changes.
 *
 * Use cases: Ottoman retreat 1700–1920, ISIS caliphate growth/shrink
 * 2014–2019, COCOM membership evolution.
 *
 * Architecture:
 *   mode: "country"      — Mapbox vector tileset + Source/Layer match expression
 *   mode: "subnational"  — deck.gl GeoJsonLayer with getFillColor accessor
 *
 * Color crossfade: lerpHex(fromActorFill, toActorFill, crossfadeT) where
 * crossfadeT progresses from 0→1 over crossfadeSec seconds per step.
 * Timesteps marked `snap: true` use a hard cut at the midpoint.
 *
 * Timeline strip: SVG overlay rendered outside MapGL at the bottom of the
 * composition. Shows horizontal timestep nodes; active node is gold-filled,
 * past nodes are umber, future nodes are taupe at 40% opacity.
 *
 * See: references/template-research/ (to be authored) + types.ts / schema.ts
 */

import React, { useMemo, useState, useCallback } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { Source, Layer, Marker } from "react-map-gl/mapbox";
import { GeoJsonLayer } from "@deck.gl/layers";
import {
  palette,
  fonts,
  fontSizes,
  layout,
  sec,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { lerpHex, hexToRgba } from "../../utils/mapUtils";
import { warnIf } from "../../utils/dataWarnings";
import { Background } from "../../components/Background";
import { MapGL } from "../../components/MapGL";
import { MapAnnotations } from "../../components/MapAnnotations";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { MapTitleFrame } from "../../components/MapTitleFrame";
import { CLAMP_SINE } from "../../utils/animation";
import type { TerritoryMapData } from "./types";

// ── Timeline strip ──────────────────────────────────────────────────────────

interface TimelineStripProps {
  timesteps: TerritoryMapData["timesteps"];
  /** Fractional active index (0 → last timestep). Allows sub-step position for progress cursor. */
  stepF: number;
  dark: boolean;
}

const TimelineStrip: React.FC<TimelineStripProps> = ({ timesteps, stepF, dark }) => {
  const n = timesteps.length;
  const svgWidth = layout.width;
  const svgHeight = 80;

  // Horizontal margins
  const marginX = 80;
  const usableWidth = svgWidth - marginX * 2;
  const spacing = n > 1 ? usableWidth / (n - 1) : 0;

  // Row positions within the SVG
  const nodeY = 32;
  const labelY = 56;

  // Track line color
  const trackColor = dark ? palette.umber : palette.taupe;

  // Colors for nodes by state
  const activeColor = palette.gold;
  const pastColor = palette.umber;
  const futureColor = palette.taupe;

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      style={{ position: "absolute", bottom: 0, left: 0, pointerEvents: "none" }}
    >
      {/* Track line */}
      {n > 1 && (
        <line
          x1={marginX}
          y1={nodeY}
          x2={marginX + usableWidth}
          y2={nodeY}
          stroke={trackColor}
          strokeWidth={1}
          opacity={0.4}
        />
      )}

      {/* Progress cursor — smooth horizontal dot between nodes */}
      {n > 1 && (
        <circle
          cx={marginX + stepF * spacing}
          cy={nodeY}
          r={4}
          fill={activeColor}
          opacity={0.85}
        />
      )}

      {/* Nodes + labels */}
      {timesteps.map((ts, i) => {
        const cx = marginX + i * spacing;
        const isActive = Math.round(stepF) === i;
        const isPast = i < stepF;

        let fill = futureColor;
        let fillOpacity = 0.4;
        let r = 5;

        if (isActive) {
          fill = activeColor;
          fillOpacity = 1;
          r = 10;
        } else if (isPast) {
          fill = pastColor;
          fillOpacity = 0.85;
          r = 5;
        }

        return (
          <g key={ts.id}>
            <circle
              cx={cx}
              cy={nodeY}
              r={r}
              fill={fill}
              fillOpacity={fillOpacity}
            />
            <text
              x={cx}
              y={labelY}
              textAnchor="middle"
              fontFamily={fonts.mono}
              fontSize={fontSizes.meta}
              fill={isActive ? activeColor : (dark ? palette.umber : palette.taupe)}
              fillOpacity={isActive ? 1 : 0.7}
              letterSpacing={1.5}
            >
              {ts.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ── calculateMetadata export ────────────────────────────────────────────────

import { standardMetadata } from "../../utils/composition";

export const calculateMetadata = standardMetadata<TerritoryMapData>(10);

// ── Main component ──────────────────────────────────────────────────────────

export const TerritoryMap: React.FC<{ data: TerritoryMapData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  // useDirection and useThemeMode must be called unconditionally (Rules of Hooks)
  // even if only their side-effects / atmosphere resolution are used by a caller.
  // For TerritoryMap, direction/theme aren't used beyond the hook call because
  // isDark is derived from the data props directly (needed before MapGL mounts).
  useDirection(data._direction);
  useThemeMode(data.backgroundVariant ?? "dark");
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });

  // ── Dev-time data warnings ──────────────────────────────────────────────
  warnIf(
    data.timesteps.length < 2,
    "TerritoryMap",
    "timesteps must have at least 2 entries — received fewer.",
  );
  warnIf(
    Object.keys(data.actors).length === 0,
    "TerritoryMap",
    "actors is empty — no fills will render.",
  );
  warnIf(
    data.mode === "subnational" && !data.geoJsonUrl,
    "TerritoryMap",
    "mode is \"subnational\" but geoJsonUrl is not set — GeoJsonLayer will render blank.",
  );

  // ── GeoJSON state (subnational mode) ────────────────────────────────────
  const [geoJsonData, setGeoJsonData] = useState<any | null>(null);

  // Load GeoJSON when in subnational mode. Uses a simple fetch; the
  // Remotion `delayRender` lifecycle is already handled by MapGL's own
  // idle-event handle so we don't need a second handle here.
  React.useEffect(() => {
    if (data.mode !== "subnational" || !data.geoJsonUrl) return;
    let cancelled = false;
    fetch(data.geoJsonUrl)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setGeoJsonData(json);
      })
      .catch((err) => {
        // GeoJSON load failure is non-fatal — render without fills.
        // eslint-disable-next-line no-console
        console.warn("[TerritoryMap] Failed to load geoJsonUrl:", err);
      });
    return () => { cancelled = true; };
  }, [data.mode, data.geoJsonUrl]);

  // ── Timestep math ─────────────────────────────────────────────────────
  //
  // Map frame 0 → timestep 0, frame durationInFrames → timestep N-1.
  // stepF is a float in [0, N-1]; stepIdx is the integer floor (clamped
  // so stepIdx+1 always exists as a valid index to crossfade toward).
  const n = data.timesteps.length;
  const stepF = n > 1
    ? Math.min((frame / durationInFrames) * (n - 1), n - 1)
    : 0;
  const stepIdx = Math.min(Math.floor(stepF), n - 2);
  const stepFrac = stepF - stepIdx; // 0→1 progress between stepIdx and stepIdx+1

  // ── Crossfade t ───────────────────────────────────────────────────────
  //
  // crossfadeT goes 0→1 over crossfadeSec seconds within the current step
  // window. When `snap: true`, the crossfade is binary — hard cut at 0.5.
  const crossfadeSec = data.crossfadeSec ?? 0.5;
  const currentStep = data.timesteps[stepIdx];
  const nextStep = data.timesteps[Math.min(stepIdx + 1, n - 1)];

  // The proportion of the step window that crossfadeSec occupies.
  // stepFrac ∈ [0, 1] over the full interval from stepIdx to stepIdx+1.
  // We want crossfadeT to reach 1.0 when stepFrac = crossfadeSec / (1/fps * fps_per_step).
  // Since each step spans (durationInFrames / (n-1)) frames, and crossfadeSec
  // seconds corresponds to crossfadeSec * fps frames, the fraction at which
  // the crossfade completes is crossfadeSec * fps / (durationInFrames / (n-1)).
  const framesPerStep = durationInFrames / Math.max(n - 1, 1);
  const crossfadeFrac = crossfadeSec * fps / framesPerStep; // fraction of step window

  const crossfadeT = currentStep?.snap
    ? (stepFrac > 0.5 ? 1 : 0) // hard cut at midpoint
    : Math.min(stepFrac / Math.max(crossfadeFrac, 0.001), 1);

  // ── Country mode: Mapbox match expression ─────────────────────────────

  const fillExpression = useMemo(() => {
    if (data.mode === "subnational") return ["literal", "rgba(0,0,0,0)"];

    const fromStepId = currentStep?.id ?? "";
    const toStepId = nextStep?.id ?? fromStepId;

    const entries: any[] = [];
    for (const region of data.regions) {
      const fromActorId = data.control[region.id]?.[fromStepId];
      const toActorId = data.control[region.id]?.[toStepId] ?? fromActorId;
      if (!fromActorId && !toActorId) continue;

      const fromFill = fromActorId ? (data.actors[fromActorId]?.fill ?? "rgba(0,0,0,0)") : "rgba(0,0,0,0)";
      const toFill = toActorId ? (data.actors[toActorId]?.fill ?? fromFill) : fromFill;
      const fill = lerpHex(
        fromFill.startsWith("#") ? fromFill : palette.taupe,
        toFill.startsWith("#") ? toFill : palette.taupe,
        crossfadeT,
      );
      entries.push(region.id, fill);
    }

    if (entries.length === 0) return ["literal", "rgba(0,0,0,0)"];
    return ["match", ["get", "iso_3166_1_alpha_3"], ...entries, "rgba(0,0,0,0)"];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.regions, data.control, data.actors, data.mode, stepIdx, crossfadeT, currentStep, nextStep]);

  // ── Subnational mode: deck.gl GeoJsonLayer ────────────────────────────

  const territoryLayer = useMemo(() => {
    if (data.mode !== "subnational" || !geoJsonData) return null;

    const fromStepId = currentStep?.id ?? "";
    const toStepId = nextStep?.id ?? fromStepId;

    return new GeoJsonLayer({
      id: "territory-fills",
      data: geoJsonData,
      filled: true,
      stroked: true,
      getFillColor: (feature: any) => {
        const regionId = feature.properties?.id as string | undefined;
        if (!regionId) return [136, 135, 128, 0];

        const fromActorId = data.control[regionId]?.[fromStepId];
        const toActorId = data.control[regionId]?.[toStepId] ?? fromActorId;
        if (!fromActorId && !toActorId) return [136, 135, 128, 0];

        const fromFill = fromActorId ? (data.actors[fromActorId]?.fill ?? palette.taupe) : palette.taupe;
        const toFill = toActorId ? (data.actors[toActorId]?.fill ?? fromFill) : fromFill;
        const hex = lerpHex(fromFill, toFill, crossfadeT);
        return hexToRgba(hex, 200);
      },
      getLineColor: [28, 24, 20, 60], // palette.ink at ~24% opacity
      getLineWidth: 1,
      lineWidthUnits: "pixels",
      updateTriggers: {
        getFillColor: [stepIdx, crossfadeT],
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.mode, geoJsonData, data.control, data.actors, stepIdx, crossfadeT, currentStep, nextStep]);

  // ── Map instance (for MapAnnotations) ────────────────────────────────
  const [mapInstance, setMapInstance] = useState<{
    project: (lonLat: [number, number]) => { x: number; y: number };
  } | null>(null);

  const handleMapReady = useCallback((map: {
    project: (lonLat: [number, number]) => { x: number; y: number };
  }) => {
    setMapInstance(map);
  }, []);

  // ── Resolved props ────────────────────────────────────────────────────
  const register = data.register ?? "dark";
  const isDark = register === "dark" || (data.backgroundVariant ?? "dark") === "dark";
  const layers = territoryLayer ? [territoryLayer] : [];

  // Fade in over first 0.5s
  const mapOpacity = interpolate(frame, [0, sec(0.5)], [0, 1], CLAMP_SINE);

  // Current actor display for HeaderStrip metadata
  const lat = data.center[1];
  const lng = data.center[0];
  const latStr = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}`;
  const lngStr = `${Math.abs(lng).toFixed(1)}°${lng >= 0 ? "E" : "W"}`;
  const currentTimestepLabel = data.timesteps[Math.round(stepF)]?.label ?? "";

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <Background variant={data.backgroundVariant ?? "dark"}>
      <AbsoluteFill style={compStyle}>
        {/* Brand strips */}
        <HeaderStrip
          metadata={`${data.episode ? data.episode + " · " : ""}${currentTimestepLabel} · ${latStr} ${lngStr}`}
          mode={isDark ? "dark" : "light"}
        />
        <FooterStrip
          scale={`Z${data.zoom.toFixed(1)}`}
          mode={isDark ? "dark" : "light"}
        />

        {/* Map canvas */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: mapOpacity,
          }}
        >
          <MapGL
            longitude={data.center[0]}
            latitude={data.center[1]}
            zoom={data.zoom}
            pitch={data.pitch ?? 0}
            bearing={data.bearing ?? 0}
            register={register}
            fogPreset={data.fogPreset ?? "atmospheric"}
            lightPreset={data.lightPreset}
            terrain={false}
            layers={layers}
            graticule={data.graticule ?? false}
            labelDensity="editorial"
            onMapReady={handleMapReady}
            attribution={
              data.source ? { extras: [data.source.toUpperCase()] } : undefined
            }
          >
            {/* Country mode: Mapbox Source + fill/border Layers */}
            {data.mode !== "subnational" && (
              <>
                <Source
                  id="country-boundaries"
                  type="vector"
                  url="mapbox://mapbox.country-boundaries-v1"
                >
                  <Layer
                    id="territory-fills"
                    type="fill"
                    source-layer="country_boundaries"
                    paint={{
                      "fill-color": fillExpression as any, // no-as-any-ok: mapbox-expression
                      "fill-opacity": data.regions.length > 0 ? 0.8 : 0,
                    }}
                  />
                  <Layer
                    id="territory-borders"
                    type="line"
                    source-layer="country_boundaries"
                    paint={{
                      "line-color": palette.ink,
                      "line-opacity": 0.15,
                      "line-width": 0.5,
                    }}
                  />
                </Source>

                {/* Actor-label Markers at region centroids */}
                {(data.showActorLabels !== false) &&
                  data.regions
                    .filter((r) => r.centroid)
                    .map((region) => {
                      const fromStepId = currentStep?.id ?? "";
                      const actorId = data.control[region.id]?.[fromStepId];
                      const actor = actorId ? data.actors[actorId] : undefined;
                      if (!actor) return null;
                      return (
                        <Marker
                          key={region.id}
                          longitude={region.centroid![0]}
                          latitude={region.centroid![1]}
                        >
                          <div
                            style={{
                              fontFamily: fonts.mono,
                              fontSize: fontSizes.meta,
                              color: palette.bone,
                              background: "rgba(28,24,20,0.6)",
                              padding: "2px 6px",
                              borderRadius: 2,
                              letterSpacing: "0.08em",
                              whiteSpace: "nowrap",
                              pointerEvents: "none",
                            }}
                          >
                            {actor.label.toUpperCase()}
                          </div>
                        </Marker>
                      );
                    })}
              </>
            )}

            {/* MapAnnotations inside MapGL for lon/lat tracking */}
            {data.annotations && data.annotations.length > 0 && (
              <MapAnnotations
                annotations={data.annotations}
                compositionDurationSec={durationInFrames / fps}
                dark={isDark}
              />
            )}
          </MapGL>
        </div>

        {/* Timeline strip — rendered outside MapGL as absolute SVG overlay */}
        {(data.showTimeline !== false) && (
          <TimelineStrip
            timesteps={data.timesteps}
            stepF={stepF}
            dark={isDark}
          />
        )}

        {/* Optional map title */}
        {data.title && (
          <MapTitleFrame
            title={data.title}
            mode={isDark ? "dark" : "light"}
          />
        )}
      </AbsoluteFill>
    </Background>
  );
};

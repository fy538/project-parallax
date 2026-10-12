/**
 * FlowMap — directional volume flows between geographic regions.
 *
 * Editorial argument: simultaneous flows where ARC WIDTH encodes comparative
 * magnitude. This is the key distinction from RouteAnimation, where equal-width
 * arcs present a path as the argument (path IS the argument). Here, VOLUME
 * is the argument — the reader must see that India gets 3× the oil Russia
 * sends to Turkey, without being told.
 *
 * Layer stack (deck.gl):
 *   1. ArcLayer — width ∝ sqrt(volume/maxVolume), greatCircle:true
 *   2. ScatterplotLayer — particles traveling along arcs for directionality
 *   3. Marker — SVG arrowheads at arc endpoints (opt-in)
 *   4. Marker — destination labels
 *
 * Reveal modes:
 *   "simultaneous" (default): all flows fade in together — comparative magnitude
 *   "stagger": each flow has revealAtSec, causation chain is the argument
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — Flow & Composition family
 *
 * @title-block: none — this map owns a bespoke title card overlaid on the
 * basemap (contentArea-positioned, alongside HeaderStrip), the cartographic
 * convention; it intentionally does not use the centered TitleBlock chrome.
 */

import React, { useMemo, useState } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { Marker } from "react-map-gl/mapbox";
import { ArcLayer, ScatterplotLayer } from "@deck.gl/layers";
import {
  palette,
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  contentArea,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  exitFade,
  CLAMP_CUBIC,
  CLAMP_SINE,
} from "../../utils/animation";
import { hexToRgba } from "../../utils/mapUtils";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { MapGL } from "../../components/MapGL";
import { MapAnnotations } from "../../components/MapAnnotations";
import { buildGraticuleLayers } from "../../components/Graticule";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { warnIf } from "../../utils/dataWarnings";
import type { FlowMapData, FlowArc, FlowActor } from "./types";

// ── Arc width constants ──────────────────────────────────────────────────────
// Width range chosen so:
//   MIN_WIDTH_PX = 1.5: thin flows remain visible at sub-pixel fractions
//   MAX_WIDTH_PX = 18: dominant flow reads as a "highway" without looking cartoonish
//
// See: POLISH.md D6 (hierarchy via size/position, not color intensity)
const MIN_WIDTH_PX = 1.5;
const MAX_WIDTH_PX = 18;

// ── Arc height heuristic (from RouteAnimation) ────────────────────────────────
// Short hops render flat (decorative curvature reads as pretentious when the
// geography doesn't earn it). 3000km ≈ Mediterranean diameter.
const GREAT_CIRCLE_KM_THRESHOLD = 3000;

// ── Haversine distance ────────────────────────────────────────────────────────

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ── Actor color helper ────────────────────────────────────────────────────────
// Safely resolve fill color from actors record. Returns palette.gold when
// the actor key is absent or the actors map is undefined.

function resolveActorColor(
  actors: Record<string, FlowActor> | undefined,
  actorKey: string | undefined,
): string {
  if (!actorKey || !actors) return palette.gold;
  return actors[actorKey]?.fill ?? palette.gold;
}

// ── Arrowhead bearing ─────────────────────────────────────────────────────────
// Computes the forward bearing at the destination end of the great circle arc,
// using spherical trigonometry. The arrowhead is rotated to match.

function arcEndBearing(from: [number, number], to: [number, number]): number {
  const dLon = ((to[0] - from[0]) * Math.PI) / 180;
  const lat1 = (from[1] * Math.PI) / 180;
  const lat2 = (to[1] * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

// ── calculateMetadata ─────────────────────────────────────────────────────────

export const calculateMetadata = ({
  props,
}: {
  props: { data: FlowMapData };
}) => ({
  durationInFrames: sec(props.data.durationSec ?? 10),
  fps: layout.fps,
  width: layout.width,
  height: layout.height,
});

// ── FlowMap component ─────────────────────────────────────────────────────────

export const FlowMap: React.FC<{ data: FlowMapData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const theme = useThemeMode(data.backgroundVariant || "dark");
  const { style: compStyle } = useCompositionAnimation({
    noDrift: true,
    ...direction.driftOptions,
  });

  // ── Dev-time validation ────────────────────────────────────────────────
  warnIf(
    data.flows.length === 0,
    "FlowMap",
    "flows array is empty — map will render no arcs",
  );
  warnIf(
    data.mode === "stagger" &&
      data.flows.some((f) => f.revealAtSec === undefined),
    "FlowMap",
    "stagger mode: some flows are missing revealAtSec — they will not appear",
  );

  // ── Volume normalization ───────────────────────────────────────────────
  // Auto-compute maxVolume unless explicitly set. Using Math.max with spread
  // is fine here (flows array is typically small, 3-20 items); the real
  // perf risk would be calling this in arcData's inner loop per frame.
  // eslint-disable-next-line no-bare-durationSec
  const maxVolume = useMemo(
    () => data.maxVolume ?? Math.max(...data.flows.map((f) => f.volume)),
    [data.maxVolume, data.flows],
  );

  // ── Map state ──────────────────────────────────────────────────────────
  const [mapInstance, setMapInstance] = useState<{
    project: (lonLat: [number, number]) => { x: number; y: number };
  } | null>(null);

  // ── Reveal alpha per flow ──────────────────────────────────────────────
  // Simultaneous: all flows ramp 0→1 from t=0.3s to t=1.0s.
  // Stagger: each flow fades in over 0.6s from its revealAtSec timestamp.
  const simultaneousAlpha = useMemo(
    () =>
      interpolate(frame, [sec(0.3), sec(1.0)], [0, 1], CLAMP_CUBIC),
    [frame],
  );

  const getFlowAlpha = (flow: FlowArc): number => {
    if (data.mode === "stagger" && flow.revealAtSec !== undefined) {
      const revealStart = sec(flow.revealAtSec);
      return interpolate(
        frame,
        [revealStart, revealStart + sec(0.6)],
        [0, 1],
        CLAMP_CUBIC,
      );
    }
    return simultaneousAlpha;
  };

  // ── Arc data ───────────────────────────────────────────────────────────
  // Typed record for the ArcLayer so accessor typos surface at compile time.
  type ArcRecord = {
    id: string;
    from: [number, number];
    to: [number, number];
    sourceColor: string;
    targetColor: string;
    scaledWidth: number;
    arcHeight: number;
    alpha: number;
    volume: number;
    isRevealed: boolean;
  };

  const arcData = useMemo<ArcRecord[]>(() => {
    return data.flows.map((flow) => {
      const actorColor = resolveActorColor(data.actors, flow.actor);
      const distKm =
        flow.distanceKm ?? haversineKm(flow.from, flow.to);
      const arcHeight = distKm < GREAT_CIRCLE_KM_THRESHOLD ? 0 : 0.3;
      const scaledWidth = Math.max(
        MIN_WIDTH_PX,
        Math.sqrt(flow.volume / maxVolume) * MAX_WIDTH_PX,
      );
      const alpha = getFlowAlpha(flow);
      return {
        id: flow.id,
        from: flow.from,
        to: flow.to,
        sourceColor: actorColor,
        targetColor: actorColor,
        scaledWidth,
        arcHeight,
        alpha,
        volume: flow.volume,
        isRevealed: alpha > 0.05,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.flows, data.actors, maxVolume, frame, data.mode, simultaneousAlpha]);

  // ── Particle system ────────────────────────────────────────────────────
  // Particles travel along arcs to show directionality.
  // Count scales with sqrt(volume) so thick arcs get denser streams —
  // double-encoding the volume signal visually (width + density).
  type FlowParticle = {
    position: [number, number, number];
    color: string;
    t: number;
    arcIdx: number;
  };

  const showParticles = data.showParticles !== false; // default true

  const flowParticles = useMemo<FlowParticle[]>(() => {
    if (!showParticles) return [];
    const parts: FlowParticle[] = [];

    arcData.forEach((arc, arcIdx) => {
      if (!arc.isRevealed) return;

      const speed = data.particleSpeed ?? 0.0035;
      // Scale particle count to sqrt(volume) for visual density encoding.
      // Dense streams on thick arcs reinforce the volume signal.
      const baseCount = data.particlesPerArc ?? 3;
      const particleCount = Math.max(
        2,
        Math.ceil(Math.sqrt(arc.volume / maxVolume) * baseCount * 2),
      );

      for (let p = 0; p < particleCount; p++) {
        const phase = p / particleCount;
        const rawT = ((frame * speed) + phase) % 1;
        const [lon1, lat1] = arc.from;
        const [lon2, lat2] = arc.to;
        const lon = lon1 + (lon2 - lon1) * rawT;
        const lat = lat1 + (lat2 - lat1) * rawT;
        // Lift toward arc apex for 3D feel — parabola scaled by the same
        // arcHeight as the underlying ArcLayer (flat arcs get flat particles).
        const altitude =
          Math.sin(rawT * Math.PI) * 80000 * (arc.arcHeight / 0.3);
        // Edge fade — particles fade in at start, out near destination end.
        const edgeFade = Math.min(rawT * 8, (1 - rawT) * 8, 1);
        // Color interpolates from source at t<0.5 to target at t>0.5.
        const color = rawT < 0.5 ? arc.sourceColor : arc.targetColor;
        parts.push({
          position: [lon, lat, altitude] as [number, number, number],
          color,
          t: edgeFade * arc.alpha,
          arcIdx,
        });
      }
    });
    return parts;
  }, [arcData, frame, maxVolume, data.particleSpeed, data.particlesPerArc, showParticles]);

  // ── deck.gl layers ─────────────────────────────────────────────────────

  const arcLayer = new ArcLayer<ArcRecord>({
    id: "flow-arcs",
    data: arcData,
    getSourcePosition: (d) => d.from,
    getTargetPosition: (d) => d.to,
    getSourceColor: (d) => hexToRgba(d.sourceColor, Math.round(d.alpha * 210)),
    getTargetColor: (d) => hexToRgba(d.targetColor, Math.round(d.alpha * 210)),
    // Width ∝ sqrt(volume) — the central editorial encoding of this template.
    // Multiply by alpha for a smooth fade-in that preserves the width hierarchy
    // throughout the reveal: wide arcs stay wide from the start.
    getWidth: (d) => d.scaledWidth * Math.max(0.1, d.alpha),
    greatCircle: true,
    getHeight: (d) => d.arcHeight,
    widthUnits: "pixels" as const,
    updateTriggers: {
      getSourceColor: [frame],
      getTargetColor: [frame],
      getWidth: [frame],
    },
  });

  const flowParticleLayer = new ScatterplotLayer<FlowParticle>({
    id: "flow-particles",
    data: flowParticles,
    getPosition: (d) => d.position,
    getRadius: 3,
    getFillColor: (d) => hexToRgba(d.color, Math.round(220 * d.t)),
    radiusUnits: "pixels" as const,
    updateTriggers: {
      getPosition: [frame],
      getFillColor: [frame],
    },
  });

  // ── Graticule ──────────────────────────────────────────────────────────
  const graticuleLayers = useMemo(
    () =>
      buildGraticuleLayers(data.graticule, {
        dark: data.backgroundVariant === "dark",
      }),
    [data.graticule, data.backgroundVariant],
  );

  const layers = [...graticuleLayers, arcLayer, flowParticleLayer];

  // ── Resolved map props ─────────────────────────────────────────────────
  const register = data.register ?? "dark";
  const fogPreset = data.fogPreset ?? "editorial";
  const isDark = register === "dark" || data.backgroundVariant === "dark";

  // ── Global fade ────────────────────────────────────────────────────────
  const mapOpacity = interpolate(frame, [0, sec(0.5)], [0, 1], CLAMP_SINE);
  const contentOpacity = Math.min(
    fadeIn(frame, sec(0.5), sec(0.4)),
    exitFade(frame, durationInFrames, 15),
  );

  // ── Volume legend ──────────────────────────────────────────────────────
  // Three horizontal reference lines at small/medium/large widths, with
  // relative volume labels ("1×", "5×", "10×" style relative to min volume).
  // Only shown when showLegend !== false (default true).
  const showLegend = data.showLegend !== false;
  const minVolume = useMemo(
    () => Math.min(...data.flows.map((f) => f.volume)),
    [data.flows],
  );

  const legendItems = useMemo(() => {
    // Three reference widths: MIN, 50%, MAX — with their actual volumes
    const widths = [MIN_WIDTH_PX, MAX_WIDTH_PX * 0.5, MAX_WIDTH_PX];
    // Compute what volume each reference width would represent (inverse of
    // the sqrt-normalization formula): v = (w/MAX_WIDTH_PX)^2 * maxVolume
    return widths.map((w, i) => {
      const vol = (w / MAX_WIDTH_PX) ** 2 * maxVolume;
      const ratio = vol / minVolume;
      const label =
        i === 0
          ? "1×"
          : i === 1
          ? `${Math.round(ratio)}×`
          : `${Math.round(maxVolume / minVolume)}×`;
      return { width: w, label };
    });
  }, [maxVolume, minVolume]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint ?? undefined}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* Brand strips */}
        <HeaderStrip
          metadata={
            `${data.episode || ""} · ${(data.center[1]).toFixed(1)}°${data.center[1] >= 0 ? "N" : "S"} ${Math.abs(data.center[0]).toFixed(1)}°${data.center[0] >= 0 ? "E" : "W"}`.trim()
          }
          mode={isDark ? "dark" : "light"}
        />
        <FooterStrip
          scale={`Z${(data.zoom).toFixed(1)}`}
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
            pitch={data.pitch ?? 25}
            bearing={data.bearing ?? 0}
            layers={layers}
            register={register}
            fogPreset={fogPreset}
            lightPreset={data.lightPreset}
            terrain={data.terrain ?? false}
            vignette="editorial"
            labelDensity="editorial"
            onMapReady={setMapInstance}
          >
            {/* Destination labels — rendered as Markers for correct geo projection */}
            {data.flows.map((flow) => {
              if (!flow.label) return null;
              const alpha = getFlowAlpha(flow);
              if (alpha <= 0) return null;
              return (
                <Marker
                  key={`label-${flow.id}`}
                  longitude={flow.to[0]}
                  latitude={flow.to[1]}
                  anchor="center"
                >
                  <div
                    style={{
                      opacity: alpha * contentOpacity,
                      pointerEvents: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    {/* Label dot */}
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: resolveActorColor(data.actors, flow.actor),
                        border: `1.5px solid ${theme.bg.surface}`,
                        marginBottom: 4,
                      }}
                    />
                    {/* Destination label */}
                    <div
                      style={{
                        fontSize: 18,
                        fontFamily: fonts.heading,
                        fontWeight: 600,
                        color: theme.text.primary,
                        textShadow: shadows.textLift,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {flow.label}
                    </div>
                  </div>
                </Marker>
              );
            })}

            {/* Arrowheads — opt-in, rendered at destination */}
            {data.showArrowheads &&
              data.flows.map((flow) => {
                const alpha = getFlowAlpha(flow);
                if (alpha <= 0.05) return null;
                const bearing = arcEndBearing(flow.from, flow.to);
                const actorColor = resolveActorColor(data.actors, flow.actor);
                // Offset slightly away from destination label to avoid overlap.
                // Interpolate 98% along the arc path to place the arrowhead
                // just before the destination dot.
                const t = 0.92;
                const [lon1, lat1] = flow.from;
                const [lon2, lat2] = flow.to;
                const arrowLon = lon1 + (lon2 - lon1) * t;
                const arrowLat = lat1 + (lat2 - lat1) * t;
                return (
                  <Marker
                    key={`arrow-${flow.id}`}
                    longitude={arrowLon}
                    latitude={arrowLat}
                    anchor="center"
                  >
                    <svg
                      width={16}
                      height={16}
                      style={{
                        transform: `rotate(${bearing}deg)`,
                        overflow: "visible",
                        opacity: alpha * 0.9,
                      }}
                    >
                      <polygon
                        points="0,-8 5,4 -5,4"
                        fill={actorColor}
                        opacity={0.9}
                      />
                    </svg>
                  </Marker>
                );
              })}

            {/* Editorial annotation overlay */}
            {data.annotations && data.annotations.length > 0 && (
              <MapAnnotations
                annotations={data.annotations}
                compositionDurationSec={durationInFrames / layout.fps}
                dark={isDark}
              />
            )}
          </MapGL>
        </div>

        {/* Title card */}
        {data.title && (
          <div
            style={{
              position: "absolute",
              top: contentArea("content", "generous").top,
              left: contentArea("content", "generous").left,
              right: contentArea("content", "generous").right,
              opacity: contentOpacity,
            }}
          >
            <div
              style={{
                fontSize: fontSizes.h2,
                fontFamily: fonts.heading,
                fontWeight: 600,
                color: theme.text.primary,
                textShadow: shadows.textLift,
              }}
            >
              {data.title}
            </div>
          </div>
        )}

        {/* Volume legend — bottom-left, three reference widths */}
        {showLegend && (
          <div
            style={{
              position: "absolute",
              bottom: contentArea("content", "generous").bottom,
              left: contentArea("content", "generous").left,
              opacity: contentOpacity,
              backgroundColor: isDark
                ? "rgba(28, 24, 20, 0.82)"
                : "rgba(245, 240, 232, 0.88)",
              border: `1px solid ${isDark ? palette.midnight : palette.sand}`,
              borderRadius: 6,
              padding: "10px 14px",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: fonts.body,
                fontWeight: 600,
                color: theme.text.muted,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              Volume
            </div>
            {legendItems.map(({ width, label }, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: i < legendItems.length - 1 ? 6 : 0,
                }}
              >
                {/* Reference arc stroke */}
                <svg width={40} height={width + 2} style={{ flexShrink: 0 }}>
                  <line
                    x1={2}
                    y1={(width + 2) / 2}
                    x2={38}
                    y2={(width + 2) / 2}
                    stroke={palette.gold}
                    strokeWidth={width}
                    strokeLinecap="round"
                    opacity={0.85}
                  />
                </svg>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: fonts.body,
                    color: theme.text.secondary,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actor legend — shown when actors are defined */}
        {data.actors && Object.keys(data.actors).length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: contentArea("content", "generous").bottom,
              right: contentArea("content", "generous").right,
              opacity: contentOpacity,
              backgroundColor: isDark
                ? "rgba(28, 24, 20, 0.82)"
                : "rgba(245, 240, 232, 0.88)",
              border: `1px solid ${isDark ? palette.midnight : palette.sand}`,
              borderRadius: 6,
              padding: "10px 14px",
              backdropFilter: "blur(4px)",
            }}
          >
            {(Object.entries(data.actors) as [string, FlowActor][]).map(([key, actor]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: actor.fill,
                  }}
                />
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: fonts.body,
                    color: theme.text.secondary,
                  }}
                >
                  {actor.label ?? key}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Source attribution */}
        {data.source && (
          <div
            style={{
              position: "absolute",
              bottom: contentArea("content", "generous").bottom,
              right: contentArea("content", "generous").right,
              fontSize: fontSizes.small,
              fontFamily: fonts.body,
              color: theme.text.muted,
              opacity: Math.min(
                fadeIn(frame, sec(1.5), sec(0.5)),
                exitFade(frame, durationInFrames, 15),
              ),
              textShadow: shadows.textLift,
            }}
          >
            Source: {data.source}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};

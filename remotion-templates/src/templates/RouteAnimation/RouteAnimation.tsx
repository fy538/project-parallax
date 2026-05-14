/**
 * RouteAnimation — animated trade/supply chain routes on a world map.
 *
 * Migrated from react-simple-maps to Mapbox GL + deck.gl.
 * Routes render as 3D great-circle arcs (ArcLayer), points as glowing
 * markers (ScatterplotLayer), labels as projected HTML overlays.
 *
 * Data schema preserved — RoutePoint, RouteSegment, RoutePhase,
 * RouteAnimationData all unchanged. New optional `camera` field on
 * RoutePhase for full Mapbox camera control (backward-compatible).
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
  textMaxWidth,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  slideIn,
  exitFade,
  scaleIn,
  lockOnPulse,
  CLAMP,
  CLAMP_CUBIC,
  CLAMP_CUBIC_INOUT,
  CLAMP_SINE,
} from "../../utils/animation";
import { hexToRgba, scaleToZoom, interpolateCamera } from "../../utils/mapUtils";
import type { CameraState } from "../../utils/mapUtils";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { MapGL } from "../../components/MapGL";
import { MapAnnotations } from "../../components/MapAnnotations";
import {
  placeLabels,
  placementToLabelPosition,
} from "../../components/labelPlacement";
import { buildGraticuleLayers } from "../../components/Graticule";
import { MapInset } from "../../components/MapInset";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { MapTitleFrame } from "../../components/MapTitleFrame";
import { warnIf } from "../../utils/dataWarnings";
import type { RouteAnimationData, RoutePhase, RouteSegment } from "./types";

// ── Phase time calculator ──────────────────────────────────────────────────

function getPhaseWindow(
  phases: RoutePhase[],
  index: number
): { start: number; end: number } {
  let start = sec(0.5); // initial delay
  for (let i = 0; i < index; i++) {
    start += sec(phases[i].durationSec);
  }
  return { start, end: start + sec(phases[index].durationSec) };
}

function getCurrentPhaseIndex(
  phases: RoutePhase[],
  frame: number
): number {
  let cursor = sec(0.5);
  for (let i = 0; i < phases.length; i++) {
    const end = cursor + sec(phases[i].durationSec);
    if (frame < end) return i;
    cursor = end;
  }
  return phases.length - 1;
}

// ── Camera conversion ───────────────────────────────────────────────────────

/**
 * Compute the ideal camera for a set of points.
 *
 * Strategy:
 * - If only new points exist, center on their centroid (tight focus)
 * - If new + existing, center on the DESTINATION of new segments (narrative focus)
 * - For widely-separated points (>100° lon span), use the LAST new point
 *   as center (avoids mid-ocean centroids when showing US→Taiwan routes)
 * - Progressive bearing rotation between phases for globe turning effect
 */
function computeAutoCamera(
  data: RouteAnimationData,
  activePointIndices: number[],
  newPointIndices: number[],
  phaseIndex: number
): CameraState {
  // If there are newly-active points this phase, center on THOSE specifically
  const targetIndices =
    newPointIndices.length > 0 ? newPointIndices : activePointIndices;

  if (targetIndices.length === 0) {
    return { longitude: 60, latitude: 25, zoom: 2.5, pitch: 35, bearing: 0 };
  }

  // Compute bounds
  let lonMin = Infinity, lonMax = -Infinity;
  let latMin = Infinity, latMax = -Infinity;

  for (const idx of targetIndices) {
    const [lon, lat] = data.points[idx].coordinates;
    lonMin = Math.min(lonMin, lon);
    lonMax = Math.max(lonMax, lon);
    latMin = Math.min(latMin, lat);
    latMax = Math.max(latMax, lat);
  }

  const lonSpread = lonMax - lonMin;
  const latSpread = latMax - latMin;
  const maxSpread = Math.max(lonSpread, latSpread);

  // Determine center point
  let centerLon: number;
  let centerLat: number;

  if (maxSpread > 100) {
    // Points span more than 100° — DON'T average (gives mid-ocean nonsense).
    // Instead: find the DESTINATION of segments activated in this phase.
    // Narrative logic: "US → Taiwan" should center on Taiwan (the destination).
    const phase = data.phases[phaseIndex];
    const destinationPoints = new Set<number>();
    for (const segIdx of phase.activeSegments) {
      destinationPoints.add(data.segments[segIdx].to);
    }
    // Filter to only destination points that are newly active
    const newDestinations = targetIndices.filter((idx) =>
      destinationPoints.has(idx)
    );

    if (newDestinations.length > 0) {
      // Center on destination(s)
      let dLon = 0, dLat = 0;
      for (const idx of newDestinations) {
        dLon += data.points[idx].coordinates[0];
        dLat += data.points[idx].coordinates[1];
      }
      centerLon = dLon / newDestinations.length;
      centerLat = dLat / newDestinations.length;
    } else {
      // Fallback: use the last point in the target list
      const lastIdx = targetIndices[targetIndices.length - 1];
      centerLon = data.points[lastIdx].coordinates[0];
      centerLat = data.points[lastIdx].coordinates[1];
    }
  } else {
    // Normal centroid
    let lonSum = 0, latSum = 0;
    for (const idx of targetIndices) {
      lonSum += data.points[idx].coordinates[0];
      latSum += data.points[idx].coordinates[1];
    }
    centerLon = lonSum / targetIndices.length;
    centerLat = latSum / targetIndices.length;
  }

  // Compute zoom based on geographic spread
  let zoom: number;
  if (targetIndices.length === 1) {
    zoom = 4.5; // Single city — close
  } else if (maxSpread > 100) {
    zoom = 2.0; // Global spread — wide view showing the route
  } else if (maxSpread > 60) {
    zoom = 2.5;
  } else if (maxSpread < 15) {
    zoom = 4.0; // Tight cluster
  } else if (maxSpread < 40) {
    zoom = 3.2; // Regional
  } else {
    zoom = 2.8; // Continental
  }

  // Progressive bearing rotation: globe turns between phases
  const bearing = phaseIndex * 15;

  // Pitch: more dramatic when zoomed in
  const pitch = zoom > 4 ? 42 : zoom > 3 ? 35 : 25;

  return { longitude: centerLon, latitude: centerLat, zoom, pitch, bearing };
}

/**
 * Determine which points are newly activated in this phase
 * (not active in any previous phase).
 */
function getNewPointsInPhase(
  phases: RoutePhase[],
  phaseIndex: number
): number[] {
  const previouslyActive = new Set<number>();
  for (let i = 0; i < phaseIndex; i++) {
    phases[i].activePoints.forEach((p) => previouslyActive.add(p));
  }
  return phases[phaseIndex].activePoints.filter(
    (p) => !previouslyActive.has(p)
  );
}

function phaseToCamera(
  phase: RoutePhase,
  phaseIndex: number,
  data: RouteAnimationData
): CameraState {
  // Explicit camera field takes priority (full Mapbox camera control)
  if (phase.camera) {
    // Still apply progressive bearing if not explicitly set
    return {
      longitude: phase.camera.longitude,
      latitude: phase.camera.latitude,
      zoom: phase.camera.zoom,
      pitch: phase.camera.pitch ?? 35,
      bearing: phase.camera.bearing ?? phaseIndex * 12,
    };
  }

  // Legacy center/scale — convert but apply auto-centering bearing
  if (phase.center || phase.scale) {
    const center = phase.center || data.center || [60, 25];
    const scale = phase.scale || data.scale || 200;
    return {
      longitude: center[0],
      latitude: center[1],
      zoom: scaleToZoom(scale),
      pitch: 35,
      bearing: phaseIndex * 12,
    };
  }

  // Auto-compute: center on newly-highlighted cities
  const newPoints = getNewPointsInPhase(data.phases, phaseIndex);
  return computeAutoCamera(data, phase.activePoints, newPoints, phaseIndex);
}

// ── Main component ──────────────────────────────────────────────────────────

export const RouteAnimation: React.FC<{ data: RouteAnimationData }> = ({
  data: rawData,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(rawData._direction);
  const theme = useThemeMode(rawData.backgroundVariant || "light");
  const { style: compStyle } = useCompositionAnimation({ noDrift: true, ...direction.driftOptions });
  // Per-episode color emphasis — route arc and point markers fall back to
  // the episode's primary accent instead of channel-default amber.
  const emphasis = useEpisodeColorEmphasis();

  // ── Radial mode preprocessing ──────────────────────────────────────────
  // When `data.radial` is set, auto-derive segments (hub → every destination)
  // and a single phase that reveals all of them. Destinations are sorted by
  // bearing from the hub so the stagger reveals clockwise — feels like the
  // hub "broadcasts outward" rather than chaotic simultaneous reveal.
  // See: CLAUDE.md "Known gaps" → Hub-with-radial-routes map.
  const data: RouteAnimationData = useMemo(() => {
    if (!rawData.radial) return rawData;
    const hubIdx = rawData.radial.hubIndex;
    const hubPoint = rawData.points[hubIdx];
    if (!hubPoint) return rawData;
    const arcColor = rawData.radial.arcColor;

    // Compute bearing from hub for each destination, sort clockwise.
    const destinations = rawData.points
      .map((p, i) => ({ point: p, index: i }))
      .filter((d) => d.index !== hubIdx);
    const bearingOf = (lon2: number, lat2: number): number => {
      const [lon1, lat1] = hubPoint.coordinates;
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const phi1 = lat1 * (Math.PI / 180);
      const phi2 = lat2 * (Math.PI / 180);
      const y = Math.sin(dLon) * Math.cos(phi2);
      const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
      return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
    };
    destinations.sort(
      (a, b) =>
        bearingOf(a.point.coordinates[0], a.point.coordinates[1]) -
        bearingOf(b.point.coordinates[0], b.point.coordinates[1]),
    );

    const derivedSegments: RouteSegment[] = destinations.map((d) => ({
      from: hubIdx,
      to: d.index,
      ...(arcColor ? { color: arcColor } : {}),
    }));
    // Empty phase title — radial-mode already shows the chart's title via
    // TitleBlock at the top of the canvas; reusing data.title here would
    // render a duplicate phase-label overlay. The single auto-derived phase
    // is purely a container for the animated reveal.
    const derivedPhases: RoutePhase[] = [
      {
        title: "",
        durationSec: rawData.durationSec ?? 8,
        activeSegments: derivedSegments.map((_, i) => i),
        activePoints: [hubIdx, ...destinations.map((d) => d.index)],
      },
    ];
    // Bearing-based label placement — fans labels OUTWARD from the hub so
    // that clusters of destinations on the same side of the hub don't
    // overlap each other. North-ish destinations (bearing 315..45) get
    // labels above; east-ish (45..135) get labels right; south-ish
    // (135..225) get labels below; west-ish (225..315) get labels left.
    const labelPositionForBearing = (bearing: number): "above" | "below" | "left" | "right" => {
      const b = ((bearing % 360) + 360) % 360;
      if (b < 45 || b >= 315) return "above";
      if (b < 135) return "right";
      if (b < 225) return "below";
      return "left";
    };
    const destBearings = new Map<number, number>();
    destinations.forEach((d) => {
      destBearings.set(d.index, bearingOf(d.point.coordinates[0], d.point.coordinates[1]));
    });

    return {
      ...rawData,
      segments: derivedSegments,
      phases: derivedPhases,
      points: rawData.points.map((p, i) => {
        if (i === hubIdx) {
          // Hub color override (if set) — labelPosition retained from data
          // since the hub doesn't have a bearing relative to itself.
          return rawData.radial!.hubColor ? { ...p, color: rawData.radial!.hubColor } : p;
        }
        const bearing = destBearings.get(i);
        if (bearing === undefined) return p;
        // Honor explicit per-point labelPosition if the data writer set one;
        // otherwise compute from bearing.
        if (p.labelPosition) return p;
        return { ...p, labelPosition: labelPositionForBearing(bearing) };
      }),
    };
  }, [rawData]);

  // Path-style hierarchy: all arcs share the route color (visual cohesion
  // — the route is the same trip across phases). The CURRENT (just-animated)
  // segment renders at full alpha; SETTLED (past-phase) segments fade to
  // ~⅓ alpha — present as continuous context, but receding so the new arc
  // dominates the eye.
  //
  // Initial implementation used `palette.ink` for settled, which read as
  // invisible against light basemaps (ink ≈ country-border color). The
  // alpha-modulation approach preserves color identity AND creates the
  // hierarchy without inventing a second base color.
  //
  // Override via `data.routeColor` if an episode needs a single
  // saturated color. Per-segment `seg.color` and per-point `pt.color`
  // still take precedence over both alphas.
  //
  // See: references/template-research/route-animation.md § 6.2
  const routeColor = data.routeColor || emphasis.primaryAccent;

  const currentPhaseIdx = getCurrentPhaseIndex(data.phases, frame);
  const currentPhase = data.phases[currentPhaseIdx];
  const phaseWindow = getPhaseWindow(data.phases, currentPhaseIdx);

  // Phase windows in SECONDS — passed to MapAnnotations for phase-scoped
  // annotations. Memoized so we don't allocate a fresh array per frame
  // (used to bust MapAnnotations' useMemo on every render).
  const phaseWindowsSec = useMemo(
    () =>
      data.phases.map((_, i) => {
        const w = getPhaseWindow(data.phases, i);
        return { startSec: w.start / layout.fps, endSec: w.end / layout.fps };
      }),
    [data.phases],
  );

  // Collect all active segments/points up to and including current phase
  const allActiveSegments = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i <= currentPhaseIdx; i++) {
      data.phases[i].activeSegments.forEach((s) => set.add(s));
    }
    return set;
  }, [data.phases, currentPhaseIdx]);

  const allActivePoints = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i <= currentPhaseIdx; i++) {
      data.phases[i].activePoints.forEach((p) => set.add(p));
    }
    return set;
  }, [data.phases, currentPhaseIdx]);

  // Segments newly added IN THIS PHASE — used for both animation reveal
  // and path-style hierarchy. Earlier-phase segments are "settled" context
  // (rendered in `settledRouteColor`); only the truly-new-this-phase
  // segments are "current" (rendered in `routeColor`).
  //
  // Bug fixed: previously this was `new Set(currentPhase.activeSegments)`,
  // which contained ALL segments the phase had ever activated — typical
  // route data repeats earlier segments in each phase's activeSegments,
  // so `newSegments` was equivalent to `allActiveSegments` and the
  // "settled-vs-current" hierarchy never triggered. The diff against
  // the previous phase's activeSegments gives the actually-new segments.
  const newSegments = useMemo(() => {
    const currentActive = new Set(data.phases[currentPhaseIdx].activeSegments);
    if (currentPhaseIdx === 0) return currentActive;
    const previousActive = new Set(data.phases[currentPhaseIdx - 1].activeSegments);
    const diff = new Set<number>();
    for (const segIdx of currentActive) {
      if (!previousActive.has(segIdx)) diff.add(segIdx);
    }
    return diff;
  }, [data.phases, currentPhaseIdx]);

  // ── Camera ────────────────────────────────────────────────────────────
  // Camera LEADS content: it starts transitioning 0.3s before the phase
  // boundary and settles in 1.2s, so by the time labels fade in (0.4s into
  // the phase), the camera is already 60%+ settled on the target city.

  const currentCamera = phaseToCamera(currentPhase, currentPhaseIdx, data);

  let camera: CameraState;
  if (currentPhaseIdx > 0) {
    const prevCamera = phaseToCamera(
      data.phases[currentPhaseIdx - 1],
      currentPhaseIdx - 1,
      data
    );
    // Camera transition: starts 0.3s before phase start, finishes 1.2s into phase
    const camLeadFrames = sec(0.3);
    const camDuration = sec(1.5);
    const camT = interpolate(
      frame,
      [phaseWindow.start - camLeadFrames, phaseWindow.start - camLeadFrames + camDuration],
      [0, 1],
      CLAMP_CUBIC_INOUT
    );
    camera = interpolateCamera(prevCamera, currentCamera, camT);
  } else {
    // First phase: gentle zoom-in from a pulled-back view
    const initialCamera: CameraState = {
      longitude: currentCamera.longitude,
      latitude: currentCamera.latitude,
      zoom: currentCamera.zoom - 0.8,
      pitch: currentCamera.pitch - 10,
      bearing: currentCamera.bearing - 5,
    };
    const introT = interpolate(
      frame,
      [0, sec(1.5)],
      [0, 1],
      CLAMP_CUBIC_INOUT
    );
    camera = interpolateCamera(initialCamera, currentCamera, introT);
  }

  // Continuous slow bearing drift within each phase (globe "breathes")
  // linear-ok: raw phase progress — easing applied by consumers (camera interpolation, bearing drift)
  const intraPhaseProgress = interpolate(
    frame,
    [phaseWindow.start, phaseWindow.end],
    [0, 1],
    CLAMP
  );
  const bearingDrift = intraPhaseProgress * 3; // 3° drift per phase hold

  // ── Content timing ───────────────────────────────────────────────────
  // Content (labels, phase title) waits for the camera to mostly settle.
  // Camera takes ~1.2s to reach destination; content appears at 0.8s in.
  const CONTENT_DELAY = currentPhaseIdx > 0 ? sec(0.8) : sec(1.0);
  const contentStart = phaseWindow.start + CONTENT_DELAY;

  // ── deck.gl layers ────────────────────────────────────────────────────

  // Haversine distance in km. Used to decide great-circle arc height per
  // segment — short hops render flat (decorative arcing reads as pretentious
  // when the geography doesn't need it). See:
  // references/template-research/route-animation.md § 6.5 (great-circle threshold)
  const haversineKm = (
    a: [number, number],
    b: [number, number],
  ): number => {
    const R = 6371; // Earth radius km
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  /** Below this distance, arcs render flat (no great-circle curvature). */
  const GREAT_CIRCLE_KM_THRESHOLD = 3000;

  const arcData = useMemo(() => {
    const arcs: Array<{
      from: [number, number];
      to: [number, number];
      sourceColor: string;
      targetColor: string;
      isNew: boolean;
      dashed: boolean;
      index: number;
      arcHeight: number;
    }> = [];

    data.segments.forEach((seg, i) => {
      if (!allActiveSegments.has(i)) return;
      const fromPt = data.points[seg.from];
      const toPt = data.points[seg.to];
      // All arcs share the same color identity — `seg.color` per-data
      // override → `routeColor` channel default. Hierarchy between current
      // and settled comes from alpha modulation in the ArcLayer below.
      // Per-segment `seg.color` overrides when the route data wants a
      // segment-specific color (e.g., highlighting a sanctioned leg).
      const baseColor = seg.color || routeColor;
      // Per-segment arc height: short hops stay flat (great-circle curvature
      // looks decorative when the geography doesn't earn it). 3000km matches
      // roughly the Mediterranean diameter — anything tighter reads as a
      // regional connection that shouldn't bow.
      const distanceKm = haversineKm(fromPt.coordinates, toPt.coordinates);
      const arcHeight = distanceKm < GREAT_CIRCLE_KM_THRESHOLD ? 0 : 0.3;
      arcs.push({
        from: fromPt.coordinates,
        to: toPt.coordinates,
        sourceColor: fromPt.color || baseColor,
        targetColor: toPt.color || baseColor,
        isNew: newSegments.has(i),
        dashed: !!seg.dashed,
        index: i,
        arcHeight,
      });
    });

    return arcs;
  }, [data.segments, data.points, allActiveSegments, newSegments, routeColor]);

  // Animate new arcs: start slightly after camera begins moving,
  // finish just as labels appear (visual sequence: camera moves → arcs draw → labels pop)
  const arcDelay = currentPhaseIdx > 0 ? sec(0.4) : sec(0.6);
  const newArcProgress = interpolate(
    frame,
    [phaseWindow.start + arcDelay, phaseWindow.start + arcDelay + sec(1)],
    [0, 1],
    CLAMP_CUBIC
  );

  const arcLayer = new ArcLayer({
    id: "trade-routes",
    data: arcData,
    getSourcePosition: (d: any) => d.from,
    getTargetPosition: (d: any) => d.to,
    // Path-style hierarchy via alpha:
    //   isNew (current segment, mid-reveal): animates from 0 → 200 alpha
    //   isNew && settled:                    not applicable
    //   !isNew (past-phase, settled):        80 alpha (visible context)
    //   !isNew && currently-revealing:       not applicable
    //
    // The settled alpha is intentionally a third of the current alpha so
    // the eye locks to the new arc; past arcs stay legible as continuous
    // context (the route hasn't disappeared — it's just no longer the
    // active claim).
    //
    // See: references/template-research/route-animation.md § 6.2
    getSourceColor: (d: any) => {
      const alpha = d.isNew ? Math.round(newArcProgress * 200) : 80;
      return hexToRgba(d.sourceColor, alpha);
    },
    getTargetColor: (d: any) => {
      const alpha = d.isNew ? Math.round(newArcProgress * 200) : 80;
      return hexToRgba(d.targetColor, alpha);
    },
    getWidth: (d: any) => {
      const base = d.dashed ? 1.5 : 3;
      return d.isNew ? base * newArcProgress : base;
    },
    greatCircle: true,
    // Per-segment arc height — flat for sub-threshold hops, normal for true
    // great-circle distances. See `arcHeight` computation above.
    getHeight: (d: any) => d.arcHeight,
    widthUnits: "pixels" as const,
    updateTriggers: {
      getSourceColor: [newArcProgress],
      getTargetColor: [newArcProgress],
      getWidth: [newArcProgress],
    },
  });

  // ── Trailing flow particles — small dots traveling along each great-circle arc ──
  // Sample bezier-equivalent positions using deck.gl's great-circle parameter t,
  // approximated here as a linear-spherical interpolation. Each arc gets 2-4
  // particles depending on arc length.
  const flowParticles = useMemo(() => {
    const parts: Array<{ position: [number, number, number]; color: string; t: number; arcIdx: number }> = [];
    arcData.forEach((arc, arcIdx) => {
      if (arc.isNew && newArcProgress < 0.6) return; // wait until arc is mostly drawn
      // 3 particles per arc, phase-offset, traveling at frame * speed
      const speed = 0.0035; // cycles per frame
      const particleCount = 3;
      for (let p = 0; p < particleCount; p++) {
        const phase = p / particleCount;
        const rawT = ((frame * speed) + phase) % 1;
        // Simple linear-spherical interpolation along the great circle
        const [lon1, lat1] = arc.from;
        const [lon2, lat2] = arc.to;
        const lon = lon1 + (lon2 - lon1) * rawT;
        const lat = lat1 + (lat2 - lat1) * rawT;
        // Lift toward arc apex for 3D feel — parabola scaled by the same
        // arcHeight as the underlying ArcLayer (so flat sub-threshold arcs
        // get flat particles too).
        const altitude = Math.sin(rawT * Math.PI) * 80000 * (arc.arcHeight / 0.3); // meters
        // Edge fade — particles fade in at start, out near end
        const edgeFade = Math.min(rawT * 8, (1 - rawT) * 8, 1);
        // Color interpolates between source and target
        const color = rawT < 0.5 ? arc.sourceColor : arc.targetColor;
        parts.push({
          position: [lon, lat, altitude] as [number, number, number],
          color,
          t: edgeFade,
          arcIdx,
        });
      }
    });
    return parts;
  }, [arcData, frame, newArcProgress]);

  const flowParticleLayer = new ScatterplotLayer({
    id: "flow-particles",
    data: flowParticles,
    getPosition: (d: any) => d.position,
    getRadius: 3,
    getFillColor: (d: any) => hexToRgba(d.color, Math.round(220 * d.t)),
    radiusUnits: "pixels" as const,
    updateTriggers: {
      getPosition: [frame],
      getFillColor: [frame],
    },
  });

  // Point markers via ScatterplotLayer.
  //
  // Canonical anchor-marker treatment per the dossier:
  //   - Outer glow halo (14px filled, low alpha) — atmospheric ring
  //   - Inner dot (6px filled, full alpha) — the actual marker
  //   - Thin gold ring (1.5px stroke) around the inner dot — anchors the eye
  //
  // The three layers compose: halo says "something is here," dot says "this
  // is the place," gold ring says "this is named, look at it."
  //
  // See: references/template-research/route-animation.md § 6.3
  const pointData = useMemo(() => {
    return data.points
      .map((pt, i) => ({ ...pt, index: i }))
      .filter((pt) => allActivePoints.has(pt.index));
  }, [data.points, allActivePoints]);

  // Auto-label placement for point labels — May 14, 2026 extension of the
  // MapAnnotations greedy placer to RouteAnimation point labels. When a
  // point omits `labelPosition`, the placer picks a non-colliding cardinal
  // direction ("above" | "below" | "left" | "right"). Explicit
  // labelPosition values always win (authors get the last word on stubborn
  // cases). See: src/components/labelPlacement.ts.
  const [mapInstance, setMapInstance] = useState<{
    project: (lonLat: [number, number]) => { x: number; y: number };
  } | null>(null);
  const autoLabelPositions = useMemo(() => {
    const positions = new Map<number, "above" | "below" | "left" | "right">();
    if (!mapInstance) return positions;
    // Only points that are visible (in `pointData`, which already filters
    // by allActivePoints) AND lack an explicit labelPosition participate.
    const candidates = pointData.filter(
      (pt) => !pt.labelPosition && pt.label,
    );
    if (candidates.length === 0) return positions;
    const placements = placeLabels(
      candidates.map((pt) => ({
        ann: {
          at: pt.coordinates,
          label: pt.label!,
          sublabel: pt.sublabel,
          hierarchy: "secondary" as const,
          priority: 0,
        },
        defaultDy: -22, // matches DEFAULT_OFFSET_Y.secondary in MapAnnotations
      })),
      (lonLat) => {
        try {
          const p = mapInstance.project(lonLat);
          if (
            !Number.isFinite(p.x) ||
            !Number.isFinite(p.y) ||
            p.x < -200 ||
            p.x > 2200 ||
            p.y < -200 ||
            p.y > 1300
          ) {
            return null;
          }
          return { x: p.x, y: p.y };
        } catch {
          return null;
        }
      },
    );
    candidates.forEach((pt, i) => {
      const p = placements[i];
      if (!p.offscreen && p.displaced) {
        positions.set(pt.index, placementToLabelPosition(p));
      }
    });
    return positions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointData, mapInstance, frame]);

  // Outer atmospheric glow halo (14px, low alpha)
  const scatterHaloLayer = new ScatterplotLayer({
    id: "point-glow",
    data: pointData,
    getPosition: (d: any) => d.coordinates,
    getRadius: 14,
    getFillColor: (d: any) => hexToRgba(d.color || routeColor, 60),
    radiusUnits: "pixels" as const,
    updateTriggers: {
      getFillColor: [routeColor],
    },
  });

  // Inner filled dot + gold ring (the canonical anchor marker).
  // Ring weight bumped from 1.5px → 2.5px and dot radius from 6 → 7 for
  // visibility at video-scrub scale. At 1.5px the ring sub-pixeled into
  // invisibility when rendered at 1920×1080 then compressed.
  const scatterMarkerLayer = new ScatterplotLayer({
    id: "point-marker",
    data: pointData,
    getPosition: (d: any) => d.coordinates,
    getRadius: 7,
    getFillColor: (d: any) => hexToRgba(d.color || routeColor, 230),
    stroked: true,
    getLineColor: (_d: any) => hexToRgba(palette.gold, 255),
    getLineWidth: 2.5,
    lineWidthUnits: "pixels" as const,
    radiusUnits: "pixels" as const,
    updateTriggers: {
      getFillColor: [routeColor],
    },
  });

  // Graticule rendered UNDER content so it reads as base reference, not
  // overlay. Empty array when data.graticule is undefined.
  const graticuleLayers = useMemo(
    () => buildGraticuleLayers(data.graticule, { dark: data.backgroundVariant === "dark" }),
    [data.graticule, data.backgroundVariant],
  );

  const layers = [
    ...graticuleLayers,
    arcLayer,
    flowParticleLayer,
    scatterHaloLayer,
    scatterMarkerLayer,
  ];

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* Brand strips */}
        <HeaderStrip
          metadata={`${data.episode || ""} · ${camera.latitude.toFixed(1)}°${camera.latitude >= 0 ? "N" : "S"} ${Math.abs(camera.longitude).toFixed(1)}°${camera.longitude >= 0 ? "E" : "W"}`.trim()}
          mode={data.backgroundVariant === "dark" ? "dark" : "light"}
        />
        <FooterStrip
          scale={`Z${camera.zoom.toFixed(1)}`}
          mode={data.backgroundVariant === "dark" ? "dark" : "light"}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: interpolate(frame, [0, sec(0.5)], [0, 1], CLAMP_SINE),
          }}
        >
          <MapGL
            longitude={camera.longitude}
            latitude={camera.latitude}
            zoom={camera.zoom}
            pitch={camera.pitch}
            bearing={camera.bearing + bearingDrift}
            layers={layers}
            dark={data.backgroundVariant === "dark"}
            terrain={data.terrain ?? false}
            // Editorial register defaults — fog tinted to brand palette
            // (kills the default cyan globe halo), attribution chip in
            // bottom-right, soft editorial vignette blending the Mapbox
            // canvas into the surrounding page chrome. Graticule continues
            // to flow through the existing `data.graticule` →
            // `buildGraticuleLayers` pipeline above (added to `layers`),
            // so we don't double-route it through MapGL's graticule prop.
            // Label density: editorial register by default — country
            // labels at globe scale (orientation), auto-suppress at
            // regional zoom so editorial MapAnnotations dominate.
            fogPreset="editorial"
            vignette="editorial"
            labelDensity={data.labelDensity ?? "editorial"}
            onMapReady={setMapInstance}
          >
          {/* Point labels — rendered as Markers for proper geo projection */}
          {pointData.map((pt) => {
            // Find which phase first activated this point
            let activatedPhase = 0;
            for (let p = 0; p <= currentPhaseIdx; p++) {
              if (data.phases[p].activePoints.includes(pt.index)) {
                activatedPhase = p;
                break;
              }
            }
            const ptWindow = getPhaseWindow(data.phases, activatedPhase);
            const ptColor = pt.color || routeColor;
            // Labels appear AFTER camera settles (CONTENT_DELAY into phase)
            const ptDelay = activatedPhase > 0 ? sec(0.8) : sec(1.0);
            const ptAppearFrame = ptWindow.start + ptDelay;
            const ptOpacity = fadeIn(frame, ptAppearFrame, sec(0.4));
            const ptScale = scaleIn(frame, ptAppearFrame, sec(0.5));

            // Brand lock-on pulse on first appearance — replaces ad-hoc pulse
            const isNewPoint = activatedPhase === currentPhaseIdx;
            const pulseScale = isNewPoint
              ? lockOnPulse(frame, ptAppearFrame + sec(0.3), layout.fps, 1.15, 240)
              : 1;

            const contentOpacity = Math.min(
              ptOpacity,
              exitFade(frame, durationInFrames, 15)
            );
            const combinedScale = ptScale * pulseScale;

            return (
              <Marker
                key={`pt-${pt.index}`}
                longitude={pt.coordinates[0]}
                latitude={pt.coordinates[1]}
                anchor="center"
              >
                <div
                  style={{
                    opacity: contentOpacity,
                    transform: `scale(${combinedScale})`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {/* Inner dot */}
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: ptColor,
                      border: `2px solid ${theme.bg.surface}`,
                      boxShadow: `0 0 8px ${ptColor}80`, // shadows.accentGlowSm (80% opacity variant)
                    }}
                  />
                  {/* Labels container — positioned based on labelPosition */}
                  {(pt.label || pt.sublabel) && (() => {
                    // Position resolution priority:
                    //   1. Explicit pt.labelPosition (author chose it)
                    //   2. Auto-placer output (greedy collision avoidance,
                    //      May 14, 2026 — Layer A extended to route points)
                    //   3. Default "above"
                    const pos =
                      pt.labelPosition ||
                      autoLabelPositions.get(pt.index) ||
                      "above";
                    const isVertical = pos === "above" || pos === "below";
                    const isLeft = pos === "left";
                    const isRight = pos === "right";

                    const containerStyle: React.CSSProperties = {
                      position: "absolute",
                      display: "flex",
                      flexDirection: "column",
                      whiteSpace: "nowrap",
                      ...(pos === "above"
                        ? {
                            bottom: "100%",
                            marginBottom: layout.spacing.xs,
                            alignItems: "center",
                          }
                        : pos === "below"
                        ? {
                            top: "100%",
                            marginTop: layout.spacing.xs,
                            alignItems: "center",
                          }
                        : isLeft
                        ? {
                            right: "100%",
                            marginRight: layout.spacing.sm,
                            top: "50%",
                            transform: "translateY(-50%)",
                            alignItems: "flex-end",
                          }
                        : {
                            left: "100%",
                            marginLeft: layout.spacing.sm,
                            top: "50%",
                            transform: "translateY(-50%)",
                            alignItems: "flex-start",
                          }),
                    };

                    return (
                      <div style={containerStyle}>
                        {pt.label && (
                          <div
                            style={{
                              fontSize: fontSizes.h3,
                              maxWidth: textMaxWidth.label,
                              fontFamily: fonts.heading,
                              fontWeight: 600,
                              color: theme.text.primary,
                              textShadow: shadows.textLift,
                              textAlign: isVertical ? "center" : isLeft ? "right" : "left",
                            }}
                          >
                            {pt.label}
                          </div>
                        )}
                        {pt.sublabel && (
                          <div
                            style={{
                              fontSize: fontSizes.body,
                              maxWidth: textMaxWidth.label,
                              fontFamily: fonts.body,
                              color: theme.text.muted,
                              textShadow: shadows.textLift,
                              textAlign: isVertical ? "center" : isLeft ? "right" : "left",
                            }}
                          >
                            {pt.sublabel}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </Marker>
            );
          })}

          {/* Editorial annotation overlay — Plex-typed labels with optional
              leader lines, pinned to lon/lat. Phase shorthand resolves
              against the same getPhaseWindow used by point labels above. */}
          {data.annotations && data.annotations.length > 0 && (
            <MapAnnotations
              annotations={data.annotations}
              compositionDurationSec={durationInFrames / layout.fps}
              phaseWindows={phaseWindowsSec}
              dark={data.backgroundVariant === "dark"}
            />
          )}
          </MapGL>
        </div>

        {/* Locator inset — small globe showing where the parent camera
            is looking. Defaults to off; opt in via data.inset.show. */}
        {data.inset?.show && (
          <MapInset
            parentCamera={{
              longitude: camera.longitude,
              latitude: camera.latitude,
              zoom: camera.zoom,
            }}
            position={data.inset.position ?? "tl"}
            size={data.inset.size}
            framed={data.inset.framed}
            dark={data.backgroundVariant === "dark"}
          />
        )}

        {/* Title overlay — OPT-IN. Mapbox-backed: defaults to no title
            (atmospheric register, May 13 2026 doctrine). When `mapTitle`
            is provided, MapTitleFrame renders the requested mode.
            Smart cartouche placement isn't supported here; falls back
            to "top-left" + warnIf. */}
        {data.mapTitle && (
          (() => {
            const isAutoOnMapbox =
              data.mapTitle.mode === "cartouche" &&
              data.mapTitle.placement === "auto";
            warnIf(
              isAutoOnMapbox,
              "RouteAnimation",
              "`mapTitle.placement: 'auto'` is not supported on Mapbox-backed " +
              "templates. Falling back to 'top-left'.",
            );
            return (
              <MapTitleFrame
                title={data.title}
                subtitle={data.subtitle}
                mode={data.backgroundVariant === "dark" ? "dark" : "light"}
                config={data.mapTitle}
                footerCaption={data.source ? `Source: ${data.source}` : undefined}
                syncPoints={direction.syncPoints}
                resolvedCartoucheCorner={isAutoOnMapbox ? "top-left" : undefined}
              />
            );
          })()
        )}

        {/* Phase title overlay — appears after camera settles.
            Suppressed when the phase has no title (e.g., radial mode's
            auto-derived single phase, which inherits the chart title via
            TitleBlock at the top and shouldn't duplicate it here). */}
        {currentPhase.title && <div
          style={{
            position: "absolute",
            bottom: contentArea("content", "generous").bottom + layout.spacing.md,
            left: contentArea("content", "generous").left,
            right: contentArea("content", "generous").right,
            display: "flex",
            alignItems: "center",
            gap: layout.spacing.sm,
            opacity: Math.min(
              fadeIn(frame, contentStart, sec(0.4)),
              exitFade(frame, durationInFrames, 15)
            ),
            transform: `translateY(${slideIn(frame, contentStart, 20, sec(0.5))}px)`,
          }}
        >
          <div
            style={{
              width: 4,
              height: 48,
              backgroundColor: routeColor,
              borderRadius: 2,
            }}
          />
          <div>
            <div
              style={{
                fontSize: fontSizes.h3,
                maxWidth: textMaxWidth.h3,
                fontWeight: 600,
                color: theme.text.primary,
                textShadow: shadows.textLift,
              }}
            >
              {currentPhase.title}
            </div>
            {currentPhase.subtitle && (
              <div
                style={{
                  fontSize: fontSizes.body,
                  maxWidth: textMaxWidth.body,
                  color: theme.text.muted,
                  marginTop: layout.spacing.xs,
                  textShadow: shadows.textLift,
                }}
              >
                {currentPhase.subtitle}
              </div>
            )}
          </div>
        </div>}

        {/* Episode label */}
        {/* Episode label now lives in HeaderStrip — no longer duplicated here */}

        {/* Source */}
        {data.source && (
          <div
            style={{
              position: "absolute",
              bottom: contentArea("content", "generous").bottom,
              right: contentArea("content", "generous").right,
              fontSize: fontSizes.small,
              color: theme.text.muted,
              opacity: Math.min(
                fadeIn(frame, sec(2), sec(0.5)),
                exitFade(frame, durationInFrames, 15)
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

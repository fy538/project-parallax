/**
 * AtlasPlate — pure-SVG editorial cartography rendered via d3-geo.
 *
 * No Mapbox tiles, no deck.gl. Natural Earth TopoJSON → SVG <path>s,
 * d3-geo projection, phased country highlights, animated camera via
 * outer <g transform>. The Tufte / Fortune / Bartholomew register — flat,
 * high-contrast, no atmosphere.
 *
 * When to use vs. ChoroplethMap:
 *   - AtlasPlate: analytical beats where atmosphere distracts; offline
 *     contexts (no Mapbox token); precise typographic control; tighter
 *     visual identity.
 *   - ChoroplethMap: globe pivots, terrain context, vector-tile labels,
 *     when the geography itself is the editorial point.
 *
 * Performance contract:
 *   - Country paths are projected ONCE at the world fit and memoized.
 *   - Camera animation happens via SVG outer <g transform> (browser GPU
 *     compositing) rather than re-projection per frame. This means most
 *     projections animate cheaply (equalEarth, naturalEarth, mercator,
 *     equirectangular). `orthographic` doesn't pan/zoom because rotating
 *     a globe changes the visible faces; it holds its world-fit pose.
 *
 * Dossier: references/template-research/atlas-plate.md
 */

import React, { useMemo, useCallback, useId } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { geoGraticule } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { MapTitleFrame } from "../../components/MapTitleFrame";
import {
  resolveCartoucheCorner,
  projectPointsForPlacement,
} from "../../utils/mapTitlePlacement";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import {
  layout,
  mapConfig,
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  sec,
} from "../../design/theme";
import {
  resolveProjection,
  fitProjectionToFeatures,
  fitProjectionToWorld,
  makePathGenerator,
  getAllCountries,
  getCountryByAlpha3,
  getCountryCentroid,
  buildPhaseFillMap,
  type ProjectionName,
  type CountryFeature,
} from "../../utils/atlasProjection";
import { getDisputedBoundaries, densifyPolyline } from "../../utils/disputedBoundaries";
import { CLAMP_CUBIC_INOUT, exitFade, fadeIn, fadeOut } from "../../utils/animation";
import {
  easeCameraT,
  applyDwell,
  viaGlobePoseInterpolate,
} from "../../utils/mapUtils";
import { warnIf } from "../../utils/dataWarnings";
import { resolveColor as resolveAnnotationColor } from "../../components/MapAnnotations";
import type { AtlasPlateData, AtlasPhase } from "./types";
import type { MapAnnotation } from "../../components/MapAnnotations.types";

// ── Constants ─────────────────────────────────────────────────────────────

/** Default padding (px) inside which countries are fit when focused. */
const DEFAULT_FRAME_PADDING = 80;

/** Camera transition duration (frames). */
const CAMERA_TRANSITION_FRAMES = sec(1.2);

/** Country border stroke width (px) at world fit — scales inversely with zoom. */
const BORDER_STROKE_BASE = 0.6;

/** Disputed-boundary stroke width (px). Currently unused; reserved for future. */
// const DISPUTED_STROKE_BASE = 0.8;

/**
 * Frame viewport — `layout.width` × `layout.height` is constant per project,
 * so hoisting avoids reallocating the literal each render.
 */
const VIEWPORT = { width: layout.width, height: layout.height } as const;

// ── Phase windows ─────────────────────────────────────────────────────────

interface PhaseWindow {
  phase: AtlasPhase;
  index: number;
  startFrame: number;
  endFrame: number;
}

/**
 * Fallback phase window — used when `data.phases` is somehow empty (the
 * schema enforces .min(1), so this should be unreachable, but a fallback
 * keeps all hooks executable until the early-return at the bottom of the
 * component runs. See B4 defensive-guard pattern in the audit.
 */
const FALLBACK_PHASE_WINDOW: PhaseWindow = {
  phase: { title: "", durationSec: 0, countries: [] },
  index: 0,
  startFrame: 0,
  endFrame: 0,
};

const computePhaseWindows = (phases: AtlasPhase[]): PhaseWindow[] => {
  let cursor = 0;
  return phases.map((phase, index) => {
    const startFrame = cursor;
    const endFrame = cursor + sec(phase.durationSec);
    cursor = endFrame;
    return { phase, index, startFrame, endFrame };
  });
};

const getCurrentPhaseIndex = (frame: number, windows: PhaseWindow[]): number => {
  for (const w of windows) {
    if (frame < w.endFrame) return w.index;
  }
  return windows.length - 1;
};

// ── Camera pose ───────────────────────────────────────────────────────────

interface CameraPose {
  /** Multiplicative scale relative to the base (world-fit) projection. */
  scale: number;
  /** Pixel translate after scaling. */
  translate: [number, number];
}

/**
 * Compute a camera pose for a phase. Result is in "outer transform" space —
 * SVG group transform = translate(...) scale(s).
 *
 * - When `focus.iso3` is set, fits to those countries' bounds with padding.
 * - When `focus.center` is set, recenters the projection on that point and
 *   applies `scaleHint` (1.0 = world fit, 2.0 = 2× zoom).
 * - Without focus, returns the identity pose (world fit, scale 1.0).
 */
const computePhasePose = (
  phase: AtlasPhase,
  projectionName: ProjectionName | undefined,
  viewport: { width: number; height: number },
  framePadding: number,
  baseScale: number,
  baseTranslate: [number, number],
): CameraPose => {
  if (!phase.focus) {
    return { scale: 1, translate: [0, 0] };
  }

  // Orthographic = globe projection. The outer-<g> scale+translate trick
  // doesn't apply — the orthographic render path animates the projection's
  // ROTATION per frame instead (see `currentRotation` + `rotatedCountryPaths`
  // in the component body). Return identity so `focus` settings on
  // orthographic phases are ignored without crashing; use `phase.rotation`
  // instead. R3 audit fix: warn loudly so authors don't silently lose
  // their focus config.
  if (projectionName === "orthographic") {
    warnIf(
      !!phase.focus,
      "AtlasPlate",
      `Phase "${phase.title}" has \`focus\` on orthographic projection — ` +
      `focus is IGNORED for orthographic. Use \`phase.rotation: [lon, lat]\` ` +
      `instead to spin the globe to face that point.`,
    );
    warnIf(
      phase.cameraTransition === "via-globe",
      "AtlasPlate",
      `Phase "${phase.title}" has \`cameraTransition: "via-globe"\` on ` +
      `orthographic projection — the pull-back-then-push-in pose curve has ` +
      `no effect on the globe (outer transform is identity). Use ` +
      `"cinematic" or "linear" for the rotation easing instead.`,
    );
    return { scale: 1, translate: [0, 0] };
  }

  const proj = resolveProjection(projectionName);

  if (phase.focus.iso3 && phase.focus.iso3.length > 0) {
    const features: Feature<Geometry>[] = [];
    for (const code of phase.focus.iso3) {
      const c = getCountryByAlpha3(code);
      if (c) features.push(c.feature);
    }
    if (features.length === 0) {
      return { scale: 1, translate: [0, 0] };
    }
    const fc: Feature<Geometry> | { type: "FeatureCollection"; features: typeof features } =
      features.length === 1
        ? features[0]
        : { type: "FeatureCollection", features };
    fitProjectionToFeatures(proj, fc as any, viewport, framePadding); // no-as-any-ok: d3-geo interop — TopoJSON converter output type doesn't match d3's FeatureCollection exactly
  } else if (phase.focus.center) {
    fitProjectionToWorld(proj, viewport, framePadding);
    const [lon, lat] = phase.focus.center;
    const scaleHint = phase.focus.scaleHint ?? 1;
    proj.scale(proj.scale() * scaleHint);
    const projected = proj([lon, lat]);
    if (projected) {
      const [cx, cy] = projected;
      const [tx0, ty0] = proj.translate();
      proj.translate([tx0 + (viewport.width / 2 - cx), ty0 + (viewport.height / 2 - cy)]);
    }
  } else {
    return { scale: 1, translate: [0, 0] };
  }

  const targetScale = proj.scale();
  const targetTranslate = proj.translate() as [number, number];

  // Convert (targetScale, targetTranslate) into an outer-group transform
  // applied AFTER the base projection. For any point (x0, y0) projected
  // under the base, its position under the target is:
  //   (x1, y1) = ((x0 - T0x) * s + T1x, (y0 - T0y) * s + T1y)
  // where s = targetScale / baseScale.
  //
  // Equivalent outer transform: translate(T1x - T0x*s, T1y - T0y*s) scale(s).
  const s = targetScale / baseScale;
  return {
    scale: s,
    translate: [
      targetTranslate[0] - baseTranslate[0] * s,
      targetTranslate[1] - baseTranslate[1] * s,
    ],
  };
};

/** Linear interpolation of two poses. */
const interpolatePose = (a: CameraPose, b: CameraPose, t: number): CameraPose => ({
  scale: a.scale + (b.scale - a.scale) * t,
  translate: [
    a.translate[0] + (b.translate[0] - a.translate[0]) * t,
    a.translate[1] + (b.translate[1] - a.translate[1]) * t,
  ],
});

// ── Stable annotation key ─────────────────────────────────────────────────

/**
 * Content-derived key for an annotation. Array-index keys cause React to
 * reuse sub-components incorrectly when the data file's annotation order
 * changes during preview iteration (visible as: edit one annotation, a
 * *different* one appears to move). Anchor + label is unique enough in
 * practice.
 */
const annotationKey = (ann: MapAnnotation): string =>
  `ann-${ann.at[0].toFixed(3)},${ann.at[1].toFixed(3)}-${ann.label}`;

// ── SVG graticule path ────────────────────────────────────────────────────

/**
 * Build SVG `d` strings for the graticule. Returns a `{ minor, major }`
 * tuple. Major (30°) is null when emphasis is off.
 */
const buildGraticulePaths = (
  pathGen: ReturnType<typeof makePathGenerator>,
  spacing: number,
  emphasize30: boolean,
): { minor: string | null; major: string | null } => {
  const minorFeature = geoGraticule().step([spacing, spacing])();
  const minor = pathGen(minorFeature);
  if (!emphasize30 || spacing === 30) {
    return { minor: minor ?? null, major: null };
  }
  const majorFeature = geoGraticule().step([30, 30])();
  return { minor: minor ?? null, major: pathGen(majorFeature) ?? null };
};

// ── Component ─────────────────────────────────────────────────────────────

export const AtlasPlate: React.FC<{ data: AtlasPlateData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation({
    noDrift: true,
    ...direction.driftOptions,
  });

  const dark = data.backgroundVariant === "dark";
  const framePadding = data.framePadding ?? DEFAULT_FRAME_PADDING;
  const isOrthographic = data.projection === "orthographic";

  // ── Base projection (world fit) ─────────────────────────────────────────
  // Computed once. All paths derive from this. Camera animation rides on
  // an outer transform applied to the country group. The scale + translate
  // scalars are folded into the same useMemo so we don't re-call the
  // getters every frame.
  const { baseProjection, baseScale, baseTranslate } = useMemo(() => {
    const p = resolveProjection(data.projection);
    fitProjectionToWorld(p, VIEWPORT, framePadding);
    return {
      baseProjection: p,
      baseScale: p.scale(),
      baseTranslate: p.translate() as [number, number],
    };
  }, [data.projection, framePadding]);

  const basePathGen = useMemo(() => makePathGenerator(baseProjection), [baseProjection]);

  // ── Country paths (memoized for non-orthographic) ───────────────────────
  // For non-orthographic projections, paths are computed ONCE from the
  // base (world-fit) projection. Camera animation rides on an outer
  // <g transform> applied to the country group — no per-frame re-projection.
  //
  // For orthographic, this memo is computed but UNUSED — the render path
  // generates fresh paths per frame from the rotated projection (see
  // `rotatedCountryPaths` below). Keeping the memo non-conditional avoids
  // a Rules-of-Hooks violation.
  const countryPaths = useMemo(() => {
    const features = getAllCountries();
    return features.map((c: CountryFeature) => ({
      alpha3: c.alpha3,
      name: c.name,
      d: basePathGen(c.feature) ?? "",
    }));
  }, [basePathGen]);

  // ── Graticule paths ─────────────────────────────────────────────────────
  // For orthographic, the graticule re-projects per frame so it follows the
  // globe rotation. For other projections, memoized on basePathGen.
  // Either way, we use `activePathGen` which delegates appropriately.
  // (Defined AFTER the rotated-projection logic below so it can read it.)

  // ── Phase windows + camera ──────────────────────────────────────────────
  const windows = useMemo(() => computePhaseWindows(data.phases), [data.phases]);
  // Defensive: Zod schema requires phases.min(1). If a manifest somehow
  // bypasses validation, we use a fallback window for all hooks below
  // (Rules of Hooks: every hook must run every render) and early-return
  // null at the bottom of the component before the JSX emits.
  const safeIdx = windows.length === 0
    ? 0
    : Math.min(getCurrentPhaseIndex(frame, windows), windows.length - 1);
  const currentWindow: PhaseWindow = windows[safeIdx] ?? FALLBACK_PHASE_WINDOW;

  const phasePoses = useMemo(
    () =>
      data.phases.map((phase) =>
        computePhasePose(phase, data.projection, VIEWPORT, framePadding, baseScale, baseTranslate),
      ),
    [data.phases, data.projection, framePadding, baseScale, baseTranslate],
  );

  const camera = useMemo(() => {
    if (safeIdx === 0) return phasePoses[0];
    const prev = phasePoses[safeIdx - 1];
    const next = phasePoses[safeIdx];

    // Raw transition progress (frames → 0..1).
    const rawT = interpolate(
      frame,
      [currentWindow.startFrame, currentWindow.startFrame + CAMERA_TRANSITION_FRAMES],
      [0, 1],
      CLAMP_CUBIC_INOUT,
    );

    // Apply optional dwell clamps, then the per-phase easing curve.
    const dwellBefore = currentWindow.phase.cameraDwell?.before ?? 0;
    const dwellAfter = currentWindow.phase.cameraDwell?.after ?? 0;
    const dwelled = dwellBefore + dwellAfter > 0
      ? applyDwell(rawT, dwellBefore, dwellAfter)
      : rawT;
    const transition = currentWindow.phase.cameraTransition ?? "linear";
    const easedT = easeCameraT(dwelled, transition);

    // "via-globe" uses a Bezier-shaped pose curve in scale-space (the
    // camera pulls out then back in). All others use linear pose
    // interpolation with the eased t.
    return transition === "via-globe"
      ? viaGlobePoseInterpolate(prev, next, easedT)
      : interpolatePose(prev, next, easedT);
  }, [
    safeIdx,
    phasePoses,
    frame,
    currentWindow?.startFrame,
    currentWindow?.phase.cameraTransition,
    currentWindow?.phase.cameraDwell?.before,
    currentWindow?.phase.cameraDwell?.after,
  ]);

  // ── Orthographic rotation animation ─────────────────────────────────────
  // Orthographic = globe. The outer-<g> scale+translate trick doesn't work
  // for the sphere (rotating changes which faces are visible). Instead we
  // compute a per-frame rotated projection and re-project all paths.
  //
  // Cost: 177 countries × ~50μs/projection ≈ 9ms per frame. At 30fps
  // that's ~270ms per second on projection alone — significant but
  // acceptable for short cinematic globe shots (cold-opens, 3-5s).
  // For longer compositions, prefer non-orthographic projections.
  //
  // Rotation per phase comes from `phase.rotation` (defaults to [0, 20]
  // for phase 0, or holds previous phase's rotation when undefined).
  const phaseRotations = useMemo<[number, number][]>(() => {
    let last: [number, number] = [0, 20];
    return data.phases.map((p) => {
      if (p.rotation) last = p.rotation;
      return last;
    });
  }, [data.phases]);

  const currentRotation = useMemo<[number, number]>(() => {
    if (!isOrthographic) return [0, 0];
    if (safeIdx === 0) return phaseRotations[0];
    const prev = phaseRotations[safeIdx - 1];
    const next = phaseRotations[safeIdx];

    // Raw 0→1 progress through the transition window.
    const rawT = interpolate(
      frame,
      [currentWindow.startFrame, currentWindow.startFrame + CAMERA_TRANSITION_FRAMES],
      [0, 1],
      CLAMP_CUBIC_INOUT,
    );
    // Apply optional dwell windows and the per-phase easing curve so
    // orthographic rotations honor `cameraTransition` + `cameraDwell`
    // exactly like non-orthographic camera transitions do.
    const dwellBefore = currentWindow.phase.cameraDwell?.before ?? 0;
    const dwellAfter = currentWindow.phase.cameraDwell?.after ?? 0;
    const dwelled = dwellBefore + dwellAfter > 0
      ? applyDwell(rawT, dwellBefore, dwellAfter)
      : rawT;
    const transition = currentWindow.phase.cameraTransition ?? "linear";
    const t = easeCameraT(dwelled, transition);

    // Shortest-arc interpolation for longitude (handle wrap-around at ±180°)
    let lonDelta = next[0] - prev[0];
    if (lonDelta > 180) lonDelta -= 360;
    if (lonDelta < -180) lonDelta += 360;
    return [
      prev[0] + lonDelta * t,
      prev[1] + (next[1] - prev[1]) * t,
    ];
  }, [
    isOrthographic,
    safeIdx,
    phaseRotations,
    frame,
    currentWindow?.startFrame,
    currentWindow?.phase.cameraTransition,
    currentWindow?.phase.cameraDwell?.before,
    currentWindow?.phase.cameraDwell?.after,
  ]);

  // Per-frame rotated projection for orthographic. For non-orthographic,
  // returns the memoized base projection so consumers (annotations,
  // disputes, country labels) all use the same projection regardless of
  // mode. d3-geo's rotate is [lambda, phi, gamma] — lambda is longitude
  // (negated, since rotation moves the world OPPOSITE to the apparent
  // camera). Gamma is omitted (no roll).
  const activeProjection = useMemo(() => {
    if (!isOrthographic) return baseProjection;
    const p = resolveProjection("orthographic");
    fitProjectionToWorld(p, VIEWPORT, framePadding);
    p.rotate([-currentRotation[0], -currentRotation[1]]);
    return p;
  }, [isOrthographic, baseProjection, currentRotation, framePadding]);

  // Per-frame path generator from the active projection.
  const activePathGen = useMemo(
    () => (isOrthographic ? makePathGenerator(activeProjection) : basePathGen),
    [isOrthographic, activeProjection, basePathGen],
  );

  // Per-frame country paths for orthographic — bypassed for other projections.
  const rotatedCountryPaths = useMemo(() => {
    if (!isOrthographic) return countryPaths;
    return getAllCountries().map((c: CountryFeature) => ({
      alpha3: c.alpha3,
      name: c.name,
      d: activePathGen(c.feature) ?? "",
    }));
  }, [isOrthographic, activePathGen, countryPaths]);

  // ── Graticule paths (uses activePathGen — auto-rotates for orthographic) ──
  const graticulePaths = useMemo(() => {
    if (!data.graticule) return null;
    const spacing = data.graticule.spacing ?? 10;
    const emphasize30 = data.graticule.emphasize30 ?? true;
    return buildGraticulePaths(activePathGen, spacing, emphasize30);
  }, [data.graticule, activePathGen]);

  // ── Disputed-boundary paths (uses activePathGen) ────────────────────────
  // For orthographic projections, dispute polylines are densified to 1°
  // max segment so the sphere clip can correctly find the day/night
  // terminator crossing (B1 audit fix). For other projections, raw coords
  // are sufficient — d3-geo's clip math is simpler off the sphere.
  const disputedPaths = useMemo(() => {
    if (!data.disputedBoundaries) return [];
    const boundaries = getDisputedBoundaries(
      data.disputedBoundaries === true ? true : data.disputedBoundaries,
    );
    return boundaries.map((b) => {
      const coords = isOrthographic ? densifyPolyline(b.coords, 1) : b.coords;
      return {
        tag: b.tag,
        d: activePathGen({
          type: "Feature",
          geometry: { type: "LineString" as const, coordinates: coords },
          properties: {},
        } as any), // no-as-any-ok: d3-geo interop — GeoJSON Feature nominal type
      };
    });
  }, [data.disputedBoundaries, activePathGen, isOrthographic]);

  // ── Per-country fill (built per phase) ──────────────────────────────────
  const currentFillMap = useMemo(
    () =>
      buildPhaseFillMap(
        currentWindow.phase.countries.map((c) => ({
          alpha3: c.iso3,
          fill: c.fill,
          noData: c.noData,
        })),
        {
          landFill: dark ? palette.ink : palette.bone,
          noDataFill: palette.umber,
        },
      ),
    [currentWindow.phase.countries, dark],
  );

  // ── Theme tokens ────────────────────────────────────────────────────────
  // Vintage aesthetic is a *light-mode* register only — there's no
  // dark-vintage equivalent. When `aesthetic: "vintage"` is set on a dark
  // composition, dark wins and vintage is ignored. Warn at dev time
  // (B3 audit fix) so the silent fallthrough is visible.
  warnIf(
    data.aesthetic === "vintage" && dark,
    "AtlasPlate",
    "aesthetic: 'vintage' is a LIGHT-mode register; backgroundVariant: " +
    "'dark' takes precedence and vintage is ignored. Drop one or the " +
    "other to silence this warning.",
  );
  const isVintage = data.aesthetic === "vintage" && !dark;
  const vintage = mapConfig.vintageStyleColors;

  const landFill = isVintage
    ? vintage.land
    : (dark ? palette.ink : palette.bone);
  const borderColor = isVintage
    ? vintage.landBorder
    : (dark ? palette.bone : palette.ink);
  const oceanColor = isVintage
    ? vintage.ocean
    : (dark ? mapConfig.darkStyleColors.ocean : mapConfig.styleColors.ocean);

  // Per-mount unique SVG filter IDs. We previously derived these from
  // `data.episode`, but `episode` is the SAME slug across multiple
  // catalog samples (all "_catalog") so two vintage compositions on one
  // page (the showreel) would share filter definitions. If we ever vary
  // the grain config per composition, that collision becomes a bug.
  // `useId()` gives a per-component-instance unique string. B4 audit fix.
  // React's useId() format includes colons (e.g., `:r1:`) which technically
  // are valid in SVG IDs but confuse some legacy XML tooling; strip them.
  const reactId = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const grainFilterId = `paper-grain-${reactId}`;
  const vignetteId = `vintage-vignette-${reactId}`;

  // ── Stroke scaling — narrower borders when zoomed in ────────────────────
  const borderStroke = BORDER_STROKE_BASE / Math.max(1, Math.sqrt(camera.scale));

  // For orthographic, the outer transform is identity (rotation is baked
  // into the projection). For other projections, scale+translate from
  // camera animation. Centralizing here avoids `isOrthographic ? "" : ...`
  // in three places.
  const outerTransform = isOrthographic
    ? "translate(0 0) scale(1)"
    : `translate(${camera.translate[0]} ${camera.translate[1]}) scale(${camera.scale})`;

  // ── Transform string for the outer group ────────────────────────────────
  const transformStr = outerTransform;

  // ── Annotation projection (live, accounts for camera) ───────────────────
  // For SVG annotations, project lon/lat under the BASE projection, then
  // apply the camera transform manually to get the on-screen position.
  // useCallback keeps a stable identity per camera/projection — paired with
  // React.memo on sub-components, this would skip re-renders when nothing
  // relevant moved (today the sub-components still re-render every frame
  // because they aren't memoized; that's the next-tier perf pass).
  const projectAnnotation = useCallback(
    (lonLat: [number, number]): [number, number] | null => {
      if (isOrthographic) {
        // For orthographic, the projection ALREADY incorporates rotation.
        // No outer transform is applied. Also: d3-geo's orthographic
        // returns null for points on the far side of the globe — those
        // annotations correctly skip render.
        const projected = activeProjection(lonLat);
        return projected ?? null;
      }
      const projected = baseProjection(lonLat);
      if (!projected) return null;
      const [x0, y0] = projected;
      return [
        x0 * camera.scale + camera.translate[0],
        y0 * camera.scale + camera.translate[1],
      ];
    },
    [isOrthographic, activeProjection, baseProjection, camera],
  );

  // Memoized list of countries with labels in the current phase.
  // AGENTS.md flags `.filter()` over data props in the render body — even
  // though the array is tiny, the named memo is the documented pattern.
  const labelledCountries = useMemo(
    () => currentWindow.phase.countries.filter((c) => c.label),
    [currentWindow.phase.countries],
  );

  // ── Smart title placement ─────────────────────────────────────────────────
  // Resolve the title's corner anchor: the corner with maximum clearance
  // from HIGHLIGHTED-feature centroids in the current phase (countries with
  // data fills, not all countries). The projection accounts for camera zoom
  // / pan, so the placement tracks phase transitions automatically.
  // Default is "auto" — set `mapTitle.placement` to a corner to override.
  const resolvedCartoucheCorner = useMemo(() => {
    const placement = data.mapTitle?.placement ?? "auto";
    if (placement !== "auto") return undefined;
    const highlighted = currentWindow.phase.countries
      .map((c) => getCountryCentroid(c.iso3))
      .filter((c): c is [number, number] => c !== null);
    // No highlights → default to top-left. (No need to score against the
    // entire basemap — if nothing's highlighted, every corner is equally
    // fine and the editorial-reading-order default wins.)
    if (highlighted.length === 0) return "top-left" as const;
    const points = projectPointsForPlacement(highlighted, projectAnnotation);
    return resolveCartoucheCorner(points);
  }, [data.mapTitle, currentWindow.phase.countries, projectAnnotation]);

  // Defensive null-render — happens AFTER all hooks (Rules of Hooks). If
  // schema validation ever lets through an empty phases array, render
  // nothing and surface a dev warning instead of crashing.
  warnIf(
    windows.length === 0,
    "AtlasPlate",
    "phases array is empty — rendering nothing. Schema should have caught this upstream.",
  );
  if (windows.length === 0) return null;

  return (
    <Background
      variant={dark ? "dark" : "light"}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* Brand chrome */}
        <HeaderStrip
          metadata={`${data.episode || ""} · atlas`}
          mode={dark ? "dark" : "light"}
        />
        <FooterStrip
          scale={data.source ? `Source: ${data.source}` : undefined}
          mode={dark ? "dark" : "light"}
        />

        {/* Map SVG — fills the full frame. Pointer events disabled for video. */}
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        >
          {/* SVG filter + gradient definitions for vintage aesthetic.
              Only emitted when isVintage; otherwise omitted entirely so
              the `<defs>` block doesn't add render cost. */}
          {isVintage && (
            <defs>
              {/* Paper grain — feTurbulence noise pushed toward warm brown
                  via colorMatrix. The result is a sepia-toned noise texture
                  applied as a multiply overlay at ~10% opacity. */}
              <filter id={grainFilterId} x="0" y="0" width="100%" height="100%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.65"
                  numOctaves="3"
                  seed="7"
                  result="noise"
                />
                <feColorMatrix
                  in="noise"
                  type="matrix"
                  values="
                    0.30 0 0 0 0.18
                    0.20 0 0 0 0.12
                    0.12 0 0 0 0.07
                    0 0 0 0.45 0
                  "
                />
              </filter>
              {/* Soft vignette: warm-toned radial gradient that darkens the
                  frame corners. Period atlases were almost always darker at
                  the edges from photographic-print falloff. */}
              <radialGradient id={vignetteId} cx="50%" cy="50%" r="75%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0" />
                <stop offset="70%" stopColor="#3A2510" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#3A2510" stopOpacity="0.22" />
              </radialGradient>
            </defs>
          )}

          {/* Ocean rect — atlas plates have a colored "water" background
              behind the land. Fills the frame so countries float on it. */}
          <rect width={layout.width} height={layout.height} fill={oceanColor} />

          {/* Camera-transformed group — countries + graticule + annotations */}
          <g transform={transformStr}>
            {/* Graticule — minor first, major on top, BOTH under countries */}
            {graticulePaths?.minor && (
              <path
                d={graticulePaths.minor}
                fill="none"
                stroke={borderColor}
                strokeWidth={0.5 / Math.max(1, Math.sqrt(camera.scale))}
                strokeOpacity={data.graticule?.opacity ?? 0.1}
              />
            )}
            {graticulePaths?.major && (
              <path
                d={graticulePaths.major}
                fill="none"
                stroke={borderColor}
                strokeWidth={0.75 / Math.max(1, Math.sqrt(camera.scale))}
                strokeOpacity={Math.min(0.25, (data.graticule?.opacity ?? 0.1) * 2)}
              />
            )}

            {/* Countries — `rotatedCountryPaths` switches to per-frame
                re-projection when orthographic, otherwise returns the
                memoized `countryPaths` unchanged. */}
            {rotatedCountryPaths.map((c, i) => {
              const fill = (c.alpha3 && currentFillMap[c.alpha3]) || landFill;
              return (
                <path
                  key={c.alpha3 ?? `c${i}`}
                  d={c.d}
                  fill={fill}
                  stroke={borderColor}
                  strokeWidth={borderStroke}
                  strokeLinejoin="round"
                />
              );
            })}

            {/* Disputed boundaries — dashed rust lines layered over borders. */}
            {disputedPaths.map(
              ({ tag, d }) =>
                d && (
                  <path
                    key={`dispute-${tag}`}
                    d={d}
                    fill="none"
                    stroke={palette.rust}
                    strokeWidth={1.6 / Math.max(1, Math.sqrt(camera.scale))}
                    strokeDasharray="6 4"
                    strokeOpacity={0.85}
                    strokeLinecap="round"
                  />
                ),
            )}
          </g>

          {/* Vintage aesthetic overlays — paper grain (multiply) + vignette.
              Layered ABOVE the map content but BELOW the annotations so
              labels stay legible against the grain. The grain rect uses
              `mix-blend-mode: multiply` so it tints lights and darkens
              shadows like a real paper texture. */}
          {isVintage && (
            <>
              <rect
                width={layout.width}
                height={layout.height}
                fill="#3A2510"
                filter={`url(#${grainFilterId})`}
                style={{ mixBlendMode: "multiply", opacity: 0.5 }}
              />
              <rect
                width={layout.width}
                height={layout.height}
                fill={`url(#${vignetteId})`}
                style={{ pointerEvents: "none" }}
              />
            </>
          )}

          {/* Annotations — projected per-frame so they track the camera.
              Rendered as SVG <text>, NOT inside the transform group, so
              the text doesn't scale with the camera (we want font size
              constant; only position tracks).
              Opacity + projected coords are computed PARENT-side so the
              memoized sub-component sees primitive props and skips
              re-render when nothing relevant changed. */}
          {data.annotations?.map((ann) => {
            const screen = projectAnnotation(ann.at);
            if (!screen) return null;
            const { startFrame, endFrame } = resolveAnnotationFrames(ann, durationInFrames, windows);
            const opacity = Math.min(
              fadeIn(frame, startFrame, sec(0.5)),
              fadeOut(frame, endFrame, sec(0.35)),
            );
            if (opacity <= 0) return null;
            return (
              <AtlasAnnotation
                key={annotationKey(ann)}
                annotation={ann}
                screenX={screen[0]}
                screenY={screen[1]}
                opacity={opacity}
                dark={dark}
              />
            );
          })}

          {/* Per-phase country labels — centroid lookup is cached; parent
              computes screen+opacity so the sub-component memo-skips. */}
          {labelledCountries.map((c) => {
            const centroid = getCountryCentroid(c.iso3);
            if (!centroid) return null;
            const screen = projectAnnotation(centroid);
            if (!screen) return null;
            const opacity = Math.min(
              fadeIn(frame, currentWindow.startFrame + sec(0.4), sec(0.4)),
              fadeOut(frame, currentWindow.endFrame, sec(0.3)),
            );
            if (opacity <= 0) return null;
            return (
              <CountryLabel
                key={`lbl-${c.iso3}`}
                label={c.label!}
                screenX={screen[0]}
                screenY={screen[1]}
                opacity={opacity}
                dark={dark}
              />
            );
          })}
        </svg>

        {/* Title floats on the map at the corner with maximum clearance
            from highlighted features (see `resolvedCartoucheCorner` above).
            Phase label sits in the opposite corner. Source caption is
            already routed through FooterStrip.scale — no duplication. */}
        <MapTitleFrame
          title={data.title}
          subtitle={data.subtitle}
          mode={dark ? "dark" : "light"}
          config={data.mapTitle}
          footerTitle={currentWindow.phase.title}
          footerSubtitle={currentWindow.phase.subtitle}
          syncPoints={direction.syncPoints}
          resolvedCartoucheCorner={resolvedCartoucheCorner}
        />
      </AbsoluteFill>
    </Background>
  );
};

// ── Annotation timing resolver (parent-side, lifted from sub-component) ──

/**
 * Resolve appear/exit frames for an annotation. Lifted to module scope so
 * the parent can compute it inline and decide whether to mount the
 * sub-component at all (annotations outside their window skip render
 * entirely — a real win when a composition has 20+ annotations spread
 * across phases). Same semantics as MapAnnotations.resolveTiming.
 */
const resolveAnnotationFrames = (
  annotation: MapAnnotation,
  compositionDurationFrames: number,
  phaseWindows: PhaseWindow[],
): { startFrame: number; endFrame: number } => {
  if (annotation.appearAtSec !== undefined || annotation.exitAtSec !== undefined) {
    return {
      startFrame: annotation.appearAtSec !== undefined ? Math.round(annotation.appearAtSec * layout.fps) : 0,
      endFrame: annotation.exitAtSec !== undefined ? Math.round(annotation.exitAtSec * layout.fps) : compositionDurationFrames,
    };
  }
  if (annotation.phase !== undefined && phaseWindows[annotation.phase]) {
    return {
      startFrame: phaseWindows[annotation.phase].startFrame,
      endFrame: phaseWindows[annotation.phase].endFrame,
    };
  }
  return { startFrame: 0, endFrame: compositionDurationFrames };
};

// ── Sub-component: SVG annotation (React.memo'd) ──────────────────────────

interface AtlasAnnotationProps {
  annotation: MapAnnotation;
  /** Projected screen position — passed as primitives so React.memo shallowEqual works. */
  screenX: number;
  screenY: number;
  /** Pre-computed by parent so the sub-component is a pure presentation. */
  opacity: number;
  dark: boolean;
}

/**
 * React.memo's default shallow compare skips re-render when annotation
 * (stable from data), screenX/Y/opacity (primitives), and dark (primitive)
 * are unchanged from last render. Outside camera transitions, screen
 * coords are constant; outside fade windows, opacity is constant. The
 * sub-component then skips re-render entirely for those frames.
 */
const AtlasAnnotation = React.memo<AtlasAnnotationProps>(({
  annotation,
  screenX,
  screenY,
  opacity,
  dark,
}) => {
  const color = resolveAnnotationColor(annotation.hierarchy, annotation.emphasis, dark);
  const x = screenX;
  const y = screenY;
  const dx = annotation.leader?.dx ?? 0;
  const dy = annotation.leader?.dy ?? (annotation.hierarchy === "primary" ? -28 : annotation.hierarchy === "secondary" ? -22 : -16);
  const hasLeader = !!annotation.leader;

  const fontSize =
    annotation.hierarchy === "primary" ? fontSizes.h3
    : annotation.hierarchy === "secondary" ? fontSizes.body
    : fontSizes.caption;
  const fontWeight =
    annotation.hierarchy === "primary" ? fontWeights.semibold
    : annotation.hierarchy === "secondary" ? fontWeights.medium
    : fontWeights.regular;
  const fontFamily =
    annotation.hierarchy === "tertiary" ? fonts.metadata : fonts.display;
  const textTransform = annotation.hierarchy === "primary" ? "uppercase" : "none";
  const textAnchor =
    annotation.align === "left" ? "end"
    : annotation.align === "right" ? "start"
    : dx > 4 ? "start"
    : dx < -4 ? "end"
    : "middle";

  return (
    <g opacity={opacity} style={{ pointerEvents: "none" }}>
      {/* Anchor dot — small filled dot at the lon/lat. */}
      <circle cx={x} cy={y} r={annotation.hierarchy === "tertiary" ? 2 : 3.5} fill={color} />

      {/* Leader line. */}
      {hasLeader && (
        <line
          x1={x}
          y1={y}
          x2={x + dx}
          y2={y + dy}
          stroke={color}
          strokeOpacity={0.55}
          strokeWidth={annotation.hierarchy === "primary" ? 1.25 : annotation.hierarchy === "secondary" ? 1 : 0.75}
          strokeLinecap="round"
        />
      )}

      {/* Label. */}
      <text
        x={x + dx}
        y={y + dy}
        dominantBaseline="middle"
        textAnchor={textAnchor}
        style={{
          fontFamily,
          fontSize,
          fontWeight,
          letterSpacing: `${annotation.hierarchy === "primary" ? letterSpacing.h3 : letterSpacing.label}px`,
          textTransform,
          fill: color,
        }}
      >
        {annotation.label}
      </text>
      {annotation.sublabel && (
        <text
          x={x + dx}
          y={y + dy + fontSize * 0.9}
          dominantBaseline="middle"
          textAnchor={textAnchor}
          style={{
            fontFamily: fonts.metadata,
            fontSize: fontSizes.meta,
            fontWeight: fontWeights.regular,
            letterSpacing: `${letterSpacing.meta}px`,
            textTransform: "uppercase",
            fill: palette.taupe,
          }}
        >
          {annotation.sublabel}
        </text>
      )}
    </g>
  );
});
AtlasAnnotation.displayName = "AtlasAnnotation";

// ── Sub-component: country label at centroid (React.memo'd) ───────────────

interface CountryLabelProps {
  label: string;
  /** Projected centroid screen position. Primitives → React.memo works. */
  screenX: number;
  screenY: number;
  opacity: number;
  dark: boolean;
}

const CountryLabel = React.memo<CountryLabelProps>(({
  label,
  screenX,
  screenY,
  opacity,
  dark,
}) => {
  const color = dark ? palette.bone : palette.ink;
  return (
    <text
      x={screenX}
      y={screenY}
      dominantBaseline="middle"
      textAnchor="middle"
      opacity={opacity}
      style={{
        fontFamily: fonts.display,
        fontSize: fontSizes.label,
        fontWeight: fontWeights.medium,
        letterSpacing: `${letterSpacing.label}px`,
        textTransform: "uppercase",
        fill: color,
        pointerEvents: "none",
      }}
    >
      {label}
    </text>
  );
});
CountryLabel.displayName = "CountryLabel";

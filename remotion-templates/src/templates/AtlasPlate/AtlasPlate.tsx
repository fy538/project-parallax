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
import { resolveSeaLabels, type SeaLabel } from "../../utils/seaLabels";
import { CLAMP_CUBIC_INOUT, exitFade, fadeIn, fadeOut } from "../../utils/animation";
import { lerpHex } from "../../utils/colorUtils";
import {
  easeCameraT,
  applyDwell,
  viaGlobePoseInterpolate,
} from "../../utils/mapUtils";
import { warnIf } from "../../utils/dataWarnings";
import {
  placeLabels,
  type PlaceableAnnotation,
  type Placement,
} from "../../components/labelPlacement";
import { measureText } from "@remotion/layout-utils";
import type { AtlasPlateData, AtlasPhase } from "./types";
import { AtlasInsetLocator } from "../../components/AtlasInsetLocator";
import { ReliefUnderlay } from "./ReliefUnderlay";
import {
  DEFAULT_FRAME_PADDING,
  CAMERA_TRANSITION_FRAMES,
  FALLBACK_PHASE_WINDOW,
  computePhaseWindows,
  computePhasePose,
  getCurrentPhaseIndex,
  interpolatePose,
  type PhaseWindow,
} from "./atlasCamera";
import {
  annotationKey,
  resolveAnnotationFrames,
} from "./atlasAnnotationHelpers";
import { AtlasAnnotation } from "./AtlasAnnotation";
import { SeaLabelText } from "./SeaLabelText";
import { CountryLabel } from "./CountryLabel";

// ── Constants ─────────────────────────────────────────────────────────────
//
// Camera + phase utilities (PhaseWindow, computePhaseWindows,
// getCurrentPhaseIndex, FALLBACK_PHASE_WINDOW, CameraPose, computePhasePose,
// interpolatePose, DEFAULT_FRAME_PADDING, CAMERA_TRANSITION_FRAMES) live
// in `./atlasCamera`. Annotation helpers (annotationKey,
// resolveAnnotationFrames) live in `./atlasAnnotationHelpers`. Sub-
// components (AtlasAnnotation, SeaLabelText, CountryLabel) live in
// sibling files. Imports below.

/** Country border stroke width (px) at world fit — scales inversely with zoom. */
const BORDER_STROKE_BASE = 0.6;

/**
 * Frame viewport — `layout.width` × `layout.height` is constant per project,
 * so hoisting avoids reallocating the literal each render.
 */
const VIEWPORT = { width: layout.width, height: layout.height } as const;

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
    // B2: defensive guard — phasePoses derives from data.phases, which the
    // Zod schema requires to be non-empty (.min(1)). If empty bypasses
    // schema, return identity so downstream hooks run before null-guard fires.
    if (safeIdx === 0) return phasePoses[0] ?? { scale: 1, translate: [0, 0] as [number, number] };
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
    // B2: same defensive guard as the camera memo above.
    if (safeIdx === 0) return phaseRotations[0] ?? ([0, 20] as [number, number]);
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

  // ── Per-country fill maps (current phase + previous, for crossfade) ─────
  const fillMapOptions = useMemo(
    () => ({
      landFill: dark ? palette.ink : palette.bone,
      noDataFill: palette.umber,
    }),
    [dark],
  );
  const currentFillMap = useMemo(
    () =>
      buildPhaseFillMap(
        currentWindow.phase.countries.map((c) => ({
          alpha3: c.iso3,
          fill: c.fill,
          noData: c.noData,
        })),
        fillMapOptions,
      ),
    [currentWindow.phase.countries, fillMapOptions],
  );

  // Previous-phase fill map for the phase-boundary crossfade. The fill
  // resolver below lerps from `prevFillMap[iso3]` to `currentFillMap[iso3]`
  // over the camera transition window. Empty `{}` on phase 0 (no source
  // phase to lerp from); the resolver short-circuits to current fill.
  const prevFillMap = useMemo(() => {
    if (safeIdx === 0) return {} as Record<string, string>;
    // N4: skip building the prev-phase fill map when fillTransition is
    // "instant" — fillTransitionT is 1 for the whole phase so the lerp
    // resolver never reads prevFillMap. Saves one buildPhaseFillMap call
    // per phase on compositions that use instant transitions.
    if (currentWindow.phase.fillTransition === "instant") return {} as Record<string, string>;
    const prev = windows[safeIdx - 1].phase;
    return buildPhaseFillMap(
      prev.countries.map((c) => ({
        alpha3: c.iso3,
        fill: c.fill,
        noData: c.noData,
      })),
      fillMapOptions,
    );
  }, [windows, safeIdx, fillMapOptions, currentWindow.phase.fillTransition]);

  // Crossfade progress (0 → 1) over the CAMERA_TRANSITION_FRAMES window at
  // the start of each new phase. Eased so color motion matches camera
  // motion (both use the same cubic curve in `easeCameraT`). Skipped
  // entirely when `currentWindow.phase.fillTransition === "instant"` —
  // returns 1 so the lerp resolves directly to the target fill.
  //
  // A4 audit (May 2026): "lerp" is already the DEFAULT when fillTransition
  // is undefined — the `=== "instant"` check gates the skip, so undefined
  // falls through to the lerp path. No default-change needed.
  const fillTransitionT = useMemo(() => {
    if (safeIdx === 0) return 1;
    if (currentWindow.phase.fillTransition === "instant") return 1;
    const sinceStart = frame - currentWindow.startFrame;
    if (sinceStart <= 0) return 0;
    if (sinceStart >= CAMERA_TRANSITION_FRAMES) return 1;
    // Match the camera's transition curve so color motion stays in sync.
    return easeCameraT(
      sinceStart / CAMERA_TRANSITION_FRAMES,
      currentWindow.phase.cameraTransition ?? "linear",
    );
  }, [
    frame,
    currentWindow.startFrame,
    currentWindow.phase.fillTransition,
    currentWindow.phase.cameraTransition,
    safeIdx,
  ]);

  /**
   * Resolve a country's fill at the current frame, including the
   * phase-boundary crossfade. Closes over the current/prev fill maps and
   * the eased transition progress.
   */
  const resolveCountryFill = useCallback(
    (alpha3: string | null | undefined): string => {
      const landFill = fillMapOptions.landFill;
      const target = (alpha3 && currentFillMap[alpha3]) || landFill;
      if (fillTransitionT >= 1) return target;
      const source = (alpha3 && prevFillMap[alpha3]) || landFill;
      if (source === target) return target;
      return lerpHex(source, target, fillTransitionT);
    },
    [currentFillMap, prevFillMap, fillTransitionT, fillMapOptions.landFill],
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
  // `atlas-relief` register — shaded-relief raster underlay sits below the
  // country fills inside the camera-transformed `<g>`. Country fills must
  // be semi-transparent so the relief peeks through (otherwise the relief
  // is wasted; the visible texture is only at the ocean rim). We do that
  // by mixing landFill with the ocean color downstream — but for v1 the
  // fills stay solid and the relief shows only where graticule + ocean
  // are visible. That's the National-Geographic register; full
  // semi-transparent fills are a v2 polish pass.
  const isRelief = data.aesthetic === "atlas-relief";
  warnIf(
    isRelief && isOrthographic,
    "AtlasPlate",
    "aesthetic: 'atlas-relief' is not supported with orthographic " +
      "projection in v1 (no per-frame globe-rotation rasterizer yet). " +
      "Falls back to plain atlas — the orthographic globe renders with " +
      "no relief. Pick equalEarth / naturalEarth / equirectangular if " +
      "relief is required.",
  );
  // framePadding mismatch — the warp script bakes in DEFAULT_FRAME_PADDING
  // when it fits the relief raster to the viewport. If a script overrides
  // `data.framePadding`, the country layer's world fit will diverge from
  // the relief's world fit by a few percent, producing visible coastline
  // misalignment at world / continental scale. Warn loudly so authors
  // don't ship a silently-broken still.
  warnIf(
    isRelief &&
      data.framePadding !== undefined &&
      data.framePadding !== DEFAULT_FRAME_PADDING,
    "AtlasPlate",
    `aesthetic: 'atlas-relief' requires \`framePadding: ${DEFAULT_FRAME_PADDING}\` ` +
      `(the value the warp script bakes in). Override at ` +
      `${data.framePadding} will misalign the relief raster against the ` +
      `country paths. Either drop the override OR rerun ` +
      `scripts/prepare-shaded-relief.mjs with --framePadding=${data.framePadding}.`,
  );
  const vintage = mapConfig.vintageStyleColors;

  const landFill = isVintage
    ? vintage.land
    : (dark ? palette.ink : palette.bone);
  const borderColor = isVintage
    ? vintage.landBorder
    : (dark ? palette.bone : palette.ink);
  // Editorial-atlas ocean is deeper than the Mapbox `styleColors.ocean`
  // token so the land/water boundary reads cleanly on a bone basemap —
  // see `editorialOcean` JSDoc and May 14 2026 atlas audit. Vintage uses
  // its own tea-stained tone; not overridden.
  const oceanColor = isVintage
    ? vintage.ocean
    : (dark ? mapConfig.editorialOcean.dark : mapConfig.editorialOcean.light);

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

  // ── Country-label placement (collision-aware) ────────────────────────────
  // Run the greedy 8-position placer (`placeLabels`, shared with
  // MapAnnotations) over the current phase's country labels. Replaces the
  // v1 "render at centroid, ignore collisions" pass that caused the
  // NLD/BEL/LUX/DEU pileup in catalog renders.
  //
  // Skip handling — auto-decision per country:
  //   • `labelStrategy: "skip"` → omitted entirely from the placer input.
  //   • `labelStrategy: "auto"` + tiny screen-space polygon → skipped.
  //   • Anything else → included; placer decides inside-vs-leader.
  const countryLabelPlacements = useMemo(() => {
    if (labelledCountries.length === 0) return [];

    // C1: use the SETTLED camera pose for this phase (not the animated per-
    // frame camera). Previously depended on `camera.scale` and
    // `projectAnnotation` — both change every frame during transitions,
    // triggering per-frame d3-geo .area() on large country geometries +
    // O(N²) collision detection. Placements are stable per phase anyway;
    // only the display position (applied in the render) needs per-frame coords.
    const settledPose = phasePoses[safeIdx] ?? { scale: 1, translate: [0, 0] as [number, number] };
    const settledScale = settledPose.scale;

    // Per-label bbox via measureText, accounting for the country-label
    // typography (fonts.display, fontSizes.label, uppercase + tracking).
    // Recomputed per phase (label texts vary between phases).
    const items: Array<{
      iso3: string;
      label: string;
      lonLat: [number, number];
      strategy: "auto" | "inside" | "leader";
      bbox: { w: number; h: number };
      polygonAreaPx: number;
    }> = [];

    for (const c of labelledCountries) {
      const strategy = c.labelStrategy ?? "auto";
      if (strategy === "skip") continue;
      const centroid = getCountryCentroid(c.iso3);
      if (!centroid) continue;

      // Use basePathGen for polygon area — stable, not per-frame.
      // For non-orthographic, activePathGen === basePathGen anyway.
      // For orthographic, base-projection area is an acceptable approximation
      // for the placement decision (we're deciding if a label can fit, not
      // rendering an exact outline).
      const country = getCountryByAlpha3(c.iso3);
      if (!country) continue;
      const rawAreaPx = basePathGen.area(country.feature as any); // no-as-any-ok: d3-geo interop — GeoJSON Feature nominal type
      const screenAreaPx = rawAreaPx * settledScale * settledScale;

      // Auto-skip threshold: polygons smaller than ~120 px² can't host a
      // label at all (Andorra-, Vatican-, Monaco-scale on world view).
      // Authors with `labelStrategy: "inside"` / `"leader"` opt past this.
      if (strategy === "auto" && screenAreaPx < 120) continue;

      // Estimate label bbox in pixels.
      let bbox: { w: number; h: number };
      try {
        const m = measureText({
          text: c.label!.toUpperCase(),
          fontFamily: fonts.display,
          fontSize: fontSizes.label,
          fontWeight: fontWeights.medium,
          letterSpacing: `${letterSpacing.label}px`,
        });
        bbox = { w: Math.min(280, m.width), h: m.height };
      } catch {
        // Test env without canvas — heuristic fallback.
        bbox = { w: Math.min(280, c.label!.length * fontSizes.label * 0.55), h: fontSizes.label * 1.2 };
      }

      items.push({
        iso3: c.iso3,
        label: c.label!,
        lonLat: centroid,
        strategy,
        bbox,
        polygonAreaPx: screenAreaPx,
      });
    }

    // Build the placer input. Higher priority on smaller polygons so
    // tiny-country labels claim their preferred candidate first (they
    // have fewer escape routes than huge USA/RUS-class labels).
    const placeInput: PlaceableAnnotation[] = items.map((item) => ({
      ann: {
        label: item.label,
        at: item.lonLat,
        hierarchy: "tertiary" as const,
        // Higher priority for smaller features (inverse-area).
        priority: 10_000 / Math.max(1, item.polygonAreaPx),
      },
      defaultDy: 0,
      bboxOverride: item.bbox,
    }));

    // C1: project through the SETTLED pose (not the animated camera) for
    // consistent placements across the full transition window.
    const projectSettled = (lonLat: [number, number]) => {
      const p = baseProjection(lonLat);
      if (!p) return null;
      const [x0, y0] = p;
      return {
        x: x0 * settledScale + settledPose.translate[0],
        y: y0 * settledScale + settledPose.translate[1],
      };
    };
    const placements = placeLabels(placeInput, projectSettled);

    // Auto-promotion to leader: when label bbox is wider than the polygon
    // is in screen-space, push it outside the polygon even if the placer
    // didn't displace it. Approximates polygon-width by sqrt(area).
    return items.map((item, i) => {
      const placement = placements[i];
      const polyHalfDim = Math.sqrt(item.polygonAreaPx) * 0.5;
      const labelWidth = item.bbox.w;
      const tooBigForInside =
        item.strategy === "auto" && labelWidth > polyHalfDim * 1.8;
      const forceLeader = item.strategy === "leader" || tooBigForInside;
      return {
        iso3: item.iso3,
        label: item.label,
        lonLat: item.lonLat,
        placement,
        forceLeader,
      };
    });
  }, [
    labelledCountries,
    safeIdx,
    phasePoses,
    baseProjection,
    basePathGen,
  ]);

  // ── Sea-label paths (projected to SCREEN space per frame) ────────────────
  // Each sea label projects its arc through `projectAnnotation` (which
  // accounts for the camera transform) to get screen-space coordinates,
  // then renders the arc as an SVG path OUTSIDE the camera-transformed
  // group. This keeps font-size constant under zoom — only the arc's
  // position tracks the camera. Orthographic densifies first so the
  // sphere-clip math finds visible-hemisphere terminator crossings on
  // long arcs (same pattern as disputedPaths).
  const seaLabelPaths = useMemo(() => {
    if (!data.seaLabels || data.seaLabels.length === 0) return [];
    const resolved = resolveSeaLabels(data.seaLabels);
    const out: {
      tag: string;
      /** N1: tag sanitized for SVG id — spaces/dots/slashes → hyphens. */
      sanitizedTag: string;
      label: string;
      hierarchy: SeaLabel["hierarchy"];
      d: string;
    }[] = [];
    for (const s of resolved) {
      const coords = isOrthographic ? densifyPolyline(s.arc, 1) : s.arc;

      // B1: split arc at null projections (orthographic terminator crossings,
      // or any projection returning null for out-of-bounds coords). The old
      // single-run approach emitted an "L" after each null, drawing a chord
      // straight across the back of the globe. Instead collect contiguous
      // visible runs and join them as separate M..L sub-paths — the gap
      // between invisible points renders as no stroke, not as a chord.
      const segments: [number, number][][] = [];
      let run: [number, number][] = [];
      for (const lonLat of coords) {
        const p = projectAnnotation(lonLat);
        if (p) {
          run.push(p);
        } else {
          if (run.length >= 2) segments.push(run);
          run = [];
        }
      }
      if (run.length >= 2) segments.push(run);
      if (segments.length === 0) continue;

      const d = segments
        .map((pts) =>
          pts
            .map(
              (pt, i) =>
                (i === 0 ? "M" : "L") +
                pt[0].toFixed(1) +
                " " +
                pt[1].toFixed(1),
            )
            .join(" "),
        )
        .join(" ");

      // N1: sanitize tag → valid XML Name token (SVG id must not contain
      // spaces, dots, slashes, etc. — replace with hyphens).
      const sanitizedTag = s.tag.replace(/[^a-zA-Z0-9-]/g, "-");
      out.push({ tag: s.tag, sanitizedTag, label: s.label, hierarchy: s.hierarchy, d });
    }
    return out;
  }, [data.seaLabels, projectAnnotation, isOrthographic]);

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
    // C2: project through the SETTLED camera pose (not the animated per-frame
    // pose). Previously depended on `projectAnnotation`, which changes every
    // frame during transitions → mid-transition corner flips were jarring.
    // Settled pose gives the right answer for where the view is heading and
    // is stable for the full transition window.
    const settledPose = phasePoses[safeIdx] ?? { scale: 1, translate: [0, 0] as [number, number] };
    const projectSettled = (lonLat: [number, number]): [number, number] | null => {
      const p = baseProjection(lonLat);
      if (!p) return null;
      const [x0, y0] = p;
      return [
        x0 * settledPose.scale + settledPose.translate[0],
        y0 * settledPose.scale + settledPose.translate[1],
      ];
    };
    const points = projectPointsForPlacement(highlighted, projectSettled);
    return resolveCartoucheCorner(points);
  }, [data.mapTitle, currentWindow.phase.countries, safeIdx, phasePoses, baseProjection]);

  // ── Extent box (showExtentBox) ──────────────────────────────────────────
  // When the current phase has `showExtentBox: true`, compute the bounding
  // box of the NEXT phase's focus countries in the CURRENT phase's settled
  // camera coordinates. Rendered as a dashed rust rectangle to signal
  // "here is where we zoom next." Standard FT / NatGeo editorial device.
  const extentBoxRect = useMemo((): { x: number; y: number; w: number; h: number } | null => {
    const currentPhase = data.phases[safeIdx];
    if (!currentPhase?.showExtentBox) return null;
    const nextPhase = data.phases[safeIdx + 1];
    const nextIso3 = nextPhase?.focus?.iso3;
    if (!nextIso3 || nextIso3.length === 0) return null;

    // Collect all features matching next phase's iso3 list.
    const allCountries = getAllCountries();
    const nextFeatures = allCountries.filter(c => nextIso3.includes(c.alpha3 ?? ""));
    if (nextFeatures.length === 0) return null;

    // Project using the SETTLED pose of the current phase (not animated).
    const settledPose = phasePoses[safeIdx] ?? { scale: 1, translate: [0, 0] as [number, number] };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const country of nextFeatures) {
      const bounds = basePathGen.bounds(country.feature as any); // no-as-any-ok: d3-geo interop — GeoJSON Feature nominal type
      if (!isFinite(bounds[0][0])) continue;
      const bx0 = bounds[0][0] * settledPose.scale + settledPose.translate[0];
      const by0 = bounds[0][1] * settledPose.scale + settledPose.translate[1];
      const bx1 = bounds[1][0] * settledPose.scale + settledPose.translate[0];
      const by1 = bounds[1][1] * settledPose.scale + settledPose.translate[1];
      minX = Math.min(minX, bx0, bx1);
      minY = Math.min(minY, by0, by1);
      maxX = Math.max(maxX, bx0, bx1);
      maxY = Math.max(maxY, by0, by1);
    }
    if (!isFinite(minX)) return null;

    const pad = 12;
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }, [data.phases, safeIdx, phasePoses, basePathGen]);

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
            {/* Shaded-relief underlay — `atlas-relief` aesthetic only.
                Sits inside the camera transform so it pans/zooms with
                the country layer. Skipped on orthographic (warn fired
                above) and on missing asset (component handles 404
                internally). Renders BELOW everything else inside the
                transform group. */}
            {isRelief && data.projection && !isOrthographic && (
              <ReliefUnderlay
                projection={data.projection as ProjectionName}
                width={layout.width}
                height={layout.height}
                dark={dark}
              />
            )}
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
                memoized `countryPaths` unchanged. Fill resolves through
                `resolveCountryFill` which handles the phase-boundary
                color crossfade (sRGB lerp from prev-phase fill → current
                over the camera transition window). */}
            {rotatedCountryPaths.map((c, i) => (
              <path
                key={c.alpha3 ?? `c${i}`}
                d={c.d}
                fill={resolveCountryFill(c.alpha3)}
                // atlas-relief register — country fills go semi-transparent
                // so the shaded-relief raster (rendered BELOW in
                // ReliefUnderlay, inside the same camera transform) peeks
                // through. 0.78 keeps the data color clearly identifiable
                // (amber India, rust China) while letting Himalayan
                // terrain texture read through the fill. Non-focus
                // countries inherit landFill = palette.bone, which at
                // 0.78 over the relief produces a warm paper-on-relief
                // composite — the canonical NatGeo register.
                fillOpacity={isRelief ? 0.78 : undefined}
                stroke={borderColor}
                strokeWidth={borderStroke}
                strokeLinejoin="round"
              />
            ))}

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

            {/* Extent box — dashed rust rect showing next phase's focus bbox.
                Fades in at the start of the current phase. The rect is inside
                the camera-transform group so it pans/zooms with the countries.
                Rect coords were computed in settled-pose space (no animation),
                so they align with countries at the fully-settled view. */}
            {extentBoxRect && (
              <rect
                x={extentBoxRect.x}
                y={extentBoxRect.y}
                width={extentBoxRect.w}
                height={extentBoxRect.h}
                fill="none"
                stroke={palette.rust}
                strokeWidth={2}
                strokeDasharray="8 5"
                strokeDashoffset={(frame * 0.4) % 13}
                opacity={0.75 * fadeIn(frame, currentWindow.startFrame, sec(0.6))}
                rx={3}
              />
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

          {/* Sea labels — projected arcs, text rendered along path. Layered
              UNDER country labels and annotations so editorial markup wins
              when they collide. Below the camera-transform group; font-size
              stays constant under zoom. */}
          {seaLabelPaths.length > 0 && (
            <g aria-hidden="true">
              {seaLabelPaths.map((s, i) => (
                <SeaLabelText
                  key={`sea-${i}-${s.sanitizedTag}`}
                  pathId={`sea-arc-${reactId}-${s.sanitizedTag}`}
                  d={s.d}
                  label={s.label}
                  hierarchy={s.hierarchy}
                  dark={dark}
                  isVintage={isVintage}
                />
              ))}
            </g>
          )}

          {/* Per-phase country labels — collision-aware via `placeLabels`.
              The parent memo (`countryLabelPlacements`) handles auto-skip
              (tiny countries), leader-out (small ones), and inside (the
              rest). When the placer displaced a label, a thin leader line
              connects the centroid anchor to the displaced text. */}
          {countryLabelPlacements.map(({ iso3, label, lonLat, placement, forceLeader }) => {
            const anchor = projectAnnotation(lonLat);
            if (!anchor) return null;
            const opacity = Math.min(
              fadeIn(frame, currentWindow.startFrame + sec(0.4), sec(0.4)),
              fadeOut(frame, currentWindow.endFrame, sec(0.3)),
            );
            if (opacity <= 0) return null;

            const useLeader = placement.displaced || forceLeader;
            // When auto-promoting to leader (forceLeader) but the placer
            // chose dx=dy=0, push outward (N by default) so the label
            // actually clears the polygon.
            const dx = useLeader && placement.dx === 0 && placement.dy === 0
              ? 0
              : placement.dx;
            const dy = useLeader && placement.dx === 0 && placement.dy === 0
              ? -Math.max(18, fontSizes.label + 8)
              : placement.dy;

            return (
              <CountryLabel
                key={`lbl-${iso3}`}
                label={label}
                anchorX={anchor[0]}
                anchorY={anchor[1]}
                dx={dx}
                dy={dy}
                showLeader={useLeader}
                align={placement.align}
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

        {/* Locator inset — Equal Earth world map with a rust extent box
            highlighting the focused region. Opt-in via `data.inset`. */}
        {data.inset?.show && (
          <AtlasInsetLocator
            corner={data.inset.corner ?? "top-right"}
            size={data.inset.size}
            focusIso3={currentWindow.phase.focus?.iso3}
            dark={dark}
          />
        )}
      </AbsoluteFill>
    </Background>
  );
};

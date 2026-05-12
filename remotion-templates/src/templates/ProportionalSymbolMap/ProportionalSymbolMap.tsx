/**
 * ProportionalSymbolMap — area-proportional circles on a flat atlas base.
 *
 * The Mercator-fix for count data. Each country gets a circle anchored at
 * its centroid, sized by sqrt(value/max) so AREA encodes value (not
 * radius). The legend in the corner labels three reference circles so the
 * encoding is readable.
 *
 * Architecturally a sibling of AtlasPlate — same base-map rendering
 * (countries as SVG paths, graticule, camera transform, brand chrome).
 * The difference is the overlay: countries stay neutral (land color), and
 * symbols ride on top, sized per phase.
 *
 * Why a separate template vs. a mode on ChoroplethMap / AtlasPlate: the
 * editorial register, schema (values, not fills), and legend rendering
 * are all distinct enough that conflating them would bloat the host
 * template's surface.
 *
 * Dossier: references/template-research/proportional-symbol-map.md
 */

import React, { useMemo, useCallback } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { geoGraticule } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
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
  shadows,
} from "../../design/theme";
import {
  resolveProjection,
  fitProjectionToFeatures,
  fitProjectionToWorld,
  makePathGenerator,
  getAllCountries,
  getCountryByAlpha3,
  getCountryCentroid,
  type CountryFeature,
} from "../../utils/atlasProjection";
import {
  computeRadius,
  generateLegendTicks,
  formatLegendValue,
  sortSymbolsLargestFirst,
} from "../../utils/proportionalSymbol";
import { CLAMP_CUBIC_INOUT, exitFade, fadeIn, fadeOut } from "../../utils/animation";
import {
  easeCameraT,
  applyDwell,
  viaGlobePoseInterpolate,
} from "../../utils/mapUtils";
import { warnIf } from "../../utils/dataWarnings";
import { resolveColor as resolveAnnotationColor } from "../../components/MapAnnotations";
import type { ProportionalSymbolMapData, ProportionalPhase } from "./types";
import type { MapAnnotation } from "../../components/MapAnnotations.types";

// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_FRAME_PADDING = 80;
const DEFAULT_MAX_RADIUS_PX = 50;
const CAMERA_TRANSITION_FRAMES = sec(1.2);
const BORDER_STROKE_BASE = 0.5;
const SYMBOL_STROKE_WIDTH = 1.5;
const SYMBOL_FILL_ALPHA = 0.72;

/** Frame viewport — constant; hoisted to avoid per-render allocation. */
const VIEWPORT = { width: layout.width, height: layout.height } as const;

/** Content-derived annotation key (vs. array index — prevents stale-reuse bugs). */
const annotationKey = (ann: MapAnnotation): string =>
  `ann-${ann.at[0].toFixed(3)},${ann.at[1].toFixed(3)}-${ann.label}`;

// ── Phase windows ─────────────────────────────────────────────────────────

interface PhaseWindow {
  phase: ProportionalPhase;
  index: number;
  startFrame: number;
  endFrame: number;
}

/**
 * Fallback phase window — used when `data.phases` is somehow empty (the
 * schema enforces .min(1); fallback keeps all hooks executable until the
 * early-return at the bottom of the component runs).
 */
const FALLBACK_PHASE_WINDOW: PhaseWindow = {
  phase: { title: "", durationSec: 0, symbols: [] },
  index: 0,
  startFrame: 0,
  endFrame: 0,
};

const computePhaseWindows = (phases: ProportionalPhase[]): PhaseWindow[] => {
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
//
// Same pattern as AtlasPlate: compute a base (world-fit) projection, derive
// per-phase poses as outer-transform parameters (scale, translate), then
// interpolate via SVG <g transform>. Cheap browser GPU compositing.

interface CameraPose {
  scale: number;
  translate: [number, number];
}

const computePhasePose = (
  phase: ProportionalPhase,
  projectionName: ProportionalSymbolMapData["projection"],
  viewport: { width: number; height: number },
  framePadding: number,
  baseScale: number,
  baseTranslate: [number, number],
): CameraPose => {
  if (!phase.focus) return { scale: 1, translate: [0, 0] };

  // Same orthographic limitation as AtlasPlate — the outer-<g> transform
  // assumes linear scaling, which the globe projection doesn't satisfy.
  // See atlas-plate.md § "Animation transitions on orthographic projection".
  if (projectionName === "orthographic") {
    warnIf(
      true,
      "ProportionalSymbolMap",
      `Phase "${phase.title}" sets focus on orthographic projection — ` +
      `not supported in v1 (globe rotation isn't animated). ` +
      `Holding world-fit pose. Switch projection or drop focus to silence.`,
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
    if (features.length === 0) return { scale: 1, translate: [0, 0] };
    const fc =
      features.length === 1
        ? features[0]
        : { type: "FeatureCollection" as const, features };
    fitProjectionToFeatures(proj, fc as any, viewport, framePadding);
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
  const s = targetScale / baseScale;
  return {
    scale: s,
    translate: [
      targetTranslate[0] - baseTranslate[0] * s,
      targetTranslate[1] - baseTranslate[1] * s,
    ],
  };
};

const interpolatePose = (a: CameraPose, b: CameraPose, t: number): CameraPose => ({
  scale: a.scale + (b.scale - a.scale) * t,
  translate: [
    a.translate[0] + (b.translate[0] - a.translate[0]) * t,
    a.translate[1] + (b.translate[1] - a.translate[1]) * t,
  ],
});

// ── Color helper: add alpha to a hex color ────────────────────────────────

/**
 * Append a hex alpha byte to a #RRGGBB color. Used so symbol fills get
 * the SYMBOL_FILL_ALPHA blend without inline rgba() math everywhere.
 */
const withAlpha = (hex: string, alpha: number): string => {
  const clamped = Math.max(0, Math.min(1, alpha));
  const byte = Math.round(clamped * 255).toString(16).padStart(2, "0");
  // Only handle the #RRGGBB form — palette tokens are always #RRGGBB.
  if (hex.length === 7 && hex.startsWith("#")) return `${hex}${byte}`;
  return hex;
};

// ── Graticule paths ───────────────────────────────────────────────────────

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

export const ProportionalSymbolMap: React.FC<{ data: ProportionalSymbolMapData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation({
    noDrift: true,
    ...direction.driftOptions,
  });

  const dark = data.backgroundVariant === "dark";
  const framePadding = data.framePadding ?? DEFAULT_FRAME_PADDING;
  const maxRadiusPx = data.maxRadiusPx ?? DEFAULT_MAX_RADIUS_PX;
  const scaleType = data.scaleType ?? "sqrt";
  const defaultSymbolColor = data.symbolColor ?? palette.rust;

  // Base projection + scalars in one memo so the getters aren't re-called
  // every render. Identity stable across reasonable prop changes.
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

  // Country paths
  const countryPaths = useMemo(() => {
    return getAllCountries().map((c: CountryFeature) => ({
      alpha3: c.alpha3,
      d: basePathGen(c.feature) ?? "",
    }));
  }, [basePathGen]);

  // Graticule
  const graticulePaths = useMemo(() => {
    if (!data.graticule) return null;
    return buildGraticulePaths(
      basePathGen,
      data.graticule.spacing ?? 10,
      data.graticule.emphasize30 ?? true,
    );
  }, [data.graticule, basePathGen]);

  // Phase windows + camera. Defensive fallback for empty phases — see
  // AtlasPlate.tsx for the same pattern (B4 audit fix).
  const windows = useMemo(() => computePhaseWindows(data.phases), [data.phases]);
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

    const rawT = interpolate(
      frame,
      [currentWindow.startFrame, currentWindow.startFrame + CAMERA_TRANSITION_FRAMES],
      [0, 1],
      CLAMP_CUBIC_INOUT,
    );

    const dwellBefore = currentWindow.phase.cameraDwell?.before ?? 0;
    const dwellAfter = currentWindow.phase.cameraDwell?.after ?? 0;
    const dwelled = dwellBefore + dwellAfter > 0
      ? applyDwell(rawT, dwellBefore, dwellAfter)
      : rawT;
    const transition = currentWindow.phase.cameraTransition ?? "linear";
    const easedT = easeCameraT(dwelled, transition);

    return transition === "via-globe"
      ? viaGlobePoseInterpolate(prev, next, easedT)
      : interpolatePose(prev, next, easedT);
  }, [
    safeIdx,
    phasePoses,
    frame,
    currentWindow.startFrame,
    currentWindow.phase.cameraTransition,
    currentWindow.phase.cameraDwell?.before,
    currentWindow.phase.cameraDwell?.after,
  ]);

  // Per-phase max value — drives the radius normalization
  const phaseMaxValue = useMemo(() => {
    if (currentWindow.phase.symbols.length === 0) return 1;
    let max = 0;
    for (const s of currentWindow.phase.symbols) {
      if (s.value > max) max = s.value;
    }
    return max || 1;
  }, [currentWindow.phase.symbols]);

  // Sort symbols largest-first so small circles render on top
  const sortedSymbols = useMemo(
    () => sortSymbolsLargestFirst(currentWindow.phase.symbols),
    [currentWindow.phase.symbols],
  );

  // Per-frame entrance opacity for the symbols in the current phase
  const symbolOpacity = useMemo(() => {
    const enter = fadeIn(frame, currentWindow.startFrame + sec(0.4), sec(0.6));
    const exit = fadeOut(frame, currentWindow.endFrame, sec(0.4));
    return Math.min(enter, exit);
  }, [frame, currentWindow.startFrame, currentWindow.endFrame]);

  // Theme tokens
  const landFill = dark ? palette.ink : palette.bone;
  const borderColor = dark ? palette.bone : palette.ink;
  const oceanColor = dark ? mapConfig.darkStyleColors.ocean : mapConfig.styleColors.ocean;
  const borderStroke = BORDER_STROKE_BASE / Math.max(1, Math.sqrt(camera.scale));

  // Project a lon/lat into screen space with the current camera applied.
  // Used for symbol positions, annotations, and country labels — all want
  // to follow the camera, but as <text>/<circle> at constant pixel size.
  // useCallback gives a stable identity per (baseProjection, camera) tuple,
  // which pairs well with future React.memo on the sub-components.
  const projectScreen = useCallback(
    (lonLat: [number, number]): [number, number] | null => {
      const projected = baseProjection(lonLat);
      if (!projected) return null;
      return [
        projected[0] * camera.scale + camera.translate[0],
        projected[1] * camera.scale + camera.translate[1],
      ];
    },
    [baseProjection, camera],
  );

  const transformStr = `translate(${camera.translate[0]} ${camera.translate[1]}) scale(${camera.scale})`;

  // Legend math (computed against the phase's max value)
  const legendTicks = useMemo(() => generateLegendTicks(phaseMaxValue), [phaseMaxValue]);

  // B4 defensive guard — see AtlasPlate for rationale.
  warnIf(
    windows.length === 0,
    "ProportionalSymbolMap",
    "phases array is empty — rendering nothing. Schema should have caught this upstream.",
  );
  if (windows.length === 0) return null;

  // Template-fit heuristic: ProportionalSymbolMap circles are at TRUE
  // country centroids (no decollision). In dense regions (Europe at 20+
  // circles) they overlap into illegibility. CartogramMap's d3-force
  // decollision is the right form there.
  // See MAP_TEMPLATE_SELECTOR.md.
  const maxSymbolsPerPhase = windows.reduce(
    (max, w) => Math.max(max, w.phase.symbols.length),
    0,
  );
  warnIf(
    maxSymbolsPerPhase >= 20,
    "ProportionalSymbolMap",
    `Up to ${maxSymbolsPerPhase} symbols per phase — at this density circles ` +
    `start overlapping at country-centroid positions. Consider CartogramMap ` +
    `(Dorling decollision) if the symbols cluster in a dense region. See ` +
    `MAP_TEMPLATE_SELECTOR.md.`,
  );

  return (
    <Background
      variant={dark ? "dark" : "light"}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip
          metadata={`${data.episode || ""} · atlas`}
          mode={dark ? "dark" : "light"}
        />
        <FooterStrip
          scale={data.source ? `Source: ${data.source}` : undefined}
          mode={dark ? "dark" : "light"}
        />

        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          {/* Ocean background */}
          <rect width={layout.width} height={layout.height} fill={oceanColor} />

          {/* Base map — countries + graticule under camera transform */}
          <g transform={transformStr}>
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
            {countryPaths.map((c, i) => (
              <path
                key={c.alpha3 ?? `c${i}`}
                d={c.d}
                fill={landFill}
                stroke={borderColor}
                strokeWidth={borderStroke}
                strokeLinejoin="round"
              />
            ))}
          </g>

          {/* Symbols — rendered OUTSIDE the camera transform so they stay
              at constant pixel radius even when the camera zooms. Positions
              are projected per-frame via projectScreen() so they track. */}
          <g opacity={symbolOpacity}>
            {sortedSymbols.map((s) => {
              // Centroid lookup is now O(1) hash hit (cached in
              // atlasProjection.ts at first load). Previously this ran
              // geoCentroid per symbol per frame — a real cost at 30fps.
              const centroid = getCountryCentroid(s.iso3);
              if (!centroid) return null;
              const screen = projectScreen(centroid);
              if (!screen) return null;
              const radius = computeRadius(s.value, phaseMaxValue, maxRadiusPx, scaleType);
              if (radius <= 0) return null;
              const fillColor = s.color ?? defaultSymbolColor;
              return (
                <g key={`sym-${s.iso3}`}>
                  <circle
                    cx={screen[0]}
                    cy={screen[1]}
                    r={radius}
                    fill={withAlpha(fillColor, SYMBOL_FILL_ALPHA)}
                    stroke={fillColor}
                    strokeWidth={SYMBOL_STROKE_WIDTH}
                  />
                  {s.label && (
                    <text
                      x={screen[0]}
                      y={screen[1] - radius - 6}
                      dominantBaseline="ideographic"
                      textAnchor="middle"
                      style={{
                        fontFamily: fonts.display,
                        fontSize: fontSizes.label,
                        fontWeight: fontWeights.medium,
                        letterSpacing: `${letterSpacing.label}px`,
                        textTransform: "uppercase",
                        fill: dark ? palette.bone : palette.ink,
                      }}
                    >
                      {s.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Annotations — outside camera transform; positions projected
              per-frame so they track the camera but stay at fixed font size.
              Opacity + screen are computed parent-side so SymbolAnnotation
              (React.memo) sees primitive props and can skip re-render. */}
          {data.annotations?.map((ann) => {
            const screen = projectScreen(ann.at);
            if (!screen) return null;
            const { startFrame, endFrame } = resolveAnnotationFrames(ann, durationInFrames, windows);
            const opacity = Math.min(
              fadeIn(frame, startFrame, sec(0.5)),
              fadeOut(frame, endFrame, sec(0.35)),
            );
            if (opacity <= 0) return null;
            return (
              <SymbolAnnotation
                key={annotationKey(ann)}
                annotation={ann}
                screenX={screen[0]}
                screenY={screen[1]}
                opacity={opacity}
                dark={dark}
              />
            );
          })}

          {/* Legend — bottom-right corner, three reference circles labeled. */}
          <ProportionalLegend
            ticks={legendTicks}
            maxValue={phaseMaxValue}
            maxRadiusPx={maxRadiusPx}
            scaleType={scaleType}
            unit={data.unit}
            label={data.valueLabel}
            color={defaultSymbolColor}
            dark={dark}
            opacity={symbolOpacity}
          />
        </svg>

        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={dark ? "dark" : "light"}
          safeAreaTier="generous"
        />

        {/* Phase title overlay — bottom-left, mirrors AtlasPlate */}
        {currentWindow.phase.title && (
          <div
            style={{
              position: "absolute",
              bottom: layout.safeAreaTier.generous.bottom,
              left: layout.safeAreaTier.generous.left,
              maxWidth: 720,
              opacity: Math.min(
                fadeIn(frame, currentWindow.startFrame + sec(0.6), sec(0.5)),
                exitFade(frame, durationInFrames, 15),
              ),
            }}
          >
            <div
              style={{
                fontFamily: fonts.display,
                fontSize: fontSizes.h2,
                fontWeight: fontWeights.semibold,
                letterSpacing: `${letterSpacing.h2}px`,
                color: dark ? palette.bone : palette.ink,
                textShadow: dark ? shadows.textLift : shadows.textLiftLight,
              }}
            >
              {currentWindow.phase.title}
            </div>
            {currentWindow.phase.subtitle && (
              <div
                style={{
                  marginTop: 8,
                  fontFamily: fonts.metadata,
                  fontSize: fontSizes.label,
                  letterSpacing: `${letterSpacing.label}px`,
                  textTransform: "uppercase",
                  color: palette.taupe,
                }}
              >
                {currentWindow.phase.subtitle}
              </div>
            )}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};

// ── Sub-component: legend ─────────────────────────────────────────────────

interface ProportionalLegendProps {
  ticks: { small: number; medium: number; large: number };
  maxValue: number;
  maxRadiusPx: number;
  scaleType: "sqrt" | "linear";
  unit?: string;
  label?: string;
  color: string;
  dark: boolean;
  opacity: number;
}

const ProportionalLegend = React.memo<ProportionalLegendProps>(({
  ticks,
  maxValue,
  maxRadiusPx,
  scaleType,
  unit,
  label,
  color,
  dark,
  opacity,
}) => {
  const rSmall = computeRadius(ticks.small, maxValue, maxRadiusPx, scaleType);
  const rMedium = computeRadius(ticks.medium, maxValue, maxRadiusPx, scaleType);
  const rLarge = computeRadius(ticks.large, maxValue, maxRadiusPx, scaleType);

  // Layout: three reference circles side-by-side at the bottom-right corner.
  const padding = layout.safeAreaTier.generous.right;
  const baseY = layout.height - layout.safeAreaTier.generous.bottom;
  const gap = 30;
  // Compute each circle's center x — right-aligned at `layout.width - padding`.
  const xLarge = layout.width - padding - rLarge;
  const xMedium = xLarge - rLarge - gap - rMedium;
  const xSmall = xMedium - rMedium - gap - rSmall;
  // Vertically: bottoms of all circles aligned at baseY (so largest sticks up).
  const yLarge = baseY - rLarge;
  const yMedium = baseY - rMedium;
  const ySmall = baseY - rSmall;

  const labelColor = dark ? palette.bone : palette.ink;
  const captionColor = palette.taupe;

  // Heading caption — sits above the tallest circle.
  const captionY = yLarge - rLarge - 14;

  return (
    <g opacity={opacity}>
      {label && (
        <text
          x={layout.width - padding}
          y={captionY}
          textAnchor="end"
          dominantBaseline="ideographic"
          style={{
            fontFamily: fonts.metadata,
            fontSize: fontSizes.meta,
            fontWeight: fontWeights.regular,
            letterSpacing: `${letterSpacing.meta}px`,
            textTransform: "uppercase",
            fill: captionColor,
          }}
        >
          {label}
        </text>
      )}

      {/* Reference circles + value labels */}
      {[
        { x: xSmall, y: ySmall, r: rSmall, v: ticks.small },
        { x: xMedium, y: yMedium, r: rMedium, v: ticks.medium },
        { x: xLarge, y: yLarge, r: rLarge, v: ticks.large },
      ]
        .filter((c) => c.r > 0)
        .map((c, i) => (
          <g key={`leg-${i}`}>
            <circle
              cx={c.x}
              cy={c.y}
              r={c.r}
              fill={withAlpha(color, SYMBOL_FILL_ALPHA)}
              stroke={color}
              strokeWidth={SYMBOL_STROKE_WIDTH}
            />
            <text
              x={c.x}
              y={baseY + 18}
              textAnchor="middle"
              dominantBaseline="hanging"
              style={{
                fontFamily: fonts.metadata,
                fontSize: fontSizes.meta,
                fontWeight: fontWeights.regular,
                letterSpacing: `${letterSpacing.meta}px`,
                fill: labelColor,
              }}
            >
              {formatLegendValue(c.v, unit)}
            </text>
          </g>
        ))}
    </g>
  );
});
ProportionalLegend.displayName = "ProportionalLegend";

// ── Annotation timing resolver (parent-side, lifted from sub-component) ──

/**
 * Mirror of the AtlasPlate `resolveAnnotationFrames` helper — duplicated
 * because the two templates evolved in parallel. If a third template
 * needs the same math, hoist to a shared helper (rule of three).
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

interface SymbolAnnotationProps {
  annotation: MapAnnotation;
  /** Parent-computed primitive props → React.memo shallow compare works. */
  screenX: number;
  screenY: number;
  opacity: number;
  dark: boolean;
}

const SymbolAnnotation = React.memo<SymbolAnnotationProps>(({
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
      <circle cx={x} cy={y} r={annotation.hierarchy === "tertiary" ? 2 : 3.5} fill={color} />
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
SymbolAnnotation.displayName = "SymbolAnnotation";

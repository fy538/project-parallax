/**
 * CartogramMap — Dorling-cartogram template.
 *
 * Country circles sized by data value, force-decollided so they don't
 * overlap. Optional faint coastline reference. Built for dense data sets
 * (15+ countries, EU/Asia-heavy) where ProportionalSymbolMap circles
 * would overlap into illegibility.
 *
 * Architecturally a third sibling of AtlasPlate + ProportionalSymbolMap.
 * Shares: projection, country lookup, centroid cache, fadeIn/fadeOut
 * timing, brand chrome. Adds: d3-force decollision + abstract render
 * register (no land paths by default).
 *
 * Per-phase recomputation: the decollision simulation runs ONCE per phase
 * (memoized on the phase data). 120 iterations of d3-force on ~30 circles
 * takes ~20-50ms, run inside a useMemo so it doesn't block frame rendering.
 *
 * Dossier: references/template-research/cartogram-map.md
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { MapTitleFrame } from "../../components/MapTitleFrame";
import { resolveCartoucheCorner } from "../../utils/mapTitlePlacement";
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
  fitProjectionToWorld,
  fitProjectionToFeatures,
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
import { runDorlingLayout } from "../../utils/dorling";
import { warnIf } from "../../utils/dataWarnings";
import { exitFade, fadeIn, fadeOut } from "../../utils/animation";
import type { FeatureCollection } from "geojson";
import type { CartogramMapData, CartogramPhase } from "./types";

// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_FRAME_PADDING = 80;
const DEFAULT_MAX_RADIUS_PX = 50;
const DEFAULT_XY_STRENGTH = 0.1;
const SYMBOL_STROKE_WIDTH = 1.5;
const SYMBOL_FILL_ALPHA = 0.78;
const VIEWPORT = { width: layout.width, height: layout.height } as const;

// ── Phase windows ─────────────────────────────────────────────────────────

interface PhaseWindow {
  phase: CartogramPhase;
  index: number;
  startFrame: number;
  endFrame: number;
}

const FALLBACK_PHASE_WINDOW: PhaseWindow = {
  phase: { title: "", durationSec: 0, data: [] },
  index: 0,
  startFrame: 0,
  endFrame: 0,
};

const computePhaseWindows = (phases: CartogramPhase[]): PhaseWindow[] => {
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

// ── Color helper ──────────────────────────────────────────────────────────

const withAlpha = (hex: string, alpha: number): string => {
  const byte = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, "0");
  if (hex.length === 7 && hex.startsWith("#")) return `${hex}${byte}`;
  return hex;
};

// ── Component ─────────────────────────────────────────────────────────────

export const CartogramMap: React.FC<{ data: CartogramMapData }> = ({ data }) => {
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
  const xyStrength = data.xyStrength ?? DEFAULT_XY_STRENGTH;
  const defaultSymbolColor = data.symbolColor ?? palette.rust;
  const showCoastlines = data.showCoastlines ?? true;
  const fitToData = data.fitToData ?? true;

  // ── Base projection (fit to data region or world) ────────────────────────
  // When fitToData=true (default): project only the data countries' bounding
  // box into the viewport. This is the correct behaviour for regional datasets
  // (EU-27, NATO, ASEAN) — the force-sim receives centroid targets that are
  // already spread across the full frame, so decollision spreads circles
  // naturally without fighting the xyStrength gravity pulling them back to
  // a tiny geographic cluster.
  //
  // When fitToData=false: classic world-scale fit (global datasets).
  const { baseProjection, basePathGen } = useMemo(() => {
    const p = resolveProjection(data.projection);
    if (fitToData) {
      // Collect ALL data country features across all phases so projection
      // is stable when phases transition (same fit extent throughout).
      const allIso3s = new Set(data.phases.flatMap((ph) => ph.data.map((d) => d.iso3)));
      const features = Array.from(allIso3s)
        .map((iso3) => getCountryByAlpha3(iso3))
        .filter((c): c is CountryFeature => c !== null)
        .map((c) => c.feature);
      if (features.length > 0) {
        fitProjectionToFeatures(
          p,
          { type: "FeatureCollection", features } as FeatureCollection,
          VIEWPORT,
          framePadding
        );
      } else {
        // Fallback: no recognisable countries — fit world so something renders.
        fitProjectionToWorld(p, VIEWPORT, framePadding);
      }
    } else {
      fitProjectionToWorld(p, VIEWPORT, framePadding);
    }
    return { baseProjection: p, basePathGen: makePathGenerator(p) };
  }, [data.projection, data.phases, fitToData, framePadding]);

  // ── Land paths (memoized, optional) ─────────────────────────────────────
  // Filtered to countries whose projected centroid falls within the viewport
  // + a 300px buffer. This prevents stray path segments from far-off countries
  // (e.g. Russia's east coast, South America) from bleeding through the frame
  // when the projection is region-fitted.
  const coastlinePaths = useMemo(() => {
    if (!showCoastlines) return [];
    const BUFFER = 300;
    return getAllCountries()
      .filter((c: CountryFeature) => {
        if (!c.alpha3) return true; // no code → can't centroid-test, keep
        const geo = getCountryCentroid(c.alpha3);
        if (!geo) return true;
        const screen = baseProjection(geo);
        if (!screen) return false;
        return (
          screen[0] >= -BUFFER &&
          screen[0] <= VIEWPORT.width + BUFFER &&
          screen[1] >= -BUFFER &&
          screen[1] <= VIEWPORT.height + BUFFER
        );
      })
      .map((c: CountryFeature) => ({
        alpha3: c.alpha3,
        d: basePathGen(c.feature) ?? "",
      }))
      .filter((c) => c.d !== "");
  }, [basePathGen, baseProjection, showCoastlines]);

  // ── Phase windows + decollided layouts ──────────────────────────────────
  const windows = useMemo(() => computePhaseWindows(data.phases), [data.phases]);
  const safeIdx = windows.length === 0
    ? 0
    : Math.min(getCurrentPhaseIndex(frame, windows), windows.length - 1);
  const currentWindow: PhaseWindow = windows[safeIdx] ?? FALLBACK_PHASE_WINDOW;

  /**
   * Decollided layout for the current phase. The d3-force simulation
   * runs synchronously inside useMemo — ~30 circles × 120 iterations ≈
   * 20-50ms once per phase change, not per frame. Result is deterministic
   * (force simulation has fixed initial conditions).
   */
  const dorlingLayout = useMemo(() => {
    if (currentWindow.phase.data.length === 0) return [];
    let maxValue = 0;
    for (const d of currentWindow.phase.data) {
      if (d.value > maxValue) maxValue = d.value;
    }
    if (maxValue <= 0) maxValue = 1;

    // Sort largest-first for stable render order (matches PSM convention).
    const sorted = sortSymbolsLargestFirst(currentWindow.phase.data);

    // Build force nodes: each node starts at its country's projected centroid.
    const inputs = sorted
      .map((d) => {
        const centroid = getCountryCentroid(d.iso3);
        if (!centroid) return null;
        const screen = baseProjection(centroid);
        if (!screen) return null;
        const radius = computeRadius(d.value, maxValue, maxRadiusPx, scaleType);
        if (radius <= 0) return null;
        return {
          id: d.iso3,
          targetX: screen[0],
          targetY: screen[1],
          radius,
          // carry through editorial fields
          color: d.color,
          label: d.label,
          value: d.value,
        };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);

    const layouts = runDorlingLayout(
      inputs.map(({ id, targetX, targetY, radius }) => ({ id, targetX, targetY, radius })),
      { width: layout.width, height: layout.height, padding: framePadding },
      120,
      xyStrength,
    );

    // Merge layouts back with editorial fields.
    return layouts.map((l, i) => ({
      ...l,
      color: inputs[i].color,
      label: inputs[i].label,
      value: inputs[i].value,
    }));
    // `framePadding` is transitively covered via `baseProjection` (which
    // memoizes on it), but we keep it in the deps anyway because it's
    // used DIRECTLY in the runDorlingLayout call below — exhaustive-deps
    // convention favors listing direct usages even when redundant.
  }, [currentWindow.phase.data, baseProjection, maxRadiusPx, scaleType, framePadding, xyStrength]);

  // ── Smart cartouche placement ─────────────────────────────────────────────
  // The Dorling layout already has each circle in screen space — use the
  // de-collided positions directly so the cartouche avoids the actual
  // rendered (not the geographic-centroid) location of every circle.
  const resolvedCartoucheCorner = useMemo(() => {
    if (data.mapTitle?.mode !== "cartouche") return undefined;
    if (data.mapTitle.placement !== "auto") return undefined;
    const points = dorlingLayout.map((n) => ({ x: n.x, y: n.y }));
    return resolveCartoucheCorner(points);
  }, [data.mapTitle, dorlingLayout]);

  /** Per-phase max for the legend. */
  const phaseMaxValue = useMemo(() => {
    if (currentWindow.phase.data.length === 0) return 1;
    let max = 0;
    for (const d of currentWindow.phase.data) {
      if (d.value > max) max = d.value;
    }
    return max || 1;
  }, [currentWindow.phase.data]);

  /** Symbol entrance/exit fade. */
  const symbolOpacity = useMemo(() => {
    const enter = fadeIn(frame, currentWindow.startFrame + sec(0.4), sec(0.6));
    const exit = fadeOut(frame, currentWindow.endFrame, sec(0.4));
    return Math.min(enter, exit);
  }, [frame, currentWindow.startFrame, currentWindow.endFrame]);

  const legendTicks = useMemo(() => generateLegendTicks(phaseMaxValue), [phaseMaxValue]);

  // Theme tokens — land/sea contrast that reads at video resolution.
  // Light: warm tan land (#D4CAB8) on slightly darker sea (#E4DDD3).
  // Dark: muted near-black land on very dark sea.
  const landFillColor = dark ? mapConfig.darkStyleColors.landBorder : mapConfig.styleColors.landBorder;
  const landStrokeColor = dark ? palette.bone : palette.umber;
  const oceanColor = dark ? mapConfig.darkStyleColors.ocean : mapConfig.styleColors.ocean;

  // Defensive null-render (B4 pattern).
  warnIf(
    windows.length === 0,
    "CartogramMap",
    "phases array is empty — rendering nothing. Schema should have caught this upstream.",
  );
  if (windows.length === 0) return null;

  // Template-fit heuristic: Dorling cartograms shine for 15+ dense-region
  // data points. With <10 points there's no overlap to decollide; the
  // sized circles + faint coastline could be ProportionalSymbolMap.
  // See MAP_TEMPLATE_SELECTOR.md.
  const totalData = windows.reduce((sum, w) => sum + w.phase.data.length, 0);
  warnIf(
    totalData > 0 && totalData < 10,
    "CartogramMap",
    `Only ${totalData} data points across all phases — Dorling decollision ` +
    `does no useful work below ~10 points. Consider ProportionalSymbolMap ` +
    `(sized circles at exact country centroids) instead. See MAP_TEMPLATE_SELECTOR.md.`,
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
          metadata={`${data.episode || ""} · cartogram`}
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
          {/* Ocean / paper background. */}
          <rect width={layout.width} height={layout.height} fill={oceanColor} />

          {/* Land reference layer (optional). Filled polygons give sea/land
              contrast so circles read against visible geography. Stroke draws
              country borders — thicker than a typical atlas to survive video
              compression. Filtered to the current region so far-off countries
              don't contribute stray path segments. */}
          {showCoastlines &&
            coastlinePaths.map((c, i) => (
              <path
                key={c.alpha3 ?? `coast-${i}`}
                d={c.d}
                fill={landFillColor}
                fillOpacity={dark ? 0.55 : 0.65}
                stroke={landStrokeColor}
                strokeOpacity={dark ? 0.28 : 0.40}
                strokeWidth={0.7}
                strokeLinejoin="round"
              />
            ))}

          {/* Decollided cartogram circles + labels — sorted largest-first
              so small circles render on TOP. Each circle is its own
              React.memo'd sub-component (CartogramCircle below) so once
              the dorlingLayout settles, only `symbolOpacity` changes per
              frame and that's at the parent <g>, not the children. The
              circles skip re-render during the held portion of each phase. */}
          <g opacity={symbolOpacity}>
            {dorlingLayout.map((node) => (
              <CartogramCircle
                key={`cart-${node.id}`}
                x={node.x}
                y={node.y}
                radius={node.radius}
                fillColor={node.color ?? defaultSymbolColor}
                label={node.label}
                dark={dark}
              />
            ))}
          </g>

          {/* Legend — reuses ProportionalSymbolMap convention. */}
          <CartogramLegend
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

        <MapTitleFrame
          title={data.title}
          subtitle={data.subtitle}
          mode={dark ? "dark" : "light"}
          config={data.mapTitle}
          footerCaption={data.source ? `Source: ${data.source}` : undefined}
          syncPoints={direction.syncPoints}
          resolvedCartoucheCorner={resolvedCartoucheCorner}
        />

        {/* Phase title overlay */}
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

// ── Sub-component: single decollided circle (React.memo'd) ───────────────

interface CartogramCircleProps {
  x: number;
  y: number;
  radius: number;
  fillColor: string;
  label?: string;
  dark: boolean;
}

/**
 * One Dorling circle + its label. Wrapped in React.memo so once the
 * dorlingLayout stabilizes for a phase, the per-frame `symbolOpacity`
 * change happens at the parent <g opacity={...}> level and these
 * children skip re-render entirely.
 *
 * Inline-vs-above label threshold (16px radius) is documented inline —
 * smaller circles can't hold Plex Sans Medium 14px without truncation.
 */
const CartogramCircle = React.memo<CartogramCircleProps>(({
  x,
  y,
  radius,
  fillColor,
  label,
  dark,
}) => {
  const labelInside = radius >= 16;
  const labelFontSize =
    radius >= 28 ? fontSizes.label
    : labelInside ? fontSizes.caption
    : fontSizes.meta;
  const labelFill = labelInside
    ? (dark ? palette.ink : palette.paper)
    : (dark ? palette.bone : palette.ink);
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={withAlpha(fillColor, SYMBOL_FILL_ALPHA)}
        stroke={fillColor}
        strokeWidth={SYMBOL_STROKE_WIDTH}
      />
      {label && (
        <text
          x={x}
          y={labelInside ? y : y - radius - 6}
          dominantBaseline={labelInside ? "middle" : "ideographic"}
          textAnchor="middle"
          style={{
            fontFamily: fonts.display,
            fontSize: labelFontSize,
            fontWeight: fontWeights.medium,
            letterSpacing: `${letterSpacing.label}px`,
            textTransform: "uppercase",
            fill: labelFill,
          }}
        >
          {label}
        </text>
      )}
    </g>
  );
});
CartogramCircle.displayName = "CartogramCircle";

// ── Sub-component: legend (mirrors ProportionalSymbolMap's pattern) ──────

interface CartogramLegendProps {
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

const CartogramLegend = React.memo<CartogramLegendProps>(({
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

  const padding = layout.safeAreaTier.generous.right;
  const baseY = layout.height - layout.safeAreaTier.generous.bottom;
  const gap = 30;
  const xLarge = layout.width - padding - rLarge;
  const xMedium = xLarge - rLarge - gap - rMedium;
  const xSmall = xMedium - rMedium - gap - rSmall;
  const yLarge = baseY - rLarge;
  const yMedium = baseY - rMedium;
  const ySmall = baseY - rSmall;
  const labelColor = dark ? palette.bone : palette.ink;
  const captionColor = palette.taupe;
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
CartogramLegend.displayName = "CartogramLegend";

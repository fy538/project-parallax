/**
 * DensityMap — point-density visualization on a Mapbox basemap.
 *
 * Uses deck.gl's GPU-accelerated aggregation layers (HexagonLayer for
 * countable bins, HeatmapLayer for continuous-gradient hotspots,
 * GridLayer for square tessellation). Right form for "where things
 * concentrate" stories where ProportionalSymbolMap would have too few
 * data points and ChoroplethMap would over-emphasize country borders.
 *
 * Performance: aggregation runs on the GPU. Thousands of points are
 * negligible cost. Hexagon layer is heavier than heatmap (it tessellates
 * + extrudes); heatmap is the cheaper choice for large point sets.
 *
 * Dossier: references/template-research/density-map.md
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { HexagonLayer, HeatmapLayer, GridLayer } from "@deck.gl/aggregation-layers";
import { Background } from "../../components/Background";
import { MapGL } from "../../components/MapGL";
import { MapAnnotations } from "../../components/MapAnnotations";
import { MapInset } from "../../components/MapInset";
import { TitleBlock } from "../../components/TitleBlock";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import {
  layout,
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  sec,
  shadows,
} from "../../design/theme";
import { exitFade, fadeIn, fadeOut } from "../../utils/animation";
import { hexToRgba } from "../../utils/mapUtils";
import { warnIf } from "../../utils/dataWarnings";
import type { DensityMapData, DensityPhase } from "./types";

// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_MODE = "hex" as const;
/** Default hex cell radius in meters (100km — continent-scale aggregation). */
const DEFAULT_CELL_SIZE_HEX = 100_000;
/** Default heatmap radius in pixels — kernel half-width. */
const DEFAULT_CELL_SIZE_HEATMAP = 30;
/** Default opacity for the aggregation layer (basemap shows through). */
const DEFAULT_OPACITY = 0.75;
/** Default coverage for hex/grid bins (small gaps for legibility). */
const DEFAULT_COVERAGE = 0.9;

/**
 * Default sequential-warm ramp for aggregation fills: paper → bone →
 * gold → rust → oxblood. Single-direction (low → high), brand-aligned.
 * The deck.gl ramp expects [r, g, b] tuples, not hex strings.
 */
const DEFAULT_RAMP_HEX = [
  palette.paper,
  palette.bone,
  palette.gold,
  palette.rust,
  palette.umber,
] as const;

// ── Phase windows ─────────────────────────────────────────────────────────

interface PhaseWindow {
  phase: DensityPhase;
  startFrame: number;
  endFrame: number;
  index: number;
}

const FALLBACK_PHASE_WINDOW: PhaseWindow = {
  phase: { title: "", durationSec: 0, points: [] },
  startFrame: 0,
  endFrame: 0,
  index: 0,
};

const computePhaseWindows = (phases: DensityPhase[]): PhaseWindow[] => {
  let cursor = 0;
  return phases.map((phase, index) => {
    const startFrame = cursor;
    const endFrame = cursor + sec(phase.durationSec);
    cursor = endFrame;
    return { phase, startFrame, endFrame, index };
  });
};

const getCurrentPhaseIndex = (frame: number, windows: PhaseWindow[]): number => {
  for (const w of windows) {
    if (frame < w.endFrame) return w.index;
  }
  return windows.length - 1;
};

// ── Color ramp resolution ─────────────────────────────────────────────────

/**
 * Convert a hex ramp to deck.gl's [r,g,b] tuple format. Exported for tests.
 * deck.gl's aggregation `colorRange` is a list of RGB triples (alpha is
 * handled separately via `opacity`).
 */
export const hexRampToRgbTuples = (
  hexRamp: readonly string[],
): [number, number, number][] => {
  return hexRamp.map((hex) => {
    const [r, g, b] = hexToRgba(hex, 255);
    return [r, g, b];
  });
};

// ── Component ─────────────────────────────────────────────────────────────

export const DensityMap: React.FC<{ data: DensityMapData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation({
    noDrift: true,
    ...direction.driftOptions,
  });

  const dark = data.backgroundVariant === "dark";
  const mode = data.mode ?? DEFAULT_MODE;
  const opacity = data.opacity ?? DEFAULT_OPACITY;
  const coverage = data.coverage ?? DEFAULT_COVERAGE;
  const cellSize = data.cellSize ?? (mode === "heatmap" ? DEFAULT_CELL_SIZE_HEATMAP : DEFAULT_CELL_SIZE_HEX);

  // E2 audit: `cellSize` units differ by mode (heatmap → pixels, hex/grid
  // → meters). Author setting `cellSize: 100000` is fine for hex (100km
  // bins) but for heatmap means a 100,000-pixel kernel radius — absurd.
  // Warn at dev time so the unit mistake doesn't ship.
  warnIf(
    mode === "heatmap" && cellSize > 1000,
    "DensityMap",
    `cellSize=${cellSize}px is implausibly large for heatmap mode (kernel ` +
    `radius is in PIXELS, not meters). Typical range: 10–80px. Did you ` +
    `mean to use mode: "hex" or "grid"?`,
  );
  warnIf(
    (mode === "hex" || mode === "grid") && cellSize < 1000,
    "DensityMap",
    `cellSize=${cellSize}m is very small for ${mode} mode (bin radius is in ` +
    `METERS, not pixels). Typical range: 50_000–500_000m (50km–500km). Did ` +
    `you mean to use mode: "heatmap"?`,
  );

  // Phase resolution + defensive guard (B4 pattern).
  const windows = useMemo(() => computePhaseWindows(data.phases), [data.phases]);
  const safeIdx = windows.length === 0
    ? 0
    : Math.min(getCurrentPhaseIndex(frame, windows), windows.length - 1);
  const currentWindow: PhaseWindow = windows[safeIdx] ?? FALLBACK_PHASE_WINDOW;

  // ── Camera (per-phase or template default) ──────────────────────────────
  const camera = useMemo(() => {
    const fallback = data.camera ?? {
      longitude: 0,
      latitude: 20,
      zoom: 2,
      pitch: 0,
      bearing: 0,
    };
    return currentWindow.phase.camera ?? fallback;
  }, [currentWindow.phase.camera, data.camera]);

  // ── Color ramp as deck.gl tuples (memoized) ─────────────────────────────
  const colorRange = useMemo(
    () => hexRampToRgbTuples(data.colorRamp ?? DEFAULT_RAMP_HEX),
    [data.colorRamp],
  );

  // Bivariate detection: when ANY point in this phase has a `colorWeight`,
  // we're in bivariate mode (size from weight, color from colorWeight).
  // Heatmap is univariate-only — `colorWeight` is silently ignored there.
  const hasColorWeight = useMemo(
    () => currentWindow.phase.points.some((p) => p.colorWeight !== undefined),
    [currentWindow.phase.points],
  );

  const colorAggregation = data.colorAggregation ?? "sum";

  // Bivariate misuse: colorWeight only works on hex/grid. Heatmap is
  // univariate by design (kernel density on a single weight). If author
  // attached colorWeight to points in heatmap mode, the data goes nowhere.
  warnIf(
    mode === "heatmap" && hasColorWeight,
    "DensityMap",
    `Points have \`colorWeight\` but \`mode: "heatmap"\` is univariate — ` +
    `colorWeight is IGNORED. Switch to \`mode: "hex"\` or \`mode: "grid"\` ` +
    `for bivariate (size + color) encoding.`,
  );

  // Template-fit heuristic: DensityMap is designed for 100s of points.
  // With <10 points there's no useful aggregation — ProportionalSymbolMap
  // (sized circles at exact centroids) reads more clearly. See
  // MAP_TEMPLATE_SELECTOR.md.
  const totalPoints = useMemo(
    () => data.phases.reduce((sum, p) => sum + p.points.length, 0),
    [data.phases],
  );
  warnIf(
    totalPoints > 0 && totalPoints < 10,
    "DensityMap",
    `Only ${totalPoints} total points across all phases — DensityMap is for ` +
    `aggregation of 100s of points. Consider ProportionalSymbolMap (sized ` +
    `circles at exact locations) for sparse data. See MAP_TEMPLATE_SELECTOR.md.`,
  );

  // ── Aggregation layer (memoized per phase + config) ─────────────────────
  // Built once per phase + config. The `opacity` prop is NOT set here —
  // it's modulated per frame via `.clone({ opacity })` in the `layers`
  // useMemo below (B2 audit: avoid double-setting opacity that gets
  // immediately overwritten by clone).
  const aggregationLayer = useMemo(() => {
    const pts = currentWindow.phase.points;
    if (pts.length === 0) return null;

    const common = {
      data: pts,
      getPosition: (d: typeof pts[number]) => d.at,
      getWeight: (d: typeof pts[number]) => d.weight ?? 1,
      pickable: false,
    } as const;

    if (mode === "heatmap") {
      // Heatmap is univariate-only — colorWeight is silently ignored.
      // (Warning fires in the bivariate guard below if author tries it.)
      return new HeatmapLayer({
        id: "density-heatmap",
        ...common,
        radiusPixels: cellSize,
        colorRange,
      });
    }

    // hex + grid both support bivariate via getColorValue + colorAggregation.
    // When hasColorWeight is true, we override color aggregation; otherwise
    // deck.gl falls back to its default (sum of `getWeight`, same as size).
    const bivariate = hasColorWeight
      ? {
          getColorValue: (datapoints: typeof pts) => {
            if (datapoints.length === 0) return 0;
            let sum = 0;
            let max = -Infinity;
            for (const p of datapoints) {
              const cw = p.colorWeight ?? 0;
              sum += cw;
              if (cw > max) max = cw;
            }
            if (colorAggregation === "max") return max;
            if (colorAggregation === "mean") return sum / datapoints.length;
            return sum; // default
          },
        }
      : {};

    if (mode === "grid") {
      return new GridLayer({
        id: "density-grid",
        ...common,
        ...bivariate,
        cellSize,
        coverage,
        colorRange,
        extruded: false,
      });
    }
    // default: hex
    return new HexagonLayer({
      id: "density-hex",
      ...common,
      ...bivariate,
      radius: cellSize,
      coverage,
      colorRange,
      extruded: false,
    });
  }, [
    currentWindow.phase.points,
    mode,
    cellSize,
    coverage,
    colorRange,
    hasColorWeight,
    colorAggregation,
  ]);

  // ── Symbol-style entrance fade for the aggregation layer ────────────────
  const layerOpacity = useMemo(() => {
    const enter = fadeIn(frame, currentWindow.startFrame + sec(0.3), sec(0.7));
    const exit = fadeOut(frame, currentWindow.endFrame, sec(0.4));
    return Math.min(enter, exit);
  }, [frame, currentWindow.startFrame, currentWindow.endFrame]);

  // Phase windows in seconds for MapAnnotations (memoized → MapAnnotations
  // doesn't bust its internal memo). Same pattern as ChoroplethMap +
  // RouteAnimation (B2 audit fix).
  const phaseWindowsSec = useMemo(
    () =>
      windows.map((w) => ({
        startSec: w.startFrame / layout.fps,
        endSec: w.endFrame / layout.fps,
      })),
    [windows],
  );

  // The deck.gl-bound `layers` array: aggregation layer cloned with the
  // current effective opacity (data.opacity × phase fade). Memoized so we
  // don't re-clone every frame when opacity is steady (most of the
  // composition — fades happen only at phase boundaries). deck.gl diffs
  // the cloned layer against the previous and skips GPU work when data
  // hasn't changed; the `.clone()` allocation is the only cost here.
  const layers = useMemo(
    () =>
      aggregationLayer
        ? [aggregationLayer.clone({ opacity: opacity * layerOpacity })]
        : [],
    [aggregationLayer, opacity, layerOpacity],
  );

  // Defensive null-render (B4 pattern).
  warnIf(
    windows.length === 0,
    "DensityMap",
    "phases array is empty — rendering nothing.",
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
        <HeaderStrip
          metadata={`${data.episode || ""} · density`}
          mode={dark ? "dark" : "light"}
        />
        <FooterStrip
          scale={data.source ? `Source: ${data.source}` : undefined}
          mode={dark ? "dark" : "light"}
        />

        <MapGL
          longitude={camera.longitude}
          latitude={camera.latitude}
          zoom={camera.zoom}
          pitch={camera.pitch ?? 0}
          bearing={camera.bearing ?? 0}
          dark={dark}
          terrain={false}
          layers={layers}
        >
          {data.annotations && data.annotations.length > 0 && (
            <MapAnnotations
              annotations={data.annotations}
              compositionDurationSec={durationInFrames / layout.fps}
              phaseWindows={phaseWindowsSec}
              dark={dark}
            />
          )}
        </MapGL>

        {/* Locator inset — globe with rust pin at the parent camera target.
            Density maps zoomed to one continent benefit most; world-scale
            zooms can skip the inset (default: hidden). */}
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
            dark={dark}
          />
        )}

        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={dark ? "dark" : "light"}
          safeAreaTier="generous"
          syncPoints={direction.syncPoints}
        />

        {/* Phase title overlay — bottom-left, mirrors AtlasPlate convention. */}
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

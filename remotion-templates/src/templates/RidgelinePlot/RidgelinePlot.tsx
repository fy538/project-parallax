/**
 * RidgelinePlot — N stacked density curves (joyplot), one per group.
 *
 * Each group's density is rendered as a smooth closed area on a shared
 * X axis. Rows overlap (default 40%) so ridge tops extend up into the
 * row above — the canonical Wilke/Economist joyplot composition.
 *
 * Animation sequence:
 *   1. Title fades in (handled by TitleBlock)
 *   2. Shared X axis draws in left → right
 *   3. Group labels fade in top → bottom (staggered)
 *   4. Ridges reveal top → bottom via clip-path left-to-right sweep
 *   5. Highlight peak-value callouts fade in last
 *   6. Ken Burns drift + exit fade (via useCompositionAnimation)
 *
 * Density samples are pre-computed by the data file (no runtime KDE).
 * The smoothing curve is a monotone Catmull-Rom approximation rendered
 * as a chain of cubic beziers — keeps peaks crisp without overshoot.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  letterSpacing,
  layout,
  sec,
  contentArea,
  getCategoricalColor,
} from "../../design/theme";
import {
  fadeIn,
  stagger,
  exitFade,
  anticipatoryStartFrame,
  CLAMP_CUBIC,
} from "../../utils/animation";
import { niceDomain, niceTicks, formatTick } from "../../utils/niceTicks";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { warnIf, checkChartDataCommon } from "../../utils/dataWarnings";
import { contrastDelta } from "../../utils/colorContrast";
import type { RidgelinePlotData, RidgelineGroup, DensitySample } from "./types";

// Below this luminance delta against the substrate, a ridge fill will
// render visually as "no shape" — the editorial-doctrine invisible-ridge
// bug. 0.08 corresponds to roughly a 1.5 : 1 luminance ratio on the
// paper substrate (light bone #F0E6D0 vs paper #F5F0E8 sits at ~0.04
// delta, well below threshold; taupe and gold sit comfortably above).
const SUBSTRATE_CONTRAST_THRESHOLD = 0.08;

// Brand-token color resolver — keeps semantic color names usable in data files.
const resolveColor = (
  raw: string | undefined,
  fallback: string,
): string => {
  if (!raw) return fallback;
  // Hex colors and CSS color funcs pass through unchanged.
  if (raw.startsWith("#") || raw.startsWith("rgb") || raw.startsWith("hsl")) {
    return raw;
  }
  // Brand token → palette lookup. Unknown names fall through to the fallback.
  const tokens = palette as Record<string, string>;
  if (raw in tokens) return tokens[raw];
  return raw; // assume caller passed a literal CSS color string
};

/**
 * Build an SVG path string for a smooth filled area through the given
 * density samples. Uses a Catmull-Rom-to-cubic-bezier conversion with
 * tension 0.5, which produces a natural-looking interpolation that
 * passes through every sample without overshoot. The path is closed
 * along the baseline so the area is fillable.
 *
 * `points` are already in screen coordinates (x, y in pixels).
 * `baselineY` is the Y coordinate of the row baseline (bottom of the
 * fillable region).
 */
function buildRidgePath(
  points: { x: number; y: number }[],
  baselineY: number,
): string {
  if (points.length < 2) return "";
  const n = points.length;
  const segments: string[] = [`M ${points[0].x} ${baselineY}`];
  segments.push(`L ${points[0].x} ${points[0].y}`);

  // Catmull-Rom → cubic bezier. For each interior segment p1→p2 we
  // compute control points from neighbors p0 and p3.
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    segments.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`);
  }

  // Close along baseline.
  segments.push(`L ${points[n - 1].x} ${baselineY}`);
  segments.push("Z");
  return segments.join(" ");
}

/**
 * Find the peak sample (max y) in a density array. Used to anchor the
 * highlight callout.
 */
function findPeak(density: DensitySample[]): DensitySample {
  let peak = density[0];
  for (const d of density) {
    if (d.y > peak.y) peak = d;
  }
  return peak;
}

export const RidgelinePlot: React.FC<{ data: RidgelinePlotData }> = ({
  data,
}) => {
  checkChartDataCommon("RidgelinePlot", data);
  warnIf(
    data.groups.length > 8,
    "RidgelinePlot",
    `${data.groups.length} groups — RidgelinePlot reads cleanest at 3–6 groups. ` +
      `Above 8, ridges stack into noise. Consider splitting into two charts ` +
      `or collapsing related groups.`,
  );
  warnIf(
    data.groups.some((g) => g.density.length < 8),
    "RidgelinePlot",
    "At least one group has <8 density samples — curves will look angular. " +
      "12–20 samples is the sweet spot for smooth joyplot shapes.",
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);

  // ── Substrate-contrast validation ────────────────────────────────────
  // Catches the "invisible ridge" bug: a group color valid by schema but
  // perceptually indistinguishable from the paper/ink substrate. Runs
  // every render; warnIf gates duplicate messages so each (group, color)
  // pair fires at most once per mount, not 30× per second.
  for (let i = 0; i < data.groups.length; i++) {
    const group = data.groups[i];
    const resolvedFill = resolveColor(group.color, getCategoricalColor(i));
    const delta = contrastDelta(resolvedFill, theme.bg.base);
    warnIf(
      delta < SUBSTRATE_CONTRAST_THRESHOLD,
      "RidgelinePlot",
      `Group "${group.label}" color "${group.color}" has insufficient contrast against the ${bgVariant} substrate background — the ridge will render invisible. Pick a color from palette.{rust, amber, gold, olive, bronze, umber, walnut, taupe, ink} or a hex with adequate distance from the paper background.`,
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────
  const area = useMemo(() => contentArea("content", "generous"), []);

  // Reserve left column for group labels, bottom strip for the X axis.
  const LABEL_COL_WIDTH = 180;
  const X_AXIS_HEIGHT = 56;
  const plotLeft = area.left + LABEL_COL_WIDTH;
  const plotRight = area.left + area.width;
  const plotWidth = plotRight - plotLeft;
  const plotTop = area.top + 8; // small breathing room below title
  const plotBottom = area.top + area.height - X_AXIS_HEIGHT;
  const plotHeight = plotBottom - plotTop;

  const overlap = Math.max(0, Math.min(0.8, data.overlap ?? 0.4));
  const N = data.groups.length;

  // Row layout. Each row's baseline is evenly spaced; the row height
  // (the vertical region a ridge can occupy upward from its baseline)
  // is enlarged by the overlap factor so ridge tops poke into the row
  // above. Formula:
  //   stride       = plotHeight / N        — distance between baselines
  //   rowHeight    = stride / (1 - overlap) — usable height per ridge
  //   baselineY[i] = plotTop + stride * (i + 1)
  // At overlap=0, rowHeight == stride (no bleed). At overlap=0.5, the
  // ridge top sits at the previous baseline.
  const stride = plotHeight / N;
  const rowHeight = stride / (1 - overlap);

  // ── X domain (shared) ─────────────────────────────────────────────────
  const xDomain = useMemo(() => {
    let xMin = Infinity;
    let xMax = -Infinity;
    for (const g of data.groups) {
      for (const d of g.density) {
        if (d.x < xMin) xMin = d.x;
        if (d.x > xMax) xMax = d.x;
      }
    }
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax)) return [0, 1];
    return niceDomain(xMin, xMax, 6);
  }, [data.groups]);

  const xTicks = useMemo(
    () => niceTicks(xDomain[0], xDomain[1], 6),
    [xDomain],
  );

  const xScale = (x: number): number => {
    if (xDomain[1] === xDomain[0]) return plotLeft;
    return (
      plotLeft + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * plotWidth
    );
  };

  // ── Shared density scale ──────────────────────────────────────────────
  // Find the global peak y across all groups so every ridge uses the
  // same vertical scale — otherwise a tall narrow distribution gets
  // visually flattened relative to a short wide one. Reserve some
  // headroom (×1.05) so peaks don't touch the row ceiling.
  const yPeak = useMemo(() => {
    let peak = 0;
    for (const g of data.groups) {
      for (const d of g.density) {
        if (d.y > peak) peak = d.y;
      }
    }
    return peak * 1.05 || 1;
  }, [data.groups]);

  const highlightSet = useMemo(
    () => new Set<string>(data.highlightIds ?? []),
    [data.highlightIds],
  );

  // ── Timing ────────────────────────────────────────────────────────────
  const axisStart = sec(0.3);
  const labelStart = sec(0.5);
  // D17 anticipatory reveal: first ridge settled when narrator names it.
  const firstSyncFrame = direction.syncPoints?.[0]?.frame;
  const entranceBase = firstSyncFrame != null
    ? anticipatoryStartFrame(firstSyncFrame, sec(0.4))
    : sec(0.7); // existing default
  const ridgeStart = entranceBase;
  const exitOp = exitFade(frame, durationInFrames, 15);

  const axisProgress = interpolate(
    frame,
    [axisStart, axisStart + sec(0.6)],
    [0, 1],
    CLAMP_CUBIC,
  );

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
        <HeaderStrip mode={bgVariant} metadata={data.episode} />
        <FooterStrip mode={bgVariant} />

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={bgVariant}
            safeAreaTier="generous"
            syncPoints={direction.syncPoints}
          />
        </div>

        <svg
          width={layout.width}
          height={layout.height}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          {/* ── Ridges (top → bottom) ─────────────────────────────────
              Each ridge is a smooth filled area on its row's baseline.
              Reveal: a left-to-right clip-path sweep, staggered down the
              stack. We use an SVG <clipPath> with an animated <rect> so
              the reveal scales with the actual plot region (avoids the
              CSS clip-path gotchas during Remotion frame-by-frame render). */}
          {data.groups.map((group: RidgelineGroup, i: number) => {
            const baselineY = plotTop + stride * (i + 1);
            const start = ridgeStart + stagger(i, sec(0.2));
            const revealProgress = interpolate(
              frame,
              [start, start + sec(0.9)],
              [0, 1],
              CLAMP_CUBIC,
            );

            const isHighlighted = highlightSet.has(group.id);
            // Categorical fallback when a group omits color.
            const color = resolveColor(
              group.color,
              getCategoricalColor(i),
            );

            // Map density samples to screen coordinates.
            const sorted = [...group.density].sort((a, b) => a.x - b.x);
            const points = sorted.map((d) => ({
              x: xScale(d.x),
              y: baselineY - (d.y / yPeak) * rowHeight,
            }));
            const path = buildRidgePath(points, baselineY);

            // Highlight: peak callout.
            const peakSample = isHighlighted ? findPeak(sorted) : null;
            const peakX = peakSample ? xScale(peakSample.x) : 0;
            const peakY = peakSample
              ? baselineY - (peakSample.y / yPeak) * rowHeight
              : 0;

            const fillOpacity = (isHighlighted ? 0.78 : 0.55) * exitOp;
            const strokeOpacity = (isHighlighted ? 1.0 : 0.85) * exitOp;
            const strokeWidth = isHighlighted ? 2 : 1.5;

            // Stable clip-path id per group; svg id collisions across
            // compositions are avoided by namespacing with the group id.
            const clipId = `ridge-clip-${data.episode}-${group.id}`;

            return (
              <g key={`ridge-${group.id}`}>
                <defs>
                  <clipPath id={clipId}>
                    <rect
                      x={plotLeft}
                      y={plotTop - rowHeight}
                      width={plotWidth * revealProgress}
                      height={plotHeight + rowHeight + 4}
                    />
                  </clipPath>
                </defs>

                {/* Ridge baseline rule — very faint, sits under the fill
                    so it reads as a tick anchor rather than a visible
                    line. Only drawn for non-overlapping configurations
                    where rows are visually distinct. */}
                {overlap < 0.2 && (
                  <line
                    x1={plotLeft}
                    y1={baselineY}
                    x2={plotLeft + plotWidth * axisProgress}
                    y2={baselineY}
                    stroke={theme.text.muted}
                    strokeWidth={0.5}
                    opacity={0.25 * exitOp}
                  />
                )}

                {/* The filled ridge. */}
                <path
                  d={path}
                  fill={color}
                  fillOpacity={fillOpacity}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  clipPath={`url(#${clipId})`}
                />

                {/* Highlight peak callout — a thin vertical pin from the
                    peak up to a small numeric label sitting just above
                    the ridge top. Reads as "this is where the mass sits." */}
                {peakSample && (
                  <g
                    opacity={fadeIn(frame, start + sec(0.7), sec(0.4)) * exitOp}
                  >
                    <line
                      x1={peakX}
                      y1={peakY}
                      x2={peakX}
                      y2={peakY - 14}
                      stroke={color}
                      strokeWidth={1}
                      opacity={0.7}
                    />
                    <circle cx={peakX} cy={peakY} r={2.5} fill={color} />
                    <text
                      x={peakX}
                      y={peakY - 20}
                      textAnchor="middle"
                      fill={color}
                      fontSize={fontSizes.caption}
                      fontFamily={fonts.data}
                      fontWeight={600}
                    >
                      {formatTick(peakSample.x, data.xUnit)}
                    </text>
                  </g>
                )}

                {/* Group label — left of the ridge, vertically aligned
                    with its baseline. Highlighted groups get heavier
                    weight and the group color; non-highlighted use the
                    muted theme text. */}
                <text
                  x={plotLeft - 16}
                  y={baselineY - 6}
                  textAnchor="end"
                  fill={isHighlighted ? color : theme.text.muted}
                  fontSize={fontSizes.label}
                  fontFamily={fonts.mono}
                  fontWeight={isHighlighted ? 700 : 500}
                  letterSpacing={letterSpacing.meta}
                  opacity={
                    fadeIn(frame, labelStart + stagger(i, sec(0.12)), sec(0.4)) *
                    exitOp
                  }
                  style={{ textTransform: "uppercase" }}
                >
                  {group.label}
                </text>
              </g>
            );
          })}

          {/* ── Shared X axis ────────────────────────────────────────
              Single horizontal rule below the lowest ridge with tick
              marks + numeric labels + axis title. Drawn AFTER the
              ridges so it sits visually on top of any ridge tail that
              extends below its baseline. */}
          <line
            x1={plotLeft}
            y1={plotBottom}
            x2={plotLeft + plotWidth * axisProgress}
            y2={plotBottom}
            stroke={theme.text.muted}
            strokeWidth={1}
            opacity={0.5 * exitOp}
          />

          {xTicks.map((t, idx) => {
            const tx = xScale(t);
            const tickOp =
              fadeIn(frame, axisStart + sec(0.4) + idx * 1.5, sec(0.3)) *
              exitOp;
            return (
              <g key={`xt-${t}`} opacity={tickOp}>
                <line
                  x1={tx}
                  y1={plotBottom}
                  x2={tx}
                  y2={plotBottom + 5}
                  stroke={theme.text.muted}
                  strokeWidth={1}
                  opacity={0.6}
                />
                <text
                  x={tx}
                  y={plotBottom + 20}
                  textAnchor="middle"
                  fill={theme.text.muted}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.data}
                  fontWeight={400}
                  letterSpacing={letterSpacing.meta}
                >
                  {formatTick(t, data.xUnit)}
                </text>
              </g>
            );
          })}

          {/* X axis title — small caps stamp under the tick row. */}
          <text
            x={plotLeft + plotWidth / 2}
            y={plotBottom + 44}
            textAnchor="middle"
            fill={theme.text.muted}
            fontSize={fontSizes.meta}
            fontFamily={fonts.mono}
            fontWeight={500}
            letterSpacing={letterSpacing.meta}
            opacity={fadeIn(frame, axisStart + sec(0.6), sec(0.4)) * exitOp}
            style={{ textTransform: "uppercase" }}
          >
            {data.xAxisLabel}
          </text>
        </svg>

        <SourceAttribution
          source={data.source}
          mode={bgVariant}
          prefix="Source: "
          startSec={2}
        />
      </AbsoluteFill>
    </Background>
  );
};

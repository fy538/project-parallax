/**
 * TimeSeriesChart — animated line chart with eras, annotations, and hero stat.
 *
 * Renders multiple lines showing change over time, with optional:
 *   - Era bands (shaded time periods)
 *   - Reference lines (horizontal benchmarks)
 *   - Annotations (labeled points with callouts)
 *   - Hero stat (large corner statistic)
 *
 * Animation sequence (8 steps):
 *   1. Title fade in (frames 0-15)
 *   2. Axes + gridlines draw (frames 5-25)
 *   3. Era bands fade in (frames 15-30)
 *   4. Lines draw (frames 25-65) — stroke-dashoffset, staggered per line
 *   5. Area fills (frames 55-75) — opacity fade in after line reaches end
 *   6. Annotations appear (frames 60-85) — scale in with spring
 *   7. Hero stat counts up (frames 70-90)
 *   8. Ken Burns drift + exit fade
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
  layout,
  sec,
  shadows,
  radii,
  cardPresets,
  barStyle,
  dividerStyle,
  letterSpacing,
  textMaxWidth,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import {
  fadeIn,
  stagger,
  exitFade,
  easings,
  gridlineDraw,
  kenBurnsDrift,
  heroSpring,
  CLAMP,
  CLAMP_CUBIC,
} from "../../utils/animation";
import {
  lineDrawProgress,
  lineDrawStyle,
  distance,
} from "../../utils/drawLine";
import {
  countUpValue,
} from "../../utils/countUp";
import { Background } from "../../components/Background";
import { useDirection } from "../../hooks/useDirection";
import { useBeatSync } from "../../hooks/useBeatSync";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { formatNumber } from "../../utils/numberFormat";
import { niceDomain, formatTick } from "../../utils/niceTicks";
import { chartLayout, validateChartLayoutIntegrity } from "../../utils/chartLayout";
import { computeLabelStacks } from "../../utils/labelStack";
import { checkChartDataCommon, warnIf } from "../../utils/dataWarnings";
import type { TimeSeriesChartData } from "./types";

// ── Geometry helpers ────────────────────────────────────────────────────────

/**
 * Walk along a polyline and return the (x, y) point at fractional progress
 * `t` (0–1) along the total path length. Used by the leading-edge marker
 * to track the tip of a line as it draws — the dot at the recording stylus.
 */
function pointAtProgress(
  points: { x: number; y: number }[],
  t: number
): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1 || t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  // Total path length
  let total = 0;
  const segLengths: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const d = Math.sqrt(dx * dx + dy * dy);
    segLengths.push(d);
    total += d;
  }
  if (total === 0) return points[0];

  const target = t * total;
  let walked = 0;
  for (let i = 0; i < segLengths.length; i++) {
    if (walked + segLengths[i] >= target) {
      const segT = (target - walked) / segLengths[i];
      const p0 = points[i];
      const p1 = points[i + 1];
      return {
        x: p0.x + (p1.x - p0.x) * segT,
        y: p0.y + (p1.y - p0.y) * segT,
      };
    }
    walked += segLengths[i];
  }
  return points[points.length - 1];
}

// ── Axis calculation helpers ────────────────────────────────────────────────

/**
 * Map a data point's x value to a pixel position within the chart area.
 * x values are assumed to be numeric or convertible to numbers.
 */
const getXPosition = (
  xValue: number | string,
  xMin: number,
  xMax: number,
  chartLeft: number,
  chartRight: number
): number => {
  const x = typeof xValue === "string" ? parseFloat(xValue) : xValue;
  const progress = (x - xMin) / (xMax - xMin);
  return chartLeft + progress * (chartRight - chartLeft);
};

/**
 * Map a data point's y value to a pixel position within the chart area.
 * Higher y values → lower on screen (standard SVG coordinate system).
 */
const getYPosition = (
  yValue: number,
  yMin: number,
  yMax: number,
  chartTop: number,
  chartBottom: number
): number => {
  const progress = (yValue - yMin) / (yMax - yMin);
  return chartBottom - progress * (chartBottom - chartTop);
};

// ── Main component ──────────────────────────────────────────────────────────

export const TimeSeriesChart: React.FC<{ data: TimeSeriesChartData }> = ({
  data,
}) => {
  // Dev-only semantic checks. Once-per-template per session in Studio.
  checkChartDataCommon("TimeSeriesChart", data);
  warnIf(
    data.lines.length === 0,
    "TimeSeriesChart",
    "lines array is empty — chart will render blank"
  );
  warnIf(
    data.lines.some((l) => l.points.length < 2),
    "TimeSeriesChart",
    "A line has fewer than 2 points — won't draw as a line",
    { lineCounts: data.lines.map((l) => l.points.length) }
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  // Per-episode color emphasis — reference line falls back to episode's
  // primary accent instead of channel-default amber.
  const emphasis = useEpisodeColorEmphasis();
  // Audio-reactive leading-edge brighten on Whisper-resolved sync points.
  // Used below to brighten the live-recording mid-ring as beats land.
  const beat = useBeatSync({
    markers: (direction.syncPoints ?? []).map((p) => p.timeSec),
    pulseDecay: 0.25,
  });

  // Extract colors from theme via hook
  const bgVariant = data.backgroundVariant || "light";
  const theme = useThemeMode(bgVariant);
  // theme.bg.base and theme.text.primary available via `theme` directly
  const mutedColor = theme.text.muted;
  const accentColor = theme.text.accent;






  // Chart region — declarative layout via the shared helper. Replaces
  // hardcoded chartPaddingTop=180/Bottom=100 magic numbers with named
  // regions. The helper reserves space for: title block + legend (when
  // multi-series) + bottom x-axis labels + source line. Chart gets the
  // remaining bounding box. extraPad adds room for y-axis tick labels
  // and right-side legend clearance ON TOP OF the standard safe area.
  const cl = useMemo(
    () =>
      chartLayout({
        hasTitle: true,
        hasLegend: data.lines.length > 1,
        hasXAxis: true,
        hasSource: !!data.source,
        safeAreaTier: "generous",
        extraPad: { left: 100, right: 100 }, // y-axis label space + legend strip clearance
      }),
    [data.lines.length, data.source]
  );
  const chartLayoutIssues = useMemo(() => validateChartLayoutIntegrity(cl), [cl]);
  warnIf(
    chartLayoutIssues.length > 0,
    "TimeSeriesChart",
    `Chart layout integrity failed: ${chartLayoutIssues.join("; ")}`,
    cl
  );
  const chartLeft = cl.chart.left;
  const chartRight = cl.chart.left + cl.chart.width;
  const chartTop = cl.chart.top;
  const chartBottom = cl.chart.top + cl.chart.height;
  const chartWidth = cl.chart.width;
  const chartHeight = cl.chart.height;
  // SourceAttribution positions itself at `bottom: layout.safeArea.bottom + bottomOffset`.
  // Since cl uses safeAreaTier "generous" (120px), we need bottomOffset = generous - standard
  // so the component lands at 120px from the canvas bottom, matching the rest of the layout.
  const sourceBottomOffset = data.source
    ? layout.safeAreaTier.generous.bottom - layout.safeArea.bottom
    : 0;

  // Compute axis ranges — memoized so flatMap/min/max don't run every frame
  const { yMin, yMax, xMin, xMax } = useMemo(() => {
    const allYValues = data.lines.flatMap((line) => line.points.map((p) => p.y));
    const referenceYValues = data.referenceLines?.map((r) => r.y) || [];
    const allYWithReferences = [...allYValues, ...referenceYValues];

    let yMin = allYWithReferences.length > 0 ? Math.min(...allYWithReferences) : 0;
    let yMax = allYWithReferences.length > 0 ? Math.max(...allYWithReferences) : 1;

    if (data.yRange) {
      [yMin, yMax] = data.yRange;
    } else {
      // Domain inference rules:
      //   1. If all data is non-negative, clamp yMin at 0 — population
      //      can't be -325M. Don't pad below zero for inherently
      //      non-negative quantities.
      //   2. If all data is non-positive, clamp yMax at 0 (mirror case).
      //   3. Otherwise (mixed sign), pad both ends so the line breathes.
      //   4. After clamping, snap the domain to a "nice" range using
      //      D3-style 1/2/5 × 10ⁿ tick spacing so labels read as round
      //      numbers (1k, 2k, 3k — not 1051, 2427, 3803).
      const dataMin = yMin;
      const dataMax = yMax;
      const range = dataMax - dataMin || 1;
      if (dataMin >= 0) {
        yMin = 0;
        yMax = dataMax + range * 0.1;
      } else if (dataMax <= 0) {
        yMin = dataMin - range * 0.1;
        yMax = 0;
      } else {
        yMin = dataMin - range * 0.1;
        yMax = dataMax + range * 0.1;
      }
      [yMin, yMax] = niceDomain(yMin, yMax, 5);
    }

    const allXValues = data.lines.flatMap((line) =>
      line.points.map((p) => (typeof p.x === "string" ? parseFloat(p.x) : p.x))
    );
    const xMin = allXValues.length > 0 ? Math.min(...allXValues) : 0;
    const xMax = allXValues.length > 0 ? Math.max(...allXValues) : 1;

    return { yMin, yMax, xMin, xMax };
  }, [data.lines, data.referenceLines, data.yRange]);

  // Pre-compute pixel coordinates for each data point. We use these for
  // both the polyline string AND for the leading-edge marker — the marker
  // needs to know where the tip of the line is at any draw progress, which
  // requires walking the polyline segment by segment.
  const linePixelPoints = useMemo(
    () =>
      data.lines.map((line) =>
        line.points.map((p) => ({
          x: getXPosition(p.x, xMin, xMax, chartLeft, chartRight),
          y: getYPosition(p.y, yMin, yMax, chartTop, chartBottom),
        }))
      ),
    [data.lines, xMin, xMax, yMin, yMax, chartLeft, chartRight, chartTop, chartBottom]
  );

  // Generate polyline points string for each line
  const linePointStrings = useMemo(
    () =>
      linePixelPoints.map((pts) =>
        pts.map((p) => `${p.x},${p.y}`).join(" ")
      ),
    [linePixelPoints]
  );

  // Calculate path lengths for stroke animation
  const linePathLengths = useMemo(
    () =>
      data.lines.map((line) => {
        let length = 0;
        for (let i = 1; i < line.points.length; i++) {
          const p0 = line.points[i - 1];
          const p1 = line.points[i];
          const x0 = getXPosition(p0.x, xMin, xMax, chartLeft, chartRight);
          const y0 = getYPosition(p0.y, yMin, yMax, chartTop, chartBottom);
          const x1 = getXPosition(p1.x, xMin, xMax, chartLeft, chartRight);
          const y1 = getYPosition(p1.y, yMin, yMax, chartTop, chartBottom);
          length += distance(x0, y0, x1, y1);
        }
        return length;
      }),
    [data.lines, xMin, xMax, yMin, yMax]
  );

  // Animation frame markers (pace-scaled — direction.paceTimingScale shifts
  // the whole reveal cadence; urgent draws lines faster, breathing lingers).
  const t = direction.paceTimingScale;
  const s = direction.paceStaggerScale;
  const axesStart = sec(0.2 * t);
  const eraStart = sec(0.5 * t);
  const lineDrawStart = sec(0.8 * t);
  const lineDrawDuration = sec(1.3 * t);
  const areaFillStart = sec(1.8 * t);
  const annotationStart = sec(2 * t);
  const heroStatStart = sec(2.3 * t);
  // exitStart and titleOpacity available for future use

  // ── Gridlines (5 horizontal lines across the chart) ──────────────────────
  const gridlineCount = 5;
  const gridlineStartFrame = axesStart;

  // ── Era bands (background rectangles) ────────────────────────────────────
  const eraFadeOpacity = fadeIn(frame, eraStart, sec(0.4));

  // ── Line drawing animations ──────────────────────────────────────────────
  // Each line draws with stagger
  const lineStartFrames = data.lines.map((_, i) =>
    lineDrawStart + stagger(i, sec(0.2 * s), 0)
  );

  // ── Annotations ────────────────────────────────────────────────────────────
  const annotationOpacity = fadeIn(frame, annotationStart, sec(0.4)) * exitFade(frame, durationInFrames, sec(0.5));

  // ── Hero stat (large corner statistic) ──────────────────────────────────
  let heroStatValue = 0;
  let heroStatPrefix = "";
  let heroStatSuffix = "";
  if (data.heroStat) {
    // Parse the value string to extract prefix, number, and suffix
    // e.g., "~65%" → prefix="~", number="65", suffix="%"
    const match = data.heroStat.value.match(/^([^\d.]*)(\d+\.?\d*)(.*)$/);
    if (match) {
      heroStatPrefix = match[1];
      const numericStr = match[2];
      heroStatSuffix = match[3];
      const parsed = parseFloat(numericStr);
      heroStatValue = isNaN(parsed) ? 0 : parsed;
    } else {
      // Fallback for non-standard format
      const numericStr = data.heroStat.value.replace(/[^\d.]/g, "");
      const parsed = parseFloat(numericStr);
      heroStatValue = isNaN(parsed) ? 0 : parsed;
      heroStatSuffix = data.heroStat.value.replace(/[\d.]/g, "");
    }

    const countStart = heroStatStart;
    const countDuration = sec(0.8);
    heroStatValue = countUpValue({
      from: 0,
      to: heroStatValue,
      startFrame: countStart,
      duration: countDuration,
      frame,
      overshoot: 0.02,
    });
  }

  // ── Ken Burns drift + exit (L44 + L66) ─────────────────────────────────
  // useCompositionAnimation provides exitOpacity (matches manual exitFade at
  // 15 frames default). noDrift: true means we keep the manual kenBurnsDrift
  // below at 1.01 — much subtler than the hook's default 1.06.
  const { exitOpacity } = useCompositionAnimation({ noDrift: true });
  const driftScale = kenBurnsDrift(frame, durationInFrames, 1.01);

  const contentOpacity = Math.min(exitOpacity, 1);

  return (
    <Background
      variant={bgVariant}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill
        style={{
          opacity: contentOpacity,
          transform: `scale(${driftScale})`,
          transformOrigin: "center center",
        }}
      >
        {/* ── Title ──────────────────────────────────────────────────────────*/}
        <TitleBlock title={data.title} subtitle={data.subtitle} mode={bgVariant} safeAreaTier="generous" />

        {/* ── Legend (only when there are multiple series) ──────────────────
            Positioned above the chart area, right-aligned. Shows a colored
            line swatch + label for each series so the viewer can identify
            which line is which without inline labels cluttering the chart. */}
        {data.lines.length > 1 && (
          <div
            style={{
              position: "absolute",
              top: cl.legend.top,
              left: cl.legend.left,
              width: cl.legend.width,
              minHeight: cl.legend.height || 36,
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: layout.spacing.lg,
              opacity: fadeIn(frame, axesStart, sec(0.4)),
            }}
          >
            {data.lines.map((line, idx) => (
              <div
                key={`legend-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: layout.spacing.xs,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 4,
                    borderRadius: 2,
                    background: line.color,
                    boxShadow: `0 1px 2px ${line.color}55`,
                  }}
                />
                <div
                  style={{
                    fontSize: fontSizes.label,
                    fontWeight: 500,
                    fontFamily: fonts.mono,
                    color: mutedColor,
                    textShadow: shadows.textLift,
                    whiteSpace: "nowrap",
                  }}
                >
                  {line.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Chart SVG canvas ──────────────────────────────────────────────*/}
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            overflow: "visible",
          }}
        >
          {/* ── Era bands (background) — fill + thin dashed top/bottom borders ──*/}
          {data.eras?.map((era, eraIdx) => {
            const eraFromX = getXPosition(
              era.from,
              xMin,
              xMax,
              chartLeft,
              chartRight
            );
            const eraToX = getXPosition(
              era.to,
              xMin,
              xMax,
              chartLeft,
              chartRight
            );
            const eraOpacity = Math.min(era.opacity ?? 0.08, 0.08) * eraFadeOpacity;
            const borderOpacity = eraFadeOpacity * 0.4;

            return (
              <g key={`era-${eraIdx}`}>
                <rect
                  x={eraFromX}
                  y={chartTop}
                  width={eraToX - eraFromX}
                  height={chartHeight}
                  fill={era.color}
                  opacity={eraOpacity}
                />
                {/* Top border — thin dashed line */}
                <line
                  x1={eraFromX}
                  y1={chartTop}
                  x2={eraToX}
                  y2={chartTop}
                  stroke={era.color}
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  opacity={borderOpacity}
                />
                {/* Bottom border — thin dashed line */}
                <line
                  x1={eraFromX}
                  y1={chartBottom}
                  x2={eraToX}
                  y2={chartBottom}
                  stroke={era.color}
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  opacity={borderOpacity}
                />
              </g>
            );
          })}

          {/* ── Gridlines (5 horizontal) ────────────────────────────────────*/}
          {Array.from({ length: gridlineCount }).map((_, gridIdx) => {
            const gridY = chartTop + (gridIdx / (gridlineCount - 1)) * chartHeight;
            const gridProgress = gridlineDraw(
              frame,
              gridlineStartFrame,
              sec(0.4),
              gridIdx,
              3
            );
            const gridStrokeStyle = lineDrawStyle(chartWidth, gridProgress);

            return (
              <line
                key={`gridline-${gridIdx}`}
                x1={chartLeft}
                y1={gridY}
                x2={chartRight}
                y2={gridY}
                stroke={mutedColor}
                strokeWidth={1}
                opacity={0.12}
                strokeDasharray={gridStrokeStyle.strokeDasharray as number}
                strokeDashoffset={gridStrokeStyle.strokeDashoffset as number}
              />
            );
          })}

          {/* ── Axes ────────────────────────────────────────────────────────*/}
          {/* X-axis */}
          <line
            x1={chartLeft}
            y1={chartBottom}
            x2={chartRight}
            y2={chartBottom}
            stroke={mutedColor}
            strokeWidth={1}
            opacity={fadeIn(frame, axesStart, sec(0.3))}
          />
          {/* Y-axis */}
          <line
            x1={chartLeft}
            y1={chartTop}
            x2={chartLeft}
            y2={chartBottom}
            stroke={mutedColor}
            strokeWidth={1}
            opacity={fadeIn(frame, axesStart, sec(0.3))}
          />

          {/* ── Reference lines (horizontal benchmarks) ──────────────────────*/}
          {data.referenceLines?.map((refLine, refIdx) => {
            const refY = getYPosition(
              refLine.y,
              yMin,
              yMax,
              chartTop,
              chartBottom
            );
            const refColor = refLine.color || emphasis.primaryAccent;
            const refStrokeDasharray = refLine.dashed ? "4,4" : undefined;
            const refOpacity = fadeIn(
              frame,
              axesStart + sec(0.2),
              sec(0.3)
            );

            return (
              <line
                key={`refline-${refIdx}`}
                x1={chartLeft}
                y1={refY}
                x2={chartRight}
                y2={refY}
                stroke={refColor}
                strokeWidth={1.5}
                strokeDasharray={refStrokeDasharray}
                opacity={refOpacity}
              />
            );
          })}

          {/* ── Area fills (under lines) ────────────────────────────────────*/}
          {data.lines.map(
            (line, lineIdx) =>
              line.areaFill && (
                <polygon
                  key={`area-${lineIdx}`}
                  points={
                    linePointStrings[lineIdx] +
                    ` ${chartRight},${chartBottom} ${chartLeft},${chartBottom}`
                  }
                  fill={line.color}
                  opacity={
                    (line.areaOpacity ?? 0.08) *
                    interpolate(frame, [areaFillStart + sec(lineIdx * 0.1), areaFillStart + sec(0.4)], [0, 1], CLAMP_CUBIC)
                  }
                />
              )
          )}

          {/* ── Lines (main data visualization) ────────────────────────────*/}
          {data.lines.map((line, lineIdx) => {
            const lineDrawStart_frame = lineStartFrames[lineIdx];
            const lineProgress = lineDrawProgress(
              frame,
              lineDrawStart_frame,
              lineDrawDuration,
              easings.structure
            );
            const lineStyle = lineDrawStyle(linePathLengths[lineIdx], lineProgress);

            return (
              <polyline
                key={`line-${lineIdx}`}
                points={linePointStrings[lineIdx]}
                fill="none"
                stroke={line.color}
                strokeWidth={line.width ?? 5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={line.dashed ? "8,4" : undefined}
                strokeDashoffset={lineStyle.strokeDashoffset as number}
                opacity={fadeIn(frame, lineDrawStart_frame, sec(0.2)) * exitOpacity}
                style={{ filter: `drop-shadow(0 2px 3px ${line.color}55)` }}
              />
            );
          })}

          {/* ── Leading-edge markers — a glowing dot at the tip of each line
              while it's drawing. Acts like the stylus of a recording
              instrument tracing the curve. The dot fades out once the
              line reaches its endpoint. */}
          {data.lines.map((line, lineIdx) => {
            const lineDrawStart_frame = lineStartFrames[lineIdx];
            const lineProgress = lineDrawProgress(
              frame,
              lineDrawStart_frame,
              lineDrawDuration,
              easings.structure
            );
            // Don't render the dot before the line starts drawing or after
            // it's safely settled. It's only meaningful while in-flight.
            if (lineProgress <= 0.001 || lineProgress >= 1) return null;

            const tip = pointAtProgress(linePixelPoints[lineIdx], lineProgress);

            // Fade in quickly at start; fade out as we approach the tail.
            const dotOpacity =
              Math.min(1, lineProgress / 0.05) *
              Math.min(1, (1 - lineProgress) / 0.08) *
              exitOpacity;

            return (
              <g key={`leading-edge-${lineIdx}`} opacity={dotOpacity}>
                {/* Outer halo — large soft glow, color-matched */}
                <circle
                  cx={tip.x}
                  cy={tip.y}
                  r={14}
                  fill={line.color}
                  opacity={0.18}
                  style={{ filter: `blur(4px)` }}
                />
                {/* Mid ring — slight pulse to suggest "live" recording.
                    Beat sync brightens the ring up to ~0.5 on Whisper sync
                    points, reinforcing the line-draw-meets-narration moment. */}
                <circle
                  cx={tip.x}
                  cy={tip.y}
                  r={9}
                  fill={line.color}
                  opacity={Math.min(0.6, 0.32 + beat.pulse * 0.25)}
                />
                {/* Dot core — solid, sits at the geometric tip */}
                <circle
                  cx={tip.x}
                  cy={tip.y}
                  r={5}
                  fill={line.color}
                  stroke="#fff"
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                />
              </g>
            );
          })}

          {/* ── Annotation dots and lines ──────────────────────────────────*/}
          {data.annotations?.map((annot, annotIdx) => {
            // Find which line and point this annotation refers to
            let annotX = chartLeft;
            let annotY = chartBottom;
            let found = false;

            for (const line of data.lines) {
              for (const point of line.points) {
                if (point.x === annot.x || String(point.x) === String(annot.x)) {
                  annotX = getXPosition(point.x, xMin, xMax, chartLeft, chartRight);
                  annotY = getYPosition(point.y, yMin, yMax, chartTop, chartBottom);
                  found = true;
                  break;
                }
              }
              if (found) break;
            }

            const annotColor = annot.color || accentColor;
            const annotLineOpacity = annot.line !== false ? annotationOpacity : 0;
            const annotDotOpacity = annot.dot !== false ? annotationOpacity : 0;

            return (
              <g key={`annotation-${annotIdx}`}>
                {/* Vertical line from axis to point */}
                {annot.line !== false && (
                  <line
                    x1={annotX}
                    y1={annotY}
                    x2={annotX}
                    y2={chartBottom}
                    stroke={annotColor}
                    strokeWidth={1}
                    strokeDasharray="3,3"
                    opacity={annotLineOpacity}
                  />
                )}
                {/* Dot marker with glow */}
                {annot.dot !== false && (
                  <>
                    {/* Outer glow (larger, softer) */}
                    <circle
                      cx={annotX}
                      cy={annotY}
                      r={10}
                      fill={annotColor}
                      opacity={annotDotOpacity * 0.15}
                    />
                    {/* Main dot */}
                    <circle
                      cx={annotX}
                      cy={annotY}
                      r={6}
                      fill={annotColor}
                      opacity={annotDotOpacity}
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Y-axis labels ──────────────────────────────────────────────────*/}
        <div
          style={{
            position: "absolute",
            top: chartTop,
            left: layout.padding + 20,
            height: chartHeight,
            width: chartLeft - layout.padding - 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingRight: layout.spacing.xs,
            opacity: fadeIn(frame, axesStart + sec(0.1), sec(0.3)),
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const yValue = yMax - (i / 4) * (yMax - yMin);
            return (
              <div
                key={`y-label-${i}`}
                style={{
                  fontSize: fontSizes.label,
                  fontWeight: 500,
                  fontFamily: fonts.mono,
                  color: mutedColor,
                  opacity: 0.95,
                  textShadow: shadows.textLift,
                  whiteSpace: "nowrap",
                }}
              >
                {formatNumber(yValue, { decimals: yValue >= 100 ? 0 : 1 })}
                {data.yUnit && <span style={{ marginLeft: 2 }}>{data.yUnit}</span>}
              </div>
            );
          })}
        </div>

        {/* ── X-axis labels ──────────────────────────────────────────────────*/}
        <div
          style={{
            position: "absolute",
            top: chartBottom + 12,
            left: 0,
            width: layout.width,
            height: 40,
            opacity: fadeIn(frame, axesStart + sec(0.1), sec(0.3)),
          }}
        >
          {/* Sample x-axis labels: first, middle, last */}
          {[0, 0.5, 1].map((progress, i) => {
            const xValue = xMin + progress * (xMax - xMin);
            const labelX = getXPosition(xValue, xMin, xMax, chartLeft, chartRight);
            return (
              <div
                key={`x-label-${i}`}
                style={{
                  position: "absolute",
                  left: labelX,
                  transform: "translateX(-50%)",
                  fontSize: fontSizes.label,
                  fontWeight: 500,
                  fontFamily: fonts.mono,
                  color: mutedColor,
                  opacity: 0.95,
                  textShadow: shadows.textLift,
                  whiteSpace: "nowrap",
                }}
              >
                {Math.round(xValue).toString()}
              </div>
            );
          })}
        </div>

        {/* ── X-axis title — appears below the tick labels, centered. */}
        {data.xLabel && (
          <div
            style={{
              position: "absolute",
              top: chartBottom + 56,
              left: chartLeft,
              width: chartRight - chartLeft,
              textAlign: "center",
              fontSize: fontSizes.label,
              fontWeight: 600,
              fontFamily: fonts.heading,
              color: theme.text.secondary,
              letterSpacing: letterSpacing.label,
              textTransform: "uppercase",
              opacity: fadeIn(frame, axesStart + sec(0.2), sec(0.3)) * 0.9,
            }}
          >
            {data.xLabel}
          </div>
        )}

        {/* ── Y-axis title — rotated 90° on the left side of the chart. */}
        {data.yLabel && (
          <div
            style={{
              position: "absolute",
              top: chartTop + (chartBottom - chartTop) / 2,
              left: chartLeft - 88,
              transform: "translateY(-50%) rotate(-90deg)",
              transformOrigin: "center",
              fontSize: fontSizes.label,
              fontWeight: 600,
              fontFamily: fonts.heading,
              color: theme.text.secondary,
              letterSpacing: letterSpacing.label,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              opacity: fadeIn(frame, axesStart + sec(0.2), sec(0.3)) * 0.9,
            }}
          >
            {data.yLabel}
          </div>
        )}

        {/* ── Annotation callouts (text labels) — with collision-avoidance force-layout ──*/}
        {(() => {
          if (!data.annotations) return null;
          // Pre-compute annotation x positions and stack offsets to avoid overlap
          // Stack annotations vertically so clustered labels don't collide.
          // The util in `utils/labelStack` is shared with any chart that
          // needs the same collision-avoidance — keeps the algorithm in
          // one place instead of inlined per-template.
          const annots = data.annotations.map((annot) => ({
            ...annot,
            xPx: getXPosition(annot.x, xMin, xMax, chartLeft, chartRight),
          }));
          const stackByIdx = computeLabelStacks(annots, { collisionThreshold: 80 });
          return data.annotations.map((annot, annotIdx) => {
          const annotX = getXPosition(
            annot.x,
            xMin,
            xMax,
            chartLeft,
            chartRight
          );
          const offsetX = annotX < layout.width / 2 ? 16 : -16;
          const textAnchor = annotX < layout.width / 2 ? "left" : "right";
          const stackOffsetY = stackByIdx[annotIdx] * 40;

          return (
            <div
              key={`annot-label-${annotIdx}`}
              style={{
                position: "absolute",
                left: annotX + offsetX,
                top: chartTop - 60 + stackOffsetY,
                textAlign: textAnchor,
                opacity: annotationOpacity,
              }}
            >
              <div
                style={{
                  fontSize: fontSizes.label,
                  fontFamily: fonts.mono,
                  color: annot.color || accentColor,
                  fontWeight: 600,
                  textShadow: shadows.textLift,
                }}
              >
                {annot.label}
              </div>
              {annot.sublabel && (
                <div
                  style={{
                    fontSize: fontSizes.meta,
                    fontFamily: fonts.mono,
                    color: mutedColor,
                    marginTop: layout.spacing.xs,
                    textShadow: shadows.textLift,
                  }}
                >
                  {annot.sublabel}
                </div>
              )}
            </div>
          );
        });
        })()}

        {/* ── Hero stat (large corner statistic) ──────────────────────────────*/}
        {data.heroStat && (
          <div
            style={{
              position: "absolute",
              top: layout.safeAreaTier.generous.top,
              right: layout.safeAreaTier.generous.right,
              textAlign: "right",
              opacity: fadeIn(frame, heroStatStart, sec(0.5)),
              transform: `scale(${0.92 + 0.08 * heroSpring(frame, layout.fps, heroStatStart)})`,
              transformOrigin: "top right",
            }}
          >
            <div
              style={{
                fontSize: fontSizes.h1,
                fontFamily: fonts.heading,
                fontWeight: 700,
                color: accentColor,
                margin: 0,
                lineHeight: 1.0,
                maxWidth: textMaxWidth.h1,
                textShadow: `0 0 12px ${accentColor}60, ${shadows.textLift}`,
              }}
            >
              {heroStatPrefix && (
                <span style={{ fontSize: fontSizes.h3, marginRight: 2 }}>
                  {heroStatPrefix}
                </span>
              )}
              {Math.round(heroStatValue)}
              {heroStatSuffix && (
                <span style={{ fontSize: fontSizes.h3, marginLeft: 4 }}>
                  {heroStatSuffix}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: fontSizes.caption,
                fontFamily: fonts.mono,
                color: mutedColor,
                marginTop: layout.spacing.sm,
                maxWidth: 200,
                textShadow: shadows.textLift,
              }}
            >
              {data.heroStat.label}
            </div>
          </div>
        )}

        {/* ── Source attribution — uses the shared component so position,
            type, opacity, and fade timing match every other chart. */}
        <SourceAttribution
          source={data.source}
          mode={bgVariant}
          prefix="Source: "
          bottomOffset={sourceBottomOffset}
        />
      </AbsoluteFill>
      {/* Brand strips */}
      <HeaderStrip mode={bgVariant} metadata={data.episode} />
      <FooterStrip mode={bgVariant} />
    </Background>
  );
};

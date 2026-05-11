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
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
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
import type { TimeSeriesChartData, TimeSeriesLine } from "./types";

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

// ── Slope chart renderer ────────────────────────────────────────────────────
//
// Slope chart: each line shows exactly two points (start, end). Renders as a
// pair of dots connected by a straight line, with the label + start value on
// the left and the end value on the right. Crossings indicate ranking
// inversions; divergence indicates widening gaps.
//
// Right form for "approval start vs end of term," "GDP per capita 2000 vs 2024,"
// "literacy 1900 vs 2000." Compresses a complex story to a single readable
// figure where the editorial point is the *change*, not the trajectory.
//
// Reference: references/template-research/time-series-chart.md § 6.2

const SlopeChart: React.FC<{
  lines: TimeSeriesLine[];
  chartLeft: number;
  chartTop: number;
  chartWidth: number;
  chartHeight: number;
  xStartLabel: string;
  xEndLabel: string;
  yUnit: string;
  frame: number;
  mode: "light" | "dark";
}> = React.memo(({
  lines,
  chartLeft,
  chartTop,
  chartWidth,
  chartHeight,
  xStartLabel,
  xEndLabel,
  yUnit,
  frame,
  mode,
}) => {
  const theme = useThemeMode(mode);

  // Compute y-domain across all lines' two points.
  const yValues = lines.flatMap((l) => [l.points[0]?.y ?? 0, l.points[l.points.length - 1]?.y ?? 0]);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  // Pad the domain 5% so dots don't sit on the edge.
  const pad = (yMax - yMin) * 0.08;
  const domainMin = yMin - pad;
  const domainMax = yMax + pad;
  const yScale = (y: number): number =>
    chartTop + chartHeight - ((y - domainMin) / Math.max(1e-9, domainMax - domainMin)) * chartHeight;

  // Two x-positions: inset 28% from each edge so labels have room.
  const leftInset = chartWidth * 0.28;
  const rightInset = chartWidth * 0.28;
  const xStart = chartLeft + leftInset;
  const xEnd = chartLeft + chartWidth - rightInset;

  // Animation: lines draw left → right over 1s starting at 0.4s.
  const drawProgress = interpolate(
    frame,
    [sec(0.4), sec(1.4)],
    [0, 1],
    CLAMP_CUBIC,
  );

  // Order lines by start-y descending so labels stack readably top-to-bottom
  // by initial rank.
  const ordered = [...lines]
    .map((l, originalIdx) => ({ l, originalIdx }))
    .sort((a, b) => (b.l.points[0]?.y ?? 0) - (a.l.points[0]?.y ?? 0));

  return (
    <>
      {/* Slope axis tick labels at top */}
      <div
        style={{
          position: "absolute",
          left: xStart,
          top: chartTop - 36,
          transform: "translateX(-50%)",
          fontSize: fontSizes.label,
          fontFamily: fonts.metadata,
          color: theme.text.muted,
          letterSpacing: 3,
          textTransform: "uppercase",
          opacity: fadeIn(frame, sec(0.2), sec(0.4)),
          whiteSpace: "nowrap",
        }}
      >
        {xStartLabel}
      </div>
      <div
        style={{
          position: "absolute",
          left: xEnd,
          top: chartTop - 36,
          transform: "translateX(-50%)",
          fontSize: fontSizes.label,
          fontFamily: fonts.metadata,
          color: theme.text.muted,
          letterSpacing: 3,
          textTransform: "uppercase",
          opacity: fadeIn(frame, sec(0.3), sec(0.4)),
          whiteSpace: "nowrap",
        }}
      >
        {xEndLabel}
      </div>

      {/* Slope lines + dots */}
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: layout.width,
          height: layout.height,
          pointerEvents: "none",
        }}
      >
        {ordered.map(({ l, originalIdx }) => {
          const y0 = l.points[0]?.y ?? 0;
          const y1 = l.points[l.points.length - 1]?.y ?? 0;
          const cy0 = yScale(y0);
          const cy1 = yScale(y1);
          // Animated end-point during draw
          const cx1Animated = xStart + (xEnd - xStart) * drawProgress;
          const cy1Animated = cy0 + (cy1 - cy0) * drawProgress;
          const lineStart = stagger(originalIdx, sec(0.1), sec(0.4));
          const lineOpacity = fadeIn(frame, lineStart, sec(0.4));
          const isHero = !!l.hero;
          const strokeWidth = isHero ? 3.5 : 2;
          const dotR = isHero ? 7 : 5;

          return (
            <g key={`slope-${originalIdx}`} opacity={lineOpacity}>
              <line
                x1={xStart}
                y1={cy0}
                x2={cx1Animated}
                y2={cy1Animated}
                stroke={l.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              {/* Start dot */}
              <circle cx={xStart} cy={cy0} r={dotR} fill={l.color} />
              {/* End dot — appears when draw completes */}
              <circle
                cx={xEnd}
                cy={cy1}
                r={dotR * (drawProgress > 0.9 ? 1 : 0)}
                fill={l.color}
              />
            </g>
          );
        })}
      </svg>

      {/* Per-line labels: left side has "Label  yStart", right has "yEnd" */}
      {ordered.map(({ l, originalIdx }) => {
        const y0 = l.points[0]?.y ?? 0;
        const y1 = l.points[l.points.length - 1]?.y ?? 0;
        const cy0 = yScale(y0);
        const cy1 = yScale(y1);
        const labelOpacity = fadeIn(frame, stagger(originalIdx, sec(0.1), sec(0.4)), sec(0.5));
        const endLabelOpacity = fadeIn(frame, sec(1.5) + stagger(originalIdx, sec(0.06), 0), sec(0.5));
        const isHero = !!l.hero;
        return (
          <React.Fragment key={`slope-labels-${originalIdx}`}>
            {/* Left: label + start value */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: cy0 - fontSizes.body / 2,
                width: xStart - 18,
                maxWidth: xStart - 18,
                textAlign: "right",
                paddingRight: layout.spacing.md,
                fontSize: fontSizes.body,
                fontFamily: fonts.body,
                fontWeight: isHero ? 600 : 500,
                color: theme.text.primary,
                opacity: labelOpacity,
                lineHeight: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span style={{ color: l.color, fontFamily: fonts.data, marginRight: 8 }}>
                {formatNumber(y0, { decimals: 0, style: y0 >= 10000 ? "abbreviated" : "decimal" })}
                {yUnit}
              </span>
              {l.label}
            </div>
            {/* Right: end value */}
            <div
              style={{
                position: "absolute",
                left: xEnd + 18,
                top: cy1 - fontSizes.body / 2,
                width: chartLeft + chartWidth - xEnd - 18,
                fontSize: isHero ? fontSizes.h3 : fontSizes.body,
                fontFamily: fonts.data,
                fontWeight: isHero ? 700 : 500,
                color: l.color,
                opacity: endLabelOpacity,
                lineHeight: 1,
                whiteSpace: "nowrap",
                textShadow: shadows.textLift,
              }}
            >
              {formatNumber(y1, { decimals: 0, style: y1 >= 10000 ? "abbreviated" : "decimal" })}
              {yUnit}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
});

// ── Small-multiples renderer ────────────────────────────────────────────────
//
// Tufte's small-multiples principle: when comparing 4+ series, a single
// multi-line chart turns into spaghetti — break the comparison into a grid
// of small individual charts that share a y-axis, and the eye reads each
// trajectory cleanly before doing the cross-panel comparison.
//
// Right form for "approval ratings by demographic, six panels," "GDP growth
// by country," "infection waves by region." Wrong for: data where the
// relationship between series IS the point (then use the multi-line chart).
//
// Reference: references/template-research/time-series-chart.md § 6.3

const SmallMultiplesChart: React.FC<{
  lines: TimeSeriesLine[];
  yMin: number;
  yMax: number;
  xMin: number;
  xMax: number;
  yUnit: string;
  chartLeft: number;
  chartTop: number;
  chartWidth: number;
  chartHeight: number;
  frame: number;
  mode: "light" | "dark";
}> = React.memo(({
  lines,
  yMin,
  yMax,
  xMin,
  xMax,
  yUnit,
  chartLeft,
  chartTop,
  chartWidth,
  chartHeight,
  frame,
  mode,
}) => {
  const theme = useThemeMode(mode);

  // Grid dimensions: aim for ~2:1 aspect ratio per panel. For 4-6 series,
  // 3 columns × ceil(n/3) rows reads well at video scale.
  const numPanels = lines.length;
  const cols = numPanels <= 3 ? numPanels : numPanels <= 6 ? 3 : 4;
  const rows = Math.ceil(numPanels / cols);
  const colGap = 24;
  const rowGap = 36;
  const panelWidth = (chartWidth - colGap * (cols - 1)) / cols;
  const panelHeight = (chartHeight - rowGap * (rows - 1)) / rows;
  // Reserve top of each panel for title, bottom for x-axis baseline.
  const titleH = 32;
  const baselineH = 4;
  const plotW = panelWidth;
  const plotH = panelHeight - titleH - baselineH;

  // Find hero panel index (first line marked hero, else none).
  const heroIdx = lines.findIndex((l) => l.hero);

  return (
    <>
      {lines.map((line, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const panelX = chartLeft + col * (panelWidth + colGap);
        const panelY = chartTop + row * (panelHeight + rowGap);
        const plotX0 = panelX;
        const plotY0 = panelY + titleH;
        const isHero = idx === heroIdx;

        // Convert each point to pixel coordinates within this panel's plot box.
        const xRange = xMax - xMin || 1;
        const yRange = yMax - yMin || 1;
        const pointStrings = line.points.map((p) => {
          const xVal = typeof p.x === "string" ? parseFloat(p.x) : p.x;
          const cx = plotX0 + ((xVal - xMin) / xRange) * plotW;
          const cy = plotY0 + plotH - ((p.y - yMin) / yRange) * plotH;
          return `${cx},${cy}`;
        }).join(" ");

        // Line stagger reveal (left → right).
        const lineStart = sec(0.4) + idx * sec(0.15);
        const lineProgress = interpolate(frame, [lineStart, lineStart + sec(0.8)], [0, 1], CLAMP_CUBIC);
        const lineOpacity = fadeIn(frame, lineStart, sec(0.5));

        // Terminal-value label (last point) — Tufte convention.
        const lastPoint = line.points[line.points.length - 1];
        const lastX = typeof lastPoint.x === "string" ? parseFloat(lastPoint.x) : lastPoint.x;
        const terminalX = plotX0 + ((lastX - xMin) / xRange) * plotW;
        const terminalY = plotY0 + plotH - ((lastPoint.y - yMin) / yRange) * plotH;
        const terminalOpacity = fadeIn(frame, lineStart + sec(0.8), sec(0.4));

        return (
          <React.Fragment key={`sm-${idx}`}>
            {/* Panel title */}
            <div
              style={{
                position: "absolute",
                left: panelX,
                top: panelY,
                width: panelWidth,
                fontSize: fontSizes.label,
                fontFamily: fonts.metadata,
                color: isHero ? line.color : theme.text.secondary,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontWeight: isHero ? 700 : 500,
                lineHeight: 1.2,
                opacity: fadeIn(frame, lineStart - sec(0.2), sec(0.4)),
                maxWidth: panelWidth,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {line.label}
            </div>

            {/* Panel baseline (x-axis) + sparse y-axis tick */}
            <svg
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: layout.width,
                height: layout.height,
                pointerEvents: "none",
              }}
            >
              {/* Baseline */}
              <line
                x1={plotX0}
                y1={plotY0 + plotH}
                x2={plotX0 + plotW}
                y2={plotY0 + plotH}
                stroke={theme.text.muted}
                strokeWidth={1}
                opacity={0.35 * fadeIn(frame, lineStart - sec(0.3), sec(0.4))}
              />
              {/* Polyline path with progressive reveal via stroke-dasharray */}
              <polyline
                points={pointStrings}
                fill="none"
                stroke={line.color}
                strokeWidth={isHero ? 3 : 1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={lineOpacity * (isHero ? 1 : 0.8)}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - lineProgress}
              />
              {/* Terminal dot */}
              <circle
                cx={terminalX}
                cy={terminalY}
                r={isHero ? 5 : 3}
                fill={line.color}
                opacity={terminalOpacity}
              />
            </svg>

            {/* Terminal value label */}
            <div
              style={{
                position: "absolute",
                left: terminalX + 8,
                top: terminalY - fontSizes.caption / 2 - 2,
                fontSize: isHero ? fontSizes.body : fontSizes.caption,
                fontFamily: fonts.data,
                fontWeight: isHero ? 700 : 500,
                color: line.color,
                opacity: terminalOpacity,
                whiteSpace: "nowrap",
                lineHeight: 1,
                textShadow: shadows.textLift,
              }}
            >
              {Math.round(lastPoint.y)}
              {yUnit && <span style={{ fontSize: fontSizes.caption, color: theme.text.muted, marginLeft: 2 }}>{yUnit}</span>}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
});

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
        extraPad: { left: 100, right: 220 }, // y-axis label gutter + terminal value label gutter
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
  // SourceAttribution anchors to the standard safe area, so compensate upward to
  // match this template's generous safe-area tier.
  const sourceBottomOffset = data.source
    ? layout.safeAreaTier.generous.bottom - layout.safeAreaTier.standard.bottom
    : 0;

  // Compute axis ranges — memoized so flatMap/min/max don't run every frame
  const { yMin, yMax, xMin, xMax } = useMemo(() => {
    const allYValues = data.lines.flatMap((line) => line.points.map((p) => p.y));
    const referenceYValues = data.referenceLines?.map((r) => r.y) || [];
    // Include band bounds so the chart auto-fits to keep bands visible.
    const bandYValues = data.referenceBands?.flatMap((b) => [b.y1, b.y2]) || [];
    const allYWithReferences = [...allYValues, ...referenceYValues, ...bandYValues];

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
      // Tight headroom (5%) — leaves enough vertical air for the line to
      // breathe but doesn't waste a quarter of the chart on dead space.
      // Terminal labels at the right edge use the chart's right gutter, not
      // the top, so they don't need extra y-headroom.
      if (dataMin >= 0) {
        yMin = 0;
        yMax = dataMax + range * 0.05;
      } else if (dataMax <= 0) {
        yMin = dataMin - range * 0.05;
        yMax = 0;
      } else {
        yMin = dataMin - range * 0.05;
        yMax = dataMax + range * 0.05;
      }
      [yMin, yMax] = niceDomain(yMin, yMax, 5);
    }

    const allXValues = data.lines.flatMap((line) =>
      line.points.map((p) => (typeof p.x === "string" ? parseFloat(p.x) : p.x))
    );
    const xMin = allXValues.length > 0 ? Math.min(...allXValues) : 0;
    const xMax = allXValues.length > 0 ? Math.max(...allXValues) : 1;

    return { yMin, yMax, xMin, xMax };
  }, [data.lines, data.referenceLines, data.referenceBands, data.yRange]);

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

  // Pre-resolve each annotation's pixel position against the first line that
  // either contains the x value or has adjacent points to interpolate between.
  // Used by BOTH the SVG dot/leader-line rendering and the HTML label, so they
  // stay in sync (avoids the regression where label sat at chartTop-60 and dot
  // sat on the actual data point).
  const annotationPositions = useMemo(() => {
    if (!data.annotations) return [] as Array<{ xPx: number; yPx: number; resolved: boolean }>;
    return data.annotations.map((annot) => {
      const annotXNumeric = typeof annot.x === "string" ? parseFloat(annot.x) : annot.x;
      for (const line of data.lines) {
        const pts = line.points;
        for (let i = 0; i < pts.length; i++) {
          const px = typeof pts[i].x === "string" ? parseFloat(pts[i].x as string) : (pts[i].x as number);
          if (px === annotXNumeric) {
            return {
              xPx: getXPosition(pts[i].x, xMin, xMax, chartLeft, chartRight),
              yPx: getYPosition(pts[i].y, yMin, yMax, chartTop, chartBottom),
              resolved: true,
            };
          }
          if (i > 0) {
            const prev = pts[i - 1];
            const prevX = typeof prev.x === "string" ? parseFloat(prev.x as string) : (prev.x as number);
            if (prevX < annotXNumeric && annotXNumeric < px) {
              const t = (annotXNumeric - prevX) / (px - prevX);
              const interpY = prev.y + t * (pts[i].y - prev.y);
              return {
                xPx: getXPosition(annotXNumeric, xMin, xMax, chartLeft, chartRight),
                yPx: getYPosition(interpY, yMin, yMax, chartTop, chartBottom),
                resolved: true,
              };
            }
          }
        }
      }
      return { xPx: chartLeft, yPx: chartBottom, resolved: false };
    });
  }, [data.annotations, data.lines, xMin, xMax, yMin, yMax, chartLeft, chartRight, chartTop, chartBottom]);

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

  // ── Slope variant early return — uses SlopeChart sub-renderer ────────────
  // Slope is structurally simpler than line: no era shading, no annotations,
  // no reference lines — just paired endpoints with crossings/divergence as
  // the visual argument. See: references/template-research/time-series-chart.md § 6.2
  if (data.variant === "slope") {
    const firstPoint = data.lines[0]?.points[0];
    const lastPoint = data.lines[0]?.points[data.lines[0].points.length - 1];
    const startLabel = data.xLabel?.split("→")[0]?.trim() || String(firstPoint?.x ?? "Start");
    const endLabel = data.xLabel?.split("→")[1]?.trim() || String(lastPoint?.x ?? "End");
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
        <AbsoluteFill
          style={{
            opacity: contentOpacity,
            transform: `scale(${driftScale})`,
            transformOrigin: "center center",
          }}
        >
          <TitleBlock title={data.title} subtitle={data.subtitle} mode={bgVariant} safeAreaTier="generous" />
          <SlopeChart
            lines={data.lines}
            chartLeft={chartLeft}
            chartTop={chartTop}
            chartWidth={chartWidth}
            chartHeight={chartHeight}
            xStartLabel={startLabel}
            xEndLabel={endLabel}
            yUnit={data.yUnit || ""}
            frame={frame}
            mode={bgVariant}
          />
          {data.source && (
            <SourceAttribution source={data.source} mode={bgVariant} prefix="Source: " bottomOffset={sourceBottomOffset} />
          )}
          <HeaderStrip mode={bgVariant} metadata={data.episode} />
          <FooterStrip mode={bgVariant} />
        </AbsoluteFill>
      </Background>
    );
  }

  // ── Small-multiples variant early return ─────────────────────────────────
  // N small panels in a grid sharing y-domain. Use when series > 4 and a
  // multi-line chart would be spaghetti. See: time-series-chart.md § 6.3
  if (data.variant === "small-multiples") {
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
        <AbsoluteFill
          style={{
            opacity: contentOpacity,
            transform: `scale(${driftScale})`,
            transformOrigin: "center center",
          }}
        >
          <TitleBlock title={data.title} subtitle={data.subtitle} mode={bgVariant} safeAreaTier="generous" />
          <SmallMultiplesChart
            lines={data.lines}
            yMin={yMin}
            yMax={yMax}
            xMin={xMin}
            xMax={xMax}
            yUnit={data.yUnit || ""}
            chartLeft={chartLeft}
            chartTop={chartTop}
            chartWidth={chartWidth}
            chartHeight={chartHeight}
            frame={frame}
            mode={bgVariant}
          />
          {data.source && (
            <SourceAttribution source={data.source} mode={bgVariant} prefix="Source: " bottomOffset={sourceBottomOffset} />
          )}
          <HeaderStrip mode={bgVariant} metadata={data.episode} />
          <FooterStrip mode={bgVariant} />
        </AbsoluteFill>
      </Background>
    );
  }

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
                    boxShadow: `0 1px 2px ${line.color}55`, // shadows.subtle accent variant (1px offset, 55% opacity)
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
            // Era bands span large ranges of the chart — a "subtle" 0.08 fill
            // becomes visually heavy when 80% of the canvas is covered by it.
            // Clamp to 0.05 unless the data explicitly requests more.
            const eraOpacity = Math.min(era.opacity ?? 0.05, 0.05) * eraFadeOpacity;
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

          {/* ── Reference bands (horizontal shaded ranges) ───────────────────
              Render BEFORE reference lines and data so the band sits behind
              everything. Use for "deviation from baseline" stories — the data
              line crossing a band is the editorial point.
              See: references/template-research/time-series-chart.md § 6.5 */}
          {data.referenceBands?.map((band, bandIdx) => {
            const y1Px = getYPosition(
              Math.max(band.y1, band.y2),  // upper bound of band (visually higher = smaller y px)
              yMin,
              yMax,
              chartTop,
              chartBottom,
            );
            const y2Px = getYPosition(
              Math.min(band.y1, band.y2),
              yMin,
              yMax,
              chartTop,
              chartBottom,
            );
            const bandColor = band.color || mutedColor;
            const bandFillOpacity = band.opacity ?? 0.1;
            // Band fades in slightly before reference lines so it reads as
            // chart structure, not as a late annotation.
            const bandOpacity = fadeIn(
              frame,
              axesStart + bandIdx * sec(0.1),
              sec(0.5),
            );
            return (
              <g key={`band-${bandIdx}`} opacity={bandOpacity}>
                <rect
                  x={chartLeft}
                  y={y1Px}
                  width={chartWidth}
                  height={Math.max(1, y2Px - y1Px)}
                  fill={bandColor}
                  fillOpacity={bandFillOpacity}
                />
                {band.label && (
                  <text
                    x={chartRight - 12}
                    y={(y1Px + y2Px) / 2 + 5}
                    fill={bandColor}
                    fontSize={fontSizes.caption}
                    fontFamily={fonts.metadata}
                    fontWeight={500}
                    textAnchor="end"
                    opacity={0.7}
                    style={{ letterSpacing: 1.5, textTransform: "uppercase" }}
                  >
                    {band.label}
                  </text>
                )}
              </g>
            );
          })}

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

            // Hero/supporting hierarchy: when any line in the dataset is
            // marked `hero`, supporting lines render thinner and at reduced
            // opacity so the protagonist's trajectory dominates. If no line
            // is a hero, every line gets the standard treatment.
            //
            // Stroke weights: video scrub legibility (8–12s read time) needs
            // ~2× print weight. Canon (NYT/FT static charts) uses 2.5px hero /
            // 1.5px supporting; we use 5/2 here (≈ 2× canon). The single-series
            // no-hero default is 3.5 — halfway between hero and supporting,
            // appropriate when there's no editorial protagonist.
            //
            // Override via `line.width` per-line. See:
            // references/template-research/time-series-chart.md § 6.1
            const HERO_STROKE_WIDTH = 5;
            const SUPPORTING_STROKE_WIDTH = 2;
            const SOLO_STROKE_WIDTH = 3.5;
            const anyHero = data.lines.some((l) => l.hero);
            const isHero = line.hero;
            const heroStroke = anyHero
              ? (isHero ? (line.width ?? HERO_STROKE_WIDTH) : (line.width ?? SUPPORTING_STROKE_WIDTH))
              : (line.width ?? SOLO_STROKE_WIDTH);
            const heroOpacity = anyHero && !isHero ? 0.55 : 1;
            return (
              <polyline
                key={`line-${lineIdx}`}
                points={linePointStrings[lineIdx]}
                fill="none"
                stroke={line.color}
                strokeWidth={heroStroke}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={line.dashed ? "8,4" : undefined}
                strokeDashoffset={lineStyle.strokeDashoffset as number}
                opacity={
                  fadeIn(frame, lineDrawStart_frame, sec(0.2)) * exitOpacity * heroOpacity
                }
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
            const pos = annotationPositions[annotIdx];
            const annotX = pos?.xPx ?? chartLeft;
            const annotY = pos?.yPx ?? chartBottom;

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

          {/* ── Terminal value labels (right edge of each line) ─────────────*/}
          {/* Editorial idiom: every line gets its current/final value labeled
              at the right edge, anchoring the eye's destination. Labels
              auto-stack vertically when two lines' endpoints fall within ~32px
              of each other to avoid collision. */}
          {(() => {
            const labelStart = lineStartFrames.length > 0
              ? lineStartFrames[lineStartFrames.length - 1] + lineDrawDuration
              : sec(2);
            const baseOpacity = fadeIn(frame, labelStart, sec(0.5)) * exitOpacity;
            if (baseOpacity < 0.01) return null;
            const anyHero = data.lines.some((l) => l.hero);

            // Compute desired label y for each line (= last point's y) and
            // sort by y. Then push labels down to enforce a minimum gap.
            const labelEntries = data.lines
              .map((line, idx) => {
                const pts = linePixelPoints[idx];
                if (pts.length === 0) return null;
                const last = pts[pts.length - 1];
                const lastValue = line.points[line.points.length - 1].y;
                return {
                  idx,
                  line,
                  endX: last.x,
                  endY: last.y,
                  value: lastValue,
                };
              })
              .filter((e): e is NonNullable<typeof e> => e !== null)
              .sort((a, b) => a.endY - b.endY);

            const minGap = 36;
            const placed = [...labelEntries];
            for (let i = 1; i < placed.length; i++) {
              const prev = placed[i - 1];
              if (placed[i].endY - prev.endY < minGap) {
                placed[i] = { ...placed[i], endY: prev.endY + minGap };
              }
            }

            return placed.map((entry) => {
              const isHero = entry.line.hero;
              const labelOpacity = baseOpacity * (anyHero && !isHero ? 0.7 : 1);
              return (
                <g key={`terminal-${entry.idx}`} opacity={labelOpacity}>
                  {/* Tiny dot at the actual line endpoint */}
                  <circle
                    cx={entry.endX}
                    cy={entry.line.points[entry.line.points.length - 1].y === entry.value
                      ? getYPosition(entry.value, yMin, yMax, chartTop, chartBottom)
                      : entry.endY}
                    r={4}
                    fill={entry.line.color}
                  />
                  {/* Value (bold, color-matched) */}
                  <text
                    x={entry.endX + 14}
                    y={entry.endY}
                    fill={entry.line.color}
                    fontSize={isHero ? fontSizes.h3 : fontSizes.label}
                    fontWeight={700}
                    fontFamily={fonts.data}
                    dominantBaseline="middle"
                  >
                    {formatNumber(entry.value, { decimals: entry.value >= 100 ? 0 : 1 })}
                    {data.yUnit && (
                      <tspan fontSize={fontSizes.label} fill={mutedColor}>
                        {data.yUnit}
                      </tspan>
                    )}
                  </text>
                  {/* Source label (small, muted) — under the value */}
                  <text
                    x={entry.endX + 14}
                    y={entry.endY + (isHero ? 22 : 18)}
                    fill={mutedColor}
                    fontSize={fontSizes.meta}
                    fontWeight={500}
                    fontFamily={fonts.mono}
                    dominantBaseline="middle"
                    letterSpacing={letterSpacing.meta}
                  >
                    {entry.line.label.toUpperCase()}
                  </text>
                </g>
              );
            });
          })()}
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
            // Show the unit only on the topmost tick — subsequent ticks omit
            // it (Tufte-style: state the unit once, then let numerals carry
            // the meaning). Drops "M / M / M / M / M" or "ppm / ppm / ppm…"
            // visual noise on every tick.
            const isTop = i === 0;
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
                {isTop && data.yUnit && <span style={{ marginLeft: 2 }}>{data.yUnit}</span>}
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
          {/* X-axis tick labels — adaptive density. For year-style x ranges
              we target ~6 ticks at human-readable intervals (decade or
              quarter-century). For short ranges (≤30 years) we step every
              5 years; for longer ranges we step every 25 or 50 years. */}
          {((): number[] => {
            const span = xMax - xMin;
            // Pick a step that produces 5–7 ticks for the given span.
            const candidates = [1, 2, 5, 10, 25, 50, 100];
            const targetTicks = 6;
            let step = candidates[candidates.length - 1];
            for (const c of candidates) {
              if (span / c <= targetTicks + 1) { step = c; break; }
            }
            const first = Math.ceil(xMin / step) * step;
            const ticks: number[] = [];
            for (let v = first; v <= xMax + 0.001; v += step) ticks.push(v);
            // Ensure first and last data points are represented even if they
            // don't land on a step boundary (e.g. 1850–2024 with step 25
            // would otherwise miss 2024).
            if (ticks[0] !== xMin) ticks.unshift(xMin);
            if (ticks[ticks.length - 1] !== xMax) ticks.push(xMax);
            // Drop ticks that would crowd the start/end markers.
            return ticks.filter((v, i, arr) => {
              if (i === 0 || i === arr.length - 1) return true;
              const prev = arr[i - 1];
              const next = arr[i + 1];
              return v - prev >= step * 0.6 && next - v >= step * 0.6;
            });
          })().map((xValue, i) => {
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

        {/* ── Annotation callouts (text labels) ─────────────────────────────
            Labels sit close to the data point with a short leader-line.
            Stacking is handled by computeLabelStacks for clustered annotations.
            Drops the previous "labels float at chartTop - 60" behavior — the
            label is now visually connected to the moment it describes. */}
        {(() => {
          if (!data.annotations) return null;
          const annots = data.annotations.map((annot, idx) => ({
            ...annot,
            xPx: annotationPositions[idx]?.xPx ?? chartLeft,
          }));
          const stackByIdx = computeLabelStacks(annots, { collisionThreshold: 120 });
          return data.annotations.map((annot, annotIdx) => {
            const pos = annotationPositions[annotIdx];
            if (!pos) return null;
            const isRightHalf = pos.xPx > chartLeft + (chartRight - chartLeft) * 0.6;
            // Label sits ~60px above the dot by default; offsets to the LEFT
            // when the dot is in the right portion of the chart so it stays
            // inside the chart bounds.
            const labelOffsetX = isRightHalf ? -16 : 16;
            const labelOffsetY = -56 - stackByIdx[annotIdx] * 40;
            const labelX = pos.xPx + labelOffsetX;
            const labelY = pos.yPx + labelOffsetY;
            const textAlign = isRightHalf ? "right" : "left";
            return (
              <div
                key={`annot-label-${annotIdx}`}
                style={{
                  position: "absolute",
                  left: isRightHalf ? undefined : labelX,
                  right: isRightHalf ? layout.width - labelX : undefined,
                  top: labelY,
                  textAlign,
                  opacity: annotationOpacity,
                  maxWidth: 240,
                }}
              >
                <div
                  style={{
                    fontSize: fontSizes.label,
                    fontFamily: fonts.mono,
                    color: annot.color || accentColor,
                    fontWeight: 600,
                    textShadow: shadows.textLift,
                    maxWidth: textMaxWidth.label,
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
                      maxWidth: textMaxWidth.label,
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

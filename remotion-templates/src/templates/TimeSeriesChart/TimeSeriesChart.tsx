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
  Easing,
} from "remotion";
import {
  palette,
  dark,
  light,
  semantic,
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  contentArea,
  cardPadding,
  textMaxWidth,
} from "../../design/theme";
import {
  fadeIn,
  stagger,
  exitFade,
  bloomIntensity,
  easings,
  gridlineDraw,
  kenBurnsDrift,
  CLAMP,
  scaleReveal,
} from "../../utils/animation";
import {
  lineDrawProgress,
  lineDrawStyle,
  distance,
} from "../../utils/drawLine";
import {
  countUpValue,
  formatValue,
} from "../../utils/countUp";
import { Background } from "../../components/Background";
import { FadeIn } from "../../components/FadeIn";
import { TitleBlock } from "../../components/TitleBlock";
import type { TimeSeriesChartData, TimeSeriesPoint } from "./types";

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
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Extract colors from theme or use semantic defaults
  const bgVariant = data.backgroundVariant || "light";
  const mode = bgVariant === "dark" ? dark : light;
  const bgColor = mode.bg.base;
  const textColor = mode.text.primary;
  const mutedColor = mode.text.muted;
  const accentColor = mode.text.accent;






  // Safe area calculations (80px padding, 140px top for title)
  const chartPaddingLeft = 100;
  const chartPaddingRight = 100;
  const chartPaddingTop = 180;
  const chartPaddingBottom = 100;
  const chartLeft = layout.padding + chartPaddingLeft;
  const chartRight = layout.width - layout.padding - chartPaddingRight;
  const chartTop = layout.padding + chartPaddingTop;
  const chartBottom = layout.height - layout.padding - chartPaddingBottom;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Compute axis ranges
  const allYValues = data.lines.flatMap((line) =>
    line.points.map((p) => p.y)
  );
  const referenceYValues = data.referenceLines?.map((r) => r.y) || [];
  const allYWithReferences = [...allYValues, ...referenceYValues];

  let yMin = Math.min(...allYWithReferences);
  let yMax = Math.max(...allYWithReferences);

  if (data.yRange) {
    [yMin, yMax] = data.yRange;
  } else {
    // Auto-range with 10% padding
    const yRange = yMax - yMin || 1;
    yMin = yMin - yRange * 0.1;
    yMax = yMax + yRange * 0.1;
  }

  const allXValues = data.lines.flatMap((line) =>
    line.points.map((p) => (typeof p.x === "string" ? parseFloat(p.x) : p.x))
  );
  const xMin = Math.min(...allXValues);
  const xMax = Math.max(...allXValues);

  // Generate polyline points string for each line
  const linePointStrings = useMemo(
    () =>
      data.lines.map((line) =>
        line.points
          .map((p) => {
            const px = getXPosition(p.x, xMin, xMax, chartLeft, chartRight);
            const py = getYPosition(p.y, yMin, yMax, chartTop, chartBottom);
            return `${px},${py}`;
          })
          .join(" ")
      ),
    [data.lines, xMin, xMax, yMin, yMax]
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

  // Animation frame markers
  const titleStart = 0;
  const axesStart = sec(0.2);
  const eraStart = sec(0.5);
  const lineDrawStart = sec(0.8);
  const lineDrawDuration = sec(1.3);
  const areaFillStart = sec(1.8);
  const annotationStart = sec(2);
  const heroStatStart = sec(2.3);
  const exitStart = durationInFrames - sec(0.5);

  // ── Title animation ────────────────────────────────────────────────────────
  const titleOpacity = fadeIn(frame, titleStart, sec(0.5));

  // ── Gridlines (5 horizontal lines across the chart) ──────────────────────
  const gridlineCount = 5;
  const gridlineStartFrame = axesStart;

  // ── Era bands (background rectangles) ────────────────────────────────────
  const eraFadeOpacity = fadeIn(frame, eraStart, sec(0.4));

  // ── Line drawing animations ──────────────────────────────────────────────
  // Each line draws with stagger
  const lineStartFrames = data.lines.map((_, i) =>
    lineDrawStart + stagger(i, sec(0.2), 0)
  );

  // ── Annotations ────────────────────────────────────────────────────────────
  const annotationOpacity = fadeIn(frame, annotationStart, sec(0.4));

  // ── Hero stat (large corner statistic) ──────────────────────────────────
  let heroStatValue = 0;
  if (data.heroStat) {
    // Parse the numeric part of the value string (e.g., "65%" → 65)
    const numericStr = data.heroStat.value.replace(/[^\d.]/g, "");
    const parsed = parseFloat(numericStr);
    heroStatValue = isNaN(parsed) ? 0 : parsed;

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

  // ── Ken Burns drift + exit ──────────────────────────────────────────────
  const driftScale = kenBurnsDrift(frame, durationInFrames, 1.01);
  const exitOpacity = exitFade(frame, durationInFrames, sec(0.5));

  const contentOpacity = Math.min(exitOpacity, 1);

  return (
    <Background
      variant={bgVariant}
      tint={data.backgroundTint}
      atmosphere="normal"
    >
      <AbsoluteFill
        style={{
          opacity: contentOpacity,
          transform: `scale(${driftScale})`,
          transformOrigin: "center center",
        }}
      >
        {/* ── Title ──────────────────────────────────────────────────────────*/}
        <FadeIn startFrame={titleStart} direction="down" duration={sec(0.5)}>
          <div
            style={{
              position: "absolute",
              top: layout.padding + 20,
              left: layout.padding + 20,
              right: layout.padding + 20,
              textAlign: "left",
              opacity: titleOpacity,
            }}
          >
            <h1
              style={{
                fontSize: fontSizes.h2,
                fontFamily: fonts.heading,
                fontWeight: 700,
                color: textColor,
                margin: 0,
                marginBottom: layout.spacing.xs,
                textShadow: shadows.textLift,
                letterSpacing: 2,
              }}
            >
              {data.title}
            </h1>
            {data.subtitle && (
              <p
                style={{
                  fontSize: fontSizes.label,
                  fontFamily: fonts.mono,
                  color: mutedColor,
                  margin: 0,
                  marginTop: layout.spacing.xs,
                  textShadow: shadows.textLift,
                }}
              >
                {data.subtitle}
              </p>
            )}
          </div>
        </FadeIn>

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
          {/* ── Era bands (background) ──────────────────────────────────────*/}
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
            const eraOpacity = (era.opacity ?? 0.08) * eraFadeOpacity;

            return (
              <rect
                key={`era-${eraIdx}`}
                x={eraFromX}
                y={chartTop}
                width={eraToX - eraFromX}
                height={chartHeight}
                fill={era.color}
                opacity={eraOpacity}
              />
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
                strokeWidth={0.5}
                opacity={0.2}
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
            const refColor = refLine.color || palette.amber;
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
                    (line.areaOpacity ?? 0.15) *
                    interpolate(frame, [areaFillStart + sec(lineIdx * 0.1), areaFillStart + sec(0.4)], [0, 1], CLAMP)
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
                strokeWidth={line.width ?? 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={line.dashed ? "8,4" : undefined}
                strokeDashoffset={lineStyle.strokeDashoffset as number}
                opacity={fadeIn(frame, lineDrawStart_frame, sec(0.2))}
              />
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
                {/* Dot marker */}
                {annot.dot !== false && (
                  <circle
                    cx={annotX}
                    cy={annotY}
                    r={4}
                    fill={annotColor}
                    opacity={annotDotOpacity}
                  />
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
            bottom: chartPaddingBottom,
            width: chartPaddingLeft - 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingRight: 8,
            opacity: fadeIn(frame, axesStart + sec(0.1), sec(0.3)),
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const yValue = yMax - (i / 4) * (yMax - yMin);
            return (
              <div
                key={`y-label-${i}`}
                style={{
                  fontSize: fontSizes.meta,
                  fontFamily: fonts.mono,
                  color: mutedColor,
                  textShadow: shadows.textLift,
                }}
              >
                {Math.round(yValue)}
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
            left: chartLeft,
            right: chartRight,
            height: 40,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            opacity: fadeIn(frame, axesStart + sec(0.1), sec(0.3)),
          }}
        >
          {/* Sample x-axis labels: first, middle, last */}
          {[0, 0.5, 1].map((progress, i) => {
            const xValue = xMin + progress * (xMax - xMin);
            return (
              <div
                key={`x-label-${i}`}
                style={{
                  fontSize: fontSizes.meta,
                  fontFamily: fonts.mono,
                  color: mutedColor,
                  textShadow: shadows.textLift,
                }}
              >
                {Math.round(xValue)}
              </div>
            );
          })}
        </div>

        {/* ── Annotation callouts (text labels) ──────────────────────────────*/}
        {data.annotations?.map((annot, annotIdx) => {
          const annotX = getXPosition(
            annot.x,
            xMin,
            xMax,
            chartLeft,
            chartRight
          );
          const offsetX = annotX < layout.width / 2 ? 16 : -16;
          const textAnchor = annotX < layout.width / 2 ? "left" : "right";

          return (
            <div
              key={`annot-label-${annotIdx}`}
              style={{
                position: "absolute",
                left: annotX + offsetX,
                top: chartTop - 60,
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
        })}

        {/* ── Hero stat (large corner statistic) ──────────────────────────────*/}
        {data.heroStat && (
          <div
            style={{
              position: "absolute",
              top: layout.padding + 20,
              right: layout.padding + 20,
              textAlign: "right",
              opacity: fadeIn(frame, heroStatStart, sec(0.5)),
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontFamily: fonts.mono,
                fontWeight: 700,
                color: accentColor,
                margin: 0,
                lineHeight: 1.0,
                textShadow: `0 0 12px ${accentColor}60, ${shadows.textLift}`,
              }}
            >
              {Math.round(heroStatValue)}
              <span style={{ fontSize: 32, marginLeft: 4 }}>
                {data.heroStat.value.replace(/[\d.]/g, "")}
              </span>
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

        {/* ── Source attribution ──────────────────────────────────────────────*/}
        {data.source && (
          <div
            style={{
              position: "absolute",
              bottom: layout.padding + 20,
              right: layout.padding + 20,
              fontSize: fontSizes.meta,
              fontFamily: fonts.mono,
              color: mutedColor,
              textShadow: shadows.textLift,
              maxWidth: 300,
              textAlign: "right",
              opacity: fadeIn(frame, axesStart, sec(0.5)),
            }}
          >
            {data.source}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};

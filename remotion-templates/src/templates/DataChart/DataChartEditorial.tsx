/**
 * DataChartEditorial — render path for DataChart when `data.frame` is set.
 *
 * Wraps the bar geometry inside <EditorialFrame> with NYT-Upshot / FT / Economist
 * composition: kicker + heroStat + title + dek + multi-annotation overlay +
 * reference lines + top-aligned legend + publication chrome.
 *
 * This is the opt-in render path. When `data.frame` is absent, DataChart.tsx
 * falls through to its existing render code (intelligence-briefing register).
 *
 * Architecture: remotion-templates/EDITORIAL_FRAME_ARCHITECTURE.md
 */

import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
} from "../../design/theme";
import { fadeIn, easings, CLAMP_CUBIC } from "../../utils/animation";
import { formatNumber } from "../../utils/numberFormat";
import { niceDomain, niceTicks } from "../../utils/niceTicks";
import { useDirection } from "../../hooks/useDirection";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { EditorialFrame } from "../../components/EditorialFrame/EditorialFrame";
import type { Rect, ChartHelpers } from "../../components/EditorialFrame/EditorialFrame";
import { AnnotationOverlay } from "../../components/EditorialFrame/AnnotationOverlay";
import { ReferenceLineOverlay } from "../../components/EditorialFrame/ReferenceLineOverlay";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { DataChartData, DataPoint } from "./types";

interface DataChartEditorialProps {
  data: DataChartData & {
    frame: NonNullable<DataChartData["frame"]>;
  };
}

export const DataChartEditorial: React.FC<DataChartEditorialProps> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = useThemeMode("light");
  // Resolve direction (none-drift default — chart should not Ken Burns under
  // the editorial frame; the frame handles its own composition animation).
  useDirection(data._direction, "none");
  useCompositionAnimation();

  // Bar geometry
  const dataPoints = data.dataPoints ?? [];
  const maxValue = useMemo(
    () =>
      dataPoints.length > 0
        ? Math.max(...dataPoints.map((d) => d.value))
        : 1,
    [dataPoints],
  );
  const [niceMin, niceMax] = useMemo(() => niceDomain(0, maxValue), [maxValue]);
  const yTicks = useMemo(() => niceTicks(niceMin, niceMax, 5), [niceMin, niceMax]);
  const yAxisMax = yTicks[yTicks.length - 1] ?? maxValue;

  return (
    <EditorialFrame
      frame={data.frame}
      episode={data.episode}
      durationInFrames={durationInFrames}
      annotationOverlay={(chartRect, helpers) =>
        renderOverlays(data, chartRect, helpers, frame, yAxisMax, dataPoints)
      }
    >
      {(chartRect, _helpers) => (
        <BarsContent
          dataPoints={dataPoints}
          chartRect={chartRect}
          yAxisMax={yAxisMax}
          yTicks={yTicks}
          frame={frame}
          data={data}
        />
      )}
    </EditorialFrame>
  );
};

// ── Bars content (renders inside the chart rect) ─────────────────────────────

const BarsContent: React.FC<{
  dataPoints: DataPoint[];
  chartRect: Rect;
  yAxisMax: number;
  yTicks: number[];
  frame: number;
  data: DataChartData;
}> = ({ dataPoints, chartRect, yAxisMax, yTicks, frame, data }) => {
  const theme = useThemeMode("light");

  if (dataPoints.length === 0) return null;

  const barGap = chartRect.width / (dataPoints.length * 3);
  const totalGapSpace = barGap * (dataPoints.length - 1);
  const barWidth = (chartRect.width - totalGapSpace) / dataPoints.length;
  const maxHeight = chartRect.height - 40; // leave room for x-labels

  const highlight = data.highlightIndex;
  const someHighlighted =
    highlight !== undefined && highlight >= 0 && highlight < dataPoints.length;

  return (
    <>
      {/* Gridlines */}
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: chartRect.width,
          height: chartRect.height,
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        {yTicks.map((tickValue, i) => {
          const y = maxHeight * (1 - tickValue / yAxisMax);
          const lineProgress = interpolate(
            frame,
            [sec(0.2) + i * sec(0.06), sec(0.2) + i * sec(0.06) + sec(0.6)],
            [0, 1],
            CLAMP_CUBIC,
          );
          return (
            <g key={i} opacity={0.55}>
              <line
                x1={0}
                y1={y}
                x2={chartRect.width * lineProgress}
                y2={y}
                stroke={theme.text.muted}
                strokeWidth={0.5}
                strokeOpacity={0.2}
              />
              <text
                x={-12}
                y={y + 4}
                fill={theme.text.muted}
                textAnchor="end"
                style={{
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.meta,
                  letterSpacing: letterSpacing.meta,
                }}
                opacity={lineProgress}
              >
                {data.formatAsYear
                  ? `${Math.round(tickValue)}`
                  : formatNumber(tickValue)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Bars */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: chartRect.width,
          height: chartRect.height,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        {dataPoints.map((dp, i) => {
          const startFrame = sec(0.4) + i * sec(0.12);
          const grow = interpolate(
            frame,
            [startFrame, startFrame + sec(1.0)],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easings.bar },
          );
          const barHeight = maxHeight * (dp.value / yAxisMax) * grow;
          const isHighlighted = i === data.highlightIndex;
          const isMuted = someHighlighted && !isHighlighted;
          const color = dp.color ?? palette.gold;
          const renderColor = isMuted ? `${palette.ink}33` : color;

          // Label opacity timed slightly after bar reaches full height
          const labelFade = fadeIn(frame, startFrame + sec(0.7), sec(0.4));

          return (
            <div
              key={i}
              style={{
                width: barWidth,
                height: maxHeight,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {/* Inline value label INSIDE the bar near top */}
              <div
                style={{
                  position: "absolute",
                  bottom: barHeight + 12,
                  fontFamily: fonts.heading,
                  fontSize: fontSizes.h3,
                  fontWeight: fontWeights.bold,
                  color: isMuted ? `${palette.ink}66` : theme.text.primary,
                  opacity: labelFade,
                  letterSpacing: -0.5,
                  whiteSpace: "nowrap",
                }}
              >
                {data.formatAsYear ? `${dp.value}` : formatNumber(dp.value)}
              </div>
              {/* Bar */}
              <div
                style={{
                  width: barWidth,
                  height: barHeight,
                  backgroundColor: renderColor,
                }}
              />
              {/* X-axis label */}
              <div
                style={{
                  position: "absolute",
                  bottom: -28,
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.meta,
                  color: isMuted ? `${palette.ink}66` : theme.text.muted,
                  letterSpacing: letterSpacing.meta,
                  textTransform: "uppercase",
                  opacity: labelFade,
                  whiteSpace: "nowrap",
                }}
              >
                {dp.label}
              </div>
              {/* Sublabel */}
              {dp.sublabel && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -50,
                    fontFamily: fonts.serifBody,
                    fontStyle: "italic",
                    fontSize: fontSizes.caption,
                    color: isMuted ? `${palette.ink}66` : theme.text.muted,
                    opacity: labelFade,
                    whiteSpace: "nowrap",
                    maxWidth: barWidth * 2,
                    textAlign: "center",
                  }}
                >
                  {dp.sublabel}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

// ── Overlay rendering (annotations + reference lines) ────────────────────────

function renderOverlays(
  data: DataChartData,
  chartRect: Rect,
  _helpers: ChartHelpers,
  frame: number,
  yAxisMax: number,
  dataPoints: DataPoint[],
): React.ReactNode {
  const frameProps = data.frame;
  if (!frameProps) return null;

  const maxHeight = chartRect.height - 40;
  const barCount = dataPoints.length;
  const barGap = chartRect.width / (barCount * 3);
  const totalGapSpace = barGap * (barCount - 1);
  const barWidth = (chartRect.width - totalGapSpace) / barCount;

  // Compute bar-center pixel positions in chartRect-relative coords
  const barPxFor = (idx: number): { x: number; y: number } => {
    const dp = dataPoints[idx];
    if (!dp) return { x: chartRect.x, y: chartRect.y + maxHeight };
    const barLeft = chartRect.x + idx * (barWidth + barGap);
    const barCenterX = barLeft + barWidth / 2;
    const barTopY = chartRect.y + maxHeight - (maxHeight * dp.value) / yAxisMax;
    return { x: barCenterX, y: barTopY };
  };

  // Annotations
  const annotationPositions = (frameProps.annotations ?? []).map((ann) => {
    if (ann.targetDataPoint !== undefined) {
      return { annotation: ann, targetPx: barPxFor(ann.targetDataPoint) };
    }
    if (ann.targetCoordinate) {
      const [nx, ny] = ann.targetCoordinate;
      return {
        annotation: ann,
        targetPx: {
          x: chartRect.x + nx * chartRect.width,
          y: chartRect.y + ny * chartRect.height,
        },
      };
    }
    // Fallback: chart center
    return {
      annotation: ann,
      targetPx: {
        x: chartRect.x + chartRect.width / 2,
        y: chartRect.y + chartRect.height / 2,
      },
    };
  });

  // Reference lines — map y-axis values to pixels
  const referenceLinePositions = (frameProps.referenceLines ?? []).map((line) => {
    if ((line.axis ?? "y") === "y") {
      const y = chartRect.y + maxHeight - (maxHeight * line.value) / yAxisMax;
      return { line, pxValue: y };
    }
    // x-axis reference: treat value as fraction of width (0..1) for now
    const x = chartRect.x + line.value * chartRect.width;
    return { line, pxValue: x };
  });

  return (
    <>
      {referenceLinePositions.length > 0 && (
        <ReferenceLineOverlay
          lines={referenceLinePositions}
          chartRect={chartRect}
          frameNum={frame}
        />
      )}
      {annotationPositions.length > 0 && (
        <AnnotationOverlay
          positions={annotationPositions}
          chartRect={chartRect}
          frameNum={frame}
        />
      )}
    </>
  );
}

/**
 * TimeSeriesChartEditorial — editorial render path for TimeSeriesChart.
 *
 * Wraps line/area rendering inside EditorialFrame with NYT-Upshot / FT /
 * Economist composition: kicker + heroStat + title + dek + multi-callout
 * annotation overlay + reference lines + era bands + top-aligned legend +
 * publication chrome.
 *
 * Activated when `data.frame` is set on TimeSeriesChartData. When absent,
 * TimeSeriesChart.tsx falls through to its existing render code path
 * (intelligence-briefing register).
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
  sec,
} from "../../design/theme";
import { fadeIn, easings, CLAMP_CUBIC } from "../../utils/animation";
import { useDirection } from "../../hooks/useDirection";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { EditorialFrame } from "../../components/EditorialFrame/EditorialFrame";
import type { Rect, ChartHelpers } from "../../components/EditorialFrame/EditorialFrame";
import { AnnotationOverlay } from "../../components/EditorialFrame/AnnotationOverlay";
import { useThemeMode } from "../../hooks/useThemeMode";
import type {
  TimeSeriesChartData,
  TimeSeriesLine,
  TimeSeriesAnnotation,
  TimeSeriesEra,
} from "./types";

interface TimeSeriesChartEditorialProps {
  data: TimeSeriesChartData & {
    frame: NonNullable<TimeSeriesChartData["frame"]>;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse an x-value (year string like "1987" or number) to a numeric domain value. */
function parseX(x: string | number): number {
  if (typeof x === "number") return x;
  const parsed = parseFloat(x);
  return isNaN(parsed) ? 0 : parsed;
}

// ── Main component ───────────────────────────────────────────────────────────

export const TimeSeriesChartEditorial: React.FC<TimeSeriesChartEditorialProps> = ({
  data,
}) => {
  const frameNum = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  useDirection(data._direction, "none");
  useCompositionAnimation();

  const lines = data.lines ?? [];

  // Domain calculations
  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    lines.forEach((line) => {
      line.points.forEach((p) => {
        xs.push(parseX(p.x));
        ys.push(p.y);
      });
    });
    if (xs.length === 0) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    const rawYMin = Math.min(...ys);
    const rawYMax = Math.max(...ys);
    const pad = (rawYMax - rawYMin) * 0.1 || 1;
    return {
      xMin: Math.min(...xs),
      xMax: Math.max(...xs),
      yMin: data.yRange?.[0] ?? rawYMin - pad,
      yMax: data.yRange?.[1] ?? rawYMax + pad,
    };
  }, [lines, data.yRange]);

  return (
    <EditorialFrame
      frame={data.frame}
      episode={data.episode}
      durationInFrames={durationInFrames}
      annotationOverlay={(chartRect, helpers) =>
        renderOverlays(data, chartRect, helpers, frameNum, xMin, xMax, yMin, yMax)
      }
    >
      {(chartRect, _helpers) => (
        <LinesContent
          lines={lines}
          eras={data.eras}
          annotations={data.annotations}
          chartRect={chartRect}
          xMin={xMin}
          xMax={xMax}
          yMin={yMin}
          yMax={yMax}
          xLabel={data.xLabel}
          yLabel={data.yLabel}
          yUnit={data.yUnit}
          frame={frameNum}
        />
      )}
    </EditorialFrame>
  );
};

// ── Chart content (lines + areas + eras + axis labels) ───────────────────────

const LinesContent: React.FC<{
  lines: TimeSeriesLine[];
  eras?: TimeSeriesEra[];
  annotations?: TimeSeriesAnnotation[];
  chartRect: Rect;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xLabel?: string;
  yLabel?: string;
  yUnit?: string;
  frame: number;
}> = ({ lines, eras, annotations, chartRect, xMin, xMax, yMin, yMax, xLabel, yLabel, yUnit, frame }) => {
  const theme = useThemeMode("light");

  // Plot area: reserve bottom 40px for x-axis labels and left 50px for y-axis labels.
  const PLOT_LEFT = 50;
  const PLOT_BOTTOM = 40;
  const plotWidth = chartRect.width - PLOT_LEFT;
  const plotHeight = chartRect.height - PLOT_BOTTOM;

  // Scales (input domain → output pixels within chartRect, relative coords)
  const xScale = (x: number) =>
    PLOT_LEFT + ((x - xMin) / Math.max(0.0001, xMax - xMin)) * plotWidth;
  const yScale = (y: number) =>
    ((yMax - y) / Math.max(0.0001, yMax - yMin)) * plotHeight;

  // Y-axis tick values (5 evenly spaced)
  const yTicks = useMemo(() => {
    const out: number[] = [];
    const step = (yMax - yMin) / 4;
    for (let i = 0; i <= 4; i++) out.push(yMin + step * i);
    return out;
  }, [yMin, yMax]);

  // X-axis tick values — use unique x values from first line
  const xTicks = useMemo(() => {
    if (lines.length === 0) return [];
    const all = new Set<number>();
    lines.forEach((line) => line.points.forEach((p) => all.add(parseX(p.x))));
    return Array.from(all).sort((a, b) => a - b);
  }, [lines]);

  return (
    <svg
      width={chartRect.width}
      height={chartRect.height}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {/* Era bands — render first, behind everything */}
      {eras?.map((era, i) => {
        const x1 = xScale(parseX(era.from));
        const x2 = xScale(parseX(era.to));
        const opacity = fadeIn(frame, sec(0.3) + i * sec(0.1), sec(0.5)) * (era.opacity ?? 0.08);
        return (
          <g key={`era-${i}`}>
            <rect
              x={x1}
              y={0}
              width={x2 - x1}
              height={plotHeight}
              fill={era.color}
              opacity={opacity}
            />
            <text
              x={(x1 + x2) / 2}
              y={20}
              fill={era.color}
              textAnchor="middle"
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.meta,
                letterSpacing: letterSpacing.meta,
                textTransform: "uppercase",
              }}
              opacity={fadeIn(frame, sec(0.5) + i * sec(0.1), sec(0.5)) * 0.65}
            >
              {era.label}
            </text>
          </g>
        );
      })}

      {/* Y-axis gridlines + labels */}
      {yTicks.map((tickValue, i) => {
        const y = yScale(tickValue);
        const lineProgress = interpolate(
          frame,
          [sec(0.2) + i * sec(0.06), sec(0.2) + i * sec(0.06) + sec(0.5)],
          [0, 1],
          CLAMP_CUBIC,
        );
        return (
          <g key={`ygrid-${i}`}>
            <line
              x1={PLOT_LEFT}
              y1={y}
              x2={PLOT_LEFT + plotWidth * lineProgress}
              y2={y}
              stroke={theme.text.muted}
              strokeWidth={0.5}
              strokeOpacity={0.18}
            />
            <text
              x={PLOT_LEFT - 8}
              y={y + 4}
              fill={theme.text.muted}
              textAnchor="end"
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.meta,
                letterSpacing: letterSpacing.meta,
              }}
              opacity={lineProgress * 0.8}
            >
              {Math.round(tickValue)}
            </text>
          </g>
        );
      })}

      {/* Lines + area fills */}
      {lines.map((line, i) => {
        const pts = line.points.map((p) => ({ x: xScale(parseX(p.x)), y: yScale(p.y) }));
        if (pts.length < 2) return null;

        // SVG path data
        const linePath = pts
          .map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
          .join(" ");
        const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${plotHeight} L ${pts[0].x} ${plotHeight} Z`;

        // Path length estimate for stroke-dashoffset animation
        let pathLength = 0;
        for (let j = 1; j < pts.length; j++) {
          const dx = pts[j].x - pts[j - 1].x;
          const dy = pts[j].y - pts[j - 1].y;
          pathLength += Math.sqrt(dx * dx + dy * dy);
        }
        // Stagger line draw start
        const drawStart = sec(0.6) + i * sec(0.3);
        const drawDuration = sec(1.2);
        const drawProgress = interpolate(
          frame,
          [drawStart, drawStart + drawDuration],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easings.bar },
        );
        const dashOffset = pathLength * (1 - drawProgress);
        const areaOpacity = drawProgress * (line.areaOpacity ?? 0.12);
        const strokeWidth = line.width ?? (line.hero ? 4 : 3);
        const strokeDashStyle =
          line.dashed
            ? `${Math.max(8, pathLength / 30)} ${Math.max(4, pathLength / 60)}`
            : undefined;

        return (
          <g key={`line-${i}`}>
            {line.areaFill && (
              <path d={areaPath} fill={line.color} opacity={areaOpacity} />
            )}
            <path
              d={linePath}
              stroke={line.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={line.dashed ? strokeDashStyle : pathLength}
              strokeDashoffset={line.dashed ? 0 : dashOffset}
              opacity={line.dashed ? drawProgress : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Terminal label at line endpoint */}
            {drawProgress > 0.85 && (
              <text
                x={pts[pts.length - 1].x + 10}
                y={pts[pts.length - 1].y + 5}
                fill={line.color}
                style={{
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.caption,
                  fontWeight: fontWeights.bold,
                  letterSpacing: 0.5,
                }}
                opacity={fadeIn(frame, drawStart + drawDuration - sec(0.2), sec(0.5))}
              >
                {line.label.toUpperCase()}
              </text>
            )}
          </g>
        );
      })}

      {/* Event annotations — vertical line + label */}
      {annotations?.map((ann, i) => {
        const x = xScale(parseX(ann.x));
        const opacity = fadeIn(frame, sec(1.8) + i * sec(0.3), sec(0.5));
        const color = ann.color ?? palette.ink;
        return (
          <g key={`ann-${i}`}>
            <line
              x1={x}
              y1={0}
              x2={x}
              y2={plotHeight}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="3 4"
              opacity={opacity * 0.6}
            />
            <g opacity={opacity}>
              <text
                x={x + 8}
                y={plotHeight * 0.15}
                fill={color}
                style={{
                  fontFamily: fonts.heading,
                  fontSize: fontSizes.h3 - 8,
                  fontWeight: fontWeights.bold,
                }}
              >
                {ann.label}
              </text>
              {ann.sublabel && (
                <text
                  x={x + 8}
                  y={plotHeight * 0.15 + 20}
                  fill={color}
                  style={{
                    fontFamily: fonts.serifBody,
                    fontStyle: "italic",
                    fontSize: fontSizes.label - 2,
                  }}
                  opacity={0.85}
                >
                  {ann.sublabel}
                </text>
              )}
            </g>
          </g>
        );
      })}

      {/* X-axis labels (skip — too many years; show only first, last, and annotations) */}
      {xTicks
        .filter(
          (v, i) =>
            i === 0 ||
            i === xTicks.length - 1 ||
            (annotations ?? []).some((a) => Math.abs(parseX(a.x) - v) < 0.5),
        )
        .map((v) => {
          const x = xScale(v);
          return (
            <text
              key={`xlabel-${v}`}
              x={x}
              y={plotHeight + 22}
              fill={theme.text.muted}
              textAnchor="middle"
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.meta,
                letterSpacing: letterSpacing.meta,
              }}
              opacity={fadeIn(frame, sec(0.6), sec(0.5))}
            >
              {Math.round(v)}
            </text>
          );
        })}

      {/* Y-axis label (vertical) */}
      {yLabel && (
        <text
          x={-plotHeight / 2}
          y={14}
          transform={`rotate(-90)`}
          fill={theme.text.muted}
          textAnchor="middle"
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
          }}
          opacity={fadeIn(frame, sec(0.8), sec(0.5)) * 0.8}
        >
          {yLabel}
          {yUnit ?? ""}
        </text>
      )}
    </svg>
  );
};

// ── Annotation overlay (forwards data annotations into EditorialFrame's slot) ──

function renderOverlays(
  data: TimeSeriesChartData,
  chartRect: Rect,
  _helpers: ChartHelpers,
  frame: number,
  xMin: number,
  xMax: number,
  _yMin: number,
  _yMax: number,
): React.ReactNode {
  const frameProps = data.frame;
  if (!frameProps) return null;

  const PLOT_LEFT = 50;
  const PLOT_BOTTOM = 40;
  const plotWidth = chartRect.width - PLOT_LEFT;
  const plotHeight = chartRect.height - PLOT_BOTTOM;

  // Frame-level annotations (separate from the data.annotations event flags
  // which are rendered inline inside the SVG).
  const annotationPositions = (frameProps.annotations ?? []).map((ann) => {
    if (ann.targetXValue !== undefined) {
      const xv = typeof ann.targetXValue === "string"
        ? parseFloat(ann.targetXValue)
        : ann.targetXValue;
      const x =
        chartRect.x +
        PLOT_LEFT +
        ((xv - xMin) / Math.max(0.0001, xMax - xMin)) * plotWidth;
      const y = chartRect.y + plotHeight * 0.3;
      return { annotation: ann, targetPx: { x, y } };
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
    return {
      annotation: ann,
      targetPx: {
        x: chartRect.x + chartRect.width / 2,
        y: chartRect.y + chartRect.height / 2,
      },
    };
  });

  return (
    annotationPositions.length > 0 && (
      <AnnotationOverlay
        positions={annotationPositions}
        chartRect={chartRect}
        frameNum={frame}
      />
    )
  );
}

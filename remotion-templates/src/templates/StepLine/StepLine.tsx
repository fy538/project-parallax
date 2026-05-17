/**
 * StepLine — stepped time-series. Each value holds horizontally until
 * the next x position, then jumps vertically. Correct form for discrete
 * data: interest rates, policy thresholds, sanctions tiers.
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
import type { Rect } from "../../components/EditorialFrame/EditorialFrame";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { StepLineData, StepPoint } from "./types";

function parseX(x: string | number): number {
  if (typeof x === "number") return x;
  // Try YYYY-MM-DD or year string
  const asYear = parseFloat(x);
  if (!isNaN(asYear) && x.length <= 5) return asYear;
  const d = new Date(x);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

export const StepLine: React.FC<{ data: StepLineData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  useDirection(data._direction, "none");
  useCompositionAnimation();

  const frameProps = data.frame ?? {
    title: data.title,
    layout: "centered" as const,
    chrome: "publication" as const,
    legend: "suppressed" as const,
    source: data.source,
  };

  return (
    <EditorialFrame
      frame={frameProps}
      episode={data.episode}
      durationInFrames={durationInFrames}
    >
      {(chartRect) => (
        <StepContent data={data} chartRect={chartRect} frame={frame} />
      )}
    </EditorialFrame>
  );
};

const StepContent: React.FC<{
  data: StepLineData;
  chartRect: Rect;
  frame: number;
}> = ({ data, chartRect, frame }) => {
  const theme = useThemeMode("light");

  const PLOT_LEFT = 50;
  const PLOT_BOTTOM = 40;
  const plotWidth = chartRect.width - PLOT_LEFT;
  const plotHeight = chartRect.height - PLOT_BOTTOM;

  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    const xs = data.points.map((p) => parseX(p.x));
    const ys = data.points.map((p) => p.y);
    const yRange = Math.max(...ys) - Math.min(...ys) || 1;
    return {
      xMin: Math.min(...xs),
      xMax: Math.max(...xs),
      yMin: Math.min(...ys) - yRange * 0.1,
      yMax: Math.max(...ys) + yRange * 0.15,
    };
  }, [data.points]);

  const xScale = (x: number) =>
    PLOT_LEFT + ((x - xMin) / Math.max(0.0001, xMax - xMin)) * plotWidth;
  const yScale = (y: number) =>
    ((yMax - y) / Math.max(0.0001, yMax - yMin)) * plotHeight;

  // Build stepped path: M x0,y0  L x1,y0  L x1,y1  L x2,y1  L x2,y2  ...
  const pts = data.points.map((p) => ({
    x: xScale(parseX(p.x)),
    y: yScale(p.y),
    event: p.event,
  }));

  const pathSegments: string[] = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 1; i < pts.length; i++) {
    pathSegments.push(`L ${pts[i].x} ${pts[i - 1].y}`); // hold horizontally
    pathSegments.push(`L ${pts[i].x} ${pts[i].y}`); // jump vertically
  }
  const linePath = pathSegments.join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${plotHeight} L ${pts[0].x} ${plotHeight} Z`;

  // Estimate path length for stroke-dashoffset animation
  let pathLength = 0;
  for (let i = 1; i < pts.length; i++) {
    pathLength += Math.abs(pts[i].x - pts[i - 1].x);
    pathLength += Math.abs(pts[i].y - pts[i - 1].y);
  }

  const drawStart = sec(0.5);
  const drawDuration = sec(1.2);
  const drawProgress = interpolate(
    frame,
    [drawStart, drawStart + drawDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easings.bar,
    },
  );
  const color = data.color ?? palette.gold;

  // Y-axis ticks (5 evenly spaced)
  const yTicks = useMemo(() => {
    const step = (yMax - yMin) / 4;
    return [0, 1, 2, 3, 4].map((i) => yMin + step * i);
  }, [yMin, yMax]);

  return (
    <svg
      width={chartRect.width}
      height={chartRect.height}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {/* Y gridlines */}
      {yTicks.map((tv, i) => {
        const y = yScale(tv);
        const lineProgress = interpolate(
          frame,
          [sec(0.2) + i * sec(0.06), sec(0.2) + i * sec(0.06) + sec(0.5)],
          [0, 1],
          CLAMP_CUBIC,
        );
        return (
          <g key={i}>
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
              {Math.round(tv * 10) / 10}
              {data.yUnit ?? ""}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      {data.areaFill && (
        <path
          d={areaPath}
          fill={color}
          opacity={drawProgress * (data.areaOpacity ?? 0.1)}
        />
      )}

      {/* Stepped line */}
      <path
        d={linePath}
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="miter"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength * (1 - drawProgress)}
      />

      {/* Event markers */}
      {pts.map((p, i) => {
        if (!p.event) return null;
        const eventOpacity = fadeIn(
          frame,
          drawStart + drawDuration * (i / pts.length),
          sec(0.4),
        );
        return (
          <g key={`event-${i}`}>
            <circle cx={p.x} cy={p.y} r={4.5} fill={color} opacity={eventOpacity} />
            <text
              x={p.x + 10}
              y={p.y - 10}
              fill={theme.text.primary}
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.meta,
                fontWeight: fontWeights.bold,
                letterSpacing: 0.5,
              }}
              opacity={eventOpacity}
            >
              {p.event}
            </text>
          </g>
        );
      })}

      {/* X-axis labels — first, last, and event points only */}
      {pts.map((p, i) => {
        if (i !== 0 && i !== pts.length - 1 && !p.event) return null;
        const label = String(data.points[i].x);
        return (
          <text
            key={`xlabel-${i}`}
            x={p.x}
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
            {label}
          </text>
        );
      })}

      {/* Y-axis label */}
      {data.yLabel && (
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
          {data.yLabel}
        </text>
      )}
    </svg>
  );
};

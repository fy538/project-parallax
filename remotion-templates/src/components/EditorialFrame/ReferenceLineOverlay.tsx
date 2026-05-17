/**
 * ReferenceLineOverlay — threshold lines + era bands inside the chart rect.
 *
 * Chart templates compute the value → pixel mapping (since they own their axis
 * scales) and pass per-line pixel positions to this component.
 */

import React from "react";
import { fonts, fontSizes, palette, letterSpacing } from "../../design/theme";
import { fadeIn } from "../../utils/animation";
import { sec } from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { ReferenceLine, EraBand } from "./schema";
import type { Rect } from "./EditorialFrame";

interface ReferenceLinePosition {
  line: ReferenceLine;
  /** Pixel position along the axis. For horizontal y-axis lines, this is y;
   *  for vertical x-axis lines, this is x. */
  pxValue: number;
}

interface EraBandPosition {
  band: EraBand;
  startPx: number;
  endPx: number;
}

export const ReferenceLineOverlay: React.FC<{
  lines: ReferenceLinePosition[];
  chartRect: Rect;
  frameNum: number;
}> = ({ lines, chartRect, frameNum }) => {
  const theme = useThemeMode("light");
  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {lines.map((l, i) => {
        const opacity = fadeIn(frameNum, sec(0.8) + i * sec(0.2), sec(0.5));
        const color = l.line.color ?? theme.text.muted;
        const dash =
          l.line.style === "dotted" ? "2 4" : l.line.style === "solid" ? "" : "6 6";
        const isYAxis = (l.line.axis ?? "y") === "y";
        if (isYAxis) {
          return (
            <g key={i} opacity={opacity}>
              <line
                x1={chartRect.x}
                y1={l.pxValue}
                x2={chartRect.x + chartRect.width}
                y2={l.pxValue}
                stroke={color}
                strokeWidth={1}
                strokeDasharray={dash}
                opacity={0.55}
              />
              {l.line.label && (
                <text
                  x={chartRect.x + chartRect.width + 8}
                  y={l.pxValue + 4}
                  fill={color}
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: fontSizes.meta,
                    letterSpacing: letterSpacing.meta,
                    textTransform: "uppercase",
                  }}
                  opacity={0.85}
                >
                  {l.line.label}
                </text>
              )}
            </g>
          );
        }
        // x-axis (vertical line)
        return (
          <g key={i} opacity={opacity}>
            <line
              x1={l.pxValue}
              y1={chartRect.y}
              x2={l.pxValue}
              y2={chartRect.y + chartRect.height}
              stroke={color}
              strokeWidth={1}
              strokeDasharray={dash}
              opacity={0.55}
            />
            {l.line.label && (
              <text
                x={l.pxValue + 8}
                y={chartRect.y + 14}
                fill={color}
                style={{
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.meta,
                  letterSpacing: letterSpacing.meta,
                  textTransform: "uppercase",
                }}
                opacity={0.85}
              >
                {l.line.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export const EraBandOverlay: React.FC<{
  bands: EraBandPosition[];
  chartRect: Rect;
  frameNum: number;
}> = ({ bands, chartRect, frameNum }) => {
  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {bands.map((b, i) => {
        const opacity = fadeIn(frameNum, sec(0.5), sec(0.6)) * (b.band.opacity ?? 0.08);
        const isXAxis = (b.band.axis ?? "x") === "x";
        return (
          <g key={i}>
            <rect
              x={isXAxis ? b.startPx : chartRect.x}
              y={isXAxis ? chartRect.y : b.startPx}
              width={isXAxis ? b.endPx - b.startPx : chartRect.width}
              height={isXAxis ? chartRect.height : b.endPx - b.startPx}
              fill={b.band.color ?? palette.umber}
              opacity={opacity}
            />
            {b.band.label && (
              <text
                x={isXAxis ? (b.startPx + b.endPx) / 2 : chartRect.x + 8}
                y={isXAxis ? chartRect.y + 18 : (b.startPx + b.endPx) / 2}
                fill={palette.ink}
                textAnchor={isXAxis ? "middle" : "start"}
                style={{
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.meta,
                  letterSpacing: letterSpacing.meta,
                  textTransform: "uppercase",
                }}
                opacity={fadeIn(frameNum, sec(0.8), sec(0.5)) * 0.55}
              >
                {b.band.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

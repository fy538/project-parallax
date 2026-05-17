/**
 * Sparkline — tiny inline chart, designed to read at 100-300px wide.
 *
 * Renders a polyline through normalized [0..1] values with an optional area
 * fill beneath. Used by KPICard as the trend element next to a hero stat,
 * and exposable standalone for any "trend in tiny space" need.
 *
 * Not opt-in to EditorialFrame — sparklines are too small to host frame
 * composition. Use KPICard if you want frame chrome.
 */

import React from "react";

export interface SparklineProps {
  /** Numeric series — values will be normalized to fit the sparkline rect. */
  values: number[];
  /** Width in pixels (default 160). */
  width?: number;
  /** Height in pixels (default 40). */
  height?: number;
  /** Stroke color (default ink). */
  color?: string;
  /** Stroke width (default 1.75). */
  strokeWidth?: number;
  /** Fill the area beneath the line at this opacity (default 0 = no fill). */
  areaOpacity?: number;
  /** Render endpoint dot at the final value. */
  endpointDot?: boolean;
  /** Draw progress 0..1 (for animation; default 1 = fully drawn). */
  drawProgress?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  width = 160,
  height = 40,
  color = "#1C1814",
  strokeWidth = 1.75,
  areaOpacity = 0,
  endpointDot = false,
  drawProgress = 1,
}) => {
  if (values.length < 2) return null;

  const yMin = Math.min(...values);
  const yMax = Math.max(...values);
  const yRange = yMax - yMin || 1;

  // Inset top/bottom by stroke width + small margin so endpoint dots / line
  // peaks aren't clipped at the edges.
  const pad = strokeWidth + 2;
  const plotH = height - pad * 2;

  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: pad + (1 - (v - yMin) / yRange) * plotH,
  }));

  // SVG path d
  const linePath = pts
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;

  // Estimate path length for stroke-dashoffset draw-on animation
  let pathLength = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    pathLength += Math.sqrt(dx * dx + dy * dy);
  }
  const dashOffset = pathLength * (1 - drawProgress);

  // Endpoint location based on drawProgress (used for the dot when animating)
  const endIdx = Math.max(0, Math.min(pts.length - 1, Math.floor(drawProgress * (pts.length - 1))));
  const endPt = pts[endIdx];

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {areaOpacity > 0 && (
        <path d={areaPath} fill={color} opacity={areaOpacity * drawProgress} />
      )}
      <path
        d={linePath}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
      />
      {endpointDot && drawProgress > 0.85 && (
        <circle cx={endPt.x} cy={endPt.y} r={strokeWidth + 1.5} fill={color} />
      )}
    </svg>
  );
};

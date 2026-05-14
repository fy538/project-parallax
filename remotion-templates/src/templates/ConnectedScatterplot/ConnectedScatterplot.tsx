/**
 * ConnectedScatterplot — two-variable scatter connected in temporal order.
 *
 * The editorial form for "two macro indicators evolving together over
 * time" stories — Phillips curve, GDP-vs-CO₂, inflation-vs-rates. The
 * shape of the trajectory carries the argument: a tight loop says "we
 * came back to where we started"; a sharp jag says "regime break."
 *
 * Animation sequence:
 *   1. Title fades in (TitleBlock)
 *   2. Axes + ticks fade in (frames ~9-24)
 *   3. Points appear in chronological order with stagger
 *   4. Trajectory line draws segment-by-segment alongside the points
 *   5. Arrowhead appears once the final segment lands
 *   6. Year / pivot labels fade in after their point
 *   7. Ken Burns drift + exit fade
 *
 * Curve interpolation: each interior segment is a Catmull-Rom-to-cubic-
 * bezier conversion (tension 0.5) so the trajectory reads as a smooth
 * trace through every observation without overshoot. Endpoints duplicate
 * the boundary points so the first and last segments don't undershoot.
 *
 * Arrowhead: SVG <polygon> oriented along the tangent of the last
 * segment, sized to the trajectory stroke weight. Reveal-gated on the
 * draw progress crossing 1.0.
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
  timing,
} from "../../design/theme";
import {
  fadeIn,
  stagger,
  exitFade,
  CLAMP_CUBIC,
} from "../../utils/animation";
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
import { chartLayout } from "../../utils/chartLayout";
import { niceDomain, niceTicks } from "../../utils/niceTicks";
import { warnIf, checkChartDataCommon } from "../../utils/dataWarnings";
import type {
  ConnectedScatterplotData,
  ScatterPoint,
} from "./types";

// ── Helpers ────────────────────────────────────────────────────────────

const resolveTrajectoryColor = (
  raw: string | undefined,
  accent: string,
): string => {
  if (!raw) return accent;
  if (raw === "accent") return accent;
  return raw;
};

type ValueFormat = NonNullable<ConnectedScatterplotData["valueFormat"]>;

const formatAxisTick = (
  value: number,
  format: ValueFormat | undefined,
  unit: string | undefined,
): string => {
  const fmt = format ?? "number";
  const abs = Math.abs(value);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : abs > 0 ? 1 : 0;
  const rounded = Number.isInteger(value)
    ? value.toString()
    : value.toFixed(decimals);
  let core: string;
  if (fmt === "percent") core = `${rounded}%`;
  else if (fmt === "currency") core = `$${rounded}`;
  else core = rounded;
  if (unit && fmt !== "percent" && !unit.startsWith("%")) {
    return `${core}${unit.startsWith(" ") ? unit : ` ${unit}`}`;
  }
  // Avoid double-percent when both valueFormat=percent and xUnit="%"
  if (unit && fmt === "percent" && unit !== "%") {
    return `${core} ${unit}`;
  }
  return core;
};

/**
 * Convert a polyline through N points into a single SVG path using
 * Catmull-Rom-to-cubic-bezier with tension 0.5. The classic conversion:
 * for each interior segment Pi → Pi+1, the control points are
 *   C1 = Pi   + (Pi+1 - Pi-1) / 6
 *   C2 = Pi+1 - (Pi+2 - Pi)   / 6
 * Endpoints duplicate the first / last point so the boundary tangents
 * lay flat instead of curling out.
 */
function buildCatmullRomPath(
  pts: { x: number; y: number }[],
): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  const ext = [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < ext.length - 2; i++) {
    const p0 = ext[i - 1];
    const p1 = ext[i];
    const p2 = ext[i + 1];
    const p3 = ext[i + 2];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// ── Component ──────────────────────────────────────────────────────────

export const ConnectedScatterplot: React.FC<{
  data: ConnectedScatterplotData;
}> = ({ data }) => {
  checkChartDataCommon("ConnectedScatterplot", data);
  warnIf(
    data.points.length > 40,
    "ConnectedScatterplot",
    `${data.points.length} points — connected scatter reads cleanest at ` +
      `15–30 observations. Above 40 the trajectory crosses itself into ` +
      `noise; consider thinning to every 2nd or 3rd year, or splitting ` +
      `eras into separate segments.`,
  );
  warnIf(
    data.points.length < 3,
    "ConnectedScatterplot",
    `${data.points.length} points — connected scatter needs at least 3 ` +
      `observations to read as a trajectory. Two points are a slope; one ` +
      `is a dot. Use DataChart scatter or TimeSeriesChart instead.`,
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);
  const accent = palette.amber;
  const trajectoryColor = resolveTrajectoryColor(
    data.trajectoryColor,
    accent,
  );

  // ── Layout ──────────────────────────────────────────────────────────
  // Reserve room on the left for y-axis tick labels and on the bottom
  // for x-axis ticks plus the axis title. chartLayout handles title +
  // source; extraPad adds the chart-specific gutters.
  const region = useMemo(
    () =>
      chartLayout({
        hasTitle: true,
        hasXAxis: true,
        hasSource: Boolean(data.source),
        safeAreaTier: "generous",
        extraPad: { left: 70, right: 40, bottom: 30 },
      }),
    [data.source],
  );

  // ── Scales ──────────────────────────────────────────────────────────
  // Order points by year so the trajectory follows time, not array order.
  const orderedPoints = useMemo(
    () => [...data.points].sort((a, b) => a.year - b.year),
    [data.points],
  );

  const { xMin, xMax, yMin, yMax, xTicks, yTicks } = useMemo(() => {
    const xs = orderedPoints.map((p) => p.x);
    const ys = orderedPoints.map((p) => p.y);
    const rawXMin = Math.min(...xs);
    const rawXMax = Math.max(...xs);
    const rawYMin = Math.min(...ys);
    const rawYMax = Math.max(...ys);
    // Pad ~8% on each end so points don't kiss the axis frame.
    const xPad = (rawXMax - rawXMin) * 0.08 || 1;
    const yPad = (rawYMax - rawYMin) * 0.08 || 1;
    const [nxMin, nxMax] = niceDomain(rawXMin - xPad, rawXMax + xPad, 5);
    const [nyMin, nyMax] = niceDomain(rawYMin - yPad, rawYMax + yPad, 5);
    return {
      xMin: nxMin,
      xMax: nxMax,
      yMin: nyMin,
      yMax: nyMax,
      xTicks: niceTicks(nxMin, nxMax, 5),
      yTicks: niceTicks(nyMin, nyMax, 5),
    };
  }, [orderedPoints]);

  const chart = region.chart;
  const chartRight = chart.left + chart.width;
  const chartBottom = chart.top + chart.height;

  const xScale = (v: number): number =>
    chart.left + ((v - xMin) / Math.max(1e-9, xMax - xMin)) * chart.width;
  const yScale = (v: number): number =>
    chartBottom -
    ((v - yMin) / Math.max(1e-9, yMax - yMin)) * chart.height;

  // Pixel positions for each ordered point.
  const pixelPoints = useMemo(
    () =>
      orderedPoints.map((p) => ({
        x: xScale(p.x),
        y: yScale(p.y),
        src: p,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderedPoints, xMin, xMax, yMin, yMax, chart.left, chart.top, chart.width, chart.height],
  );

  // ── Timing ──────────────────────────────────────────────────────────
  const axesStart = timing.entrance.fast; // sec(0.3)
  const pointsStart = sec(0.8);
  const perPoint = timing.stagger.normal; // sec(0.15) — clear enough to read
  const exitOp = exitFade(frame, durationInFrames, timing.exit.medium);

  // Per-point start frames — the line "segment that arrives AT point i"
  // animates from pointsStart + (i-1)*perPoint to + sec(0.18) later.
  // The DISC at point i fades in at pointsStart + i*perPoint.
  const segmentDur = Math.max(4, Math.round(perPoint * 0.95));

  // ── Trajectory path ─────────────────────────────────────────────────
  // Single Catmull-Rom path through every point. We reveal it with a
  // strokeDashoffset sweep driven by global trajectory progress (0→1)
  // running from pointsStart through the last point's arrival.
  const trajPath = useMemo(
    () => buildCatmullRomPath(pixelPoints.map((p) => ({ x: p.x, y: p.y }))),
    [pixelPoints],
  );

  // Upper-bound path length for the dasharray reveal. We use the sum of
  // straight chord lengths × 1.25 to absorb Catmull-Rom curvature slack
  // without needing path.getTotalLength() (unreliable during SSR).
  const trajLen = useMemo(() => {
    let total = 0;
    for (let i = 1; i < pixelPoints.length; i++) {
      total += Math.hypot(
        pixelPoints[i].x - pixelPoints[i - 1].x,
        pixelPoints[i].y - pixelPoints[i - 1].y,
      );
    }
    return total * 1.25 + 12;
  }, [pixelPoints]);

  const lastPointArrives =
    pointsStart + stagger(orderedPoints.length - 1, perPoint);
  const trajProgress = interpolate(
    frame,
    [pointsStart, lastPointArrives + segmentDur],
    [0, 1],
    CLAMP_CUBIC,
  );

  // ── Arrowhead geometry ──────────────────────────────────────────────
  // Tangent at the last point: take the vector from the second-to-last
  // to the last pixel point. Arrowhead is a small filled triangle along
  // that tangent direction.
  const lastPx = pixelPoints[pixelPoints.length - 1];
  const prevPx = pixelPoints[pixelPoints.length - 2];
  const arrowhead = useMemo(() => {
    if (!lastPx || !prevPx) return null;
    const dx = lastPx.x - prevPx.x;
    const dy = lastPx.y - prevPx.y;
    const mag = Math.hypot(dx, dy) || 1;
    const ux = dx / mag;
    const uy = dy / mag;
    // Perpendicular
    const px = -uy;
    const py = ux;
    const headLen = 14;
    const headHalfWidth = 7;
    // Tip extends slightly past the last point.
    const tipX = lastPx.x + ux * 4;
    const tipY = lastPx.y + uy * 4;
    const baseX = tipX - ux * headLen;
    const baseY = tipY - uy * headLen;
    const leftX = baseX + px * headHalfWidth;
    const leftY = baseY + py * headHalfWidth;
    const rightX = baseX - px * headHalfWidth;
    const rightY = baseY - py * headHalfWidth;
    return `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPx?.x, lastPx?.y, prevPx?.x, prevPx?.y]);

  const arrowOpacity =
    fadeIn(frame, lastPointArrives + segmentDur, timing.entrance.fast) * exitOp;

  // Year labels: which points get a label?
  //   - First and last (always)
  //   - highlight === true
  //   - "pivot" points where direction changes sharply (turning angle
  //     beyond ~120° at that vertex). We pick at most 2 auto-pivots
  //     beyond the explicit highlights, biased to interior points.
  const labeledIndices = useMemo(() => {
    const set = new Set<number>();
    if (orderedPoints.length > 0) set.add(0);
    if (orderedPoints.length > 1) set.add(orderedPoints.length - 1);
    orderedPoints.forEach((p, i) => {
      if (p.highlight) set.add(i);
    });
    // Auto-pivot detection: turning angle at each interior vertex.
    const pivots: { i: number; angle: number }[] = [];
    for (let i = 1; i < pixelPoints.length - 1; i++) {
      if (set.has(i)) continue;
      const a = pixelPoints[i - 1];
      const b = pixelPoints[i];
      const c = pixelPoints[i + 1];
      const v1x = b.x - a.x;
      const v1y = b.y - a.y;
      const v2x = c.x - b.x;
      const v2y = c.y - b.y;
      const mag = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) || 1;
      const dot = (v1x * v2x + v1y * v2y) / mag;
      // angle between successive segments; large angle (close to π) means
      // sharp turn. cos(θ) close to -1 → sharp reversal.
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
      pivots.push({ i, angle });
    }
    pivots.sort((a, b) => b.angle - a.angle);
    let added = 0;
    for (const { i, angle } of pivots) {
      if (added >= 2) break;
      if (angle < (2 * Math.PI) / 3) break; // require ≥120° turn
      set.add(i);
      added++;
    }
    return set;
  }, [orderedPoints, pixelPoints]);

  // ── Render ──────────────────────────────────────────────────────────
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
          {/* ── Y-axis gridlines + tick labels ─────────────────────────── */}
          {yTicks.map((tick, ti) => {
            const ty = yScale(tick);
            if (ty < chart.top - 1 || ty > chartBottom + 1) return null;
            const op =
              fadeIn(frame, axesStart + stagger(ti, 2), timing.entrance.fast) *
              exitOp;
            return (
              <g key={`yt-${tick}`}>
                <line
                  x1={chart.left}
                  y1={ty}
                  x2={chartRight}
                  y2={ty}
                  stroke={theme.text.muted}
                  strokeWidth={0.75}
                  strokeDasharray="3 4"
                  opacity={0.22 * op}
                />
                <line
                  x1={chart.left - 5}
                  y1={ty}
                  x2={chart.left}
                  y2={ty}
                  stroke={theme.text.muted}
                  strokeWidth={1}
                  opacity={0.6 * op}
                />
                <text
                  x={chart.left - 10}
                  y={ty}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={theme.text.muted}
                  fontSize={fontSizes.caption}
                  fontFamily={fonts.mono}
                  letterSpacing={letterSpacing.caption}
                  opacity={op}
                >
                  {formatAxisTick(tick, data.valueFormat, data.yUnit)}
                </text>
              </g>
            );
          })}

          {/* ── X-axis tick marks + labels ─────────────────────────────── */}
          {xTicks.map((tick, ti) => {
            const tx = xScale(tick);
            if (tx < chart.left - 1 || tx > chartRight + 1) return null;
            const op =
              fadeIn(frame, axesStart + stagger(ti, 2), timing.entrance.fast) *
              exitOp;
            return (
              <g key={`xt-${tick}`}>
                <line
                  x1={tx}
                  y1={chartBottom}
                  x2={tx}
                  y2={chartBottom + 5}
                  stroke={theme.text.muted}
                  strokeWidth={1}
                  opacity={0.6 * op}
                />
                <text
                  x={tx}
                  y={chartBottom + 18}
                  textAnchor="middle"
                  fill={theme.text.muted}
                  fontSize={fontSizes.caption}
                  fontFamily={fonts.mono}
                  letterSpacing={letterSpacing.caption}
                  opacity={op}
                >
                  {formatAxisTick(tick, data.valueFormat, data.xUnit)}
                </text>
              </g>
            );
          })}

          {/* ── Axis frame (left + bottom rules) ───────────────────────── */}
          <line
            x1={chart.left}
            y1={chart.top}
            x2={chart.left}
            y2={chartBottom}
            stroke={theme.text.muted}
            strokeWidth={1}
            opacity={
              0.5 *
              fadeIn(frame, axesStart, timing.entrance.fast) *
              exitOp
            }
          />
          <line
            x1={chart.left}
            y1={chartBottom}
            x2={chartRight}
            y2={chartBottom}
            stroke={theme.text.muted}
            strokeWidth={1}
            opacity={
              0.5 *
              fadeIn(frame, axesStart, timing.entrance.fast) *
              exitOp
            }
          />

          {/* ── Axis titles ─────────────────────────────────────────────
              X title centered below the tick row; Y title rotated −90°
              along the left gutter. */}
          <text
            x={chart.left + chart.width / 2}
            y={chartBottom + 50}
            textAnchor="middle"
            fill={theme.text.secondary}
            fontSize={fontSizes.meta}
            fontFamily={fonts.mono}
            fontWeight={500}
            letterSpacing={letterSpacing.meta}
            opacity={
              fadeIn(frame, axesStart + timing.entrance.fast, timing.entrance.medium) *
              exitOp
            }
            style={{ textTransform: "uppercase" }}
          >
            {data.xAxisLabel}
          </text>
          <text
            x={chart.left - 52}
            y={chart.top + chart.height / 2}
            textAnchor="middle"
            fill={theme.text.secondary}
            fontSize={fontSizes.meta}
            fontFamily={fonts.mono}
            fontWeight={500}
            letterSpacing={letterSpacing.meta}
            opacity={
              fadeIn(frame, axesStart + timing.entrance.fast, timing.entrance.medium) *
              exitOp
            }
            transform={`rotate(-90 ${chart.left - 52} ${chart.top + chart.height / 2})`}
            style={{ textTransform: "uppercase" }}
          >
            {data.yAxisLabel}
          </text>

          {/* ── Trajectory line ────────────────────────────────────────
              Single Catmull-Rom path revealed via strokeDashoffset. The
              dash length is an upper bound (chord-sum × 1.25); the sweep
              lasts from pointsStart through the last point's arrival
              so the line tip leads the next disc by ~one segment. */}
          {trajPath && (
            <path
              d={trajPath}
              fill="none"
              stroke={trajectoryColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85 * exitOp}
              strokeDasharray={`${trajLen} ${trajLen}`}
              strokeDashoffset={trajLen * (1 - trajProgress)}
            />
          )}

          {/* ── Arrowhead at most-recent point ─────────────────────────
              Filled triangle oriented along the tangent of the last
              segment. Fades in once the trajectory finishes drawing. */}
          {arrowhead && (
            <polygon
              points={arrowhead}
              fill={trajectoryColor}
              opacity={arrowOpacity}
            />
          )}

          {/* ── Points ─────────────────────────────────────────────────
              Per-point stagger in chronological order. Highlighted
              points get amber + larger radius; default points use the
              trajectory color at full saturation. */}
          {pixelPoints.map((pt, i) => {
            const isHighlight = pt.src.highlight === true;
            const r = isHighlight ? 10 : 6;
            const fill = isHighlight ? accent : trajectoryColor;
            const start = pointsStart + stagger(i, perPoint);
            const op =
              fadeIn(frame, start, timing.entrance.fast) * exitOp;
            return (
              <g key={`pt-${pt.src.year}-${i}`} opacity={op}>
                {/* Underlay disc cuts the trajectory line behind the
                    point so the marker reads as a discrete observation
                    rather than a bump on the curve. */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={r + 3}
                  fill={theme.bg.base}
                />
                <circle cx={pt.x} cy={pt.y} r={r} fill={fill} />
                {isHighlight && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={r + 5}
                    fill="none"
                    stroke={fill}
                    strokeWidth={1}
                    opacity={0.4}
                  />
                )}
              </g>
            );
          })}

          {/* ── Year / pivot labels ────────────────────────────────────
              Show year on first, last, highlights, and auto-pivots.
              Highlighted points also get their editorial label below
              the year. A short leader line connects the text block to
              its disc; the text is offset perpendicular to the local
              trajectory tangent so it doesn't overlap the line. */}
          {pixelPoints.map((pt, i) => {
            if (!labeledIndices.has(i)) return null;
            const start = pointsStart + stagger(i, perPoint) + timing.entrance.crisp;
            const op = fadeIn(frame, start, timing.entrance.medium) * exitOp;

            // Offset direction: perpendicular to the local tangent.
            // Default: above the point. If the tangent points up-right
            // we drop the label below so it doesn't crash the line.
            const neighbor =
              i < pixelPoints.length - 1 ? pixelPoints[i + 1] : pixelPoints[i - 1];
            const dx = neighbor.x - pt.x;
            const dy = neighbor.y - pt.y;
            const mag = Math.hypot(dx, dy) || 1;
            // Perpendicular unit (rotated 90° ccw)
            const nx = -dy / mag;
            const ny = dx / mag;
            // Bias away from the chart center so labels lean outward.
            const cx = chart.left + chart.width / 2;
            const cy = chart.top + chart.height / 2;
            const outwardX = pt.x - cx;
            const outwardY = pt.y - cy;
            const sign = nx * outwardX + ny * outwardY >= 0 ? 1 : -1;
            const offset = 18;
            // Clamp label position to stay inside the chart frame. The
            // perpendicular-tangent offset can push corner-region labels
            // past the gutter at the chart edges (e.g., 2022 in the
            // Phillips sample lands near the left axis gutter). The
            // clamp pulls back by 18px on each side so labels never sit
            // on top of the axis frame or escape the tick row.
            const labelXRaw = pt.x + nx * offset * sign;
            const labelYRaw = pt.y + ny * offset * sign;
            const labelMargin = 18;
            const labelX = Math.max(
              chart.left + labelMargin,
              Math.min(chartRight - labelMargin, labelXRaw),
            );
            const labelY = Math.max(
              chart.top + labelMargin,
              Math.min(chartBottom - labelMargin, labelYRaw),
            );

            const isHighlight = pt.src.highlight === true;
            const r = isHighlight ? 10 : 6;
            // Leader: from disc rim to just before the (possibly
            // clamped) text block. Recompute endpoints from the
            // CLAMPED label position so the leader stays connected
            // when the label gets pulled inward at the chart edges.
            const labelDx = labelX - pt.x;
            const labelDy = labelY - pt.y;
            const labelDist = Math.hypot(labelDx, labelDy) || 1;
            const lux = labelDx / labelDist;
            const luy = labelDy / labelDist;
            const leadStartX = pt.x + lux * (r + 2);
            const leadStartY = pt.y + luy * (r + 2);
            const leadEndX = labelX - lux * 4;
            const leadEndY = labelY - luy * 4;

            // Year label color: muted for default, primary for highlight.
            const yearFill = isHighlight
              ? theme.text.primary
              : theme.text.secondary;
            const textAnchor: "start" | "middle" | "end" =
              labelX < pt.x - 4 ? "end" : labelX > pt.x + 4 ? "start" : "middle";

            return (
              <g key={`lbl-${pt.src.year}-${i}`} opacity={op}>
                <line
                  x1={leadStartX}
                  y1={leadStartY}
                  x2={leadEndX}
                  y2={leadEndY}
                  stroke={theme.text.muted}
                  strokeWidth={1}
                  opacity={0.5}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  fill={yearFill}
                  fontSize={fontSizes.caption}
                  fontFamily={fonts.mono}
                  fontWeight={isHighlight ? 700 : 500}
                  letterSpacing={letterSpacing.caption}
                  style={{ textTransform: "uppercase" }}
                >
                  {pt.src.year}
                </text>
                {isHighlight && pt.src.label && (
                  <text
                    x={labelX}
                    y={labelY + fontSizes.caption + 2}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                    fill={accent}
                    fontSize={fontSizes.caption}
                    fontFamily={fonts.mono}
                    fontWeight={500}
                    letterSpacing={letterSpacing.caption}
                    style={{ textTransform: "lowercase" }}
                  >
                    {pt.src.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <SourceAttribution
          source={data.source}
          mode={bgVariant}
          prefix="Source: "
          startSec={1.8}
        />
      </AbsoluteFill>
    </Background>
  );
};

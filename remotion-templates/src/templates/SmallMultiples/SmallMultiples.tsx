/**
 * SmallMultiples — grid of synchronized line-chart cells.
 *
 * The structural comparison form. Same chart type, same axes, applied to
 * N different entities. Patterns and outliers become legible at a glance.
 *
 * Reveal sequence:
 *   1. Grid frame fades in
 *   2. Cell titles appear (staggered, all within ~0.6s)
 *   3. All lines draw in simultaneously (synchronized — the editorial
 *      register IS that the patterns are comparable at the same moment)
 *   4. Highlight markers + badges appear after lines settle
 *
 * @composition-animation: useCompositionAnimation (Ken Burns drift + exit fade)
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fontSizes,
  fontWeights,
  fonts,
  layout,
  palette,
} from "../../design/theme";
import type {
  SmallMultiplesCell,
  SmallMultiplesData,
} from "./types";

// ── Reveal timing ──────────────────────────────────────────────────────────

const TITLE_FADE_SEC = 0.4;
const TITLE_STAGGER_SEC = 0.06;
const TITLE_START_SEC = 0.3;
const LINE_DRAW_SEC = 1.6;
const LINE_START_SEC = 0.9;
const MARKER_START_SEC = 2.4;

// ── Component ──────────────────────────────────────────────────────────────

export const SmallMultiples: React.FC<{ data: SmallMultiplesData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const fps = layout.fps;
  const t = frame / fps;
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();

  // ── Grid sizing ──────────────────────────────────────────────────────────

  const { cols, rows } = useMemo(() => {
    if (data.grid) return data.grid;
    const n = data.cells.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    return { cols, rows };
  }, [data.grid, data.cells.length]);

  // ── Axis ranges ──────────────────────────────────────────────────────────

  const sharedX = data.sharedX ?? true;
  const sharedY = data.sharedY ?? true;

  const allPoints = useMemo(
    () => data.cells.flatMap((c) => c.data),
    [data.cells],
  );

  const sharedXRange = useMemo(() => {
    const xs = allPoints.map((p) => p.x);
    return { min: Math.min(...xs), max: Math.max(...xs) };
  }, [allPoints]);
  const sharedYRange = useMemo(() => {
    const ys = allPoints.map((p) => p.y);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    // Pad y range 8% top/bottom for breathing room.
    const pad = (max - min) * 0.08 || 1;
    return { min: min - pad, max: max + pad };
  }, [allPoints]);

  function cellXRange(cell: SmallMultiplesCell): { min: number; max: number } {
    if (sharedX) return sharedXRange;
    const xs = cell.data.map((p) => p.x);
    return { min: Math.min(...xs), max: Math.max(...xs) };
  }
  function cellYRange(cell: SmallMultiplesCell): { min: number; max: number } {
    if (sharedY) return sharedYRange;
    const ys = cell.data.map((p) => p.y);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const pad = (max - min) * 0.08 || 1;
    return { min: min - pad, max: max + pad };
  }

  // ── Geometry ─────────────────────────────────────────────────────────────

  const canvasW = layout.width;
  const canvasH = layout.height;
  const titleTop = layout.spacing.xl;
  const titleHeight = data.title || data.subtitle ? 130 : 0;
  const sourceHeight = data.source ? 40 : 0;
  const xLabelHeight = data.xLabel ? 28 : 0;
  const yLabelWidth = data.yLabel ? 36 : 0;
  const padLeft = 100 + yLabelWidth;
  const padRight = 80;
  const padBottom = sourceHeight + xLabelHeight + 50;
  const gridTop = titleTop + titleHeight + 30;
  const gridWidth = canvasW - padLeft - padRight;
  const gridHeight = canvasH - gridTop - padBottom;
  const gapX = 32;
  const gapY = 44;
  const cellW = (gridWidth - gapX * (cols - 1)) / cols;
  const cellH = (gridHeight - gapY * (rows - 1)) / rows;

  // Within-cell padding for axis ticks.
  const cellPadL = 50;
  const cellPadR = 12;
  const cellPadT = 28; // room for cell title
  const cellPadB = 22;

  // ── Visual tokens ────────────────────────────────────────────────────────

  const lineDefault = mode === "dark" ? palette.bone : palette.ink;
  // The focal-case line uses the episode's primary accent so per-episode
  // colour identity carries through (e.g., a Soviet-era episode's red-ochre
  // emphasis paints the China cell crimson rather than gold).
  const lineAccent = emphasis.primaryAccent ?? palette.gold;
  const axisColor = mode === "dark" ? palette.taupe : palette.sand;
  const gridColor = mode === "dark" ? palette.midnight : palette.sand;
  const tickColor = mode === "dark" ? palette.taupe : palette.walnut;

  // ── Render cells ─────────────────────────────────────────────────────────

  const yTickCount = data.yTickCount ?? 3;

  function fmt(n: number): string {
    if (Math.abs(n) >= 1000) {
      return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(1);
  }

  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        <HeaderStrip metadata={data.episode} mode={mode} />
        {/* Canonical title block — POLISH.md L13. */}
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
            syncPoints={direction.syncPoints}
          />
        )}

        {/* Y-axis global label */}
        {data.yLabel && (
          <div
            style={{
              position: "absolute",
              left: padLeft - yLabelWidth - 14,
              top: gridTop + gridHeight / 2,
              transform: "translateY(-50%) rotate(-90deg)",
              transformOrigin: "center",
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: theme.text.muted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {data.yLabel}
          </div>
        )}

        {/* X-axis global label */}
        {data.xLabel && (
          <div
            style={{
              position: "absolute",
              top: gridTop + gridHeight + 18,
              left: padLeft,
              right: padRight,
              textAlign: "center",
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: theme.text.muted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {data.xLabel}
          </div>
        )}

        {/* Grid */}
        <svg
          width={canvasW}
          height={canvasH}
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {data.cells.map((cell, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cellX = padLeft + col * (cellW + gapX);
            const cellY = gridTop + row * (cellH + gapY);
            const innerX = cellX + cellPadL;
            const innerY = cellY + cellPadT;
            const innerW = cellW - cellPadL - cellPadR;
            const innerH = cellH - cellPadT - cellPadB;

            const xR = cellXRange(cell);
            const yR = cellYRange(cell);

            const sx = (x: number): number =>
              innerX + ((x - xR.min) / (xR.max - xR.min || 1)) * innerW;
            const sy = (y: number): number =>
              innerY + innerH - ((y - yR.min) / (yR.max - yR.min || 1)) * innerH;

            const titleReveal = Math.min(
              1,
              Math.max(0, (t - (TITLE_START_SEC + i * TITLE_STAGGER_SEC)) / TITLE_FADE_SEC),
            );
            const lineReveal = Math.min(
              1,
              Math.max(0, (t - LINE_START_SEC) / LINE_DRAW_SEC),
            );
            const markerReveal = Math.min(
              1,
              Math.max(0, (t - MARKER_START_SEC) / 0.4),
            );

            // Build draw-in segment up to lineReveal proportion.
            const pointsForDraw = computeDrawPoints(cell.data, lineReveal, sx, sy);

            // Y-ticks (sparse).
            const yTicks: number[] = [];
            for (let ti = 0; ti < yTickCount; ti++) {
              const tNorm = ti / Math.max(1, yTickCount - 1);
              yTicks.push(yR.min + tNorm * (yR.max - yR.min));
            }

            return (
              <g key={`cell-${i}`}>
                {/* Cell background hairline frame */}
                <rect
                  x={cellX}
                  y={cellY}
                  width={cellW}
                  height={cellH}
                  fill="none"
                  stroke={gridColor}
                  strokeWidth={1}
                  opacity={0.6}
                />
                {/* Y-axis ticks */}
                {yTicks.map((y, yi) => {
                  const yp = sy(y);
                  return (
                    <g key={`yt-${i}-${yi}`} opacity={titleReveal * 0.65}>
                      <line
                        x1={innerX}
                        y1={yp}
                        x2={innerX + innerW}
                        y2={yp}
                        stroke={gridColor}
                        strokeWidth={0.5}
                        strokeDasharray="2 4"
                      />
                      <text
                        x={innerX - 6}
                        y={yp + 4}
                        textAnchor="end"
                        fontFamily={fonts.mono}
                        fontSize={fontSizes.meta}
                        fill={tickColor}
                      >
                        {fmt(y)}{data.yUnit ?? ""}
                      </text>
                    </g>
                  );
                })}
                {/* Reference line if specified */}
                {data.referenceY != null &&
                  data.referenceY >= yR.min &&
                  data.referenceY <= yR.max && (
                    <line
                      x1={innerX}
                      y1={sy(data.referenceY)}
                      x2={innerX + innerW}
                      y2={sy(data.referenceY)}
                      stroke={axisColor}
                      strokeWidth={1}
                      opacity={titleReveal * 0.8}
                    />
                  )}
                {/* X-axis baseline */}
                <line
                  x1={innerX}
                  y1={innerY + innerH}
                  x2={innerX + innerW}
                  y2={innerY + innerH}
                  stroke={axisColor}
                  strokeWidth={1}
                  opacity={titleReveal}
                />
                {/* First and last x labels */}
                {titleReveal > 0 && (
                  <>
                    <text
                      x={innerX}
                      y={innerY + innerH + 16}
                      textAnchor="start"
                      fontFamily={fonts.mono}
                      fontSize={10}
                      fill={tickColor}
                      opacity={titleReveal}
                    >
                      {fmt(xR.min)}
                    </text>
                    <text
                      x={innerX + innerW}
                      y={innerY + innerH + 16}
                      textAnchor="end"
                      fontFamily={fonts.mono}
                      fontSize={10}
                      fill={tickColor}
                      opacity={titleReveal}
                    >
                      {fmt(xR.max)}
                    </text>
                  </>
                )}
                {/* Cell title */}
                <text
                  x={cellX + 8}
                  y={cellY + 20}
                  fontFamily={fonts.display}
                  fontSize={cell.accent ? fontSizes.label + 1 : fontSizes.label - 1}
                  fontWeight={cell.accent ? fontWeights.semibold : fontWeights.medium}
                  fill={cell.accent ? lineAccent : (mode === "dark" ? palette.bone : palette.ink)}
                  opacity={titleReveal}
                >
                  {cell.title}
                </text>
                {cell.subtitle && (
                  <text
                    x={cellX + 6}
                    y={cellY + 33}
                    fontFamily={fonts.mono}
                    fontSize={10}
                    fill={tickColor}
                    opacity={titleReveal}
                    letterSpacing={1}
                  >
                    {cell.subtitle.toUpperCase()}
                  </text>
                )}
                {/* Cell badge (top-right) */}
                {cell.badge && (
                  <text
                    x={cellX + cellW - 6}
                    y={cellY + 18}
                    textAnchor="end"
                    fontFamily={fonts.mono}
                    fontSize={fontSizes.caption}
                    fontWeight={fontWeights.semibold}
                    fill={lineAccent}
                    opacity={Math.min(1, markerReveal)}
                  >
                    {cell.badge}
                  </text>
                )}
                {/* Line — accent cells get a 2x-weight line + drop shadow
                    so they read as the focal case in a quick scan. The
                    structural argument of small-multiples is "look at the
                    one that's different"; we make that one loud. */}
                {lineReveal > 0 && (
                  <polyline
                    points={pointsForDraw}
                    fill="none"
                    stroke={cell.accent ? lineAccent : lineDefault}
                    strokeWidth={cell.accent ? 4 : 1.8}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={cell.accent ? 1 : 0.85}
                  />
                )}
                {/* Highlight marker — epsilon-match on x to survive
                    JSON-parsed floats (e.g., x=2010 may arrive as
                    2009.9999999 from certain authoring pipelines). */}
                {cell.highlight && markerReveal > 0 && (() => {
                  const hx = cell.highlight!.x;
                  const hp = cell.data.find(
                    (p) => Math.abs(p.x - hx) < 0.001,
                  );
                  if (!hp) return null;
                  return (
                    <g opacity={markerReveal}>
                      <circle
                        cx={sx(hp.x)}
                        cy={sy(hp.y)}
                        r={5}
                        fill={lineAccent}
                        stroke={mode === "dark" ? palette.midnight : palette.paper}
                        strokeWidth={2}
                      />
                      {cell.highlight!.label && (
                        <text
                          x={sx(hp.x)}
                          y={sy(hp.y) - 12}
                          textAnchor="middle"
                          fontFamily={fonts.mono}
                          fontSize={fontSizes.meta + 1}
                          fontWeight={fontWeights.medium}
                          fill={lineAccent}
                          letterSpacing={0.5}
                        >
                          {cell.highlight!.label}
                        </text>
                      )}
                    </g>
                  );
                })()}
              </g>
            );
          })}
        </svg>

        {/* Canonical source attribution — POLISH.md L6. */}
        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
        <FooterStrip mode={mode} />
      </AbsoluteFill>
    </Background>
  );
};

// ── Draw-in helper ─────────────────────────────────────────────────────────

/**
 * Produces a points-string for `polyline` that traces only up to `progress`
 * fraction of the line. Interpolates the partial segment for smoothness.
 * Memoization not strictly needed but matches the existing template idiom.
 */
function computeDrawPoints(
  data: ReadonlyArray<{ x: number; y: number }>,
  progress: number,
  sx: (x: number) => number,
  sy: (y: number) => number,
): string {
  if (progress <= 0) return "";
  if (progress >= 1) {
    return data.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ");
  }
  const total = data.length - 1;
  const cursor = total * progress;
  const fullIdx = Math.floor(cursor);
  const frac = cursor - fullIdx;
  const parts: string[] = [];
  for (let i = 0; i <= fullIdx; i++) {
    parts.push(`${sx(data[i].x)},${sy(data[i].y)}`);
  }
  if (fullIdx < total) {
    const a = data[fullIdx];
    const b = data[fullIdx + 1];
    const ix = a.x + (b.x - a.x) * frac;
    const iy = a.y + (b.y - a.y) * frac;
    parts.push(`${sx(ix)},${sy(iy)}`);
  }
  return parts.join(" ");
}

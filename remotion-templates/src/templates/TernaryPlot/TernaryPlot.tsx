/**
 * TernaryPlot — three-way composition on an equilateral triangle.
 *
 * Each point's (a, b, c) values place it via barycentric coordinates:
 *   corner A at the top, corner B at the bottom-right, corner C at the
 *   bottom-left. A point with a=1 sits at the top corner; balanced
 *   shares cluster toward the centroid.
 *
 * Animation sequence:
 *   1. Title fades in (handled by TitleBlock).
 *   2. Triangle outline draws (stroke-dash reveal).
 *   3. Corner labels fade in.
 *   4. Gridlines + tick labels fade in (if `gridlines !== false`).
 *   5. Points appear with stagger (perItem ~sec(0.08)), scaling from
 *      0 to their final radius.
 *   6. Highlight labels fade in last.
 *   7. Optional centroid + marker.
 *   8. Ken Burns drift + exit fade (via useCompositionAnimation).
 *
 * Geometry — for side length L, the height of an equilateral triangle
 * is L * sqrt(3) / 2. Cartesian from barycentric:
 *   x = a*Ax + b*Bx + c*Cx
 *   y = a*Ay + b*By + c*Cy
 * where the corners A (top), B (bottom-right), C (bottom-left) are
 * positioned around the chart center with that height.
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
  contentArea,
} from "../../design/theme";
import {
  fadeIn,
  stagger,
  exitFade,
  anticipatoryStartFrame,
  CLAMP_CUBIC,
  CLAMP_QUARTIC,
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
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useThemeMode } from "../../hooks/useThemeMode";
import { checkChartDataCommon, warnIf } from "../../utils/dataWarnings";
import type { TernaryPlotData, TernaryPoint } from "./types";

// Equilateral triangle height factor — √3/2. Defined here rather than via
// `Math.SQRT3` (which TypeScript's lib.es5 doesn't expose) so this stays a
// build-time constant.
const SQRT3 = Math.sqrt(3);

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Normalize a single point's (a, b, c) so the triple sums to 1.0.
 * Tolerates both fraction (sum≈1) and percent (sum≈100) input.
 * Returns zeros when the sum is non-positive (caller has already
 * warnIf'd; render proceeds with a benign centroid placement).
 */
const normalizeTriple = (
  a: number,
  b: number,
  c: number,
): { a: number; b: number; c: number } => {
  const sum = a + b + c;
  if (sum <= 0) return { a: 0, b: 0, c: 0 };
  return { a: a / sum, b: b / sum, c: c / sum };
};

const clampSize = (s: number | undefined): number => {
  if (!s || !Number.isFinite(s)) return 1;
  return Math.max(0.4, Math.min(3.0, s));
};

export const TernaryPlot: React.FC<{ data: TernaryPlotData }> = ({ data }) => {
  checkChartDataCommon("TernaryPlot", data);
  warnIf(
    (data.points?.length ?? 0) > 80,
    "TernaryPlot",
    `${data.points?.length} points — TernaryPlot reads cleanest at 10–60 ` +
      `points. Above 80, marker overlap dominates and individual highlights ` +
      `get lost in the cluster. Consider faceting by category or moving to ` +
      `a 2D scatter for higher density.`,
  );
  // Detect points whose triples sum to neither ~1 nor ~100 — almost always
  // a data-entry error (mixed units, missing component). Tolerance is wide
  // because we normalize regardless, but the warning catches the case where
  // the editorial meaning is lost.
  const badPoint = (data.points ?? []).find((p) => {
    const s = p.a + p.b + p.c;
    if (s <= 0) return true;
    const close1 = Math.abs(s - 1) < 0.05;
    const close100 = Math.abs(s - 100) < 5;
    return !(close1 || close100);
  });
  warnIf(
    !!badPoint,
    "TernaryPlot",
    `Point "${badPoint?.id ?? ""}" has a+b+c=${
      badPoint ? (badPoint.a + badPoint.b + badPoint.c).toFixed(2) : "?"
    } — expected ~1.0 or ~100. Each point's three shares must sum to a ` +
      `single denominator. Values are normalized but the editorial intent ` +
      `is likely off.`,
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);
  // Per-episode emphasis: highlighted-point accent follows episode primary palette.
  const emphasis = useEpisodeColorEmphasis();
  const accent = emphasis.primaryAccent;
  const showGridlines = data.gridlines !== false;
  const showCentroid = data.centroid === true;

  // Pace-aware timing scale — same convention as RadarChart.
  const t = direction.paceTimingScale;

  // ── Geometry ─────────────────────────────────────────────────────────
  // Equilateral triangle inscribed in the content area. We size by the
  // tighter of (a) the content width with a comfortable inset for the
  // bottom-corner labels, (b) the content height minus reserved space
  // for the top corner label + axis tick labels.
  const area = useMemo(() => contentArea("content", "generous"), []);

  // Reserve breathing room: 60px above top corner for label, 40px below
  // bottom edge for corner labels.
  const topLabelPad = 60;
  const bottomLabelPad = 56;
  const sideLabelPad = 24;

  // Side length L constrained by both axes; triangle height = L * √3/2.
  const heightBudget = area.height - topLabelPad - bottomLabelPad;
  const widthBudget = area.width - sideLabelPad * 2;
  // Solve for the largest L that fits both:
  //   L ≤ widthBudget         (horizontal extent)
  //   L * √3/2 ≤ heightBudget (vertical extent)
  const L = Math.min(widthBudget, (heightBudget * 2) / SQRT3);
  const triHeight = (L * SQRT3) / 2;

  // Centered in the content area; nudge the centroid slightly downward
  // so the top corner label has more room than the bottom edge.
  const cxCenter = area.left + area.width / 2;
  const triTop = area.top + topLabelPad;
  const triBottom = triTop + triHeight;

  // Three corners. A=top, B=bottom-right, C=bottom-left.
  const cornerA = { x: cxCenter, y: triTop };
  const cornerB = { x: cxCenter + L / 2, y: triBottom };
  const cornerC = { x: cxCenter - L / 2, y: triBottom };

  /** Project a normalized barycentric (a, b, c) into Cartesian (x, y). */
  const project = (
    aN: number,
    bN: number,
    cN: number,
  ): { x: number; y: number } => ({
    x: aN * cornerA.x + bN * cornerB.x + cN * cornerC.x,
    y: aN * cornerA.y + bN * cornerB.y + cN * cornerC.y,
  });

  // ── Pre-projected points + centroid ──────────────────────────────────
  const projectedPoints = useMemo(
    () =>
      (data.points ?? []).map((p) => {
        const { a, b, c } = normalizeTriple(p.a, p.b, p.c);
        const { x, y } = project(a, b, c);
        return { point: p, x, y, a, b, c };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.points, cornerA.x, cornerA.y, cornerB.x, cornerB.y, cornerC.x, cornerC.y],
  );

  const centroidXY = useMemo(() => {
    if (!showCentroid || projectedPoints.length === 0) return null;
    let aMean = 0;
    let bMean = 0;
    let cMean = 0;
    for (const p of projectedPoints) {
      aMean += p.a;
      bMean += p.b;
      cMean += p.c;
    }
    const n = projectedPoints.length;
    return project(aMean / n, bMean / n, cMean / n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectedPoints, showCentroid, cornerA.x, cornerA.y, cornerB.x, cornerB.y, cornerC.x, cornerC.y]);

  // ── Timing ───────────────────────────────────────────────────────────
  // D17 anticipatory reveal: triangle outline settled when narrator names it.
  const firstSyncFrame = direction.syncPoints?.[0]?.frame;
  const entranceBase = firstSyncFrame != null
    ? anticipatoryStartFrame(firstSyncFrame, sec(0.4))
    : sec(0.3 * t); // existing default
  const outlineStart = entranceBase;
  const outlineDur = sec(0.9 * t);
  const cornerLabelStart = outlineStart + sec(0.5 * t);
  const gridStart = outlineStart + outlineDur;
  const pointsStart = gridStart + sec(0.5 * t);
  const highlightLabelStart = pointsStart + sec(0.6 * t);
  const centroidStart = pointsStart + sec(0.8 * t);
  const exitOp = exitFade(frame, durationInFrames, 15);

  // Triangle outline — single closed polyline drawn via stroke-dash.
  const outlineProgress = interpolate(
    frame,
    [outlineStart, outlineStart + outlineDur],
    [0, 1],
    CLAMP_CUBIC,
  );
  // Closed equilateral perimeter: 3 * L. Add 4px slop for floating-point.
  const perimeter = 3 * L + 4;

  // Subdued tones for the structural ink (axis frame, gridlines).
  const outlineColor = theme.text.secondary;
  const gridlineColor = theme.text.muted;

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={bgVariant} metadata={data.episode} />
        <FooterStrip mode={bgVariant} />

        {/* Title wrapped in an absolutely-positioned div so the
            FadeIn's transform + center origin can't accidentally
            collapse the TitleBlock's positioning context — the
            regression-safe pattern documented in NetworkDiagram. */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={bgVariant}
            safeAreaTier="generous"
            syncPoints={direction.syncPoints}
          />
        </div>

        {/* ── Reading cue ──────────────────────────────────────────────
            Optional "how to read this" caption for first-time viewers
            of the ternary form. Sits between the title block and the
            top corner label — small italic mono-uppercase so it reads
            as editorial-newsroom annotation, not a heading. Fades in
            alongside the corner labels so the cue and what it describes
            arrive together. Position is `triTop - 56` which clears the
            top corner label (drawn at `cornerA.y - 22`, label fontSize
            18) with comfortable headroom above. */}
        {data.readingCue && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: triTop - 56,
              textAlign: "center",
              pointerEvents: "none",
              opacity:
                fadeIn(frame, cornerLabelStart, sec(0.4 * t)) * exitOp,
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              letterSpacing: letterSpacing.caption,
              color: theme.text.muted,
              fontStyle: "italic",
              textTransform: "uppercase",
            }}
          >
            {data.readingCue}
          </div>
        )}

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
          {/* ── Triangle outline ─────────────────────────────────────
              Closed path A → B → C → A, revealed via strokeDashoffset
              sweep. Single 3-segment polyline so the reveal feels like
              a single hand drawing the frame, not three separate lines. */}
          <path
            d={`M ${cornerA.x} ${cornerA.y} L ${cornerB.x} ${cornerB.y} L ${cornerC.x} ${cornerC.y} Z`}
            fill="none"
            stroke={outlineColor}
            strokeWidth={1.5}
            opacity={0.7 * exitOp}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={`${perimeter} ${perimeter}`}
            strokeDashoffset={perimeter * (1 - outlineProgress)}
          />

          {/* ── Gridlines + tick labels ───────────────────────────────
              At t ∈ {0.25, 0.50, 0.75}, draw the three line families
              parallel to each edge. The line family parallel to edge BC
              (the bottom edge, "constant-A") connects:
                point with a=t on edge AB  →  point with a=t on edge AC
              and similarly for the other two families. */}
          {showGridlines && (
            <g opacity={fadeIn(frame, gridStart, sec(0.5 * t)) * exitOp}>
              {[0.25, 0.5, 0.75].map((tFrac) => {
                // Family 1 — constant A (parallel to edge BC).
                // On edge AB: barycentric (a=tFrac, b=1-tFrac, c=0)
                // On edge AC: barycentric (a=tFrac, b=0, c=1-tFrac)
                const f1A = project(tFrac, 1 - tFrac, 0);
                const f1B = project(tFrac, 0, 1 - tFrac);
                // Family 2 — constant B (parallel to edge AC).
                // On edge AB: (a=1-tFrac, b=tFrac, c=0)
                // On edge BC: (a=0, b=tFrac, c=1-tFrac)
                const f2A = project(1 - tFrac, tFrac, 0);
                const f2B = project(0, tFrac, 1 - tFrac);
                // Family 3 — constant C (parallel to edge AB).
                // On edge AC: (a=1-tFrac, b=0, c=tFrac)
                // On edge BC: (a=0, b=1-tFrac, c=tFrac)
                const f3A = project(1 - tFrac, 0, tFrac);
                const f3B = project(0, 1 - tFrac, tFrac);
                const pct = `${Math.round(tFrac * 100)}%`;

                return (
                  <g key={`grid-${tFrac}`}>
                    <line
                      x1={f1A.x}
                      y1={f1A.y}
                      x2={f1B.x}
                      y2={f1B.y}
                      stroke={gridlineColor}
                      strokeWidth={1}
                      opacity={0.15}
                    />
                    <line
                      x1={f2A.x}
                      y1={f2A.y}
                      x2={f2B.x}
                      y2={f2B.y}
                      stroke={gridlineColor}
                      strokeWidth={1}
                      opacity={0.15}
                    />
                    <line
                      x1={f3A.x}
                      y1={f3A.y}
                      x2={f3B.x}
                      y2={f3B.y}
                      stroke={gridlineColor}
                      strokeWidth={1}
                      opacity={0.15}
                    />
                    {/* Tick labels — one per family, sitting just outside
                        the triangle perimeter on the edge the family
                        terminates on. We use the "a=t" end on edge AC
                        (left edge) for family 1, the "b=t" end on edge AB
                        (right edge) for family 2, and the "c=t" end on
                        edge BC (bottom edge) for family 3. */}
                    {/* Family 1 tick on left edge AC — offset to the left */}
                    <text
                      x={f1B.x - 10}
                      y={f1B.y}
                      textAnchor="end"
                      dominantBaseline="central"
                      fill={theme.text.muted}
                      fontSize={fontSizes.meta}
                      fontFamily={fonts.mono}
                      letterSpacing={letterSpacing.meta}
                      opacity={0.55}
                    >
                      {pct}
                    </text>
                    {/* Family 2 tick on right edge AB — offset to the right */}
                    <text
                      x={f2A.x + 10}
                      y={f2A.y}
                      textAnchor="start"
                      dominantBaseline="central"
                      fill={theme.text.muted}
                      fontSize={fontSizes.meta}
                      fontFamily={fonts.mono}
                      letterSpacing={letterSpacing.meta}
                      opacity={0.55}
                    >
                      {pct}
                    </text>
                    {/* Family 3 tick on bottom edge BC — offset downward */}
                    <text
                      x={f3B.x}
                      y={f3B.y + 16}
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      fill={theme.text.muted}
                      fontSize={fontSizes.meta}
                      fontFamily={fonts.mono}
                      letterSpacing={letterSpacing.meta}
                      opacity={0.55}
                    >
                      {pct}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ── Corner labels ────────────────────────────────────────── */}
          <g opacity={fadeIn(frame, cornerLabelStart, sec(0.4 * t)) * exitOp}>
            <text
              x={cornerA.x}
              y={cornerA.y - 22}
              textAnchor="middle"
              dominantBaseline="alphabetic"
              fill={theme.text.primary}
              fontSize={fontSizes.label}
              fontFamily={fonts.heading}
              fontWeight={700}
              letterSpacing={letterSpacing.label}
              style={{ textTransform: "uppercase" }}
            >
              {data.axisLabels.a}
            </text>
            <text
              x={cornerB.x + 18}
              y={cornerB.y + 6}
              textAnchor="start"
              dominantBaseline="hanging"
              fill={theme.text.primary}
              fontSize={fontSizes.label}
              fontFamily={fonts.heading}
              fontWeight={700}
              letterSpacing={letterSpacing.label}
              style={{ textTransform: "uppercase" }}
            >
              {data.axisLabels.b}
            </text>
            <text
              x={cornerC.x - 18}
              y={cornerC.y + 6}
              textAnchor="end"
              dominantBaseline="hanging"
              fill={theme.text.primary}
              fontSize={fontSizes.label}
              fontFamily={fonts.heading}
              fontWeight={700}
              letterSpacing={letterSpacing.label}
              style={{ textTransform: "uppercase" }}
            >
              {data.axisLabels.c}
            </text>
          </g>

          {/* ── Points ───────────────────────────────────────────────── */}
          {projectedPoints.map((proj, i) => {
            const p: TernaryPoint = proj.point;
            const isHighlight = p.highlight === true;
            // Base radius 6px; highlight 10px. `size` scales linearly.
            const baseR = isHighlight ? 10 : 6;
            const r = baseR * clampSize(p.size);
            // Non-highlight dot color was `theme.text.muted` which on a
            // bone background reads barely-there — visible review showed
            // the bottom-left and bottom-right clusters disappearing into
            // the paper. `theme.text.secondary` carries enough weight to
            // hold the data layer above the substrate while still letting
            // amber highlights pop.
            const fill = isHighlight
              ? accent
              : p.color || theme.text.secondary;

            const start = pointsStart + stagger(i, sec(0.08 * t));
            // Scale-in: 0 → 1 over sec(0.35*t), eased quartic so the
            // discs "settle" rather than pop.
            const appear = interpolate(
              frame,
              [start, start + sec(0.35 * t)],
              [0, 1],
              CLAMP_QUARTIC,
            );
            const op = fadeIn(frame, start, sec(0.25 * t)) * exitOp;
            const renderedR = r * appear;

            return (
              <g key={`pt-${p.id}`} opacity={op}>
                {/* Halo on the highlight discs — accent at low opacity
                    to lift them above the data cloud. */}
                {isHighlight && (
                  <circle
                    cx={proj.x}
                    cy={proj.y}
                    r={renderedR + 6}
                    fill={accent}
                    opacity={0.18}
                  />
                )}
                <circle
                  cx={proj.x}
                  cy={proj.y}
                  r={renderedR}
                  fill={fill}
                  stroke={theme.bg.base}
                  strokeWidth={isHighlight ? 2 : 1}
                  opacity={isHighlight ? 0.95 : 0.75}
                />
              </g>
            );
          })}

          {/* ── Highlight labels ──────────────────────────────────────
              Drawn after points so they overlay correctly. Anchored
              above-right of each highlighted disc with a small backing
              rect for legibility against the data cloud. */}
          {projectedPoints.map((proj, i) => {
            const p = proj.point;
            if (!p.highlight || !p.label) return null;
            const start = highlightLabelStart + stagger(i, sec(0.06 * t));
            const op = fadeIn(frame, start, sec(0.45 * t)) * exitOp;
            const labelWidth = p.label.length * 7 + 14;
            const labelOffsetX = 14;
            const labelOffsetY = -18;
            return (
              <g key={`lbl-${p.id}`} opacity={op}>
                {/* Connector tick from disc to label backing */}
                <line
                  x1={proj.x}
                  y1={proj.y}
                  x2={proj.x + labelOffsetX - 4}
                  y2={proj.y + labelOffsetY + 8}
                  stroke={accent}
                  strokeWidth={1}
                  opacity={0.7}
                />
                <rect
                  x={proj.x + labelOffsetX - 6}
                  y={proj.y + labelOffsetY - 2}
                  width={labelWidth}
                  height={18}
                  fill={theme.bg.base}
                  opacity={0.82}
                  rx={2}
                />
                <text
                  x={proj.x + labelOffsetX}
                  y={proj.y + labelOffsetY + 12}
                  textAnchor="start"
                  fill={theme.text.primary}
                  fontSize={fontSizes.caption}
                  fontFamily={fonts.mono}
                  fontWeight={500}
                  letterSpacing={letterSpacing.caption}
                >
                  {p.label}
                </text>
              </g>
            );
          })}

          {/* ── Centroid marker ────────────────────────────────────── */}
          {showCentroid && centroidXY && (
            <g opacity={fadeIn(frame, centroidStart, sec(0.4 * t)) * exitOp}>
              {/* + glyph */}
              <line
                x1={centroidXY.x - 9}
                y1={centroidXY.y}
                x2={centroidXY.x + 9}
                y2={centroidXY.y}
                stroke={theme.text.secondary}
                strokeWidth={1.5}
              />
              <line
                x1={centroidXY.x}
                y1={centroidXY.y - 9}
                x2={centroidXY.x}
                y2={centroidXY.y + 9}
                stroke={theme.text.secondary}
                strokeWidth={1.5}
              />
              <text
                x={centroidXY.x + 14}
                y={centroidXY.y + 4}
                textAnchor="start"
                fill={theme.text.secondary}
                fontSize={fontSizes.meta}
                fontFamily={fonts.mono}
                letterSpacing={letterSpacing.meta}
                style={{ textTransform: "uppercase" }}
              >
                Mean
              </text>
            </g>
          )}
        </svg>

        <SourceAttribution
          source={data.source}
          mode={bgVariant}
          prefix="Source: "
        />
      </AbsoluteFill>
    </Background>
  );
};


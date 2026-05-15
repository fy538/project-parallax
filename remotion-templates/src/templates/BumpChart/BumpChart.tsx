/**
 * BumpChart — animated rank-over-time chart.
 *
 * Shows N entities tracing their rank position over M time periods.
 * The "power transition" chart where rank crossings are the editorial argument.
 *
 * Ranks are COMPUTED from entity values (not authored). Lines draw
 * column-by-column with cubic-bezier interpolation between rank positions
 * so crossings read as smooth power transitions rather than sharp diagonal jumps.
 *
 * Animation sequence:
 *   1. Title fade in (frames 0–15)
 *   2. Axis structures draw (sec 0.3)
 *   3. Period column labels fade in (sec 0.4)
 *   4. Lines draw column-by-column (sec 0.3 per column, staggered per entity)
 *   5. Node dots pulse in at each column landing
 *   6. End-of-line labels fade in (anti-collision)
 *   7. Ken Burns drift + exit fade
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
  semantic,
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  getCategoricalColor,
} from "../../design/theme";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { Background } from "../../components/Background";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useDirection } from "../../hooks/useDirection";
import { fadeIn, exitFade, CLAMP_SINE, CLAMP_CUBIC } from "../../utils/animation";
import { warnIf } from "../../utils/dataWarnings";
import type { BumpChartData } from "./types";

// ── Layout constants ────────────────────────────────────────────────────────

const SAFE_TOP = layout.safeAreaTier.generous.top;
const SAFE_LEFT = layout.safeAreaTier.generous.left;
const SAFE_RIGHT = layout.safeAreaTier.generous.right;
const SAFE_BOTTOM = layout.safeAreaTier.generous.bottom;

// Title block height (h2 + optional subtitle) — generous budget for 2-line titles
const TITLE_BLOCK_H = 150;
// Gap between title block bottom and chart area top
const TITLE_GAP = layout.spacing.xl;
// Reserve space at bottom for x-axis period labels + footer
const XAXIS_H = 48;
// Rank label gutter on left side
const RANK_GUTTER = 32;
// Right gutter for end-of-line entity labels
const LABEL_GUTTER = 200;

// ── Rank computation ────────────────────────────────────────────────────────

interface RankMap {
  [entityId: string]: number[];
}

function computeRanks(
  entities: BumpChartData["entities"],
  periods: string[],
  rankDirection: "asc" | "desc"
): RankMap {
  const rankMap: RankMap = {};
  for (const e of entities) {
    rankMap[e.id] = [];
  }

  for (let p = 0; p < periods.length; p++) {
    const period = periods[p];
    // Build (entityId, value) pairs for this period
    const vals: Array<{ id: string; value: number }> = entities.map((e) => {
      const entry = e.values.find((v) => String(v.period) === String(period));
      return { id: e.id, value: entry?.value ?? 0 };
    });

    // Sort by value: desc → highest is rank 1; asc → lowest is rank 1
    const sorted = [...vals].sort((a, b) =>
      rankDirection === "desc" ? b.value - a.value : a.value - b.value
    );

    sorted.forEach((item, rankIdx) => {
      rankMap[item.id].push(rankIdx + 1);
    });
  }

  return rankMap;
}

// ── Main component ──────────────────────────────────────────────────────────

export const BumpChart: React.FC<{ data: BumpChartData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = useThemeMode("light");
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation({ ...direction.driftOptions, noExit: true });

  const { entities, periods } = data;
  const rankDirection = data.rankDirection ?? "desc";
  const highlightIds = data.highlightIds ?? [];

  // ── Semantic data warnings ───────────────────────────────────────────────
  warnIf(
    entities.length > 10,
    "BumpChart",
    "BumpChart: more than 10 entities will be unreadable; use highlightIds to dim non-essential lines"
  );
  warnIf(
    periods.length > 12,
    "BumpChart",
    "BumpChart: more than 12 periods will compress the x-axis; consider reducing time resolution"
  );
  warnIf(
    entities.some((e) => e.values.length !== periods.length),
    "BumpChart",
    "BumpChart: entity value count doesn't match periods length; check data",
    { entityValueCounts: entities.map((e) => ({ id: e.id, count: e.values.length })) }
  );
  // holdAfterRevealSec: after all lines finish drawing, hold for this many
  // seconds before beginning the exit fade. Mirrors the pattern in DataChart.
  const holdFrames = sec(data.holdAfterRevealSec ?? 0);
  warnIf(
    holdFrames > 0 && durationInFrames - holdFrames < sec(2.5),
    "BumpChart",
    `holdAfterRevealSec=${data.holdAfterRevealSec} leaves less than 2.5s for entrances + exit fade. Increase durationSec or reduce holdAfterRevealSec.`
  );

  // ── Rank computation (memoized) ──────────────────────────────────────────
  const rankMap = useMemo(
    () => computeRanks(entities, periods, rankDirection),
    [entities, periods, rankDirection]
  );

  const numRanks = entities.length;
  const numPeriods = periods.length;

  // ── Chart geometry ───────────────────────────────────────────────────────
  const chartLeft = SAFE_LEFT + RANK_GUTTER;
  const chartTop = SAFE_TOP + TITLE_BLOCK_H + TITLE_GAP;
  const chartRight = layout.width - SAFE_RIGHT - LABEL_GUTTER;
  const chartBottom = layout.height - SAFE_BOTTOM - XAXIS_H;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Column spacing: evenly distribute period columns across chartWidth
  const colSpacing = numPeriods > 1 ? chartWidth / (numPeriods - 1) : chartWidth;

  // Row spacing: rank positions evenly distributed, rank 1 at top
  const rowSpacing = numRanks > 1 ? chartHeight / (numRanks - 1) : chartHeight;

  const getX = (colIndex: number): number => chartLeft + colIndex * colSpacing;
  const getY = (rank: number): number => chartTop + (rank - 1) * rowSpacing;

  // ── Animation timing ────────────────────────────────────────────────────
  // Lines draw column-by-column: each segment from col i → col i+1
  // takes sec(0.3). Entities stagger by sec(0.05) within each column.
  const segDuration = sec(0.3);
  const entityStagger = sec(0.05);

  // Get the frame at which entity i's segment from col (c) to col (c+1) starts
  const segStart = (entityIndex: number, colIndex: number): number => {
    // Overall column phase starts at sec(0.5)
    const colPhaseStart = sec(0.5) + colIndex * segDuration;
    return colPhaseStart + entityIndex * entityStagger;
  };

  // Frame at which entity i's last segment finishes
  const lineFinishFrame = (entityIndex: number): number => {
    return segStart(entityIndex, numPeriods - 2) + segDuration;
  };

  // ── End-label anti-collision ─────────────────────────────────────────────
  // Sort by final rank y-position, then push down overlapping labels
  const endLabelPositions = useMemo(() => {
    const entries = entities.map((entity, i) => {
      const finalRank = rankMap[entity.id]?.[numPeriods - 1] ?? i + 1;
      return { i, entity, finalY: getY(finalRank) };
    });
    // Sort by y ascending (top to bottom)
    const sorted = [...entries].sort((a, b) => a.finalY - b.finalY);
    const MIN_GAP = 24;
    for (let k = 1; k < sorted.length; k++) {
      const prev = sorted[k - 1];
      const cur = sorted[k];
      if (cur.finalY - prev.finalY < MIN_GAP) {
        sorted[k] = { ...cur, finalY: prev.finalY + MIN_GAP };
      }
    }
    // Rebuild as map from entityId → adjusted Y
    const map: Record<string, number> = {};
    for (const entry of sorted) {
      map[entry.entity.id] = entry.finalY;
    }
    return map;
  }, [entities, rankMap, numPeriods, chartTop, chartHeight, numRanks]);

  // ── Entity color assignment ──────────────────────────────────────────────
  const entityColors = useMemo(
    () =>
      entities.map((entity, i) => entity.color ?? getCategoricalColor(i)),
    [entities]
  );

  // ── Render ───────────────────────────────────────────────────────────────
  const isAnyHighlighted = highlightIds.length > 0;

  // Hold phase: delay exit fade by holdFrames after all lines finish drawing.
  // exitFade starts from (durationInFrames - holdFrames) so the hold is
  // preserved at full opacity and only then the fade-out begins.
  const holdExitOpacity = exitFade(frame, durationInFrames - holdFrames, 15);

  return (
    <Background variant="light">
      <AbsoluteFill style={{ ...compStyle, opacity: holdExitOpacity }}>
        {/* Brand strips */}
        <HeaderStrip metadata={data.episode} mode="light" />
        <FooterStrip scale={data.unit ? `· ${data.unit}` : undefined} mode="light" />

        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          safeAreaTier="generous"
        />

        {/* ── Chart SVG ──────────────────────────────────────────────────── */}
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          {/* ── Y-axis rank labels (left side) ──────────────────────────── */}
          {Array.from({ length: numRanks }).map((_, rankIdx) => {
            const rank = rankIdx + 1;
            const y = getY(rank);
            const opacity = fadeIn(frame, sec(0.3), sec(0.3));
            return (
              <text
                key={`rank-${rank}`}
                x={SAFE_LEFT + RANK_GUTTER - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fill={theme.text.muted}
                fontSize={fontSizes.meta}
                fontFamily={fonts.data}
                opacity={opacity * 0.7}
              >
                {rank}
              </text>
            );
          })}

          {/* ── Horizontal rank gridlines ────────────────────────────────── */}
          {Array.from({ length: numRanks }).map((_, rankIdx) => {
            const rank = rankIdx + 1;
            const y = getY(rank);
            const gridOpacity = interpolate(
              frame,
              [sec(0.2), sec(0.5)],
              [0, 0.12],
              CLAMP_SINE
            );
            return (
              <line
                key={`grid-${rank}`}
                x1={chartLeft}
                y1={y}
                x2={chartRight}
                y2={y}
                stroke={theme.text.muted}
                strokeWidth={0.5}
                strokeOpacity={gridOpacity}
                strokeDasharray="4 4"
              />
            );
          })}

          {/* ── Per-entity bump lines ────────────────────────────────────── */}
          {entities.map((entity, entityIdx) => {
            const isHighlighted = isAnyHighlighted
              ? highlightIds.includes(entity.id)
              : true;
            const color = entityColors[entityIdx];
            const strokeWidth = isHighlighted ? 3 : 1.5;
            const colorOpacity = isHighlighted ? 1 : 0.6;

            const ranks = rankMap[entity.id] ?? [];

            // Draw one cubic bezier segment per column transition
            return (
              <g key={`entity-${entity.id}`}>
                {Array.from({ length: numPeriods - 1 }).map((_, colIdx) => {
                  const rank0 = ranks[colIdx] ?? 1;
                  const rank1 = ranks[colIdx + 1] ?? 1;
                  const x0 = getX(colIdx);
                  const y0 = getY(rank0);
                  const x1 = getX(colIdx + 1);
                  const y1 = getY(rank1);

                  const halfDx = (x1 - x0) / 2;
                  // Cubic bezier: M x0,y0 C (x0+halfDx),y0 (x1-halfDx),y1 x1,y1
                  const pathD = `M ${x0},${y0} C ${x0 + halfDx},${y0} ${x1 - halfDx},${y1} ${x1},${y1}`;

                  const start = segStart(entityIdx, colIdx);
                  const segProgress = interpolate(
                    frame,
                    [start, start + segDuration],
                    [0, 1],
                    CLAMP_CUBIC
                  );

                  if (segProgress <= 0) return null;

                  // Approximate path length for strokeDashoffset reveal
                  const dx = x1 - x0;
                  const dy = y1 - y0;
                  // Bezier arc length approximation: straight + curve penalty
                  const approxLen = Math.sqrt(dx * dx + dy * dy) * (1 + Math.abs(dy) / (Math.abs(dx) + 1) * 0.3);

                  return (
                    <path
                      key={`seg-${colIdx}`}
                      d={pathD}
                      fill="none"
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeOpacity={colorOpacity}
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - segProgress}
                      style={{
                        filter: isHighlighted
                          ? `drop-shadow(0 1px 4px ${color}40)`
                          : "none",
                      }}
                    />
                  );
                })}

                {/* ── Node dots at each period ────────────────────────────── */}
                {Array.from({ length: numPeriods }).map((_, colIdx) => {
                  const rank = ranks[colIdx] ?? 1;
                  const cx = getX(colIdx);
                  const cy = getY(rank);

                  // Dot appears when the incoming segment finishes drawing
                  // (or immediately for the first column)
                  const dotStartFrame =
                    colIdx === 0
                      ? segStart(entityIdx, 0)
                      : segStart(entityIdx, colIdx - 1) + segDuration;
                  const dotOpacity =
                    fadeIn(frame, dotStartFrame, sec(0.2)) * colorOpacity;

                  if (dotOpacity <= 0) return null;

                  const r = isHighlighted ? 6 : 4;

                  return (
                    <circle
                      key={`dot-${colIdx}`}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={color}
                      opacity={dotOpacity}
                      stroke={palette.paper}
                      strokeWidth={isHighlighted ? 2 : 1}
                      style={{
                        filter: isHighlighted
                          ? `drop-shadow(0 0 6px ${color}60)`
                          : "none",
                      }}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* ── Period (x-axis) labels ───────────────────────────────────── */}
          {periods.map((period, colIdx) => {
            const x = getX(colIdx);
            const opacity = fadeIn(frame, sec(0.4), sec(0.3));
            return (
              <text
                key={`period-${colIdx}`}
                x={x}
                y={chartBottom + 28}
                textAnchor="middle"
                fill={theme.text.muted}
                fontSize={fontSizes.caption}
                fontFamily={fonts.data}
                opacity={opacity * 0.8}
              >
                {period}
              </text>
            );
          })}
        </svg>

        {/* ── End-of-line entity labels (HTML for font rendering quality) ─── */}
        {entities.map((entity, entityIdx) => {
          const isHighlighted = isAnyHighlighted
            ? highlightIds.includes(entity.id)
            : true;
          const color = entityColors[entityIdx];
          const colorOpacity = isHighlighted ? 1 : 0.6;

          const endLabelStart = lineFinishFrame(entityIdx) + sec(0.1);
          const labelOpacity = fadeIn(frame, endLabelStart, sec(0.3)) * colorOpacity;

          if (labelOpacity < 0.01) return null;

          const adjustedY = endLabelPositions[entity.id] ?? getY(rankMap[entity.id]?.[numPeriods - 1] ?? 1);

          return (
            <div
              key={`label-${entity.id}`}
              style={{
                position: "absolute",
                left: chartRight + 16,
                top: adjustedY - fontSizes.body / 2,
                opacity: labelOpacity,
                fontSize: isHighlighted ? fontSizes.body : fontSizes.caption,
                fontFamily: isHighlighted ? fonts.display : fonts.body,
                fontWeight: isHighlighted ? 600 : 500,
                color,
                whiteSpace: "nowrap",
                textShadow: shadows.textLift,
                lineHeight: 1,
                maxWidth: LABEL_GUTTER - 20,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {entity.label}
            </div>
          );
        })}

        {/* ── Source attribution ───────────────────────────────────────────── */}
        <SourceAttribution
          source={data.source}
          mode="light"
          prefix="Source: "
          startSec={2}
        />
      </AbsoluteFill>
    </Background>
  );
};

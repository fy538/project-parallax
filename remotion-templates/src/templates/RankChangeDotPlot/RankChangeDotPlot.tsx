/**
 * RankChangeDotPlot — "before → after" ranking chart.
 *
 * Each entity has a dot at its before-rank and a dot at its after-rank,
 * connected by a line. Sorted by magnitude of change. Used for
 * "what did policy X change in the rankings?"
 *
 * Animation sequence per item:
 *   1. Label fades in
 *   2. Before dot appears + scale from 0→1
 *   3. Connecting line draws left-to-right via strokeDashoffset
 *   4. After dot appears + scale from 0→1
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
} from "../../design/theme";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { Background } from "../../components/Background";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  stagger,
  exitFade,
  CLAMP_SINE,
  CLAMP_CUBIC,
} from "../../utils/animation";
import { warnIf } from "../../utils/dataWarnings";
import type { RankChangeDotPlotData, RankChangeDotPlotItem } from "./types";

// ── Color resolution ────────────────────────────────────────────────────────

function resolveColor(item: RankChangeDotPlotItem, isRankData: boolean): string {
  if (
    !item.color ||
    item.color === "up" ||
    item.color === "down" ||
    item.color === "neutral"
  ) {
    const delta = item.after - item.before;
    // rank: lower is better (negative delta = improved); value: higher is better
    const improved = isRankData ? delta < 0 : delta > 0;
    if (item.color === "neutral" || delta === 0) return palette.walnut;
    if (improved || item.color === "up") return palette.gold;
    return semantic.china;
  }
  return item.color;
}

// ── Main component ──────────────────────────────────────────────────────────

export const RankChangeDotPlot: React.FC<{ data: RankChangeDotPlotData }> = ({
  data,
}) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const theme = useThemeMode("light");
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  // ── Validation guards ──────────────────────────────────────────────────
  warnIf(
    data.items.length > 20,
    "RankChangeDotPlot",
    "more than 20 items will compress row height; consider top-N filtering"
  );
  warnIf(
    data.items.length < 3,
    "RankChangeDotPlot",
    "fewer than 3 items looks sparse; use StatReveal for a single comparison"
  );

  // ── Resolved options ───────────────────────────────────────────────────
  const sortBy = data.sortBy ?? "change";
  const isRankData = data.isRankData ?? true;
  const highlightIds = useMemo(
    () => new Set(data.highlightIds ?? []),
    [data.highlightIds]
  );
  const beforeLabel = data.beforeLabel ?? "Before";
  const afterLabel = data.afterLabel ?? "After";

  // ── Sort items ─────────────────────────────────────────────────────────
  const sorted = useMemo<RankChangeDotPlotItem[]>(() => {
    return [...data.items].sort((a, b) => {
      switch (sortBy) {
        case "change":
          return (
            Math.abs(b.after - b.before) - Math.abs(a.after - a.before)
          );
        case "after":
          return a.after - b.after;
        case "before":
          return a.before - b.before;
        case "label":
          return a.label.localeCompare(b.label);
      }
    });
  }, [data.items, sortBy]);

  // ── Layout constants ───────────────────────────────────────────────────
  const safe = layout.safeAreaTier.generous;
  // Title block occupies the top portion; chart starts below it.
  const titleBlockHeight = 150;
  const chartTop =
    safe.top + titleBlockHeight + layout.spacing.xl;
  const chartBottom = layout.height - safe.bottom - 60; // leave room for footer
  const chartHeight = chartBottom - chartTop;
  const chartLeft = safe.left + 200; // label column to the left
  const chartRight = layout.width - safe.right;
  const chartWidth = chartRight - chartLeft;

  // Label column is to the left of chartLeft
  const labelColRight = chartLeft - layout.spacing.md; // right edge of labels
  const labelColLeft = safe.left;

  // Dot x positions within the chart
  const beforeX = chartLeft + chartWidth * 0.3;
  const afterX = chartLeft + chartWidth * 0.7;

  const rowHeight = useMemo(() => {
    const computed = Math.floor(chartHeight / Math.max(sorted.length, 1));
    return Math.max(28, Math.min(52, computed));
  }, [chartHeight, sorted.length]);

  // ── Column header animation ────────────────────────────────────────────
  const headerOpacity = interpolate(
    frame,
    [sec(0.5), sec(0.5) + sec(0.35)],
    [0, 1],
    CLAMP_SINE
  );

  const unit = data.unit ?? "";

  return (
    <Background variant="light">
      <AbsoluteFill
        style={{
          ...compStyle,
          opacity: exitFade(frame, durationInFrames, 15),
        }}
      >
        {/* Brand strips */}
        <HeaderStrip metadata={data.episode} mode="light" />
        <FooterStrip
          scale={unit ? `SCALE · ${unit}` : undefined}
          mode="light"
        />

        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          safeAreaTier="generous"
        />

        {/* ── Column headers ──────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: chartTop - layout.spacing.lg,
            left: 0,
            right: 0,
            opacity: headerOpacity,
            pointerEvents: "none",
          }}
        >
          {[
            { label: beforeLabel, x: beforeX },
            { label: afterLabel, x: afterX },
          ].map(({ label, x }) => (
            <div
              key={label}
              style={{
                position: "absolute",
                left: x,
                transform: "translateX(-50%)",
                fontSize: fontSizes.label,
                fontFamily: fonts.metadata,
                fontWeight: 600,
                color: theme.text.secondary,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                textAlign: "center",
                whiteSpace: "nowrap",
                textShadow: shadows.textLift,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* ── SVG — connecting lines + dots ───────────────────────────── */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          {sorted.map((item, i) => {
            const isHighlighted = highlightIds.has(item.label);
            const isMuted = highlightIds.size > 0 && !isHighlighted;
            const color = resolveColor(item, isRankData);
            const rowY = chartTop + (i + 0.5) * rowHeight;

            // Animation timings
            const itemStart = stagger(i, sec(0.08), sec(0.6));
            const lineStart = itemStart + sec(0.25);
            const afterDotStart = itemStart + sec(0.5);

            // Line draw via strokeDashoffset
            const lineLength = Math.abs(afterX - beforeX);
            const lineProgress = interpolate(
              frame,
              [lineStart, lineStart + sec(0.35)],
              [0, 1],
              CLAMP_CUBIC
            );
            const dashOffset = lineLength * (1 - lineProgress);

            // Dot scales
            const beforeDotScale = interpolate(
              frame,
              [itemStart + sec(0.1), itemStart + sec(0.1) + sec(0.2)],
              [0, 1],
              CLAMP_CUBIC
            );
            const afterDotScale = interpolate(
              frame,
              [afterDotStart, afterDotStart + sec(0.2)],
              [0, 1],
              CLAMP_CUBIC
            );

            const dotRadius = isHighlighted ? 8 : 6;
            const strokeWidth = isHighlighted ? 2.5 : 1.5;
            const lineOpacity = isMuted ? 0.45 : 0.85;
            const dotOpacity = isMuted
              ? 0.45 * fadeIn(frame, itemStart + sec(0.1), sec(0.2))
              : fadeIn(frame, itemStart + sec(0.1), sec(0.2));

            // Before dot glow for highlighted items
            const glowFilter = isHighlighted
              ? `drop-shadow(0 0 6px ${color}80)`
              : undefined;

            return (
              <g key={`row-${i}`}>
                {/* Connecting line */}
                <line
                  x1={beforeX}
                  y1={rowY}
                  x2={afterX}
                  y2={rowY}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={lineLength}
                  strokeDashoffset={dashOffset}
                  opacity={lineOpacity}
                  strokeLinecap="round"
                />

                {/* Before dot */}
                <circle
                  cx={beforeX}
                  cy={rowY}
                  r={dotRadius * beforeDotScale}
                  fill={color}
                  opacity={dotOpacity}
                  filter={glowFilter}
                />

                {/* After dot */}
                <circle
                  cx={afterX}
                  cy={rowY}
                  r={dotRadius * afterDotScale}
                  fill={color}
                  opacity={
                    isMuted
                      ? 0.45 * fadeIn(frame, afterDotStart, sec(0.2))
                      : fadeIn(frame, afterDotStart, sec(0.2))
                  }
                  filter={glowFilter}
                />

                {/* Before value annotation — below before dot */}
                <text
                  x={beforeX}
                  y={rowY + dotRadius + 14}
                  textAnchor="middle"
                  fill={isMuted ? `${palette.ink}66` : theme.text.muted}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.data}
                  opacity={
                    isMuted
                      ? 0.5 * fadeIn(frame, itemStart + sec(0.3), sec(0.25))
                      : fadeIn(frame, itemStart + sec(0.3), sec(0.25))
                  }
                >
                  {item.before}
                </text>

                {/* After value annotation + delta for highlighted items */}
                <text
                  x={afterX}
                  y={rowY + dotRadius + 14}
                  textAnchor="middle"
                  fill={isHighlighted ? color : isMuted ? `${palette.ink}66` : theme.text.muted}
                  fontSize={
                    isHighlighted ? fontSizes.caption : fontSizes.meta
                  }
                  fontFamily={isHighlighted ? fonts.display : fonts.data}
                  fontWeight={isHighlighted ? 600 : 400}
                  opacity={
                    isMuted
                      ? 0.5 * fadeIn(frame, afterDotStart + sec(0.1), sec(0.25))
                      : fadeIn(frame, afterDotStart + sec(0.1), sec(0.25))
                  }
                >
                  {isHighlighted
                    ? `${item.after} (${item.after - item.before > 0 ? "+" : ""}${item.after - item.before})`
                    : `${item.after}`}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ── Labels — rendered as HTML for text features ──────────────── */}
        {sorted.map((item, i) => {
          const isHighlighted = highlightIds.has(item.label);
          const isMuted = highlightIds.size > 0 && !isHighlighted;
          const rowY = chartTop + (i + 0.5) * rowHeight;
          const itemStart = stagger(i, sec(0.08), sec(0.6));
          const labelOpacity = fadeIn(frame, itemStart, sec(0.25));

          return (
            <div
              key={`label-${i}`}
              style={{
                position: "absolute",
                top: rowY - fontSizes.body / 2,
                left: labelColLeft,
                width: labelColRight - labelColLeft,
                textAlign: "right",
                paddingRight: layout.spacing.md,
                fontSize: isHighlighted ? fontSizes.body : fontSizes.body,
                fontFamily: fonts.body,
                fontWeight: isHighlighted ? 700 : 400,
                color: isMuted ? `${palette.ink}80` : theme.text.primary,
                opacity: labelOpacity * (isMuted ? 0.7 : 1),
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1,
                textShadow: shadows.textLift,
                pointerEvents: "none",
              }}
            >
              {item.label}
            </div>
          );
        })}

        {/* ── Source attribution ──────────────────────────────────────── */}
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

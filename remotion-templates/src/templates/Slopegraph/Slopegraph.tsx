/**
 * Slopegraph — Tufte's "before/after at two points in time" chart.
 *
 * Two vertical axes (left = baseline, right = endpoint). Each entity has a
 * value at each axis; a line connects them. The slope IS the story — when
 * one entity moves against the trend, the slopegraph makes the exception
 * unmistakable.
 *
 * Always renders inside EditorialFrame (no opt-in fallback). The chart's
 * own composition IS the editorial frame's content slot.
 */

import React, { useMemo } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  sec,
} from "../../design/theme";
import { fadeIn, easings } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { EditorialFrame } from "../../components/EditorialFrame/EditorialFrame";
import type { Rect } from "../../components/EditorialFrame/EditorialFrame";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { SlopegraphData, SlopegraphEntity } from "./types";

export const Slopegraph: React.FC<{ data: SlopegraphData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  useDirection(data._direction, "none");
  useCompositionAnimation();

  // Default frame if none supplied — slopegraph is editorial-frame-native.
  const frameProps = data.frame ?? {
    title: data.title,
    layout: "centered" as const,
    chrome: "publication" as const,
    legend: "suppressed" as const,
    source: data.source,
  };

  // Compute combined value domain
  const { yMin, yMax } = useMemo(() => {
    const all = data.entities.flatMap((e) => [e.leftValue, e.rightValue]);
    const rawMin = Math.min(...all);
    const rawMax = Math.max(...all);
    const pad = (rawMax - rawMin) * 0.15 || 1;
    return { yMin: rawMin - pad, yMax: rawMax + pad };
  }, [data.entities]);

  return (
    <EditorialFrame
      frame={frameProps}
      episode={data.episode}
      durationInFrames={durationInFrames}
    >
      {(chartRect) => (
        <SlopegraphContent
          entities={data.entities}
          leftLabel={data.leftLabel}
          rightLabel={data.rightLabel}
          unit={data.unit}
          chartRect={chartRect}
          yMin={yMin}
          yMax={yMax}
          frame={frame}
        />
      )}
    </EditorialFrame>
  );
};

// ── Chart content ────────────────────────────────────────────────────────────

const SlopegraphContent: React.FC<{
  entities: SlopegraphEntity[];
  leftLabel: string;
  rightLabel: string;
  unit?: string;
  chartRect: Rect;
  yMin: number;
  yMax: number;
  frame: number;
}> = ({ entities, leftLabel, rightLabel, unit, chartRect, yMin, yMax, frame }) => {
  const theme = useThemeMode("light");

  const AXIS_INSET = 120; // room for entity labels on left + values on right
  const TOP_PAD = 40; // room for axis titles
  const BOT_PAD = 30;
  const leftX = AXIS_INSET;
  const rightX = chartRect.width - AXIS_INSET;
  const plotTop = TOP_PAD;
  const plotBot = chartRect.height - BOT_PAD;

  const yScale = (v: number): number => {
    const t = (v - yMin) / Math.max(0.0001, yMax - yMin);
    return plotBot - t * (plotBot - plotTop);
  };

  const unitStr = unit ?? "";

  return (
    <svg
      width={chartRect.width}
      height={chartRect.height}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {/* Axis labels (left / right column titles) */}
      <text
        x={leftX}
        y={20}
        fill={theme.text.muted}
        textAnchor="middle"
        style={{
          fontFamily: fonts.mono,
          fontSize: fontSizes.meta,
          letterSpacing: letterSpacing.meta,
          textTransform: "uppercase",
        }}
        opacity={fadeIn(frame, sec(0.3), sec(0.5))}
      >
        {leftLabel}
      </text>
      <text
        x={rightX}
        y={20}
        fill={theme.text.muted}
        textAnchor="middle"
        style={{
          fontFamily: fonts.mono,
          fontSize: fontSizes.meta,
          letterSpacing: letterSpacing.meta,
          textTransform: "uppercase",
        }}
        opacity={fadeIn(frame, sec(0.3), sec(0.5))}
      >
        {rightLabel}
      </text>

      {/* Vertical axis rules */}
      <line
        x1={leftX}
        y1={plotTop - 8}
        x2={leftX}
        y2={plotBot + 8}
        stroke={theme.text.muted}
        strokeWidth={1}
        opacity={fadeIn(frame, sec(0.4), sec(0.4)) * 0.5}
      />
      <line
        x1={rightX}
        y1={plotTop - 8}
        x2={rightX}
        y2={plotBot + 8}
        stroke={theme.text.muted}
        strokeWidth={1}
        opacity={fadeIn(frame, sec(0.4), sec(0.4)) * 0.5}
      />

      {/* Entity slope lines + endpoints */}
      {entities.map((e, i) => {
        const y1 = yScale(e.leftValue);
        const y2 = yScale(e.rightValue);
        const isHero = e.hero === true;
        const heroExists = entities.some((x) => x.hero);
        const isMuted = heroExists && !isHero;
        const accentColor = e.color ?? (isHero ? palette.gold : palette.umber);
        const renderColor = isMuted
          ? palette.taupe
          : accentColor;
        const strokeWidth = isHero ? 3 : 1.5;

        const drawStart = sec(0.6) + i * sec(0.08);
        const drawDuration = sec(0.9);
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

        // Line drawn from left endpoint to interpolated current position
        const currX = leftX + (rightX - leftX) * drawProgress;
        const currY = y1 + (y2 - y1) * drawProgress;
        const labelOpacity = fadeIn(frame, drawStart + drawDuration - sec(0.2), sec(0.4));

        return (
          <g key={i}>
            {/* Slope line */}
            <line
              x1={leftX}
              y1={y1}
              x2={currX}
              y2={currY}
              stroke={renderColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={drawProgress}
            />
            {/* Left endpoint dot */}
            <circle
              cx={leftX}
              cy={y1}
              r={isHero ? 5 : 3.5}
              fill={renderColor}
              opacity={fadeIn(frame, drawStart - sec(0.2), sec(0.3))}
            />
            {/* Right endpoint dot — appears as line completes */}
            <circle
              cx={rightX}
              cy={y2}
              r={isHero ? 5 : 3.5}
              fill={renderColor}
              opacity={drawProgress}
            />
            {/* Left label (entity name + value) */}
            <text
              x={leftX - 18}
              y={y1 + 4}
              fill={isMuted ? theme.text.muted : theme.text.primary}
              textAnchor="end"
              style={{
                fontFamily: fonts.body,
                fontSize: isHero ? fontSizes.label : fontSizes.caption,
                fontWeight: isHero ? fontWeights.bold : fontWeights.regular,
              }}
              opacity={fadeIn(frame, drawStart - sec(0.2), sec(0.3))}
            >
              {e.label} {Math.round(e.leftValue)}
              {unitStr}
            </text>
            {/* Right label (entity name + value) */}
            <text
              x={rightX + 18}
              y={y2 + 4}
              fill={isMuted ? theme.text.muted : theme.text.primary}
              textAnchor="start"
              style={{
                fontFamily: fonts.body,
                fontSize: isHero ? fontSizes.label : fontSizes.caption,
                fontWeight: isHero ? fontWeights.bold : fontWeights.regular,
              }}
              opacity={labelOpacity}
            >
              {e.label} {Math.round(e.rightValue)}
              {unitStr}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

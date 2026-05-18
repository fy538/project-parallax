/**
 * PricingWaterfallEditorial — editorial render path for PricingWaterfall.
 *
 * Wraps value-chain decomposition inside EditorialFrame with publication
 * composition. The vertical stacked bar renders inside the chart slot;
 * the hero stage (the editorial "3% to the farmer" sliver) gets accent
 * color treatment; supporting stages render in muted bone with stage
 * labels offset to the side.
 *
 * Activated when `data.frame` is set. When absent, PricingWaterfall.tsx
 * falls through to its existing render code path.
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
import { fadeIn, easings } from "../../utils/animation";
import { useDirection } from "../../hooks/useDirection";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { EditorialFrame } from "../../components/EditorialFrame/EditorialFrame";
import type { Rect } from "../../components/EditorialFrame/EditorialFrame";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { PricingWaterfallData, PricingWaterfallStage } from "./types";

interface PricingWaterfallEditorialProps {
  data: PricingWaterfallData & {
    frame: NonNullable<PricingWaterfallData["frame"]>;
  };
}

export const PricingWaterfallEditorial: React.FC<PricingWaterfallEditorialProps> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  useDirection(data._direction, "none");
  useCompositionAnimation();

  return (
    <EditorialFrame
      frame={data.frame}
      episode={data.episode}
      durationInFrames={durationInFrames}
    >
      {(chartRect) => (
        <WaterfallContent
          stages={data.stages}
          total={data.total}
          chartRect={chartRect}
          frame={frame}
        />
      )}
    </EditorialFrame>
  );
};

const WaterfallContent: React.FC<{
  stages: PricingWaterfallStage[];
  total: PricingWaterfallData["total"];
  chartRect: Rect;
  frame: number;
}> = ({ stages, total, chartRect, frame }) => {
  const theme = useThemeMode("light");

  // Vertical layout — bar takes ~30% of chart width on the left, labels on
  // the right with leader lines connecting to each segment centroid.
  const BAR_WIDTH = Math.min(160, chartRect.width * 0.18);
  const BAR_X = chartRect.width * 0.32 - BAR_WIDTH / 2;
  const TOP_PAD = 20;
  const BOT_PAD = 60; // room for the "total" caption beneath
  const barHeight = chartRect.height - TOP_PAD - BOT_PAD;

  // Sum check — should be ~100. Normalize regardless for safety.
  const sumShare = useMemo(
    () => stages.reduce((s, st) => s + st.share, 0) || 1,
    [stages],
  );

  // Render stages BOTTOM-up so the bar visually "builds" from origin to
  // destination. First stage = bottom of bar.
  let cursorY = TOP_PAD + barHeight;

  return (
    <svg
      width={chartRect.width}
      height={chartRect.height}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {/* Stage segments (rendered bottom-up; iterate in order so the
       *  first stage is at the bottom of the bar). */}
      {stages.map((stage, i) => {
        const segHeight = (stage.share / sumShare) * barHeight;
        const segTop = cursorY - segHeight;
        const segCenter = cursorY - segHeight / 2;
        cursorY -= segHeight;

        const drawStart = sec(0.4) + i * sec(0.12);
        const grow = interpolate(
          frame,
          [drawStart, drawStart + sec(0.8)],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: easings.bar,
          },
        );
        const labelFade = fadeIn(frame, drawStart + sec(0.5), sec(0.4));

        const isHero = stage.hero === true;
        const heroExists = stages.some((s) => s.hero);
        const isMuted = heroExists && !isHero;
        const fillColor = stage.color
          ? stage.color
          : isHero
            ? palette.gold
            : isMuted
              ? palette.taupe
              : palette.umber;

        // Drawn segment grows from its bottom edge upward.
        const drawnTop = cursorY + segHeight - segHeight * grow;

        return (
          <g key={i}>
            {/* Segment fill */}
            <rect
              x={BAR_X}
              y={drawnTop}
              width={BAR_WIDTH}
              height={segHeight * grow}
              fill={fillColor}
            />
            {/* Leader line from segment right edge to label */}
            <line
              x1={BAR_X + BAR_WIDTH}
              y1={segCenter}
              x2={BAR_X + BAR_WIDTH + 40}
              y2={segCenter}
              stroke={isMuted ? theme.text.muted : theme.text.primary}
              strokeWidth={1}
              opacity={labelFade * 0.7}
            />
            {/* Stage label */}
            <text
              x={BAR_X + BAR_WIDTH + 52}
              y={segCenter - 4}
              fill={isMuted ? theme.text.secondary : theme.text.primary}
              style={{
                fontFamily: fonts.heading,
                fontSize: isHero ? fontSizes.h3 - 4 : fontSizes.label,
                fontWeight: isHero ? fontWeights.bold : fontWeights.regular,
              }}
              opacity={labelFade}
            >
              {stage.label}
            </text>
            {/* Share % */}
            <text
              x={BAR_X + BAR_WIDTH + 52}
              y={segCenter + 18}
              fill={isHero ? fillColor : theme.text.muted}
              style={{
                fontFamily: fonts.mono,
                fontSize: isHero ? fontSizes.label : fontSizes.caption,
                fontWeight: fontWeights.bold,
                letterSpacing: 0.5,
              }}
              opacity={labelFade}
            >
              {Math.round(stage.share)}%
            </text>
            {/* Descriptor (smaller, italic) */}
            {stage.descriptor && (
              <text
                x={BAR_X + BAR_WIDTH + 52}
                y={segCenter + 36}
                fill={theme.text.muted}
                style={{
                  fontFamily: fonts.serifBody,
                  fontStyle: "italic",
                  fontSize: fontSizes.caption,
                }}
                opacity={labelFade}
              >
                {stage.descriptor}
              </text>
            )}
          </g>
        );
      })}

      {/* Total caption beneath bar — SVG <text>, textMaxWidth not applicable (width
          constrained by BAR_WIDTH + textAnchor="middle"). */}
      <g
        transform={`translate(${BAR_X + BAR_WIDTH / 2}, ${TOP_PAD + barHeight + 24})`}
      >
        <text
          x={0}
          y={0}
          fill={theme.text.primary}
          textAnchor="middle"
          style={{
            fontFamily: fonts.heading,
            // textMaxWidth not applicable: SVG <text> width is constrained by
            // BAR_WIDTH + textAnchor="middle".
            fontSize: fontSizes.h2,
            fontWeight: fontWeights.bold,
            letterSpacing: -1,
          }}
          opacity={fadeIn(frame, sec(0.2), sec(0.5))}
        >
          {total.value}
        </text>
        <text
          x={0}
          y={26}
          fill={theme.text.muted}
          textAnchor="middle"
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
          }}
          opacity={fadeIn(frame, sec(0.4), sec(0.5))}
        >
          {total.label}
        </text>
      </g>
    </svg>
  );
};

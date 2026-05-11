/**
 * PricingWaterfall — vertical value-chain decomposition.
 *
 * Renders a fixed total split into stage segments. Hero stage (the "3%"
 * sliver) lands in accent color with a glow; supporting stages render in
 * muted bone. Stage labels sit to the right of the bar with leader lines
 * pointing to the centroid of each segment, alternating side when needed
 * to avoid label collision on small segments.
 *
 * Bar reads bottom-up: first stage at bottom (origin), last stage on top
 * (destination). This matches the editorial reading "the price BUILDS as
 * the bean travels through the chain."
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
  contentArea,
  textMaxWidth,
  shadows,
} from "../../design/theme";
import { fadeIn, slideIn, stagger, exitFade, CLAMP_CUBIC } from "../../utils/animation";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useThemeMode } from "../../hooks/useThemeMode";
import { TextureFilters } from "../../utils/textures";
import type { PricingWaterfallData } from "./types";

export const PricingWaterfall: React.FC<{ data: PricingWaterfallData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant || "light";
  const theme = useThemeMode(bgVariant);
  const emphasis = useEpisodeColorEmphasis();
  const accentColor = emphasis.primaryAccent;

  // Layout: kicker sits ABOVE the bar (anchoring the fixed total the
  // viewer should hold in mind); bar fills the vertical centerline; stage
  // labels sit on the right with leader lines pointing to segment centers.
  // Shifted slightly left so the right gutter has room for label content.
  const area = useMemo(() => contentArea("content", "generous"), []);
  const barWidth = 220;
  const kickerHeight = 120;
  const barTop = area.top + kickerHeight + 24;
  const barHeight = Math.min(area.height - kickerHeight - 60, 540);
  const barLeft = area.left + (area.width - barWidth) / 2 - 240;
  const kickerLeft = barLeft - 40;

  // Pre-compute segment positions (bottom-up).
  const totalShare = useMemo(
    () => data.stages.reduce((s, st) => s + st.share, 0),
    [data.stages]
  );
  const segments = useMemo(() => {
    let cumulativeBottom = 0;
    return data.stages.map((stage) => {
      const heightPx = (stage.share / totalShare) * barHeight;
      const segBottom = cumulativeBottom; // pixels from bar bottom
      cumulativeBottom += heightPx;
      const segTop = cumulativeBottom;
      return {
        stage,
        heightPx,
        // y-coordinates in canvas space (top-down): bar bottom = barTop + barHeight
        yBottom: barTop + barHeight - segBottom,
        yTop: barTop + barHeight - segTop,
        yCenter: barTop + barHeight - (segBottom + segTop) / 2,
      };
    });
  }, [data.stages, totalShare, barHeight, barTop]);

  // Label-stacking pass — when segments are small (Farm 3% = 16px), stage
  // labels collide. Iterate bottom-up, enforcing a minimum vertical gap
  // between label centers. Pushed labels render with a kinked leader line
  // from segment-center to label-center via an inflection point at the
  // segment edge, so the connection stays legible.
  const minLabelGap = 56;
  const labelPositions = useMemo(() => {
    // Sort segments by their desired (segment-center) y, ascending (top-down)
    const sorted = segments
      .map((seg, idx) => ({ idx, desiredY: seg.yCenter, yCenter: seg.yCenter }))
      .sort((a, b) => a.desiredY - b.desiredY);
    // Top-down pass: each label is at least minLabelGap below the previous
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      if (sorted[i].yCenter - prev.yCenter < minLabelGap) {
        sorted[i].yCenter = prev.yCenter + minLabelGap;
      }
    }
    // If the last label exceeds bar bottom + buffer, shift the entire stack up
    const lastY = sorted[sorted.length - 1].yCenter;
    const maxY = barTop + barHeight + 30;
    if (lastY > maxY) {
      const overflow = lastY - maxY;
      sorted.forEach((s) => { s.yCenter -= overflow; });
    }
    // Restore original index order
    const positionByIdx: Record<number, number> = {};
    sorted.forEach((s) => { positionByIdx[s.idx] = s.yCenter; });
    return segments.map((_, i) => positionByIdx[i]);
  }, [segments, barTop, barHeight]);

  // Animation timeline
  const titleEnd = sec(0.8);
  const totalKickerStart = sec(0.4);
  const barStart = sec(1.0);
  const labelStart = sec(1.4);
  const exitOp = exitFade(frame, durationInFrames, 15);

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      motionIdentity={data.motionIdentity}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={bgVariant} metadata={data.episode} />
        <FooterStrip mode={bgVariant} />

        {/* Title — wrapped in absolute container to ensure proper positioning
            context (regression-safe pattern; see NetworkDiagram L100 fix). */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={bgVariant}
            safeAreaTier="generous"
          />
        </div>

        {/* Total kicker — sits ABOVE the bar so it doesn't compete with
            stage labels. The fixed denominator the viewer should anchor
            against ($5 cup, 100¢). Renders horizontally: "OF EVERY · $5 ·
            specialty coffee retail" so it reads as a single editorial
            kicker line, not three stacked elements. */}
        <div
          style={{
            position: "absolute",
            top: area.top,
            left: kickerLeft,
            width: 800,
            height: kickerHeight,
            opacity: fadeIn(frame, totalKickerStart, sec(0.5)) * exitOp,
            display: "flex",
            alignItems: "baseline",
            gap: layout.spacing.lg,
            transform: `translateY(${slideIn(frame, totalKickerStart, 8, sec(0.5))}px)`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.meta,
              letterSpacing: letterSpacing.meta,
              textTransform: "uppercase",
              color: theme.text.muted,
              maxWidth: textMaxWidth.label,
              whiteSpace: "nowrap",
            }}
          >
            of every
          </div>
          <div
            style={{
              fontFamily: fonts.data,
              fontSize: fontSizes.display,
              fontWeight: 700,
              color: theme.text.primary,
              lineHeight: 1,
              maxWidth: textMaxWidth.h1,
            }}
          >
            {data.total.value}
          </div>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: fontSizes.body,
              color: theme.text.secondary,
              maxWidth: 380,
              lineHeight: 1.3,
              fontStyle: "italic",
            }}
          >
            {data.total.label}
          </div>
        </div>

        {/* Bar segments — render bottom-up with stagger. Hero segment lands
            in accent color with glow; others are muted bone. Each segment
            grows from its baseline (yBottom) upward into its yTop. */}
        <svg
          width={layout.width}
          height={layout.height}
          style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
        >
          <defs>
            <TextureFilters intensity={0.9} seed={11} />
          </defs>
          {/* Bar background track — full extent in muted color */}
          <rect
            x={barLeft}
            y={barTop}
            width={barWidth}
            height={barHeight}
            fill={theme.text.muted}
            opacity={0.08 * fadeIn(frame, barStart - sec(0.2), sec(0.3)) * exitOp}
            rx={4}
          />

          {segments.map(({ stage, heightPx, yBottom, yTop, yCenter }, i) => {
            const segStart = barStart + stagger(i, sec(0.18), sec(0.6));
            const segProgress = interpolate(
              frame,
              [segStart, segStart + sec(0.5)],
              [0, 1],
              CLAMP_CUBIC
            );
            const segColor = stage.hero
              ? accentColor
              : (stage.color || theme.text.secondary);
            const segOpacity = (stage.hero ? 1 : 0.6) * exitOp;
            // Animate height from 0 → heightPx, anchored at yBottom (segment grows upward)
            const animatedHeight = heightPx * segProgress;
            const animatedY = yBottom - animatedHeight;
            const isFirst = i === 0;
            const isLast = i === segments.length - 1;

            return (
              <g key={`seg-${i}`}>
                {/* Hero glow halo */}
                {stage.hero && (
                  <rect
                    x={barLeft - 4}
                    y={animatedY - 2}
                    width={barWidth + 8}
                    height={animatedHeight + 4}
                    fill={accentColor}
                    opacity={0.18 * segProgress}
                    rx={6}
                  />
                )}
                <rect
                  x={barLeft}
                  y={animatedY}
                  width={barWidth}
                  height={animatedHeight}
                  fill={segColor}
                  opacity={segOpacity * segProgress}
                  // Round the very bottom-most and very top-most segments only
                  // so the bar reads as one column.
                  rx={isFirst || isLast ? 4 : 0}
                  // Texture pass — multiply-blend noise gives the segment
                  // ink-on-paper density variation. Subtle but visible.
                  filter="url(#tx-printed)"
                />
                {/* Inner divider — thin highlight line between segments */}
                {!isFirst && (
                  <line
                    x1={barLeft}
                    y1={yBottom}
                    x2={barLeft + barWidth}
                    y2={yBottom}
                    stroke={theme.bg.base}
                    strokeWidth={1}
                    opacity={segProgress * 0.6}
                  />
                )}
                {/* Leader line — kinked path from segment center (on bar
                    edge) to the label's stacked y position. When the label
                    has been pushed away from the segment center to avoid
                    collision, the line bends at the segment-edge inflection
                    point so the connection reads as deliberate. */}
                {(() => {
                  const labelY = labelPositions[i];
                  const segEdgeX = barLeft + barWidth;
                  const labelX = barLeft + barWidth + 60;
                  const lineOpacity = fadeIn(frame, segStart + sec(0.3), sec(0.3)) * exitOp * (stage.hero ? 1 : 0.5);
                  const lineColor = stage.hero ? accentColor : theme.text.muted;
                  const lineWidth = stage.hero ? 1.5 : 1;
                  if (Math.abs(labelY - yCenter) < 1) {
                    // Straight line case
                    return (
                      <line
                        x1={segEdgeX}
                        y1={yCenter}
                        x2={labelX}
                        y2={labelY}
                        stroke={lineColor}
                        strokeWidth={lineWidth}
                        opacity={lineOpacity}
                      />
                    );
                  }
                  // Kinked path: short horizontal stub at segment center,
                  // diagonal to label-y, then horizontal stub to label.
                  const stubX = segEdgeX + 12;
                  return (
                    <path
                      d={`M ${segEdgeX} ${yCenter} L ${stubX} ${yCenter} L ${labelX - 12} ${labelY} L ${labelX} ${labelY}`}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={lineWidth}
                      opacity={lineOpacity}
                    />
                  );
                })()}
                <circle
                  cx={barLeft + barWidth}
                  cy={yCenter}
                  r={stage.hero ? 4 : 3}
                  fill={stage.hero ? accentColor : theme.text.muted}
                  opacity={fadeIn(frame, segStart + sec(0.3), sec(0.3)) * exitOp}
                />
              </g>
            );
          })}
        </svg>

        {/* Stage labels (right of bar, at stacked y positions to avoid
            collision on small segments) */}
        {segments.map(({ stage }, i) => {
          const segStart = barStart + stagger(i, sec(0.18), sec(0.6));
          const labelOpacity =
            fadeIn(frame, segStart + sec(0.4), sec(0.4)) * exitOp;
          const labelSlide = slideIn(frame, segStart + sec(0.4), 8, sec(0.4));
          const labelLeft = barLeft + barWidth + 72;
          const yCenter = labelPositions[i];

          return (
            <div
              key={`label-${i}`}
              style={{
                position: "absolute",
                top: yCenter,
                left: labelLeft,
                transform: `translateY(calc(-50% + ${labelSlide}px))`,
                opacity: labelOpacity,
                display: "flex",
                alignItems: "baseline",
                gap: layout.spacing.md,
                whiteSpace: "nowrap",
              }}
            >
              {/* Percentage / share — display weight, accent for hero */}
              <div
                style={{
                  fontFamily: fonts.data,
                  fontSize: stage.hero ? fontSizes.h2 : fontSizes.h3,
                  fontWeight: stage.hero ? 700 : 500,
                  color: stage.hero ? accentColor : theme.text.primary,
                  lineHeight: 1,
                  textShadow: stage.hero ? `0 0 16px ${accentColor}40` : undefined,
                  width: 100,
                  maxWidth: textMaxWidth.label,
                }}
              >
                {stage.share}%
              </div>
              {/* Stage name + descriptor */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: stage.hero ? fontSizes.h3 : fontSizes.body,
                    fontWeight: stage.hero ? 700 : 500,
                    color: theme.text.primary,
                    lineHeight: 1.1,
                    maxWidth: textMaxWidth.label,
                  }}
                >
                  {stage.label}
                </div>
                {stage.descriptor && (
                  <div
                    style={{
                      fontFamily: fonts.body,
                      fontSize: fontSizes.label,
                      color: theme.text.muted,
                      marginTop: 2,
                      lineHeight: 1.2,
                      maxWidth: textMaxWidth.label,
                    }}
                  >
                    {stage.descriptor}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <SourceAttribution
          source={data.source}
          mode={bgVariant}
          prefix="Source: "
          startSec={1.5}
        />
      </AbsoluteFill>
    </Background>
  );
};

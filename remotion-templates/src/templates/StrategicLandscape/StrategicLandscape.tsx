/**
 * StrategicLandscape — 2D matrix visualization of actors positioned on two axes.
 *
 * Actors appear as positioned bubbles with labels. Axes, axis labels, and optional
 * quadrant labels animate in sequence. Supports staggered actor reveal and Ken Burns drift.
 *
 * Animation sequence (usePhase):
 *   1. intro (1s): Title + axes fade in, axis lines draw from center outward
 *   2. populate (3s): Actors appear with staggered fadeIn + slideIn, bubbles scale up from 0
 *   3. labels (1.5s): Quadrant labels fade in if provided
 *   4. hold (2s): Ken Burns drift, everything visible
 *   5. exit (0.5s): exitFade
 */

import React from "react";
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
  contentArea,
  shadows,
} from "../../design/theme";
import { TitleBlock } from "../../components/TitleBlock";
import { Background } from "../../components/Background";
import { useDirection } from "../../hooks/useDirection";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useThemeMode } from "../../hooks/useThemeMode";
import { usePhase } from "../../hooks/usePhase";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
// Ken Burns handled via kenBurnsDrift utility, exit via exitFade
import {
  fadeIn,
  stagger,
  exitFade,
  kenBurnsDrift,
  CLAMP,
  CLAMP_CUBIC_INOUT,
  CLAMP_SINE,
} from "../../utils/animation";
import type { StrategicLandscapeData, Actor } from "./types";

// ── Constants & Config ──────────────────────────────────────────────────────

const BUBBLE_RADIUS_BASE = 48;
const AXIS_LINE_WIDTH = 1.5;
const PLOT_PADDING = 120; // Padding around plot area for labels

// Default actor color cycle — delegates to the shared categorical
// sequence in theme.ts. The local array previously had a bug:
// semantic.success is a legacy alias for semantic.us, so the cycle had
// two blue entries. The shared sequence (us → china → gold → umber →
// walnut → taupe) is genuinely distinct and reusable across templates.
import { categorical } from "../../design/theme";
const DEFAULT_ACTOR_COLORS = categorical;

// ── Helper: detect Chinese text ─────────────────────────────────────────────

const hasCJK = (text: string): boolean => /[一-鿿㐀-䶿]/.test(text);

// ── SVG Axis Component ──────────────────────────────────────────────────────

interface AxisProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
  color: string;
  strokeWidth?: number;
}

const Axis: React.FC<AxisProps> = React.memo(
  ({ x1, y1, x2, y2, opacity, color, strokeWidth = AXIS_LINE_WIDTH }) => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={strokeWidth}
      opacity={opacity}
      vectorEffect="non-scaling-stroke"
    />
  )
);

// ── Axis Label Component ────────────────────────────────────────────────────

interface AxisLabelProps {
  x: number;
  y: number;
  text: string;
  textAnchor: "start" | "middle" | "end";
  opacity: number;
  color: string;
  fontSize?: number;
}

const AxisLabel: React.FC<AxisLabelProps> = React.memo(
  ({ x, y, text, textAnchor, opacity, color, fontSize = fontSizes.label }) => (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      fill={color}
      fontSize={fontSize}
      fontFamily={fonts.mono}
      fontWeight={500}
      letterSpacing={0.5}
      opacity={opacity}
      style={{ filter: `drop-shadow(${shadows.textLift})` }}
    >
      {text}
    </text>
  )
);

// ── Quadrant Label Component ────────────────────────────────────────────────

interface QuadrantLabelProps {
  x: number;
  y: number;
  text: string;
  opacity: number;
  color: string;
}

const QuadrantLabel: React.FC<QuadrantLabelProps> = React.memo(
  ({ x, y, text, opacity, color }) => (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill={color}
      fontSize={fontSizes.caption}
      fontFamily={fonts.mono}
      fontWeight={400}
      letterSpacing={0.5}
      opacity={opacity}
      style={{ filter: `drop-shadow(${shadows.textLift})` }}
    >
      {text}
    </text>
  )
);

// ── Actor Bubble Component ──────────────────────────────────────────────────

interface ActorBubbleProps {
  actor: Actor;
  pixelX: number;
  pixelY: number;
  color: string;
  opacity: number;
  scaleProgress: number;
  textColor: string;
  textMutedColor: string;
}

const ActorBubble: React.FC<ActorBubbleProps> = React.memo(
  ({
    actor,
    pixelX,
    pixelY,
    color,
    opacity,
    scaleProgress,
    textColor,
    textMutedColor,
  }) => {
    const radius = BUBBLE_RADIUS_BASE * (actor.size || 1) * scaleProgress;
    const isCJK = actor.nameCn && hasCJK(actor.nameCn);

    return (
      <g opacity={opacity}>
        {/* Subtle fill — removes wireframe feel (cross-cutting fill rule) */}
        <circle
          cx={pixelX}
          cy={pixelY}
          r={radius}
          fill={color}
          opacity={0.12}
        />
        {/* Bubble stroke ring */}
        <circle
          cx={pixelX}
          cy={pixelY}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.8}
          vectorEffect="non-scaling-stroke"
        />
        {/* Icon inside bubble (if provided) */}
        {actor.icon && (
          <text
            x={pixelX}
            y={pixelY}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize={fontSizes.body}
            fontFamily={fonts.mono}
            fontWeight={600}
            letterSpacing={0.5}

          >
            {actor.icon}
          </text>
        )}
        {/* Name label below bubble */}
        <text
          x={pixelX}
          y={pixelY + radius + 32}
          textAnchor="middle"
          fill={textColor}
          fontSize={fontSizes.caption}
          fontFamily={isCJK ? fonts.chinese : fonts.mono}
          fontWeight={500}
          letterSpacing={0.5}
          style={{ filter: `drop-shadow(${shadows.textLift})` }}
        >
          {actor.nameCn || actor.name}
        </text>
        {/* English name as secondary label if nameCn exists */}
        {actor.nameCn && (
          <text
            x={pixelX}
            y={pixelY + radius + 48}
            textAnchor="middle"
            fill={textMutedColor}
            fontSize={fontSizes.caption}
            fontFamily={fonts.mono}
            fontWeight={400}
            letterSpacing={0.5}
            opacity={0.7}

          >
            {actor.name}
          </text>
        )}
      </g>
    );
  }
);

// ── Main Component ──────────────────────────────────────────────────────────

export const StrategicLandscape: React.FC<{ data: StrategicLandscapeData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const theme = useThemeMode(data.backgroundVariant === "dark" ? "dark" : "light");

  const phaseState = usePhase([
    { name: "intro", duration: sec(1) },
    { name: "populate", duration: sec(3) },
    { name: "labels", duration: sec(1.5) },
    { name: "hold", duration: sec(2) },
    { name: "exit", duration: sec(0.5) },
  ]);
  // Exit fade for last frames (L44 + L66).
  // useCompositionAnimation supplies the brand-standard exitOpacity.
  // noDrift: true keeps the manual kenBurnsDrift below at 1.01 (subtler than
  // the hook's default 1.06) as the single drift source.
  const { exitOpacity } = useCompositionAnimation({ noDrift: true });

  // ── Layout calculations ─────────────────────────────────────────────────
  const area = contentArea("minimal", "generous");
  const plotTop = area.top;
  const plotLeft = area.left + PLOT_PADDING;
  const plotWidth = area.width - 2 * PLOT_PADDING;
  const plotHeight = area.height - PLOT_PADDING;

  // Center point of the plot (for axis lines)
  const centerX = plotLeft + plotWidth / 2;
  const centerY = plotTop + plotHeight / 2;

  // ── Phase-based opacity animations ──────────────────────────────────────

  // Intro phase: axes fade in over 1 second
  const axesOpacity = phaseState.isPhase("intro")
    ? interpolate(phaseState.progress, [0, 1], [0, 1], CLAMP)
    : 1;

  // Labels phase: quadrant labels fade in
  const labelsOpacity = phaseState.isPhase("labels")
    ? interpolate(phaseState.progress, [0, 1], [0, 1], CLAMP_SINE)
    : phaseState.isPast("labels")
    ? 1
    : 0;


  // ── Render actor positions ──────────────────────────────────────────────

  // Computed per-frame — no useMemo (frame in deps would defeat caching)
  const actorElements = data.actors.map((actor, index) => {
      const colorIdx = index % DEFAULT_ACTOR_COLORS.length;
      const color = actor.color || DEFAULT_ACTOR_COLORS[colorIdx];

      // Map 0-100 to pixel coordinates
      const pixelX = plotLeft + (actor.x / 100) * plotWidth;
      const pixelY = plotTop + ((100 - actor.y) / 100) * plotHeight;

      // Stagger appearance during populate phase
      const staggerOffset = stagger(
        index,
        sec(0.15),
        phaseState.getPhaseStart("populate")
      );
      const actorStartFrame = phaseState.getPhaseStart("populate") + staggerOffset;

      const actorFadeIn = fadeIn(frame, actorStartFrame, sec(0.4));

      const scaleProgress = interpolate(
        frame,
        [actorStartFrame, actorStartFrame + sec(0.5)],
        [0, 1],
        CLAMP_CUBIC_INOUT
      );

      const opacity = actorFadeIn * exitOpacity;

      return (
        <ActorBubble
          key={`actor-${index}`}
          actor={actor}
          pixelX={pixelX}
          pixelY={pixelY}
          color={color}
          opacity={opacity}
          scaleProgress={scaleProgress}
          textColor={theme.text.primary}
          textMutedColor={theme.text.muted}
        />
      );
    });

  // ── Render quadrant labels ──────────────────────────────────────────────

  // Quadrant labels — computed per-frame (labelsOpacity changes each frame)
  const quadrantElements = (() => {
    if (!data.quadrantLabels) return null;

    const [tl, tr, bl, br] = data.quadrantLabels;
    const quarterX = plotLeft + plotWidth / 4;
    const quarterY = plotTop + plotHeight / 4;
    const labelColor = theme.text.muted;

    return (
      <>
        <QuadrantLabel x={quarterX} y={quarterY} text={tl} opacity={labelsOpacity} color={labelColor} />
        <QuadrantLabel x={plotLeft + (3 * plotWidth) / 4} y={quarterY} text={tr} opacity={labelsOpacity} color={labelColor} />
        <QuadrantLabel x={quarterX} y={plotTop + (3 * plotHeight) / 4} text={bl} opacity={labelsOpacity} color={labelColor} />
        <QuadrantLabel x={plotLeft + (3 * plotWidth) / 4} y={plotTop + (3 * plotHeight) / 4} text={br} opacity={labelsOpacity} color={labelColor} />
      </>
    );
  })();

  const bgVariant = data.backgroundVariant || "light";

  return (
    <Background
      variant={bgVariant}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={{ opacity: exitOpacity }}>
      <TitleBlock
        title={data.title}
        subtitle={data.subtitle}
        mode={bgVariant}
        safeAreaTier="generous"
      />

      <svg
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          transform: `scale(${kenBurnsDrift(frame, durationInFrames, 1.01)})`,
          transformOrigin: "center center",
        }}
      >
        {/* Subtle dot-grid background — gives scale and depth to empty quadrants */}
        <g opacity={axesOpacity * 0.6}>
          {(() => {
            const dotSpacing = 80;
            const cols = Math.floor(plotWidth / dotSpacing);
            const rows = Math.floor(plotHeight / dotSpacing);
            const dots: React.ReactNode[] = [];
            for (let r = 0; r <= rows; r++) {
              for (let c = 0; c <= cols; c++) {
                const dx = plotLeft + c * dotSpacing + (plotWidth - cols * dotSpacing) / 2;
                const dy = plotTop + r * dotSpacing + (plotHeight - rows * dotSpacing) / 2;
                dots.push(
                  <circle
                    key={`grid-dot-${r}-${c}`}
                    cx={dx}
                    cy={dy}
                    r={1.2}
                    fill={theme.text.muted}
                    opacity={0.13}
                  />
                );
              }
            }
            return dots;
          })()}
        </g>

        {/* Axis Lines (cross at center) */}
        <Axis
          x1={plotLeft}
          y1={centerY}
          x2={plotLeft + plotWidth}
          y2={centerY}
          opacity={axesOpacity}
          color={theme.text.muted}
          strokeWidth={AXIS_LINE_WIDTH}
        />
        <Axis
          x1={centerX}
          y1={plotTop}
          x2={centerX}
          y2={plotTop + plotHeight}
          opacity={axesOpacity}
          color={theme.text.muted}
          strokeWidth={AXIS_LINE_WIDTH}
        />

        {/* Axis arrowheads — turn lines into vectors signaling direction */}
        <g opacity={axesOpacity * 0.6}>
          {/* Right arrow (x-axis end) */}
          <polygon
            points={`${plotLeft + plotWidth - 6},${centerY - 4} ${plotLeft + plotWidth + 4},${centerY} ${plotLeft + plotWidth - 6},${centerY + 4}`}
            fill={theme.text.muted}
          />
          {/* Left arrow (x-axis start) */}
          <polygon
            points={`${plotLeft + 6},${centerY - 4} ${plotLeft - 4},${centerY} ${plotLeft + 6},${centerY + 4}`}
            fill={theme.text.muted}
          />
          {/* Up arrow (y-axis top) */}
          <polygon
            points={`${centerX - 4},${plotTop + 6} ${centerX},${plotTop - 4} ${centerX + 4},${plotTop + 6}`}
            fill={theme.text.muted}
          />
          {/* Down arrow (y-axis bottom) */}
          <polygon
            points={`${centerX - 4},${plotTop + plotHeight - 6} ${centerX},${plotTop + plotHeight + 4} ${centerX + 4},${plotTop + plotHeight - 6}`}
            fill={theme.text.muted}
          />
        </g>

        {/* Axis Labels */}
        <AxisLabel
          x={plotLeft - 8}
          y={centerY - 12}
          text={data.yAxisLabel.toUpperCase()}
          textAnchor="end"
          opacity={axesOpacity}
          color={theme.text.muted}
          fontSize={fontSizes.caption}
        />
        <AxisLabel
          x={plotLeft - 8}
          y={plotTop + 20}
          text={data.yAxisLabelEnd.toUpperCase()}
          textAnchor="end"
          opacity={axesOpacity}
          color={theme.text.muted}
          fontSize={fontSizes.caption}
        />
        <AxisLabel
          x={plotLeft + plotWidth + 8}
          y={centerY + 20}
          text={data.xAxisLabelEnd.toUpperCase()}
          textAnchor="start"
          opacity={axesOpacity}
          color={theme.text.muted}
          fontSize={fontSizes.caption}
        />
        <AxisLabel
          x={plotLeft - 8}
          y={centerY + 20}
          text={data.xAxisLabel.toUpperCase()}
          textAnchor="end"
          opacity={axesOpacity}
          color={theme.text.muted}
          fontSize={fontSizes.caption}
        />

        {/* Actor Bubbles */}
        {actorElements}

        {/* Quadrant Labels */}
        {quadrantElements}
      </svg>

      {/* Source attribution */}
      {data.source && (
        <div
          style={{
            position: "absolute",
            bottom: layout.safeAreaTier.generous.bottom,
            right: layout.safeAreaTier.generous.right,
            fontSize: fontSizes.caption,
            color: theme.text.muted,
            fontFamily: fonts.mono,
            opacity: fadeIn(frame, sec(1), sec(0.5)),
            textShadow: shadows.textLift,
          }}
        >
          Source: {data.source}
        </div>
      )}

      {/* Episode label */}
      {data.episode && (
        <div
          style={{
            position: "absolute",
            bottom: layout.safeAreaTier.generous.bottom,
            left: layout.safeAreaTier.generous.left,
            fontSize: fontSizes.label,
            color: theme.text.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: fadeIn(frame, 0, sec(1)),
          }}
        >
          {data.episode}
        </div>
      )}
      </AbsoluteFill>
      {/* Brand strips */}
      <HeaderStrip mode={bgVariant} metadata={data.episode} />
      <FooterStrip mode={bgVariant} />
    </Background>
  );
};

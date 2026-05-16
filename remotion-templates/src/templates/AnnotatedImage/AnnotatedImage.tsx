/**
 * AnnotatedImage — brand-treated image with animated callout labels.
 *
 * The image fills the content area with brand treatment (duotone,
 * grain, vignette). Callout dots appear sequentially, each followed
 * by a leader line extending to a text label.
 *
 * Layout: image fills frame, callouts overlay on top.
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
  fonts,
  fontSizes,
  fontWeights,
  layout,
  sec,
  shadows,
  contentArea,
} from "../../design/theme";
import {
  fadeIn,
  exitFade,
  slideIn,
  kenBurnsDrift,
  lockOnPulse,
  anticipatoryStartFrame,
  CLAMP_CUBIC,
} from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useThemeMode } from "../../hooks/useThemeMode";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { BrandImage } from "../../components/BrandImage";
import { KenBurns } from "../../components/KenBurns";
import { TitleBlock } from "../../components/TitleBlock";
import { resolveAssetSrc } from "../../utils/assetPath";
import type { AnnotatedImageData, Callout } from "./types";
import { warnIf } from "../../utils/dataWarnings";

// ── Callout geometry ─────────────────────────────────────────────────────────

const LEADER_LENGTH = 60;
const DOT_RADIUS = 6;
const LABEL_GAP = 12;

interface CalloutPosition {
  dotX: number;
  dotY: number;
  labelX: number;
  labelY: number;
  lineX1: number;
  lineY1: number;
  lineX2: number;
  lineY2: number;
  textAnchor: "start" | "end" | "middle";
  textBaseline: "text-before-edge" | "text-after-edge" | "central";
}

const computeCalloutPosition = (
  callout: Callout,
  imgWidth: number,
  imgHeight: number,
  imgLeft: number,
  imgTop: number
): CalloutPosition => {
  const dotX = imgLeft + (callout.x / 100) * imgWidth;
  const dotY = imgTop + (callout.y / 100) * imgHeight;
  const placement = callout.placement || "right";
  const leaderLength = callout.leaderLength ?? LEADER_LENGTH;

  let dx = 0,
    dy = 0;
  let textAnchor: "start" | "end" | "middle" = "start";
  let textBaseline: "text-before-edge" | "text-after-edge" | "central" = "central";

  switch (placement) {
    case "right":
      dx = leaderLength;
      dy = 0;
      textAnchor = "start";
      break;
    case "left":
      dx = -leaderLength;
      dy = 0;
      textAnchor = "end";
      break;
    case "top":
      dx = 0;
      dy = -leaderLength;
      textAnchor = "middle";
      textBaseline = "text-after-edge";
      break;
    case "bottom":
      dx = 0;
      dy = leaderLength;
      textAnchor = "middle";
      textBaseline = "text-before-edge";
      break;
  }

  return {
    dotX,
    dotY,
    lineX1: dotX,
    lineY1: dotY,
    lineX2: dotX + dx,
    lineY2: dotY + dy,
    labelX: dotX + dx + (dx > 0 ? LABEL_GAP : dx < 0 ? -LABEL_GAP : 0),
    labelY: dotY + dy + (dy > 0 ? LABEL_GAP : dy < 0 ? -LABEL_GAP : 0),
    textAnchor,
    textBaseline,
  };
};

// ── Main component ───────────────────────────────────────────────────────────

export const AnnotatedImage: React.FC<{ data: AnnotatedImageData }> = ({
  data,
}) => {
  warnIf(
    (data.callouts?.length ?? 0) > 6,
    "AnnotatedImage",
    `${data.callouts?.length} callouts — AnnotatedImage caps at ~6. Above ` +
      `that, leader lines collide and viewer is overwhelmed. Split into ` +
      `staged compositions or demote to PhotoMontage with per-image focus. ` +
      `See TYPOGRAPHY_TEMPLATE_SELECTOR.md.`,
  );
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // HOLD_MOTION_REGISTER Register C — the image IS the evidence being
  // annotated (per L103 doctrine — composite="inset"). Documentary Ken
  // Burns is the canonical hold-beat treatment (POLISH.md D20).
  const direction = useDirection(data._direction, "documentary");
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  // Per-episode color emphasis — callout dot/leader lines fall back to
  // the episode's primary accent.
  const emphasis = useEpisodeColorEmphasis();
  const theme = useThemeMode(data.backgroundVariant || "dark");

  // ── Image area — below title using contentArea ──────────────────────────
  const area = contentArea("content", "generous");
  const imgTop = area.top;
  const imgLeft = area.left;
  const imgWidth = area.width;
  const imgHeight = area.height;

  // ── Timing ──────────────────────────────────────────────────────────────
  const imageRevealFrames = sec(1);
  const calloutStagger = sec(1.2);
  const dotFrames = sec(0.3);
  const lineFrames = sec(0.4);
  const labelFrames = sec(0.3);
  const outroFrames = sec(1.5);

  // D17 anticipatory reveal: first image settled when narrator names it.
  //
  // syncPoints convention for AnnotatedImage:
  //   syncPoints[0]       → image reveal cue (anticipated for IMAGE_SETTLE)
  //   syncPoints[1..N]    → callout 1..N narration cues
  //                         (callout i at index i+1 in syncPoints — the
  //                         image is element 0, callouts share the array)
  // Falls back pixel-identically to the legacy `calloutsStart + i * stagger`
  // formula when per-callout sync points are not provided.
  const IMAGE_SETTLE = sec(0.4);
  const CALLOUT_SETTLE = sec(0.4);
  const firstSyncFrame = direction.syncPoints?.[0]?.frame;
  const entranceBase = firstSyncFrame != null
    ? anticipatoryStartFrame(firstSyncFrame, IMAGE_SETTLE)
    : sec(0.2); // existing default
  const imageStart = entranceBase;
  const calloutsStart = imageStart + imageRevealFrames + sec(0.3);

  // ── Image fade ──────────────────────────────────────────────────────────
  const imageOpacity = fadeIn(frame, imageStart, imageRevealFrames);
  const exit = exitFade(frame, durationInFrames, outroFrames);

  // ── Ramp ────────────────────────────────────────────────────────────────
  const ramp = data.duotoneRamp || "standard";

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant || "dark"),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>

      {/* Brand-treated image — full bleed with gentle Ken Burns drift */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: layout.width,
          height: layout.height,
          opacity: imageOpacity * exit,
        }}
      >
        <KenBurns direction="drift" intensity={2}>
          <BrandImage
            src={resolveAssetSrc(data.imageSrc)}
            ramp={ramp}
            composite="inset"
            alt={data.imageAlt}
            style={{ width: "100%", height: "100%" }}
          />
        </KenBurns>
      </div>

      {/* Title on top of image with slide-in entrance */}
      <div
        style={{
          opacity: slideIn(frame, sec(0.3), sec(0.5)),
          transform: `translateY(${slideIn(frame, sec(0.3), sec(0.5)) * -40}px)`,
        }}
      >
        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={data.backgroundVariant || "dark"}
          safeAreaTier="generous"
          syncPoints={direction.syncPoints}
        />
      </div>

      {/* Callout overlay — SVG for precise positioning */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: layout.width,
          height: layout.height,
          pointerEvents: "none",
        }}
      >
        {(data.callouts ?? []).map((callout, i) => {
          const pos = computeCalloutPosition(
            callout,
            imgWidth,
            imgHeight,
            imgLeft,
            imgTop
          );
          const color = callout.color || emphasis.primaryAccent;

          // D17 per-element anticipatory reveal — per-callout narration cues.
          // syncPoints[i + 1] (image is syncPoints[0]); fall back to the
          // existing staggered formula when no per-callout cue is provided.
          const calloutSyncFrame = direction.syncPoints?.[i + 1]?.frame;
          const calloutStart =
            calloutSyncFrame !== undefined
              ? anticipatoryStartFrame(calloutSyncFrame, CALLOUT_SETTLE)
              : calloutsStart + i * calloutStagger;
          const dotProgress = interpolate(
            frame,
            [calloutStart, calloutStart + dotFrames],
            [0, 1],
            CLAMP_CUBIC
          );
          const lineProgress = interpolate(
            frame,
            [calloutStart + dotFrames, calloutStart + dotFrames + lineFrames],
            [0, 1],
            CLAMP_CUBIC
          );
          const labelOpacity =
            fadeIn(frame, calloutStart + dotFrames + lineFrames, labelFrames) *
            exit;

          const dotOpacity = fadeIn(frame, calloutStart, dotFrames) * exit;

          // Leader line interpolation
          const currentLineX2 =
            pos.lineX1 + (pos.lineX2 - pos.lineX1) * lineProgress;
          const currentLineY2 =
            pos.lineY1 + (pos.lineY2 - pos.lineY1) * lineProgress;

          // Brand lock-on pulse on dot reveal — 200ms 1.0→1.1→1.0
          const lockScale = lockOnPulse(frame, calloutStart, layout.fps);

          // Hairline length grows in alongside the outer ring
          const hairlineProgress = interpolate(
            frame,
            [calloutStart, calloutStart + dotFrames * 1.2],
            [0, 1],
            CLAMP_CUBIC
          );
          const hairlineLen = (DOT_RADIUS + 18) * hairlineProgress;
          const hairlineGap = DOT_RADIUS + 10; // empty space between dot and hairline

          return (
            <g key={i}>
              {/* Crosshair hairlines — extending beyond the outer ring */}
              <g opacity={dotOpacity * 0.55}>
                {/* Top */}
                <line
                  x1={pos.dotX}
                  y1={pos.dotY - hairlineGap}
                  x2={pos.dotX}
                  y2={pos.dotY - hairlineGap - hairlineLen}
                  stroke={color}
                  strokeWidth={0.6}
                />
                {/* Bottom */}
                <line
                  x1={pos.dotX}
                  y1={pos.dotY + hairlineGap}
                  x2={pos.dotX}
                  y2={pos.dotY + hairlineGap + hairlineLen}
                  stroke={color}
                  strokeWidth={0.6}
                />
                {/* Left */}
                <line
                  x1={pos.dotX - hairlineGap}
                  y1={pos.dotY}
                  x2={pos.dotX - hairlineGap - hairlineLen}
                  y2={pos.dotY}
                  stroke={color}
                  strokeWidth={0.6}
                />
                {/* Right */}
                <line
                  x1={pos.dotX + hairlineGap}
                  y1={pos.dotY}
                  x2={pos.dotX + hairlineGap + hairlineLen}
                  y2={pos.dotY}
                  stroke={color}
                  strokeWidth={0.6}
                />
              </g>

              {/* Dot with pulse ring — lock-on scaled around the dot center */}
              <g transform={`translate(${pos.dotX} ${pos.dotY}) scale(${lockScale}) translate(${-pos.dotX} ${-pos.dotY})`}>
                <circle
                  cx={pos.dotX}
                  cy={pos.dotY}
                  r={DOT_RADIUS + 8}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={dotOpacity * 0.4}
                />
                <circle
                  cx={pos.dotX}
                  cy={pos.dotY}
                  r={DOT_RADIUS * dotProgress}
                  fill={color}
                  opacity={dotOpacity}
                />
              </g>

              {/* Elbow leader line — right-angle bend at midpoint (intelligence dossier feel) */}
              {lineProgress > 0 && (() => {
                // For horizontal placements (left/right), bend halfway: extend horizontally,
                // then drop/rise vertically. For vertical placements (top/bottom), bend at half-height.
                const isHoriz = callout.placement === "left" || callout.placement === "right" || !callout.placement;
                // Compute mid-point of the elbow
                const totalDx = pos.lineX2 - pos.lineX1;
                const totalDy = pos.lineY2 - pos.lineY1;
                const elbowFraction = 0.6; // first leg is 60% of total
                let elbowX: number, elbowY: number;
                if (isHoriz) {
                  // First leg: horizontal; second leg: vertical
                  elbowX = pos.lineX1 + totalDx * elbowFraction;
                  elbowY = pos.lineY1;
                } else {
                  // First leg: vertical; second leg: horizontal
                  elbowX = pos.lineX1;
                  elbowY = pos.lineY1 + totalDy * elbowFraction;
                }
                // Animate the two legs together via line-draw progress
                const legAEndX = pos.lineX1 + (elbowX - pos.lineX1) * Math.min(lineProgress * 2, 1);
                const legAEndY = pos.lineY1 + (elbowY - pos.lineY1) * Math.min(lineProgress * 2, 1);
                const legBProgress = Math.max(0, lineProgress * 2 - 1);
                const legBEndX = elbowX + (pos.lineX2 - elbowX) * legBProgress;
                const legBEndY = elbowY + (pos.lineY2 - elbowY) * legBProgress;
                return (
                  <>
                    <line
                      x1={pos.lineX1}
                      y1={pos.lineY1}
                      x2={legAEndX}
                      y2={legAEndY}
                      stroke={color}
                      strokeWidth={1.5}
                      opacity={dotOpacity * 0.8}
                    />
                    {legBProgress > 0 && (
                      <line
                        x1={elbowX}
                        y1={elbowY}
                        x2={legBEndX}
                        y2={legBEndY}
                        stroke={color}
                        strokeWidth={1.5}
                        opacity={dotOpacity * 0.8}
                      />
                    )}
                  </>
                );
              })()}

              {/* Paper-stamp label backing — semi-opaque paper-color rect, 1px oxblood border */}
              {labelOpacity > 0.05 && (() => {
                // Approximate label width based on character count
                const charWidth = fontSizes.label * 0.55;
                const labelWidthEst = (callout.label.length + 2) * charWidth + 16;
                const labelHeightEst = fontSizes.label * 1.4 + 8;
                let stampX = pos.labelX;
                if (pos.textAnchor === "end") stampX = pos.labelX - labelWidthEst + 8;
                else if (pos.textAnchor === "middle") stampX = pos.labelX - labelWidthEst / 2;
                else stampX = pos.labelX - 8;
                let stampY = pos.labelY - labelHeightEst / 2;
                if (pos.textBaseline === "text-before-edge") stampY = pos.labelY - 4;
                else if (pos.textBaseline === "text-after-edge") stampY = pos.labelY - labelHeightEst + 4;
                return (
                  <rect
                    x={stampX}
                    y={stampY}
                    width={labelWidthEst}
                    height={labelHeightEst}
                    fill={palette.paper}
                    stroke={palette.oxblood}
                    strokeWidth={0.6}
                    opacity={labelOpacity * 0.85}
                    rx={2}
                  />
                );
              })()}

              {/* Label */}
              <text
                x={pos.labelX}
                y={pos.labelY}
                textAnchor={pos.textAnchor}
                dominantBaseline={pos.textBaseline}
                fill={palette.ink}
                fontSize={fontSizes.label}
                fontFamily={fonts.mono}
                fontWeight={fontWeights.semibold}
                opacity={labelOpacity}
                style={{ textShadow: shadows.textLiftLight }}
              >
                {callout.label}
              </text>

              {/* Detail text */}
              {callout.detail && (
                <text
                  x={pos.labelX}
                  y={
                    pos.labelY +
                    (pos.textBaseline === "text-before-edge"
                      ? fontSizes.label + 6
                      : pos.textBaseline === "text-after-edge"
                        ? -(fontSizes.label + 6)
                        : fontSizes.label + 4)
                  }
                  textAnchor={pos.textAnchor}
                  dominantBaseline={pos.textBaseline}
                  fill={theme.text.muted}
                  fontSize={fontSizes.caption}
                  fontFamily={fonts.body}
                  opacity={labelOpacity * 0.7}
                >
                  {callout.detail}
                </text>
              )}
            </g>
          );
        })}
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
            fontFamily: fonts.body,
            opacity:
              fadeIn(frame, calloutsStart + sec(0.5), sec(0.5)) * exit * 0.6,
            textShadow: shadows.textLift,
          }}
        >
          {data.source}
        </div>
      )}
    </AbsoluteFill>
    {/* Brand strips */}
    <HeaderStrip mode={data.backgroundVariant || "dark"} metadata={data.episode} />
    <FooterStrip mode={data.backgroundVariant || "dark"} />
    </Background>
  );
};

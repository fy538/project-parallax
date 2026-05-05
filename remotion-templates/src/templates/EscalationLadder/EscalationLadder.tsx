/**
 * EscalationLadder — vertical event sequence with severity-colored rungs.
 *
 * Two modes:
 *   1. Static: Events appear top-to-bottom with staggered entrance
 *   2. Narrated (cameraPath): Vertical camera climb that dwells on each rung,
 *      progressive color temperature shift (cool→hot), shake at critical thresholds,
 *      tension particles intensifying at each level
 *
 * Layout: vertical ladder centered in content area, date labels
 * on the left, event labels on the right.
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
  fontWeights,
  layout,
  sec,
  contentArea,
  shadows,
  radii,
} from "../../design/theme";
import { Legend } from "../../components/Legend";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  exitFade,
  pulse,
  bloomIntensity,
  CLAMP,
  CLAMP_CUBIC,
} from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useNarratedCamera } from "../../hooks/useNarratedCamera";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { AmbientParticles } from "../../components/AmbientParticles";
import type { EscalationLadderData, SeverityLevel } from "./types";
import type { CameraElement, NarratedCameraStep } from "../../hooks/useNarratedCamera";

// ── Severity color map ───────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  low: semantic.success,
  moderate: palette.amber,
  elevated: palette.amber,
  high: palette.rust,
  critical: semantic.danger,
};

const SEVERITY_BG: Record<SeverityLevel, string> = {
  low: "rgba(93,170,104,0.12)",
  moderate: "rgba(229,165,68,0.12)",
  elevated: "rgba(229,165,68,0.18)",
  high: "rgba(194,59,34,0.15)",
  critical: "rgba(214,69,69,0.20)",
};

const SEVERITY_SHAKE: Record<SeverityLevel, number> = {
  low: 0,
  moderate: 0,
  elevated: 0.05,
  high: 0.15,
  critical: 0.35,
};

// ── Auto camera path generator ───────────────────────────────────────────────

const generateEscalationCameraPath = (
  rungs: EscalationLadderData["rungs"],
  rungPositions: { x: number; y: number }[]
): NarratedCameraStep[] => {
  const steps: NarratedCameraStep[] = [];

  // Opening overview
  steps.push({
    target: "overview",
    zoom: 0.85,
    duration: 1.5,
    label: "Overview",
  });

  // Climb through each rung
  rungs.forEach((rung, i) => {
    steps.push({
      target: `element:${i}`,
      zoom: 1.3,
      duration: 2.5,
      focus: [i],
      behavior: "track",
      shake: SEVERITY_SHAKE[rung.severity],
      label: rung.date || rung.label,
      dimAmount: 0.5,
      blurAmount: 1.2,
    });
  });

  // Final pull back
  steps.push({
    target: "overview",
    zoom: 0.75,
    duration: 2,
    shake: rungs.some((r) => r.severity === "critical") ? 0.1 : 0,
  });

  return steps;
};

// ── Main component ───────────────────────────────────────────────────────────

export const EscalationLadder: React.FC<{ data: EscalationLadderData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = useThemeMode(data.backgroundVariant);
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const area = contentArea("content", "generous");

  const numRungs = data.rungs.length;
  const hasCameraPath = !!data.cameraPath && data.cameraPath.length > 0;
  const showParticles = data.ambientParticles ?? hasCameraPath;

  // ── Layout constants ────────────────────────────────────────────────────
  const dateColumnWidth = 180;
  const dotColumnWidth = 48;
  const spineX = area.left + dateColumnWidth + dotColumnWidth / 2;
  const labelLeft = spineX + dotColumnWidth / 2 + layout.spacing.md;
  const maxLabelWidth = area.width - dateColumnWidth - dotColumnWidth - layout.spacing.lg;

  // ── Rung vertical spacing ───────────────────────────────────────────────
  const rungHeight = Math.min(
    (area.height - layout.spacing.lg) / numRungs,
    96
  );
  const totalLadderHeight = rungHeight * numRungs;
  const ladderTopOffset = (area.height - totalLadderHeight) / 2;

  // ── Camera elements (rung positions) ────────────────────────────────────
  const rungPositions: CameraElement[] = useMemo(() => {
    return data.rungs.map((_, i) => ({
      id: `rung-${i}`,
      x: layout.width / 2,
      y: area.top + ladderTopOffset + i * rungHeight + rungHeight / 2,
    }));
  }, [data.rungs.length, area.top, ladderTopOffset, rungHeight]);

  // Camera path (provided or auto-generated)
  const cameraPath = useMemo(() => {
    if (data.cameraPath && data.cameraPath.length > 0) return data.cameraPath;
    if (!hasCameraPath) return [{ target: "overview" as const, zoom: 1, duration: 10 }];
    return generateEscalationCameraPath(data.rungs, rungPositions);
  }, [data.cameraPath, data.rungs, rungPositions, hasCameraPath]);

  const camera = useNarratedCamera({
    elements: rungPositions,
    cameraPath,
    canvasWidth: layout.width,
    canvasHeight: layout.height,
    transitionSec: 0.6,
  });

  // ── Timing ──────────────────────────────────────────────────────────────
  const rungStagger = hasCameraPath ? sec(0.3) : sec(1.2);
  const rungFadeIn = sec(0.4);
  const spineDrawPerRung = sec(0.6);
  const outroFrames = sec(1.5);
  const ladderStart = sec(0.5);

  // ── Exit ────────────────────────────────────────────────────────────────
  const exit = exitFade(frame, durationInFrames, outroFrames);

  // ── Spine color (progressive — gets redder as we climb in camera mode) ──
  const baseSpineColor = theme.isDark
    ? "rgba(240,230,208,0.15)"
    : "rgba(28,24,20,0.10)";

  // ── Tension-based background tint (camera mode only) ────────────────────
  const currentSeverityIndex = hasCameraPath
    ? Math.max(0, Math.min(numRungs - 1, camera.focusedIndices[0] ?? 0))
    : 0;
  const tensionProgress = currentSeverityIndex / Math.max(1, numRungs - 1);

  // ── Ladder content ─────────────────────────────────────────────────────

  const ladderContent = (
    <div
      style={{
        position: "absolute",
        top: area.top + ladderTopOffset,
        left: area.left,
        width: area.width,
        height: totalLadderHeight,
      }}
    >
      {/* Spine — vertical connecting line */}
      {data.rungs.map((_, i) => {
        if (i === numRungs - 1) return null;
        const rungStart = ladderStart + i * rungStagger;
        const spineProgress = interpolate(
          frame,
          [rungStart + rungFadeIn, rungStart + rungFadeIn + spineDrawPerRung],
          [0, 1],
          CLAMP_CUBIC
        );
        const segmentTop = i * rungHeight + rungHeight / 2;
        const segmentHeight = rungHeight * spineProgress;
        const spineOpacity = fadeIn(frame, rungStart, rungFadeIn) * exit;

        // Camera-based opacity
        const cameraSpineOpacity = hasCameraPath
          ? Math.max(camera.getElementOpacity(i), camera.getElementOpacity(i + 1))
          : 1;

        // Fuse-spine: when this segment is in/near the focused rung, brighten
        // to the severity color over ~200ms for a "fuse burning" feel.
        const isNearFocus = hasCameraPath && (
          camera.focusedIndices.includes(i) ||
          camera.focusedIndices.includes(i + 1)
        );
        // Crossfade between base spine color and severity color
        const segmentSeverity = data.rungs[i + 1]?.severity || data.rungs[i].severity;
        const severityColor = SEVERITY_COLORS[segmentSeverity];
        const fuseColor = isNearFocus ? severityColor : baseSpineColor;
        const fuseGlow = isNearFocus ? `0 0 8px ${severityColor}90` : "none";

        return (
          <div
            key={`spine-${i}`}
            style={{
              position: "absolute",
              left: spineX - area.left - 1,
              top: segmentTop,
              width: 2,
              height: segmentHeight,
              backgroundColor: fuseColor,
              boxShadow: fuseGlow,
              opacity: spineOpacity * cameraSpineOpacity,
              transition: "background-color 200ms ease, box-shadow 200ms ease",
            }}
          />
        );
      })}

      {/* Rungs */}
      {data.rungs.map((rung, i) => {
        const rungStart = ladderStart + i * rungStagger;
        const rungOpacity = fadeIn(frame, rungStart, rungFadeIn) * exit;
        const color = SEVERITY_COLORS[rung.severity];
        const bgColor = SEVERITY_BG[rung.severity];
        const rungY = i * rungHeight;
        const dotY = rungY + rungHeight / 2;

        // Camera-based effects
        const cameraOpacity = hasCameraPath ? camera.getElementOpacity(i) : 1;
        const cameraScale = hasCameraPath ? camera.getElementScale(i) : 1;
        const isFocused = hasCameraPath
          ? camera.isOverview || camera.focusedIndices.includes(i)
          : true;

        // Pulse for current rung
        const pulseScale =
          rung.current && rungOpacity > 0.9
            ? pulse(frame, rungStart + rungFadeIn, 15, 1.15)
            : 1;

        // Enhanced glow when focused by camera
        const focusGlow = isFocused && hasCameraPath
          ? `0 0 20px ${color}40, 0 0 40px ${color}20`
          : "";

        return (
          <div
            key={i}
            style={{
              opacity: rungOpacity * cameraOpacity,
              transform: `scale(${cameraScale})`,
              transformOrigin: `${spineX - area.left}px ${dotY}px`,
            }}
          >
            {/* Severity dot */}
            <div
              style={{
                position: "absolute",
                left: spineX - area.left - 8,
                top: dotY - 8,
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: color,
                boxShadow: isFocused
                  ? `${shadows.accentGlow(color)}, ${focusGlow}`
                  : shadows.accentGlow(color),
                transform: `scale(${pulseScale * (isFocused ? 1.1 : 1)})`,
              }}
            />

            {/* Outer pulse ring for current */}
            {rung.current && (
              <div
                style={{
                  position: "absolute",
                  left: spineX - area.left - 14,
                  top: dotY - 14,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: `2px solid ${color}`,
                  opacity: bloomIntensity(frame, rungStart + rungFadeIn, 0.3, 0.5),
                }}
              />
            )}

            {/* Date label (left) */}
            {rung.date && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: dotY - 10,
                  width: dateColumnWidth - layout.spacing.md,
                  textAlign: "right",
                  fontSize: fontSizes.caption,
                  color: isFocused ? theme.text.secondary : theme.text.muted,
                  fontFamily: fonts.data,
                  textShadow: theme.textShadow,
                  fontWeight: isFocused ? 600 : 400,
                }}
              >
                {rung.date}
              </div>
            )}

            {/* Event card (right) */}
            <div
              style={{
                position: "absolute",
                left: labelLeft - area.left,
                top: rungY + (rungHeight - (rung.detail ? 56 : 40)) / 2,
                maxWidth: maxLabelWidth,
                padding: `${layout.spacing.xs}px ${layout.spacing.sm}px`,
                backgroundColor: bgColor,
                borderLeft: `${isFocused ? 3 : 2}px solid ${color}${isFocused ? "cc" : "80"}`,
                borderRadius: radii.xs,
                boxShadow: isFocused ? `0 2px 12px ${color}20` : "none",
              }}
            >
              <div
                style={{
                  fontSize: fontSizes.label,
                  color: theme.text.primary,
                  fontFamily: fonts.heading,
                  fontWeight: fontWeights.medium,
                  textShadow: theme.textShadow,
                  lineHeight: 1.3,
                }}
              >
                {rung.label}
              </div>
              {rung.detail && (
                <div
                  style={{
                    fontSize: fontSizes.caption,
                    color: theme.text.muted,
                    fontFamily: fonts.body,
                    marginTop: 2,
                    textShadow: theme.textShadow,
                    opacity: isFocused ? 1 : 0.7,
                  }}
                >
                  {rung.detail}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Handheld camera jitter — tension-scaled, organic ────────────────────
  // Use Remotion's deterministic random across multiple frames to synthesize
  // a 2-octave Perlin-like wobble. Amplitude scales with tensionProgress so
  // calm rungs are still, escalating rungs breathe with the camera.
  const jitterAmp = hasCameraPath
    ? interpolate(tensionProgress, [0, 1], [0.4, 2.4], CLAMP)
    : 0;
  // 2-octave wobble at different frequencies
  const jitterX = jitterAmp * (
    Math.sin(frame * 0.11) * 0.6 +
    Math.sin(frame * 0.27 + 1.3) * 0.4
  );
  const jitterY = jitterAmp * (
    Math.cos(frame * 0.09 + 0.7) * 0.6 +
    Math.cos(frame * 0.31 + 2.1) * 0.4
  );
  const jitterRot = jitterAmp * 0.05 * Math.sin(frame * 0.13);

  return (
    <Background
      variant={data.backgroundVariant || "light"}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={compStyle}>

        {/* Ambient particles — intensity increases with tension */}
        {showParticles && (
          <AmbientParticles
            mode={data.backgroundVariant || "light"}
            density={15 + Math.round(tensionProgress * 20)}
            speed={0.3 + tensionProgress * 0.4}
            maxOpacity={0.08 + tensionProgress * 0.1}
            color={
              tensionProgress > 0.7
                ? "rgba(194,59,34,0.06)"
                : tensionProgress > 0.4
                ? "rgba(229,165,68,0.06)"
                : undefined
            }
          />
        )}

        {/* Heat-track — vertical gradient behind the spine area, intensifies as camera climbs */}
        <div
          style={{
            position: "absolute",
            left: spineX - 12,
            top: area.top + ladderTopOffset - 20,
            width: 24,
            height: totalLadderHeight + 40,
            background: `linear-gradient(180deg,
              ${semantic.danger}28 0%,
              ${palette.rust}1F 25%,
              ${palette.amber}14 60%,
              ${semantic.success}0A 100%
            )`,
            opacity: 0.4 + 0.4 * tensionProgress,
            filter: "blur(12px)",
            pointerEvents: "none",
          }}
        />

        {/* Camera wrapper or direct render — handheld jitter applied to whole stage */}
        {hasCameraPath ? (
          <div
            style={{
              ...camera.viewportStyle,
              transform: `translate(${jitterX}px, ${jitterY}px) rotate(${jitterRot}deg)`,
            }}
          >
            <div style={camera.contentStyle}>
              {ladderContent}
            </div>
          </div>
        ) : (
          ladderContent
        )}

        {/* Brand strips */}
        <HeaderStrip mode={data.backgroundVariant === "dark" ? "dark" : "light"} metadata={data.episode} />
        <FooterStrip mode={data.backgroundVariant === "dark" ? "dark" : "light"} />

        {/* Title */}
        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={data.backgroundVariant}
          safeAreaTier="generous"
        />

        {/* Camera label */}
        {hasCameraPath && camera.currentLabel && (
          <div
            style={{
              position: "absolute",
              top: layout.safeAreaTier.generous.top + 60,
              right: layout.safeAreaTier.generous.right,
              fontSize: fontSizes.caption,
              fontFamily: fonts.data,
              color: SEVERITY_COLORS[data.rungs[currentSeverityIndex]?.severity || "low"],
              letterSpacing: 1,
              opacity: fadeIn(frame, 0, sec(0.3)) * exit,
              textShadow: shadows.textLift,
            }}
          >
            {camera.currentLabel}
          </div>
        )}

        {/* Severity legend */}
        <Legend
          items={(["low", "moderate", "high", "critical"] as SeverityLevel[]).map(
            (level) => ({
              label: level.charAt(0).toUpperCase() + level.slice(1),
              color: SEVERITY_COLORS[level],
            })
          )}
          frame={frame}
          exit={exit}
          theme={theme}
          swatchShape="circle"
          swatchSize={10}
          gap={layout.spacing.lg}
          startFrame={ladderStart + (numRungs - 1) * rungStagger + sec(0.5)}
          fadeInDuration={sec(0.4)}
          style={{
            position: "absolute",
            bottom: layout.safeAreaTier.generous.bottom,
            left: layout.safeAreaTier.generous.left,
          }}
        />

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
                fadeIn(
                  frame,
                  ladderStart + (numRungs - 1) * rungStagger + sec(0.5),
                  sec(0.4)
                ) * exit,
              textShadow: theme.textShadow,
            }}
          >
            {data.source}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};

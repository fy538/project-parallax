/**
 * BifurcationRoute — supply chain/network splitting into two incompatible paths.
 *
 * Visualizes geopolitical decoupling (e.g., unified semiconductor supply → US-aligned + China-aligned).
 *
 * Two rendering modes:
 *   Static (default): Original 4-phase opacity-based animation (backward compat)
 *   Cinematic (cinematicMode: true): Camera-driven with spatial separation
 *
 * Cinematic animation sequence:
 *   Phase 1 (UNIFIED): Camera at overview. Nodes spring in, unified links draw.
 *   Phase 2 (ZOOM TO FORK): Camera zooms 1.6× to fork node. Pulse + glow.
 *   Phase 3 (SPLIT): Fork node cracks. Nodes spatially separate left/right with spring.
 *   Phase 4 (REVEAL): Camera pulls back to overview. Network labels + colors appear.
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
  radii,
  cardPresets,
  shadows,
  textMaxWidth,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  exitFade,
  heroSpring,
  pulse,
  stagger,
  CLAMP,
  CLAMP_CUBIC,
  CLAMP_SINE,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import { AmbientParticles } from "../../components/AmbientParticles";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { BifurcationRouteData, BifurcationNode, BifurcationLink } from "./types";

// ── Color token resolver ────────────────────────────────────────────────────

const createTokenMap = (): Record<string, string> => ({
  amber: palette.amber,
  rust: palette.rust,
  bone: palette.bone,
  ink: palette.ink,
  midnight: palette.midnight,
  olive: palette.olive,
  bronze: palette.bronze,
  oxblood: palette.oxblood,
  us: semantic.us,
  china: semantic.china,
  neutral: semantic.neutral,
  highlight: semantic.highlight,
  success: semantic.success,
  danger: semantic.danger,
});

const resolveColor = (colorToken: string, tokenMap: Record<string, string>): string => {
  return tokenMap[colorToken] || colorToken;
};

// ── Cinematic BifurcationRoute ──────────────────────────────────────────────

const CinematicBifurcationRoute: React.FC<{ data: BifurcationRouteData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames: totalFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const theme = useThemeMode(data.backgroundVariant ?? "dark");
  const mode = data.backgroundVariant ?? "dark";
  const isDark = mode === "dark";

  const tokenMap = useMemo(() => createTokenMap(), []);
  const networkAColor = resolveColor(data.networkAColor ?? "us", tokenMap) || semantic.us;
  const networkBColor = resolveColor(data.networkBColor ?? "china", tokenMap) || semantic.china;

  // ── Canvas dimensions ──
  const canvasWidth = 1920 * 2.2; // Wide canvas for camera moves
  const canvasHeight = 1080 * 1.5;
  const nodeRadius = 32;

  // ── Phase timing ──
  const unifiedDur = sec(data.unifiedDurationSec ?? 3);
  const zoomToForkDur = sec(1.2);
  const splitDur = sec(1.5);
  const revealDur = sec(2);

  const phaseStarts = {
    unified: 0,
    zoomToFork: unifiedDur,
    split: unifiedDur + zoomToForkDur,
    reveal: unifiedDur + zoomToForkDur + splitDur,
  };

  // ── Fork node position ──
  const forkNode = data.nodes.find((n) => n.id === data.forkNodeId);
  const forkX = forkNode ? (forkNode.x / 100) * canvasWidth : canvasWidth / 2;
  const forkY = forkNode ? (forkNode.y / 100) * canvasHeight : canvasHeight / 2;

  // ── Camera system ──
  // Phase 1: overview (zoom 0.5, centered)
  // Phase 2: zoom to fork (zoom 1.4, centered on fork)
  // Phase 3: hold on fork during split
  // Phase 4: pull back to overview
  const overviewZoom = 0.5;
  const forkZoom = 1.2;

  // Camera with 5% overshoot then settle on zoom-to-fork (handheld feel)
  const cameraZoom = interpolate(
    frame,
    [
      phaseStarts.unified,
      phaseStarts.zoomToFork,
      phaseStarts.zoomToFork + sec(0.6),
      phaseStarts.zoomToFork + sec(0.9),
      phaseStarts.reveal,
      phaseStarts.reveal + sec(1),
    ],
    [overviewZoom, overviewZoom, forkZoom * 1.05, forkZoom, forkZoom, overviewZoom],
    CLAMP_CUBIC
  );

  // Subtle handheld jitter — Perlin-like wobble at low amplitude during fork hold
  const inForkHold =
    frame >= phaseStarts.zoomToFork + sec(0.6) && frame < phaseStarts.reveal;
  const handheldX = inForkHold
    ? 1.2 * (Math.sin(frame * 0.13) * 0.6 + Math.sin(frame * 0.31 + 1.3) * 0.4)
    : 0;
  const handheldY = inForkHold
    ? 1.0 * (Math.cos(frame * 0.11 + 0.7) * 0.6 + Math.cos(frame * 0.27 + 2.1) * 0.4)
    : 0;

  const cameraX = interpolate(
    frame,
    [
      phaseStarts.unified,
      phaseStarts.zoomToFork,
      phaseStarts.zoomToFork + sec(0.8),
      phaseStarts.reveal,
      phaseStarts.reveal + sec(1),
    ],
    [canvasWidth / 2, canvasWidth / 2, forkX, forkX, canvasWidth / 2],
    CLAMP_CUBIC
  );

  const cameraY = interpolate(
    frame,
    [
      phaseStarts.unified,
      phaseStarts.zoomToFork,
      phaseStarts.zoomToFork + sec(0.8),
      phaseStarts.reveal,
      phaseStarts.reveal + sec(1),
    ],
    [canvasHeight / 2, canvasHeight / 2, forkY, forkY, canvasHeight / 2],
    CLAMP_CUBIC
  );

  // Camera transform: translate so camera target is at viewport center, then scale
  const viewportCenterX = 1920 / 2;
  const viewportCenterY = 1080 / 2;
  const translateX = viewportCenterX - cameraX * cameraZoom + handheldX;
  const translateY = viewportCenterY - cameraY * cameraZoom + handheldY;

  // ── Spatial separation during split ──
  // After split starts, networkA nodes drift left, networkB nodes drift right
  const splitProgress = interpolate(
    frame,
    [phaseStarts.split, phaseStarts.split + splitDur],
    [0, 1],
    CLAMP_CUBIC
  );

  const getSpatialOffset = (node: BifurcationNode): { dx: number; dy: number } => {
    if (frame < phaseStarts.split) return { dx: 0, dy: 0 };
    if (node.network === "networkA") {
      return { dx: -180 * splitProgress, dy: 0 };
    }
    if (node.network === "networkB") {
      return { dx: 180 * splitProgress, dy: 0 };
    }
    return { dx: 0, dy: 0 }; // fork node stays
  };

  // ── Node positions (absolute on canvas) ──
  const getNodePos = (node: BifurcationNode) => {
    const baseX = (node.x / 100) * canvasWidth;
    const baseY = (node.y / 100) * canvasHeight;
    const offset = getSpatialOffset(node);
    return { x: baseX + offset.dx, y: baseY + offset.dy };
  };

  // ── Link path with bezier ──
  const getLinkPath = (fromNode: BifurcationNode, toNode: BifurcationNode): string => {
    const from = getNodePos(fromNode);
    const to = getNodePos(toNode);
    const midX = (from.x + to.x) / 2;
    const cp1x = from.x + (midX - from.x) * 0.5;
    const cp1y = from.y - 50;
    const cp2x = to.x - (to.x - midX) * 0.5;
    const cp2y = to.y - 50;
    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
  };

  // ── Link classification ──
  const unifiedLinks = useMemo(
    () => data.links.filter((l) => l.phase === "unified"),
    [data.links]
  );
  const networkALinks = useMemo(
    () => data.links.filter((l) => l.phase === "split" && l.network === "networkA"),
    [data.links]
  );
  const networkBLinks = useMemo(
    () => data.links.filter((l) => l.phase === "split" && l.network === "networkB"),
    [data.links]
  );

  // ── Unified links fade out during split ──
  const unifiedLinksOpacity = interpolate(
    frame,
    [phaseStarts.split - sec(0.3), phaseStarts.split + sec(0.3)],
    [1, 0],
    CLAMP
  );

  // ── Network links fade in after split ──
  const networkLinksOpacity = interpolate(
    frame,
    [phaseStarts.split + sec(0.5), phaseStarts.split + sec(1.2)],
    [0, 1],
    CLAMP_CUBIC
  );

  // ── Fork node crack/pulse ──
  const forkPulseScale = frame >= phaseStarts.zoomToFork && frame < phaseStarts.reveal
    ? 1 + 0.12 * Math.sin((frame - phaseStarts.zoomToFork) * 0.2)
    : 1;
  const forkGlowIntensity = interpolate(
    frame,
    [phaseStarts.zoomToFork, phaseStarts.split, phaseStarts.split + sec(0.5)],
    [0, 1, 0.3],
    CLAMP_SINE
  );

  // ── Exit fade ──
  const exitOp = exitFade(frame, totalFrames, sec(0.5));

  // ── Network labels ──
  const labelOpacity = fadeIn(frame, phaseStarts.reveal + sec(0.5), sec(0.5));
  const labelSlide = slideIn(frame, phaseStarts.reveal + sec(0.5), 20, sec(0.5));

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant ?? "dark"),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={{ opacity: exitOp }}>

        {/* Ambient particles */}
        {(data.ambientParticles !== false) && (
          <AmbientParticles
            density={isDark ? 25 : 12}
            mode={mode as "dark" | "light"}
          />
        )}

        {/* Title */}
        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={mode}
          safeAreaTier="generous"
          syncPoints={direction.syncPoints}
        />

        {/* Camera viewport */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1920,
            height: 1080,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: canvasWidth,
              height: canvasHeight,
              transform: `translate(${translateX}px, ${translateY}px) scale(${cameraZoom})`,
              transformOrigin: "0 0",
            }}
          >
            <svg width={canvasWidth} height={canvasHeight} style={{ position: "absolute" }}>
              <defs>
                <filter id="fork-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="12" />
                </filter>
              </defs>

              {/* Unified links */}
              <g opacity={unifiedLinksOpacity}>
                {unifiedLinks.map((link, idx) => {
                  const fromNode = data.nodes.find((n) => n.id === link.from);
                  const toNode = data.nodes.find((n) => n.id === link.to);
                  if (!fromNode || !toNode) return null;

                  const linkStart = sec(0.3) + idx * sec(0.15);
                  const progress = interpolate(
                    frame,
                    [linkStart, linkStart + sec(0.8)],
                    [0, 1],
                    CLAMP_CUBIC
                  );
                  const pathD = getLinkPath(fromNode, toNode);
                  const pathLen = Math.hypot(
                    getNodePos(toNode).x - getNodePos(fromNode).x,
                    getNodePos(toNode).y - getNodePos(fromNode).y
                  ) * 1.8;

                  return (
                    <path
                      key={`unified-${idx}`}
                      d={pathD}
                      fill="none"
                      stroke={link.color || semantic.neutral}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeDasharray={link.dashed ? "8,4" : `${pathLen}`}
                      strokeDashoffset={link.dashed ? 0 : pathLen * (1 - progress)}
                      opacity={fadeIn(frame, linkStart, sec(0.3))}
                    />
                  );
                })}
              </g>

              {/* Network A links */}
              <g opacity={networkLinksOpacity}>
                {networkALinks.map((link, idx) => {
                  const fromNode = data.nodes.find((n) => n.id === link.from);
                  const toNode = data.nodes.find((n) => n.id === link.to);
                  if (!fromNode || !toNode) return null;

                  const linkStart = phaseStarts.split + sec(0.8) + idx * sec(0.12);
                  const progress = interpolate(
                    frame,
                    [linkStart, linkStart + sec(0.8)],
                    [0, 1],
                    CLAMP_CUBIC
                  );
                  const pathD = getLinkPath(fromNode, toNode);
                  const pathLen = Math.hypot(
                    getNodePos(toNode).x - getNodePos(fromNode).x,
                    getNodePos(toNode).y - getNodePos(fromNode).y
                  ) * 1.8;

                  return (
                    <path
                      key={`netA-${idx}`}
                      d={pathD}
                      fill="none"
                      stroke={link.color || networkAColor}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeDasharray={`${pathLen}`}
                      strokeDashoffset={pathLen * (1 - progress)}
                    />
                  );
                })}
              </g>

              {/* Network B links */}
              <g opacity={networkLinksOpacity}>
                {networkBLinks.map((link, idx) => {
                  const fromNode = data.nodes.find((n) => n.id === link.from);
                  const toNode = data.nodes.find((n) => n.id === link.to);
                  if (!fromNode || !toNode) return null;

                  const linkStart = phaseStarts.split + sec(0.8) + idx * sec(0.12);
                  const progress = interpolate(
                    frame,
                    [linkStart, linkStart + sec(0.8)],
                    [0, 1],
                    CLAMP_CUBIC
                  );
                  const pathD = getLinkPath(fromNode, toNode);
                  const pathLen = Math.hypot(
                    getNodePos(toNode).x - getNodePos(fromNode).x,
                    getNodePos(toNode).y - getNodePos(fromNode).y
                  ) * 1.8;

                  return (
                    <path
                      key={`netB-${idx}`}
                      d={pathD}
                      fill="none"
                      stroke={link.color || networkBColor}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeDasharray={`${pathLen}`}
                      strokeDashoffset={pathLen * (1 - progress)}
                    />
                  );
                })}
              </g>

              {/* Fork node glow */}
              {forkNode && (
                <circle
                  cx={getNodePos(forkNode).x}
                  cy={getNodePos(forkNode).y}
                  r={nodeRadius * 2.5}
                  fill={palette.amber}
                  opacity={forkGlowIntensity * 0.4}
                  filter="url(#fork-glow)"
                />
              )}

              {/* Split-moment flash + radiating particle streaks */}
              {forkNode && (() => {
                const splitMoment = phaseStarts.split;
                const framesSinceSplit = frame - splitMoment;
                if (framesSinceSplit < 0 || framesSinceSplit > 30) return null;
                const fx = getNodePos(forkNode).x;
                const fy = getNodePos(forkNode).y;
                // Brief rust flash on the fork node (fades over 6 frames)
                const flashOpacity = framesSinceSplit < 6 ? (1 - framesSinceSplit / 6) : 0;
                // 12 streaks radiating outward over 30 frames
                const streakProgress = Math.min(framesSinceSplit / 30, 1);
                const streakLen = 100 * streakProgress;
                const streakOpacity = Math.max(0, 1 - streakProgress);
                return (
                  <>
                    {flashOpacity > 0 && (
                      <circle
                        cx={fx}
                        cy={fy}
                        r={nodeRadius * 1.6}
                        fill={palette.rust}
                        opacity={flashOpacity * 0.85}
                      />
                    )}
                    {streakOpacity > 0 && Array.from({ length: 12 }).map((_, k) => {
                      const angle = (k / 12) * Math.PI * 2;
                      const x1 = fx + Math.cos(angle) * (nodeRadius + 4);
                      const y1 = fy + Math.sin(angle) * (nodeRadius + 4);
                      const x2 = fx + Math.cos(angle) * (nodeRadius + 4 + streakLen);
                      const y2 = fy + Math.sin(angle) * (nodeRadius + 4 + streakLen);
                      return (
                        <line
                          key={`streak-${k}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={palette.rust}
                          strokeWidth={2}
                          strokeLinecap="round"
                          opacity={streakOpacity * 0.85}
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>

            {/* Nodes as HTML (for card styling) */}
            {data.nodes.map((node, idx) => {
              const pos = getNodePos(node);
              const isFork = node.id === data.forkNodeId;
              const nodeStart = sec(0.2) + idx * sec(0.1);
              const nodeOpacity = fadeIn(frame, nodeStart, sec(0.4));
              const springVal = heroSpring(frame, layout.fps, nodeStart);
              const nodeScale = 0.7 + 0.3 * springVal;

              // After split, color nodes by network
              let nodeColor = node.color || semantic.neutral;
              if (frame >= phaseStarts.split) {
                if (node.network === "networkA" && !node.color) nodeColor = networkAColor;
                if (node.network === "networkB" && !node.color) nodeColor = networkBColor;
              }

              const effectiveScale = isFork ? nodeScale * forkPulseScale : nodeScale;

              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: pos.x - nodeRadius * 1.5,
                    top: pos.y - nodeRadius * 1.5,
                    width: nodeRadius * 3,
                    height: nodeRadius * 3,
                    opacity: nodeOpacity,
                    transform: `scale(${effectiveScale})`,
                    transformOrigin: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    ...cardPresets.inset(isDark),
                    borderRadius: "50%",
                    boxShadow: isFork && forkGlowIntensity > 0
                      ? `${shadows.subtle}, ${shadows.accentGlow(palette.amber, 20 * forkGlowIntensity)}`
                      : shadows.subtle,
                    borderColor: nodeColor,
                  }}
                >
                  {node.icon && (
                    <span style={{ fontSize: nodeRadius * 0.8 }}>{node.icon}</span>
                  )}
                  <span
                    style={{
                      fontSize: fontSizes.meta,
                      fontFamily: fonts.mono,
                      fontWeight: fontWeights.bold,
                      color: theme.text.primary,
                      textAlign: "center",
                      lineHeight: 1.2,
                      maxWidth: nodeRadius * 2.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {node.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Network labels (fixed position, outside camera) */}
        <div
          style={{
            position: "absolute",
            bottom: layout.safeAreaTier.generous.bottom + layout.spacing.md,
            left: layout.safeAreaTier.generous.left,
            right: layout.safeAreaTier.generous.right,
            display: "flex",
            justifyContent: "space-between",
            opacity: labelOpacity,
            transform: `translateY(${labelSlide}px)`,
          }}
        >
          <div
            style={{
              fontSize: fontSizes.h3,
              maxWidth: textMaxWidth.h3,
              fontFamily: fonts.display,
              fontWeight: fontWeights.bold,
              color: networkAColor,
              textShadow: `0 0 20px ${networkAColor}40`, // shadows.accentGlow (20px variant)
            }}
          >
            {data.networkALabel}
          </div>
          <div
            style={{
              fontSize: fontSizes.h3,
              maxWidth: textMaxWidth.h3,
              fontFamily: fonts.display,
              fontWeight: fontWeights.bold,
              color: networkBColor,
              textShadow: `0 0 20px ${networkBColor}40`, // shadows.accentGlow (20px variant)
            }}
          >
            {data.networkBLabel}
          </div>
        </div>

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
              transform: `translateY(${slideIn(frame, sec(1), 8, sec(0.5))}px)`,
            }}
          >
            {data.source}
          </div>
        )}

        {/* Episode label */}
        <div
          style={{
            position: "absolute",
            bottom: layout.safeAreaTier.generous.bottom,
            left: layout.safeAreaTier.generous.left,
            fontSize: fontSizes.label,
            color: theme.text.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontFamily: fonts.mono,
            opacity: fadeIn(frame, 0, sec(1)),
            transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
          }}
        >
          {data.episode}
        </div>
      </AbsoluteFill>
      {/* Brand strips */}
      <HeaderStrip mode={mode} metadata={data.episode} />
      <FooterStrip mode={mode} />
    </Background>
  );
};

// ── Static BifurcationRoute (original, backward-compatible) ─────────────────

const StaticBifurcationRoute: React.FC<{ data: BifurcationRouteData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames: totalFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { exitOpacity: defaultExitOpacity } = useCompositionAnimation(direction.driftOptions);
  const theme = useThemeMode(data.backgroundVariant ?? "dark");

  const unifiedDurationFrames = sec(data.unifiedDurationSec ?? 3);
  const splitStartFrame = unifiedDurationFrames;
  const splitDurationFrames = sec(1);
  const networkDrawStartFrame = splitStartFrame + splitDurationFrames;
  const labelShowFrame = networkDrawStartFrame + sec(0.5);

  const canvasWidth = 1920;
  const canvasHeight = 1080;
  const nodeRadius = 24;
  const forkNodeRadius = 28;

  const tokenMap = useMemo(() => createTokenMap(), []);
  const networkAColor = resolveColor(data.networkAColor ?? "us", tokenMap) || semantic.us;
  const networkBColor = resolveColor(data.networkBColor ?? "china", tokenMap) || semantic.china;

  const phase1Opacity = interpolate(
    frame,
    [splitStartFrame, splitStartFrame + sec(0.5)],
    [1, 0],
    CLAMP_CUBIC
  );

  const exitOpacity = defaultExitOpacity;
  const splitPulse = pulse(frame, splitStartFrame, sec(0.8), 1.08);

  const phase3Opacity = interpolate(
    frame,
    [networkDrawStartFrame - sec(0.3), networkDrawStartFrame],
    [0, 1],
    CLAMP_CUBIC
  );

  const labelOpacity = fadeIn(frame, labelShowFrame, sec(0.4));
  const titleOpacity = fadeIn(frame, 0, sec(0.4));
  const titleScale = interpolate(frame, [0, sec(0.4)], [0.95, 1], CLAMP_CUBIC);

  const unifiedLinks = useMemo(
    () => data.links.filter((l) => l.phase === "unified"),
    [data.links]
  );
  const networkALinks = useMemo(
    () => data.links.filter((l) => l.phase === "split" && l.network === "networkA"),
    [data.links]
  );
  const networkBLinks = useMemo(
    () => data.links.filter((l) => l.phase === "split" && l.network === "networkB"),
    [data.links]
  );

  const getUnifiedLinkProgress = (index: number): number => {
    const linkStartFrame = sec(0.2) + index * sec(0.15);
    const linkDuration = sec(0.6);
    return interpolate(frame, [linkStartFrame, linkStartFrame + linkDuration], [0, 1], CLAMP_CUBIC);
  };

  const getNetworkLinkProgress = (index: number): number => {
    const linkStartFrame = networkDrawStartFrame + index * sec(0.12);
    const linkDuration = sec(0.8);
    return interpolate(frame, [linkStartFrame, linkStartFrame + linkDuration], [0, 1], CLAMP_CUBIC);
  };

  const linkPath = (fromNode: BifurcationNode, toNode: BifurcationNode): string => {
    const x1 = (fromNode.x / 100) * canvasWidth;
    const y1 = (fromNode.y / 100) * canvasHeight;
    const x2 = (toNode.x / 100) * canvasWidth;
    const y2 = (toNode.y / 100) * canvasHeight;
    const midX = (x1 + x2) / 2;
    const cp1x = x1 + (midX - x1) * 0.5;
    const cp1y = y1 - 40;
    const cp2x = x2 - (x2 - midX) * 0.5;
    const cp2y = y2 - 40;
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  };

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      <Background
        variant={resolveAnalyticalBackgroundVariant(
          analyticalBackgroundBase(data.backgroundVariant ?? "dark"),
          transparentBackdropRequested(data),
        )}
      />

      <svg width={canvasWidth} height={canvasHeight} style={{ position: "absolute" }}>
        {/* Title */}
        <g opacity={titleOpacity} transform={`translate(${canvasWidth / 2}, ${layout.safeAreaTier.generous.top}) scale(${titleScale})`}>
          <text
            x={0} y={0} textAnchor="middle"
            fill={theme.text.primary}
            fontSize={fontSizes.h2}
            fontFamily={fonts.display}
            fontWeight={fontWeights.bold}
          >
            {data.title}
          </text>
          {data.subtitle && (
            <text
              x={0} y={layout.spacing.md} textAnchor="middle"
              fill={theme.text.secondary}
              fontSize={fontSizes.label}
              fontFamily={fonts.mono}
            >
              {data.subtitle}
            </text>
          )}
        </g>

        {/* Unified links */}
        <g opacity={phase1Opacity}>
          {unifiedLinks.map((link, idx) => {
            const fromNode = data.nodes.find((n) => n.id === link.from);
            const toNode = data.nodes.find((n) => n.id === link.to);
            if (!fromNode || !toNode) return null;
            const progress = getUnifiedLinkProgress(idx);
            const pathD = linkPath(fromNode, toNode);
            const pathLength = Math.hypot(
              (toNode.x - fromNode.x) / 100 * canvasWidth,
              (toNode.y - fromNode.y) / 100 * canvasHeight
            ) * 1.8;

            return (
              <path
                key={`unified-${idx}`}
                d={pathD} fill="none"
                stroke={link.color || semantic.neutral}
                strokeWidth={2} strokeLinecap="round"
                strokeDasharray={link.dashed ? "8,4" : "0"}
                opacity={progress}
              />
            );
          })}
        </g>

        {/* Unified nodes */}
        <g opacity={phase1Opacity}>
          {data.nodes.map((node, idx) => {
            const x = (node.x / 100) * canvasWidth;
            const y = (node.y / 100) * canvasHeight;
            const nodeOpacity = fadeIn(frame, sec(0.1) + stagger(idx, sec(0.08)), sec(0.3));
            return (
              <g key={`u-node-${node.id}`} opacity={nodeOpacity} transform={`translate(${x},${y})`}>
                <circle cx={0} cy={0} r={node.id === data.forkNodeId ? forkNodeRadius : nodeRadius}
                  fill="none" stroke={node.color || semantic.neutral} strokeWidth={2.5} />
                {node.icon && (
                  <text x={0} y={nodeRadius / 2} textAnchor="middle" fontSize={nodeRadius * 1.2}>
                    {node.icon}
                  </text>
                )}
                <text x={0} y={nodeRadius + 32} textAnchor="middle"
                  fill={theme.text.primary} fontSize={fontSizes.label}
                  fontFamily={fonts.mono} fontWeight={fontWeights.bold}>
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Network A links */}
        <g opacity={phase3Opacity}>
          {networkALinks.map((link, idx) => {
            const fromNode = data.nodes.find((n) => n.id === link.from);
            const toNode = data.nodes.find((n) => n.id === link.to);
            if (!fromNode || !toNode) return null;
            const progress = getNetworkLinkProgress(idx);
            return (
              <path key={`netA-${idx}`} d={linkPath(fromNode, toNode)}
                fill="none" stroke={link.color || networkAColor}
                strokeWidth={2} strokeLinecap="round" opacity={progress} />
            );
          })}
        </g>

        {/* Network B links */}
        <g opacity={phase3Opacity}>
          {networkBLinks.map((link, idx) => {
            const fromNode = data.nodes.find((n) => n.id === link.from);
            const toNode = data.nodes.find((n) => n.id === link.to);
            if (!fromNode || !toNode) return null;
            const progress = getNetworkLinkProgress(idx);
            return (
              <path key={`netB-${idx}`} d={linkPath(fromNode, toNode)}
                fill="none" stroke={link.color || networkBColor}
                strokeWidth={2} strokeLinecap="round" opacity={progress} />
            );
          })}
        </g>

        {/* Network phase nodes */}
        <g opacity={phase3Opacity}>
          {data.nodes.map((node) => {
            const x = (node.x / 100) * canvasWidth;
            const y = (node.y / 100) * canvasHeight;
            let nodeColor = node.color || semantic.neutral;
            if (node.network === "networkA" && !node.color) nodeColor = networkAColor;
            if (node.network === "networkB" && !node.color) nodeColor = networkBColor;
            const scale = node.id === data.forkNodeId && frame >= splitStartFrame ? splitPulse : 1;

            return (
              <g key={`net-node-${node.id}`} transform={`translate(${x},${y}) scale(${scale})`}>
                <circle cx={0} cy={0} r={node.id === data.forkNodeId ? forkNodeRadius : nodeRadius}
                  fill="none" stroke={nodeColor} strokeWidth={2.5} />
                {node.icon && (
                  <text x={0} y={nodeRadius / 2} textAnchor="middle" fontSize={nodeRadius * 1.2}>
                    {node.icon}
                  </text>
                )}
                <text x={0} y={nodeRadius + 32} textAnchor="middle"
                  fill={theme.text.primary} fontSize={fontSizes.label}
                  fontFamily={fonts.mono} fontWeight={fontWeights.bold}>
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Network labels */}
        <g opacity={labelOpacity}>
          <text x={canvasWidth * 0.25} y={canvasHeight - layout.safeAreaTier.generous.bottom}
            textAnchor="middle" fill={networkAColor}
            fontSize={fontSizes.body} fontFamily={fonts.display} fontWeight={fontWeights.bold}>
            {data.networkALabel}
          </text>
          <text x={canvasWidth * 0.75} y={canvasHeight - layout.safeAreaTier.generous.bottom}
            textAnchor="middle" fill={networkBColor}
            fontSize={fontSizes.body} fontFamily={fonts.display} fontWeight={fontWeights.bold}>
            {data.networkBLabel}
          </text>
        </g>

        {/* Source */}
        {data.source && (
          <text x={canvasWidth - layout.safeAreaTier.generous.right} y={canvasHeight - layout.safeAreaTier.generous.bottom}
            textAnchor="end" fill={theme.text.muted}
            fontSize={fontSizes.caption} fontFamily={fonts.mono} opacity={0.6}>
            {data.source}
          </text>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// ── Exported component — routes based on cinematicMode ──────────────────────

export const BifurcationRoute: React.FC<{ data: BifurcationRouteData }> = ({ data }) => {
  if (data.cinematicMode) {
    return <CinematicBifurcationRoute data={data} />;
  }
  return <StaticBifurcationRoute data={data} />;
};

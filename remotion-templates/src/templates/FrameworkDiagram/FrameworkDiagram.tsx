/**
 * FrameworkDiagram — conceptual framework visualizations.
 *
 * Three variants:
 * - "comparison": Side-by-side columns (e.g., Chess vs Go strategy)
 * - "flow": Sequential nodes with arrows (e.g., escalation ladder)
 * - "matrix": Grid with highlighted cells (e.g., 2×2 strategy matrix)
 *
 * silicon-trap use case: Chess vs Go — Western vs Chinese strategic thinking.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { palette, semantic, fonts, fontSizes, layout, sec, contentArea, columnLayout, cardPadding, textMaxWidth, shadows, radii, cardPresets, dividerStyle, textSafe } from "../../design/theme";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { TitleBlock } from "../../components/TitleBlock";
import { AnimatedArrow } from "../../components/AnimatedArrow";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { fadeIn, slideIn, stagger, exitFade, scaleReveal, bloomIntensity, heroSpring, CLAMP_QUAD } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useBeatSync } from "../../hooks/useBeatSync";
import { useThemeMode } from "../../hooks/useThemeMode";
import { Background } from "../../components/Background";
import type { FrameworkDiagramData, FrameworkPhase, EliminatedScenario } from "./types";

// ── Comparison variant ─────────────────────────────────────────────────────

const ComparisonVariant: React.FC<{
  data: FrameworkDiagramData;
  frame: number;
}> = React.memo(({ data, frame }) => {
  const theme = useThemeMode(data.backgroundVariant);
  const { durationInFrames } = useVideoConfig();
  const emphasis = useEpisodeColorEmphasis();
  // Pull syncPoints + pace scale via useDirection (the canonical resolver —
  // avoids duplicating the PACE_TIMING table here). Cheap to call twice.
  const direction = useDirection(data._direction);
  const s = direction.paceStaggerScale;
  // Audio-reactive amplification for the VS divider glow oscillation. Hook
  // is called unconditionally; the conditional VS render below uses
  // `vsBeat.pulse` only when columns.length === 2.
  const vsBeat = useBeatSync({
    markers: (direction.syncPoints ?? []).map((p) => p.timeSec),
    pulseDecay: 0.4,
  });
  const columns = data.columns || [];
  const cols = useMemo(
    () => columnLayout(columns.length, { titleVariant: "content", safeAreaTier: "generous" }),
    [columns.length]
  );

  return (
    <div
      style={{
        position: "absolute",
        top: cols.top,
        left: cols.left,
        right: cols.right,
        bottom: cols.bottom,
        display: "flex",
        gap: cols.gap,
        justifyContent: "center",
      }}
    >
      {columns.map((col, ci) => {
        const colStart = stagger(ci, sec(0.6 * s), sec(0.5));
        const colOpacity = fadeIn(frame, colStart, sec(0.5));
        // Cinematic: columns enter with spring overshoot (POLISH A2)
        const colScale = 0.92 + 0.08 * heroSpring(frame, layout.fps, colStart);
        const colColor = col.color || emphasis.primaryAccent;

        return (
          <div
            key={ci}
            style={{
              width: cols.columnWidth,
              opacity: colOpacity,
              transform: `scale(${colScale})`,
              transformOrigin: "top center",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Column header — with accent glow + scaleX underline */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: layout.spacing.sm,
                marginBottom: layout.spacing.md,
                paddingBottom: layout.spacing.sm,
                position: "relative",
              }}
            >
              {/* Animated underline — scaleX from left */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${colColor}, ${colColor}40)`,
                  transform: `scaleX(${interpolate(frame, [colStart + sec(0.2), colStart + sec(0.7)], [0, 1], CLAMP_QUAD)})`,
                  transformOrigin: "left center",
                }}
              />
              {/* Subtle glow under the header border */}
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: colColor,
                  filter: "blur(8px)",
                  opacity: fadeIn(frame, colStart + sec(0.3), sec(0.4)) * 0.5,
                }}
              />
              {col.icon && (
                <span style={{ fontSize: fontSizes.h3 }}>{col.icon}</span>
              )}
              <div
                style={{
                  fontSize: fontSizes.h2,
                  fontWeight: 600,
                  color: theme.text.primary,
                  fontFamily: fonts.heading,
                  textShadow: `0 0 20px ${colColor}30`, // shadows.accentGlow (20px, 30% opacity variant)
                  maxWidth: textMaxWidth.h2,
                }}
              >
                {col.title}
              </div>
            </div>

            {/* Items — more dramatic stagger with scale entrance */}
            {col.items.map((item, ii) => {
              const itemStart = colStart + stagger(ii, sec(0.12 * s), sec(0.4));
              const itemOpacity = fadeIn(frame, itemStart, sec(0.4));
              const itemSlide = slideIn(frame, itemStart, 30, sec(0.5));
              const itemScale = scaleReveal(frame, itemStart, sec(0.4), 1.05, 1.0);
              const itemExit = exitFade(frame, durationInFrames, 15);
              const itemColor = col.color || emphasis.primaryAccent;

              return (
                <div
                  key={ii}
                  style={{
                    opacity: itemOpacity * itemExit,
                    transform: `translateY(${itemSlide}px) scale(${itemScale})`,
                    transformOrigin: "left center",
                    marginBottom: layout.spacing.sm,
                    // Editorial letterhead — accent left edge in column color
                    ...cardPresets.accentEdge(itemColor, data.backgroundVariant === "dark"),
                  }}
                >
                  <div
                    style={{
                      fontSize: fontSizes.body,
                      maxWidth: textMaxWidth.body,
                      color: theme.text.primary,
                      lineHeight: 1.5,
                      textShadow: shadows.textLift,
                    }}
                  >
                    {item}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* VS divider for 2-column comparisons — quiet typographic moment with glow */}
      {columns.length === 2 && (() => {
        const vsOpacity = fadeIn(frame, sec(1.0), sec(0.5));
        const exit = exitFade(frame, durationInFrames, 15);
        // Beat sync amplifies the glow oscillation amplitude on sync points.
        const glowPulse = 0.3 + (0.15 + vsBeat.pulse * 0.1) * Math.sin(frame * 0.025);
        return (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: fontSizes.h3,
              maxWidth: textMaxWidth.node,
              color: theme.text.muted,
              fontWeight: 500,
              fontFamily: fonts.mono,
              opacity: vsOpacity * exit,
              letterSpacing: 3,
              textTransform: "uppercase",
              textShadow: `0 0 12px ${palette.amber}${Math.round(glowPulse * 255).toString(16).padStart(2, "0")}`, // shadows.accentGlowMd animated (dynamic opacity)
            }}
          >
            vs
          </div>
        );
      })()}
    </div>
  );
});

// ── Flow variant ───────────────────────────────────────────────────────────

const FlowVariant: React.FC<{
  data: FrameworkDiagramData;
  frame: number;
}> = React.memo(({ data, frame }) => {
  const theme = useThemeMode(data.backgroundVariant);
  const { durationInFrames } = useVideoConfig();
  const emphasis = useEpisodeColorEmphasis();
  const nodes = data.nodes || [];
  const arrowLabels = data.arrowLabels || [];
  const accentColor = data.accentColor || emphasis.primaryAccent;
  const phases = data.phases || [];
  const eliminatedScenarios = data.eliminatedScenarios || [];

  const area = contentArea("content", "generous");
  const nodeWidth = textMaxWidth.node;
  const arrowGap = layout.spacing.xxxl;

  // Detect spatial layout mode: if any node has a position field, use spatial rendering
  const isSpatial = nodes.some((n) => n.position != null);

  // ── Phase-based visibility ──
  // Determine which nodes are currently visible based on phases
  const visibleNodeIndices = useMemo(() => {
    if (phases.length === 0) {
      // No phases: all nodes visible (legacy behavior)
      return nodes.map((_, i) => i);
    }
    let cumulativeFrames = 0;
    const visible = new Set<number>();
    for (const phase of phases) {
      const phaseEnd = cumulativeFrames + sec(phase.durationSec);
      if (frame >= cumulativeFrames) {
        // Add this phase's active nodes
        if (phase.activeNodes) {
          phase.activeNodes.forEach((idx) => visible.add(idx));
        }
      }
      cumulativeFrames = phaseEnd;
    }
    return Array.from(visible);
  }, [frame, phases, nodes]);

  // Current phase label
  const currentPhaseLabel = useMemo(() => {
    if (phases.length === 0) return "";
    let cumulativeFrames = 0;
    for (const phase of phases) {
      const phaseEnd = cumulativeFrames + sec(phase.durationSec);
      if (frame >= cumulativeFrames && frame < phaseEnd) {
        return phase.label;
      }
      cumulativeFrames = phaseEnd;
    }
    return phases[phases.length - 1]?.label || "";
  }, [frame, phases]);

  // ── Eliminated scenarios timing ──
  const eliminatedVisible = useMemo(() => {
    return eliminatedScenarios.map((es, i) => {
      // Show eliminated scenario after corresponding filter node appears
      const filterNodeStart = stagger(es.filter, sec(0.8), sec(0.5));
      return frame >= filterNodeStart + sec(1.0);
    });
  }, [frame, eliminatedScenarios]);

  // Pre-compute lookup: filter index → [{es, originalIdx}]
  // Replaces O(n) .filter() + .indexOf() calls inside the per-frame render loop
  const eliminatedByFilter = useMemo(() => {
    const map = new Map<number, Array<{ es: (typeof eliminatedScenarios)[0]; idx: number }>>();
    eliminatedScenarios.forEach((es, idx) => {
      const key = es.filter ?? -1;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ es, idx });
    });
    return map;
  }, [eliminatedScenarios]);

  // ── SPATIAL LAYOUT MODE ──
  if (isSpatial) {
    const containerWidth = 900;
    const containerHeight = 500;

    return (
      <div
        style={{
          position: "absolute",
          top: area.top,
          left: area.left,
          right: area.right,
          bottom: area.bottom,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", width: containerWidth, height: containerHeight }}>
          {/* Connection lines between spatial nodes */}
          <svg
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            width={containerWidth}
            height={containerHeight}
          >
            {nodes.map((node, i) => {
              if (i >= nodes.length - 1) return null;
              if (!node.position || !nodes[i + 1]?.position) return null;
              const x1 = node.position.x * containerWidth;
              const y1 = node.position.y * containerHeight;
              const x2 = nodes[i + 1].position!.x * containerWidth;
              const y2 = nodes[i + 1].position!.y * containerHeight;
              const lineStart = stagger(i, sec(0.8), sec(0.5)) + sec(0.3);
              const lineOpacity = fadeIn(frame, lineStart, sec(0.5));
              const isVisible = visibleNodeIndices.includes(i) && visibleNodeIndices.includes(i + 1);
              if (!isVisible) return null;
              return (
                <line
                  key={`line-${i}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={accentColor}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity={lineOpacity * 0.5}
                />
              );
            })}
          </svg>

          {/* Spatial nodes */}
          {nodes.map((node, i) => {
            if (!node.position) return null;
            const isVisible = visibleNodeIndices.includes(i);
            const nodeStart = stagger(i, sec(0.6), sec(0.3));
            const nodeOpacity = isVisible ? fadeIn(frame, nodeStart, sec(0.5)) : 0;
            const nodeScale = scaleReveal(frame, nodeStart, sec(0.5), 1.15, 1.0);
            const nodeColor = node.color || accentColor;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: node.position.x * containerWidth,
                  top: node.position.y * containerHeight,
                  transform: `translate(-50%, -50%) scale(${nodeScale})`,
                  opacity: nodeOpacity,
                  ...cardPresets.inset(data.backgroundVariant === "dark"),
                  textAlign: "center",
                  width: nodeWidth * 0.8,
                  padding: `${layout.spacing.md}px ${layout.spacing.lg}px`,
                }}
              >
                <div
                  style={{
                    fontSize: fontSizes.h3,
                    maxWidth: textMaxWidth.node,
                    color: theme.text.primary,
                    fontWeight: 600,
                    textShadow: shadows.textLift,
                  }}
                >
                  {node.label}
                </div>
                {node.sublabel && (
                  <div
                    style={{
                      fontSize: fontSizes.caption,
                      color: nodeColor,
                      marginTop: layout.spacing.xs,
                      textShadow: shadows.accentGlowMd(nodeColor),
                    }}
                  >
                    {node.sublabel}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── SEQUENTIAL (LINEAR) LAYOUT MODE ──

  // Progressive focus: determine which node is "active" (most recently appeared)
  const activeNodeIndex = useMemo(() => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const nodeStart = stagger(i, sec(0.8), sec(0.5));
      if (frame >= nodeStart + sec(0.4)) return i;
    }
    return 0;
  }, [frame, nodes.length]);

  // Camera-like horizontal pan: translate container to follow active node
  const panProgress = nodes.length > 1
    // linear-ok: maps discrete node index→pan ratio, not frame-based animation
    ? interpolate(activeNodeIndex, [0, nodes.length - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;
  const panOffset = interpolate(
    frame,
    [0, durationInFrames * 0.8],
    [40, -40 * panProgress],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" } // linear-ok: slow continuous parallax pan, linear drift is intentional
  );

  return (
    <div
      style={{
        position: "absolute",
        top: area.top,
        left: area.left,
        right: area.right,
        bottom: area.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Phase label */}
      {currentPhaseLabel && (
        <div
          style={{
            marginBottom: layout.spacing.lg,
            fontSize: fontSizes.caption,
            fontFamily: fonts.body,
            color: theme.text.muted,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            opacity: fadeIn(frame, sec(0.5), sec(0.5)),
          }}
        >
          {currentPhaseLabel}
        </div>
      )}

      {/* Nodes row */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 0,
          transform: `translateX(${panOffset}px)`,
        }}
      >
        {nodes.map((node, i) => {
          const isVisible = visibleNodeIndices.includes(i);
          const nodeStart = stagger(i, sec(0.8), sec(0.5));
          const nodeOpacity = isVisible ? fadeIn(frame, nodeStart, sec(0.4)) : 0;
          const nodeSlide = slideIn(frame, nodeStart, 30, sec(0.4));
          const nodeColor = node.color || accentColor;

          // Progressive focus: dim earlier nodes as later ones appear
          const dimAmount = i < activeNodeIndex
            // linear-ok: maps discrete node-distance→dim level, not frame-based motion
            ? interpolate(activeNodeIndex - i, [0, 3], [0, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
            : 0;
          const focusOpacity = 1 - dimAmount;
          const exitOp = exitFade(frame, durationInFrames, 15);

          return (
            <React.Fragment key={i}>
              {/* Node */}
              <div
                style={{
                  opacity: nodeOpacity * focusOpacity * exitOp,
                  transform: `translateX(${nodeSlide}px) scale(${scaleReveal(frame, nodeStart, sec(0.5), 1.1, 1.0)}) perspective(1200px) rotateY(${i % 2 === 0 ? -3 : 3}deg)`,
                  transformOrigin: "center center",
                  width: nodeWidth,
                  ...cardPresets.inset(data.backgroundVariant === "dark"),
                  textAlign: "center",
                  flexShrink: 0,
                  filter: dimAmount > 0.1 ? `blur(${dimAmount * 1.5}px)` : undefined,
                }}
              >
                <div
                  style={{
                    fontSize: fontSizes.h3,
                    maxWidth: textMaxWidth.node,
                    color: theme.text.primary,
                    fontWeight: 600,
                    textShadow: shadows.textLift,
                  }}
                >
                  {node.label}
                </div>
                {node.sublabel && (
                  <div
                    style={{
                      fontSize: fontSizes.caption,
                      color: theme.text.muted,
                      marginTop: layout.spacing.xs,
                      textShadow: shadows.textLift,
                    }}
                  >
                    {node.sublabel}
                  </div>
                )}
              </div>

              {/* Arrow between nodes */}
              {i < nodes.length - 1 && (() => {
                const arrowStart = stagger(i, sec(0.8), sec(0.5)) + sec(0.3);
                const arrowOpacity = fadeIn(frame, arrowStart, sec(0.3));
                return (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: arrowGap,
                      flexShrink: 0,
                      opacity: arrowOpacity * exitOp,
                    }}
                  >
                    <AnimatedArrow
                      startFrame={arrowStart}
                      color={accentColor}
                      label={arrowLabels[i]}
                      labelColor={theme.text.muted}
                    />

                    {/* Eliminated scenario beside arrow */}
                    {(eliminatedByFilter.get(i) || []).map(({ es, idx }, ei) => {
                      const esVisible = eliminatedVisible[idx];
                      const esColor = es.color || semantic.danger;
                      return esVisible ? (
                        <div
                          key={ei}
                          style={{
                            fontSize: fontSizes.small,
                            color: esColor,
                            marginTop: 2,
                            textDecoration: "line-through",
                            opacity: fadeIn(frame, stagger(i, sec(0.8), sec(0.5)) + sec(1.2), sec(0.3)),
                          }}
                        >
                          {es.scenario}
                        </div>
                      ) : null;
                    })}
                  </div>
                );
              })()}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});

// ── Matrix variant ─────────────────────────────────────────────────────────

const MatrixVariant: React.FC<{
  data: FrameworkDiagramData;
  frame: number;
}> = React.memo(({ data, frame }) => {
  const theme = useThemeMode(data.backgroundVariant);
  const emphasis = useEpisodeColorEmphasis();
  const rowHeaders = data.rowHeaders || [];
  const colHeaders = data.colHeaders || [];
  const cells = data.cells || [];
  const accentColor = data.accentColor || emphasis.primaryAccent;

  const headerWidth = 180;
  const colHeaderHeight = 48;
  const cellMargin = layout.spacing.xs / 2;
  const area = useMemo(() => contentArea("content", "generous"), []);
  const cellSize = useMemo(() => {
    const availW = Math.floor(
      (area.width - headerWidth - colHeaders.length * cellMargin * 2) /
        Math.max(1, colHeaders.length)
    );
    return Math.min(260, Math.max(140, availW));
  }, [area.width, colHeaders.length, cellMargin]);
  const cellHeight = useMemo(() => {
    const availH = Math.floor(
      (area.height - colHeaderHeight - rowHeaders.length * cellMargin * 2) /
        Math.max(1, rowHeaders.length)
    );
    return Math.min(180, Math.max(80, availH));
  }, [area.height, rowHeaders.length, cellMargin]);

  const cellLookup = useMemo(() => {
    const map = new Map<string, typeof cells[number]>();
    for (const cell of cells) {
      map.set(`${cell.row}-${cell.col}`, cell);
    }
    return map;
  }, [cells]);

  return (
    <div
      style={{
        position: "absolute",
        top: area.top,
        left: area.left,
        width: area.width,
        height: area.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div>
        {/* Column headers row */}
        <div style={{ display: "flex", marginLeft: headerWidth }}>
          {colHeaders.map((ch, ci) => (
            <div
              key={ci}
              style={{
                width: cellSize,
                textAlign: "center",
                fontSize: fontSizes.caption,
                color: theme.text.muted,
                fontWeight: 600,
                padding: `${layout.spacing.sm}px ${layout.spacing.xs}px`,
                opacity: fadeIn(frame, stagger(ci, sec(0.3), sec(0.5)), sec(0.3)),
              }}
            >
              {ch}
            </div>
          ))}
        </div>

        {/* Rows */}
        {rowHeaders.map((rh, ri) => (
          <div key={ri} style={{ display: "flex", alignItems: "center" }}>
            {/* Row header */}
            <div
              style={{
                width: headerWidth,
                fontSize: fontSizes.caption,
                color: theme.text.muted,
                fontWeight: 600,
                textAlign: "right",
                paddingRight: layout.spacing.md,
                opacity: fadeIn(
                  frame,
                  stagger(ri, sec(0.3), sec(0.5)),
                  sec(0.3)
                ),
                ...textSafe.wrap,
              }}
            >
              {rh}
            </div>

            {/* Cells in this row */}
            {colHeaders.map((_, ci) => {
              const cell = cellLookup.get(`${ri}-${ci}`);
              const cellStart = stagger(
                ri * colHeaders.length + ci,
                sec(0.2),
                sec(0.8)
              );
              const cellOpacity = fadeIn(frame, cellStart, sec(0.4));
              const cellScale = scaleReveal(frame, cellStart, sec(0.4), 1.08, 1.0);
              const cellSlideY = slideIn(frame, cellStart, 16, sec(0.4));
              const cellColor = cell?.color || palette.midnight;
              const isHighlight = cell?.highlight;

              return (
                <div
                  key={ci}
                  style={{
                    width: cellSize,
                    minHeight: cellHeight,
                    margin: cellMargin,
                    borderRadius: radii.md,
                    border: `1px solid ${isHighlight ? accentColor : cellColor}${isHighlight ? "60" : "28"}`,
                    backgroundColor: isHighlight
                      ? `${accentColor}1F`
                      : `${cellColor}08`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: cellOpacity,
                    transform: `translateY(${cellSlideY}px) scale(${cellScale}) perspective(1400px) rotateX(${ri % 2 === 0 ? -2 : 2}deg)`,
                    transformOrigin: "center center",
                    padding: cardPadding.css,
                    boxShadow: isHighlight
                      ? `${shadows.medium}, 0 0 24px ${accentColor}50, inset 0 1px 0 rgba(255,255,255,0.08)`
                      : `${shadows.subtle}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                    ...textSafe.wrap,
                  }}
                >
                  <div
                    style={{
                      fontSize: fontSizes.caption,
                      color: isHighlight ? accentColor : theme.text.primary,
                      textAlign: "center",
                      fontWeight: isHighlight ? 600 : 400,
                      lineHeight: 1.4,
                      textShadow: shadows.textLift,
                      maxWidth: cellSize - cardPadding.horizontal * 2,
                      ...textSafe.wrap,
                    }}
                  >
                    {cell?.label || ""}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Main component ──────────────────────────────────────────────────────────

export const FrameworkDiagram: React.FC<{ data: FrameworkDiagramData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant || "light";
  const theme = useThemeMode(bgVariant);
  // Per-episode color emphasis — pulls primaryAccent for column accents and
  // highlight glow. See remotion-templates/BRAND.md → "Per-Episode Color Emphasis".
  const emphasis = useEpisodeColorEmphasis();

  return (
    <Background
      variant={bgVariant}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* Brand strips */}
        <HeaderStrip metadata={data.episode} mode={bgVariant} />
        <FooterStrip mode={bgVariant} />

        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={bgVariant}
          safeAreaTier="generous"
        />

        {/* Diagram content */}
        {data.variant === "comparison" && (
          <ComparisonVariant data={data} frame={frame} />
        )}
        {data.variant === "flow" && (
          <FlowVariant data={data} frame={frame} />
        )}
        {data.variant === "matrix" && (
          <MatrixVariant data={data} frame={frame} />
        )}

        {/* Episode label — slideIn (no naked fade) */}
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
            transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
          }}
        >
          {data.episode}
        </div>
      </AbsoluteFill>
    </Background>
  );
};

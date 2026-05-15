/**
 * FrameworkDiagram — conceptual framework visualizations.
 *
 * Three variants, each with a NON-OVERLAPPING editorial use case:
 *
 * - **comparison** — PARALLEL VIEWS. Two or more columns evaluated against
 *   the same criteria. Use when the editorial point is "these two frames see
 *   the same world differently" (Chess vs Go strategy, decoupling vs
 *   interdependence). Ordinal numbering + row-parallel structure is the
 *   convention. Add `protagonist: <index>` when one side leads the argument.
 *
 * - **flow** — SEQUENTIAL CAUSATION. Stages connected by arrows; each stage
 *   produces the next. Use when the editorial point is "X causes Y causes Z."
 *   Add `flowSpacing: "proportional"` + per-node `weight` when stage duration
 *   is part of the argument. WRONG for: parallel categories (use comparison),
 *   abstract typologies (use matrix), value distribution (use SankeyFlow).
 *
 * - **matrix** — 2D TYPOLOGY. A grid where each cell is the intersection of
 *   two dimensions. Use when the editorial point is "these two axes carve
 *   the space into distinct types" (Eisenhower urgent-vs-important,
 *   BCG growth-vs-share). Add `items: [{ x, y, label }]` for empirical
 *   scatter — *where actors actually sit* — rather than just labeling
 *   quadrants abstractly.
 *
 * If you can't decide between two variants, your editorial frame is unclear
 * — fix the framing before picking the form. See dossier § "Decision rule":
 * references/template-research/framework-diagram.md
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
import { palette, semantic, fonts, fontSizes, layout, sec, contentArea, columnLayout, cardPadding, textMaxWidth, shadows, radii, cardPresets, dividerStyle, textSafe, letterSpacing } from "../../design/theme";

// CJK detector — used to switch the bilingual secondary label and item body
// font to the Chinese stack. Inlined to avoid a cross-template import on a
// one-line regex.
const CJK_REGEX = /[一-鿿぀-ゟ゠-ヿ]/;
const getBodyFont = (text: string): string =>
  CJK_REGEX.test(text) ? fonts.chinese : fonts.body;
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { TitleBlock } from "../../components/TitleBlock";
import { AnimatedArrow } from "../../components/AnimatedArrow";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { fadeIn, slideIn, stagger, exitFade, scaleReveal, bloomIntensity, heroSpring, anticipatoryStartFrame, CLAMP_QUAD } from "../../utils/animation";
import { warnIf } from "../../utils/dataWarnings";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useBeatSync } from "../../hooks/useBeatSync";
import { useThemeMode } from "../../hooks/useThemeMode";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
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
  // D17 anticipatory reveal: first column appears settled when narrator names it.
  const firstSyncFrameFW = direction.syncPoints?.[0]?.frame;
  const firstColumnRevealBase = firstSyncFrameFW != null
    ? anticipatoryStartFrame(firstSyncFrameFW, sec(0.5))
    : sec(0.5); // existing default
  // Audio-reactive amplification for the VS divider glow oscillation. Hook
  // is called unconditionally; the conditional VS render below uses
  // `vsBeat.pulse` only when columns.length === 2.
  const vsBeat = useBeatSync({
    markers: (direction.syncPoints ?? []).map((p) => p.timeSec),
    pulseDecay: 0.4,
  });
  const columns = data.columns || [];
  const { cols, maxItems } = useMemo(() => {
    const computed = columnLayout(columns.length, { titleVariant: "content", safeAreaTier: "generous" });
    const max = Math.max(...columns.map((c) => c.items.length), 0);
    return { cols: computed, maxItems: max };
  }, [columns]);

  // Parse "Title (中文)" pattern so we can render the parenthetical at lighter
  // weight. Also tolerates titles without a parenthetical.
  const splitTitle = (full: string): { primary: string; secondary?: string } => {
    const m = full.match(/^(.*?)\s*\((.+)\)\s*$/);
    if (m) return { primary: m[1], secondary: m[2] };
    return { primary: full };
  };

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
        const colStart = stagger(ci, sec(0.6 * s), firstColumnRevealBase);
        const colOpacity = fadeIn(frame, colStart, sec(0.5));
        const colScale = 0.96 + 0.04 * heroSpring(frame, layout.fps, colStart);
        const colColor = col.color || emphasis.primaryAccent;
        const { primary, secondary } = splitTitle(col.title);

        // Editorial protagonist hierarchy: when `data.protagonist` names a
        // column, the named column reads at full weight; the other column(s)
        // recede to ~40% so they remain continuously legible but cede the
        // editorial spotlight. Equal-weight (omitted) is the default —
        // appropriate for true comparisons where neither side leads. See:
        // references/template-research/framework-diagram.md § 6.3
        const hasProtagonist = data.protagonist !== undefined;
        const isProtagonist = hasProtagonist && data.protagonist === ci;
        const isFoil = hasProtagonist && data.protagonist !== ci;
        const foilMute = isFoil ? 0.4 : 1.0;

        return (
          <div
            key={ci}
            style={{
              width: cols.columnWidth,
              opacity: colOpacity * foilMute,
              transform: `scale(${colScale})`,
              transformOrigin: "top center",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Column header — icon + bilingual title + accent rule */}
            <div
              style={{
                position: "relative",
                paddingBottom: layout.spacing.md,
                marginBottom: layout.spacing.lg,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: layout.spacing.sm,
                }}
              >
                {col.icon && (
                  <span
                    style={{
                      fontSize: fontSizes.h2,
                      maxWidth: textMaxWidth.node,
                      color: colColor,
                      lineHeight: 1,
                    }}
                  >
                    {col.icon}
                  </span>
                )}
                <div
                  style={{
                    fontSize: fontSizes.h1,
                    fontWeight: 700,
                    color: theme.text.primary,
                    fontFamily: fonts.heading,
                    lineHeight: 1.1,
                    maxWidth: textMaxWidth.h1,
                  }}
                >
                  {primary}
                  {secondary && (
                    <span
                      style={{
                        fontSize: fontSizes.h3,
                        fontWeight: 400,
                        color: theme.text.muted,
                        marginLeft: layout.spacing.sm,
                        fontFamily: getBodyFont(secondary),
                      }}
                    >
                      {secondary}
                    </span>
                  )}
                </div>
              </div>
              {/* Accent rule — solid column color, draws in left→right.
                  Protagonist gets full-saturation rule; equal-weight columns
                  share the canonical 0.7 opacity. */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: isProtagonist ? 3 : 2,
                  background: colColor,
                  opacity: isProtagonist ? 1 : 0.7,
                  transform: `scaleX(${interpolate(
                    frame,
                    [colStart + sec(0.2), colStart + sec(0.8)],
                    [0, 1],
                    CLAMP_QUAD
                  )})`,
                  transformOrigin: "left center",
                }}
              />
            </div>

            {/* Items — pair-aligned rows with ordinal numbering */}
            {Array.from({ length: maxItems }).map((_, ii) => {
              const item = col.items[ii];
              if (!item) return null;
              const itemStart = colStart + stagger(ii, sec(0.12 * s), sec(0.4));
              const itemOpacity = fadeIn(frame, itemStart, sec(0.4));
              const itemExit = exitFade(frame, durationInFrames, 15);
              const ordinal = String(ii + 1).padStart(2, "0");

              return (
                <div
                  key={ii}
                  style={{
                    opacity: itemOpacity * itemExit,
                    display: "flex",
                    alignItems: "baseline",
                    gap: layout.spacing.md,
                    paddingTop: layout.spacing.md,
                    paddingBottom: layout.spacing.md,
                    borderTop: `1px solid ${theme.text.muted}30`,
                  }}
                >
                  {/* Ordinal — mono caps, muted, narrow gutter */}
                  <div
                    style={{
                      fontSize: fontSizes.label,
                      fontFamily: fonts.mono,
                      color: colColor,
                      letterSpacing: letterSpacing.meta,
                      fontWeight: 600,
                      width: 32,
                      flexShrink: 0,
                      maxWidth: textMaxWidth.label,
                    }}
                  >
                    {ordinal}
                  </div>
                  {/* Item text */}
                  <div
                    style={{
                      flex: 1,
                      fontSize: fontSizes.body,
                      maxWidth: textMaxWidth.body,
                      color: theme.text.primary,
                      lineHeight: 1.4,
                      fontFamily: getBodyFont(item),
                    }}
                  >
                    {item}
                  </div>
                </div>
              );
            })}
            {/* Closing rule beneath the last item — matches header rule weight */}
            <div
              style={{
                height: 1,
                background: theme.text.muted,
                opacity: 0.3,
              }}
            />
          </div>
        );
      })}
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

  // Editorial process spine: ordinal numbers + horizontal spine line through
  // circle markers + node title/subtitle blocks below + arrow labels above
  // each segment. Replaces the card-row-with-arrows ("PowerPoint SmartArt")
  // treatment. Spine color progresses from muted at start to accent at end,
  // and the terminal node is rendered hero-weight to celebrate the destination.
  const exitOp = exitFade(frame, durationInFrames, 15);
  const numNodes = nodes.length;

  // Bounds check on data.heroStage — silent out-of-range index causes no
  // stage to render as hero (the `i === heroIdx` comparison never matches).
  // Warn at data-load time rather than clamping; data writers should know.
  warnIf(
    data.heroStage !== undefined && (data.heroStage < 0 || data.heroStage >= numNodes),
    "FrameworkDiagram",
    `heroStage index out of range; expected 0..${numNodes - 1}, got ${data.heroStage}`,
    { heroStage: data.heroStage, numNodes },
  );

  // Geometry: nodes share equal slots across the chart area regardless of
  // arrow label length — the slot width is constant, label wraps if needed.
  // Spine markers sit at slot centers.
  const flowWidth = Math.min(area.width - layout.spacing.xxxl * 2, 1500);
  const slotWidth = numNodes > 0 ? flowWidth / numNodes : flowWidth;
  const markerRadius = 13;

  warnIf(
    data.flowSpacing === "proportional" && nodes.some(n => !n.weight),
    "FrameworkDiagram",
    `flowSpacing='proportional' requires ALL nodes to have a positive weight, but ${nodes.filter(n => !n.weight).map(n => n.label).join(", ")} ${nodes.filter(n => !n.weight).length === 1 ? "is" : "are"} missing weight — falling back to equal spacing.`
  );

  // Per-node slot center x positions. When flowSpacing="proportional" AND
  // every node has `weight` set, gaps between successive nodes scale with
  // their weight. Otherwise equal-spaced (legacy behavior).
  // See: references/template-research/framework-diagram.md § 6.1
  const slotCenterX = useMemo((): number[] => {
    const useProportional =
      data.flowSpacing === "proportional" &&
      nodes.length > 1 &&
      nodes.every((n) => typeof n.weight === "number" && (n.weight as number) > 0);
    if (!useProportional) {
      // Equal-spaced: slot center at slotWidth * (i + 0.5).
      return nodes.map((_, i) => slotWidth * (i + 0.5));
    }
    // Proportional: gaps between successive nodes scale with weight.
    // Use n-1 segments (gaps) weighted by midpoint-weight of adjacent nodes
    // — simpler is to weight each gap by avg(weight[i], weight[i+1]).
    const weights = nodes.map((n) => n.weight as number);
    const gapWeights: number[] = [];
    for (let i = 0; i < weights.length - 1; i++) {
      gapWeights.push((weights[i] + weights[i + 1]) / 2);
    }
    const totalGapWeight = gapWeights.reduce((a, b) => a + b, 0);
    // First and last nodes anchor at slotWidth/2 and flowWidth - slotWidth/2.
    const spineLeft = slotWidth / 2;
    const spineRight = flowWidth - slotWidth / 2;
    const span = spineRight - spineLeft;
    const positions: number[] = [spineLeft];
    let cumulative = 0;
    for (let i = 0; i < gapWeights.length; i++) {
      cumulative += gapWeights[i];
      positions.push(spineLeft + (cumulative / totalGapWeight) * span);
    }
    return positions;
  }, [data.flowSpacing, nodes, slotWidth, flowWidth]);
  // Color progression along the spine — starts neutral, lands on accent.
  // Each marker reads its t in [0,1] (i / (n-1)) to interpolate.

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

      {/* Process spine layout — fills the chart area with structured rows */}
      <div
        style={{
          position: "relative",
          width: flowWidth,
          height: 360,
          transform: `translateX(${panOffset}px)`,
        }}
      >
        {/* Spine line — single horizontal rule passing through markers,
            draws in left-to-right as nodes appear. Sits at the vertical
            center of the flow region. */}
        <svg
          width={flowWidth}
          height={360}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            overflow: "visible",
          }}
        >
          <defs>
            <linearGradient id="flow-spine-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.text.primary} stopOpacity={0.5} />
              <stop offset="100%" stopColor={accentColor} stopOpacity={1} />
            </linearGradient>
            <linearGradient id="flow-zone-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={accentColor} stopOpacity={0} />
              <stop offset="50%" stopColor={accentColor} stopOpacity={0.05} />
              <stop offset="100%" stopColor={accentColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {/* Background zone — subtle horizontal band giving the flow region
              visual weight against the surrounding paper. Faint enough not
              to compete with the spine; just enough that the diagram doesn't
              feel like dots floating in white space. */}
          {(() => {
            const zoneOpacity = fadeIn(frame, sec(0.3), sec(0.5)) * exitOp;
            return (
              <rect
                x={0}
                y={140}
                width={flowWidth}
                height={80}
                fill="url(#flow-zone-grad)"
                opacity={zoneOpacity}
                rx={4}
              />
            );
          })()}
          {/* Spine — single confident horizontal line. Track shows the full
              extent at low opacity from frame zero so the geometry reads
              even before nodes appear; the foreground stroke draws in over
              that track as the lifecycle progresses. */}
          {(() => {
            const spineStart = stagger(0, sec(0.8), sec(0.5));
            const spineProgress = interpolate(
              frame,
              [spineStart, spineStart + sec(numNodes * 0.6)],
              [0, 1],
              CLAMP_QUAD
            );
            const spineLeft = slotWidth / 2;
            const spineRight = flowWidth - slotWidth / 2;
            const spineWidth = spineRight - spineLeft;
            const trackOpacity = fadeIn(frame, sec(0.4), sec(0.4)) * exitOp;
            return (
              <g>
                {/* Track — full-extent ghost line behind the animating spine */}
                <line
                  x1={spineLeft}
                  y1={180}
                  x2={spineRight}
                  y2={180}
                  stroke={theme.text.muted}
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={trackOpacity * 0.35}
                />
                {/* Foreground spine — gradient muted→accent, draws in */}
                <line
                  x1={spineLeft}
                  y1={180}
                  x2={spineLeft + spineWidth * spineProgress}
                  y2={180}
                  stroke="url(#flow-spine-grad)"
                  strokeWidth={5}
                  strokeLinecap="round"
                  opacity={exitOp}
                />
              </g>
            );
          })()}
          {/* Directional chevrons — small ▶ pointing forward at each segment
              midpoint, between markers. Makes the spine's direction explicit
              without competing with the arrow-verb labels above. Scales with
              the spine's draw-in progress so chevrons reveal in sequence. */}
          {Array.from({ length: Math.max(0, numNodes - 1) }).map((_, i) => {
            const segStart = stagger(i + 1, sec(0.8), sec(0.5)) - sec(0.2);
            const segOpacity = fadeIn(frame, segStart, sec(0.3)) * exitOp;
            // Chevron at midpoint between adjacent node centers (supports
            // proportional spacing when flowSpacing="proportional").
            const cx = (slotCenterX[i] + slotCenterX[i + 1]) / 2;
            const t = numNodes > 1 ? (i + 0.5) / (numNodes - 1) : 0;
            // Chevron preceding the hero stage gets accent color (so the eye
            // tracks toward the inflection, not the trailing chevron).
            const heroIdxChev = data.heroStage ?? numNodes - 1;
            const color = i === heroIdxChev - 1 ? accentColor : theme.text.secondary;
            return (
              <polygon
                key={`chev-${i}`}
                points={`${cx - 8},${172} ${cx + 6},${180} ${cx - 8},${188}`}
                fill={color}
                opacity={(0.65 + 0.35 * t) * segOpacity}
              />
            );
          })}
          {/* Markers — single accent color at each node's slot center, with
              opacity progression telegraphing the lifecycle's "becoming
              formalized" arc. Earlier stages render lighter, later stages
              fully saturated. The terminal stage is hero-sized. */}
          {nodes.map((_node, i) => {
            const isVisible = visibleNodeIndices.includes(i);
            if (!isVisible) return null;
            const nodeStart = stagger(i, sec(0.8), sec(0.5));
            const markerProgress = interpolate(
              frame,
              [nodeStart, nodeStart + sec(0.4)],
              [0, 1],
              CLAMP_QUAD
            );
            const cx = slotCenterX[i];
            const t = numNodes > 1 ? i / (numNodes - 1) : 0;
            // Progression: muted → accent. Use the gradient endpoints' colors
            // so the markers visually align with the spine they sit on.
            const markerOpacity = 0.55 + 0.45 * t;
            // Hero stage: defaults to last stage; can be set to any index
            // via `data.heroStage` for slope flows where the inflection is
            // mid-flow rather than terminal. See framework-diagram.md § 6.4
            const heroIdx = data.heroStage ?? numNodes - 1;
            const isHero = i === heroIdx;
            // Solid marker (no hollow inner circle) — reads as a waypoint on
            // the spine, not a port/socket. Outer halo gives some atmosphere
            // without breaking the dense-mass quality of the marker proper.
            return (
              <g key={`marker-${i}`} opacity={markerProgress * exitOp}>
                <circle
                  cx={cx}
                  cy={180}
                  r={isHero ? markerRadius + 8 : markerRadius + 3}
                  fill={accentColor}
                  opacity={(isHero ? 0.35 : 0.2) * markerOpacity}
                />
                <circle
                  cx={cx}
                  cy={180}
                  r={isHero ? markerRadius + 2 : markerRadius - 2}
                  fill={accentColor}
                  opacity={isHero ? 1 : markerOpacity}
                />
              </g>
            );
          })}
          {/* Arrow labels (verbs) — between marker pairs, ABOVE the spine */}
          {arrowLabels.map((label, i) => {
            if (!label || i >= numNodes - 1) return null;
            const arrowStart = stagger(i, sec(0.8), sec(0.5)) + sec(0.3);
            const arrowOpacity = fadeIn(frame, arrowStart, sec(0.3)) * exitOp;
            const xMid = (slotCenterX[i] + slotCenterX[i + 1]) / 2;
            return (
              <text
                key={`arrow-${i}`}
                x={xMid}
                y={140}
                textAnchor="middle"
                fill={theme.text.muted}
                fontSize={fontSizes.label}
                fontFamily={fonts.body}
                fontStyle="italic"
                opacity={arrowOpacity}
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Stage tiles — ordinal + title + subtitle, one per slot */}
        {nodes.map((node, i) => {
          const isVisible = visibleNodeIndices.includes(i);
          if (!isVisible) return null;
          const nodeStart = stagger(i, sec(0.8), sec(0.5));
          const nodeOpacity = fadeIn(frame, nodeStart, sec(0.4));
          // Hero stage: data.heroStage, or last stage by default. Allows
          // slope-flow framing where the inflection is mid-flow.
          const heroIdxStage = data.heroStage ?? numNodes - 1;
          const isHero = i === heroIdxStage;
          const stageColor = isHero ? accentColor : theme.text.muted;
          const ordinal = String(i + 1).padStart(2, "0");

          return (
            <div
              key={`stage-${i}`}
              style={{
                position: "absolute",
                // Card x = slot center − slotWidth/2 (so card stays centered on
                // its marker regardless of equal vs proportional spacing).
                left: slotCenterX[i] - slotWidth / 2,
                top: 0,
                width: slotWidth,
                height: 360,
                opacity: nodeOpacity * exitOp,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: layout.spacing.md,
                paddingBottom: layout.spacing.md,
                pointerEvents: "none",
              }}
            >
              {/* Ordinal — sits ABOVE the spine, near the top */}
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.label,
                  letterSpacing: letterSpacing.meta,
                  color: stageColor,
                  fontWeight: 600,
                  maxWidth: textMaxWidth.label,
                }}
              >
                {ordinal}
              </div>

              {/* Title + subtitle — below the spine */}
              <div
                style={{
                  textAlign: "center",
                  width: slotWidth - layout.spacing.md * 2,
                  marginTop: 200,
                }}
              >
                <div
                  style={{
                    fontSize: isHero ? fontSizes.h2 : fontSizes.h3,
                    fontWeight: isHero ? 700 : 600,
                    color: isHero ? accentColor : theme.text.primary,
                    fontFamily: fonts.heading,
                    lineHeight: 1.1,
                    maxWidth: textMaxWidth.h2,
                    textShadow: isHero ? `0 0 16px ${accentColor}40` : undefined,
                  }}
                >
                  {node.label}
                </div>
                {node.sublabel && (
                  <div
                    style={{
                      fontSize: fontSizes.label,
                      color: theme.text.secondary,
                      marginTop: layout.spacing.xs,
                      maxWidth: textMaxWidth.label,
                      lineHeight: 1.3,
                      fontFamily: fonts.body,
                    }}
                  >
                    {node.sublabel}
                  </div>
                )}
                {/* Endpoint tag on the hero (terminal) node */}
                {isHero && (
                  <div
                    style={{
                      marginTop: layout.spacing.sm,
                      fontFamily: fonts.mono,
                      fontSize: fontSizes.meta,
                      letterSpacing: letterSpacing.meta,
                      textTransform: "uppercase",
                      color: accentColor,
                      opacity: 0.85,
                      maxWidth: textMaxWidth.label,
                    }}
                  >
                    Endpoint
                  </div>
                )}
              </div>

              {/* Eliminated scenarios beside this slot's outgoing arrow */}
              {(eliminatedByFilter.get(i) || []).map(({ es, idx }, ei) => {
                const esVisible = eliminatedVisible[idx];
                const esColor = es.color || semantic.danger;
                return esVisible ? (
                  <div
                    key={`elim-${ei}`}
                    style={{
                      position: "absolute",
                      top: 220,
                      left: slotWidth + layout.spacing.md,
                      fontSize: fontSizes.meta,
                      maxWidth: textMaxWidth.label,
                      color: esColor,
                      textDecoration: "line-through",
                      opacity: fadeIn(frame, nodeStart + sec(1.2), sec(0.3)),
                    }}
                  >
                    {es.scenario}
                  </div>
                ) : null;
              })}
            </div>
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
  durationInFrames: number;
}> = React.memo(({ data, frame, durationInFrames }) => {
  const theme = useThemeMode(data.backgroundVariant);
  const emphasis = useEpisodeColorEmphasis();
  const rowHeaders = data.rowHeaders || [];
  const colHeaders = data.colHeaders || [];
  const cells = data.cells || [];
  const accentColor = data.accentColor || emphasis.primaryAccent;

  // Editorial 2×2 (or NxM) matrix — fills the chart area, drops card chrome
  // for subtle accent-tinted quadrants, action verb is display-weight hero
  // text (split from "Verb — description" pattern in the cell label), axes
  // drawn as actual lines with directional cues, hero quadrant gets a
  // "FOCUS" tag and accent border. Designed for the Eisenhower-class 2×2
  // typology framework — the matrix IS the entire visualization, so it
  // earns canvas presence rather than living as a small inline diagram.

  const area = useMemo(() => contentArea("content", "generous"), []);

  // Geometry: matrix fills most of the chart area. Y-axis label gutter on
  // the left, column headers above, X-axis label below, row headers in a
  // narrow strip just left of the grid.
  const yAxisGutter = 60;
  const rowHeaderWidth = 200;
  const colHeaderHeight = 56;
  const xAxisGutter = 48;
  const cellGap = layout.spacing.xs;
  const numCols = colHeaders.length;
  const numRows = rowHeaders.length;
  const gridWidth = area.width - yAxisGutter - rowHeaderWidth;
  const gridHeight = area.height - colHeaderHeight - xAxisGutter;
  const cellW = (gridWidth - cellGap * (numCols - 1)) / Math.max(1, numCols);
  const cellH = (gridHeight - cellGap * (numRows - 1)) / Math.max(1, numRows);

  const cellLookup = useMemo(() => {
    const map = new Map<string, typeof cells[number]>();
    for (const cell of cells) {
      map.set(`${cell.row}-${cell.col}`, cell);
    }
    return map;
  }, [cells]);

  // Split "Verb — description" pattern so we can hero the verb and tone
  // down the description. Tolerates labels without an em-dash.
  const splitCellLabel = (label: string): { verb: string; desc?: string } => {
    const m = label.match(/^(.*?)\s*[—–-]\s*(.+)$/);
    if (m) return { verb: m[1].trim(), desc: m[2].trim() };
    return { verb: label };
  };

  const exitOp = exitFade(frame, durationInFrames - 15, 15);
  const fade = fadeIn(frame, sec(0.2), sec(0.5));

  return (
    <div
      style={{
        position: "absolute",
        top: area.top,
        left: area.left,
        width: area.width,
        height: area.height,
      }}
    >
      {/* ── Y-axis label (rotated, left edge) ─────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: colHeaderHeight,
          left: 0,
          width: yAxisGutter,
          height: gridHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: fade * exitOp,
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
            color: theme.text.muted,
            transform: "rotate(-90deg)",
            whiteSpace: "nowrap",
            maxWidth: textMaxWidth.label,
          }}
        >
          ↑ More {rowHeaders[0] || "important"}
        </div>
      </div>

      {/* ── Column headers (above grid, aligned with cell centers) ────── */}
      {colHeaders.map((ch, ci) => (
        <div
          key={`col-${ci}`}
          style={{
            position: "absolute",
            top: 0,
            left: yAxisGutter + rowHeaderWidth + ci * (cellW + cellGap),
            width: cellW,
            height: colHeaderHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: fadeIn(frame, stagger(ci, sec(0.3), sec(0.4)), sec(0.4)) * exitOp,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.label,
              letterSpacing: letterSpacing.meta,
              textTransform: "uppercase",
              color: theme.text.primary,
              fontWeight: 600,
              maxWidth: textMaxWidth.label,
            }}
          >
            {ch}
          </div>
        </div>
      ))}

      {/* ── Row headers (left of each row) ────────────────────────────── */}
      {rowHeaders.map((rh, ri) => (
        <div
          key={`row-${ri}`}
          style={{
            position: "absolute",
            top: colHeaderHeight + ri * (cellH + cellGap),
            left: yAxisGutter,
            width: rowHeaderWidth,
            height: cellH,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: layout.spacing.md,
            opacity: fadeIn(frame, stagger(ri, sec(0.3), sec(0.4)), sec(0.4)) * exitOp,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.label,
              letterSpacing: letterSpacing.meta,
              textTransform: "uppercase",
              color: theme.text.primary,
              fontWeight: 600,
              textAlign: "right",
              lineHeight: 1.2,
              maxWidth: textMaxWidth.label,
              ...textSafe.wrap,
            }}
          >
            {rh}
          </div>
        </div>
      ))}

      {/* ── Cells (the actual matrix) ─────────────────────────────────── */}
      {rowHeaders.map((_, ri) =>
        colHeaders.map((_, ci) => {
          const cell = cellLookup.get(`${ri}-${ci}`);
          const cellStart = stagger(
            ri * numCols + ci,
            sec(0.18),
            sec(0.6)
          );
          const cellOpacity = fadeIn(frame, cellStart, sec(0.4));
          const cellColor = cell?.color || theme.text.muted;
          const isHero = cell?.highlight === true;
          const heroColor = isHero ? accentColor : cellColor;
          const quadrantNumber = `Q${ri * numCols + ci + 1}`;
          const { verb, desc } = splitCellLabel(cell?.label || "");

          return (
            <div
              key={`cell-${ri}-${ci}`}
              style={{
                position: "absolute",
                top: colHeaderHeight + ri * (cellH + cellGap),
                left: yAxisGutter + rowHeaderWidth + ci * (cellW + cellGap),
                width: cellW,
                height: cellH,
                opacity: cellOpacity * exitOp,
              }}
            >
              {/* Cell background — subtle accent tint, no card chrome.
                  Hero cell gets a stronger fill + accent border to mark
                  it as the protagonist quadrant. */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `${heroColor}${isHero ? "1A" : "0C"}`,
                  borderLeft: `${isHero ? 4 : 2}px solid ${heroColor}${isHero ? "" : "55"}`,
                  borderRadius: 2,
                }}
              />

              {/* Quadrant tag (top-left) — mono caps marker */}
              <div
                style={{
                  position: "absolute",
                  top: layout.spacing.md,
                  left: layout.spacing.md + (isHero ? 4 : 2),
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.meta,
                  letterSpacing: letterSpacing.meta,
                  color: heroColor,
                  fontWeight: 700,
                  maxWidth: textMaxWidth.label,
                }}
              >
                {quadrantNumber}
                {isHero && (
                  <span
                    style={{
                      marginLeft: layout.spacing.sm,
                      paddingLeft: layout.spacing.sm,
                      borderLeft: `1px solid ${heroColor}66`,
                      color: heroColor,
                    }}
                  >
                    Focus
                  </span>
                )}
              </div>

              {/* Hero text block (centered) */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: layout.spacing.xl,
                  textAlign: "center",
                }}
              >
                {/* Action verb — display weight hero */}
                <div
                  style={{
                    fontSize: isHero ? fontSizes.h1 : fontSizes.h2,
                    fontWeight: 700,
                    color: isHero ? accentColor : theme.text.primary,
                    fontFamily: fonts.heading,
                    lineHeight: 1.05,
                    maxWidth: textMaxWidth.h2,
                    textShadow: isHero ? `0 0 16px ${accentColor}40` : undefined,
                  }}
                >
                  {verb}
                </div>
                {desc && (
                  <div
                    style={{
                      marginTop: layout.spacing.sm,
                      fontSize: fontSizes.body,
                      color: theme.text.secondary,
                      fontFamily: fonts.body,
                      fontStyle: "italic",
                      lineHeight: 1.3,
                      maxWidth: textMaxWidth.body,
                    }}
                  >
                    {desc}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* ── X-axis label (below grid) ─────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: colHeaderHeight + gridHeight,
          left: yAxisGutter + rowHeaderWidth,
          width: gridWidth,
          height: xAxisGutter,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: fade * exitOp,
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
          ← More {colHeaders[0] || "urgent"}
        </div>
      </div>

      {/* ── Empirical items overlay (scatter plot in quadrant space).
          When `data.items` is set, plot named points at their (x, y)
          coordinates over the matrix grid + draw origin crosshair ticks.
          The matrix cells remain visible as quadrant titles; items show
          *where actors actually sit*. See:
          references/template-research/framework-diagram.md § 6.2 */}
      {data.items && data.items.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: colHeaderHeight,
            left: yAxisGutter + rowHeaderWidth,
            width: gridWidth,
            height: gridHeight,
            pointerEvents: "none",
          }}
        >
          {/* Origin crosshair — vertical + horizontal axis at midpoints */}
          <div
            style={{
              position: "absolute",
              top: gridHeight / 2 - 0.5,
              left: 0,
              width: gridWidth,
              height: 1,
              background: theme.text.muted,
              opacity: 0.35 * fade * exitOp,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: gridWidth / 2 - 0.5,
              top: 0,
              width: 1,
              height: gridHeight,
              background: theme.text.muted,
              opacity: 0.35 * fade * exitOp,
            }}
          />

          {/* Items — staggered fade-in with weight-scaled markers */}
          {data.items.map((item, i) => {
            const itemStart = sec(0.8) + i * sec(0.12);
            const itemOpacity = fadeIn(frame, itemStart, sec(0.5)) * exitOp;
            const weight = item.weight ?? 1;
            const dotRadius = 8 * weight;
            const itemColor = item.color || accentColor;
            const cx = item.x * gridWidth;
            // Invert y — visual top = high y in data (1.0).
            const cy = (1 - item.y) * gridHeight;
            return (
              <div key={`item-${i}`}>
                {/* Marker */}
                <div
                  style={{
                    position: "absolute",
                    left: cx - dotRadius,
                    top: cy - dotRadius,
                    width: dotRadius * 2,
                    height: dotRadius * 2,
                    borderRadius: "50%",
                    background: itemColor,
                    opacity: itemOpacity,
                    boxShadow: weight > 1
                      ? `0 0 16px ${itemColor}50, 0 2px 6px rgba(0,0,0,0.25)`
                      : `0 2px 4px rgba(0,0,0,0.18)`,
                  }}
                />
                {/* Label — to the right of marker, vertical-center aligned */}
                <div
                  style={{
                    position: "absolute",
                    left: cx + dotRadius + 6,
                    top: cy - fontSizes.body / 2,
                    fontSize: weight > 1 ? fontSizes.label + 2 : fontSizes.body,
                    fontFamily: fonts.body,
                    fontWeight: weight > 1 ? 600 : 500,
                    color: theme.text.primary,
                    opacity: itemOpacity,
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                    textShadow: shadows.textLift,
                    maxWidth: textMaxWidth.label,
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

// ── Main component ──────────────────────────────────────────────────────────

export const FrameworkDiagram: React.FC<{ data: FrameworkDiagramData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant || "light";
  const theme = useThemeMode(bgVariant);
  // Per-episode color emphasis — pulls primaryAccent for column accents and
  // highlight glow. See remotion-templates/BRAND.md → "Per-Episode Color Emphasis".
  const emphasis = useEpisodeColorEmphasis();

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
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
          syncPoints={direction.syncPoints}
        />

        {/* Diagram content */}
        {data.variant === "comparison" && (
          <ComparisonVariant data={data} frame={frame} />
        )}
        {data.variant === "flow" && (
          <FlowVariant data={data} frame={frame} />
        )}
        {data.variant === "matrix" && (
          <MatrixVariant data={data} frame={frame} durationInFrames={durationInFrames} />
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

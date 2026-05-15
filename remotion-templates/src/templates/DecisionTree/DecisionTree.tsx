/**
 * DecisionTree — branching scenario visualization with cinematic camera.
 *
 * Instead of cramming all nodes into a static viewport, the tree is rendered
 * at full internal scale and a virtual camera zooms/pans between nodes.
 * The camera path is data-driven via cameraPath[] in JSON.
 *
 * Camera sequence (auto-generated if cameraPath omitted):
 *   1. ESTABLISH — zoom 2.2× on root node. Title overlaid. "One question."
 *   2. BRANCH — zoom out to 1.4×. Children slide in. Fork visible.
 *   3. PATH A — pan + zoom 1.6× to first leaf. Others dim to 0.25 opacity.
 *   4. PATH B — pan to second leaf. Previous path dims.
 *   5. PULLBACK — zoom to 1.0×. Full tree visible. Highlighted path glows.
 *
 * Visual effects:
 *   - Depth-of-field dimming: unfocused branches fade to 0.25 opacity
 *   - Focused node scale-up: 1.0 → 1.08 with spring settle to 1.04
 *   - Edge glow along highlighted path
 *   - Smooth camera transitions with easeInOutCubic (200ms offset pan/zoom)
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
  fonts,
  fontSizes,
  fontWeights,
  layout,
  sec,
  radii,
  shadows,
  textMaxWidth,
  titleHeight,
} from "../../design/theme";
import {
  fadeIn,
  exitFade,
  slideIn,
  anticipatoryStartFrame,
  CLAMP_CUBIC,
} from "../../utils/animation";
import { smoothStepEdge } from "../../utils/edges";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { TitleBlock } from "../../components/TitleBlock";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { warnIf } from "../../utils/dataWarnings";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection, type DirectionSyncPoint } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  useTreeCamera,
  generateDefaultCameraPath,
  buildParentMap,
} from "../../hooks/useTreeCamera";
import type { DecisionTreeData, TreeNode } from "./types";

// ── Constants ──────────────────────────────────────────────────────────────

// Tighter node cards (220×88, golden-ratio-ish) — feels editorial vs billboard
const NODE_WIDTH = 220;
const NODE_HEIGHT = 88;
const LEVEL_GAP = 200;
const NODE_GAP = layout.spacing.xl * 2;

// ── Positioning ────────────────────────────────────────────────────────────

interface NodePosition {
  x: number;
  y: number;
  level: number;
}

/**
 * Compute tree layout — nodes positioned for the full canvas.
 * The camera handles which part is visible; layout uses full space.
 */
function computeTreeLayout(
  nodes: TreeNode[],
  rootId: string,
  canvasWidth: number,
  canvasHeight: number,
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const levels: Map<number, string[]> = new Map();
  const visited = new Set<string>();

  const buildLevels = (nodeId: string, level: number) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    if (!levels.has(level)) levels.set(level, []);
    levels.get(level)!.push(nodeId);
    const node = nodeMap.get(nodeId);
    if (node?.children) {
      for (const childId of node.children) buildLevels(childId, level + 1);
    }
  };
  buildLevels(rootId, 0);

  // Center tree vertically in canvas
  const numLevels = levels.size;
  const totalTreeHeight = (numLevels - 1) * LEVEL_GAP + NODE_HEIGHT;
  const topY = Math.max(
    layout.spacing.xl * 3, // Leave space for title
    (canvasHeight - totalTreeHeight) / 2
  );

  for (const [level, nodeIds] of levels) {
    const y = topY + level * LEVEL_GAP;
    const numSiblings = nodeIds.length;
    const totalWidth = numSiblings * NODE_WIDTH + (numSiblings - 1) * NODE_GAP;
    const startX = (canvasWidth - totalWidth) / 2;

    for (let i = 0; i < nodeIds.length; i++) {
      const x = startX + i * (NODE_WIDTH + NODE_GAP);
      positions.set(nodeIds[i], { x, y, level });
    }
  }

  return positions;
}

/**
 * Bezier edge path — smooth S-curve from parent bottom to child top.
 * Delegates to shared smoothStepEdge utility for consistency across diagrams.
 */
function edgePath(
  parentPos: NodePosition,
  childPos: NodePosition,
): string {
  const x1 = parentPos.x + NODE_WIDTH / 2;
  const y1 = parentPos.y + NODE_HEIGHT;
  const x2 = childPos.x + NODE_WIDTH / 2;
  const y2 = childPos.y;
  return smoothStepEdge(x1, y1, x2, y2, 0.5);
}

// ── TreeNode Component ─────────────────────────────────────────────────────
//
// May 13, 2026 polish refactor: dropped card chrome (rounded rectangle +
// inset fill + drop shadow + accent glow) in favor of typography-only nodes
// per NYT 512-Paths and FT scenario-tree canon. Card chrome reads as
// dashboard UX (Notion/Linear/Figma); editorial decision trees render nodes
// as text on the surface, with emphasis carried by a thin accent rule under
// the active node. Probability and edge-label rendering moved OUT of this
// component and ONTO the edges in the main SVG layer — extensive-form
// canon places transition labels on edges, state labels on nodes. See
// research memo at references/template-research/decision-tree.md.

const TreeNodeComponent: React.FC<{
  node: TreeNode;
  position: NodePosition;
  frame: number;
  startFrame: number;
  totalFrames: number;
  mode: "light" | "dark";
  /** Dimming from camera (0 = visible, 0.75 = dimmed) */
  dimAmount: number;
  /** Scale multiplier from camera focus */
  focusScale: number;
  /** Per-episode accent for active-node underline. */
  highlightColor: string;
}> = React.memo(({
  node,
  position,
  frame,
  startFrame,
  totalFrames,
  mode,
  dimAmount,
  focusScale,
  highlightColor,
}) => {
  const theme = useThemeMode(mode);
  const nodeOpacity = fadeIn(frame, startFrame, sec(0.5));
  const nodeScale = interpolate(
    frame,
    [startFrame, startFrame + sec(0.5)],
    [0.92, 1],
    CLAMP_CUBIC
  );
  const exitOp = exitFade(frame, totalFrames, sec(0.5));

  const isHighlighted = node.highlighted ?? false;
  const isActive = node.active ?? false;
  // Underline draw-in animation for the active "you are here" node.
  const underlineProgress = interpolate(
    frame,
    [startFrame + sec(0.3), startFrame + sec(0.9)],
    [0, 1],
    CLAMP_CUBIC,
  );

  // Effective opacity: base animation × exit × inverse dim
  const effectiveOpacity = nodeOpacity * exitOp * (1 - dimAmount);

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        opacity: effectiveOpacity,
        transform: `scale(${nodeScale * focusScale})`,
        transformOrigin: "center",
        transition: "opacity 0.3s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: fontSizes.body,
          maxWidth: textMaxWidth.node,
          fontFamily: fonts.display,
          // Active gets semibold display weight; highlighted (on path) gets
          // medium weight; off-path nodes stay regular. Hierarchy via weight,
          // not color or chrome — the NYT/FT editorial idiom.
          fontWeight: isActive
            ? fontWeights.semibold
            : isHighlighted
              ? fontWeights.medium
              : fontWeights.regular,
          lineHeight: 1.3,
          textAlign: "center",
          color: theme.text.primary,
          padding: `0 ${layout.spacing.sm}px`,
        }}
      >
        {node.label}
      </div>

      {/* Active-node accent rule — replaces the prior accent-glow boxShadow.
          A 2px underline in the highlight color, draw-in animation. This is
          the single visual signal that says "you are here," and it carries
          the entire emphasis hierarchy at the node level. */}
      {isActive && (
        <div
          style={{
            marginTop: layout.spacing.xs,
            height: 2,
            width: 64,
            background: highlightColor,
            transform: `scaleX(${underlineProgress})`,
            transformOrigin: "center",
            opacity: underlineProgress,
          }}
        />
      )}

      {/* Market price chip (below node) — Kalshi-style, kept for the
          forecasting use case. Same mono register, no surface fill, just
          a thin top rule so it reads as metadata rather than a button. */}
      {node.marketPrice && (
        <div
          style={{
            marginTop: layout.spacing.xs,
            paddingTop: 4,
            borderTop: `1px solid ${palette.amber}55`,
            fontSize: fontSizes.caption,
            fontFamily: fonts.mono,
            fontWeight: fontWeights.medium,
            color: palette.amber,
            whiteSpace: "nowrap",
          }}
        >
          ${node.marketPrice}
        </div>
      )}
    </div>
  );
});

// ── Decision-ladder variant (Allison-style options list) ───────────────────
//
// May 13, 2026 polish refactor — committed to Allison's actual book layout:
// a FLAT stack of option panels, one per option the decision-maker weighed,
// with consequence/gloss prose rendered INSIDE the panel as a single
// paragraph. The previous implementation supported arbitrary nesting via
// recursion — dead weight, since (a) no episode in the queue uses deeper
// nesting and (b) Allison's *Essence of Decision* itself doesn't nest:
// each option is a single panel with descriptive prose. RAND escalation
// studies and FP/Economist option-tables follow the same form.
//
// If a node has children in the data, we render the FIRST child's `label`
// as the option's prose gloss inside the panel (Allison treats this as the
// "consequence statement"). Additional children are ignored at this
// register — if a script needs branching consequences, it should use the
// `extensive` variant instead.
//
// Reference: references/template-research/decision-tree.md § 3 item 10;
// game-theory.md § A2.

const LadderVariant: React.FC<{
  data: DecisionTreeData;
  frame: number;
  totalFrames: number;
  syncPoints?: DirectionSyncPoint[];
  firstRevealBase?: number;
}> = React.memo(({ data, frame, totalFrames, syncPoints, firstRevealBase }) => {
  const mode = (data.backgroundVariant || "light") as "light" | "dark";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();
  const highlightColor = data.highlightColor || emphasis.primaryAccent;
  const nodeMap = useMemo(
    () => new Map(data.nodes.map((n) => [n.id, n])),
    [data.nodes],
  );
  const root = nodeMap.get(data.rootId);
  if (!root) return null;
  const optionIds = root.children ?? [];
  const optionCount = optionIds.length;

  const renderOption = (optionId: string, idx: number): React.ReactNode => {
    const option = nodeMap.get(optionId);
    if (!option) return null;

    const isHighlighted =
      option.highlighted || data.highlightedPath?.includes(optionId);
    const accent = isHighlighted ? highlightColor : theme.text.muted;

    // Collect prose gloss(es) — every direct child's label rendered as a
    // sentence inside the panel. Allison's canon: one short prose
    // paragraph per option, naming the consequence. Multiple children
    // become multiple sentences in the same paragraph.
    const glossParts = (option.children ?? [])
      .map((cid) => nodeMap.get(cid)?.label)
      .filter((s): s is string => Boolean(s));
    const gloss = glossParts.join(" ");

    // Stagger reveal across options. D17: first option uses anticipatory base
    // when syncPoints[0] is defined; subsequent options stagger from there.
    const baseReveal = firstRevealBase ?? sec(0.4);
    const revealStart = baseReveal + idx * sec(0.22);
    const opacity = fadeIn(frame, revealStart, sec(0.55));
    const slide = slideIn(frame, revealStart, 14, sec(0.55));

    return (
      <div
        key={optionId}
        style={{
          opacity,
          transform: `translateY(${slide}px)`,
          marginTop: idx === 0 ? 0 : layout.spacing.md,
          padding: `${layout.spacing.sm}px ${layout.spacing.lg}px`,
          // Highlighted option gets a 2.5px accent border + tinted fill;
          // unchosen options get a 1px muted hairline + transparent fill.
          // Weight + saturation carry the hierarchy — not brightness.
          border: `${isHighlighted ? 2.5 : 1}px solid ${isHighlighted ? accent : `${theme.text.muted}55`}`,
          borderRadius: radii.sm,
          background: isHighlighted
            ? `${accent}10`
            : "transparent",
          display: "flex",
          gap: layout.spacing.lg,
          alignItems: "baseline",
        }}
      >
        {/* Ordinal marker — quiet kicker, regular weight, muted color.
            Reduced from semibold uppercase letterSpacing-2 (which competed
            with the option title) to regular weight letterSpacing-1.5,
            sized down. May 13, 2026 polish pass. */}
        <div
          style={{
            fontSize: fontSizes.caption,
            fontFamily: fonts.metadata,
            color: theme.text.muted,
            letterSpacing: 1.5,
            fontWeight: fontWeights.regular,
            whiteSpace: "nowrap",
            flexShrink: 0,
            minWidth: 52,
            opacity: 0.65,
          }}
        >
          {String(idx + 1).padStart(2, "0")} / {String(optionCount).padStart(2, "0")}
        </div>

        {/* Option title + prose gloss */}
        <div style={{ flex: 1, maxWidth: textMaxWidth.body }}>
          <div
            style={{
              fontSize: fontSizes.body,
              fontFamily: fonts.display,
              fontWeight: isHighlighted ? fontWeights.semibold : fontWeights.medium,
              color: isHighlighted ? accent : theme.text.primary,
              lineHeight: 1.3,
            }}
          >
            {option.label}
          </div>
          {gloss && (
            <div
              style={{
                fontSize: fontSizes.caption,
                fontFamily: fonts.body,
                fontWeight: fontWeights.regular,
                color: theme.text.secondary,
                marginTop: 4,
                lineHeight: 1.45,
              }}
            >
              {gloss}
            </div>
          )}
          {/* Probability — gated for numeric %, renders as mono kicker below
              the gloss. */}
          {option.probability &&
            (data.probabilityWeights || !/\d+\s*%/.test(option.probability)) && (
              <div
                style={{
                  fontSize: fontSizes.caption,
                  fontFamily: fonts.mono,
                  color: theme.text.muted,
                  marginTop: 4,
                  letterSpacing: 1.2,
                }}
              >
                {option.probability}
              </div>
            )}
        </div>
      </div>
    );
  };

  const exitOp = exitFade(frame, totalFrames, sec(0.5));
  const safe = layout.safeAreaTier.generous;

  return (
    <>
      <TitleBlock
        title={data.title}
        subtitle={data.subtitle}
        mode={mode}
        safeAreaTier="generous"
        syncPoints={syncPoints}
      />
      <div
        style={{
          position: "absolute",
          top: safe.top + titleHeight.content + layout.spacing.lg,
          left: safe.left,
          right: safe.right,
          bottom: safe.bottom,
          opacity: exitOp,
          overflow: "hidden",
          maxWidth: textMaxWidth.body * 1.6,
        }}
      >
        {optionIds.map((optionId, idx) => renderOption(optionId, idx))}
      </div>

      {/* Source attribution — was previously rendered only in the extensive
          variant return path, leaving the ladder variant without visible
          citation. Allison-class ladders particularly need the source
          visible. May 13, 2026 polish pass. */}
      {data.source && (
        <div
          style={{
            position: "absolute",
            bottom: safe.bottom,
            left: safe.left,
            fontSize: fontSizes.caption,
            color: theme.text.muted,
            opacity: fadeIn(frame, 0, sec(1)) * exitOp,
            transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
          }}
        >
          {data.source}
        </div>
      )}
    </>
  );
});

// ── Main Component ─────────────────────────────────────────────────────────

export const DecisionTree: React.FC<{ data: DecisionTreeData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation({ noExit: true, ...direction.driftOptions });
  // Pace-aware scaling for tree reveal cadence (per-level + within-level
  // stagger gaps + initial timing offsets).
  const t = direction.paceTimingScale;
  const s = direction.paceStaggerScale;
  // D17 anticipatory reveal: first node/option settled when narrator names it.
  const firstSyncFrameDT = direction.syncPoints?.[0]?.frame;
  const nodeRevealBase = firstSyncFrameDT != null
    ? anticipatoryStartFrame(firstSyncFrameDT, sec(0.5))
    : sec(0.5 * t); // existing default
  // Per-episode color emphasis — highlightColor (used for path highlights
  // and active-node accent) falls back to episode primary accent.
  const emphasis = useEpisodeColorEmphasis();
  const { durationInFrames: totalFrames } = useVideoConfig();
  const theme = useThemeMode(data.backgroundVariant || "light");
  const backgroundVariant = data.backgroundVariant || "light";

  warnIf(
    !data.nodes.find((n) => n.id === data.rootId),
    "DecisionTree",
    `rootId "${data.rootId}" not found in nodes array — tree will be empty`,
  );
  warnIf(
    data.nodes.length > 12,
    "DecisionTree",
    `${data.nodes.length} nodes — above 12 the camera cannot establish and detail individual nodes legibly in a single composition; consider splitting into sub-trees`,
  );

  // ── Ladder variant early return — Allison-style nested rectangles ──────
  // Right for ExComm-class deliberation scenes. See LadderVariant component
  // and references/template-research/game-theory.md § A2.
  if (data.variant === "ladder") {
    return (
      <Background
        variant={resolveAnalyticalBackgroundVariant(
          analyticalBackgroundBase(backgroundVariant),
          transparentBackdropRequested(data),
        )}
        atmosphere={direction.atmosphere}
        atmosphereIntensity={direction.atmosphereIntensity}
        tint={direction.backgroundTint}
      >
        <AbsoluteFill style={compStyle}>
          <HeaderStrip mode={backgroundVariant} metadata={data.episode} />
          <FooterStrip mode={backgroundVariant} />
          <LadderVariant data={data} frame={frame} totalFrames={totalFrames} syncPoints={direction.syncPoints} firstRevealBase={nodeRevealBase} />
        </AbsoluteFill>
      </Background>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────
  const positions = useMemo(
    () => computeTreeLayout(data.nodes, data.rootId, layout.width, layout.height),
    [data.nodes, data.rootId]
  );

  // ── Parent map for path-based dimming ─────────────────────────────────
  const parentMap = useMemo(() => buildParentMap(data.nodes), [data.nodes]);

  // ── Camera path (use provided or auto-generate) ───────────────────────
  const cameraPath = useMemo(() => {
    if (data.cameraPath && data.cameraPath.length > 0) {
      return data.cameraPath;
    }
    return generateDefaultCameraPath(
      data.rootId,
      data.nodes,
      data.durationSec || 12,
      data.highlightedPath,
    );
  }, [data.cameraPath, data.rootId, data.nodes, data.durationSec, data.highlightedPath]);

  // ── Virtual camera ────────────────────────────────────────────────────
  const camera = useTreeCamera({
    positions: positions as Map<string, { x: number; y: number }>,
    cameraPath,
    canvasWidth: layout.width,
    canvasHeight: layout.height,
    nodeWidth: NODE_WIDTH,
    nodeHeight: NODE_HEIGHT,
    parentMap,
    transitionSec: 0.6,
  });

  // ── Edge list ─────────────────────────────────────────────────────────
  // Each edge carries the mid-segment coordinates of its rendered path so
  // we can place edge labels (and the probability label) right on the edge,
  // NYT/FT canon. Mid-point of a smoothStep cubic at t=0.5 lands on the
  // x-axis midpoint between parent + child columns; that's where the
  // editorial label sits. May 13, 2026 polish refactor.
  const edges = useMemo(() => {
    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));
    const result: Array<{
      parentId: string;
      childId: string;
      pathData: string;
      isHighlighted: boolean;
      midX: number;
      midY: number;
      /** Combined edge label: edgeLabel ?? probability (only one renders). */
      label?: string;
      /** Whether `label` came from `node.probability` (so probabilityWeights
       *  gate applies). */
      labelFromProbability: boolean;
    }> = [];
    const highlighted = new Set(data.highlightedPath || []);

    for (const node of data.nodes) {
      if (!node.children) continue;
      const parentPos = positions.get(node.id);
      if (!parentPos) continue;

      for (const childId of node.children) {
        const childPos = positions.get(childId);
        if (!childPos) continue;
        const child = nodeMap.get(childId);

        // Mid-segment label coordinates (between parent bottom + child top,
        // centered horizontally). On a smooth-step cubic this is also where
        // the curve is roughly horizontal, so non-rotated text reads cleanly.
        const midX =
          (parentPos.x + childPos.x) / 2 + NODE_WIDTH / 2;
        const midY =
          (parentPos.y + NODE_HEIGHT + childPos.y) / 2;

        const edgeLabel = child?.edgeLabel;
        const probability = child?.probability;
        const label = edgeLabel ?? probability;

        result.push({
          parentId: node.id,
          childId,
          pathData: edgePath(parentPos, childPos),
          isHighlighted: highlighted.has(node.id) && highlighted.has(childId),
          midX,
          midY,
          label,
          labelFromProbability: !edgeLabel && Boolean(probability),
        });
      }
    }
    return result;
  }, [data.nodes, positions, data.highlightedPath]);

  const highlightColor = data.highlightColor || emphasis.primaryAccent;

  // ── Title animation ───────────────────────────────────────────────────
  const titleOpacity = fadeIn(frame, 0, sec(0.8 * t));
  const titleSlide = slideIn(frame, 0, 20, sec(0.6 * t));
  const titleExitOp = exitFade(frame, totalFrames, sec(0.5));

  // ── Camera step label ─────────────────────────────────────────────────
  const labelOpacity = camera.currentLabel
    ? fadeIn(frame, sec(0.3), sec(0.4))
    : 0;

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(backgroundVariant),
        transparentBackdropRequested(data),
      )}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={compStyle}>
        {/* Brand strips */}
        <HeaderStrip mode={backgroundVariant} metadata={data.episode} />
        <FooterStrip mode={backgroundVariant} />

        {/* ── Camera viewport ── */}
        <div style={camera.viewportStyle}>
          <div style={camera.contentStyle}>

            {/* SVG edge layer (behind nodes).
                May 13, 2026 polish refactor — NYT/FT/Economist canon:
                  • Solid strokes for all edges. Dashes are reserved for
                    explicitly hypothetical / counterfactual edges (a future
                    `edge.speculative` flag if needed); using dashes for the
                    chosen path inverts the convention (dashed = "didn't
                    happen") which was the single most-wrong-register
                    choice in the prior implementation.
                  • Emphasis is via WEIGHT (chosen 2.5px / unchosen 1.25px)
                    and SATURATION (chosen ink/oxblood / unchosen muted at
                    30%), not BRIGHTNESS or GLOW. Glow filter dropped — it
                    read as motion-graphics / video-game, not editorial.
                  • Edge labels (qualitative branch character, e.g. "Sharp"
                    / "Mainline") render as SVG <text> mid-segment in the
                    metadata mono register with a paper-color halo for
                    legibility — extensive-form canon places transition
                    labels on edges, not nodes.
                See: references/template-research/decision-tree.md § 1. */}
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
              {/* Non-highlighted edges. */}
              {edges
                .filter((e) => !e.isHighlighted)
                .map((edge, i) => {
                  const childLevel = positions.get(edge.childId)?.level ?? 0;
                  const startFrame = sec(0.6 * t) + childLevel * sec(0.4 * s);
                  const edgeOpacity = fadeIn(frame, startFrame, sec(0.5));
                  const parentDim = camera.getNodeDim(edge.parentId);
                  const childDim = camera.getNodeDim(edge.childId);
                  const edgeDim = Math.max(parentDim, childDim);
                  const someHighlighted = (data.highlightedPath?.length ?? 0) > 0;
                  // Unchosen edges recede via opacity + weight. The 30% mute
                  // factor + 1.25px stroke is the FT scenario-tree default.
                  const muteFactor = someHighlighted ? 0.3 : 0.7;
                  const strokeWidth = someHighlighted ? 1.25 : 1.75;

                  return (
                    <path
                      key={`edge-${i}`}
                      d={edge.pathData}
                      stroke={theme.text.muted}
                      strokeWidth={strokeWidth}
                      fill="none"
                      opacity={edgeOpacity * (1 - edgeDim) * muteFactor * exitFade(frame, totalFrames, sec(0.5))}
                    />
                  );
                })}

              {/* Highlighted (chosen-path) edges — solid, full weight, no glow. */}
              {edges
                .filter((e) => e.isHighlighted)
                .map((edge, i) => {
                  const childLevel = positions.get(edge.childId)?.level ?? 0;
                  const startFrame = sec(1) + childLevel * sec(0.4) + sec(0.5);
                  const edgeOpacity = fadeIn(frame, startFrame, sec(0.6));
                  const parentDim = camera.getNodeDim(edge.parentId);
                  const childDim = camera.getNodeDim(edge.childId);
                  const edgeDim = Math.max(parentDim, childDim);
                  return (
                    <path
                      key={`edge-hl-${i}`}
                      d={edge.pathData}
                      stroke={highlightColor}
                      strokeWidth={2.5}
                      fill="none"
                      strokeLinecap="round"
                      opacity={edgeOpacity * (1 - edgeDim) * exitFade(frame, totalFrames, sec(0.5))}
                    />
                  );
                })}

              {/* Edge labels — mid-segment, mono register, paper-color halo
                  for legibility against any edge color. The double-rendered
                  text (halo stroke under fill) is the standard SVG halo
                  trick — no per-character text-shadow needed. */}
              {edges.map((edge, i) => {
                if (!edge.label) return null;
                // Apply probability gate when label was sourced from
                // node.probability (numeric % suppressed unless opted in).
                const isNumericPct = /\d+\s*%/.test(edge.label);
                if (
                  edge.labelFromProbability &&
                  isNumericPct &&
                  !data.probabilityWeights
                ) {
                  return null;
                }

                const childLevel = positions.get(edge.childId)?.level ?? 0;
                const startFrame = sec(0.8 * t) + childLevel * sec(0.4 * s);
                const labelOp = fadeIn(frame, startFrame, sec(0.5));
                const parentDim = camera.getNodeDim(edge.parentId);
                const childDim = camera.getNodeDim(edge.childId);
                const edgeDim = Math.max(parentDim, childDim);
                const someHighlighted = (data.highlightedPath?.length ?? 0) > 0;
                const muteFactor = !edge.isHighlighted && someHighlighted ? 0.4 : 1.0;
                const fillColor = edge.isHighlighted
                  ? highlightColor
                  : theme.text.muted;

                return (
                  <g
                    key={`edge-lbl-${i}`}
                    opacity={labelOp * (1 - edgeDim) * muteFactor * exitFade(frame, totalFrames, sec(0.5))}
                  >
                    {/* Halo (paper-color stroke) */}
                    <text
                      x={edge.midX}
                      y={edge.midY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      stroke={theme.bg.base}
                      strokeWidth={6}
                      strokeLinejoin="round"
                      fontFamily={fonts.mono}
                      fontSize={fontSizes.caption}
                      letterSpacing={1.2}
                    >
                      {edge.label}
                    </text>
                    {/* Fill */}
                    <text
                      x={edge.midX}
                      y={edge.midY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={fillColor}
                      fontFamily={fonts.mono}
                      fontSize={fontSizes.caption}
                      fontWeight={edge.isHighlighted ? fontWeights.medium : fontWeights.regular}
                      letterSpacing={1.2}
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Node layer */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
              {data.nodes.map((node) => {
                const pos = positions.get(node.id);
                if (!pos) return null;

                const level = pos.level;
                const levelNodes = data.nodes.filter(
                  (n) => positions.get(n.id)?.level === level
                );
                const indexInLevel = levelNodes.findIndex((n) => n.id === node.id);
                const startFrame = nodeRevealBase + level * sec(0.4 * s) + indexInLevel * sec(0.1 * s);

                // Chosen-path hierarchy: when a highlightedPath is set, recede
                // off-path nodes to 0.5 dim alongside their dimmed edges so the
                // chosen branch reads as the editorial protagonist. The path
                // nodes still get camera-driven dim if focused elsewhere.
                const someHighlighted = (data.highlightedPath?.length ?? 0) > 0;
                const onPath = someHighlighted && data.highlightedPath!.includes(node.id);
                const pathDim = someHighlighted && !onPath ? 0.5 : 0;
                const dimAmount = Math.max(camera.getNodeDim(node.id), pathDim);

                return (
                  <TreeNodeComponent
                    key={node.id}
                    node={node}
                    position={pos}
                    frame={frame}
                    startFrame={startFrame}
                    totalFrames={totalFrames}
                    mode={backgroundVariant as "light" | "dark"}
                    dimAmount={dimAmount}
                    focusScale={camera.getNodeScale(node.id)}
                    highlightColor={highlightColor}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Title overlay (above camera viewport, fixed position) ── */}
        <div
          style={{
            opacity: titleOpacity * titleExitOp,
            transform: `translateY(${titleSlide}px)`,
          }}
        >
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={backgroundVariant}
            safeAreaTier="generous"
            noAnimation
            syncPoints={direction.syncPoints}
          />
        </div>

        {/* ── Camera step label (contextual overlay) ── */}
        {camera.currentLabel && (
          <div
            style={{
              position: "absolute",
              bottom: layout.safeAreaTier.generous.bottom + layout.spacing.xxxl,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: fontSizes.h3,
              maxWidth: textMaxWidth.h3,
              fontWeight: fontWeights.semibold,
              color: theme.text.primary,
              fontFamily: fonts.display,
              textShadow: shadows.subtleStrong,
              opacity: labelOpacity * exitFade(frame, totalFrames, sec(0.5)),
              letterSpacing: 1,
            }}
          >
            {camera.currentLabel}
          </div>
        )}

        {/* ── Source attribution ── */}
        {data.source && (
          <div
            style={{
              position: "absolute",
              bottom: layout.safeAreaTier.generous.bottom,
              left: layout.safeAreaTier.generous.left,
              fontSize: fontSizes.caption,
              color: theme.text.muted,
              opacity: fadeIn(frame, 0, sec(1)) * exitFade(frame, totalFrames, sec(0.5)),
              transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
            }}
          >
            {data.source}
          </div>
        )}

        {/* ── Episode label ── */}
        <div
          style={{
            position: "absolute",
            bottom: layout.safeAreaTier.generous.bottom,
            right: layout.safeAreaTier.generous.right,
            fontSize: fontSizes.label,
            color: theme.text.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontFamily: fonts.mono,
            opacity: fadeIn(frame, 0, sec(1)) * exitFade(frame, totalFrames, sec(0.5)),
            transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
          }}
        >
          {data.episode}
        </div>

      </AbsoluteFill>
    </Background>
  );
};

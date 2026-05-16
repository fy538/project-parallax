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

// ── Probability helpers (I6) ───────────────────────────────────────────────

/**
 * Parse an edge probability label into a 0–1 number.
 *
 * Accepts three forms:
 *   "60%"  → 0.60   (strips % suffix, divides by 100)
 *   "0.6"  → 0.60   (raw decimal)
 *   "60"   → 0.60   (bare integer treated as percentage)
 *
 * Returns null for non-numeric strings (e.g. "Likely", "Sharp").
 */
function parseEdgeProbability(label: string): number | null {
  const trimmed = label.trim();
  const isPct = trimmed.endsWith("%");
  const numeric = parseFloat(isPct ? trimmed.slice(0, -1) : trimmed);
  if (isNaN(numeric)) return null;
  // Heuristic: values > 1 that aren't percentages (e.g. "60") also divide by 100.
  // Values 0–1 that look like decimals (e.g. "0.6") stay as-is.
  if (isPct) return numeric / 100;
  if (numeric > 1) return numeric / 100;
  return numeric;
}

/**
 * Walk the tree DFS from rootId, multiplying edge probabilities.
 * Records the accumulated posterior at each leaf node (no outgoing edges).
 *
 * Returns a Map<leafNodeId, posterior> where posterior is in [0, 1].
 * Only edges whose label parses as a numeric probability contribute to
 * the product — non-numeric labels (e.g. "Mainline") are treated as
 * weight-1 (passthrough) so the partial product still accrues.
 */
function computeLeafPosteriors(
  nodes: TreeNode[],
  rootId: string,
): Map<string, number> {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const result = new Map<string, number>();

  const dfs = (nodeId: string, accumulated: number): void => {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    const children = node.children ?? [];
    if (children.length === 0) {
      // Leaf node — record accumulated posterior.
      result.set(nodeId, accumulated);
      return;
    }

    for (const childId of children) {
      const child = nodeMap.get(childId);
      if (!child) continue;

      // The edge probability lives on the CHILD node: edgeLabel ?? probability.
      const label = child.edgeLabel ?? child.probability;
      const p = label != null ? parseEdgeProbability(label) : null;
      // Multiply when numeric; pass through when non-numeric.
      const factor = p !== null ? p : 1;
      dfs(childId, accumulated * factor);
    }
  };

  dfs(rootId, 1);
  return result;
}

// ── Constants ──────────────────────────────────────────────────────────────

// Tighter node cards (220×88, golden-ratio-ish) — feels editorial vs billboard
const NODE_WIDTH = 220;
const NODE_HEIGHT = 88;
const LEVEL_GAP = 200;
const NODE_GAP = layout.spacing.xl * 2;

// Horizontal layout constants — depth drives X, sibling index drives Y.
const HORIZ_LEVEL_GAP = 300; // horizontal distance between depth columns
const HORIZ_NODE_GAP = 120;  // vertical distance between siblings in a column

// ── Positioning ────────────────────────────────────────────────────────────

interface NodePosition {
  x: number;
  y: number;
  level: number;
}

/**
 * Compute tree layout — nodes positioned for the full canvas.
 * The camera handles which part is visible; layout uses full space.
 *
 * When `horizontal` is true, depth → X and sibling index → Y (left-to-right
 * extensive form). When false (default), depth → Y and sibling index → X
 * (top-to-bottom, the original layout).
 */
function computeTreeLayout(
  nodes: TreeNode[],
  rootId: string,
  canvasWidth: number,
  canvasHeight: number,
  horizontal = false,
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

  if (horizontal) {
    // ── Horizontal layout: depth → X, sibling index → Y ────────────────
    // Title safe area is ~180px from top.
    const TITLE_SAFE = 180;
    const LEFT_MARGIN = canvasWidth * 0.12;

    // Find the tallest column to vertically center the whole tree.
    let maxCount = 0;
    for (const nodeIds of levels.values()) {
      if (nodeIds.length > maxCount) maxCount = nodeIds.length;
    }
    const tallestColumnHeight =
      maxCount * NODE_HEIGHT + Math.max(0, maxCount - 1) * HORIZ_NODE_GAP;
    const availableHeight = canvasHeight - TITLE_SAFE;
    const treeTop =
      TITLE_SAFE + Math.max(0, (availableHeight - tallestColumnHeight) / 2);

    for (const [level, nodeIds] of levels) {
      const nodeX = LEFT_MARGIN + level * (NODE_WIDTH + HORIZ_LEVEL_GAP);
      // Vertically center this column's nodes relative to treeTop.
      const columnHeight =
        nodeIds.length * NODE_HEIGHT +
        Math.max(0, nodeIds.length - 1) * HORIZ_NODE_GAP;
      const columnTop =
        treeTop + (tallestColumnHeight - columnHeight) / 2;

      for (let i = 0; i < nodeIds.length; i++) {
        const nodeY = columnTop + i * (NODE_HEIGHT + HORIZ_NODE_GAP);
        positions.set(nodeIds[i], { x: nodeX, y: nodeY, level });
      }
    }
  } else {
    // ── Vertical layout (original): depth → Y, sibling index → X ───────
    const numLevels = levels.size;
    const totalTreeHeight = (numLevels - 1) * LEVEL_GAP + NODE_HEIGHT;
    const topY = Math.max(
      layout.spacing.xl * 3, // Leave space for title
      (canvasHeight - totalTreeHeight) / 2,
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

/**
 * Horizontal bezier edge path — S-curve going left to right.
 * Source: right-center of parent; target: left-center of child.
 * Control points pull horizontally into the gap between columns.
 */
function edgePathHorizontal(
  parentPos: NodePosition,
  childPos: NodePosition,
): string {
  const sx = parentPos.x + NODE_WIDTH;
  const sy = parentPos.y + NODE_HEIGHT / 2;
  const tx = childPos.x;
  const ty = childPos.y + NODE_HEIGHT / 2;
  const cp1x = sx + HORIZ_LEVEL_GAP * 0.5;
  const cp1y = sy;
  const cp2x = tx - HORIZ_LEVEL_GAP * 0.5;
  const cp2y = ty;
  return `M ${sx} ${sy} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${tx} ${ty}`;
}

/** Returns the mid-segment point on a horizontal bezier at t=0.5. */
function horizontalEdgeMid(
  parentPos: NodePosition,
  childPos: NodePosition,
): { midX: number; midY: number; tx: number; ty: number } {
  const sx = parentPos.x + NODE_WIDTH;
  const sy = parentPos.y + NODE_HEIGHT / 2;
  const tx = childPos.x;
  const ty = childPos.y + NODE_HEIGHT / 2;
  // Cubic bezier at t=0.5
  const cp1x = sx + HORIZ_LEVEL_GAP * 0.5;
  const cp1y = sy;
  const cp2x = tx - HORIZ_LEVEL_GAP * 0.5;
  const cp2y = ty;
  // t=0.2 places the label close to the source fork rather than mid-edge
  const t = 0.2;
  const mt = 1 - t;
  const midX =
    mt * mt * mt * sx +
    3 * mt * mt * t * cp1x +
    3 * mt * t * t * cp2x +
    t * t * t * tx;
  const midY =
    mt * mt * mt * sy +
    3 * mt * mt * t * cp1y +
    3 * mt * t * t * cp2y +
    t * t * t * ty;
  return { midX, midY, tx, ty };
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
  /** When true, left-align text and apply stronger off-path dimming. */
  isHorizontal?: boolean;
  /** Whether this node is on the highlightedPath (for horizontal dimming). */
  isOnPathNode?: boolean;
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
  isHorizontal = false,
  isOnPathNode = false,
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

  // Horizontal layout: off-path nodes dim more aggressively (0.3 opacity cap).
  const horizontalPathDim = isHorizontal && !isOnPathNode ? 0.7 : 0;
  const combinedDim = Math.max(dimAmount, horizontalPathDim);
  // Effective opacity: base animation × exit × inverse dim
  const effectiveOpacity = nodeOpacity * exitOp * (1 - combinedDim);

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
        alignItems: isHorizontal ? "flex-start" : "center",
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
          textAlign: isHorizontal ? "left" : "center",
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

  const isHorizontal = data.layout === "horizontal";

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

  // ── Leaf posterior probabilities (I6) ────────────────────────────────────
  // Compute only when probabilityWeights is opted in — skipped for all other
  // compositions so there's no runtime cost.
  const leafPosteriors = useMemo(() => {
    if (!data.probabilityWeights) return new Map<string, number>();
    return computeLeafPosteriors(data.nodes, data.rootId);
  }, [data.probabilityWeights, data.nodes, data.rootId]);

  // Guard: probabilityWeights is true but no edges have parseable probabilities.
  const hasParseable = useMemo(() => {
    if (!data.probabilityWeights) return true; // gate doesn't apply
    return data.nodes.some((n) => {
      const label = n.edgeLabel ?? n.probability;
      return label != null && parseEdgeProbability(label) !== null;
    });
  }, [data.probabilityWeights, data.nodes]);

  warnIf(
    !!data.probabilityWeights && !hasParseable,
    "DecisionTree",
    "probabilityWeights: true but no edge has a parseable numeric probability " +
      "(e.g. \"60%\", \"0.6\"). Either add numeric probabilities to node.edgeLabel " +
      "or node.probability fields, or set probabilityWeights: false to suppress.",
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
    () => computeTreeLayout(data.nodes, data.rootId, layout.width, layout.height, isHorizontal),
    [data.nodes, data.rootId, isHorizontal]
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

  // ── On-path edge check (horizontal layout track system) ───────────────
  const isOnPath = (parentId: string, childId: string): boolean => {
    if (!data.highlightedPath || data.highlightedPath.length === 0) return false;
    const pIdx = data.highlightedPath.indexOf(parentId);
    return pIdx !== -1 && data.highlightedPath[pIdx + 1] === childId;
  };

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
      /** Horizontal layout: whether this edge is on the precise highlighted path sequence */
      isOnPathEdge: boolean;
      midX: number;
      midY: number;
      /** Horizontal layout: arrowhead target point (left-center of child) */
      arrowTx: number;
      arrowTy: number;
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

        let midX: number;
        let midY: number;
        let pathData: string;
        let arrowTx: number;
        let arrowTy: number;

        if (isHorizontal) {
          const horiz = horizontalEdgeMid(parentPos, childPos);
          midX = horiz.midX;
          midY = horiz.midY;
          arrowTx = horiz.tx;
          arrowTy = horiz.ty;
          pathData = edgePathHorizontal(parentPos, childPos);
        } else {
          // Mid-segment label coordinates (between parent bottom + child top,
          // centered horizontally). On a smooth-step cubic this is also where
          // the curve is roughly horizontal, so non-rotated text reads cleanly.
          midX = (parentPos.x + childPos.x) / 2 + NODE_WIDTH / 2;
          midY = (parentPos.y + NODE_HEIGHT + childPos.y) / 2;
          arrowTx = childPos.x + NODE_WIDTH / 2;
          arrowTy = childPos.y;
          pathData = edgePath(parentPos, childPos);
        }

        const edgeLabel = child?.edgeLabel;
        const probability = child?.probability;
        const label = edgeLabel ?? probability;

        result.push({
          parentId: node.id,
          childId,
          pathData,
          isHighlighted: highlighted.has(node.id) && highlighted.has(childId),
          isOnPathEdge: isOnPath(node.id, childId),
          midX,
          midY,
          arrowTx,
          arrowTy,
          label,
          labelFromProbability: !edgeLabel && Boolean(probability),
        });
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.nodes, positions, data.highlightedPath, isHorizontal]);

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
              {isHorizontal ? (
                /* ── Horizontal track-style edges ──────────────────────────
                   On-path: thick (7px) ribbon in highlightColor.
                   Off-path: thin (1px) muted lines at 60% opacity.
                   Render off-path first so on-path ribbon sits on top. */
                <>
                  {/* Off-path edges (thin, muted) */}
                  {edges
                    .filter((e) => !e.isOnPathEdge)
                    .map((edge, i) => {
                      const childLevel = positions.get(edge.childId)?.level ?? 0;
                      const startFrame = sec(0.6 * t) + childLevel * sec(0.4 * s);
                      const edgeOpacity = fadeIn(frame, startFrame, sec(0.5));
                      const parentDim = camera.getNodeDim(edge.parentId);
                      const childDim = camera.getNodeDim(edge.childId);
                      const edgeDim = Math.max(parentDim, childDim);
                      const isDark = data.backgroundVariant === "dark";
                      return (
                        <path
                          key={`hedge-off-${i}`}
                          d={edge.pathData}
                          stroke={isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)"}
                          strokeWidth={1}
                          fill="none"
                          opacity={edgeOpacity * (1 - edgeDim) * 0.6 * exitFade(frame, totalFrames, sec(0.5))}
                        />
                      );
                    })}
                  {/* On-path edges (thick ribbon) */}
                  {edges
                    .filter((e) => e.isOnPathEdge)
                    .map((edge, i) => {
                      const childLevel = positions.get(edge.childId)?.level ?? 0;
                      const startFrame = sec(1) + childLevel * sec(0.4) + sec(0.5);
                      const edgeOpacity = fadeIn(frame, startFrame, sec(0.6));
                      const parentDim = camera.getNodeDim(edge.parentId);
                      const childDim = camera.getNodeDim(edge.childId);
                      const edgeDim = Math.max(parentDim, childDim);
                      const effectiveOpacity = edgeOpacity * (1 - edgeDim) * exitFade(frame, totalFrames, sec(0.5));
                      return (
                        <g key={`hedge-on-${i}`}>
                          <path
                            d={edge.pathData}
                            stroke={highlightColor}
                            strokeWidth={7}
                            fill="none"
                            strokeLinecap="round"
                            opacity={effectiveOpacity}
                          />
                          {/* Small filled circle arrowhead at the target (left-center of child) */}
                          <circle
                            cx={edge.arrowTx}
                            cy={edge.arrowTy}
                            r={4}
                            fill={highlightColor}
                            opacity={effectiveOpacity}
                          />
                        </g>
                      );
                    })}
                </>
              ) : (
                /* ── Vertical (original) edge rendering ─────────────────── */
                <>
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
                </>
              )}

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
              {/* ── Posterior probability chips (I6) ─────────────────────────
                  Rendered BELOW each leaf node when probabilityWeights === true
                  and the tree-walk produced a posterior for that node.
                  SVG <text> + <rect> chip in the amber/mono metadata register.
                  Amber at 15% fill + 1px border follows the Kalshi chip pattern
                  established by node.marketPrice. */}
              {data.probabilityWeights && leafPosteriors.size > 0 && (
                <g>
                  {Array.from(leafPosteriors.entries()).map(([nodeId, posterior]) => {
                    const pos = positions.get(nodeId);
                    if (!pos) return null;

                    // Chip positioned below the node card, centered on node x.
                    const chipText = `${(posterior * 100).toFixed(0)}%`;
                    const chipCx = pos.x + NODE_WIDTH / 2;
                    const chipCy = pos.y + NODE_HEIGHT + 20; // 20px gap below node bottom
                    const chipW = 44;
                    const chipH = 20;
                    const chipX = chipCx - chipW / 2;
                    const chipY = chipCy - chipH / 2;

                    // Fade in after the node itself, then exit.
                    const level = pos.level;
                    const chipStart =
                      nodeRevealBase + level * sec(0.4 * s) + sec(0.4);
                    const chipOpacity =
                      fadeIn(frame, chipStart, sec(0.5)) *
                      exitFade(frame, totalFrames, sec(0.5));

                    // Camera-aware dim: inherit the node's dim amount.
                    const someHighlighted = (data.highlightedPath?.length ?? 0) > 0;
                    const onPath = someHighlighted && data.highlightedPath!.includes(nodeId);
                    const pathDim = someHighlighted && !onPath ? 0.5 : 0;
                    const dimAmount = Math.max(camera.getNodeDim(nodeId), pathDim);
                    const effectiveOpacity = chipOpacity * (1 - dimAmount);

                    return (
                      <g key={`posterior-${nodeId}`} opacity={effectiveOpacity}>
                        {/* Chip background */}
                        <rect
                          x={chipX}
                          y={chipY}
                          width={chipW}
                          height={chipH}
                          rx={4}
                          fill={`${palette.amber}26`}
                          stroke={palette.amber}
                          strokeWidth={1}
                        />
                        {/* Chip text */}
                        <text
                          x={chipCx}
                          y={chipCy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontFamily={fonts.mono}
                          fontSize={10}
                          fill={palette.amber}
                          fontWeight={500}
                          letterSpacing={0.5}
                        >
                          {chipText}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
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
                // For horizontal layout, path-based dimming is handled inside
                // TreeNodeComponent (isOnPathNode prop) so we skip it here to
                // avoid compounding two independent dim factors.
                const someHighlighted = (data.highlightedPath?.length ?? 0) > 0;
                const onPath = someHighlighted && data.highlightedPath!.includes(node.id);
                const pathDim = !isHorizontal && someHighlighted && !onPath ? 0.5 : 0;
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
                    isHorizontal={isHorizontal}
                    isOnPathNode={onPath}
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

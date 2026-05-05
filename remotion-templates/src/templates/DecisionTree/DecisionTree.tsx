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
  cardPresets,
  getCategoricalColor,
} from "../../design/theme";
import {
  fadeIn,
  exitFade,
  slideIn,
  CLAMP,
} from "../../utils/animation";
import { smoothStepEdge } from "../../utils/edges";
import { contentShadow, accentGlow } from "../../utils/depth";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
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
  /** Stable index for default categorical color when node.color is missing. */
  defaultColorIndex?: number;
}> = React.memo(({
  node,
  position,
  frame,
  startFrame,
  totalFrames,
  mode,
  dimAmount,
  focusScale,
  defaultColorIndex = 0,
}) => {
  const theme = useThemeMode(mode);
  const nodeOpacity = fadeIn(frame, startFrame, sec(0.5));
  const nodeScale = interpolate(
    frame,
    [startFrame, startFrame + sec(0.5)],
    [0.85, 1],
    CLAMP
  );
  const exitOp = exitFade(frame, totalFrames, sec(0.5));

  const nodeColor = node.color || getCategoricalColor(defaultColorIndex);
  const isDark = mode === "dark";
  const isHighlighted = node.highlighted ?? false;
  const isActive = node.active ?? false;
  const nodeBoxStyle = isHighlighted || isActive
    ? cardPresets.accentEdge(nodeColor, isDark)
    : cardPresets.inset(isDark);

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
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          ...nodeBoxStyle,
          boxShadow: isActive
            ? `${contentShadow(true)}, ${accentGlow(nodeColor, 24)}`
            : contentShadow(true),
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
            fontFamily: fonts.display,
            fontWeight: fontWeights.semibold,
            lineHeight: 1.3,
            textAlign: "center",
            color: theme.text.primary,
            padding: `0 ${layout.spacing.sm}px`,
          }}
        >
          {node.label}
        </div>
      </div>

      {/* Probability badge (above node) */}
      {node.probability && (
        <div
          style={{
            position: "absolute",
            top: -layout.spacing.xl - 4,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: fontSizes.caption,
            fontFamily: fonts.mono,
            fontWeight: fontWeights.medium,
            color: theme.text.muted,
            backgroundColor: theme.bg.surface,
            padding: `${layout.spacing.xs}px ${layout.spacing.md}px`,
            borderRadius: `${radii.sm}px`,
            whiteSpace: "nowrap",
            opacity: effectiveOpacity,
          }}
        >
          {node.probability}
        </div>
      )}

      {/* Market price badge (below node) */}
      {node.marketPrice && (
        <div
          style={{
            position: "absolute",
            bottom: -layout.spacing.xl - 4,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: fontSizes.caption,
            fontFamily: fonts.mono,
            fontWeight: fontWeights.medium,
            color: palette.amber,
            backgroundColor: theme.bg.surface,
            padding: `${layout.spacing.xs}px ${layout.spacing.md}px`,
            borderRadius: `${radii.sm}px`,
            whiteSpace: "nowrap",
            opacity: effectiveOpacity,
          }}
        >
          ${node.marketPrice}
        </div>
      )}
    </div>
  );
});

// ── Main Component ─────────────────────────────────────────────────────────

export const DecisionTree: React.FC<{ data: DecisionTreeData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation({ noExit: true, ...direction.driftOptions });
  const { durationInFrames: totalFrames } = useVideoConfig();
  const theme = useThemeMode(data.backgroundVariant || "light");
  const backgroundVariant = data.backgroundVariant || "light";

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
      data.durationSec || 12
    );
  }, [data.cameraPath, data.rootId, data.nodes, data.durationSec]);

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
  const edges = useMemo(() => {
    const result: Array<{
      parentId: string;
      childId: string;
      pathData: string;
      isHighlighted: boolean;
    }> = [];
    const highlighted = new Set(data.highlightedPath || []);

    for (const node of data.nodes) {
      if (!node.children) continue;
      const parentPos = positions.get(node.id);
      if (!parentPos) continue;

      for (const childId of node.children) {
        const childPos = positions.get(childId);
        if (!childPos) continue;

        result.push({
          parentId: node.id,
          childId,
          pathData: edgePath(parentPos, childPos),
          isHighlighted: highlighted.has(node.id) && highlighted.has(childId),
        });
      }
    }
    return result;
  }, [data.nodes, positions, data.highlightedPath]);

  const highlightColor = data.highlightColor || palette.amber;

  // ── Title animation ───────────────────────────────────────────────────
  const titleOpacity = fadeIn(frame, 0, sec(0.8));
  const titleSlide = slideIn(frame, 0, 20, sec(0.6));
  const titleExitOp = exitFade(frame, totalFrames, sec(0.5));

  // ── Camera step label ─────────────────────────────────────────────────
  const labelOpacity = camera.currentLabel
    ? fadeIn(frame, sec(0.3), sec(0.4))
    : 0;

  return (
    <Background
      variant={backgroundVariant as "dark" | "light"}
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

            {/* SVG edge layer (behind nodes) */}
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
              {/* Non-highlighted edges */}
              {edges
                .filter((e) => !e.isHighlighted)
                .map((edge, i) => {
                  const childLevel = positions.get(edge.childId)?.level ?? 0;
                  const startFrame = sec(0.6) + childLevel * sec(0.4);
                  const edgeOpacity = fadeIn(frame, startFrame, sec(0.5));
                  // Dim edges when their nodes are dimmed
                  const parentDim = camera.getNodeDim(edge.parentId);
                  const childDim = camera.getNodeDim(edge.childId);
                  const edgeDim = Math.max(parentDim, childDim);

                  return (
                    <path
                      key={`edge-${i}`}
                      d={edge.pathData}
                      stroke={theme.text.muted}
                      strokeWidth={2.5}
                      fill="none"
                      strokeDasharray="8 6"
                      strokeDashoffset={interpolate(
                        frame,
                        [startFrame, startFrame + sec(0.8)],
                        [300, 0],
                        CLAMP
                      )}
                      opacity={edgeOpacity * (1 - edgeDim) * exitFade(frame, totalFrames, sec(0.5))}
                    />
                  );
                })}

              {/* Highlighted edges with glow */}
              {edges
                .filter((e) => e.isHighlighted)
                .map((edge, i) => {
                  const childLevel = positions.get(edge.childId)?.level ?? 0;
                  const startFrame = sec(1) + childLevel * sec(0.4) + sec(0.8);
                  const edgeOpacity = fadeIn(frame, startFrame, sec(0.5));

                  return (
                    <g key={`edge-hl-${i}`}>
                      {/* Glow */}
                      <path
                        d={edge.pathData}
                        stroke={highlightColor}
                        strokeWidth={6}
                        fill="none"
                        opacity={edgeOpacity * 0.25 * exitFade(frame, totalFrames, sec(0.5))}
                        filter="url(#edge-glow)"
                      />
                      {/* Main */}
                      <path
                        d={edge.pathData}
                        stroke={highlightColor}
                        strokeWidth={3}
                        fill="none"
                        strokeDasharray="8 6"
                        strokeDashoffset={interpolate(
                          frame,
                          [startFrame, startFrame + sec(0.8)],
                          [300, 0],
                          CLAMP
                        )}
                        opacity={edgeOpacity * 0.9 * exitFade(frame, totalFrames, sec(0.5))}
                      />
                    </g>
                  );
                })}

              {/* SVG filter for edge glow */}
              <defs>
                <filter id="edge-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
              </defs>
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
                const startFrame = sec(0.5) + level * sec(0.4) + indexInLevel * sec(0.1);

                return (
                  <TreeNodeComponent
                    key={node.id}
                    node={node}
                    position={pos}
                    frame={frame}
                    startFrame={startFrame}
                    totalFrames={totalFrames}
                    mode={backgroundVariant as "light" | "dark"}
                    dimAmount={camera.getNodeDim(node.id)}
                    focusScale={camera.getNodeScale(node.id)}
                    defaultColorIndex={data.nodes.indexOf(node)}
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
          />
        </div>

        {/* ── Camera step label (contextual overlay) ── */}
        {camera.currentLabel && (
          <div
            style={{
              position: "absolute",
              bottom: layout.safeAreaTier.generous.bottom + 80,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: fontSizes.h3,
              fontWeight: fontWeights.semibold,
              color: theme.text.primary,
              fontFamily: fonts.display,
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
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

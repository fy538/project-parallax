/**
 * DecisionTree — branching scenario visualization for "Wargamer" episodes.
 *
 * Layout:
 *   - Title at top with subtitle
 *   - Tree nodes positioned by depth (top-to-bottom) and breadth (left-to-right)
 *   - Nodes reveal level by level with stagger
 *   - SVG edges connect parent to children, draw as children appear
 *   - Optional highlighted path draws last with distinct color and glow
 *   - Active node gets accent glow and subtle pulse
 *
 * Animation:
 *   - Title fades in first (heroSpring)
 *   - Nodes reveal by level (stagger ~12 frames between levels, ~6 frames within)
 *   - Edges draw with strokeDasharray animation as children appear
 *   - Highlighted path draws last with glowing stroke
 *   - Exit fade on last 15 frames
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
  dark,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
} from "../../design/theme";
import {
  fadeIn,
  heroSpring,
  stagger,
  exitFade,
  pulse,
} from "../../utils/animation";
import { contentShadow, accentGlow } from "../../utils/depth";
import { Background } from "../../components/Background";
import { MetadataStrip } from "../../components/MetadataStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { DecisionTreeData, TreeNode } from "./types";

// ── Positioning helpers ─────────────────────────────────────────────────────

interface NodePosition {
  x: number;
  y: number;
  level: number;
}

/**
 * Compute (x, y) positions for all nodes using level-based tree layout.
 * - Y position is based on level (depth from root)
 * - X position spreads siblings horizontally
 */
function computeTreeLayout(
  nodes: TreeNode[],
  rootId: string,
  safeWidth: number,
  safeHeight: number,
  levelGap: number = 160,
  nodeWidth: number = 160,
  nodeHeight: number = 60
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build tree structure (root → level → siblings within level)
  const levels: Map<number, string[]> = new Map();
  const visited = new Set<string>();

  const buildLevels = (nodeId: string, level: number) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    if (!levels.has(level)) levels.set(level, []);
    levels.get(level)!.push(nodeId);

    const node = nodeMap.get(nodeId);
    if (node?.children) {
      for (const childId of node.children) {
        buildLevels(childId, level + 1);
      }
    }
  };

  buildLevels(rootId, 0);

  // Position nodes: level determines Y, siblings spread X
  let topY = 120; // Start below title

  for (const [level, nodeIds] of levels) {
    const y = topY + level * levelGap;
    const numSiblings = nodeIds.length;
    const totalWidth = numSiblings * nodeWidth + (numSiblings - 1) * 40; // 40px gap
    const startX = Math.max(40, (safeWidth - totalWidth) / 2);

    for (let i = 0; i < nodeIds.length; i++) {
      const x = startX + i * (nodeWidth + 40);
      positions.set(nodeIds[i], { x, y, level });
    }
  }

  return positions;
}

/**
 * Compute SVG edge path between parent and child nodes.
 * Uses a simple bezier curve (quadratic) connecting the bottom of parent
 * to the top of child.
 */
function edgePath(
  parentPos: NodePosition,
  childPos: NodePosition,
  nodeWidth: number = 160,
  nodeHeight: number = 60
): string {
  const x1 = parentPos.x + nodeWidth / 2;
  const y1 = parentPos.y + nodeHeight;
  const x2 = childPos.x + nodeWidth / 2;
  const y2 = childPos.y;
  const ctrlY = (y1 + y2) / 2;

  // Quadratic bezier: M start, Q control, end
  return `M ${x1} ${y1} Q ${x1} ${ctrlY}, ${x2} ${ctrlY} T ${x2} ${y2}`;
}

// ── Single tree node ────────────────────────────────────────────────────────

interface TreeNodeComponentProps {
  node: TreeNode;
  position: NodePosition;
  frame: number;
  startFrame: number;
  isActive: boolean;
  isHighlighted: boolean;
  totalFrames: number;
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = React.memo(({
  node,
  position,
  frame,
  startFrame,
  isActive,
  isHighlighted,
  totalFrames,
}) => {
  const nodeOpacity = fadeIn(frame, startFrame, sec(0.4));
  const nodeScale = interpolate(
    frame,
    [startFrame, startFrame + sec(0.4)],
    [0.8, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const exitOp = exitFade(frame, totalFrames, 15);

  // Active node pulses subtly
  const pulseScale = isActive
    ? pulse(frame, startFrame + sec(0.8), 12, 1.05)
    : 1.0;

  // Choose color
  const bgColor = node.color || (isHighlighted ? palette.amber : dark.bg.elevated);
  const textColor = isHighlighted ? dark.text.primary : dark.text.primary;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: 160,
        height: 60,
        opacity: nodeOpacity * exitOp,
        transform: `scale(${nodeScale * pulseScale})`,
        transformOrigin: "center",
      }}
    >
      {/* Node background box */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 8,
          backgroundColor: bgColor,
          boxShadow: isActive
            ? `${contentShadow(true)}, ${accentGlow(palette.amber, 24)}`
            : contentShadow(true),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 12px",
          boxSizing: "border-box",
        }}
      >
        {/* Label text */}
        <div
          style={{
            fontSize: fontSizes.label,
            fontFamily: fonts.display,
            fontWeight: fontWeights.semibold,
            lineHeight: 1.3,
            textAlign: "center",
            color: textColor,
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
            top: -24,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: fontSizes.caption,
            fontFamily: fonts.body,
            fontWeight: fontWeights.medium,
            color: dark.text.muted,
            backgroundColor: dark.bg.surface,
            padding: "2px 8px",
            borderRadius: 4,
            whiteSpace: "nowrap",
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
            bottom: -24,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: fontSizes.caption,
            fontFamily: fonts.body,
            fontWeight: fontWeights.medium,
            color: palette.amber,
            backgroundColor: dark.bg.surface,
            padding: "2px 8px",
            borderRadius: 4,
            whiteSpace: "nowrap",
          }}
        >
          ${node.marketPrice}
        </div>
      )}
    </div>
  );
});

// ── Edge component (SVG line connecting parent to child) ────────────────────

interface EdgeComponentProps {
  pathData: string;
  frame: number;
  startFrame: number;
  isHighlighted: boolean;
  highlightColor?: string;
  totalFrames: number;
}

const EdgeComponent: React.FC<EdgeComponentProps> = React.memo(({
  pathData,
  frame,
  startFrame,
  isHighlighted,
  highlightColor,
  totalFrames,
}) => {
  const opacity = fadeIn(frame, startFrame, sec(0.3));
  const dashOffset = interpolate(
    frame,
    [startFrame, startFrame + sec(0.5)],
    [200, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const exitOp = exitFade(frame, totalFrames, 15);

  const strokeColor = isHighlighted ? (highlightColor || palette.amber) : dark.text.muted;
  const strokeWidth = isHighlighted ? 3 : 2;
  const strokeOpacity = isHighlighted ? 0.8 : 0.4;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: opacity * exitOp,
      }}
    >
      <path
        d={pathData}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray="6 4"
        strokeDashoffset={dashOffset}
        opacity={strokeOpacity}
      />
      {isHighlighted && (
        <path
          d={pathData}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.2}
          filter="drop-shadow(0 0 8px rgba(229, 165, 68, 0.4))"
        />
      )}
    </svg>
  );
});

// ── Main component ──────────────────────────────────────────────────────────

export const DecisionTree: React.FC<{ data: DecisionTreeData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation({ noExit: true });
  const { durationInFrames: totalFrames } = useVideoConfig();

  const safeWidth = layout.width - layout.safeArea.left - layout.safeArea.right;
  const safeHeight = layout.height - layout.safeArea.top - layout.safeArea.bottom;

  // Compute node positions
  const positions = useMemo(
    () => computeTreeLayout(data.nodes, data.rootId, safeWidth, safeHeight),
    [data.nodes, data.rootId, safeWidth, safeHeight]
  );

  const nodeMap = useMemo(
    () => new Map(data.nodes.map((n) => [n.id, n])),
    [data.nodes]
  );

  const highlightColor = data.highlightColor || palette.amber;
  const backgroundVariant = data.backgroundVariant || "dark";

  // Title animation
  const titleOpacity = fadeIn(frame, 0, sec(0.6));
  const titleScale = interpolate(
    frame,
    [0, sec(0.6)],
    [0.9, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Build edge list: for each node, create edges to children
  const edges: Array<{
    parentId: string;
    childId: string;
    pathData: string;
    isHighlighted: boolean;
  }> = useMemo(() => {
    const result = [];
    const highlighted = new Set(data.highlightedPath || []);

    for (const node of data.nodes) {
      if (!node.children) continue;
      const parentPos = positions.get(node.id);
      if (!parentPos) continue;

      for (const childId of node.children) {
        const childPos = positions.get(childId);
        if (!childPos) continue;

        const isHighlighted =
          highlighted.has(node.id) && highlighted.has(childId);
        const pathData = edgePath(parentPos, childPos);

        result.push({
          parentId: node.id,
          childId,
          pathData,
          isHighlighted,
        });
      }
    }

    return result;
  }, [data.nodes, positions, data.highlightedPath]);

  return (
    <Background variant={backgroundVariant as "dark" | "light"}>
      <AbsoluteFill style={compStyle}>
        {/* ── Title area ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: layout.safeArea.top,
          left: layout.safeArea.left,
          right: layout.safeArea.right,
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          transformOrigin: "top left",
        }}
      >
        <h1
          style={{
            fontSize: fontSizes.h2,
            fontFamily: fonts.display,
            fontWeight: fontWeights.bold,
            color: dark.text.primary,
            margin: "0 0 8px 0",
            letterSpacing: letterSpacing.h2,
          }}
        >
          {data.title}
        </h1>
        {data.subtitle && (
          <p
            style={{
              fontSize: fontSizes.body,
              fontFamily: fonts.display,
              color: dark.text.secondary,
              margin: 0,
              letterSpacing: letterSpacing.body,
            }}
          >
            {data.subtitle}
          </p>
        )}
      </div>

      {/* ── Tree container (positioned for nodes & edges) ────────── */}
      <div
        style={{
          position: "absolute",
          top: layout.safeArea.top,
          left: layout.safeArea.left,
          right: layout.safeArea.right,
          bottom: layout.safeArea.bottom,
        }}
      >
        {/* SVG edges layer (behind nodes) */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {/* Draw non-highlighted edges first */}
          {edges
            .filter((e) => !e.isHighlighted)
            .map((edge, i) => {
              const childNode = nodeMap.get(edge.childId);
              const childLevel = positions.get(edge.childId)?.level ?? 0;
              const startFrame = sec(0.8) + childLevel * sec(0.12);

              return (
                <path
                  key={`edge-${i}`}
                  d={edge.pathData}
                  stroke={dark.text.muted}
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray="6 4"
                  strokeDashoffset={interpolate(
                    frame,
                    [startFrame, startFrame + sec(0.5)],
                    [200, 0],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  )}
                  opacity={
                    fadeIn(frame, startFrame, sec(0.3)) *
                    exitFade(frame, totalFrames, 15)
                  }
                  style={{ pointerEvents: "none" }}
                />
              );
            })}

          {/* Draw highlighted edges with glow */}
          {edges
            .filter((e) => e.isHighlighted)
            .map((edge, i) => {
              const childLevel = positions.get(edge.childId)?.level ?? 0;
              const startFrame = sec(0.8) + childLevel * sec(0.12) + sec(0.6);

              return (
                <g key={`edge-highlight-${i}`}>
                  {/* Glow layer */}
                  <path
                    d={edge.pathData}
                    stroke={highlightColor}
                    strokeWidth={3}
                    fill="none"
                    opacity={
                      fadeIn(frame, startFrame, sec(0.3)) *
                      0.2 *
                      exitFade(frame, totalFrames, 15)
                    }
                    filter="drop-shadow(0 0 8px rgba(229, 165, 68, 0.5))"
                  />
                  {/* Main line */}
                  <path
                    d={edge.pathData}
                    stroke={highlightColor}
                    strokeWidth={3}
                    fill="none"
                    strokeDasharray="6 4"
                    strokeDashoffset={interpolate(
                      frame,
                      [startFrame, startFrame + sec(0.5)],
                      [200, 0],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                    )}
                    opacity={
                      fadeIn(frame, startFrame, sec(0.3)) *
                      0.8 *
                      exitFade(frame, totalFrames, 15)
                    }
                  />
                </g>
              );
            })}
        </svg>

        {/* Tree nodes layer (on top) */}
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {data.nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;

            const level = pos.level;
            const startFrame =
              sec(0.8) + level * sec(0.12) + Math.random() * sec(0.06); // slight variation within level
            const isActive = node.active ?? false;
            const isHighlighted = node.highlighted ?? false;

            return (
              <TreeNodeComponent
                key={node.id}
                node={node}
                position={pos}
                frame={frame}
                startFrame={startFrame}
                isActive={isActive}
                isHighlighted={isHighlighted}
                totalFrames={totalFrames}
              />
            );
          })}
        </div>
      </div>

      {/* ── Source attribution ────────────────────────────────────– */}
      {data.source && (
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom + 20,
            left: layout.safeArea.left,
            fontSize: fontSizes.caption,
            color: dark.text.muted,
            opacity: fadeIn(frame, 0, sec(1)),
          }}
        >
          {data.source}
        </div>
      )}

      {/* ── Episode label ───────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: layout.safeArea.bottom + 20,
          right: layout.safeArea.right,
          fontSize: fontSizes.label,
          color: dark.text.muted,
          letterSpacing: letterSpacing.label,
          textTransform: "uppercase",
          opacity: fadeIn(frame, 0, sec(1)),
        }}
      >
        {data.episode}
      </div>
      </AbsoluteFill>
    </Background>
  );
};

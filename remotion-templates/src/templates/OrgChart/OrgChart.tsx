/**
 * OrgChart — formal authority hierarchy visualization.
 *
 * Renders a directed tree of authority: nodes represent roles or persons,
 * edges encode command/delegation relationships. Distinct from DecisionTree
 * (decision points) and NetworkDiagram (flat relationship mesh).
 *
 * Use cases: nuclear command chains, ORBAT, bureaucratic procurement chains,
 * intelligence community oversight structures, corporate governance.
 *
 * Tree layout algorithm:
 *   1. BFS from rootId to assign levels (depths) to each node.
 *   2. Within each level, group siblings by parent using a simple
 *      subtree-width approach: each node's subtreeWidth = max(nodeWidth,
 *      sum of children subtreeWidths + gaps between them).
 *   3. X positions: children are centered under their parent.
 *      Level-0 root is centered in the content area.
 *   4. Y positions: level * levelSpacing from the top of the content area.
 *
 * Animation sequence (top-down reveal):
 *   0–25    Title/subtitle fade in
 *   20–35   Root node appears
 *   30–50   Level-1 nodes appear with stagger
 *   40–55   Edges from root → level-1 draw (stroke-dash reveal)
 *   50–70   Level-2 nodes appear
 *   60–75   Edges to level-2 draw
 *   ... and so on per level
 *   After all nodes: highlightChain pulses in sequence (gold ring + scale)
 *
 * Performance:
 *   - All layout (children map, levels, x/y) in useMemo
 *   - OrgChartNodeBox and OrgChartEdgeLine wrapped in React.memo
 *   - warnIf for semantic validation
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  fontWeights,
  layout,
  sec,
  contentArea,
  timing,
} from "../../design/theme";
import { fadeIn, stagger, CLAMP, CLAMP_CUBIC } from "../../utils/animation";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { warnIf } from "../../utils/dataWarnings";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import type { OrgChartData, OrgChartNode, OrgChartEdge } from "./types";

// ── Layout constants ──────────────────────────────────────────────────────────

const NODE_WIDTH_DEFAULT = 164;
const NODE_WIDTH_COMMITTEE = 210;
const NODE_HEIGHT_SINGLE = 48;
const NODE_HEIGHT_DOUBLE = 66; // with sublabel
const NODE_GAP_MIN = 20; // minimum px between siblings

// ── Computed layout types ─────────────────────────────────────────────────────

interface NodeLayout {
  id: string;
  x: number;       // center x
  y: number;       // center y
  width: number;
  height: number;
  level: number;
}

interface EdgeLayout {
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midY: number;    // y of the horizontal elbow
  style?: OrgChartEdge["style"];
  label?: string;
  color?: string;
}

// ── Tree layout computation ───────────────────────────────────────────────────

function buildChildrenMap(
  edges: OrgChartEdge[],
  nodeIds: Set<string>
): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const id of nodeIds) children.set(id, []);
  for (const edge of edges) {
    if (nodeIds.has(edge.from) && nodeIds.has(edge.to)) {
      const list = children.get(edge.from);
      if (list && !list.includes(edge.to)) list.push(edge.to);
    }
  }
  return children;
}

function buildLevelMap(
  rootId: string,
  childrenMap: Map<string, string[]>
): Map<string, number> {
  const levels = new Map<string, number>();
  const queue: string[] = [rootId];
  levels.set(rootId, 0);
  while (queue.length > 0) {
    const id = queue.shift()!;
    const level = levels.get(id)!;
    for (const child of childrenMap.get(id) ?? []) {
      if (!levels.has(child)) {
        levels.set(child, level + 1);
        queue.push(child);
      }
    }
  }
  return levels;
}

function nodeWidthFor(node: OrgChartNode): number {
  return node.type === "committee" ? NODE_WIDTH_COMMITTEE : NODE_WIDTH_DEFAULT;
}

function nodeHeightFor(node: OrgChartNode): number {
  return node.sublabel || node.classified ? NODE_HEIGHT_DOUBLE : NODE_HEIGHT_SINGLE;
}

/**
 * Compute subtree width for a node (the horizontal space its subtree needs).
 * This is the max of the node's own width and the sum of its children's
 * subtree widths plus gaps.
 */
function computeSubtreeWidths(
  id: string,
  childrenMap: Map<string, string[]>,
  nodesById: Map<string, OrgChartNode>,
  cache: Map<string, number>,
  gap: number
): number {
  if (cache.has(id)) return cache.get(id)!;
  const node = nodesById.get(id);
  const selfWidth = node ? nodeWidthFor(node) : NODE_WIDTH_DEFAULT;
  const children = childrenMap.get(id) ?? [];
  if (children.length === 0) {
    cache.set(id, selfWidth);
    return selfWidth;
  }
  const childTotalWidth = children.reduce((sum, cid, i) => {
    const cw = computeSubtreeWidths(cid, childrenMap, nodesById, cache, gap);
    return sum + cw + (i > 0 ? gap : 0);
  }, 0);
  const result = Math.max(selfWidth, childTotalWidth);
  cache.set(id, result);
  return result;
}

/**
 * Assign x positions by centering each parent over its children group.
 * Returns a map from node ID to center-x within the subtree's allocated slot.
 */
function assignXPositions(
  id: string,
  slotLeft: number,
  slotRight: number,
  childrenMap: Map<string, string[]>,
  nodesById: Map<string, OrgChartNode>,
  subtreeWidths: Map<string, number>,
  positions: Map<string, number>,
  gap: number
): void {
  // Center the current node in its slot
  positions.set(id, (slotLeft + slotRight) / 2);

  const children = childrenMap.get(id) ?? [];
  if (children.length === 0) return;

  // Distribute child slots from left of the parent slot
  const totalChildWidth = children.reduce((sum, cid, i) => {
    return sum + (subtreeWidths.get(cid) ?? NODE_WIDTH_DEFAULT) + (i > 0 ? gap : 0);
  }, 0);

  // Center the children group under the parent slot center
  const groupLeft = (slotLeft + slotRight) / 2 - totalChildWidth / 2;
  let cursor = groupLeft;
  for (const cid of children) {
    const cw = subtreeWidths.get(cid) ?? NODE_WIDTH_DEFAULT;
    assignXPositions(cid, cursor, cursor + cw, childrenMap, nodesById, subtreeWidths, positions, gap);
    cursor += cw + gap;
  }
}

function computeLayout(
  data: OrgChartData,
  area: ReturnType<typeof contentArea>
): { nodes: NodeLayout[]; edges: EdgeLayout[] } {
  const nodesById = new Map(data.nodes.map((n) => [n.id, n]));
  const nodeIds = new Set(data.nodes.map((n) => n.id));

  // Build children map (BFS approach — only include tree edges, not advisory edges)
  // Use edges to find parent->child relationships
  const childrenMap = buildChildrenMap(data.edges, nodeIds);
  const levelMap = buildLevelMap(data.rootId, childrenMap);
  const maxLevel = Math.max(...Array.from(levelMap.values()), 0);

  // Compute level spacing
  const effectiveLevelSpacing =
    data.levelSpacing ??
    Math.min(180, Math.max(100, area.height / (maxLevel + 1)));

  // Compute node gap
  const effectiveNodeGap =
    data.nodeSpacing ?? Math.max(NODE_GAP_MIN, 24);

  // Compute subtree widths for X layout
  const subtreeWidthCache = new Map<string, number>();
  computeSubtreeWidths(
    data.rootId,
    childrenMap,
    nodesById,
    subtreeWidthCache,
    effectiveNodeGap
  );

  // Assign X positions — root gets the full content area width
  const xPositions = new Map<string, number>();
  assignXPositions(
    data.rootId,
    area.left,
    area.left + area.width,
    childrenMap,
    nodesById,
    subtreeWidthCache,
    xPositions,
    effectiveNodeGap
  );

  // Nodes not reachable from root (e.g. advisory nodes with no tree parent):
  // place them at the level indicated by their outgoing edge's target level - 1,
  // or at level 0 if not determinable.
  for (const node of data.nodes) {
    if (!levelMap.has(node.id)) {
      // Find minimum level of their children via edges
      let minChildLevel = 0;
      for (const edge of data.edges) {
        if (edge.from === node.id && levelMap.has(edge.to)) {
          const childLevel = levelMap.get(edge.to) ?? 0;
          minChildLevel = Math.max(minChildLevel, childLevel - 1);
        }
      }
      levelMap.set(node.id, minChildLevel);
      if (!xPositions.has(node.id)) {
        // Place it to the right of the existing layout
        xPositions.set(node.id, area.left + area.width - NODE_WIDTH_DEFAULT / 2 - 60);
      }
    }
  }

  // Build node layouts
  const nodeLayouts: NodeLayout[] = data.nodes.map((node) => {
    const level = levelMap.get(node.id) ?? 0;
    const cx = xPositions.get(node.id) ?? area.left + area.width / 2;
    const cy = area.top + level * effectiveLevelSpacing + NODE_HEIGHT_DOUBLE / 2;
    return {
      id: node.id,
      x: cx,
      y: cy,
      width: nodeWidthFor(node),
      height: nodeHeightFor(node),
      level,
    };
  });

  const nodeLayoutById = new Map(nodeLayouts.map((n) => [n.id, n]));

  // Build edge layouts — L-shaped elbows
  const edgeLayouts: EdgeLayout[] = data.edges.map((edge) => {
    const from = nodeLayoutById.get(edge.from);
    const to = nodeLayoutById.get(edge.to);
    if (!from || !to) {
      return { fromId: edge.from, toId: edge.to, x1: 0, y1: 0, x2: 0, y2: 0, midY: 0 };
    }
    const x1 = from.x;
    const y1 = from.y + from.height / 2;
    const x2 = to.x;
    const y2 = to.y - to.height / 2;
    const midY = (y1 + y2) / 2;
    return {
      fromId: edge.from,
      toId: edge.to,
      x1,
      y1,
      x2,
      y2,
      midY,
      style: edge.style,
      label: edge.label,
      color: edge.color,
    };
  });

  return { nodes: nodeLayouts, edges: edgeLayouts };
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface NodeBoxProps {
  node: OrgChartNode;
  layout: NodeLayout;
  opacity: number;
  isDark: boolean;
  /** Scale factor for highlight chain pulse (1.0 normal, 1.03 peak) */
  pulseScale: number;
  /** Whether this node is currently highlighted in the chain */
  isHighlighted: boolean;
}

const OrgChartNodeBox: React.FC<NodeBoxProps> = React.memo(
  ({ node, layout, opacity, isDark, pulseScale, isHighlighted }) => {
    const nodeType = node.type ?? "role";
    const emphasis = node.emphasis ?? "secondary";

    // Border color
    let borderColor: string;
    if (node.color) {
      borderColor = node.color;
    } else if (emphasis === "primary") {
      borderColor = palette.gold;
    } else {
      borderColor = isDark ? palette.midnight : palette.taupe;
    }

    // Border width — primary nodes get a heavier border
    const borderWidth = emphasis === "primary" ? 2 : 1;

    // Border dash — empty posts get dashed border
    const isDashedBorder = nodeType === "empty";

    // Background fill
    const bg = isDark ? palette.midnight : palette.paper;

    // Opacity modifier for muted nodes
    const muteOpacity = emphasis === "muted" ? 0.55 : 1.0;
    const totalOpacity = opacity * muteOpacity;

    // Highlight ring
    const ringColor = palette.gold;
    const ringOpacity = isHighlighted ? 0.8 : 0;

    // Label weight
    const labelWeight =
      nodeType === "person" || emphasis === "primary"
        ? fontWeights.semibold
        : fontWeights.medium;

    // Label style — committees use italic
    const labelStyle = nodeType === "committee" ? "italic" : "normal";

    const boxLeft = layout.x - layout.width / 2;
    const boxTop = layout.y - layout.height / 2;

    return (
      <g
        transform={`translate(${layout.x}, ${layout.y}) scale(${pulseScale}) translate(${-layout.x}, ${-layout.y})`}
        opacity={totalOpacity}
      >
        {/* Highlight ring */}
        {isHighlighted && (
          <rect
            x={boxLeft - 4}
            y={boxTop - 4}
            width={layout.width + 8}
            height={layout.height + 8}
            rx={6}
            ry={6}
            fill="none"
            stroke={ringColor}
            strokeWidth={2}
            opacity={ringOpacity}
          />
        )}

        {/* Node box */}
        <rect
          x={boxLeft}
          y={boxTop}
          width={layout.width}
          height={layout.height}
          rx={4}
          ry={4}
          fill={bg}
          stroke={borderColor}
          strokeWidth={borderWidth}
          strokeDasharray={isDashedBorder ? "6 4" : undefined}
          opacity={0.97}
        />

        {/* Primary emphasis: left accent strip */}
        {emphasis === "primary" && !node.color && (
          <rect
            x={boxLeft}
            y={boxTop + 4}
            width={3}
            height={layout.height - 8}
            rx={1.5}
            fill={palette.gold}
          />
        )}

        {/* Label text */}
        <text
          x={layout.x}
          y={layout.y - (node.sublabel || node.classified ? layout.height * 0.16 : 0)}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={fonts.metadata}
          fontSize={fontSizes.caption}
          fontWeight={labelWeight}
          fontStyle={labelStyle}
          fill={isDark ? palette.bone : palette.ink}
          style={{ letterSpacing: 1 }}
        >
          {node.label}
        </text>

        {/* Sublabel text */}
        {node.sublabel && (
          <text
            x={layout.x}
            y={layout.y + layout.height * 0.22}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={fonts.metadata}
            fontSize={10}
            fontWeight={fontWeights.regular}
            fontStyle="normal"
            fill={isDark ? palette.umber : palette.umber}
          >
            {node.sublabel}
          </text>
        )}

        {/* Classified badge */}
        {node.classified && !node.sublabel && (
          <text
            x={layout.x}
            y={layout.y + layout.height * 0.22}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={fonts.metadata}
            fontSize={10}
            fontWeight={fontWeights.regular}
            fontStyle="italic"
            fill={palette.taupe}
          >
            [CLASSIFIED]
          </text>
        )}

        {/* Annotation bubble */}
        {node.annotation && (
          <>
            <rect
              x={boxLeft + layout.width - 2}
              y={boxTop - 2}
              width={Math.min(node.annotation.length * 5.5 + 8, 120)}
              height={18}
              rx={9}
              fill={palette.gold}
              opacity={0.9}
            />
            <text
              x={boxLeft + layout.width + Math.min(node.annotation.length * 5.5 + 8, 120) / 2 - 2}
              y={boxTop + 7}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily={fonts.metadata}
              fontSize={9}
              fontWeight={fontWeights.semibold}
              fill={palette.ink}
            >
              {node.annotation}
            </text>
          </>
        )}
      </g>
    );
  }
);

interface EdgeLineProps {
  edge: EdgeLayout;
  opacity: number;
  progress: number; // 0..1 stroke-dash reveal progress
  isDark: boolean;
}

const OrgChartEdgeLine: React.FC<EdgeLineProps> = React.memo(
  ({ edge, opacity, progress, isDark }) => {
    const edgeStyle = edge.style ?? "solid";

    // Color
    let strokeColor: string;
    if (edge.color) {
      strokeColor = edge.color;
    } else if (edgeStyle === "dashed") {
      strokeColor = palette.umber;
    } else if (edgeStyle === "dotted") {
      strokeColor = palette.taupe;
    } else {
      strokeColor = isDark ? palette.walnut : palette.walnut;
    }

    // Stroke dash
    const dashArray =
      edgeStyle === "dashed"
        ? "8 4"
        : edgeStyle === "dotted"
        ? "2 4"
        : undefined;

    // L-shaped elbow path:
    // parent bottom-center → midY (horizontal knee) → child top-center
    const pathD = `M ${edge.x1} ${edge.y1} L ${edge.x1} ${edge.midY} L ${edge.x2} ${edge.midY} L ${edge.x2} ${edge.y2}`;

    // Estimate total path length for stroke-dash reveal
    const segH1 = Math.abs(edge.midY - edge.y1);
    const segH2 = Math.abs(edge.x2 - edge.x1);
    const segH3 = Math.abs(edge.y2 - edge.midY);
    const totalLength = segH1 + segH2 + segH3 + 1;

    const dashOffset = totalLength * (1 - progress);

    return (
      <g opacity={opacity}>
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1}
          strokeDasharray={dashArray ?? `${totalLength}`}
          strokeDashoffset={dashArray ? undefined : dashOffset}
          opacity={0.65}
        />

        {/* Edge label */}
        {edge.label && progress > 0.8 && (
          <text
            x={(edge.x1 + edge.x2) / 2 + 6}
            y={edge.midY - 6}
            fontFamily={fonts.metadata}
            fontSize={9}
            fontWeight={fontWeights.regular}
            fontStyle="italic"
            fill={strokeColor}
            opacity={0.8}
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  }
);

// ── Animation timing helpers ──────────────────────────────────────────────────

/** Frame at which a given level's nodes begin appearing */
function levelNodeStartFrame(level: number): number {
  // Root (level 0): frames 20-35
  // Level 1: 30-50
  // Level 2: 50-70
  // General: 20 + level * 20
  return 20 + level * 20;
}

/** Frame at which edges TO a given level begin drawing */
function levelEdgeStartFrame(level: number): number {
  // Edges to level 1: 40-55
  // Edges to level 2: 60-75
  // General: 40 + (level - 1) * 20
  return Math.max(30, 40 + (level - 1) * 20);
}

// ── Main OrgChart component ───────────────────────────────────────────────────

export const OrgChart: React.FC<{ data: OrgChartData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });

  const mode = data.backgroundVariant ?? "light";
  const isDark = mode === "dark";

  // ── Semantic warnings ─────────────────────────────────────────────────────
  const nodeIds = useMemo(() => new Set(data.nodes.map((n) => n.id)), [data.nodes]);

  warnIf(
    data.nodes.length > 24,
    "OrgChart",
    `Too many nodes (${data.nodes.length}). Max 24 — beyond this the layout becomes illegible.`
  );
  warnIf(
    !nodeIds.has(data.rootId),
    "OrgChart",
    `rootId "${data.rootId}" not found in nodes array.`
  );

  const edgeWarning = useMemo(() => {
    for (const edge of data.edges) {
      if (!nodeIds.has(edge.from)) return edge.from;
      if (!nodeIds.has(edge.to)) return edge.to;
    }
    return null;
  }, [data.edges, nodeIds]);
  warnIf(
    edgeWarning !== null,
    "OrgChart",
    `Edge references unknown node ID "${edgeWarning}".`
  );

  // ── Layout computation ────────────────────────────────────────────────────
  const area = useMemo(() => contentArea("content", "generous"), []);

  const { nodes: nodeLayouts, edges: edgeLayouts } = useMemo(
    () => computeLayout(data, area),
    [data, area]
  );

  // Level map for animation timing
  const levelMap = useMemo(() => {
    const nodesById = new Map(data.nodes.map((n) => [n.id, n]));
    const childrenMap = buildChildrenMap(data.edges, new Set(data.nodes.map((n) => n.id)));
    const levels = buildLevelMap(data.rootId, childrenMap);
    // Assign orphaned nodes a reasonable level
    for (const node of data.nodes) {
      if (!levels.has(node.id)) levels.set(node.id, 0);
    }
    return levels;
  }, [data]);

  // Lookup for edge target levels
  const nodeLayoutById = useMemo(
    () => new Map(nodeLayouts.map((n) => [n.id, n])),
    [nodeLayouts]
  );

  // ── highlight chain timing ────────────────────────────────────────────────
  const highlightChain = data.highlightChain ?? [];
  // Pulse starts after all levels are done
  const maxLevel = useMemo(
    () => Math.max(...Array.from(levelMap.values()), 0),
    [levelMap]
  );
  const allNodesVisibleFrame = levelNodeStartFrame(maxLevel) + timing.entrance.medium;
  const pulseDuration = sec(1); // 1s per pulse

  // For each node in the chain, compute its pulse window
  const chainPulseByNodeId = useMemo(() => {
    const map = new Map<string, { start: number; end: number }>();
    highlightChain.forEach((id, i) => {
      const start = allNodesVisibleFrame + i * pulseDuration;
      map.set(id, { start, end: start + pulseDuration });
    });
    return map;
  }, [highlightChain, allNodesVisibleFrame, pulseDuration]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        <HeaderStrip metadata={data.episode} mode={mode} />
        {/* Title block */}
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
          />
        )}

        {/* SVG chart layer */}
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Edges */}
          {edgeLayouts.map((edge, i) => {
            const toLayout = nodeLayoutById.get(edge.toId);
            const targetLevel = toLayout?.level ?? 1;

            let edgeOpacity: number;
            let edgeProgress: number;

            if (data.revealMode === "simultaneous") {
              const start = 30;
              edgeOpacity = fadeIn(frame, start, timing.entrance.medium);
              edgeProgress = interpolate(frame, [start, start + timing.entrance.medium], [0, 1], CLAMP);
            } else {
              const edgeStart = levelEdgeStartFrame(targetLevel);
              const edgeDuration = timing.entrance.medium;
              edgeOpacity = fadeIn(frame, edgeStart, timing.entrance.fast);
              edgeProgress = interpolate(frame, [edgeStart, edgeStart + edgeDuration], [0, 1], CLAMP);
            }

            return (
              <OrgChartEdgeLine
                key={`edge-${edge.fromId}-${edge.toId}-${i}`}
                edge={edge}
                opacity={edgeOpacity}
                progress={edgeProgress}
                isDark={isDark}
              />
            );
          })}

          {/* Nodes */}
          {nodeLayouts.map((nodeLayout, i) => {
            const node = data.nodes.find((n) => n.id === nodeLayout.id)!;
            const level = nodeLayout.level;

            let nodeOpacity: number;
            if (data.revealMode === "simultaneous") {
              nodeOpacity = fadeIn(frame, 25, timing.entrance.medium);
            } else if (data.revealMode === "left-right") {
              // Sort by X position within level
              const sameLevel = nodeLayouts.filter((n) => n.level === level);
              const sortedByX = [...sameLevel].sort((a, b) => a.x - b.x);
              const posInLevel = sortedByX.findIndex((n) => n.id === nodeLayout.id);
              const staggerStart = levelNodeStartFrame(level) + posInLevel * timing.stagger.normal;
              nodeOpacity = fadeIn(frame, staggerStart, timing.entrance.crisp);
            } else {
              // top-down (default)
              const staggerStart =
                levelNodeStartFrame(level) + (i % Math.max(1, nodeLayouts.filter((n) => n.level === level).length)) * timing.stagger.tight;
              nodeOpacity = fadeIn(frame, staggerStart, timing.entrance.crisp);
            }

            // Highlight chain pulse
            const pulse = chainPulseByNodeId.get(nodeLayout.id);
            let pulseScale = 1.0;
            let isHighlighted = false;
            if (pulse) {
              const mid = (pulse.start + pulse.end) / 2;
              const up = interpolate(frame, [pulse.start, mid], [1.0, 1.03], CLAMP_CUBIC);
              const down = interpolate(frame, [mid, pulse.end], [1.03, 1.0], CLAMP_CUBIC);
              pulseScale = frame < mid ? up : down;
              isHighlighted = frame >= pulse.start && frame <= pulse.end;
            }

            return (
              <OrgChartNodeBox
                key={`node-${nodeLayout.id}`}
                node={node}
                layout={nodeLayout}
                opacity={nodeOpacity}
                isDark={isDark}
                pulseScale={pulseScale}
                isHighlighted={isHighlighted}
              />
            );
          })}
        </svg>

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
        <FooterStrip mode={mode} />
      </AbsoluteFill>
    </Background>
  );
};

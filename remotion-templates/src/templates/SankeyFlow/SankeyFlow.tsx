/**
 * SankeyFlow — animated Sankey/funnel diagrams.
 *
 * Shows how values flow through stages: sources → intermediates → destinations.
 * Nodes display as rounded rectangles (height ∝ value), links as curved paths
 * (thickness ∝ value). Links draw in left-to-right, values count up on arrival.
 *
 * EP01 use case: CHIPS Act funding flow (authorized → awarded → disbursed).
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  gradients,
  light,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  stagger,
  kenBurnsDrift,
  exitFade,
  bloomIntensity,
  easings,
  CLAMP_SINE,
} from "../../utils/animation";
import { lineDrawProgress } from "../../utils/drawLine";
import { countUpValue, formatValue } from "../../utils/countUp";
import { Background } from "../../components/Background";
import { FadeIn } from "../../components/FadeIn";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { SankeyFlowData, SankeyNode, SankeyLink } from "./types";

// ── Types ────────────────────────────────────────────────────────────────

interface LayoutNode extends SankeyNode {
  /** Pixel x position (left edge) */
  x: number;
  /** Pixel y position (top edge) */
  y: number;
  /** Pixel width */
  width: number;
  /** Pixel height */
  height: number;
}

interface LayoutLink extends SankeyLink {
  /** Source node output position */
  x1: number;
  y1: number;
  /** Destination node input position */
  x2: number;
  y2: number;
  /** Link thickness in pixels */
  thickness: number;
}

// ── Layout algorithm ────────────────────────────────────────────────────

const layoutSankey = (
  nodes: SankeyNode[],
  links: SankeyLink[],
  chartWidth: number,
  chartHeight: number
): { nodes: LayoutNode[]; links: LayoutLink[] } => {
  // Group nodes by column
  const byColumn = new Map<number, SankeyNode[]>();
  nodes.forEach((n) => {
    if (!byColumn.has(n.column)) byColumn.set(n.column, []);
    byColumn.get(n.column)!.push(n);
  });

  // Sort columns
  const columns = Array.from(byColumn.keys()).sort((a, b) => a - b);
  const columnCount = columns.length;

  // Compute column x positions
  const colWidth = chartWidth / columnCount;
  const colXOffsets = new Map<number, number>();
  columns.forEach((col, idx) => {
    colXOffsets.set(col, idx * colWidth + colWidth * 0.5 - colWidth * 0.4);
  });

  // Compute node positions within each column
  const layoutNodes: LayoutNode[] = [];
  const nodeIdToLayout = new Map<string, LayoutNode>();

  columns.forEach((col) => {
    const colNodes = byColumn.get(col)!;
    const totalValue = colNodes.reduce((sum, n) => sum + n.value, 0);

    // Sort by value descending for visual priority
    colNodes.sort((a, b) => b.value - a.value);

    let y = layout.safeArea.top;
    const nodeWidth = colWidth * 0.3;
    const availHeight = chartHeight - layout.safeArea.top * 2;

    colNodes.forEach((node) => {
      const nodeHeight = (node.value / totalValue) * availHeight * 0.85;
      const x = colXOffsets.get(col)!;

      const layoutNode: LayoutNode = {
        ...node,
        x,
        y,
        width: nodeWidth,
        height: nodeHeight,
      };

      layoutNodes.push(layoutNode);
      nodeIdToLayout.set(node.id, layoutNode);
      y += nodeHeight + 20; // spacing between nodes
    });
  });

  // Compute link paths
  const layoutLinks: LayoutLink[] = links.map((link) => {
    const fromNode = nodeIdToLayout.get(link.from)!;
    const toNode = nodeIdToLayout.get(link.to)!;

    // Source: right edge of from-node, middle height
    const x1 = fromNode.x + fromNode.width;
    const y1 = fromNode.y + fromNode.height / 2;

    // Destination: left edge of to-node, middle height
    const x2 = toNode.x;
    const y2 = toNode.y + toNode.height / 2;

    // Link thickness proportional to flow value
    const maxLinkValue = Math.max(...links.map((l) => l.value));
    const minThickness = 2;
    const maxThickness = 16;
    const thickness =
      minThickness +
      (link.value / maxLinkValue) * (maxThickness - minThickness);

    return {
      ...link,
      x1,
      y1,
      x2,
      y2,
      thickness,
    };
  });

  return { nodes: layoutNodes, links: layoutLinks };
};

// ── Cubic bezier curve path ──────────────────────────────────────────────

const cubicBezierPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string => {
  const cx1 = x1 + (x2 - x1) * 0.3;
  const cy1 = y1;
  const cx2 = x1 + (x2 - x1) * 0.7;
  const cy2 = y2;

  return `M ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}`;
};

// ── Path length estimator (for dash animation) ──────────────────────────

const estimatePathLength = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const straightDist = Math.sqrt(dx * dx + dy * dy);
  // Bezier curves are ~1.1x the straight-line distance
  return straightDist * 1.15;
};

// ── Animated sankey node ─────────────────────────────────────────────────

const SankeyNodeComponent: React.FC<{
  node: LayoutNode;
  frame: number;
  startFrame: number;
  showValue: boolean;
  valuePrefix: string;
  valueSuffix: string;
  isSource: boolean;
}> = React.memo(
  ({ node, frame, startFrame, showValue, valuePrefix, valueSuffix, isSource }) => {
    // Fade in + slide
    const slideDir = isSource ? -40 : 40;
    const slideProgress = fadeIn(frame, startFrame, sec(0.4));
    const slideX = slideDir * (1 - slideProgress);

    const opacity = fadeIn(frame, startFrame, sec(0.3));

    // Value label appears after node slides in
    const valueLabelStart = startFrame + sec(0.5);
    const valueLabelOpacity = interpolate(
      frame,
      [valueLabelStart, valueLabelStart + sec(0.3)],
      [0, 1],
      CLAMP_SINE
    );

    const displayValue = showValue
      ? countUpValue({
          to: node.value,
          startFrame: valueLabelStart,
          duration: sec(0.6),
          frame,
        })
      : 0;

    const nodeColor = node.color || palette.amber;

    return (
      <div
        style={{
          position: "absolute",
          left: node.x + slideX,
          top: node.y,
          width: node.width,
          height: node.height,
          opacity,
        }}
      >
        {/* Node box — rounded rect with gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${nodeColor}cc 0%, ${nodeColor}99 100%)`,
            borderRadius: 6,
            boxShadow: `0 4px 12px ${nodeColor}40, ${shadows.textLift}`,
            border: `1px solid ${nodeColor}60`,
          }}
        />

        {/* Label — positioned to the right for middle columns, left for rightmost */}
        {node.label && (
          <div
            style={{
              position: "absolute",
              right: "100%",
              top: "50%",
              transform: "translateY(-50%)",
              marginRight: 12,
              fontSize: fontSizes.caption,
              fontWeight: 600,
              fontFamily: fonts.heading,
              color: light.text.primary,
              whiteSpace: "nowrap",
              textShadow: shadows.textLift,
              opacity: fadeIn(frame, startFrame + sec(0.1), sec(0.2)),
            }}
          >
            {node.label}
          </div>
        )}

        {/* Value label */}
        {showValue && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: valueLabelOpacity,
            }}
          >
            <div
              style={{
                fontSize: fontSizes.body,
                fontWeight: 700,
                fontFamily: fonts.mono,
                color: "white",
                textShadow: `0 2px 8px ${nodeColor}80`,
              }}
            >
              {formatValue(displayValue, {
                decimals: displayValue >= 1 ? 1 : 2,
              })}
              <span style={{ fontSize: fontSizes.caption, marginLeft: 2 }}>
                {valuePrefix}
                {valueSuffix}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

SankeyNodeComponent.displayName = "SankeyNodeComponent";

// ── Animated sankey link ─────────────────────────────────────────────────

const SankeyLinkComponent: React.FC<{
  link: LayoutLink;
  frame: number;
  startFrame: number;
  columnCount: number;
}> = React.memo(({ link, frame, startFrame, columnCount }) => {
  const pathLength = estimatePathLength(link.x1, link.y1, link.x2, link.y2);

  // Stagger link draws by column distance
  const colDistance = Math.abs(link.from.charCodeAt(0) - link.to.charCodeAt(0));
  const linkStartFrame = startFrame + sec(0.2 + colDistance * 0.15);

  const drawProgress = lineDrawProgress(
    frame,
    linkStartFrame,
    sec(0.8),
    easings.structure
  );

  const opacity = fadeIn(frame, linkStartFrame, sec(0.2));

  const linkColor = link.color || palette.amber;

  // Blur and glow effect during draw
  const glowOpacity = Math.max(0, 1 - drawProgress * 1.5) * opacity;

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      height={layout.height}
    >
      <defs>
        <filter id={`link-glow-${link.from}-${link.to}`}>
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Glow layer */}
      {glowOpacity > 0 && (
        <path
          d={cubicBezierPath(link.x1, link.y1, link.x2, link.y2)}
          stroke={linkColor}
          strokeWidth={link.thickness * 2}
          fill="none"
          opacity={glowOpacity * 0.3}
          filter={`url(#link-glow-${link.from}-${link.to})`}
        />
      )}

      {/* Main link — filled with gradient, drawn via clip-path */}
      <g
        style={{
          clipPath: `inset(0 ${100 * (1 - drawProgress)}% 0 0)`,
        }}
      >
        <path
          d={cubicBezierPath(link.x1, link.y1, link.x2, link.y2)}
          stroke={linkColor}
          strokeWidth={link.thickness}
          fill="none"
          opacity={opacity * 0.6}
        />
      </g>

      {/* Outline stroke */}
      <path
        d={cubicBezierPath(link.x1, link.y1, link.x2, link.y2)}
        stroke={linkColor}
        strokeWidth={1}
        fill="none"
        opacity={opacity * 0.4}
      />
    </svg>
  );
});

SankeyLinkComponent.displayName = "SankeyLinkComponent";

// ── Main SankeyFlow component ────────────────────────────────────────────

export const SankeyFlow: React.FC<{ data: SankeyFlowData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const {
    title,
    subtitle,
    nodes,
    links,
    showValues = true,
    valuePrefix = "",
    valueSuffix = "",
    source,
    durationSec = 8,
    backgroundTint,
  } = data;

  const { style: compStyle } = useCompositionAnimation();

  // Layout
  const chartWidth = width - layout.safeArea.left - layout.safeArea.right;
  const chartHeight = height - layout.safeArea.top - layout.safeArea.bottom - fontSizes.h1 - 40;

  const { nodes: layoutNodes, links: layoutLinks } = useMemo(
    () => layoutSankey(nodes, links, chartWidth, chartHeight),
    [nodes, links, chartWidth, chartHeight]
  );

  // Animation timeline
  const titleFrameStart = 0;
  const titleFrameEnd = sec(0.8);
  const sourceNodesStart = sec(0.3);
  const linksStart = sec(1.2);
  const otherNodesStart = sec(1.5);
  const exitStart = sec(durationSec - 1.5);

  // Source nodes (leftmost column)
  const sourceNodeIds = new Set(
    layoutNodes.filter((n) => n.column === 0).map((n) => n.id)
  );

  // Render

  return (
    <AbsoluteFill style={{ background: light.bg.base, ...compStyle }}>
      <Background tint={backgroundTint} />

      {/* Title */}
      <FadeIn startFrame={titleFrameStart} duration={sec(0.5)}>
        <div
          style={{
            position: "absolute",
            left: layout.safeArea.left,
            top: layout.safeArea.top,
            zIndex: 10,
          }}
        >
          <h1
            style={{
              fontSize: fontSizes.h1,
              fontFamily: fonts.display,
              fontWeight: 700,
              color: light.text.primary,
              margin: 0,
              marginBottom: 8,
              textShadow: shadows.textLift,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: fontSizes.body,
                fontFamily: fonts.heading,
                color: light.text.muted,
                margin: 0,
                textShadow: shadows.textLift,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </FadeIn>

      {/* Chart area — Ken Burns drift for camera energy */}
      <div
        style={{
          position: "absolute",
          left: layout.safeArea.left,
          top: layout.safeArea.top + fontSizes.h1 + 40,
          width: chartWidth,
          height: chartHeight,
          transform: `scale(${kenBurnsDrift(frame, durationInFrames, 1.02)})`,
          transformOrigin: "center center",
        }}
      >
        {/* Render links first (behind nodes) */}
        {layoutLinks.map((link) => (
          <SankeyLinkComponent
            key={`link-${link.from}-${link.to}`}
            link={link}
            frame={frame}
            startFrame={linksStart}
            columnCount={Math.max(...nodes.map((n) => n.column)) + 1}
          />
        ))}

        {/* Render nodes */}
        {layoutNodes.map((node) => {
          const isSourceNode = sourceNodeIds.has(node.id);
          const nodeStartFrame = isSourceNode ? sourceNodesStart : otherNodesStart;

          return (
            <SankeyNodeComponent
              key={`node-${node.id}`}
              node={node}
              frame={frame}
              startFrame={nodeStartFrame}
              showValue={showValues}
              valuePrefix={valuePrefix}
              valueSuffix={valueSuffix}
              isSource={isSourceNode}
            />
          );
        })}
      </div>

      {/* Source attribution — slideIn (no naked fade) */}
      {source && (
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom,
            left: layout.safeArea.left,
            fontSize: fontSizes.caption,
            fontFamily: fonts.mono,
            color: light.text.muted,
            opacity: fadeIn(frame, titleFrameEnd, sec(0.4)),
            transform: `translateY(${slideIn(frame, titleFrameEnd, 10, sec(0.5))}px)`,
            textShadow: shadows.textLift,
          }}
        >
          {source}
        </div>
      )}

      {/* Exit fade */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "black",
          opacity: exitFade(frame, exitStart, sec(1)),
        }}
      />
    </AbsoluteFill>
  );
};

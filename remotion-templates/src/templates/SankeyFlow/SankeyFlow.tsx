/**
 * SankeyFlow — animated Sankey/funnel diagrams.
 *
 * Shows how values flow through stages: sources → intermediates → destinations.
 * Nodes display as rounded rectangles (height ∝ value), links as curved paths
 * (thickness ∝ value). Links draw in left-to-right, values count up on arrival.
 *
 * silicon-trap use case: CHIPS Act funding flow (authorized → awarded → disbursed).
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
  layout,
  sec,
  shadows,
  contentArea,
  radii,
  cardPresets,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  slideIn,
  exitFade,
  easings,
  CLAMP_SINE,
} from "../../utils/animation";
import { lineDrawProgress } from "../../utils/drawLine";
import { countUpValue } from "../../utils/countUp";
import { formatNumber } from "../../utils/numberFormat";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { AmbientParticles } from "../../components/AmbientParticles";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
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
      y += nodeHeight + layout.spacing.md; // spacing between nodes
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

// ── Flow particles along bezier paths ────────────────────────────────────

/** Evaluate a cubic bezier at parameter t (0-1) */
const bezierPoint = (
  x1: number, y1: number, x2: number, y2: number, t: number
): { x: number; y: number } => {
  const cx1 = x1 + (x2 - x1) * 0.3;
  const cy1 = y1;
  const cx2 = x1 + (x2 - x1) * 0.7;
  const cy2 = y2;

  const u = 1 - t;
  const x = u * u * u * x1 + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * x2;
  const y = u * u * u * y1 + 3 * u * u * t * cy1 + 3 * u * t * t * cy2 + t * t * t * y2;
  return { x, y };
};

const FlowParticlesLayer: React.FC<{
  links: LayoutLink[];
  frame: number;
  startFrame: number;
  speed: number;
  density: number;
}> = React.memo(({ links, frame, startFrame, speed, density }) => {
  // Only show after links have started drawing
  const opacity = fadeIn(frame, startFrame + sec(1.2), sec(0.5));
  if (opacity <= 0) return null;

  const maxLinkValue = Math.max(...links.map((l) => l.thickness), 1);

  return (
    <svg
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      height={layout.height}
    >
      <g opacity={opacity}>
        {links.map((link, linkIdx) => {
          // Number of particles proportional to flow thickness
          const particleCount = Math.max(2, Math.round((link.thickness / maxLinkValue) * 6 * density));
          const color = link.color || palette.amber;

          return Array.from({ length: particleCount }, (_, pIdx) => {
            // Each particle has a phase offset for even distribution
            const phaseOffset = pIdx / particleCount;
            // Speed varies slightly per particle for natural feel
            const particleSpeed = speed * (0.8 + (pIdx % 3) * 0.2);
            // T position along the curve (wrapping 0-1)
            const rawT = ((frame * particleSpeed * 0.008) + phaseOffset) % 1;
            const pos = bezierPoint(link.x1, link.y1, link.x2, link.y2, rawT);
            // Tangent direction — sample slightly ahead to compute angle
            const ahead = bezierPoint(link.x1, link.y1, link.x2, link.y2, Math.min(0.99, rawT + 0.01));
            const angleDeg = (Math.atan2(ahead.y - pos.y, ahead.x - pos.x) * 180) / Math.PI;

            // Particle size proportional to link thickness
            const baseSize = 1.5 + (link.thickness / maxLinkValue) * 2;
            // 3:1 elongated oval
            const rx = baseSize * 1.8;
            const ry = baseSize * 0.6;
            // Fade at endpoints
            const edgeFade = Math.min(rawT * 5, (1 - rawT) * 5, 1);

            return (
              <ellipse
                key={`particle-${linkIdx}-${pIdx}`}
                cx={pos.x}
                cy={pos.y}
                rx={rx}
                ry={ry}
                fill={color}
                opacity={0.65 * edgeFade}
                transform={`rotate(${angleDeg} ${pos.x} ${pos.y})`}
              />
            );
          });
        })}
      </g>
    </svg>
  );
});

FlowParticlesLayer.displayName = "FlowParticlesLayer";

// ── Animated sankey node ─────────────────────────────────────────────────

const SankeyNodeComponent: React.FC<{
  node: LayoutNode;
  frame: number;
  startFrame: number;
  showValue: boolean;
  valuePrefix: string;
  valueSuffix: string;
  isSource: boolean;
  mode: "light" | "dark";
}> = React.memo(
  ({ node, frame, startFrame, showValue, valuePrefix, valueSuffix, isSource, mode }) => {
    const theme = useThemeMode(mode);
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
        {/* Node box — inset style (pressed-into-paper, editorial) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            ...cardPresets.inset(mode === "dark"),
            padding: 0,  // override preset padding — node uses absolute positioning
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
              marginRight: layout.spacing.sm,
              fontSize: fontSizes.caption,
              fontWeight: 600,
              fontFamily: fonts.heading,
              color: theme.text.primary,
              whiteSpace: "nowrap",
              textShadow: shadows.textLift,
              opacity: fadeIn(frame, startFrame + sec(0.1), sec(0.2)),
            }}
          >
            {node.label}
          </div>
        )}

        {/* Value label — prominent with larger text and enhanced shadow */}
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
                fontSize: fontSizes.h3,
                fontWeight: 700,
                fontFamily: fonts.mono,
                color: nodeColor,
                textShadow: `0 2px 8px ${nodeColor}40, 0 4px 12px rgba(0,0,0,0.15)`,
              }}
            >
              {formatNumber(displayValue, {
                decimals: displayValue >= 1 ? 1 : 2,
                style: displayValue >= 1000 ? "abbreviated" : "decimal",
              })}
              <span style={{ fontSize: fontSizes.label, marginLeft: 4 }}>
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
  sourceColor?: string;
  targetColor?: string;
}> = React.memo(({ link, frame, startFrame, columnCount, sourceColor, targetColor }) => {
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
  const fromColor = sourceColor || linkColor;
  const toColor = targetColor || linkColor;

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
        {/* Color-blend gradient: source color at start, destination color at end */}
        <linearGradient id={`link-opacity-${link.from}-${link.to}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fromColor} stopOpacity={0.65} />
          <stop offset="100%" stopColor={toColor} stopOpacity={0.45} />
        </linearGradient>
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

      {/* Main link — elegant gradient opacity (60% → 40%), drawn via clip-path */}
      <g
        style={{
          clipPath: `inset(0 ${100 * (1 - drawProgress)}% 0 0)`,
        }}
      >
        <path
          d={cubicBezierPath(link.x1, link.y1, link.x2, link.y2)}
          stroke={`url(#link-opacity-${link.from}-${link.to})`}
          strokeWidth={link.thickness}
          fill="none"
          opacity={opacity}
        />
      </g>

      {/* Outline stroke — elegant separator */}
      <path
        d={cubicBezierPath(link.x1, link.y1, link.x2, link.y2)}
        stroke={linkColor}
        strokeWidth={0.5}
        fill="none"
        opacity={opacity * 0.3}
      />
    </svg>
  );
});

SankeyLinkComponent.displayName = "SankeyLinkComponent";

// ── Main SankeyFlow component ────────────────────────────────────────────

export const SankeyFlow: React.FC<{ data: SankeyFlowData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const theme = useThemeMode(data.backgroundVariant || "light");
  const { width, height, durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);

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

  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  // Layout
  const area = contentArea("content", "generous");
  const chartWidth = area.width;
  const chartHeight = area.height - fontSizes.h1 - layout.spacing.xl;

  const { nodes: layoutNodes, links: layoutLinks } = useMemo(
    () => layoutSankey(nodes, links, chartWidth, chartHeight),
    [nodes, links, chartWidth, chartHeight]
  );

  // Animation timeline
  // titleFrameStart = 0 (implicit)
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
    <Background
      variant={data.backgroundVariant || "light"}
      tint={direction.backgroundTint ?? backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* Brand strips */}
        <HeaderStrip mode={data.backgroundVariant || "light"} metadata={data.episode} />
        <FooterStrip mode={data.backgroundVariant || "light"} />

        {/* Opt-in extra particles — Background already provides default atmosphere */}
        {data.ambientParticles && (
          <AmbientParticles
            mode={(data.backgroundVariant || "light") as "light" | "dark"}
            density={18}
            speed={0.25}
            maxOpacity={0.08}
          />
        )}

      {/* Title */}
      <TitleBlock title={title} subtitle={subtitle} mode="light" safeAreaTier="generous" />

      {/* Chart area */}
      <div
        style={{
          position: "absolute",
          left: area.left,
          top: area.top + fontSizes.h1 + layout.spacing.xl,
          width: chartWidth,
          height: chartHeight,
        }}
      >
        {/* Render links first (behind nodes) — source/target node colors blend along path */}
        {layoutLinks.map((link) => {
          const fromNode = layoutNodes.find((n) => n.id === link.from);
          const toNode = layoutNodes.find((n) => n.id === link.to);
          return (
            <SankeyLinkComponent
              key={`link-${link.from}-${link.to}`}
              link={link}
              frame={frame}
              startFrame={linksStart}
              columnCount={Math.max(...nodes.map((n) => n.column)) + 1}
              sourceColor={fromNode?.color}
              targetColor={toNode?.color}
            />
          );
        })}

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
              mode={(data.backgroundVariant || "light") as "light" | "dark"}
            />
          );
        })}

        {/* Flow particles — animated dots along link paths */}
        {data.flowParticles && (
          <FlowParticlesLayer
            links={layoutLinks}
            frame={frame}
            startFrame={linksStart}
            speed={data.particleSpeed ?? 1.0}
            density={data.particleDensity ?? 1.0}
          />
        )}
      </div>

      {/* Source attribution — slideIn (no naked fade) */}
      {source && (
        <div
          style={{
            position: "absolute",
            bottom: area.bottom,
            left: area.left,
            fontSize: fontSizes.caption,
            fontFamily: fonts.mono,
            color: theme.text.muted,
            opacity: fadeIn(frame, titleFrameEnd, sec(0.4)),
            transform: `translateY(${slideIn(frame, titleFrameEnd, layout.spacing.xs, sec(0.5))}px)`,
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
    </Background>
  );
};

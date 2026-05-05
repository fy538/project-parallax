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
  getCategoricalColor,
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
import { SourceAttribution } from "../../components/SourceAttribution";
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
  /** Source node right edge (constant per source) */
  x1: number;
  /** Destination node left edge (constant per dest) */
  x2: number;
  /** Centerline endpoints — kept for FlowParticles' bezier sampling */
  y1: number;
  y2: number;
  /** Source-side ribbon edges (top + bottom along source node's right edge) */
  sourceY0: number;
  sourceY1: number;
  /** Destination-side ribbon edges (top + bottom along dest node's left edge) */
  targetY0: number;
  targetY1: number;
  /** Average ribbon thickness — used by FlowParticles + outline stroke */
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

  // Compute column x positions — centered within their slots so the
  // diagram as a whole has equal horizontal padding either side.
  // Nodes are thin colored bars (D3-Sankey convention): width is purely
  // a visual marker, not a data dimension. The bar's HEIGHT carries the
  // value. Width 14px gives just enough mass for the colored stripe to
  // read cleanly without competing with the ribbons it terminates.
  const colWidth = chartWidth / columnCount;
  const nodeWidth = 14;
  const colXOffsets = new Map<number, number>();
  columns.forEach((col, idx) => {
    // Center each bar within its slot.
    colXOffsets.set(col, idx * colWidth + (colWidth - nodeWidth) / 2);
  });

  // Compute node positions within each column.
  // Each column's stack is centered vertically within availHeight so that
  // smaller columns (e.g. fewer/lighter destinations) don't anchor to the
  // top of the canvas. Vertical padding is small (just enough to keep
  // labels from clipping), since the chart-area div is already inside
  // the safe area — no need to pad twice.
  const layoutNodes: LayoutNode[] = [];
  const nodeIdToLayout = new Map<string, LayoutNode>();
  const verticalPad = layout.spacing.xl; // ~48px instead of 80px
  const availHeight = chartHeight - verticalPad * 2;

  columns.forEach((col) => {
    const colNodes = byColumn.get(col)!;
    const totalValue = colNodes.reduce((sum, n) => sum + n.value, 0);

    // Sort by value descending for visual priority
    colNodes.sort((a, b) => b.value - a.value);

    // Pre-compute total stack height (nodes + inter-node gaps) so the
    // stack can be centered vertically within the available area.
    const gap = layout.spacing.md;
    const totalNodeHeight =
      colNodes.reduce(
        (sum, n) => sum + (n.value / totalValue) * availHeight * 0.85,
        0
      ) + gap * (colNodes.length - 1);
    // Bias toward the upper portion (35% of empty space above, 65% below)
    // — vertically centred sankeys feel low because the eye expects the
    // headline content close to the title.
    const stackTop = verticalPad + Math.max(0, (availHeight - totalNodeHeight) * 0.35);

    let y = stackTop;

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
      y += nodeHeight + gap; // spacing between nodes
    });
  });

  // Pre-compute per-node total outflow and inflow.
  const outflowByNode = new Map<string, number>();
  const inflowByNode = new Map<string, number>();
  links.forEach((link) => {
    outflowByNode.set(link.from, (outflowByNode.get(link.from) ?? 0) + link.value);
    inflowByNode.set(link.to, (inflowByNode.get(link.to) ?? 0) + link.value);
  });

  // Sort links to minimize crossings — the canonical D3-Sankey trick.
  // Outflows on a source node are stacked top-to-bottom in order of their
  // destination's vertical position; same idea on the destination side.
  // Sorting by (sourceY, targetY) before stacking gives both at once.
  const sortedLinks = [...links].sort((a, b) => {
    const aFrom = nodeIdToLayout.get(a.from)!;
    const bFrom = nodeIdToLayout.get(b.from)!;
    if (aFrom.y !== bFrom.y) return aFrom.y - bFrom.y;
    const aTo = nodeIdToLayout.get(a.to)!;
    const bTo = nodeIdToLayout.get(b.to)!;
    return aTo.y - bTo.y;
  });

  // Track stacking offsets per node — each outflow consumes a slice of the
  // source node's right edge starting where the previous outflow ended.
  const outflowOffset = new Map<string, number>();
  const inflowOffset = new Map<string, number>();

  // Compute ribbon endpoints for each link.
  const layoutLinks: LayoutLink[] = sortedLinks.map((link) => {
    const fromNode = nodeIdToLayout.get(link.from)!;
    const toNode = nodeIdToLayout.get(link.to)!;

    const fromTotalOutflow = outflowByNode.get(link.from) || link.value;
    const toTotalInflow = inflowByNode.get(link.to) || link.value;

    // Each link's source-side thickness is its share of the source node's
    // outflow, scaled to the source node's height. Similarly for dest side.
    const sourceThickness = (link.value / fromTotalOutflow) * fromNode.height;
    const targetThickness = (link.value / toTotalInflow) * toNode.height;

    // Source edge range — stack along right edge of from-node.
    const sourceOffset = outflowOffset.get(link.from) ?? 0;
    const sourceY0 = fromNode.y + sourceOffset;
    const sourceY1 = sourceY0 + sourceThickness;
    outflowOffset.set(link.from, sourceOffset + sourceThickness);

    // Destination edge range — stack along left edge of to-node.
    const targetOffset = inflowOffset.get(link.to) ?? 0;
    const targetY0 = toNode.y + targetOffset;
    const targetY1 = targetY0 + targetThickness;
    inflowOffset.set(link.to, targetOffset + targetThickness);

    const x1 = fromNode.x + fromNode.width;
    const x2 = toNode.x;

    // Centerline endpoints (used by FlowParticles for path sampling).
    const y1 = (sourceY0 + sourceY1) / 2;
    const y2 = (targetY0 + targetY1) / 2;

    // Average thickness — used by FlowParticles + thin outline stroke.
    const thickness = Math.max(2, (sourceThickness + targetThickness) / 2);

    return {
      ...link,
      x1, x2, y1, y2,
      sourceY0, sourceY1,
      targetY0, targetY1,
      thickness,
    };
  });

  return { nodes: layoutNodes, links: layoutLinks };
};

// ── Filled ribbon path — proper professional Sankey rendering ─────────────
//
// The flow is a closed shape with two parallel bezier curves: the top edge
// runs from (x1, sourceY0) to (x2, targetY0); the bottom edge runs from
// (x2, targetY1) back to (x1, sourceY1). Both curves use control points at
// the horizontal midline so the ribbon has a smooth S-curve when source and
// destination are at different vertical positions.
const ribbonPath = (
  x1: number,
  sourceY0: number,
  sourceY1: number,
  x2: number,
  targetY0: number,
  targetY1: number
): string => {
  const mid = (x1 + x2) / 2;
  return [
    `M ${x1.toFixed(1)} ${sourceY0.toFixed(1)}`,
    `C ${mid.toFixed(1)} ${sourceY0.toFixed(1)}, ${mid.toFixed(1)} ${targetY0.toFixed(1)}, ${x2.toFixed(1)} ${targetY0.toFixed(1)}`,
    `L ${x2.toFixed(1)} ${targetY1.toFixed(1)}`,
    `C ${mid.toFixed(1)} ${targetY1.toFixed(1)}, ${mid.toFixed(1)} ${sourceY1.toFixed(1)}, ${x1.toFixed(1)} ${sourceY1.toFixed(1)}`,
    "Z",
  ].join(" ");
};

// ── Cubic bezier curve path (used by FlowParticles for centerline) ────────

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
  /** Where this node sits in the diagram — controls label placement.
   *  "first" → labels outside-left (open margin)
   *  "last"  → labels outside-right (open margin)
   *  "middle" → labels inside the box (between ribbons) */
  nodePosition: "first" | "middle" | "last";
  /** Stable index used to pick a default categorical color when
   *  `node.color` isn't set. Replaces the old "everything → amber" fallback. */
  defaultColorIndex: number;
  mode: "light" | "dark";
}> = React.memo(
  ({ node, frame, startFrame, showValue, valuePrefix, valueSuffix, isSource, nodePosition, defaultColorIndex, mode }) => {
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

    const nodeColor = node.color || getCategoricalColor(defaultColorIndex);

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
        {/* Node bar — thin vertical stripe colored with the node's own color.
            Following D3-Sankey convention: the node is just an end-point
            marker for ribbons; data is in the bar's height (proportional
            to value) and the ribbon thicknesses. Width is purely visual. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: nodeColor,
            opacity: 0.85,
            borderRadius: 2,
            boxShadow: `0 1px 2px ${nodeColor}40`,
          }}
        />

        {/* Label + value block — placement depends on column position.
            With thin colored bars, the label sits IMMEDIATELY outside
            the bar on the side away from the bulk of the ribbons:
              first + middle → outside-LEFT (label hugs the bar on its
                left edge; the colored bar separates label from
                incoming-ribbon termination zone visually)
              last           → outside-RIGHT (open margin)
            This matches how D3-Sankey, Plotly, and Tableau render
            labels — they're always *adjacent* to a colored marker, not
            floating inside an empty box. */}
        {(() => {
          const labelOpacity = fadeIn(frame, startFrame + sec(0.1), sec(0.2));
          // Stronger halo on labels so middle-column labels remain readable
          // when they sit on top of the incoming-ribbon termination zone.
          // Three stacked shadows = subtle paper glow + bottom drop-shadow.
          const labelHalo = mode === "dark"
            ? "0 0 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.5)"
            : "0 0 8px rgba(245,240,232,0.95), 0 0 4px rgba(245,240,232,0.95), 0 1px 2px rgba(0,0,0,0.15)";
          const labelText = (
            <div
              style={{
                fontSize: fontSizes.caption,
                fontWeight: 600,
                fontFamily: fonts.heading,
                color: theme.text.primary,
                whiteSpace: "nowrap",
                textShadow: labelHalo,
                lineHeight: 1.15,
                marginBottom: 4,
              }}
            >
              {node.label}
            </div>
          );
          const valueText = showValue ? (
            <div
              style={{
                fontSize: fontSizes.h3,
                fontWeight: 700,
                fontFamily: fonts.mono,
                color: nodeColor,
                textShadow: `0 2px 8px ${nodeColor}40, 0 4px 12px rgba(0,0,0,0.15)`,
                lineHeight: 1,
                whiteSpace: "nowrap",
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
          ) : null;

          // Common positioning style — label/value stacked vertically,
          // anchored to the node's vertical center.
          const stackStyle: React.CSSProperties = {
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            opacity: labelOpacity * (showValue ? valueLabelOpacity : 1),
          };

          if (nodePosition === "last") {
            // Outside-RIGHT — text in the right margin, left-aligned to bar edge.
            return (
              <div
                style={{
                  ...stackStyle,
                  left: "100%",
                  marginLeft: layout.spacing.sm,
                  alignItems: "flex-start",
                  textAlign: "left",
                }}
              >
                {node.label && labelText}
                {valueText}
              </div>
            );
          }

          // First or middle column — text outside-LEFT, hugging the bar.
          return (
            <div
              style={{
                ...stackStyle,
                right: "100%",
                marginRight: layout.spacing.sm,
                alignItems: "flex-end",
                textAlign: "right",
              }}
            >
              {node.label && labelText}
              {valueText}
            </div>
          );
        })()}
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
        {/* Source-to-destination color gradient applied to the ribbon fill */}
        <linearGradient id={`link-fill-${link.from}-${link.to}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fromColor} stopOpacity={0.55} />
          <stop offset="100%" stopColor={toColor} stopOpacity={0.4} />
        </linearGradient>
      </defs>

      {/* Filled ribbon — drawn via clip-path so it reveals left-to-right.
          This is the canonical Sankey rendering: a closed shape whose top
          and bottom edges are parallel bezier curves stacked along the
          source/dest node edges. */}
      <g
        style={{
          clipPath: `inset(0 ${100 * (1 - drawProgress)}% 0 0)`,
        }}
      >
        <path
          d={ribbonPath(
            link.x1,
            link.sourceY0,
            link.sourceY1,
            link.x2,
            link.targetY0,
            link.targetY1
          )}
          fill={`url(#link-fill-${link.from}-${link.to})`}
          stroke="none"
          opacity={opacity}
        />
      </g>

      {/* Subtle top + bottom outline — separates crossing ribbons visually */}
      <path
        d={ribbonPath(
          link.x1,
          link.sourceY0,
          link.sourceY1,
          link.x2,
          link.targetY0,
          link.targetY1
        )}
        fill="none"
        stroke={linkColor}
        strokeWidth={0.5}
        opacity={opacity * 0.25}
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

      {/* Source attribution — was missing entirely from this template;
          now uses the shared component so position + style match the
          rest of the chart family. */}
      <SourceAttribution source={data.source} mode={data.backgroundVariant || "light"} prefix="Source: " />

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
        {(() => {
          const lastColumn = Math.max(...layoutNodes.map((n) => n.column));
          return layoutNodes.map((node, idx) => {
            const isSourceNode = sourceNodeIds.has(node.id);
            const nodeStartFrame = isSourceNode ? sourceNodesStart : otherNodesStart;

            // Label/value placement follows D3-Sankey convention:
            //   first column → text outside-LEFT (open margin)
            //   last column  → text outside-RIGHT (open margin)
            //   middle cols  → text INSIDE the box (between ribbons)
            const nodePosition: "first" | "middle" | "last" =
              node.column === 0
                ? "first"
                : node.column === lastColumn
                ? "last"
                : "middle";

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
                nodePosition={nodePosition}
                defaultColorIndex={idx}
                mode={(data.backgroundVariant || "light") as "light" | "dark"}
              />
            );
          });
        })()}

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

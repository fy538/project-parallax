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
  textMaxWidth,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  slideIn,
  easings,
  anticipatoryStartFrame,
  CLAMP_SINE,
} from "../../utils/animation";
import { lineDrawProgress } from "../../utils/drawLine";
import { countUpValue } from "../../utils/countUp";
import { formatNumber } from "../../utils/numberFormat";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { AmbientParticles } from "../../components/AmbientParticles";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import type { SankeyFlowData, SankeyNode, SankeyLink } from "./types";
import { warnIf } from "../../utils/dataWarnings";

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
  chartHeight: number,
  nodeAlign: "left" | "right" | "center" | "justify" = "center"
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

  // Guard: empty nodes array → return empty layout rather than dividing by 0.
  if (columnCount === 0) return { nodes: [], links: [] };

  // Compute column x positions — centered within their slots so the
  // diagram as a whole has equal horizontal padding either side.
  // Nodes are thin colored bars (D3-Sankey convention): width is purely
  // a visual marker, not a data dimension. The bar's HEIGHT carries the
  // value. Width 18px gives the colored stripe enough mass to anchor the
  // ribbons it terminates without competing with their flow.
  const colWidth = chartWidth / columnCount;
  const nodeWidth = 18;
  const colXOffsets = new Map<number, number>();
  columns.forEach((col, idx) => {
    // Position each bar within its slot according to nodeAlign.
    // "justify" has the same horizontal meaning as "center" in a custom
    // layout (d3-sankey's justify spreads nodes *vertically*; here we map
    // it to center to avoid misleading x-drift).
    const slotLeft = idx * colWidth;
    let xOffset: number;
    switch (nodeAlign) {
      case "left":
        xOffset = slotLeft;
        break;
      case "right":
        xOffset = slotLeft + colWidth - nodeWidth;
        break;
      case "center":
      case "justify":
      default:
        xOffset = slotLeft + (colWidth - nodeWidth) / 2;
        break;
    }
    colXOffsets.set(col, xOffset);
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

  // Compute ribbon endpoints for each link. Links referencing unknown node IDs
  // are silently dropped rather than crashing — bad data shouldn't kill the render.
  const layoutLinks: LayoutLink[] = sortedLinks.flatMap((link) => {
    const fromNode = nodeIdToLayout.get(link.from);
    const toNode = nodeIdToLayout.get(link.to);
    if (!fromNode || !toNode) return [];

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
  // Per-episode primary accent for link particles when no explicit
  // link.color is set. Direct hook call avoids prop-drilling emphasis
  // through the parent's render path.
  const emphasis = useEpisodeColorEmphasis();
  // Only show after links have started drawing
  const maxLinkValue = useMemo(
    () => Math.max(...links.map((l) => l.thickness), 1),
    [links]
  );

  const opacity = fadeIn(frame, startFrame + sec(1.2), sec(0.5));
  if (opacity <= 0) return null;

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
          const color = link.color || emphasis.primaryAccent;

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
            boxShadow: `0 1px 2px ${nodeColor}40`, // shadows.subtle accent variant (1px offset)
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
            ? `0 0 8px ${palette.ink}D9, 0 0 4px ${palette.ink}D9, 0 1px 2px ${palette.ink}80`
            : `0 0 8px ${palette.paper}F2, 0 0 4px ${palette.paper}F2, 0 1px 2px rgba(0,0,0,0.15)`;
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
                maxWidth: textMaxWidth.node,
                fontWeight: 700,
                fontFamily: fonts.mono,
                color: nodeColor,
                textShadow: `0 2px 8px ${nodeColor}40, 0 4px 12px rgba(0,0,0,0.15)`, // shadows.accentGlow + shadows.subtle composite
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
  /**
   * True when ANY link in the chart has emphasis="accent" — activates the
   * mute/accent hierarchy so non-accent ribbons recede. Default false
   * (equal-weight all flows). See: references/template-research/sankey-flow.md § 6.2
   */
  someAccent?: boolean;
}> = React.memo(({ link, frame, startFrame, columnCount, sourceColor, targetColor, someAccent = false }) => {
  // Per-episode primary accent fallback for unconfigured links.
  const emphasis = useEpisodeColorEmphasis();
  // Stagger link draws by column distance
  const colDistance = Math.abs(link.from.charCodeAt(0) - link.to.charCodeAt(0));
  const linkStartFrame = startFrame + sec(0.2 + colDistance * 0.15);

  const drawProgress = lineDrawProgress(
    frame,
    linkStartFrame,
    sec(0.8),
    easings.structure
  );

  // Editorial emphasis: when someAccent is true (data declared an accent flow),
  // links without `emphasis="accent"` recede to 0.35 opacity. The accent
  // ribbon then unambiguously carries the editorial point.
  const isAccent = link.emphasis === "accent";
  const isMuted = link.emphasis === "muted" || (someAccent && !isAccent);
  const emphasisMultiplier = isMuted ? 0.35 : 1.0;

  const opacity = fadeIn(frame, linkStartFrame, sec(0.2)) * emphasisMultiplier;

  const linkColor = link.color || emphasis.primaryAccent;
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
        {/* Multiply-blend noise filter for ink-on-paper density variation */}
        <filter id={`tx-link-${link.from}-${link.to}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves={3} seed={5} result="n" />
          <feColorMatrix in="n" values="0 0 0 0 0.85  0 0 0 0 0.85  0 0 0 0 0.85  0 0 0 4 -2.5" result="m" />
          <feBlend in="SourceGraphic" in2="m" mode="multiply" />
        </filter>
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
          filter={`url(#tx-link-${link.from}-${link.to})`}
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

  // ── Editorial heuristics (dev-only warnings) ─────────────────────────────
  warnIf(
    !!data.flowParticles && (data.durationSec ?? 8) < 6,
    "SankeyFlow",
    "flowParticles should only be enabled for durationSec >= 6s — at shorter durations particles distract from the ribbon reveal",
  );
  warnIf(
    nodes && nodes.length > 10,
    "SankeyFlow",
    `${nodes.length} nodes — SankeyFlow becomes spaghetti above ~10 nodes. ` +
      `If the editorial point is allocation, prune to the load-bearing flows; ` +
      `if the structure is sequential causation, demote to FrameworkDiagram (flow). ` +
      `See DIAGRAM_TEMPLATE_SELECTOR.md.`,
  );
  warnIf(
    links && links.length > 15,
    "SankeyFlow",
    `${links.length} ribbons — above 15 ribbons cross-over crowding destroys ` +
      `proportion readability. Collapse minor flows into an "other" node or ` +
      `split into staged compositions.`,
  );

  // Layout — `contentArea` already reserves the title clearance + 48px gap,
  // so chart-area top = area.top with no further offset (previous code
  // double-counted by also subtracting fontSizes.h1 + spacing.xl).
  const area = contentArea("content", "generous");
  const chartWidth = area.width;
  const chartHeight = area.height;

  // Aggregate minor terminal nodes into an "Other" bucket BEFORE layout.
  // Prevents the dossier failure mode "any ribbon under ~6px on 1080p" by
  // folding sub-threshold flows into a single visible terminal.
  // See: references/template-research/sankey-flow.md § 6
  const { nodes: aggregatedNodes, links: aggregatedLinks } = useMemo(() => {
    if (!data.aggregateOther) return { nodes, links };
    const threshold = data.aggregateOther.threshold ?? 0.03;
    const otherLabel = data.aggregateOther.label ?? "Other";
    const otherColor = data.aggregateOther.color ?? theme.text.muted;

    // Identify terminal column (max column index).
    const maxColumn = Math.max(...nodes.map((n) => n.column));
    const terminalNodes = nodes.filter((n) => n.column === maxColumn);
    const grandTotal = terminalNodes.reduce((sum, n) => sum + n.value, 0);
    if (grandTotal === 0) return { nodes, links };

    // Partition terminals into kept vs rolled-up.
    const minorIds = new Set(
      terminalNodes.filter((n) => n.value / grandTotal < threshold).map((n) => n.id),
    );
    if (minorIds.size === 0) return { nodes, links };

    // Build "Other" bucket: sum of minor values.
    const otherValue = terminalNodes
      .filter((n) => minorIds.has(n.id))
      .reduce((sum, n) => sum + n.value, 0);
    const otherId = "__sankey_other__";
    const otherNode: SankeyNode = {
      id: otherId,
      label: otherLabel,
      value: otherValue,
      color: otherColor,
      column: maxColumn,
    };

    // Drop minor terminal nodes, append Other.
    const newNodes = [...nodes.filter((n) => !minorIds.has(n.id)), otherNode];

    // Redirect links targeting minor terminals to Other; merge by source.
    const aggregatedLinkMap = new Map<string, SankeyLink>();
    const newLinks: SankeyLink[] = [];
    for (const link of links) {
      if (!minorIds.has(link.to)) {
        newLinks.push(link);
        continue;
      }
      // Merge into a single link per source → Other.
      const key = `${link.from}->${otherId}`;
      const existing = aggregatedLinkMap.get(key);
      if (existing) {
        existing.value += link.value;
      } else {
        const merged: SankeyLink = {
          from: link.from,
          to: otherId,
          value: link.value,
          color: link.color,
        };
        aggregatedLinkMap.set(key, merged);
      }
    }
    return { nodes: newNodes, links: [...newLinks, ...aggregatedLinkMap.values()] };
  }, [nodes, links, data.aggregateOther, theme.text.muted]);

  const { nodes: layoutNodes, links: layoutLinks } = useMemo(
    () => layoutSankey(aggregatedNodes, aggregatedLinks, chartWidth, chartHeight, data.nodeAlign),
    [aggregatedNodes, aggregatedLinks, chartWidth, chartHeight, data.nodeAlign]
  );

  // True when any link declares emphasis="accent" — activates the mute
  // hierarchy in SankeyLinkComponent. See: sankey-flow.md § 6.2
  const someAccentLink = useMemo(
    () => aggregatedLinks.some((l) => l.emphasis === "accent"),
    [aggregatedLinks],
  );

  // Animation timeline
  // titleFrameStart = 0 (implicit)
  const titleFrameEnd = sec(0.8);
  // D17 anticipatory reveal: source nodes settled when narrator names them.
  const firstSyncFrameSF = direction.syncPoints?.[0]?.frame;
  const sourceNodesStart = firstSyncFrameSF != null
    ? anticipatoryStartFrame(firstSyncFrameSF, sec(0.4))
    : sec(0.3); // existing default
  const linksStart = sec(1.2);
  const otherNodesStart = sec(1.5);

  // Source nodes (leftmost column)
  const sourceNodeIds = new Set(
    layoutNodes.filter((n) => n.column === 0).map((n) => n.id)
  );

  const columnCount = useMemo(
    () => (nodes.length > 0 ? Math.max(...nodes.map((n) => n.column)) + 1 : 1),
    [nodes]
  );
  const lastColumn = useMemo(
    () => (layoutNodes.length > 0 ? Math.max(...layoutNodes.map((n) => n.column)) : 0),
    [layoutNodes]
  );

  warnIf(
    data.nodeAlign != null && columnCount < 2,
    "SankeyFlow",
    "nodeAlign has no effect on single-column Sankey diagrams",
  );

  // Render

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
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
      <TitleBlock title={title} subtitle={subtitle} mode="light" safeAreaTier="generous" syncPoints={direction.syncPoints} />

      {/* Source attribution — was missing entirely from this template;
          now uses the shared component so position + style match the
          rest of the chart family. */}
      <SourceAttribution source={data.source} mode={data.backgroundVariant || "light"} prefix="Source: " />

      {/* Source-total kicker (top-left of chart) — names the conservation total
          explicitly so the viewer knows what 100% means. Plex Sans display weight.
          See: references/template-research/sankey-flow.md § 6 */}
      {data.sourceTotal && (
        <div
          style={{
            position: "absolute",
            left: area.left,
            top: area.top - 56,
            opacity: fadeIn(frame, sec(0.2), sec(0.6)),
            transform: `translateY(${slideIn(frame, sec(0.2), 8, sec(0.6))}px)`,
          }}
        >
          <div
            style={{
              fontSize: fontSizes.h2,
              fontFamily: fonts.display,
              fontWeight: 700,
              color: palette.amber,
              lineHeight: 1,
              letterSpacing: -0.5,
              maxWidth: textMaxWidth.h1,
              textShadow: shadows.textLift,
            }}
          >
            {data.sourceTotal.value}
          </div>
          {data.sourceTotal.context && (
            <div
              style={{
                fontSize: fontSizes.caption,
                fontFamily: fonts.body,
                color: theme.text.secondary,
                marginTop: 4,
                maxWidth: textMaxWidth.body,
              }}
            >
              {data.sourceTotal.context}
            </div>
          )}
        </div>
      )}

      {/* Column headers — render above each column's center x. Makes the
          conservation framing explicit (e.g. "Production / Use / Fate").
          See: references/template-research/sankey-flow.md § 6 */}
      {data.columnHeaders && data.columnHeaders.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: area.left,
            top: area.top - 28,
            width: chartWidth,
            height: 24,
            opacity: fadeIn(frame, sec(0.4), sec(0.6)),
          }}
        >
          {data.columnHeaders.map((header, idx) => {
            const colWidth = chartWidth / columnCount;
            const centerX = idx * colWidth + colWidth / 2;
            return (
              <div
                key={`colhead-${idx}`}
                style={{
                  position: "absolute",
                  left: centerX,
                  top: 0,
                  transform: "translateX(-50%)",
                  fontSize: fontSizes.label,
                  fontFamily: fonts.metadata,
                  color: theme.text.muted,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  textShadow: shadows.textLift,
                  maxWidth: colWidth - 16,
                }}
              >
                {header}
              </div>
            );
          })}
        </div>
      )}

      {/* Chart area */}
      <div
        style={{
          position: "absolute",
          left: area.left,
          top: area.top,
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
              columnCount={columnCount}
              sourceColor={fromNode?.color}
              targetColor={toNode?.color}
              someAccent={someAccentLink}
            />
          );
        })}

        {/* Render nodes */}
        {layoutNodes.map((node, idx) => {
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

      </AbsoluteFill>
    </Background>
  );
};

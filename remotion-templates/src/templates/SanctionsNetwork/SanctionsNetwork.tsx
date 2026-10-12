/**
 * SanctionsNetwork — intelligence-briefing register network diagram.
 *
 * Specialized for sanctions architecture: typed nodes (sanctioner / target /
 * relay / sector / institution) connected by typed edges (primary-sanction /
 * secondary-threat / evasion-path / formal-exemption / intermediary).
 *
 * Visual register: classified briefing document — dark background preferred,
 * nodes as labeled rectangles with precise borders, edges as directed arrows.
 * Sector color coding runs through both node sublabels and edge strokes.
 *
 * ── Animation sequence (sequential mode) ─────────────────────────────────
 *
 *   1. Title (frame 0–20)
 *   2. Zone labels fade in (frame 15–30)
 *   3. Sanctioner nodes appear (revealAtSec order)
 *   4. Primary-sanction edges draw in (stroke-dash animation)
 *   5. Target node appears (after first edge drawn)
 *   6. Secondary-threat edges appear
 *   7. Relay nodes appear
 *   8. Evasion-path edges appear (animated particles if animated: true)
 *   9. Sector badges fade in
 *   10. Legend + source attribution (last 3s)
 *
 * @composition-animation: useCompositionAnimation({ noDrift: true })
 *   Network layout IS the spatial argument; no camera drift.
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fonts,
  fontSizes,
  layout,
  palette,
  sec,
  semantic,
} from "../../design/theme";
import { fadeIn, CLAMP } from "../../utils/animation";
import { warnIf } from "../../utils/dataWarnings";
import type { SanctionsNetworkData, SanctionsNode, SanctionsEdge, SanctionsSector } from "./types";

// ── Canvas constants ────────────────────────────────────────────────────────

const CANVAS_W = layout.width;   // 1920
const CANVAS_H = layout.height;  // 1080
const CONTENT_TOP = 160;
const CONTENT_BOTTOM = CANVAS_H - 80;
const CONTENT_LEFT = 60;
const CONTENT_RIGHT = CANVAS_W - 60;
const CONTENT_H = CONTENT_BOTTOM - CONTENT_TOP;
const CONTENT_W = CONTENT_RIGHT - CONTENT_LEFT;

// Node dimensions
const NODE_W_PRIMARY = 200;
const NODE_W_STANDARD = 170;
const NODE_H = 72;
const NODE_H_PRIMARY = 88;
const SECTOR_W = 130;
const SECTOR_H = 36;

// ── Helper: hex color with opacity ─────────────────────────────────────────

function hexWithOpacity(hex: string, opacity: number): string {
  // Parse hex and return rgba
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

// ── Auto layout computation ─────────────────────────────────────────────────

interface NodePosition {
  x: number; // center x in px
  y: number; // center y in px
}

function computeAutoLayout(nodes: SanctionsNode[]): Record<string, NodePosition> {
  const sanctioners = nodes.filter(n => n.type === "sanctioner");
  const targets = nodes.filter(n => n.type === "target");
  const relays = nodes.filter(n => n.type === "relay");
  const sectors = nodes.filter(n => n.type === "sector");
  const institutions = nodes.filter(n => n.type === "institution");

  const positions: Record<string, NodePosition> = {};

  // Sanctioner row: top band (y = 20% of content height from top)
  const sanctionerY = CONTENT_TOP + CONTENT_H * 0.22;
  const sanctionerXStep = CONTENT_W / (sanctioners.length + 1);
  sanctioners.forEach((n, i) => {
    positions[n.id] = { x: CONTENT_LEFT + sanctionerXStep * (i + 1), y: sanctionerY };
  });

  // Target row: center (y = 48% from content top)
  const targetY = CONTENT_TOP + CONTENT_H * 0.5;
  const targetXStep = CONTENT_W / (targets.length + 1);
  targets.forEach((n, i) => {
    positions[n.id] = { x: CONTENT_LEFT + targetXStep * (i + 1), y: targetY };
  });

  // Relay row: lower band (y = 76% from content top)
  const relayY = CONTENT_TOP + CONTENT_H * 0.78;
  const relayXStep = CONTENT_W * 0.75 / (relays.length + 1);
  relays.forEach((n, i) => {
    positions[n.id] = { x: CONTENT_LEFT + relayXStep * (i + 1), y: relayY };
  });

  // Sector badges: right side, vertical stack
  const sectorStartY = CONTENT_TOP + CONTENT_H * 0.3;
  const sectorStep = 56;
  sectors.forEach((n, i) => {
    positions[n.id] = {
      x: CONTENT_RIGHT - SECTOR_W / 2 - 20,
      y: sectorStartY + i * sectorStep,
    };
  });

  // Institutions: near their connected nodes — fallback to mid-left of sanctioner row
  const instY = CONTENT_TOP + CONTENT_H * 0.35;
  const instXStart = CONTENT_LEFT + CONTENT_W * 0.1;
  institutions.forEach((n, i) => {
    positions[n.id] = { x: instXStart + i * 220, y: instY };
  });

  return positions;
}

// ── Edge path computation ──────────────────────────────────────────────────

interface EdgePath {
  d: string;         // SVG path data
  midX: number;      // midpoint x for label placement
  midY: number;      // midpoint y for label placement
  length: number;    // approximate path length in px
}

function computeEdgePath(
  fromPos: NodePosition,
  toPos: NodePosition,
  edgeType: SanctionsEdge["type"],
): EdgePath {
  const x1 = fromPos.x;
  const y1 = fromPos.y;
  const x2 = toPos.x;
  const y2 = toPos.y;

  // Compute perpendicular offset for curved paths
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);

  // Control point offset: perpendicular, 40px magnitude
  const perpX = len > 0 ? (-dy / len) * 40 : 0;
  const perpY = len > 0 ? (dx / len) * 40 : 0;

  // Evasion paths and intermediaries use curve; primary/secondary use near-straight
  const useCurve =
    edgeType === "evasion-path" ||
    edgeType === "intermediary" ||
    edgeType === "formal-exemption";

  if (useCurve) {
    const cx = (x1 + x2) / 2 + perpX;
    const cy = (y1 + y2) / 2 + perpY;
    return {
      d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
      midX: cx * 0.5 + (x1 + x2) / 4 + perpX * 0.25,
      midY: cy * 0.5 + (y1 + y2) / 4 + perpY * 0.25,
      length: len,
    };
  }

  // Slight curve: very small perpendicular offset (10px)
  const smallPerpX = len > 0 ? (-dy / len) * 10 : 0;
  const smallPerpY = len > 0 ? (dx / len) * 10 : 0;
  const cx = (x1 + x2) / 2 + smallPerpX;
  const cy = (y1 + y2) / 2 + smallPerpY;
  return {
    d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
    midX: (x1 + x2) / 2 + smallPerpX * 0.5,
    midY: (y1 + y2) / 2 + smallPerpY * 0.5 - 14,
    length: len,
  };
}

// ── Edge style config ──────────────────────────────────────────────────────

interface EdgeStyleConfig {
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string;
  opacity: number;
}

function getEdgeStyle(
  type: SanctionsEdge["type"],
): EdgeStyleConfig {
  switch (type) {
    case "primary-sanction":
      return {
        stroke: semantic.china,
        strokeWidth: 2.5,
        strokeDasharray: "none",
        opacity: 0.9,
      };
    case "secondary-threat":
      return {
        stroke: palette.umber,
        strokeWidth: 1.8,
        strokeDasharray: "8 5",
        opacity: 0.75,
      };
    case "evasion-path":
      return {
        stroke: semantic.china,
        strokeWidth: 2.0,
        strokeDasharray: "4 4",
        opacity: 0.6,
      };
    case "formal-exemption":
      return {
        stroke: palette.taupe,
        strokeWidth: 1.5,
        strokeDasharray: "2 5",
        opacity: 0.7,
      };
    case "intermediary":
      return {
        stroke: palette.taupe,
        strokeWidth: 1.5,
        strokeDasharray: "none",
        opacity: 0.65,
      };
  }
}

// ── SanctionNode sub-component ─────────────────────────────────────────────

interface SanctionNodeProps {
  node: SanctionsNode;
  pos: NodePosition;
  sectorColor: string | undefined;
  opacity: number;
  mode: "dark" | "light";
}

const SanctionNode = React.memo(function SanctionNode({
  node,
  pos,
  sectorColor,
  opacity,
  mode,
}: SanctionNodeProps) {
  const isPrimary = node.importance === "primary";
  const w = isPrimary ? NODE_W_PRIMARY : NODE_W_STANDARD;
  const h = node.type === "sector" ? SECTOR_H : isPrimary ? NODE_H_PRIMARY : NODE_H;
  const x = pos.x - w / 2;
  const y = pos.y - h / 2;

  const textColor = mode === "dark" ? palette.sand : palette.ink;
  const subTextColor = mode === "dark" ? palette.taupe : palette.umber;

  // Sector badge: pill shape with sector color
  if (node.type === "sector") {
    const sColor = sectorColor ?? palette.taupe;
    return (
      <g opacity={opacity} style={{ pointerEvents: "none" }}>
        <rect
          x={x}
          y={y}
          width={SECTOR_W}
          height={SECTOR_H}
          rx={SECTOR_H / 2}
          fill={hexWithOpacity(sColor, 0.18)}
          stroke={sColor}
          strokeWidth={1.2}
        />
        <text
          x={pos.x}
          y={pos.y + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={sColor}
          fontSize={11}
          fontFamily={fonts.metadata}
          fontWeight={600}
          letterSpacing={1.5}
          style={{ textTransform: "uppercase" }}
        >
          {node.label}
        </text>
      </g>
    );
  }

  // Border color by node type
  let borderColor: string;
  let borderWidth: number;
  let fillColor: string;
  let glow: string | undefined;
  let borderRadius = 4;

  switch (node.type) {
    case "sanctioner":
      borderColor = palette.gold;
      borderWidth = isPrimary ? 2.5 : 2;
      fillColor = mode === "dark" ? palette.midnight : palette.bone;
      break;
    case "target":
      borderColor = semantic.china;
      borderWidth = 2.5;
      fillColor = mode === "dark" ? palette.midnight : palette.bone;
      glow = hexWithOpacity(semantic.china, 0.28);
      break;
    case "relay":
      borderColor = palette.taupe;
      borderWidth = 1.5;
      fillColor = mode === "dark" ? palette.ink : palette.paper;
      borderRadius = 10;
      break;
    case "institution":
      borderColor = palette.umber;
      borderWidth = 1.8;
      fillColor = mode === "dark" ? palette.midnight : palette.bone;
      // Double border: draw a thin outer rect too
      break;
    default:
      borderColor = palette.taupe;
      borderWidth = 1.5;
      fillColor = mode === "dark" ? palette.midnight : palette.bone;
  }

  const labelSize = isPrimary ? 15 : 13;
  const sublabelSize = 10;

  return (
    <g opacity={opacity} style={{ pointerEvents: "none" }}>
      {/* Glow effect for target nodes */}
      {glow && (
        <rect
          x={x - 6}
          y={y - 6}
          width={w + 12}
          height={h + 12}
          rx={borderRadius + 4}
          fill={glow}
          stroke="none"
        />
      )}
      {/* Double-border outer for institution */}
      {node.type === "institution" && (
        <rect
          x={x - 4}
          y={y - 4}
          width={w + 8}
          height={h + 8}
          rx={borderRadius + 2}
          fill="none"
          stroke={borderColor}
          strokeWidth={0.8}
          opacity={0.5}
        />
      )}
      {/* Main box */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={borderRadius}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={borderWidth}
      />
      {/* Sector indicator dot — only for non-sector nodes (sector nodes have their own badge) */}
      {sectorColor && (
        <circle
          cx={x + w - 10}
          cy={y + 10}
          r={4}
          fill={sectorColor}
          opacity={0.85}
        />
      )}
      {/* Label */}
      <text
        x={pos.x}
        y={node.sublabel ? pos.y - 8 : pos.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize={labelSize}
        fontFamily={fonts.metadata}
        fontWeight={isPrimary ? 700 : 600}
        letterSpacing={1.2}
        style={{ textTransform: "uppercase" }}
      >
        {node.label}
      </text>
      {/* Sublabel */}
      {node.sublabel && (
        <text
          x={pos.x}
          y={pos.y + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={subTextColor}
          fontSize={sublabelSize}
          fontFamily={fonts.metadata}
          fontWeight={400}
          letterSpacing={0.5}
        >
          {node.sublabel}
        </text>
      )}
    </g>
  );
});

// ── SanctionEdge sub-component ─────────────────────────────────────────────

interface SanctionEdgeProps {
  edge: SanctionsEdge;
  edgePath: EdgePath;
  sectorColor: string | undefined;
  drawProgress: number; // 0→1 stroke-dash reveal
  particleOffset: number; // animated particle phase offset (0→1 cycle)
  opacity: number;
  uniqueId: string;
}

const SanctionEdge = React.memo(function SanctionEdge({
  edge,
  edgePath,
  sectorColor: _sectorColor,
  drawProgress,
  particleOffset,
  opacity,
  uniqueId,
}: SanctionEdgeProps) {
  const style = getEdgeStyle(edge.type);
  const pathLength = edgePath.length;

  // Stroke-dash draw-in effect: reveal from 0 to pathLength
  const dashOffset = pathLength * (1 - drawProgress);
  const dashArray = `${pathLength} ${pathLength}`;

  // Arrowhead marker id
  const markerId = `arrow-${uniqueId}`;

  return (
    <g opacity={opacity} style={{ pointerEvents: "none" }}>
      <defs>
        <marker
          id={markerId}
          markerWidth={8}
          markerHeight={8}
          refX={6}
          refY={3}
          orient="auto"
        >
          <path
            d="M 0 0 L 6 3 L 0 6 z"
            fill={style.stroke}
            opacity={style.opacity}
          />
        </marker>
      </defs>

      {/* Reveal stroke using dashoffset animation */}
      <path
        d={edgePath.d}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        opacity={style.opacity}
        markerEnd={`url(#${markerId})`}
      />

      {/* Evasion-path particle overlay (animated flowing dots) */}
      {edge.type === "evasion-path" && edge.animated && drawProgress > 0.9 && (
        <>
          {[0, 1 / 3, 2 / 3].map((phase, i) => {
            // Each dot travels along the path. particleOffset cycles 0→1 per second.
            const t = ((particleOffset + phase) % 1);
            // Use a "moving dash" approach: a short dash that rides the path
            const dotOffset = pathLength * (1 - t);
            return (
              <path
                key={i}
                d={edgePath.d}
                fill="none"
                stroke={semantic.china}
                strokeWidth={5}
                strokeDasharray={`4 ${pathLength - 4}`}
                strokeDashoffset={dotOffset}
                strokeLinecap="round"
                opacity={0.75}
              />
            );
          })}
        </>
      )}

      {/* Edge label */}
      {edge.label && drawProgress > 0.6 && (
        <text
          x={edgePath.midX}
          y={edgePath.midY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={style.stroke}
          fontSize={9}
          fontFamily={fonts.metadata}
          fontWeight={500}
          letterSpacing={0.5}
          opacity={interpolate(drawProgress, [0.6, 1.0], [0, 0.8], CLAMP)}
          style={{ textTransform: "uppercase" }}
        >
          {edge.label}
        </text>
      )}
    </g>
  );
});

// ── LegendRow sub-component ────────────────────────────────────────────────

interface LegendRowProps {
  label: string;
  edgeType: SanctionsEdge["type"];
  y: number;
}

const LegendRow = React.memo(function LegendRow({ label, edgeType, y }: LegendRowProps) {
  const style = getEdgeStyle(edgeType);
  const lineX1 = 72;
  const lineX2 = 120;
  const textX = 128;

  return (
    <g>
      <line
        x1={lineX1}
        y1={y}
        x2={lineX2}
        y2={y}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray === "none" ? undefined : style.strokeDasharray}
        strokeLinecap="round"
        opacity={style.opacity}
      />
      {/* Arrowhead */}
      <polygon
        points={`${lineX2},${y - 4} ${lineX2 + 8},${y} ${lineX2},${y + 4}`}
        fill={style.stroke}
        opacity={style.opacity}
      />
      <text
        x={textX + 8}
        y={y + 1}
        dominantBaseline="middle"
        fill={palette.taupe}
        fontSize={10}
        fontFamily={fonts.metadata}
        fontWeight={400}
        letterSpacing={0.5}
      >
        {label}
      </text>
    </g>
  );
});

// ── Main component ─────────────────────────────────────────────────────────

export const SanctionsNetwork: React.FC<{ data: SanctionsNetworkData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });
  // Default to "dark" — SanctionsNetwork uses the classified-briefing register
  // which is always dark. A light backgroundVariant is unusual but supported.
  const themeTokens = useThemeMode(data.backgroundVariant ?? "dark");
  const mode = themeTokens.mode;

  // ── Data warnings ─────────────────────────────────────────────────────────
  warnIf(
    data.nodes.length > 20,
    "SanctionsNetwork",
    `${data.nodes.length} nodes exceed the 20-node max — layout will be crowded.`
  );
  const nodeIds = new Set(data.nodes.map(n => n.id));
  warnIf(
    data.edges.some(e => !nodeIds.has(e.from) || !nodeIds.has(e.to)),
    "SanctionsNetwork",
    "One or more edges reference node IDs not found in the nodes array — those edges will be skipped."
  );
  const targetNodes = data.nodes.filter(n => n.type === "target");
  warnIf(
    targetNodes.length > 3,
    "SanctionsNetwork",
    `${targetNodes.length} target nodes — SanctionsNetwork is optimized for 1–3 target nodes.`
  );

  const totalFrames = sec(data.durationSec ?? 20);

  // ── Sector color map ──────────────────────────────────────────────────────
  const sectorColorMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    (data.sectors ?? []).forEach(s => {
      map[s.id] = s.color;
    });
    return map;
  }, [data.sectors]);

  // ── Node positions ────────────────────────────────────────────────────────
  const nodePositions = useMemo<Record<string, NodePosition>>(() => {
    const layout_ = data.layout ?? "auto";
    if (layout_ === "manual") {
      const pos: Record<string, NodePosition> = {};
      data.nodes.forEach(node => {
        if (node.position) {
          pos[node.id] = {
            x: CONTENT_LEFT + (node.position.x / 100) * CONTENT_W,
            y: CONTENT_TOP + (node.position.y / 100) * CONTENT_H,
          };
        } else {
          // Fallback to auto for any unpositioned nodes in manual mode
          const autoPos = computeAutoLayout(data.nodes);
          pos[node.id] = autoPos[node.id] ?? { x: CANVAS_W / 2, y: CANVAS_H / 2 };
        }
      });
      return pos;
    }
    return computeAutoLayout(data.nodes);
  }, [data.nodes, data.layout]);

  // ── Edge paths ────────────────────────────────────────────────────────────
  const edgePaths = useMemo<EdgePath[]>(() => {
    return data.edges.map(edge => {
      const fromPos = nodePositions[edge.from];
      const toPos = nodePositions[edge.to];
      if (!fromPos || !toPos) {
        return { d: "M 0 0", midX: 0, midY: 0, length: 0 };
      }
      return computeEdgePath(fromPos, toPos, edge.type);
    });
  }, [data.edges, nodePositions]);

  // ── Reveal timing (revealAtSec → frames) ─────────────────────────────────
  const revealMode = data.revealMode ?? "sequential";

  const nodeRevealFrames = useMemo<Record<string, number>>(() => {
    if (revealMode === "simultaneous") {
      const map: Record<string, number> = {};
      data.nodes.forEach(n => { map[n.id] = sec(0.5); });
      return map;
    }
    const map: Record<string, number> = {};
    data.nodes.forEach(n => {
      map[n.id] = n.revealAtSec != null ? sec(n.revealAtSec) : sec(1.0);
    });
    return map;
  }, [data.nodes, revealMode]);

  const edgeRevealFrames = useMemo<number[]>(() => {
    if (revealMode === "simultaneous") {
      return data.edges.map(() => sec(0.8));
    }
    return data.edges.map(e => {
      return e.revealAtSec != null ? sec(e.revealAtSec) : sec(5);
    });
  }, [data.edges, revealMode]);

  // ── Particle animation ────────────────────────────────────────────────────
  // particleOffset cycles from 0→1 over 1.5 seconds (45 frames at 30fps)
  const particleOffset = (frame % 45) / 45;

  // ── Zone label opacity ────────────────────────────────────────────────────
  const zoneLabelOpacity = interpolate(frame, [15, 30], [0, 0.25], CLAMP);

  // ── Legend opacity ────────────────────────────────────────────────────────
  // Appears after all nodes have had a chance to appear
  const lastNodeReveal = useMemo(() => {
    const vals = Object.values(nodeRevealFrames);
    return vals.length > 0 ? Math.max(...vals) : sec(2);
  }, [nodeRevealFrames]);
  const legendOpacity = interpolate(frame, [lastNodeReveal + 15, lastNodeReveal + 45], [0, 1], CLAMP);

  // ── Source attribution ────────────────────────────────────────────────────
  const sourceOpacity = interpolate(frame, [totalFrames - 60, totalFrames - 30], [0, 1], CLAMP);

  // ── Render ────────────────────────────────────────────────────────────────
  const isDark = mode === "dark";
  const bgTextMuted = isDark ? palette.taupe : palette.umber;

  return (
    <Background
      variant={data.backgroundVariant ?? "dark"}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={data.backgroundVariant ?? "dark"} metadata={data.episode} />
        <FooterStrip mode={data.backgroundVariant ?? "dark"} />
        {/* Title */}
        <TitleBlock
          title={data.title ?? ""}
          subtitle={data.subtitle}
          mode={data.backgroundVariant ?? "dark"}
        />

        {/* SVG canvas for the network */}
        <svg
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          {/* ── Zone labels ── */}
          <text
            x={CANVAS_W / 2}
            y={CONTENT_TOP + CONTENT_H * 0.08}
            textAnchor="middle"
            fill={bgTextMuted}
            fontSize={11}
            fontFamily={fonts.metadata}
            fontWeight={600}
            letterSpacing={3}
            opacity={zoneLabelOpacity}
            style={{ textTransform: "uppercase" }}
          >
            SANCTIONER BLOC
          </text>
          <text
            x={CONTENT_LEFT + CONTENT_W * 0.35}
            y={CONTENT_TOP + CONTENT_H * 0.5}
            textAnchor="middle"
            fill={bgTextMuted}
            fontSize={10}
            fontFamily={fonts.metadata}
            fontWeight={500}
            letterSpacing={2.5}
            opacity={zoneLabelOpacity}
            style={{ textTransform: "uppercase" }}
          >
            TARGET
          </text>
          <text
            x={CONTENT_LEFT + CONTENT_W * 0.35}
            y={CONTENT_TOP + CONTENT_H * 0.87}
            textAnchor="middle"
            fill={bgTextMuted}
            fontSize={11}
            fontFamily={fonts.metadata}
            fontWeight={600}
            letterSpacing={3}
            opacity={zoneLabelOpacity}
            style={{ textTransform: "uppercase" }}
          >
            RELAY CONDUIT
          </text>

          {/* ── Edges ── */}
          {data.edges.map((edge, i) => {
            const fromPos = nodePositions[edge.from];
            const toPos = nodePositions[edge.to];
            if (!fromPos || !toPos) return null;

            const revealStart = edgeRevealFrames[i] ?? sec(5);
            const drawDuration = 18; // frames to draw stroke
            const drawProgress = interpolate(
              frame,
              [revealStart, revealStart + drawDuration],
              [0, 1],
              CLAMP,
            );
            const opacity = interpolate(frame, [revealStart, revealStart + 8], [0, 1], CLAMP);
            const sectorColor = edge.sector ? sectorColorMap[edge.sector] : undefined;

            if (drawProgress <= 0) return null;

            return (
              <SanctionEdge
                key={`edge-${i}`}
                edge={edge}
                edgePath={edgePaths[i] ?? { d: "M 0 0", midX: 0, midY: 0, length: 0 }}
                sectorColor={sectorColor}
                drawProgress={drawProgress}
                particleOffset={particleOffset}
                opacity={opacity}
                uniqueId={`${i}-${edge.from}-${edge.to}`}
              />
            );
          })}

          {/* ── Nodes ── */}
          {data.nodes.map(node => {
            const pos = nodePositions[node.id];
            if (!pos) return null;

            const revealStart = nodeRevealFrames[node.id] ?? sec(1);
            const revealDuration = 12;
            const nodeOpacity = interpolate(
              frame,
              [revealStart, revealStart + revealDuration],
              [0, 1],
              CLAMP,
            );
            if (nodeOpacity <= 0) return null;

            const sectorId = node.sector ?? (node.type === "sector" ? node.id : undefined);
            const sectorColor = sectorId ? sectorColorMap[sectorId] : undefined;

            return (
              <SanctionNode
                key={node.id}
                node={node}
                pos={pos}
                sectorColor={sectorColor}
                opacity={nodeOpacity}
                mode={mode}
              />
            );
          })}

          {/* ── Legend ── */}
          {legendOpacity > 0 && (
            <g opacity={legendOpacity}>
              {/* Legend background */}
              <rect
                x={52}
                y={CANVAS_H - 280}
                width={260}
                height={180}
                rx={4}
                fill={isDark ? hexWithOpacity(palette.midnight, 0.85) : hexWithOpacity(palette.bone, 0.9)}
                stroke={isDark ? palette.walnut : palette.sand}
                strokeWidth={0.8}
              />
              <text
                x={72}
                y={CANVAS_H - 256}
                fill={isDark ? palette.taupe : palette.umber}
                fontSize={9}
                fontFamily={fonts.metadata}
                fontWeight={600}
                letterSpacing={2}
                style={{ textTransform: "uppercase" }}
              >
                EDGE LEGEND
              </text>
              <LegendRow label="Primary sanction" edgeType="primary-sanction" y={CANVAS_H - 234} />
              <LegendRow label="Secondary threat" edgeType="secondary-threat" y={CANVAS_H - 210} />
              <LegendRow label="Evasion path" edgeType="evasion-path" y={CANVAS_H - 186} />
              <LegendRow label="Formal exemption" edgeType="formal-exemption" y={CANVAS_H - 162} />
              <LegendRow label="Intermediary" edgeType="intermediary" y={CANVAS_H - 138} />
            </g>
          )}
        </svg>

        {/* Source attribution */}
        {data.source && (
          <div style={{ opacity: sourceOpacity }}>
            <SourceAttribution source={data.source} mode={data.backgroundVariant ?? "dark"} />
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};

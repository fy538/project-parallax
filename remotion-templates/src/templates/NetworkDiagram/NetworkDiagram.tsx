/**
 * NetworkDiagram — nodes connected by edges with virtual camera narration.
 *
 * ── When to use this primitive ─────────────────────────────────────────
 *
 * USE for relationship structure between named entities — hub-spoke
 * dependencies, coalition / alignment diagrams, influence networks,
 * causation diagrams, organizational hierarchies, concept maps. The
 * editorial point is WHO connects to WHOM, not WHERE they sit.
 *
 * DO NOT USE when the entities are real places at real geographic
 * positions and the geography itself is editorially meaningful —
 * trade routes, military alliances anchored to territory, road or rail
 * networks, infrastructure topology. In those cases use ChoroplethMap
 * (regions / values) or RouteAnimation (paths through space). A
 * schematic graph throws away latitude, distance, neighbouring borders,
 * and any other free editorial information the real geography carries.
 *
 *   Decision rule: "Is the spatial position editorially meaningful?"
 *     yes → ChoroplethMap or RouteAnimation
 *     no  → NetworkDiagram
 *
 * Genuine NetworkDiagram cases (geography would be ornamental):
 *   - Supply-chain chokepoints (one supplier, many buyers)
 *   - Coalition / alignment / dependency structures
 *   - Influence networks (intellectual lineage, citation graphs)
 *   - Causation diagrams (multiple trends → one outcome)
 *   - Organizational hierarchies (politburo, cabinet, board)
 *   - Concept maps (a central idea and its sub-claims)
 *
 * ── Animation modes ───────────────────────────────────────────────────
 *
 * Two modes:
 *   1. Static (no cameraPath): Original staggered entrance animation
 *   2. Narrated (cameraPath provided): Virtual camera pans between nodes/clusters,
 *      zoom into relationships, focus isolation dims non-active elements
 *
 * Animation sequence (static mode — 7 steps):
 *   1. Title fade in (0-15 frames)
 *   2. Structure fade in (5-20 frames)
 *   3. Nodes appear with stagger (15-45 frames)
 *   4. Edges draw in (35-65 frames)
 *   5. Controls appear on edges (55-75 frames)
 *   6. Callouts fade in (65-85 frames)
 *   7. Ken Burns drift + exit fade
 *
 * Animation sequence (narrated mode):
 *   1. All elements appear in first 1s
 *   2. Camera moves through cameraPath steps
 *   3. Focus isolation applied per step
 *   4. Ambient particles for depth
 */

import React, { useMemo, useId } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  layout,
  sec,
  radii,
  dividerStyle,
  shadows,
  contentArea,
} from "../../design/theme";
import {
  fadeIn,
  stagger,
  exitFade,
  lockOnPulse,
  CLAMP_SINE,
} from "../../utils/animation";
import {
  computeLayout,
  toPixels,
} from "../../utils/layoutPresets";
import { lineDrawProgress } from "../../utils/drawLine";
import { bezierEdge } from "../../utils/edges";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { TitleBlock } from "../../components/TitleBlock";
import { checkChartDataCommon, warnIf } from "../../utils/dataWarnings";
import { AmbientParticles } from "../../components/AmbientParticles";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useNarratedCamera } from "../../hooks/useNarratedCamera";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { NetworkDiagramData } from "./types";
import type { CameraElement } from "../../hooks/useNarratedCamera";

// ── Color token resolver ─────────────────────────────────────────────────

const createTokenMap = (): Record<string, string> => ({
  amber: palette.amber,
  rust: palette.rust,
  bone: palette.bone,
  ink: palette.ink,
  midnight: palette.midnight,
  olive: palette.olive,
  bronze: palette.bronze,
  oxblood: palette.oxblood,
  us: semantic.us,
  china: semantic.china,
  neutral: semantic.neutral,
  highlight: semantic.highlight,
  success: semantic.success,
  danger: semantic.danger,
});

const resolveColor = (colorToken: string, tokenMap: Record<string, string>): string => {
  return tokenMap[colorToken] || colorToken;
};

// ── Node shape renderers ───────────────────────────────────────────────────

interface NodeRenderProps {
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  color: string;
  radius: number;
  opacity: number;
  scale: number;
  blur: number;
  stat?: { value: string; label: string };
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  isFocused: boolean;
  /** Subtle fill alpha for stroke shapes (V1.5 — removes wireframe feel) */
  fillAlpha?: number;
  importance?: "primary" | "secondary";
  /** Scoped SVG filter ID resolver — prevents collisions when multiple instances render in the same DOM. */
  filterId: (name: string) => string;
  /**
   * Label placement override. Default "below" (standard hub-spoke / grid).
   * "right" positions label to the right of the node for vertical-chain
   * layout — the Economist convention: x = node.x + radius + gap, y = node.y,
   * textAnchor = "start".
   */
  labelPlacement?: "below" | "right";
}

const CircleNode: React.FC<NodeRenderProps> = React.memo(
  ({ x, y, label, sublabel, color, radius, opacity, scale, blur, stat, textPrimary, textSecondary, textMuted, isFocused, fillAlpha = 0.1, importance, filterId, labelPlacement = "below" }) => {
    const isPrimary = importance === "primary";
    // The Economist convention for vertical-chain layouts: label sits to the
    // right of the node circle. x = node.x + radius + 12 gap, y = node.y,
    // textAnchor = "start". For all other layouts: label sits below the node.
    const labelGap = 12;
    const labelX = labelPlacement === "right" ? x + radius + labelGap : x;
    const labelY = labelPlacement === "right" ? y + fontSizes.label / 3 : y + radius + 28;
    const labelAnchor = labelPlacement === "right" ? "start" : "middle";
    const sublabelX = labelPlacement === "right" ? x + radius + labelGap : x;
    const sublabelY = labelPlacement === "right" ? y + fontSizes.label / 3 + 20 : y + radius + 50;
    const sublabelAnchor = labelPlacement === "right" ? "start" : "middle";

    return (
      <g
        opacity={opacity}
        transform={`translate(${x}, ${y}) scale(${scale}) translate(${-x}, ${-y})`}
        filter={blur > 0 ? `blur(${blur}px)` : undefined}
      >
        {/* Flat editorial disc: a filled circle + a clean stroke. No
            glossy specular, no concentric rings, no inner detail
            shapes — those treatments read as 3D UI mockup ("marbles
            and bubbles") rather than print-newsroom diagram. The hub
            earns its presence through SIZE (radius 96 vs 36) and the
            display-weight stat inside, not through ornament. */}
        <circle cx={x} cy={y} r={radius} fill={color} opacity={fillAlpha} />
        <circle cx={x} cy={y} r={radius} fill="none" stroke={color} strokeWidth={isPrimary ? 2 : 1.5} />
        {/* Stat value inside circle — primary nodes.
            Display-weight numeral is the editorial hero: the chokepoint
            argument lives in this number. h1 (64px) lands solid inside
            a 96-radius hub without crowding the ring chrome. */}
        {stat && isPrimary && (
          <text
            x={x}
            y={y + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize={fontSizes.h1}
            fontFamily={fonts.data}
            fontWeight={700}
            letterSpacing={0}
            filter={`url(#${filterId("text-shadow-stat")})`}
          >
            {stat.value}
          </text>
        )}
        {/* Node label */}
        <text
          x={labelX}
          y={labelY}
          textAnchor={labelAnchor}
          fill={textPrimary}
          fontSize={fontSizes.label}
          fontFamily={fonts.mono}
          fontWeight={600}
          letterSpacing={1}
          filter={`url(#${filterId("text-shadow")})`}
        >
          {label}
        </text>
        {sublabel && (
          <text
            x={sublabelX}
            y={sublabelY}
            textAnchor={sublabelAnchor}
            fill={textSecondary}
            fontSize={fontSizes.caption}
            fontFamily={fonts.mono}
            fontWeight={400}
            letterSpacing={0.5}
            filter={`url(#${filterId("text-shadow-caption")})`}
          >
            {sublabel}
          </text>
        )}
        {/* Stat label below node label — primary: at +58 (or +78 if sublabel exists).
            28px gap between label (18px) and caption (14px) gives one
            full line of breathing room; tighter than this and they read
            as a single typographic block. */}
        {stat && isPrimary && (
          <text
            x={x}
            y={sublabel ? y + radius + 78 : y + radius + 58}
            textAnchor="middle"
            fill={textMuted}
            fontSize={fontSizes.caption}
            fontFamily={fonts.mono}
            fontWeight={400}
            letterSpacing={0.5}
            filter={`url(#${filterId("text-shadow-caption")})`}
          >
            {stat.label}
          </text>
        )}
        {/* Stat value + label below circle — non-primary nodes */}
        {stat && !isPrimary && (
          <>
            <text
              x={x}
              y={y + radius + 80}
              textAnchor="middle"
              fill={color}
              fontSize={fontSizes.h3}
              fontFamily={fonts.data}
              fontWeight={700}
              letterSpacing={1}
              filter={`url(#${filterId("text-shadow-stat")})`}
            >
              {stat.value}
            </text>
            <text
              x={x}
              y={y + radius + 100}
              textAnchor="middle"
              fill={textMuted}
              fontSize={fontSizes.caption}
              fontFamily={fonts.mono}
              fontWeight={400}
              letterSpacing={0.5}
              filter={`url(#${filterId("text-shadow-caption")})`}
            >
              {stat.label}
            </text>
          </>
        )}
      </g>
    );
  }
);

const HexagonNode: React.FC<NodeRenderProps> = React.memo(
  ({ x, y, label, sublabel, color, radius, opacity, scale, blur, stat, textPrimary, textSecondary, textMuted, isFocused, fillAlpha = 0.1, filterId }) => {
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (i * Math.PI) / 3;
      return [x + radius * Math.cos(angle), y + radius * Math.sin(angle)];
    });
    const pathD = `M ${points.map((p) => p.join(",")).join(" L ")} Z`;

    return (
      <g
        opacity={opacity}
        transform={`translate(${x}, ${y}) scale(${scale}) translate(${-x}, ${-y})`}
        >
        {isFocused && (
          <path d={pathD} fill={color} opacity={0.08} stroke={color} strokeWidth={1.5} strokeOpacity={0.3} transform={`translate(${x}, ${y}) scale(1.15) translate(${-x}, ${-y})`} />
        )}
        {/* Base subtle fill */}
        <path d={pathD} fill={color} opacity={fillAlpha} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={3} />
        <text x={x} y={y + radius + 28} textAnchor="middle" fill={textPrimary} fontSize={fontSizes.label} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1} filter={`url(#${filterId("text-shadow")})`}>
          {label}
        </text>
        {sublabel && (
          <text x={x} y={y + radius + 50} textAnchor="middle" fill={textSecondary} fontSize={fontSizes.caption} fontFamily={fonts.mono} fontWeight={400} letterSpacing={0.5} filter={`url(#${filterId("text-shadow-caption")})`}>
            {sublabel}
          </text>
        )}
        {stat && (
          <>
            <text x={x} y={y + radius + 80} textAnchor="middle" fill={color} fontSize={fontSizes.h3} fontFamily={fonts.data} fontWeight={700} letterSpacing={1} filter={`url(#${filterId("text-shadow-stat")})`}>{stat.value}</text>
            <text x={x} y={y + radius + 100} textAnchor="middle" fill={textMuted} fontSize={fontSizes.caption} fontFamily={fonts.mono} fontWeight={400} letterSpacing={0.5} filter={`url(#${filterId("text-shadow-caption")})`}>{stat.label}</text>
          </>
        )}
      </g>
    );
  }
);

const RoundedRectNode: React.FC<NodeRenderProps> = React.memo(
  ({ x, y, label, sublabel, color, radius, opacity, scale, blur, stat, textPrimary, textSecondary, textMuted, isFocused, fillAlpha = 0.1, filterId }) => {
    const rectWidth = radius * 1.8;
    const rectHeight = radius * 1.4;

    return (
      <g
        opacity={opacity}
        transform={`translate(${x}, ${y}) scale(${scale}) translate(${-x}, ${-y})`}
        >
        {isFocused && (
          <rect x={x - rectWidth / 2 - 4} y={y - rectHeight / 2 - 4} width={rectWidth + 8} height={rectHeight + 8} rx={radii.lg} fill="none" stroke={color} strokeWidth={1.5} opacity={0.3} />
        )}
        {/* Base subtle fill */}
        <rect x={x - rectWidth / 2} y={y - rectHeight / 2} width={rectWidth} height={rectHeight} rx={radii.lg} fill={color} opacity={fillAlpha} />
        <rect x={x - rectWidth / 2} y={y - rectHeight / 2} width={rectWidth} height={rectHeight} rx={radii.lg} fill="none" stroke={color} strokeWidth={3} />
        {isFocused && (
          <rect x={x - rectWidth / 2} y={y - rectHeight / 2} width={rectWidth} height={rectHeight} rx={radii.lg} fill={color} opacity={0.08} />
        )}
        <text x={x} y={y + radius + 28} textAnchor="middle" fill={textPrimary} fontSize={fontSizes.label} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1} filter={`url(#${filterId("text-shadow")})`}>{label}</text>
        {sublabel && (
          <text x={x} y={y + radius + 50} textAnchor="middle" fill={textSecondary} fontSize={fontSizes.caption} fontFamily={fonts.mono} fontWeight={400} letterSpacing={0.5} filter={`url(#${filterId("text-shadow-caption")})`}>{sublabel}</text>
        )}
        {stat && (
          <>
            <text x={x} y={y + radius + 80} textAnchor="middle" fill={color} fontSize={fontSizes.h3} fontFamily={fonts.data} fontWeight={700} letterSpacing={1} filter={`url(#${filterId("text-shadow-stat")})`}>{stat.value}</text>
            <text x={x} y={y + radius + 100} textAnchor="middle" fill={textMuted} fontSize={fontSizes.caption} fontFamily={fonts.mono} fontWeight={400} letterSpacing={0.5} filter={`url(#${filterId("text-shadow-caption")})`}>{stat.label}</text>
          </>
        )}
      </g>
    );
  }
);

const DiamondNode: React.FC<NodeRenderProps> = React.memo(
  ({ x, y, label, sublabel, color, radius, opacity, scale, blur, stat, textPrimary, textSecondary, textMuted, isFocused, fillAlpha = 0.1, filterId }) => {
    const points = [
      [x, y - radius],
      [x + radius, y],
      [x, y + radius],
      [x - radius, y],
    ];
    const pathD = `M ${points.map((p) => p.join(",")).join(" L ")} Z`;

    return (
      <g
        opacity={opacity}
        transform={`translate(${x}, ${y}) scale(${scale}) translate(${-x}, ${-y})`}
        >
        {isFocused && (
          <path d={pathD} fill={color} opacity={0.08} stroke={color} strokeWidth={1.5} strokeOpacity={0.3} transform={`translate(${x}, ${y}) scale(1.15) translate(${-x}, ${-y})`} />
        )}
        {/* Base subtle fill */}
        <path d={pathD} fill={color} opacity={fillAlpha} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={3} />
        <text x={x} y={y + radius + 28} textAnchor="middle" fill={textPrimary} fontSize={fontSizes.label} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1} filter={`url(#${filterId("text-shadow")})`}>{label}</text>
        {sublabel && (
          <text x={x} y={y + radius + 50} textAnchor="middle" fill={textSecondary} fontSize={fontSizes.caption} fontFamily={fonts.mono} fontWeight={400} letterSpacing={0.5} filter={`url(#${filterId("text-shadow-caption")})`}>{sublabel}</text>
        )}
        {stat && (
          <>
            <text x={x} y={y + radius + 80} textAnchor="middle" fill={color} fontSize={fontSizes.h3} fontFamily={fonts.data} fontWeight={700} letterSpacing={1} filter={`url(#${filterId("text-shadow-stat")})`}>{stat.value}</text>
            <text x={x} y={y + radius + 100} textAnchor="middle" fill={textMuted} fontSize={fontSizes.caption} fontFamily={fonts.mono} fontWeight={400} letterSpacing={0.5} filter={`url(#${filterId("text-shadow-caption")})`}>{stat.label}</text>
          </>
        )}
      </g>
    );
  }
);

// ── Main component ──────────────────────────────────────────────────────────

export const NetworkDiagram: React.FC<{ data: NetworkDiagramData }> = ({
  data,
}) => {
  checkChartDataCommon("NetworkDiagram", data);
  // A7 deprecation guard: hexagon on nation/institution nodes reads as
  // blockchain/mesh UI — use circle instead (intelligence-briefing register).
  // `shape` is not in NetworkNode types yet — cast to detect legacy/untyped JSON.
  warnIf(
    data.nodes.some((n) => (n as any).shape === "hexagon" && (n.type === "nation" || n.type === "institution")), // no-as-any-ok: shape not yet in NetworkNode type; guard for untyped JSON input
    "NetworkDiagram",
    "shape='hexagon' on nation/institution nodes reads as blockchain/mesh UI — use 'circle' instead"
  );
  // Template-fit heuristic: hub-spoke layouts collide labels at ~3-o'clock
  // and ~9-o'clock positions above 7 spokes. Past 8 entities the form
  // reads as "many things" not "structured relationship." See
  // DIAGRAM_TEMPLATE_SELECTOR.md.
  warnIf(
    data.nodes && data.nodes.length > 8,
    "NetworkDiagram",
    `${data.nodes.length} nodes — NetworkDiagram caps cleanly at ~7 spokes ` +
    `around a hub. Above 8, label collisions emerge at 3/9 o'clock and the ` +
    `form collapses into undifferentiated "many things". Demote to SankeyFlow ` +
    `(if allocation) or DataChart tabular. See DIAGRAM_TEMPLATE_SELECTOR.md.`,
  );
  warnIf(
    data.layout === "bipartite" && data.nodes.some(n => !n.side),
    "NetworkDiagram",
    `layout="bipartite" requires every node to have side="left" or side="right". Nodes missing side: ${data.nodes.filter(n => !n.side).map(n => n.id).join(", ")}. Bipartite will render as single column.`
  );
  const uid = useId().replace(/:/g, "");
  const filterId = (name: string) => `nd-${uid}-${name}`;
  const frame = useCurrentFrame();
  const config = useVideoConfig();
  const { durationInFrames } = config;
  const direction = useDirection(data._direction);
  const { style: compositionStyle, exitOpacity } = useCompositionAnimation(direction.driftOptions);
  const theme = useThemeMode(data.backgroundVariant);
  // Pace-aware scaling for the network entrance cadence (per-node + per-edge
  // staggers + initial timing offsets in static mode).
  const t = direction.paceTimingScale;
  const s = direction.paceStaggerScale;

  const hasCameraPath = !!data.cameraPath && data.cameraPath.length > 0;
  const showParticles = data.ambientParticles ?? hasCameraPath;

  // Single safe-area source for all overlays (callouts, source, camera label).
  // Every position derived here uses the same tier as TitleBlock and contentArea()
  // so no overlay can accidentally stray into the title or node zones.
  const safe = layout.safeAreaTier.generous;

  // Compute node positions
  const baseLayout = useMemo(() => {
    return computeLayout(data.layout, data.nodes.length, {
      columns: data.gridColumns,
      padding: 0.1,
      sides: data.nodes.map((n) => n.side),
    });
  }, [data.layout, data.nodes, data.gridColumns]);

  const positions = useMemo(() => {
    // Use contentArea to keep nodes below TitleBlock — defaultSafeArea.top (180px)
    // predates the generous safe area tier and doesn't account for title height.
    const area = contentArea("content", "generous");
    const safeArea = {
      left: area.left,
      top: area.top,
      width: area.width,
      height: area.height,
    };
    return data.nodes.map((node, idx) => {
      const base = baseLayout[idx];
      const override = node.position || { x: base.x, y: base.y };
      return toPixels(override, safeArea);
    });
  }, [baseLayout, data.nodes]);

  // Position map for edge lookup
  const positionMap = useMemo(() => {
    const map: Record<string, { px: number; py: number }> = {};
    data.nodes.forEach((node, idx) => {
      map[node.id] = positions[idx];
    });
    return map;
  }, [data.nodes, positions]);

  // Camera elements for narrated mode
  const cameraElements: CameraElement[] = useMemo(() => {
    return data.nodes.map((node, idx) => ({
      id: node.id,
      x: positions[idx].px,
      y: positions[idx].py,
      group: node.group,
    }));
  }, [data.nodes, positions]);

  // Narrated camera (only active when cameraPath provided)
  const camera = useNarratedCamera({
    elements: cameraElements,
    cameraPath: data.cameraPath || [{ target: "overview", zoom: 1, duration: 10 }],
    canvasWidth: layout.width,
    canvasHeight: layout.height,
    transitionSec: 0.8,
  });

  // Token map
  const tokenMap = useMemo(() => createTokenMap(), []);

  // Helper functions
  // Hub-and-spoke compositions need a CLEAR mass hierarchy. The hub
  // (`importance: "primary"`) must dwarf the satellites — otherwise the
  // form reads as "5 logos in a flower" rather than "one chokepoint
  // everyone routes through." Sizing is mode-aware:
  //
  //   • Hub-mode (any node marked `primary`):
  //       primary → 96 (the chokepoint blooms)
  //       others  → 36 (satellites stay quiet — ~2.7× differential, the
  //                     ratio FT / Bloomberg / NYT Upshot use)
  //
  //   • Flat mode (no node marked primary — chain / grid / mesh):
  //       all nodes → 52 (uniform medium size, no false hierarchy)
  //
  // Old behavior defaulted undefined to 56 always, which collapsed the
  // hub hierarchy when authors forgot to mark satellites.
  const hasPrimaryHub = useMemo(
    () => data.nodes.some((n) => n.importance === "primary"),
    [data.nodes]
  );
  const nodeRadius = (importance?: "primary" | "secondary"): number => {
    if (hasPrimaryHub) {
      return importance === "primary" ? 96 : 36;
    }
    return 52;
  };

  const nodeById = useMemo(() => {
    const map: Record<string, typeof data.nodes[number]> = {};
    data.nodes.forEach((n) => { map[n.id] = n; });
    return map;
  }, [data.nodes]);

  const edgeEndpoints = (fromId: string, toId: string) => {
    const fp = positionMap[fromId];
    const tp = positionMap[toId];
    if (!fp || !tp) return { x1: 0, y1: 0, x2: 0, y2: 0 };
    const dx = tp.px - fp.px;
    const dy = tp.py - fp.py;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const r1 = nodeRadius(nodeById[fromId]?.importance) + 2;
    const r2 = nodeRadius(nodeById[toId]?.importance) + 2;
    return {
      x1: fp.px + ux * r1,
      y1: fp.py + uy * r1,
      x2: tp.px - ux * r2,
      y2: tp.py - uy * r2,
    };
  };

  // ── Static mode timing ────────��────────────────────────────────────
  const structureStartFrame = sec(0.2 * t);
  const nodeStartFrame = sec(0.5 * t);
  const edgeStartFrame = sec(1.2 * t);
  const controlStartFrame = sec(1.8 * t);
  const calloutStartFrame = sec(2.2 * t);

  const getNodeOpacity = (nodeIndex: number): number => {
    if (hasCameraPath) {
      // In narrated mode, all nodes appear quickly, camera handles focus
      return fadeIn(frame, sec(0.2) + stagger(nodeIndex, sec(0.04)), sec(0.3));
    }
    const startDelay = stagger(nodeIndex, sec(0.08 * s));
    return fadeIn(frame, nodeStartFrame + startDelay, sec(0.35));
  };

  const getEdgeProgress = (edgeIndex: number): number => {
    if (hasCameraPath) {
      return fadeIn(frame, sec(0.5) + stagger(edgeIndex, sec(0.05)), sec(0.4));
    }
    const startDelay = stagger(edgeIndex, sec(0.1 * s));
    return lineDrawProgress(frame, edgeStartFrame + startDelay, sec(0.6));
  };

  // Structure opacity
  const structureOpacity = fadeIn(frame, structureStartFrame, sec(0.5));

  // Control and callout opacity (static mode only)
  const controlOpacity = hasCameraPath
    ? fadeIn(frame, sec(0.8), sec(0.3))
    : interpolate(frame, [controlStartFrame, controlStartFrame + sec(0.4)], [0, 1], CLAMP_SINE);

  const calloutOpacity = hasCameraPath
    ? fadeIn(frame, sec(1), sec(0.3))
    : fadeIn(frame, calloutStartFrame, sec(0.4));

  // ── Camera label overlay ───────���───────────────────────────────────
  const cameraLabel = hasCameraPath ? camera.currentLabel : undefined;
  const labelOpacity = cameraLabel ? fadeIn(frame, 0, sec(0.3)) : 0;

  // ── Render ─��───────────────────────────────────────────────────────

  const svgContent = (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        {/* Hierarchy-aware text shadows — dy + stdDeviation track text role */}
        <filter id={filterId("text-shadow")} x="-10%" y="-10%" width="120%" height="120%">
          {/* Default — used by labels (mid hierarchy) */}
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.5)" />
        </filter>
        <filter id={filterId("text-shadow-caption")} x="-10%" y="-10%" width="120%" height="120%">
          {/* Caption / sublabel — lighter, smaller */}
          <feDropShadow dx="0" dy="0.5" stdDeviation="1" floodColor="rgba(0,0,0,0.4)" />
        </filter>
        <filter id={filterId("text-shadow-stat")} x="-15%" y="-15%" width="130%" height="130%">
          {/* Stat / hero data — heavier lift to anchor numbers */}
          <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="rgba(0,0,0,0.55)" />
        </filter>
      </defs>

      {/* ── Edges ──────────────────────────────────────────────────────── */}
      <g opacity={exitOpacity}>
        {(() => {
          const someAccentEdge = data.edges.some(e => e.emphasis === "accent");
          return data.edges.map((edge, edgeIdx) => {
          const fromPos = positionMap[edge.from];
          const toPos = positionMap[edge.to];
          if (!fromPos || !toPos) return null;

          const progress = getEdgeProgress(edgeIdx);
          const edgeColor = resolveColor(edge.color || theme.text.secondary, tokenMap);
          const ep = edgeEndpoints(edge.from, edge.to);

          const isEdgeAccent = edge.emphasis === "accent";
          const isEdgeMuted = edge.emphasis === "muted" || (someAccentEdge && !isEdgeAccent);
          const emphasisMultiplier = isEdgeMuted ? 0.35 : 1.0;

          // In camera mode, edges connected to focused nodes get full opacity
          let edgeCameraOpacity = 1;
          if (hasCameraPath && !camera.isOverview) {
            const fromIdx = data.nodes.findIndex((n) => n.id === edge.from);
            const toIdx = data.nodes.findIndex((n) => n.id === edge.to);
            const fromFocused = camera.focusedIndices.includes(fromIdx);
            const toFocused = camera.focusedIndices.includes(toIdx);
            edgeCameraOpacity = fromFocused || toFocused ? 1 : camera.getElementOpacity(fromIdx);
          }

          // Curved edge — quadratic bezier with subtle perpendicular arc.
          // Curvature 0.18 reads as "designed" without becoming whimsical;
          // 0 (straight line) reads sharper for the bipartite layout where
          // every edge runs diagonally between two clean columns. Curves
          // there add visual noise without information.
          const curvature = data.layout === "bipartite" ? 0 : 0.18;
          const edgePath = bezierEdge(ep.x1, ep.y1, ep.x2, ep.y2, curvature);

          if (edge.style === "blocked") {
            const midX = (ep.x1 + ep.x2) / 2;
            const midY = (ep.y1 + ep.y2) / 2;
            const angle = Math.atan2(ep.y2 - ep.y1, ep.x2 - ep.x1);
            return (
              <g key={`edge-${edgeIdx}`} opacity={progress * edgeCameraOpacity * emphasisMultiplier}>
                <path d={edgePath} fill="none" stroke={edgeColor} strokeWidth={2} />
                <g transform={`translate(${midX}, ${midY}) rotate(${(angle * 180) / Math.PI})`}>
                  <line x1={-12} y1={-12} x2={12} y2={12} stroke={palette.rust} strokeWidth={3} />
                  <line x1={12} y1={-12} x2={-12} y2={12} stroke={palette.rust} strokeWidth={3} />
                </g>
              </g>
            );
          } else if (edge.style === "dashed") {
            return (
              <path key={`edge-${edgeIdx}`} d={edgePath} fill="none" stroke={edgeColor} strokeWidth={3} strokeDasharray="8 4" opacity={progress * edgeCameraOpacity * 0.7 * emphasisMultiplier} strokeLinecap="round" />
            );
          } else {
            // Hub-spoke convergence terminator: small filled dot where
            // the edge meets the hub side. Reads as "this dependency
            // lands HERE" and visually pulls the eye inward to the
            // chokepoint. Drawn at the FROM endpoint by convention
            // (hub-spoke data canonically has hub as `from`).
            const fromIsPrimary = nodeById[edge.from]?.importance === "primary";
            const terminatorX = fromIsPrimary ? ep.x1 : ep.x2;
            const terminatorY = fromIsPrimary ? ep.y1 : ep.y2;
            return (
              <g key={`edge-${edgeIdx}`}>
                {/* Soft glow halo — wider, slightly more present so the
                    edge feels like a flow, not a wire. */}
                <path d={edgePath} fill="none" stroke={edgeColor} strokeWidth={20} opacity={progress * edgeCameraOpacity * 0.09 * emphasisMultiplier} strokeLinecap="round" />
                {/* Main edge line — bumped from 2.5 to 3.25 for editorial confidence */}
                <path d={edgePath} fill="none" stroke={edgeColor} strokeWidth={3.25} opacity={progress * edgeCameraOpacity * 0.92 * emphasisMultiplier} strokeLinecap="round" />
                {/* Hub-side convergence dot — only when a primary hub exists */}
                {(fromIsPrimary || nodeById[edge.to]?.importance === "primary") && (
                  <circle
                    cx={terminatorX}
                    cy={terminatorY}
                    r={3.5}
                    fill={edgeColor}
                    opacity={progress * edgeCameraOpacity * 0.9 * emphasisMultiplier}
                  />
                )}
              </g>
            );
          }
        });
        })()}
      </g>

      {/* ── Nodes ───────────────────────────────────────────��────────── */}
      <g opacity={exitOpacity}>
        {data.nodes.map((node, nodeIdx) => {
          const pos = positions[nodeIdx];
          const baseOpacity = getNodeOpacity(nodeIdx);
          const radius = nodeRadius(node.importance);
          const color = resolveColor(node.color, tokenMap);

          // Camera-based focus effects
          const cameraOpacity = hasCameraPath ? camera.getElementOpacity(nodeIdx) : 1;
          const cameraScale = hasCameraPath ? camera.getElementScale(nodeIdx) : 1;
          const cameraBlur = hasCameraPath ? camera.getElementBlur(nodeIdx) : 0;
          const isFocused = hasCameraPath
            ? camera.isOverview || camera.focusedIndices.includes(nodeIdx)
            : true;

          // Brand lock-on pulse: fires when the node first appears (static)
          // or when the camera focuses on it (narrated). Applied as a scale
          // multiplier on top of cameraScale.
          const nodeAppearFrame = hasCameraPath
            ? sec(0.2) + stagger(nodeIdx, sec(0.04))
            : nodeStartFrame + stagger(nodeIdx, sec(0.08));
          const lockScale = lockOnPulse(frame, nodeAppearFrame, config.fps);

          // Editorial primitives — circles for nations + institutions
          // (hexagons read as blockchain/mesh-network UI, off-brand for
          // intelligence-briefing aesthetic). Actors keep rounded-rect for
          // typographic plates; concepts keep the diamond as a marker.
          const NodeComponent = (() => {
            switch (node.type) {
              case "nation": return CircleNode;
              case "institution": return CircleNode;
              case "actor": return RoundedRectNode;
              case "concept": return DiamondNode;
              default: return CircleNode;
            }
          })();

          return (
            <NodeComponent
              key={`node-${node.id}`}
              x={pos.px}
              y={pos.py}
              label={node.label}
              sublabel={node.sublabel}
              color={color}
              radius={radius}
              opacity={baseOpacity * cameraOpacity}
              scale={cameraScale * lockScale}
              blur={cameraBlur}
              stat={node.stat}
              textPrimary={theme.text.primary}
              textSecondary={theme.text.secondary}
              textMuted={theme.text.muted}
              isFocused={isFocused}
              importance={node.importance}
              fillAlpha={
                node.importance === "primary"
                  ? (isFocused ? 0.42 : 0.30)
                  : (isFocused ? 0.14 : 0.08)
              }
              filterId={filterId}
              labelPlacement={data.layout === "vertical-chain" ? "right" : "below"}
            />
          );
        })}
      </g>

      {/* ── Controls on edges ───────────────────────────────────────── */}
      {data.controls && (
        <g opacity={controlOpacity * exitOpacity}>
          {data.controls.map((control, ctrlIdx) => {
            const fromPos = positionMap[control.edge[0]];
            const toPos = positionMap[control.edge[1]];
            if (!fromPos || !toPos) return null;

            const midX = (fromPos.px + toPos.px) / 2;
            const midY = (fromPos.py + toPos.py) / 2;
            const ctrlColor = resolveColor(control.color || palette.rust, tokenMap);

            return (
              <g key={`control-${ctrlIdx}`}>
                <rect x={midX - 50} y={midY - 20} width={100} height={40} rx={radii.md} fill="none" stroke={ctrlColor} strokeWidth={dividerStyle.thickness} />
                <text x={midX} y={midY + 8} textAnchor="middle" fill={ctrlColor} fontSize={fontSizes.caption} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1} filter={`url(#${filterId("text-shadow")})`}>
                  {control.label}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* ── Callouts ────────────────────────────────────────────────────
          Editorial pull-quote: thin accent rule on the inner edge, large
          display value, mono-caps label below. No bordered box — the
          accent rule + typography do the work. */}
      {data.callouts && (
        <g opacity={calloutOpacity * exitOpacity}>
          {data.callouts.map((callout, callIdx) => {
            const calloutWidth = 320;
            const calloutHeight = 96;
            let callX = 0;
            let callY = 0;
            // Anchor side determines which edge the accent rule lives on.
            let isRight = false;

            if (callout.position === "bottom-right") {
              callX = layout.width - safe.right - calloutWidth;
              callY = layout.height - safe.bottom - calloutHeight - 32;
              isRight = true;
            } else if (callout.position === "bottom-left") {
              callX = safe.left;
              callY = layout.height - safe.bottom - calloutHeight - 32;
              isRight = false;
            } else {
              callX = layout.width - safe.right - calloutWidth;
              callY = safe.top + 32;
              isRight = true;
            }
            const ruleX = isRight ? callX : callX + calloutWidth - 1;

            return (
              <g key={`callout-${callIdx}`}>
                {/* Inner accent rule — the only chrome */}
                <line
                  x1={ruleX}
                  y1={callY}
                  x2={ruleX}
                  y2={callY + calloutHeight}
                  stroke={palette.amber}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                {/* Value — large display */}
                <text
                  x={isRight ? callX + 16 : callX + calloutWidth - 16}
                  y={callY + 36}
                  textAnchor={isRight ? "start" : "end"}
                  fill={palette.amber}
                  fontSize={fontSizes.h2}
                  fontFamily={fonts.data}
                  fontWeight={700}
                  letterSpacing={1}
                >
                  {callout.value}
                </text>
                {/* Label — mono caps muted */}
                <foreignObject
                  x={isRight ? callX + 16 : callX}
                  y={callY + 48}
                  width={calloutWidth - 32}
                  height={calloutHeight - 48}
                >
                  <div
                    style={{
                      fontSize: fontSizes.caption,
                      fontFamily: fonts.mono,
                      fontWeight: 400,
                      color: theme.text.muted,
                      textAlign: isRight ? "left" : "right",
                      lineHeight: 1.3,
                      letterSpacing: 0.5,
                      maxWidth: calloutWidth - 32,
                    }}
                  >
                    {callout.label}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      )}

      {/* ── Source attribution ──────────────────────────────────────── */}
      {data.source && (
        <text
          x={layout.width - safe.right}
          y={layout.height - safe.bottom + 12}
          textAnchor="end"
          fill={theme.text.muted}
          fontSize={fontSizes.meta}
          fontFamily={fonts.mono}
          fontWeight={400}
          letterSpacing={2}
          filter={`url(#${filterId("text-shadow")})`}
          opacity={exitOpacity}
        >
          {data.source}
        </text>
      )}
    </svg>
  );

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compositionStyle}>
        {/* Brand strips */}
        <HeaderStrip mode={data.backgroundVariant || "light"} metadata={data.episode} />
        <FooterStrip mode={data.backgroundVariant || "light"} />

        {/* Ambient particles for depth */}
        {showParticles && (
          <AmbientParticles
            mode={data.backgroundVariant || "light"}
            density={20}
            speed={0.3}
            maxOpacity={0.1}
          />
        )}

        {/* Camera wrapper (narrated mode) or direct render (static mode) */}
        {hasCameraPath ? (
          <div style={camera.viewportStyle}>
            <div style={camera.contentStyle}>
              {svgContent}
            </div>
          </div>
        ) : (
          svgContent
        )}

        {/* Camera step label overlay */}
        {cameraLabel && (
          <div
            style={{
              position: "absolute",
              top: safe.top,
              right: safe.right,
              fontSize: fontSizes.label,
              fontFamily: fonts.mono,
              color: theme.text.muted,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: labelOpacity * exitOpacity,
              textShadow: shadows.textLift,
            }}
          >
            {cameraLabel}
          </div>
        )}

        {/* Title — centralized TitleBlock component. Wrapped in an
            absolutely-positioned div so the FadeIn's transform + center
            origin can't accidentally collapse the TitleBlock's positioning
            context (regression: title was rendering off-canvas because
            FadeIn outer div had zero-sized static box). */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={data.backgroundVariant || "light"}
            safeAreaTier="generous"
            syncPoints={direction.syncPoints}
          />
        </div>
      </AbsoluteFill>
    </Background>
  );
};

/**
 * NetworkDiagram — nodes connected by edges with virtual camera narration.
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
import { TitleBlock } from "../../components/TitleBlock";
import { checkChartDataCommon } from "../../utils/dataWarnings";
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
  /** Scoped SVG filter ID resolver — prevents collisions when multiple instances render in the same DOM. */
  filterId: (name: string) => string;
}

const CircleNode: React.FC<NodeRenderProps> = React.memo(
  ({ x, y, label, sublabel, color, radius, opacity, scale, blur, stat, textPrimary, textSecondary, textMuted, isFocused, fillAlpha = 0.1, filterId }) => (
    <g
      opacity={opacity}
      transform={`translate(${x}, ${y}) scale(${scale}) translate(${-x}, ${-y})`}
      filter={blur > 0 ? `blur(${blur}px)` : undefined}
    >
      {/* Glow ring for focused nodes */}
      {isFocused && (
        <circle cx={x} cy={y} r={radius + 6} fill="none" stroke={color} strokeWidth={1.5} opacity={0.3} />
      )}
      {/* Base subtle fill — removes wireframe feel */}
      <circle cx={x} cy={y} r={radius} fill={color} opacity={fillAlpha} />
      <circle cx={x} cy={y} r={radius} fill="none" stroke={color} strokeWidth={3} />
      {/* Inner fill glow when focused (additive over base fill) */}
      {isFocused && (
        <circle cx={x} cy={y} r={radius - 2} fill={color} opacity={0.08} />
      )}
      {/* Specular highlight — small bright spot upper-left (catches light, suggests volume) */}
      <circle
        cx={x - radius * 0.35}
        cy={y - radius * 0.35}
        r={radius * 0.18}
        fill="white"
        opacity={0.18}
      />
      <text
        x={x}
        y={y + radius + 28}
        textAnchor="middle"
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
          x={x}
          y={y + radius + 50}
          textAnchor="middle"
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
      {stat && (
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
  )
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
    });
  }, [data.layout, data.nodes.length, data.gridColumns]);

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
  const nodeRadius = (importance?: "primary" | "secondary"): number =>
    importance === "secondary" ? 30 : 40;

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

      {/* ── Structure (subtle grid reference) ────────────────────────── */}
      {!hasCameraPath && (
        <g opacity={structureOpacity * exitOpacity * 0.15}>
          {[0, 0.25, 0.5, 0.75, 1].map((x) => (
            <line
              key={`vline-${x}`}
              x1={safe.left + x * (layout.width - safe.left - safe.right)}
              y1={safe.top}
              x2={safe.left + x * (layout.width - safe.left - safe.right)}
              y2={layout.height - safe.bottom}
              stroke={theme.text.muted}
              strokeWidth={1}
            />
          ))}
        </g>
      )}

      {/* ── Edges ───────────────────────────────────────���────────────── */}
      <g opacity={exitOpacity}>
        {data.edges.map((edge, edgeIdx) => {
          const fromPos = positionMap[edge.from];
          const toPos = positionMap[edge.to];
          if (!fromPos || !toPos) return null;

          const progress = getEdgeProgress(edgeIdx);
          const edgeColor = resolveColor(edge.color || theme.text.secondary, tokenMap);
          const ep = edgeEndpoints(edge.from, edge.to);

          // In camera mode, edges connected to focused nodes get full opacity
          let edgeCameraOpacity = 1;
          if (hasCameraPath && !camera.isOverview) {
            const fromIdx = data.nodes.findIndex((n) => n.id === edge.from);
            const toIdx = data.nodes.findIndex((n) => n.id === edge.to);
            const fromFocused = camera.focusedIndices.includes(fromIdx);
            const toFocused = camera.focusedIndices.includes(toIdx);
            edgeCameraOpacity = fromFocused || toFocused ? 1 : camera.getElementOpacity(fromIdx);
          }

          // Curved edge — quadratic bezier with subtle perpendicular arc
          // Curvature 0.18 reads as "designed" without becoming whimsical.
          const edgePath = bezierEdge(ep.x1, ep.y1, ep.x2, ep.y2, 0.18);

          if (edge.style === "blocked") {
            const midX = (ep.x1 + ep.x2) / 2;
            const midY = (ep.y1 + ep.y2) / 2;
            const angle = Math.atan2(ep.y2 - ep.y1, ep.x2 - ep.x1);
            return (
              <g key={`edge-${edgeIdx}`} opacity={progress * edgeCameraOpacity}>
                <path d={edgePath} fill="none" stroke={edgeColor} strokeWidth={2} />
                <g transform={`translate(${midX}, ${midY}) rotate(${(angle * 180) / Math.PI})`}>
                  <line x1={-12} y1={-12} x2={12} y2={12} stroke={palette.rust} strokeWidth={3} />
                  <line x1={12} y1={-12} x2={-12} y2={12} stroke={palette.rust} strokeWidth={3} />
                </g>
              </g>
            );
          } else if (edge.style === "dashed") {
            return (
              <path key={`edge-${edgeIdx}`} d={edgePath} fill="none" stroke={edgeColor} strokeWidth={2} strokeDasharray="8 4" opacity={progress * edgeCameraOpacity} />
            );
          } else {
            return (
              <path key={`edge-${edgeIdx}`} d={edgePath} fill="none" stroke={edgeColor} strokeWidth={2} opacity={progress * edgeCameraOpacity} />
            );
          }
        })}
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

          const NodeComponent = (() => {
            switch (node.type) {
              case "nation": return CircleNode;
              case "institution": return HexagonNode;
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
              fillAlpha={isFocused ? 0.12 : 0.08}
              filterId={filterId}
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

      {/* ── Callouts ─────────────────────────────────────────────────── */}
      {data.callouts && (
        <g opacity={calloutOpacity * exitOpacity}>
          {data.callouts.map((callout, callIdx) => {
            let callX = 0;
            let callY = 0;
            const calloutWidth = 240;
            const calloutHeight = 80;

            if (callout.position === "bottom-right") {
              callX = layout.width - safe.right - calloutWidth - 20;
              callY = layout.height - safe.bottom - calloutHeight - 20;
            } else if (callout.position === "bottom-left") {
              callX = safe.left + 20;
              callY = layout.height - safe.bottom - calloutHeight - 20;
            } else {
              callX = layout.width - safe.right - calloutWidth - 20;
              callY = safe.top + 20;
            }

            return (
              <g key={`callout-${callIdx}`}>
                <rect x={callX} y={callY} width={calloutWidth} height={calloutHeight} rx={radii.md} fill={theme.bg.surface} stroke={theme.text.secondary} strokeWidth={dividerStyle.thickness} opacity={0.9} />
                <text x={callX + calloutWidth / 2} y={callY + 25} textAnchor="middle" fill={palette.amber} fontSize={fontSizes.h3} fontFamily={fonts.data} fontWeight={700} letterSpacing={1} filter={`url(#${filterId("text-shadow-stat")})`}>
                  {callout.value}
                </text>
                <foreignObject x={callX + 8} y={callY + 35} width={calloutWidth - 16} height={calloutHeight - 40}>
                  <div style={{ fontSize: fontSizes.caption, fontFamily: fonts.mono, fontWeight: 400, color: theme.text.secondary, textAlign: "center", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", letterSpacing: 0.5 }}>
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
      variant={data.backgroundVariant || "light"}
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

        {/* Title — centralized TitleBlock component */}
        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={data.backgroundVariant || "light"}
          safeAreaTier="generous"
        />
      </AbsoluteFill>
    </Background>
  );
};

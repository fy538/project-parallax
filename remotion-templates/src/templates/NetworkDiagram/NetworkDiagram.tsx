/**
 * NetworkDiagram — nodes connected by edges with labels, controls, and callouts.
 *
 * Renders nation states, institutions, actors, or concepts as shapes connected
 * by solid/dashed/blocked edges. Supports 4 layout presets (horizontal-chain,
 * hub-spoke, grid, vertical-chain) with optional stat callouts and control boxes
 * on edges.
 *
 * Animation sequence (7 steps):
 *   1. Title fade in (0-15 frames)
 *   2. Structure fade in (5-20 frames)
 *   3. Nodes appear with stagger (15-45 frames)
 *   4. Edges draw in (35-65 frames)
 *   5. Controls appear on edges (55-75 frames)
 *   6. Callouts fade in (65-85 frames)
 *   7. Ken Burns drift + exit fade
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
  semantic,
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  light,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  stagger,
  exitFade,
  kenBurnsDrift,
  CLAMP_SINE,
} from "../../utils/animation";
import {
  computeLayout,
  toPixels,
  defaultSafeArea,
  type LayoutPosition,
} from "../../utils/layoutPresets";
import { lineDrawProgress, distance } from "../../utils/drawLine";
import { Background } from "../../components/Background";
import { FadeIn } from "../../components/FadeIn";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { NetworkDiagramData, NetworkNode, NetworkEdge } from "./types";

// ── Color token resolver ────────────────────────────────────────────────────

const resolveColor = (colorToken: string): string => {
  // Check if it's a named token
  const tokenMap: Record<string, string> = {
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
  };

  return tokenMap[colorToken] || colorToken;
};

// ── Node shape renderers ────────────────────────────────────────────────────

interface NodeRenderProps {
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  color: string;
  radius: number;
  opacity: number;
  stat?: { value: string; label: string };
}

const CircleNode: React.FC<NodeRenderProps> = React.memo(
  ({ x, y, label, sublabel, color, radius, opacity, stat }) => (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={radius} fill="none" stroke={color} strokeWidth={3} />
      <text
        x={x}
        y={y + radius + 28}
        textAnchor="middle"
        fill={light.text.primary}
        fontSize={fontSizes.label}
        fontFamily={fonts.mono}
        fontWeight={600}
        letterSpacing={1}
        filter="url(#text-shadow)"
      >
        {label}
      </text>
      {sublabel && (
        <text
          x={x}
          y={y + radius + 50}
          textAnchor="middle"
          fill={light.text.secondary}
          fontSize={fontSizes.caption}
          fontFamily={fonts.mono}
          fontWeight={400}
          letterSpacing={0.5}
          filter="url(#text-shadow)"
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
            filter="url(#text-shadow)"
          >
            {stat.value}
          </text>
          <text
            x={x}
            y={y + radius + 100}
            textAnchor="middle"
            fill={light.text.muted}
            fontSize={fontSizes.caption}
            fontFamily={fonts.mono}
            fontWeight={400}
            letterSpacing={0.5}
            filter="url(#text-shadow)"
          >
            {stat.label}
          </text>
        </>
      )}
    </g>
  )
);

const HexagonNode: React.FC<NodeRenderProps> = React.memo(
  ({ x, y, label, sublabel, color, radius, opacity, stat }) => {
    // Create hexagon path
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (i * Math.PI) / 3;
      return [x + radius * Math.cos(angle), y + radius * Math.sin(angle)];
    });
    const pathD = `M ${points.map((p) => p.join(",")).join(" L ")} Z`;

    return (
      <g opacity={opacity}>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={3}
        />
        <text
          x={x}
          y={y + radius + 28}
          textAnchor="middle"
          fill={light.text.primary}
          fontSize={fontSizes.label}
          fontFamily={fonts.mono}
          fontWeight={600}
          letterSpacing={1}
          filter="url(#text-shadow)"
        >
          {label}
        </text>
        {sublabel && (
          <text
            x={x}
            y={y + radius + 50}
            textAnchor="middle"
            fill={light.text.secondary}
            fontSize={fontSizes.caption}
            fontFamily={fonts.mono}
            fontWeight={400}
            letterSpacing={0.5}
            filter="url(#text-shadow)"
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
              filter="url(#text-shadow)"
            >
              {stat.value}
            </text>
            <text
              x={x}
              y={y + radius + 100}
              textAnchor="middle"
              fill={light.text.muted}
              fontSize={fontSizes.caption}
              fontFamily={fonts.mono}
              fontWeight={400}
              letterSpacing={0.5}
              filter="url(#text-shadow)"
            >
              {stat.label}
            </text>
          </>
        )}
      </g>
    );
  }
);

const RoundedRectNode: React.FC<NodeRenderProps> = React.memo(
  ({ x, y, label, sublabel, color, radius, opacity, stat }) => {
    const rectWidth = radius * 1.8;
    const rectHeight = radius * 1.4;

    return (
      <g opacity={opacity}>
        <rect
          x={x - rectWidth / 2}
          y={y - rectHeight / 2}
          width={rectWidth}
          height={rectHeight}
          rx={8}
          fill="none"
          stroke={color}
          strokeWidth={3}
        />
        <text
          x={x}
          y={y + radius + 28}
          textAnchor="middle"
          fill={light.text.primary}
          fontSize={fontSizes.label}
          fontFamily={fonts.mono}
          fontWeight={600}
          letterSpacing={1}
          filter="url(#text-shadow)"
        >
          {label}
        </text>
        {sublabel && (
          <text
            x={x}
            y={y + radius + 50}
            textAnchor="middle"
            fill={light.text.secondary}
            fontSize={fontSizes.caption}
            fontFamily={fonts.mono}
            fontWeight={400}
            letterSpacing={0.5}
            filter="url(#text-shadow)"
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
              filter="url(#text-shadow)"
            >
              {stat.value}
            </text>
            <text
              x={x}
              y={y + radius + 100}
              textAnchor="middle"
              fill={light.text.muted}
              fontSize={fontSizes.caption}
              fontFamily={fonts.mono}
              fontWeight={400}
              letterSpacing={0.5}
              filter="url(#text-shadow)"
            >
              {stat.label}
            </text>
          </>
        )}
      </g>
    );
  }
);

const DiamondNode: React.FC<NodeRenderProps> = React.memo(
  ({ x, y, label, sublabel, color, radius, opacity, stat }) => {
    const points = [
      [x, y - radius],
      [x + radius, y],
      [x, y + radius],
      [x - radius, y],
    ];
    const pathD = `M ${points.map((p) => p.join(",")).join(" L ")} Z`;

    return (
      <g opacity={opacity}>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={3}
        />
        <text
          x={x}
          y={y + radius + 28}
          textAnchor="middle"
          fill={light.text.primary}
          fontSize={fontSizes.label}
          fontFamily={fonts.mono}
          fontWeight={600}
          letterSpacing={1}
          filter="url(#text-shadow)"
        >
          {label}
        </text>
        {sublabel && (
          <text
            x={x}
            y={y + radius + 50}
            textAnchor="middle"
            fill={light.text.secondary}
            fontSize={fontSizes.caption}
            fontFamily={fonts.mono}
            fontWeight={400}
            letterSpacing={0.5}
            filter="url(#text-shadow)"
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
              filter="url(#text-shadow)"
            >
              {stat.value}
            </text>
            <text
              x={x}
              y={y + radius + 100}
              textAnchor="middle"
              fill={light.text.muted}
              fontSize={fontSizes.caption}
              fontFamily={fonts.mono}
              fontWeight={400}
              letterSpacing={0.5}
              filter="url(#text-shadow)"
            >
              {stat.label}
            </text>
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
  const frame = useCurrentFrame();
  const config = useVideoConfig();
  const { durationInFrames } = config;
  const { style: compositionStyle, exitOpacity } = useCompositionAnimation();

  // Compute node positions
  const baseLayout = useMemo(() => {
    return computeLayout(data.layout, data.nodes.length, {
      columns: data.gridColumns,
      padding: 0.1,
    });
  }, [data.layout, data.nodes.length, data.gridColumns]);

  // Merge with overrides
  const positions = useMemo(() => {
    const safeArea = defaultSafeArea;
    return data.nodes.map((node, idx) => {
      const base = baseLayout[idx];
      const override = node.position || { x: base.x, y: base.y };
      return toPixels(override, safeArea);
    });
  }, [baseLayout, data.nodes]);

  // Create a position map for edge lookup
  const positionMap = useMemo(() => {
    const map: Record<string, { px: number; py: number }> = {};
    data.nodes.forEach((node, idx) => {
      map[node.id] = positions[idx];
    });
    return map;
  }, [data.nodes, positions]);

  // Animation timeline
  const titleStartFrame = 0;
  const titleEndFrame = sec(0.5);
  const structureStartFrame = sec(0.2);
  const structureEndFrame = sec(0.7);
  const nodeStartFrame = sec(0.5);
  const nodeEndFrame = sec(1.5);
  const edgeStartFrame = sec(1.2);
  const edgeEndFrame = sec(2.2);
  const controlStartFrame = sec(1.8);
  const controlEndFrame = sec(2.5);
  const calloutStartFrame = sec(2.2);
  const calloutEndFrame = sec(2.8);

  // Helper function to get node at frame
  const getNodeOpacity = (nodeIndex: number): number => {
    const startDelay = stagger(nodeIndex, sec(0.08));
    return fadeIn(frame, nodeStartFrame + startDelay, sec(0.35));
  };

  // Helper function to get edge draw progress
  const getEdgeProgress = (edgeIndex: number): number => {
    const startDelay = stagger(edgeIndex, sec(0.1));
    return lineDrawProgress(frame, edgeStartFrame + startDelay, sec(0.6));
  };

  // Helper to resolve node color
  const nodeRadius = (importance?: "primary" | "secondary"): number =>
    importance === "secondary" ? 30 : 40;

  // Title opacity
  const titleOpacity = fadeIn(frame, titleStartFrame, sec(0.5));

  // Structure opacity (subtle reference grid)
  const structureOpacity = fadeIn(
    frame,
    structureStartFrame,
    sec(0.5)
  );

  // Control opacity
  const controlOpacity = interpolate(
    frame,
    [controlStartFrame, controlStartFrame + sec(0.4)],
    [0, 1],
    CLAMP_SINE
  );

  // Callout opacity
  const calloutOpacity = fadeIn(frame, calloutStartFrame, sec(0.4));

  return (
    <Background variant={data.backgroundVariant || "light"} tint={data.backgroundTint}>
      <AbsoluteFill style={compositionStyle}>
        {/* Ken Burns drift wrapper for camera energy */}
        <div style={{ transform: `scale(${kenBurnsDrift(frame, durationInFrames, 1.02)})`, transformOrigin: "center center", width: "100%", height: "100%" }}>
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <filter id="text-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.5)" />
            </filter>
          </defs>
          {/* ── Title — slideIn (no naked fade) ────────────────────────── */}
          <g opacity={titleOpacity * exitOpacity} transform={`translate(0, ${slideIn(frame, titleStartFrame, 16, sec(0.5))})`}>
            <text
              x={layout.safeArea.left}
              y={layout.safeArea.top + 60}
              fill={light.text.primary}
              fontSize={fontSizes.h2}
              fontFamily={fonts.heading}
              fontWeight={700}
              letterSpacing={2}
              filter="url(#text-shadow)"
            >
              {data.title}
            </text>
            {data.subtitle && (
              <text
                x={layout.safeArea.left}
                y={layout.safeArea.top + 100}
                fill={light.text.secondary}
                fontSize={fontSizes.label}
                fontFamily={fonts.mono}
                fontWeight={400}
                letterSpacing={1}
                filter="url(#text-shadow)"
              >
                {data.subtitle}
              </text>
            )}
          </g>

          {/* ── Structure (subtle grid reference) ────────────────────────── */}
          <g opacity={structureOpacity * exitOpacity * 0.15}>
            {[0, 0.25, 0.5, 0.75, 1].map((x) => (
              <line
                key={`vline-${x}`}
                x1={layout.safeArea.left + x * (layout.width - layout.safeArea.left - layout.safeArea.right)}
                y1={layout.safeArea.top}
                x2={layout.safeArea.left + x * (layout.width - layout.safeArea.left - layout.safeArea.right)}
                y2={layout.height - layout.safeArea.bottom}
                stroke={light.text.muted}
                strokeWidth={1}
              />
            ))}
          </g>

          {/* ── Edges (draw in) ──────────────────────────────────────────– */}
          <g opacity={exitOpacity}>
            {data.edges.map((edge, edgeIdx) => {
              const fromPos = positionMap[edge.from];
              const toPos = positionMap[edge.to];
              if (!fromPos || !toPos) return null;

              const dist = distance(
                fromPos.px,
                fromPos.py,
                toPos.px,
                toPos.py
              );
              const progress = getEdgeProgress(edgeIdx);
              const edgeColor = resolveColor(edge.color || light.text.secondary);

              if (edge.style === "blocked") {
                // Draw line + red X at midpoint
                const midX = (fromPos.px + toPos.px) / 2;
                const midY = (fromPos.py + toPos.py) / 2;
                const angle = Math.atan2(
                  toPos.py - fromPos.py,
                  toPos.px - fromPos.px
                );

                return (
                  <g key={`edge-${edgeIdx}`} opacity={progress}>
                    <line
                      x1={fromPos.px}
                      y1={fromPos.py}
                      x2={toPos.px}
                      y2={toPos.py}
                      stroke={edgeColor}
                      strokeWidth={2}
                    />
                    {/* Red X at midpoint */}
                    <g
                      transform={`translate(${midX}, ${midY}) rotate(${(angle * 180) / Math.PI})`}
                    >
                      <line
                        x1={-12}
                        y1={-12}
                        x2={12}
                        y2={12}
                        stroke={palette.rust}
                        strokeWidth={3}
                      />
                      <line
                        x1={12}
                        y1={-12}
                        x2={-12}
                        y2={12}
                        stroke={palette.rust}
                        strokeWidth={3}
                      />
                    </g>
                  </g>
                );
              } else if (edge.style === "dashed") {
                return (
                  <line
                    key={`edge-${edgeIdx}`}
                    x1={fromPos.px}
                    y1={fromPos.py}
                    x2={toPos.px}
                    y2={toPos.py}
                    stroke={edgeColor}
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    opacity={progress}
                  />
                );
              } else {
                // solid
                return (
                  <line
                    key={`edge-${edgeIdx}`}
                    x1={fromPos.px}
                    y1={fromPos.py}
                    x2={toPos.px}
                    y2={toPos.py}
                    stroke={edgeColor}
                    strokeWidth={2}
                    opacity={progress}
                  />
                );
              }
            })}
          </g>

          {/* ── Nodes ────────────────────────────────────────────────────── */}
          <g opacity={exitOpacity}>
            {data.nodes.map((node, nodeIdx) => {
              const pos = positions[nodeIdx];
              const nodeOpacity = getNodeOpacity(nodeIdx);
              const radius = nodeRadius(node.importance);
              const color = resolveColor(node.color);

              const NodeComponent = (() => {
                switch (node.type) {
                  case "nation":
                    return CircleNode;
                  case "institution":
                    return HexagonNode;
                  case "actor":
                    return RoundedRectNode;
                  case "concept":
                    return DiamondNode;
                  default:
                    return CircleNode;
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
                  opacity={nodeOpacity}
                  stat={node.stat}
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
                const ctrlColor = resolveColor(control.color || palette.rust);

                return (
                  <g key={`control-${ctrlIdx}`}>
                    <rect
                      x={midX - 50}
                      y={midY - 20}
                      width={100}
                      height={40}
                      rx={6}
                      fill="none"
                      stroke={ctrlColor}
                      strokeWidth={2}
                    />
                    <text
                      x={midX}
                      y={midY + 8}
                      textAnchor="middle"
                      fill={ctrlColor}
                      fontSize={fontSizes.caption}
                      fontFamily={fonts.mono}
                      fontWeight={600}
                      letterSpacing={1}
                      filter="url(#text-shadow)"
                    >
                      {control.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ── Callouts ───────────────────────────────────────────────── */}
          {data.callouts && (
            <g opacity={calloutOpacity * exitOpacity}>
              {data.callouts.map((callout, callIdx) => {
                let callX = 0;
                let callY = 0;
                const calloutWidth = 240;
                const calloutHeight = 80;

                if (callout.position === "bottom-right") {
                  callX =
                    layout.width -
                    layout.safeArea.right -
                    calloutWidth -
                    20;
                  callY =
                    layout.height -
                    layout.safeArea.bottom -
                    calloutHeight -
                    20;
                } else if (callout.position === "bottom-left") {
                  callX = layout.safeArea.left + 20;
                  callY =
                    layout.height -
                    layout.safeArea.bottom -
                    calloutHeight -
                    20;
                } else {
                  // top-right
                  callX =
                    layout.width -
                    layout.safeArea.right -
                    calloutWidth -
                    20;
                  callY = layout.safeArea.top + 20;
                }

                return (
                  <g key={`callout-${callIdx}`}>
                    <rect
                      x={callX}
                      y={callY}
                      width={calloutWidth}
                      height={calloutHeight}
                      rx={6}
                      fill={light.bg.surface}
                      stroke={light.text.secondary}
                      strokeWidth={1}
                      opacity={0.9}
                    />
                    <text
                      x={callX + calloutWidth / 2}
                      y={callY + 25}
                      textAnchor="middle"
                      fill={palette.amber}
                      fontSize={fontSizes.h3}
                      fontFamily={fonts.data}
                      fontWeight={700}
                      letterSpacing={1}
                      filter="url(#text-shadow)"
                    >
                      {callout.value}
                    </text>
                    <text
                      x={callX + calloutWidth / 2}
                      y={callY + 50}
                      textAnchor="middle"
                      fill={light.text.secondary}
                      fontSize={fontSizes.caption}
                      fontFamily={fonts.mono}
                      fontWeight={400}
                      letterSpacing={0.5}
                      filter="url(#text-shadow)"
                    >
                      {callout.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ── Source attribution ──────────────────────────────────────– */}
          {data.source && (
            <text
              x={layout.width - layout.safeArea.right}
              y={layout.height - layout.safeArea.bottom + 12}
              textAnchor="end"
              fill={light.text.muted}
              fontSize={fontSizes.meta}
              fontFamily={fonts.mono}
              fontWeight={400}
              letterSpacing={2}
              filter="url(#text-shadow)"
              opacity={exitOpacity}
            >
              {data.source}
            </text>
          )}
        </svg>
        </div>
      </AbsoluteFill>
    </Background>
  );
};

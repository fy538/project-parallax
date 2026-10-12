/**
 * CausalLoopDiagram — feedback-loop visualisation for systems-thinking
 * arguments. Renders nodes connected by polarised arrows, with author-
 * declared loops badged as Reinforcing (R) or Balancing (B).
 *
 * Editorial register: the polarity sign on each arrow + the R/B badge in
 * each loop centroid IS the argument. Use this template when the argument
 * is "this isn't a linear sequence, it's a feedback loop" — security
 * dilemmas, arms races, sanctions spirals, escalation dynamics, monetary
 * feedback.
 *
 * Reveal sequence:
 *   1. Nodes fade in + scale (staggered, ~80ms apart)
 *   2. Edges draw with polarity badge appearing at the arrowhead
 *   3. Loop badges fade in with a rotating arrow showing loop direction
 *
 * @composition-animation: useCompositionAnimation (Ken Burns drift + exit fade)
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fontSizes,
  fontWeights,
  fonts,
  layout,
  palette,
  semantic,
} from "../../design/theme";
import type {
  CausalLoopDiagramData,
  CausalLoopEdge,
  CausalLoopLoop,
  CausalLoopNode,
} from "./types";

// ── Geometry helpers ───────────────────────────────────────────────────────

interface ResolvedNode extends CausalLoopNode {
  px: number; // pixel x in canvas
  py: number; // pixel y in canvas
  radius: number; // bubble radius in px
}

interface ResolvedEdge {
  edge: CausalLoopEdge;
  fromNode: ResolvedNode;
  toNode: ResolvedNode;
  // Cubic-bezier control point for the curved arc.
  cx: number;
  cy: number;
  // Anchor points on node circumference.
  ax: number;
  ay: number;
  bx: number;
  by: number;
  // Polarity badge position (near the arrowhead).
  px: number;
  py: number;
}

// ── Reveal timing ──────────────────────────────────────────────────────────

const NODE_STAGGER_MS = 80;
const NODE_ENTRANCE_MS = 320;
const EDGE_DRAW_MS = 480;
const EDGE_BASE_DELAY_MS = 600; // wait for nodes
const LOOP_BADGE_FADE_MS = 280;

// ── Component ──────────────────────────────────────────────────────────────

export const CausalLoopDiagram: React.FC<{ data: CausalLoopDiagramData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const fps = layout.fps;
  const t = frame / fps; // seconds elapsed
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();

  const canvasW = layout.width;
  const canvasH = layout.height;

  // ── Resolve node geometry ────────────────────────────────────────────────

  const resolvedNodes: ResolvedNode[] = useMemo(() => {
    return data.nodes.map((n) => ({
      ...n,
      px: (n.position.x / 100) * canvasW,
      py: (n.position.y / 100) * canvasH,
      radius: n.emphasis === "primary" ? 78 : 62,
    }));
  }, [data.nodes, canvasW, canvasH]);

  const nodeById = useMemo(() => {
    const m = new Map<string, ResolvedNode>();
    resolvedNodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [resolvedNodes]);

  // ── Resolve edge geometry ────────────────────────────────────────────────

  const resolvedEdges: ResolvedEdge[] = useMemo(() => {
    return data.edges
      .map((edge): ResolvedEdge | null => {
        const fromNode = nodeById.get(edge.from);
        const toNode = nodeById.get(edge.to);
        if (!fromNode || !toNode) return null;

        const dx = toNode.px - fromNode.px;
        const dy = toNode.py - fromNode.py;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / len;
        const uy = dy / len;

        // Anchor points on node circumferences (so arrows don't overlap circles).
        const ax = fromNode.px + ux * fromNode.radius;
        const ay = fromNode.py + uy * fromNode.radius;
        const bx = toNode.px - ux * (toNode.radius + 14); // leave room for arrowhead
        const by = toNode.py - uy * (toNode.radius + 14);

        // Curvature: perpendicular offset from edge midpoint.
        const curveAmt = (edge.curveAmount ?? 18) / 100;
        const sign = edge.curve === "left" ? -1 : edge.curve === "right" ? 1 : 1;
        const midX = (ax + bx) / 2;
        const midY = (ay + by) / 2;
        const perpX = -uy;
        const perpY = ux;
        const cx =
          edge.curve === "straight"
            ? midX
            : midX + perpX * len * curveAmt * sign;
        const cy =
          edge.curve === "straight"
            ? midY
            : midY + perpY * len * curveAmt * sign;

        // Polarity badge sits ~75% along the curve toward the arrowhead.
        // Quadratic bezier formula: B(t) = (1-t)²·A + 2(1-t)t·C + t²·B
        const tBadge = 0.75;
        const bt = 1 - tBadge;
        const px =
          bt * bt * ax + 2 * bt * tBadge * cx + tBadge * tBadge * bx;
        const py =
          bt * bt * ay + 2 * bt * tBadge * cy + tBadge * tBadge * by;

        return { edge, fromNode, toNode, cx, cy, ax, ay, bx, by, px, py };
      })
      .filter((e): e is ResolvedEdge => e !== null);
  }, [data.edges, nodeById]);

  // ── Resolve loop centroids ───────────────────────────────────────────────

  const resolvedLoops = useMemo(() => {
    if (!data.loops) return [];
    return data.loops.map((loop) => {
      const nodes = loop.nodeIds
        .map((id) => nodeById.get(id))
        .filter((n): n is ResolvedNode => n !== undefined);
      const centroid = loop.centroid
        ? {
            x: (loop.centroid.x / 100) * canvasW,
            y: (loop.centroid.y / 100) * canvasH,
          }
        : {
            x:
              nodes.reduce((s, n) => s + n.px, 0) / Math.max(1, nodes.length),
            y:
              nodes.reduce((s, n) => s + n.py, 0) / Math.max(1, nodes.length),
          };
      // Auto-rotation: use the signed area of the node polygon.
      // Positive = counter-clockwise in SVG (y-axis flipped), negative = cw.
      let signedArea = 0;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const b = nodes[(i + 1) % nodes.length];
        signedArea += (b.px - a.px) * (b.py + a.py);
      }
      const autoRotation: "cw" | "ccw" = signedArea > 0 ? "cw" : "ccw";
      const rotation =
        loop.rotation === "auto" || !loop.rotation ? autoRotation : loop.rotation;
      return { loop, centroid, rotation };
    });
  }, [data.loops, nodeById, canvasW, canvasH]);

  // ── Reveal helpers ───────────────────────────────────────────────────────

  /** 0→1 linear progress over [startSec, startSec+durMs/1000]. */
  function progress(startSec: number, durMs: number): number {
    const elapsed = t - startSec;
    if (elapsed <= 0) return 0;
    const dur = durMs / 1000;
    return Math.min(1, elapsed / dur);
  }

  function nodeProgress(i: number): number {
    return progress((i * NODE_STAGGER_MS) / 1000, NODE_ENTRANCE_MS);
  }

  function edgeProgress(i: number, override: number | "auto" | undefined): number {
    const startSec =
      override != null && override !== "auto"
        ? override
        : EDGE_BASE_DELAY_MS / 1000 + (i * 220) / 1000;
    return progress(startSec, EDGE_DRAW_MS);
  }

  function loopProgress(i: number, override: number | "auto" | undefined): number {
    const allEdgesDoneSec =
      EDGE_BASE_DELAY_MS / 1000 +
      (data.edges.length * 220) / 1000 +
      EDGE_DRAW_MS / 1000;
    const startSec =
      override != null && override !== "auto"
        ? override
        : allEdgesDoneSec + (i * 0.3);
    return progress(startSec, LOOP_BADGE_FADE_MS);
  }

  // ── Colour tokens ────────────────────────────────────────────────────────

  const edgeColor = theme.text.primary;
  // Polarity badges: + (cooperation / amplification) uses the episode's
  // primary accent so episodes with a different accent (e.g., crimson
  // for a Chinese-state episode) carry through. Minus (suppression) and
  // R-loop badges always use semantic.china — the "destabilising" / "this
  // is the worrying loop" register is editorially fixed.
  const polarityPlusColor = emphasis.primaryAccent ?? palette.gold;
  const polarityMinusColor = semantic.china;
  const loopReinforcingColor = semantic.china;
  const loopBalancingColor = palette.dustblue;

  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        {/* Canonical title block — POLISH.md L13 (don't hand-build titles).
            TitleBlock provides auto-fit font sizing, FadeIn entrance,
            mode-aware colors, anticipatory sync-point support, and the
            shared safe-area positioning the rest of the template library uses. */}
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
            syncPoints={direction.syncPoints}
          />
        )}

        {/* SVG canvas for the diagram */}
        <svg
          width={canvasW}
          height={canvasH}
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            overflow: "visible",
          }}
        >
          {/* ── Edges (drawn before nodes so circles sit on top) ──────── */}
          {resolvedEdges.map((r, i) => {
            const p = edgeProgress(i, r.edge.revealAtSec);
            if (p <= 0) return null;
            return (
              <EdgePath
                key={`edge-${i}`}
                resolved={r}
                progress={p}
                color={edgeColor}
                polarityColor={
                  r.edge.polarity === "+"
                    ? polarityPlusColor
                    : polarityMinusColor
                }
              />
            );
          })}

          {/* ── Loop badges (drawn over edges, beneath nodes) ─────────── */}
          {resolvedLoops.map((rl, i) => {
            const p = loopProgress(i, rl.loop.revealAtSec);
            if (p <= 0) return null;
            return (
              <LoopBadge
                key={`loop-${rl.loop.id}`}
                loop={rl.loop}
                centroid={rl.centroid}
                rotation={rl.rotation}
                progress={p}
                color={
                  rl.loop.type === "R"
                    ? loopReinforcingColor
                    : loopBalancingColor
                }
                frame={frame}
                mode={mode}
              />
            );
          })}

          {/* ── Nodes (drawn last so they sit on top of edges) ────────── */}
          {resolvedNodes.map((n, i) => (
            <NodeBubble
              key={n.id}
              node={n}
              progress={nodeProgress(i)}
              mode={mode}
            />
          ))}
        </svg>

        {/* Canonical source attribution — POLISH.md L6 enforcer. */}
        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
      </AbsoluteFill>
    </Background>
  );
};

// ── Node bubble ────────────────────────────────────────────────────────────

const NodeBubble: React.FC<{
  node: ResolvedNode;
  progress: number;
  mode: "light" | "dark";
}> = ({ node, progress: p, mode }) => {
  const scale = 0.6 + p * 0.4;
  const opacity = p;
  const fill = mode === "dark" ? palette.midnight : palette.paper;
  const stroke = node.color ?? (mode === "dark" ? palette.bone : palette.ink);
  const textColor = mode === "dark" ? palette.bone : palette.ink;
  const subColor =
    mode === "dark" ? palette.taupe : palette.walnut;

  return (
    <g
      transform={`translate(${node.px} ${node.py}) scale(${scale})`}
      style={{ opacity }}
    >
      <circle
        cx={0}
        cy={0}
        r={node.radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={node.emphasis === "primary" ? 3 : 2}
      />
      <foreignObject
        x={-node.radius + 6}
        y={-node.radius + 6}
        width={node.radius * 2 - 12}
        height={node.radius * 2 - 12}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            textAlign: "center",
            fontFamily: fonts.display,
            color: textColor,
            padding: 4,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              fontSize: node.emphasis === "primary" ? fontSizes.label : fontSizes.caption + 2,
              fontWeight: fontWeights.medium,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              whiteSpace: "pre-wrap",
            }}
          >
            {node.label}
          </div>
          {node.sublabel && (
            <div
              style={{
                fontSize: fontSizes.meta,
                fontWeight: fontWeights.regular,
                color: subColor,
                marginTop: 4,
                lineHeight: 1.2,
              }}
            >
              {node.sublabel}
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
};

// ── Edge path with polarity badge ──────────────────────────────────────────

const EdgePath: React.FC<{
  resolved: ResolvedEdge;
  progress: number;
  color: string;
  polarityColor: string;
}> = ({ resolved, progress: p, color, polarityColor }) => {
  const { ax, ay, bx, by, cx, cy, px, py, edge } = resolved;
  const pathD = `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
  // Approximate path length for stroke-dash animation.
  const approxLen = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2) * 1.15;
  // Arrowhead angle at end point — tangent of the bezier at t=1.
  const tangentX = bx - cx;
  const tangentY = by - cy;
  const angle = Math.atan2(tangentY, tangentX) * (180 / Math.PI);

  // Delay-slash marker (||) at midpoint.
  const midT = 0.5;
  const mt = 1 - midT;
  const mx = mt * mt * ax + 2 * mt * midT * cx + midT * midT * bx;
  const my = mt * mt * ay + 2 * mt * midT * cy + midT * midT * by;
  const slashAngle =
    Math.atan2(
      midT * (by - cy) + mt * (cy - ay),
      midT * (bx - cx) + mt * (cx - ax),
    ) *
    (180 / Math.PI);

  return (
    <g>
      {/* The path itself — stroke-dash animated for draw-in effect. */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={approxLen}
        strokeDashoffset={approxLen * (1 - p)}
        opacity={0.7}
      />
      {/* Arrowhead — only visible after p > 0.85 */}
      {p > 0.85 && (
        <g transform={`translate(${bx} ${by}) rotate(${angle})`}>
          <path
            d="M 0 0 L -18 -9 L -13 0 L -18 9 Z"
            fill={color}
            opacity={(p - 0.85) / 0.15}
          />
        </g>
      )}
      {/* Delay slash marker. */}
      {edge.delay && p > 0.5 && (
        <g
          transform={`translate(${mx} ${my}) rotate(${slashAngle + 90})`}
          opacity={(p - 0.5) / 0.5}
        >
          <line x1={-6} y1={-7} x2={-1} y2={7} stroke={color} strokeWidth={2.5} />
          <line x1={1} y1={-7} x2={6} y2={7} stroke={color} strokeWidth={2.5} />
        </g>
      )}
      {/* Polarity badge — appears once the line is mostly drawn.
          The +/- glyph IS the editorial argument so it gets the loudest
          treatment: filled disc, white glyph, larger size than the
          edge-label hairline. */}
      {p > 0.6 && (
        <g
          transform={`translate(${px} ${py})`}
          opacity={Math.min(1, (p - 0.6) / 0.3)}
        >
          <circle
            cx={0}
            cy={0}
            r={18}
            fill={polarityColor}
            stroke={palette.paper}
            strokeWidth={2}
          />
          <text
            x={0}
            y={0}
            dy=".35em"
            textAnchor="middle"
            fontFamily={fonts.display}
            fontSize={fontSizes.label + 6}
            fontWeight={fontWeights.semibold}
            fill={palette.paper}
          >
            {edge.polarity}
          </text>
        </g>
      )}
      {/* Optional edge label. */}
      {edge.label && p > 0.7 && (
        <g
          transform={`translate(${mx} ${my - 18})`}
          opacity={Math.min(1, (p - 0.7) / 0.3)}
        >
          <text
            x={0}
            y={0}
            textAnchor="middle"
            fontFamily={fonts.serifBody}
            fontStyle="italic"
            fontSize={fontSizes.caption}
            fill={color}
            opacity={0.75}
          >
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
};

// ── Loop badge with rotating direction arrow ───────────────────────────────

const LoopBadge: React.FC<{
  loop: CausalLoopLoop;
  centroid: { x: number; y: number };
  rotation: "cw" | "ccw";
  progress: number;
  color: string;
  frame: number;
  mode: "light" | "dark";
}> = ({ loop, centroid, rotation, progress: p, color, frame, mode }) => {
  // Continuous rotation of the inner arrow (one full revolution per ~3s).
  const rotDegPerFrame = (rotation === "cw" ? 1 : -1) * (360 / (3 * layout.fps));
  const arrowAngle = frame * rotDegPerFrame;
  const badgeRadius = 52;
  const arrowRadius = 36;
  const opacity = p;
  const scale = 0.7 + p * 0.3;
  const labelColor = mode === "dark" ? palette.bone : palette.ink;

  return (
    <g
      transform={`translate(${centroid.x} ${centroid.y}) scale(${scale})`}
      style={{ opacity }}
    >
      {/* Filled disc — the badge is the locus of the loop's identity, so
          it reads as the dominant element at the centroid. */}
      <circle
        cx={0}
        cy={0}
        r={badgeRadius}
        fill={color}
        stroke={palette.paper}
        strokeWidth={3}
      />
      {/* Rotating directional ring — sits just inside the disc edge. */}
      <g transform={`rotate(${arrowAngle})`}>
        <path
          d={
            rotation === "cw"
              ? `M ${arrowRadius} 0 A ${arrowRadius} ${arrowRadius} 0 1 1 ${
                  arrowRadius * Math.cos(Math.PI * 1.4)
                } ${arrowRadius * Math.sin(Math.PI * 1.4)}`
              : `M ${arrowRadius} 0 A ${arrowRadius} ${arrowRadius} 0 1 0 ${
                  arrowRadius * Math.cos(-Math.PI * 1.4)
                } ${arrowRadius * Math.sin(-Math.PI * 1.4)}`
          }
          fill="none"
          stroke={palette.paper}
          strokeWidth={2.5}
          opacity={0.55}
        />
        {/* Arrow tip on the arc — points along loop direction. */}
        <g
          transform={`translate(${arrowRadius * Math.cos(Math.PI * 1.4)} ${
            arrowRadius * Math.sin(Math.PI * 1.4)
          }) rotate(${rotation === "cw" ? 130 : -130})`}
        >
          <path
            d="M 0 0 L -10 -6 L -7 0 L -10 6 Z"
            fill={palette.paper}
            opacity={0.85}
          />
        </g>
      </g>
      {/* Centre label — R1 / B2 — sits ON TOP of the rotating ring. */}
      <text
        x={0}
        y={0}
        dy=".35em"
        textAnchor="middle"
        fontFamily={fonts.display}
        fontSize={fontSizes.h3}
        fontWeight={fontWeights.semibold}
        fill={palette.paper}
      >
        {loop.id}
      </text>
      {/* Loop narrative label beneath the badge */}
      <text
        x={0}
        y={badgeRadius + 24}
        textAnchor="middle"
        fontFamily={fonts.serifBody}
        fontStyle="italic"
        fontSize={fontSizes.label}
        fill={labelColor}
        opacity={0.9}
      >
        {loop.label}
      </text>
    </g>
  );
};


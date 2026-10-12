/**
 * PhilosophicalFamilyTree — intellectual lineage diagram on a year-based axis.
 *
 * The key innovation vs. ArcDiagram: nodes are positioned PROPORTIONALLY by
 * their `year` value, encoding actual historical distance rather than equal
 * spacing. A gap of 300 years reads visually different from a gap of 6 years.
 *
 * Editorial use: "Game theory's genealogy: von Neumann → Nash → Schelling →
 * Axelrod → Ostrom." The form is standard in intellectual history (NYT Book
 * Review phylogenies, history-of-ideas diagrams in academic journals).
 *
 * Arc geometry: quadratic Bezier identical to ArcDiagram, with apex height
 * clamped so long-span arcs stay contained.
 *
 * Animation sequence:
 *   1. Title/subtitle fade in (frames 0–20)
 *   2. Baseline draws left → right (frames 15–35, stroke-dash reveal)
 *   3. Nodes appear left-to-right stagger (frames 25–55)
 *   4. Influence arcs draw in, staggered by from-node x position (frames 45–75)
 *   5. Arc labels fade in after each arc completes (frames 65–90)
 *   6. Legend fades in with node labels (frames 35–55)
 *   7. Source attribution fades in late (last 3 seconds)
 *
 * Uses `useCompositionAnimation({ noDrift: true })` — the year-axis IS the
 * spatial story; Ken Burns drift would fight the temporal encoding.
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
  letterSpacing,
  layout,
  sec,
  contentArea,
} from "../../design/theme";
import {
  fadeIn,
  stagger,
  exitFade,
  anticipatoryStartFrame,
  CLAMP_CUBIC,
  CLAMP,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { warnIf } from "../../utils/dataWarnings";
import type {
  PhilosophicalFamilyTreeData,
  PhilosophicalFamilyTreeThinker,
  PhilosophicalFamilyTreeInfluence,
} from "./types";

// ── Node geometry constants ─────────────────────────────────────────────────
// Mirror ArcDiagram's ArcNodeAnnotation pattern exactly.
const NODE_PRIMARY_R = 5;
const NODE_SECONDARY_R = 3.5;
const NODE_CROSSHAIR_GAP_FROM_DOT = 5;
const NODE_CROSSHAIR_LEN = 9;
const NODE_CROSSHAIR_OPACITY = 0.45;
const NODE_LEADER_GAP_FROM_DOT = 4;
const NODE_LEADER_LEN_SECONDARY = 16;
const NODE_LEADER_LEN_PRIMARY = 20;
const NODE_LEADER_OPACITY = 0.55;
const NODE_DOT_OPACITY = 0.92;
const NODE_RING_OPACITY = 0.35;
const NODE_PRIMARY_RING_R = 11;

// ── Influence type → visual style ───────────────────────────────────────────
type InfluenceStyle = {
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string | undefined;
  opacity: number;
};

const resolveInfluenceStyle = (type: PhilosophicalFamilyTreeInfluence["type"]): InfluenceStyle => {
  switch (type) {
    case "borrowed":
      return { stroke: palette.gold, strokeWidth: 1.5, strokeDasharray: undefined, opacity: 1.0 };
    case "transformed":
      return { stroke: palette.dustblue, strokeWidth: 1.5, strokeDasharray: undefined, opacity: 1.0 };
    case "critique":
      return { stroke: semantic.china, strokeWidth: 1.2, strokeDasharray: "8 4", opacity: 1.0 };
    case "parallel":
      return { stroke: palette.umber, strokeWidth: 1.0, strokeDasharray: "4 4", opacity: 0.7 };
  }
};

// ── Legend configuration ─────────────────────────────────────────────────────
const LEGEND_ITEMS: Array<{
  type: PhilosophicalFamilyTreeInfluence["type"];
  label: string;
}> = [
  { type: "borrowed", label: "borrowed" },
  { type: "transformed", label: "transformed" },
  { type: "critique", label: "critique" },
  { type: "parallel", label: "parallel" },
];

// ── Sub-components ───────────────────────────────────────────────────────────

interface PhilosophicalFamilyTreeNodeProps {
  x: number;
  baselineY: number;
  thinker: PhilosophicalFamilyTreeThinker;
  fill: string;
  textPrimary: string;
  textMuted: string;
  bgBase: string;
  opacity: number;
}

const PhilosophicalFamilyTreeNode: React.FC<PhilosophicalFamilyTreeNodeProps> = React.memo(
  ({ x, baselineY, thinker, fill, textPrimary, textMuted, bgBase, opacity }) => {
    const isPrimary = thinker.importance !== "secondary";
    const r = isPrimary ? NODE_PRIMARY_R : NODE_SECONDARY_R;
    const leaderLen = isPrimary ? NODE_LEADER_LEN_PRIMARY : NODE_LEADER_LEN_SECONDARY;
    const leaderStartY = baselineY + NODE_LEADER_GAP_FROM_DOT;
    const leaderEndY = baselineY + leaderLen;
    const labelY = leaderEndY + fontSizes.label - 2;
    const sublabelY = labelY + (isPrimary ? 20 : 18);

    // axisStamp (year) sits ABOVE the dot, on the x-axis
    const axisStampY = baselineY - NODE_PRIMARY_RING_R - 8;

    return (
      <g opacity={opacity}>
        {/* Year stamp ABOVE the dot — x-axis convention */}
        <text
          x={x}
          y={axisStampY}
          textAnchor="middle"
          fill={textMuted}
          fontSize={fontSizes.meta}
          fontFamily={fonts.mono}
          fontWeight={400}
          letterSpacing={letterSpacing.meta}
          style={{ textTransform: "uppercase" } as React.CSSProperties}
        >
          {String(thinker.year)}
        </text>

        {/* Lateral crosshair hairlines */}
        <line
          x1={x - r - NODE_CROSSHAIR_GAP_FROM_DOT}
          y1={baselineY}
          x2={x - r - NODE_CROSSHAIR_GAP_FROM_DOT - NODE_CROSSHAIR_LEN}
          y2={baselineY}
          stroke={fill}
          strokeWidth={0.6}
          opacity={NODE_CROSSHAIR_OPACITY}
        />
        <line
          x1={x + r + NODE_CROSSHAIR_GAP_FROM_DOT}
          y1={baselineY}
          x2={x + r + NODE_CROSSHAIR_GAP_FROM_DOT + NODE_CROSSHAIR_LEN}
          y2={baselineY}
          stroke={fill}
          strokeWidth={0.6}
          opacity={NODE_CROSSHAIR_OPACITY}
        />

        {/* Halo ring for primary nodes */}
        {isPrimary && (
          <circle
            cx={x}
            cy={baselineY}
            r={NODE_PRIMARY_RING_R}
            fill="none"
            stroke={fill}
            strokeWidth={0.8}
            opacity={NODE_RING_OPACITY}
          />
        )}

        {/* Knockout backing so dot reads cleanly over baseline and arcs */}
        <circle cx={x} cy={baselineY} r={r + 1.5} fill={bgBase} />

        {/* Precision dot */}
        <circle cx={x} cy={baselineY} r={r} fill={fill} opacity={NODE_DOT_OPACITY} />

        {/* Vertical leader line from dot down to label cluster */}
        <line
          x1={x}
          y1={leaderStartY}
          x2={x}
          y2={leaderEndY}
          stroke={fill}
          strokeWidth={0.8}
          opacity={NODE_LEADER_OPACITY}
        />

        {/* Identity label (name) */}
        <text
          x={x}
          y={labelY}
          textAnchor="middle"
          fill={textPrimary}
          fontSize={isPrimary ? fontSizes.label : fontSizes.caption}
          fontFamily={fonts.mono}
          fontWeight={isPrimary ? 600 : 500}
          letterSpacing={1}
        >
          {thinker.name}
        </text>

        {/* Doctrine — smaller, umber */}
        <text
          x={x}
          y={sublabelY}
          textAnchor="middle"
          fill={textMuted}
          fontSize={fontSizes.caption}
          fontFamily={fonts.mono}
          fontWeight={400}
          letterSpacing={letterSpacing.caption}
        >
          {thinker.doctrine}
        </text>
      </g>
    );
  },
);

interface InfluenceArcProps {
  influence: PhilosophicalFamilyTreeInfluence;
  x1: number;
  x2: number;
  baselineY: number;
  maxArcHeight: number;
  arcOpacity: number;
  labelOpacity: number;
  bgBase: string;
}

const InfluenceArc: React.FC<InfluenceArcProps> = React.memo(
  ({ influence, x1, x2, baselineY, maxArcHeight, arcOpacity, labelOpacity, bgBase }) => {
    const style = resolveInfluenceStyle(influence.type);

    const fromX = Math.min(x1, x2);
    const toX = Math.max(x1, x2);
    const halfSpan = (toX - fromX) / 2;
    const apex = Math.max(24, Math.min(halfSpan, maxArcHeight));
    const cpY = baselineY - apex * 2;
    const midX = (fromX + toX) / 2;
    const path = `M ${x1} ${baselineY} Q ${midX} ${cpY} ${x2} ${baselineY}`;

    // Conservative path length upper bound — same calculation as ArcDiagram.
    const maxPathLen = 2 * Math.hypot(halfSpan, apex * 2) + 8;

    // For solid arcs: stroke-dash reveal. For dashed: fade-in (dash conflicts with dash reveal).
    const isDashed = style.strokeDasharray !== undefined;
    const strokeDasharray = isDashed
      ? style.strokeDasharray
      : `${maxPathLen} ${maxPathLen}`;
    const strokeDashoffset = isDashed ? 0 : maxPathLen * (1 - arcOpacity);
    const finalArcOpacity = isDashed ? arcOpacity : 1;

    // Arrowhead: small triangle at x2. Arc tangent at endpoint (Q cx cy x2 y):
    // tangent direction ≈ (x2 - midX, baselineY - cpY) normalized, then pointing into x2.
    const dx = x2 - midX;
    const dy = baselineY - cpY;
    const len = Math.hypot(dx, dy) || 1;
    const tx = (dx / len) * 6;  // arrowhead tip length 6px
    const ty = (dy / len) * 6;
    // Perpendicular for the barb wings
    const px = (-dy / len) * 3;
    const py = (dx / len) * 3;
    const arrowPath = `M ${x2 - tx + px} ${baselineY - ty + py} L ${x2} ${baselineY} L ${x2 - tx - px} ${baselineY - ty - py}`;

    return (
      <g>
        {/* Arc path */}
        <path
          d={path}
          fill="none"
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          opacity={finalArcOpacity * style.opacity * arcOpacity}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray ?? undefined}
          strokeDashoffset={isDashed ? 0 : strokeDashoffset}
        />
        {/* Arrowhead at destination node */}
        <path
          d={arrowPath}
          fill="none"
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={finalArcOpacity * style.opacity * arcOpacity}
        />
        {/* Arc label at apex midpoint */}
        {influence.label && (
          <g opacity={labelOpacity * style.opacity}>
            <rect
              x={midX - influence.label.length * 4}
              y={baselineY - apex - 18}
              width={influence.label.length * 8}
              height={18}
              fill={bgBase}
              opacity={0.85}
              rx={2}
            />
            <text
              x={midX}
              y={baselineY - apex - 4}
              textAnchor="middle"
              fill={style.stroke}
              fontSize={fontSizes.caption}
              fontFamily={fonts.mono}
              fontWeight={500}
              letterSpacing={letterSpacing.caption}
              style={{ textTransform: "lowercase" } as React.CSSProperties}
            >
              {influence.label}
            </text>
          </g>
        )}
      </g>
    );
  },
);

interface LegendRowProps {
  type: PhilosophicalFamilyTreeInfluence["type"];
  label: string;
  opacity: number;
}

const LegendRow: React.FC<LegendRowProps> = React.memo(({ type, label, opacity }) => {
  const style = resolveInfluenceStyle(type);
  const lineY = 0;
  const lineLength = 24;

  return (
    <g opacity={opacity}>
      {/* Sample line */}
      <line
        x1={0}
        y1={lineY}
        x2={lineLength}
        y2={lineY}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray ?? undefined}
        opacity={style.opacity}
        strokeLinecap="round"
      />
      {/* Type label */}
      <text
        x={lineLength + 8}
        y={lineY + 4}
        fill={style.stroke}
        fontSize={fontSizes.meta}
        fontFamily={fonts.mono}
        fontWeight={400}
        letterSpacing={letterSpacing.meta}
        opacity={style.opacity}
      >
        {label}
      </text>
    </g>
  );
});

// ── Main component ────────────────────────────────────────────────────────────

export const PhilosophicalFamilyTree: React.FC<{ data: PhilosophicalFamilyTreeData }> = ({
  data,
}) => {
  // ── Validation warnings ────────────────────────────────────────────────────
  warnIf(
    data.thinkers.length > 12,
    "PhilosophicalFamilyTree",
    `${data.thinkers.length} thinkers — labels will collide above 12 nodes. Consider splitting.`,
  );

  const thinkerIds = useMemo(() => new Set(data.thinkers.map((t) => t.id)), [data.thinkers]);

  data.influences.forEach((inf, i) => {
    warnIf(
      !thinkerIds.has(inf.from),
      "PhilosophicalFamilyTree",
      `influence[${i}].from "${inf.from}" is not found in thinkers array.`,
    );
    warnIf(
      !thinkerIds.has(inf.to),
      "PhilosophicalFamilyTree",
      `influence[${i}].to "${inf.to}" is not found in thinkers array.`,
    );
  });

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  // Year-axis IS the spatial story — no Ken Burns drift.
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);

  // ── Layout ──────────────────────────────────────────────────────────────────
  const area = useMemo(() => contentArea("content", "generous"), []);
  // Baseline sits at ~62% down the content area — arcs have room above,
  // labels (name + doctrine + year stamp) have room below.
  const baselineY = area.top + area.height * 0.62;
  const maxArcHeight = Math.max(60, baselineY - area.top - 30);

  // ── Year-based x positions ─────────────────────────────────────────────────
  const { nodeXs, thinkerIndex } = useMemo(() => {
    const years = data.thinkers.map((t) => t.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const range = maxYear - minYear;
    const inset = area.width * 0.06;
    const usable = area.width - inset * 2;

    const xs = data.thinkers.map((t) => {
      if (range === 0) {
        // All same year → equal spacing (degenerate case)
        const n = data.thinkers.length;
        const idx = data.thinkers.indexOf(t);
        return n === 1
          ? area.left + area.width / 2
          : area.left + inset + (idx / (n - 1)) * usable;
      }
      return area.left + inset + ((t.year - minYear) / range) * usable;
    });

    const index: Record<string, number> = {};
    data.thinkers.forEach((t, i) => {
      index[t.id] = i;
    });

    return { nodeXs: xs, thinkerIndex: index };
  }, [data.thinkers, area.left, area.width]);

  // ── Influence arc layout (sorted by from-node x for stagger ordering) ─────
  const arcLayout = useMemo(() => {
    return data.influences.map((inf, i) => {
      const fromIdx = thinkerIndex[inf.from];
      const toIdx = thinkerIndex[inf.to];
      return {
        inf,
        i,
        fromIdx,
        toIdx,
        x1: fromIdx !== undefined ? nodeXs[fromIdx] : 0,
        x2: toIdx !== undefined ? nodeXs[toIdx] : 0,
        valid: fromIdx !== undefined && toIdx !== undefined,
        // Sort key: left x of the two endpoints, for stagger ordering
        sortX: Math.min(
          fromIdx !== undefined ? nodeXs[fromIdx] : Infinity,
          toIdx !== undefined ? nodeXs[toIdx] : Infinity,
        ),
      };
    });
  }, [data.influences, thinkerIndex, nodeXs]);

  // Sorted arc indices for left-to-right stagger
  const arcOrder = useMemo(
    () =>
      [...arcLayout]
        .sort((a, b) => a.sortX - b.sortX)
        .map((a) => a.i),
    [arcLayout],
  );

  // ── Timing ──────────────────────────────────────────────────────────────────
  const baselineStart = sec(0.4);
  const baselineDuration = sec(0.6);

  // D17 anticipatory reveal: first node settled when narrator names it.
  const firstSyncFrameAD = direction.syncPoints?.[0]?.frame;
  const nodeStart = firstSyncFrameAD != null
    ? anticipatoryStartFrame(firstSyncFrameAD, sec(0.5))
    : sec(0.7);

  const NODE_SETTLE = sec(0.3);
  const nodeStartFrames = useMemo(
    () =>
      data.thinkers.map((_, i) => {
        const cue = direction.syncPoints?.[i]?.frame;
        if (cue !== undefined) {
          return anticipatoryStartFrame(cue, NODE_SETTLE);
        }
        return nodeStart + stagger(i, sec(0.1));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.thinkers, direction.syncPoints, nodeStart],
  );

  const arcStart = sec(1.4);
  const exitOp = exitFade(frame, durationInFrames, 15);

  // ── Baseline draw progress ─────────────────────────────────────────────────
  const baselineProgress = interpolate(
    frame,
    [baselineStart, baselineStart + baselineDuration],
    [0, 1],
    CLAMP_CUBIC,
  );

  // ── Legend fade ────────────────────────────────────────────────────────────
  const legendOpacity = fadeIn(frame, nodeStart, sec(0.4)) * exitOp;

  // ── Year axis tick label opacity ──────────────────────────────────────────
  // Year stamps appear with nodes; overall axis title stamp
  const axisTitleOpacity = fadeIn(frame, baselineStart + sec(0.4), sec(0.4)) * exitOp;

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint ?? undefined}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={bgVariant} metadata={data.episode} />
        <FooterStrip mode={bgVariant} />

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {data.title && (
            <TitleBlock
              title={data.title}
              subtitle={data.subtitle}
              mode={bgVariant}
              safeAreaTier="generous"
              syncPoints={direction.syncPoints}
            />
          )}
        </div>

        <svg
          width={layout.width}
          height={layout.height}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          {/* ── Baseline ────────────────────────────────────────────────
              Draws left → right so it feels like an axis being laid down.
              strokeDashoffset reveal over baselineDuration frames. */}
          <line
            x1={area.left}
            y1={baselineY}
            x2={area.left + area.width * baselineProgress}
            y2={baselineY}
            stroke={theme.text.muted}
            strokeWidth={1}
            opacity={0.42 * exitOp}
          />

          {/* ── "TIME →" axis label at the right edge ───────────────── */}
          <text
            x={area.left + area.width}
            y={baselineY - 8}
            textAnchor="end"
            fill={theme.text.muted}
            fontSize={fontSizes.meta}
            fontFamily={fonts.mono}
            fontWeight={400}
            letterSpacing={letterSpacing.meta}
            opacity={axisTitleOpacity}
            style={{ textTransform: "uppercase" } as React.CSSProperties}
          >
            time →
          </text>

          {/* ── Influence arcs ───────────────────────────────────────────
              Ordered by from-node x position (left → right stagger).
              Solid arcs: stroke-dash reveal.
              Dashed arcs: fade-in (dash pattern conflicts with dash reveal). */}
          {arcOrder.map((origIdx, orderPos) => {
            const arc = arcLayout[origIdx];
            if (!arc || !arc.valid) return null;

            const start = arcStart + stagger(orderPos, sec(0.18));
            const arcProgress = interpolate(
              frame,
              [start, start + sec(0.7)],
              [0, 1],
              CLAMP_CUBIC,
            );
            const labelOpacity =
              fadeIn(frame, start + sec(0.5), sec(0.35)) * exitOp;

            return (
              <InfluenceArc
                key={`arc-${origIdx}`}
                influence={arc.inf}
                x1={arc.x1}
                x2={arc.x2}
                baselineY={baselineY}
                maxArcHeight={maxArcHeight}
                arcOpacity={arcProgress * exitOp}
                labelOpacity={labelOpacity}
                bgBase={theme.bg.base}
              />
            );
          })}

          {/* ── Nodes ────────────────────────────────────────────────────
              Appear left-to-right by sorted x position.
              D17: per-node sync points when provided by _direction. */}
          {data.thinkers.map((thinker, i) => {
            const x = nodeXs[i];
            const start = nodeStartFrames[i];
            if (x === undefined || start === undefined) return null;
            const op = fadeIn(frame, start, sec(0.3)) * exitOp;
            const fill =
              thinker.color === "accent"
                ? palette.gold
                : thinker.color || theme.text.primary;

            return (
              <PhilosophicalFamilyTreeNode
                key={`node-${thinker.id}`}
                x={x}
                baselineY={baselineY}
                thinker={thinker}
                fill={fill}
                textPrimary={theme.text.primary}
                textMuted={theme.text.muted}
                bgBase={theme.bg.base}
                opacity={op}
              />
            );
          })}

          {/* ── Legend (bottom-right) ────────────────────────────────────
              4 rows, one per influence type, with line sample + type name.
              Essential for legibility — viewers won't know the color
              encoding without it. */}
          <g
            transform={`translate(${area.left + area.width - 120}, ${
              area.top + area.height - LEGEND_ITEMS.length * 20 + 10
            })`}
          >
            {LEGEND_ITEMS.map((item, i) => (
              <g key={`legend-${item.type}`} transform={`translate(0, ${i * 20})`}>
                <LegendRow
                  type={item.type}
                  label={item.label}
                  opacity={legendOpacity}
                />
              </g>
            ))}
          </g>

          {/* ── Legend header ─────────────────────────────────────────── */}
          <text
            x={area.left + area.width - 120}
            y={area.top + area.height - LEGEND_ITEMS.length * 20 - 6}
            fill={theme.text.muted}
            fontSize={fontSizes.meta}
            fontFamily={fonts.mono}
            fontWeight={400}
            letterSpacing={letterSpacing.meta}
            opacity={legendOpacity}
            style={{ textTransform: "uppercase" } as React.CSSProperties}
          >
            influence
          </text>
        </svg>

        <SourceAttribution
          source={data.source}
          mode={bgVariant}
          prefix="Source: "
          startSec={1.8}
        />
      </AbsoluteFill>
    </Background>
  );
};

/**
 * ArcDiagram — nodes on a baseline, semicircular arcs above.
 *
 * The editorial form for influence / lineage / succession stories
 * where the ORDER of entities along an axis matters and arcs encode
 * connections across the sequence. Direct sibling of NetworkDiagram
 * (relationship structure between entities) but with the crucial
 * difference that POSITION carries semantic weight here.
 *
 * Animation sequence:
 *   1. Title fades in (handled by TitleBlock)
 *   2. Baseline draws in left-to-right
 *   3. Nodes appear left-to-right with stagger
 *   4. Arcs draw in, ordered by start node, with stroke-dash reveal
 *   5. Arc labels fade in once each arc completes
 *   6. Ken Burns drift + exit fade (via useCompositionAnimation)
 *
 * Arc geometry: each connection is a quadratic bezier from the source
 * node up over a midpoint apex and back down to the destination. The
 * apex height is clamped so a span-the-whole-canvas arc doesn't shoot
 * off the top — short hops still get a proper semicircular feel, long
 * hops get a flatter, contained arc.
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
import { warnIf, checkChartDataCommon } from "../../utils/dataWarnings";
import type { ArcDiagramData, ArcConnection } from "./types";

// Brand-token resolver — keeps "accent" / "muted" / "rebut" semantic in data files.
const resolveArcColor = (
  raw: string | undefined,
  fallback: string,
  accent: string,
  muted: string,
  rebut: string,
): string => {
  if (!raw) return fallback;
  if (raw === "accent") return accent;
  if (raw === "muted") return muted;
  if (raw === "rebut") return rebut;
  return raw;
};

export const ArcDiagram: React.FC<{ data: ArcDiagramData }> = ({ data }) => {
  checkChartDataCommon("ArcDiagram", data);
  warnIf(
    data.nodes.length > 12,
    "ArcDiagram",
    `${data.nodes.length} nodes — ArcDiagram reads cleanest at 5–10 nodes. ` +
      `Above 12, labels collide and short arcs flatten into noise. Consider ` +
      `splitting into two segments or moving to HorizontalTimeline for purely ` +
      `temporal data.`,
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);
  const accent = palette.amber;
  const rebut = palette.rust;

  // Layout. Content area gives us a bounded region beneath the title;
  // baseline sits about 65% down so arcs above have room and labels
  // below have room.
  const area = useMemo(() => contentArea("content", "generous"), []);
  const baselineY = area.top + area.height * 0.62;
  // Arcs are clamped so the apex never crosses into the title zone.
  // Reserve at least 30px breathing room below the title (which sits
  // above area.top). The maximum apex height is the distance from
  // baseline to area.top, minus that buffer.
  const maxArcHeight = Math.max(60, baselineY - area.top - 30);

  // Node x positions — evenly distributed across the content width.
  // Inset 6% on each side so the leftmost / rightmost discs have room
  // for their labels to extend without bleeding into the gutter.
  const nodeXs = useMemo(() => {
    const n = data.nodes.length;
    const inset = area.width * 0.06;
    const usable = area.width - inset * 2;
    return data.nodes.map((_, i) =>
      n === 1
        ? area.left + area.width / 2
        : area.left + inset + (i / (n - 1)) * usable,
    );
  }, [data.nodes, area.left, area.width]);

  const nodeIndex = useMemo(() => {
    const m: Record<string, number> = {};
    data.nodes.forEach((node, idx) => {
      m[node.id] = idx;
    });
    return m;
  }, [data.nodes]);

  // ── Timing ──────────────────────────────────────────────────────────
  const baselineStart = sec(0.4);
  // D17 anticipatory reveal: first node settled when narrator names it.
  const firstSyncFrameAD = direction.syncPoints?.[0]?.frame;
  const nodeStart = firstSyncFrameAD != null
    ? anticipatoryStartFrame(firstSyncFrameAD, sec(0.5))
    : sec(0.7); // existing default
  const arcStart = sec(1.4);
  const exitOp = exitFade(frame, durationInFrames, 15);

  // Baseline draw progress (left → right reveal).
  const baselineProgress = interpolate(
    frame,
    [baselineStart, baselineStart + sec(0.6)],
    [0, 1],
    CLAMP_CUBIC,
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
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={bgVariant} metadata={data.episode} />
        <FooterStrip mode={bgVariant} />

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={bgVariant}
            safeAreaTier="generous"
            syncPoints={direction.syncPoints}
          />
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
          {/* ── Baseline ──────────────────────────────────────────────
              Single thin horizontal rule anchoring the lineage. Draws
              in left-to-right so it feels like an axis being laid down,
              not a static frame element. */}
          {data.showBaseline !== false && (
            <line
              x1={area.left}
              y1={baselineY}
              x2={area.left + area.width * baselineProgress}
              y2={baselineY}
              stroke={theme.text.muted}
              strokeWidth={1}
              opacity={0.42 * exitOp}
            />
          )}

          {/* ── Axis title ────────────────────────────────────────────
              Small caps stamp at the right edge of the baseline. Reads
              as the axis label ("Century", "Generation") without
              competing with the node typography. */}
          {data.axisTitle && (
            <text
              x={area.left + area.width}
              y={baselineY - 8}
              textAnchor="end"
              fill={theme.text.muted}
              fontSize={fontSizes.meta}
              fontFamily={fonts.mono}
              fontWeight={400}
              letterSpacing={letterSpacing.meta}
              opacity={
                fadeIn(frame, baselineStart + sec(0.4), sec(0.4)) * exitOp
              }
              style={{ textTransform: "uppercase" }}
            >
              {data.axisTitle}
            </text>
          )}

          {/* ── Arcs ──────────────────────────────────────────────────
              Each connection is a quadratic bezier going up from `from`
              to apex to `to`. Apex height clamped to maxArcHeight so
              long-span arcs stay contained.

              Animation: stroke-dash reveal. We use a dasharray slightly
              larger than the worst-case path length (~ span + 2*apex)
              so strokeDashoffset can sweep cleanly from full to 0
              without needing path.getTotalLength() (which is unreliable
              during SSR / first-frame render). */}
          {(() => {
            // Pre-compute emphasis state for the whole connection set so
            // the mute hierarchy activates when ANY connection is "accent".
            const someAccentConn = data.connections.some(c => c.emphasis === "accent");

            // E4 — arc-label collision detection.
            // After all arc geometries are known, deconflict labels that share
            // a similar apex-x position so they don't overlap.
            const apexEntries: Array<{ apexX: number; apex: number; label: string; connIdx: number }> = [];
            data.connections.forEach((conn, i) => {
              if (!conn.label) return;
              const fromIdx = nodeIndex[conn.from];
              const toIdx = nodeIndex[conn.to];
              if (fromIdx === undefined || toIdx === undefined) return;
              const [leftIdx, rightIdx] = fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
              const aX = nodeXs[leftIdx];
              const bX = nodeXs[rightIdx];
              if (Math.abs(bX - aX) < 1) return;
              const halfSpan = (bX - aX) / 2;
              const apex = Math.max(24, Math.min(halfSpan, maxArcHeight));
              apexEntries.push({ apexX: (aX + bX) / 2, apex, label: conn.label, connIdx: i });
            });
            // Sort by apexX, then compute verticalOffset per label.
            const sorted = [...apexEntries].sort((a, b) => a.apexX - b.apexX);
            const verticalOffsets: Record<number, number> = {};
            for (let k = 0; k < sorted.length; k++) {
              const cur = sorted[k]!;
              const labelWidth = Math.max(cur.label.length * 7, 60);
              let collides = false;
              if (k > 0) {
                const prev = sorted[k - 1]!;
                if (Math.abs(cur.apexX - prev.apexX) < labelWidth / 2) {
                  collides = true;
                }
              }
              verticalOffsets[cur.connIdx] = collides ? -22 : 0;
            }

            return data.connections.map((conn: ArcConnection, i) => {
            const fromIdx = nodeIndex[conn.from];
            const toIdx = nodeIndex[conn.to];
            if (fromIdx === undefined || toIdx === undefined) return null;

            const [leftIdx, rightIdx] =
              fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
            const aX = nodeXs[leftIdx];
            const bX = nodeXs[rightIdx];
            if (Math.abs(bX - aX) < 1) return null; // self-loop guard

            const halfSpan = (bX - aX) / 2;
            // Apex height: prefer a semicircular feel for short hops,
            // clamp to maxArcHeight for wide spans. Floor at 24 so
            // adjacent-node arcs don't collapse to flat lines.
            const apex = Math.max(24, Math.min(halfSpan, maxArcHeight));
            const cpY = baselineY - apex * 2; // quadratic control point
            const midX = (aX + bX) / 2;
            const path = `M ${aX} ${baselineY} Q ${midX} ${cpY} ${bX} ${baselineY}`;
            // Conservative upper bound on the bezier arc length for the
            // strokeDashoffset reveal. The true bezier length is bounded
            // above by the polyline `|P0-P1| + |P1-P2|`, which for our
            // symmetric quadratic is `2 * sqrt(halfSpan² + (2*apex)²)`.
            // A naive `chord + 2*apex` heuristic UNDER-counts when apex
            // ≈ halfSpan (the common adjacent-node case) and leaves the
            // tail of the arc invisible at progress=1. The +8 is slop
            // to absorb floating-point error.
            const maxPathLen =
              2 * Math.hypot(halfSpan, apex * 2) + 8;

            const strength = conn.strength ?? 1;
            const isDashed = conn.style === "dashed";

            // E1 — emphasis hierarchy.
            const isAccent = conn.emphasis === "accent";
            const isRebut = conn.emphasis === "rebut";
            const isMuted = conn.emphasis === "muted" || (someAccentConn && !isAccent && !isRebut);
            const emphasisOpacity = isMuted ? 0.30 : 1.0;

            // Rebut connections use palette.rust; accent uses amber;
            // otherwise fall through to the color field or theme.text.muted.
            const baseArcColor = resolveArcColor(
              conn.color,
              theme.text.muted,
              accent,
              theme.text.muted,
              rebut,
            );
            const arcColor = isRebut ? rebut : baseArcColor;

            // stagger(index, perItem) — third arg is `baseDelay` added
            // to every item, NOT a max cap. We already add arcStart
            // separately, so don't double-count.
            const start = arcStart + stagger(i, sec(0.18));
            const progress = interpolate(
              frame,
              [start, start + sec(0.7)],
              [0, 1],
              CLAMP_CUBIC,
            );

            // Reveal: for solid arcs, sweep strokeDashoffset; for dashed
            // arcs, fade in opacity (the dash pattern conflicts with a
            // dasharray-based reveal).
            const strokeDasharray = isDashed
              ? "6 5"
              : `${maxPathLen} ${maxPathLen}`;
            const strokeDashoffset = isDashed ? 0 : maxPathLen * (1 - progress);
            const arcOpacity =
              (isDashed ? progress : 1) *
              exitOp *
              (0.45 + Math.min(1, strength) * 0.50) *
              emphasisOpacity;

            const labelOpacity =
              fadeIn(frame, start + sec(0.5), sec(0.35)) * exitOp * emphasisOpacity;

            // E4 — label vertical offset from collision detection pass.
            const labelVOffset = verticalOffsets[i] ?? 0;

            return (
              <g key={`arc-${i}`}>
                {/* Soft glow underlay for hero connections (strength ≥ 1) */}
                {strength >= 1 && !isDashed && (
                  <path
                    d={path}
                    fill="none"
                    stroke={arcColor}
                    strokeWidth={10}
                    opacity={progress * exitOp * 0.10 * emphasisOpacity}
                    strokeLinecap="round"
                  />
                )}
                <path
                  d={path}
                  fill="none"
                  stroke={arcColor}
                  strokeWidth={1 + Math.min(1.5, strength * 1.2)}
                  opacity={arcOpacity}
                  strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                />
                {/* Arc label — sits at the apex with a small backing
                    rect (text-on-line collisions are the main
                    legibility failure of arc diagrams).
                    E4: verticalOffset pushes colliding labels up 22px
                    and a small tick connects them back to the arc apex. */}
                {conn.label && (
                  <g opacity={labelOpacity}>
                    {/* Tick line from apex to pushed label (only when offset) */}
                    {labelVOffset !== 0 && (
                      <line
                        x1={midX}
                        y1={baselineY - apex - 4}
                        x2={midX}
                        y2={baselineY - apex - 4 + labelVOffset}
                        stroke={arcColor}
                        strokeWidth={1}
                        opacity={0.5}
                      />
                    )}
                    <rect
                      x={midX - conn.label.length * 4}
                      y={baselineY - apex - 18 + labelVOffset}
                      width={conn.label.length * 8}
                      height={18}
                      fill={theme.bg.base}
                      opacity={0.85}
                      rx={2}
                    />
                    <text
                      x={midX}
                      y={baselineY - apex - 4 + labelVOffset}
                      textAnchor="middle"
                      fill={arcColor}
                      fontSize={fontSizes.caption}
                      fontFamily={fonts.mono}
                      fontWeight={500}
                      letterSpacing={letterSpacing.caption}
                      style={{ textTransform: "lowercase" }}
                    >
                      {conn.label}
                    </text>
                  </g>
                )}
              </g>
            );
          });
          })()}

          {/* ── Nodes ────────────────────────────────────────────────
              Small filled discs anchored on the baseline. Primary nodes
              get a slightly larger radius and a heavier label weight
              to mark the editorial protagonist(s) of the lineage. */}
          {data.nodes.map((node, i) => {
            const x = nodeXs[i];
            const isPrimary = node.importance === "primary";
            const r = isPrimary ? 9 : 6;
            const start = nodeStart + stagger(i, sec(0.1));
            const op = fadeIn(frame, start, sec(0.3)) * exitOp;
            const fill =
              node.color === "accent"
                ? accent
                : node.color || theme.text.primary;

            return (
              <g key={`node-${node.id}`} opacity={op}>
                {/* Axis stamp ABOVE the disc — the date/era marker */}
                {node.axisStamp && (
                  <text
                    x={x}
                    y={baselineY - r - 12}
                    textAnchor="middle"
                    fill={theme.text.muted}
                    fontSize={fontSizes.meta}
                    fontFamily={fonts.mono}
                    fontWeight={400}
                    letterSpacing={letterSpacing.meta}
                    style={{ textTransform: "uppercase" }}
                  >
                    {node.axisStamp}
                  </text>
                )}
                {/* The disc */}
                <circle cx={x} cy={baselineY} r={r + 3} fill={theme.bg.base} />
                <circle cx={x} cy={baselineY} r={r} fill={fill} />
                {isPrimary && (
                  <circle
                    cx={x}
                    cy={baselineY}
                    r={r + 4}
                    fill="none"
                    stroke={fill}
                    strokeWidth={1}
                    opacity={0.35}
                  />
                )}
                {/* Label below baseline */}
                <text
                  x={x}
                  y={baselineY + r + 22}
                  textAnchor="middle"
                  fill={theme.text.primary}
                  fontSize={isPrimary ? fontSizes.label : fontSizes.caption}
                  fontFamily={fonts.heading}
                  fontWeight={isPrimary ? 700 : 600}
                  letterSpacing={0.5}
                >
                  {node.label}
                </text>
                {node.sublabel && (
                  <text
                    x={x}
                    y={baselineY + r + 22 + (isPrimary ? 22 : 18)}
                    textAnchor="middle"
                    fill={theme.text.muted}
                    fontSize={fontSizes.caption}
                    fontFamily={fonts.mono}
                    fontWeight={400}
                    letterSpacing={letterSpacing.caption}
                  >
                    {node.sublabel}
                  </text>
                )}
              </g>
            );
          })}
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

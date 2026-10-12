/**
 * ChordDiagram — entities arranged on a circle with chord paths encoding
 * bilateral flow magnitude.
 *
 * The editorial form for trade interdependence, alliance webs, and migration
 * networks where EVERY pair-relationship matters. Arc length encodes total
 * traffic volume per entity; chord stroke width encodes bilateral flow volume.
 *
 * Layout math: pure trigonometry, no external libraries.
 *   - cx = 960, cy = 540 (canvas center)
 *   - R = 380 (arc outer radius)
 *   - innerR = 340 (arc inner radius — arcs are 40px wide)
 *   - Entities sorted by total flow (descending) then placed around the circle
 *     with a small GAP_ANGLE = 0.02 rad gap between arcs
 *   - Chord paths: cubic bezier through (0,0) for a natural center-pull curve
 *
 * Animation sequence:
 *   1. Frame 0–sec(0.6): entity arcs scale in from center
 *   2. Frame sec(0.3)–sec(0.8): entity labels fade in with stagger
 *   3. Frame sec(0.6)–sec(2.0): chords fade in sequentially
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
  fontWeights,
  letterSpacing,
  layout,
  sec,
} from "../../design/theme";
import { fadeIn, stagger, CLAMP_CUBIC } from "../../utils/animation";
import { exitFade } from "../../utils/animation";
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
import type { ChordDiagramData, ChordEntity, ChordFlow } from "./types";

// ── Geometry constants ──────────────────────────────────────────────────────
const CX = 960;
const CY = 580;   // shifted down slightly to leave room for TitleBlock
const R = 360;    // outer arc radius
const INNER_R = 320; // inner arc radius — arcs are 40px wide
const GAP_ANGLE = 0.025; // radians between entity arcs
// Label placement: just outside the outer arc
const LABEL_RADIUS = R + 30;
// Chord stroke width range (px)
const CHORD_MIN_WIDTH = 1;
const CHORD_MAX_WIDTH = 8;

// ── Internal layout types ───────────────────────────────────────────────────
interface EntityArc {
  id: string;
  label: string;
  sublabel?: string;
  color: string;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  // Track how much of the arc's angular span has been "allocated" to chords
  // (used for per-chord contact angle computation)
  totalFlow: number;
}

interface ChordLayout {
  fromAngle: number;
  toAngle: number;
  fromColor: string;
  value: number;
  emphasis?: "accent" | "muted";
  label?: string;
}

// ── Utility: polar → cartesian ──────────────────────────────────────────────
function polarToCart(angle: number, radius: number): [number, number] {
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

// ── Utility: SVG arc path for entity arc ────────────────────────────────────
function entityArcPath(
  startAngle: number,
  endAngle: number,
  outerR: number,
  innerR: number,
): string {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  const [ox1, oy1] = polarToCart(startAngle, outerR);
  const [ox2, oy2] = polarToCart(endAngle, outerR);
  const [ix1, iy1] = polarToCart(startAngle, innerR);
  const [ix2, iy2] = polarToCart(endAngle, innerR);

  return [
    `M ${ix1.toFixed(2)},${iy1.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${ix2.toFixed(2)},${iy2.toFixed(2)}`,
    `L ${ox2.toFixed(2)},${oy2.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${ox1.toFixed(2)},${oy1.toFixed(2)}`,
    "Z",
  ].join(" ");
}

// ── Compute layout (memoized) ────────────────────────────────────────────────
function computeLayout(
  entities: ChordEntity[],
  flows: ChordFlow[],
  defaultColors: string[],
): { arcs: EntityArc[]; chords: ChordLayout[] } {
  // Build entity color map
  const entityColor: Record<string, string> = {};
  entities.forEach((e, i) => {
    entityColor[e.id] = e.color ?? defaultColors[i % defaultColors.length] ?? palette.gold;
  });

  // Compute per-entity total flow (both directions)
  const entityFlow: Record<string, number> = {};
  entities.forEach((e) => {
    entityFlow[e.id] = 0;
  });
  flows.forEach((f) => {
    const val = f.bidirectional ? f.value * 2 : f.value;
    entityFlow[f.from] = (entityFlow[f.from] ?? 0) + val;
    entityFlow[f.to] = (entityFlow[f.to] ?? 0) + (f.bidirectional ? f.value * 2 : f.value);
  });

  const grandTotal = Object.values(entityFlow).reduce((a, b) => a + b, 0);

  // Sort entities by total flow descending — largest gets top-right position
  const sorted = [...entities].sort(
    (a, b) => (entityFlow[b.id] ?? 0) - (entityFlow[a.id] ?? 0),
  );

  // Assign arc angles
  const totalGap = GAP_ANGLE * sorted.length;
  const usableAngle = 2 * Math.PI - totalGap;
  const startOffset = -Math.PI / 2; // 12-o'clock start

  const arcs: EntityArc[] = [];
  let cursor = startOffset;
  sorted.forEach((entity) => {
    const flow = entityFlow[entity.id] ?? 0;
    const span = grandTotal > 0 ? (flow / grandTotal) * usableAngle : usableAngle / sorted.length;
    const startAngle = cursor;
    const endAngle = cursor + span;
    const midAngle = (startAngle + endAngle) / 2;
    arcs.push({
      id: entity.id,
      label: entity.label,
      sublabel: entity.sublabel,
      color: entityColor[entity.id] ?? palette.gold,
      startAngle,
      endAngle,
      midAngle,
      totalFlow: flow,
    });
    cursor = endAngle + GAP_ANGLE;
  });

  // Build arc lookup by id
  const arcMap: Record<string, EntityArc> = {};
  arcs.forEach((a) => {
    arcMap[a.id] = a;
  });

  // Track allocated angle within each arc for per-chord contact angle
  const arcAllocated: Record<string, number> = {};
  arcs.forEach((a) => {
    arcAllocated[a.id] = a.startAngle;
  });

  // Build chord layouts
  const chords: ChordLayout[] = [];
  flows.forEach((f) => {
    const fromArc = arcMap[f.from];
    const toArc = arcMap[f.to];
    if (!fromArc || !toArc) return;

    // Compute the angular slice for this flow within the from-arc
    const fromSpan = fromArc.endAngle - fromArc.startAngle;
    const fromFlowFrac = fromArc.totalFlow > 0 ? f.value / fromArc.totalFlow : 0;
    const fromSlice = fromSpan * fromFlowFrac;
    const fromAngle = (arcAllocated[f.from] ?? fromArc.startAngle) + fromSlice / 2;
    arcAllocated[f.from] = (arcAllocated[f.from] ?? fromArc.startAngle) + fromSlice;

    // Same for to-arc
    const toSpan = toArc.endAngle - toArc.startAngle;
    const toFlowFrac = toArc.totalFlow > 0 ? f.value / toArc.totalFlow : 0;
    const toSlice = toSpan * toFlowFrac;
    const toAngle = (arcAllocated[f.to] ?? toArc.startAngle) + toSlice / 2;
    arcAllocated[f.to] = (arcAllocated[f.to] ?? toArc.startAngle) + toSlice;

    chords.push({
      fromAngle,
      toAngle,
      fromColor: fromArc.color,
      value: f.value,
      emphasis: f.emphasis,
      label: f.label,
    });

    // For bidirectional flows, add the reverse chord
    if (f.bidirectional) {
      // We already allocated in both arcs above — just add a second chord
      const fromArc2 = arcMap[f.to];
      const toArc2 = arcMap[f.from];
      if (fromArc2 && toArc2) {
        const fromSpan2 = fromArc2.endAngle - fromArc2.startAngle;
        const fromFlowFrac2 = fromArc2.totalFlow > 0 ? f.value / fromArc2.totalFlow : 0;
        const fromSlice2 = fromSpan2 * fromFlowFrac2;
        const fromAngle2 = (arcAllocated[f.to] ?? fromArc2.startAngle) + fromSlice2 / 2;
        arcAllocated[f.to] = (arcAllocated[f.to] ?? fromArc2.startAngle) + fromSlice2;

        const toSpan2 = toArc2.endAngle - toArc2.startAngle;
        const toFlowFrac2 = toArc2.totalFlow > 0 ? f.value / toArc2.totalFlow : 0;
        const toSlice2 = toSpan2 * toFlowFrac2;
        const toAngle2 = (arcAllocated[f.from] ?? toArc2.startAngle) + toSlice2 / 2;
        arcAllocated[f.from] = (arcAllocated[f.from] ?? toArc2.startAngle) + toSlice2;

        chords.push({
          fromAngle: fromAngle2,
          toAngle: toAngle2,
          fromColor: fromArc2.color,
          value: f.value,
          emphasis: f.emphasis,
          label: undefined, // don't double-label bidirectional
        });
      }
    }
  });

  return { arcs, chords };
}

// ── Default chord colors (fallback palette for unlabeled entities) ───────────
const DEFAULT_ENTITY_COLORS = [
  palette.dustblue,
  palette.gold,
  palette.rust,
  palette.umber,
  palette.taupe,
  palette.sand,
  palette.walnut,
  palette.ink,
];

// ── Component ────────────────────────────────────────────────────────────────
export const ChordDiagram: React.FC<{ data: ChordDiagramData }> = ({ data }) => {
  warnIf(
    data.entities.length < 2,
    "ChordDiagram",
    "ChordDiagram requires at least 2 entities.",
  );
  warnIf(
    data.entities.length > 12,
    "ChordDiagram",
    `${data.entities.length} entities — ChordDiagram reads best at 4–8. Above 12, arc labels and chords collide.`,
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction, "none");
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);
  const exitOp = exitFade(frame, durationInFrames, 15);

  // ── Layout computation (memoized) ──────────────────────────────────────────
  const { arcs, chords } = useMemo(
    () => computeLayout(data.entities, data.flows, DEFAULT_ENTITY_COLORS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.entities, data.flows],
  );

  // Max flow value (for chord width normalization)
  const maxFlowValue = useMemo(
    () => Math.max(...data.flows.map((f) => f.value), 1),
    [data.flows],
  );

  // ── Animation timing ───────────────────────────────────────────────────────
  // Phase 1: arc ring scales in (0 → sec(0.6))
  const arcProgress = interpolate(frame, [0, sec(0.6)], [0, 1], CLAMP_CUBIC);

  // Phase 2: labels fade in with stagger (sec(0.3) → sec(0.8))
  const labelStart = sec(0.3);

  // Phase 3: chords fade in sequentially (sec(0.6) → sec(2.0))
  const chordBaseStart = sec(0.6);
  const chordStagger = sec(0.15);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint}
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
          <g
            transform={`translate(${CX},${CY})`}
            style={{ transform: `translate(${CX}px, ${CY}px)` }}
          >
            {/* ── Scale group: arcs + chords scale from center during entrance */}
            <g
              transform={`scale(${arcProgress})`}
              style={{ transform: `scale(${arcProgress})` }}
            >
              {/* ── Chord paths (below arcs) ──────────────────────────────
                  Cubic bezier through (0,0) — center pull creates the
                  characteristic chord "belly" without hard geometry.
                  Rendered before arcs so arcs appear on top. */}
              {chords.map((chord, i) => {
                const [p1x, p1y] = polarToCart(chord.fromAngle, INNER_R);
                const [p2x, p2y] = polarToCart(chord.toAngle, INNER_R);
                const pathD = `M ${p1x.toFixed(2)},${p1y.toFixed(2)} C 0,0 0,0 ${p2x.toFixed(2)},${p2y.toFixed(2)}`;

                const strokeWidth = CHORD_MIN_WIDTH + (chord.value / maxFlowValue) * (CHORD_MAX_WIDTH - CHORD_MIN_WIDTH);

                const someAccent = data.flows.some((f) => f.emphasis === "accent");
                const isMuted = chord.emphasis === "muted" || (someAccent && chord.emphasis !== "accent");
                const baseOpacity = isMuted ? 0.2 : 0.65;

                const chordStart = chordBaseStart + stagger(i, chordStagger);
                const chordOp =
                  fadeIn(frame, chordStart, sec(0.35)) * exitOp * baseOpacity;

                return (
                  <path
                    key={`chord-${i}`}
                    d={pathD}
                    fill="none"
                    stroke={chord.fromColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    opacity={chordOp}
                  />
                );
              })}

              {/* ── Entity arcs ───────────────────────────────────────────
                  Annular arc segment per entity. Fill at 0.7 opacity;
                  stroke at full opacity to give the arc a crisp edge. */}
              {arcs.map((arc) => {
                const d = entityArcPath(arc.startAngle, arc.endAngle, R, INNER_R);
                return (
                  <path
                    key={`arc-${arc.id}`}
                    d={d}
                    fill={arc.color}
                    fillOpacity={0.7}
                    stroke={arc.color}
                    strokeWidth={1}
                    strokeOpacity={1}
                    opacity={exitOp}
                  />
                );
              })}
            </g>

            {/* ── Entity labels (outside scale group — labels don't scale) */}
            {arcs.map((arc, i) => {
              const angle = arc.midAngle;
              const [lx, ly] = polarToCart(angle, LABEL_RADIUS);

              // Determine text anchor by quadrant
              const cosA = Math.cos(angle);
              const isRight = cosA > 0.2;
              const isLeft = cosA < -0.2;
              const anchor = isRight ? "start" : isLeft ? "end" : "middle";

              // Nudge label outward slightly for left/right extremes
              const nudge = isRight ? 4 : isLeft ? -4 : 0;

              const labelOp =
                fadeIn(frame, labelStart + stagger(i, sec(0.06)), sec(0.35)) *
                exitOp;

              return (
                <g key={`label-${arc.id}`} opacity={labelOp}>
                  {/* Small tick connecting arc to label */}
                  {(() => {
                    const [tickInX, tickInY] = polarToCart(angle, R + 6);
                    const [tickOutX, tickOutY] = polarToCart(angle, R + 16);
                    return (
                      <line
                        x1={tickInX.toFixed(2)}
                        y1={tickInY.toFixed(2)}
                        x2={tickOutX.toFixed(2)}
                        y2={tickOutY.toFixed(2)}
                        stroke={arc.color}
                        strokeWidth={1}
                        opacity={0.6}
                      />
                    );
                  })()}
                  <text
                    x={(lx + nudge).toFixed(2)}
                    y={ly.toFixed(2)}
                    textAnchor={anchor}
                    dominantBaseline="middle"
                    fill={theme.text.primary}
                    fontSize={fontSizes.label}
                    fontFamily={fonts.mono}
                    fontWeight={fontWeights.medium}
                    letterSpacing={letterSpacing.caption}
                  >
                    {arc.label}
                  </text>
                  {arc.sublabel && (
                    <text
                      x={(lx + nudge).toFixed(2)}
                      y={(ly + fontSizes.label + 2).toFixed(2)}
                      textAnchor={anchor}
                      dominantBaseline="middle"
                      fill={theme.text.muted}
                      fontSize={fontSizes.caption}
                      fontFamily={fonts.mono}
                      fontWeight={400}
                      letterSpacing={letterSpacing.caption}
                    >
                      {arc.sublabel}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── Value label at center ──────────────────────────────────
                Small metadata stamp in the center void. */}
            {data.valueLabel && (
              <text
                x={0}
                y={0}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={theme.text.muted}
                fontSize={fontSizes.meta}
                fontFamily={fonts.mono}
                fontWeight={400}
                letterSpacing={letterSpacing.meta}
                opacity={fadeIn(frame, sec(1.0), sec(0.4)) * exitOp * 0.6}
                style={{ textTransform: "uppercase" }}
              >
                {data.valueLabel}
              </text>
            )}
          </g>
        </svg>

        <SourceAttribution
          source={data.source}
          mode={bgVariant}
          prefix="Source: "
          startSec={2.0}
        />
      </AbsoluteFill>
    </Background>
  );
};

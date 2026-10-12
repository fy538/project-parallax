/**
 * SpiralTimeline — cyclical timeline visualisation.
 *
 * Events plotted on a spiral so events at the same angular position
 * (i.e., the same point in a recurring cycle) visually stack across
 * different revolutions. The editorial register IS the rhyme.
 *
 * Reveal sequence:
 *   1. Spiral guide path draws inward→outward
 *   2. Cycle ticks + year guides fade in
 *   3. Events fade in by chronological order, staggered (or by revealAtSec)
 *   4. When two events share an angular position, a faint dashed radial
 *      line draws between them — the visual "rhyme" indicator
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
  SpiralTimelineCategory,
  SpiralTimelineData,
  SpiralTimelineEvent,
} from "./types";

// ── Constants ──────────────────────────────────────────────────────────────

/** Default accent rotation when categories don't supply colors. */
const DEFAULT_ACCENT_COLORS = [
  palette.gold,
  semantic.china,
  palette.dustblue,
  palette.walnut,
  palette.umber,
];

const SPIRAL_DRAW_SEC = 0.6;
const TICK_FADE_SEC = 0.2;
const EVENT_STAGGER_SEC = 0.18;

// Resolved event with screen coords.
interface ResolvedEvent {
  event: SpiralTimelineEvent;
  angle: number; // radians, 0 = right (3 o'clock), CW positive (SVG convention)
  radius: number; // px from canvas centre
  x: number; // px from canvas centre
  y: number; // px from canvas centre
  category?: SpiralTimelineCategory;
  color: string;
  glyph: "circle" | "square" | "diamond" | "triangle";
  revealAtSec: number;
}

// ── Component ──────────────────────────────────────────────────────────────

export const SpiralTimeline: React.FC<{ data: SpiralTimelineData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const fps = layout.fps;
  const t = frame / fps;
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();
  /**
   * Accent rotation — same colour family as DEFAULT_ACCENT_COLORS but with
   * the episode's primary accent inserted first. Episodes that override
   * accent (e.g., crimson for a Chinese-state period episode) lead the
   * spiral's category palette without disturbing the other slots.
   */
  const accentRotation = useMemo(
    () =>
      [
        emphasis.primaryAccent ?? DEFAULT_ACCENT_COLORS[0],
        ...DEFAULT_ACCENT_COLORS.slice(1),
      ],
    [emphasis.primaryAccent],
  );

  const canvasW = layout.width;
  const canvasH = layout.height;

  // Spiral geometry: centred slightly right of mid-canvas to make room for
  // a left-hand title block and legend.
  const cx = canvasW * 0.6;
  const cy = canvasH * 0.5;
  const rMin = 60;
  const rMax = Math.min(canvasW * 0.32, canvasH * 0.42);

  const totalYears = data.endYear - data.startYear;
  const totalRevolutions = totalYears / data.cycleYears;
  const rotationSign = data.rotationDirection === "ccw" ? -1 : 1;
  const spiralDir = data.spiralDirection ?? "outward";
  const showTicks = data.showCycleTicks ?? true;
  const showYearGuides = data.showYearGuides ?? true;

  /** Map a year to spiral coordinates. */
  function yearToCoords(year: number): { angle: number; radius: number } {
    const tNorm = (year - data.startYear) / Math.max(1, totalYears);
    const radius =
      spiralDir === "outward"
        ? rMin + tNorm * (rMax - rMin)
        : rMax - tNorm * (rMax - rMin);
    const cyclePhase = (year - data.startYear) / data.cycleYears; // revolutions
    const angle = rotationSign * cyclePhase * Math.PI * 2 - Math.PI / 2; // start at 12 o'clock
    return { angle, radius };
  }

  // ── Resolved category map ────────────────────────────────────────────────

  const categoryMap = useMemo(() => {
    const m = new Map<string, SpiralTimelineCategory & { resolvedColor: string }>();
    (data.categories ?? []).forEach((c, i) => {
      m.set(c.id, {
        ...c,
        resolvedColor:
          c.color ?? accentRotation[i % accentRotation.length],
      });
    });
    return m;
  }, [data.categories, accentRotation]);

  // ── Resolved events ──────────────────────────────────────────────────────

  const sortedEvents = useMemo(
    () => [...data.events].sort((a, b) => a.year - b.year),
    [data.events],
  );

  const eventsBaseSec = SPIRAL_DRAW_SEC + TICK_FADE_SEC;

  const resolved: ResolvedEvent[] = useMemo(() => {
    return sortedEvents.map((event, i) => {
      const { angle, radius } = yearToCoords(event.year);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const category = event.category
        ? categoryMap.get(event.category)
        : undefined;
      const fallbackColor =
        accentRotation[i % accentRotation.length];
      const color =
        category?.resolvedColor ?? fallbackColor;
      const glyph = category?.glyph ?? "circle";
      const explicit = event.revealAtSec;
      const revealAtSec =
        explicit != null && explicit !== "auto"
          ? explicit
          : eventsBaseSec + i * EVENT_STAGGER_SEC;
      return { event, angle, radius, x, y, category, color, glyph, revealAtSec };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedEvents, categoryMap, totalYears, rotationSign, spiralDir, rMin, rMax]);

  // ── Detect "rhymes" — events that share an angular position ─────────────

  /** Two events rhyme if their angles match within ±5° AND they're on
   * different revolutions (i.e., separated by ≥ 0.5 × cycleYears). */
  const rhymes = useMemo(() => {
    const pairs: Array<[ResolvedEvent, ResolvedEvent]> = [];
    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const a = resolved[i];
        const b = resolved[j];
        const yearGap = Math.abs(b.event.year - a.event.year);
        if (yearGap < data.cycleYears * 0.5) continue;
        // Normalize angles to [0, 2π).
        const aA = ((a.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const bA = ((b.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const angleDiff = Math.min(
          Math.abs(aA - bA),
          Math.PI * 2 - Math.abs(aA - bA),
        );
        if (angleDiff <= (Math.PI / 180) * 8) {
          pairs.push([a, b]);
        }
      }
    }
    return pairs;
  }, [resolved, data.cycleYears]);

  // ── Spiral path ──────────────────────────────────────────────────────────

  const spiralPath = useMemo(() => {
    const steps = Math.max(200, Math.ceil(totalRevolutions * 80));
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const tNorm = i / steps;
      const year = data.startYear + tNorm * totalYears;
      const { angle, radius } = yearToCoords(year);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalRevolutions, totalYears, data.startYear, rotationSign, spiralDir]);

  // ── Reveal progress helpers ──────────────────────────────────────────────

  const spiralP = Math.min(1, t / SPIRAL_DRAW_SEC);
  const ticksP = Math.min(
    1,
    Math.max(0, (t - SPIRAL_DRAW_SEC) / TICK_FADE_SEC),
  );

  // ── Colour tokens ────────────────────────────────────────────────────────

  const spiralColor = mode === "dark" ? palette.taupe : palette.walnut;
  const guideColor =
    mode === "dark" ? palette.midnight : palette.sand;
  const tickColor = mode === "dark" ? palette.bone : palette.ink;

  // Year guides — concentric circles at major round years.
  const yearGuides = useMemo(() => {
    if (!showYearGuides) return [] as Array<{ year: number; r: number }>;
    const span = totalYears;
    let step = 100;
    if (span <= 100) step = 10;
    else if (span <= 250) step = 25;
    else if (span <= 500) step = 50;
    else if (span <= 1000) step = 100;
    else step = 250;
    const guides: Array<{ year: number; r: number }> = [];
    const firstStep = Math.ceil(data.startYear / step) * step;
    for (let y = firstStep; y <= data.endYear; y += step) {
      const { radius } = yearToCoords(y);
      guides.push({ year: y, r: radius });
    }
    return guides;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showYearGuides, totalYears, data.startYear, data.endYear, rotationSign, spiralDir]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        {/* Canonical title block — POLISH.md L13. The cycle annotation
            (template-specific) rides along as a child element below the
            subtitle, in mono small-caps to read as a calibration note. */}
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
            syncPoints={direction.syncPoints}
          >
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.caption,
                color: theme.text.muted,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: 24,
              }}
            >
              ONE REVOLUTION = {data.cycleYears} YEARS
            </div>
          </TitleBlock>
        )}

        {/* Legend (bottom left) */}
        {data.categories && data.categories.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: layout.spacing.xl,
              left: layout.spacing.xl,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              zIndex: 2,
              opacity: Math.min(1, Math.max(0, (t - 1) / 0.5)),
            }}
          >
            {data.categories.map((c, i) => {
              const color =
                c.color ?? accentRotation[i % accentRotation.length];
              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: fonts.mono,
                    fontSize: fontSizes.caption,
                    color: theme.text.secondary,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: c.glyph === "square" ? 0 : "50%",
                      background: color,
                    }}
                  />
                  <span style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {c.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* SVG diagram */}
        <svg
          width={canvasW}
          height={canvasH}
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <g transform={`translate(${cx} ${cy})`}>
            {/* Year guide rings */}
            {ticksP > 0 &&
              yearGuides.map((g) => (
                <g key={`yg-${g.year}`} opacity={ticksP * 0.5}>
                  <circle
                    cx={0}
                    cy={0}
                    r={g.r}
                    fill="none"
                    stroke={guideColor}
                    strokeWidth={1}
                    strokeDasharray="2 4"
                  />
                  <text
                    x={0}
                    y={-g.r + 4}
                    textAnchor="middle"
                    fontFamily={fonts.mono}
                    fontSize={fontSizes.caption}
                    fill={tickColor}
                    opacity={0.75}
                    letterSpacing={1}
                  >
                    {g.year}
                  </text>
                </g>
              ))}

            {/* Cycle ticks (12 angular guides like a clock face) */}
            {ticksP > 0 &&
              showTicks &&
              Array.from({ length: 12 }).map((_, i) => {
                const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
                const x1 = Math.cos(a) * (rMin - 8);
                const y1 = Math.sin(a) * (rMin - 8);
                const x2 = Math.cos(a) * (rMax + 14);
                const y2 = Math.sin(a) * (rMax + 14);
                return (
                  <line
                    key={`tick-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={guideColor}
                    strokeWidth={0.5}
                    opacity={ticksP * 0.6}
                  />
                );
              })}

            {/* The spiral itself */}
            <SpiralPath
              d={spiralPath}
              progress={spiralP}
              color={spiralColor}
            />

            {/* Rhyme indicators — dashed radial lines between matching events */}
            {rhymes.map(([a, b], i) => {
              const showAt = Math.max(a.revealAtSec, b.revealAtSec) + 0.2;
              const fade = Math.min(1, Math.max(0, (t - showAt) / 0.5));
              if (fade <= 0) return null;
              return (
                <line
                  key={`rhyme-${i}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={emphasis.primaryAccent ?? palette.gold}
                  strokeWidth={1.5}
                  strokeDasharray="3 5"
                  opacity={fade * 0.55}
                />
              );
            })}

            {/* Events */}
            {resolved.map((r, i) => {
              const fade = Math.min(1, Math.max(0, (t - r.revealAtSec) / 0.35));
              if (fade <= 0) return null;
              return <EventMarker key={`ev-${i}`} resolved={r} progress={fade} mode={mode} />;
            })}
          </g>
        </svg>

        {/* Canonical source attribution — POLISH.md L6. */}
        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
      </AbsoluteFill>
    </Background>
  );
};

// ── Spiral path with draw-in animation ─────────────────────────────────────

const SpiralPath: React.FC<{
  d: string;
  progress: number;
  color: string;
}> = ({ d, progress: p, color }) => {
  // Approximate path length proportional to area swept; use a generous
  // constant since path length is hard to compute without DOM measurement.
  const approxLen = 6000;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeDasharray={approxLen}
      strokeDashoffset={approxLen * (1 - p)}
      opacity={0.75}
    />
  );
};

// ── Event marker ───────────────────────────────────────────────────────────

const EventMarker: React.FC<{
  resolved: ResolvedEvent;
  progress: number;
  mode: "light" | "dark";
}> = ({ resolved: r, progress: p, mode }) => {
  const isPrimary = r.event.emphasis === "primary";
  const isContext = r.event.emphasis === "context";
  const size = isPrimary ? 9 : isContext ? 3.5 : 6;
  const scale = 0.5 + p * 0.5;
  const opacity = p;
  const labelColor = mode === "dark" ? palette.bone : palette.ink;

  return (
    <g
      transform={`translate(${r.x} ${r.y}) scale(${scale})`}
      style={{ opacity }}
    >
      {/* Glyph */}
      {r.glyph === "circle" && (
        <circle cx={0} cy={0} r={size} fill={r.color} />
      )}
      {r.glyph === "square" && (
        <rect
          x={-size}
          y={-size}
          width={size * 2}
          height={size * 2}
          fill={r.color}
        />
      )}
      {r.glyph === "diamond" && (
        <path
          d={`M 0 ${-size} L ${size} 0 L 0 ${size} L ${-size} 0 Z`}
          fill={r.color}
        />
      )}
      {r.glyph === "triangle" && (
        <path
          d={`M 0 ${-size} L ${size} ${size * 0.8} L ${-size} ${size * 0.8} Z`}
          fill={r.color}
        />
      )}

      {/* Year + label — only for primary/secondary, not context dots */}
      {!isContext && (
        <g>
          <text
            x={size + 8}
            y={-5}
            fontFamily={fonts.mono}
            fontSize={isPrimary ? fontSizes.caption : fontSizes.meta + 1}
            fontWeight={fontWeights.medium}
            fill={r.color}
            opacity={0.95}
            letterSpacing={1}
          >
            {r.event.year}
          </text>
          <text
            x={size + 8}
            y={isPrimary ? 13 : 11}
            fontFamily={fonts.display}
            fontSize={isPrimary ? fontSizes.label - 1 : fontSizes.caption}
            fontWeight={isPrimary ? fontWeights.medium : fontWeights.regular}
            fill={labelColor}
          >
            {r.event.label}
          </text>
        </g>
      )}
    </g>
  );
};

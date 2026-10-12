/**
 * VennDiagram — 2–3 overlapping circles revealing exclusive and shared regions.
 *
 * The canonical Parallax template for overlapping sovereignty stories:
 * alliance membership, dual-commitment structures, contested jurisdictions.
 * The INTERSECTION is the editorial payload — items that belong to multiple
 * institutions simultaneously, and the structural tensions that result.
 *
 * Layout (2-set, the common case):
 *   - Canvas: 1920×1080
 *   - Left circle center:  (764, 540), radius 280
 *   - Right circle center: (1156, 540), radius 280
 *   - Distance between centers: 392px → overlap lens ≈ 168px wide
 *   - Left-only text region center: ~(620, 540)
 *   - Right-only text region center: ~(1300, 540)
 *   - Intersection center: (960, 540)
 *
 * Animation sequence:
 *   1. Left circle fades in (0.4s)
 *   2. Right circle fades in (0.3–0.7s)
 *   3. Intersection region highlights (0.6–0.9s)
 *   4. Left set label + items stagger in (0.5–1.2s)
 *   5. Right set label + items stagger in (0.8–1.5s)
 *   6. Intersection label + items stagger in (1.0–1.8s)
 *
 * Uses { noDrift: true } in useCompositionAnimation — SVG geometry is the
 * content and Ken Burns drift would shift the circles off their optical
 * midpoint, destroying the bilateral balance the form requires.
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
} from "../../design/theme";
import { fadeIn, stagger, exitFade, CLAMP_CUBIC } from "../../utils/animation";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { warnIf } from "../../utils/dataWarnings";
import type { VennDiagramData, VennSet, VennIntersection } from "./types";

// ── Layout constants ──────────────────────────────────────────────────────────
const CIRCLE_RADIUS = 280;
// For a 2-set diagram the circles are centered at these x positions.
// Distance between centers: 392px → overlap lens ≈ 168px wide.
// Formula: lens_width = 2 * sqrt(r² - (d/2)²) where d is center distance.
const LEFT_CX = 764;
const RIGHT_CX = 1156;
const CIRCLE_CY = 540;
// Fill opacities
const EXCLUSIVE_FILL_OPACITY = 0.20;
const INTERSECTION_FILL_OPACITY = 0.35;
const CIRCLE_STROKE_WIDTH = 2.5;

// Default set colors when none provided
const DEFAULT_COLORS = [palette.dustblue, palette.gold, palette.umber];

// ── Bullet list sub-component ─────────────────────────────────────────────────
// Renders a vertical stack of bullet strings centered on (cx, startY).
// Each item staggered via `itemStartBase + stagger(i, itemStagger)`.
interface BulletListSVGProps {
  items: string[];
  cx: number;
  startY: number;
  color: string;
  frame: number;
  itemStartBase: number;
  itemStagger: number;
  exitOp: number;
  fontSize?: number;
  maxWidth?: number;
}

const BulletListSVG: React.FC<BulletListSVGProps> = React.memo(
  ({
    items,
    cx,
    startY,
    color,
    frame,
    itemStartBase,
    itemStagger,
    exitOp,
    fontSize = fontSizes.caption,
    maxWidth = 220,
  }) => {
    const lineHeight = fontSize * 1.55;
    return (
      <>
        {items.slice(0, 5).map((item, i) => {
          const itemStart = itemStartBase + stagger(i, itemStagger);
          const op = fadeIn(frame, itemStart, sec(0.25)) * exitOp;
          const y = startY + i * lineHeight;
          // Truncate long items so they don't overflow the exclusive region
          const maxChars = Math.floor(maxWidth / (fontSize * 0.52));
          const display = item.length > maxChars ? item.slice(0, maxChars - 1) + "…" : item;
          return (
            <g key={`item-${i}`} opacity={op}>
              {/* Bullet dot */}
              <circle cx={cx - 90} cy={y - fontSize * 0.28} r={2.5} fill={color} opacity={0.65} />
              <text
                x={cx - 82}
                y={y}
                fill={color}
                fontSize={fontSize}
                fontFamily={fonts.body}
                fontWeight={fontWeights.regular}
                letterSpacing={letterSpacing.caption}
                opacity={0.88}
              >
                {display}
              </text>
            </g>
          );
        })}
      </>
    );
  }
);

// ── Main component ────────────────────────────────────────────────────────────
export const VennDiagram: React.FC<{ data: VennDiagramData }> = ({ data }) => {
  warnIf(
    data.sets.length > 3,
    "VennDiagram",
    `${data.sets.length} sets — VennDiagram supports 2–3 sets. Above 3, use MatrixHeatmap.`
  );
  warnIf(
    data.sets.some((s) => s.items.length > 5),
    "VennDiagram",
    "A set has >5 items — keep exclusive-region items ≤ 5 for legibility in the circle."
  );
  warnIf(
    data.intersections.some((ix) => ix.items.length > 4),
    "VennDiagram",
    "An intersection has >4 items — keep intersection items ≤ 4; the lens region is tightest."
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  // noDrift: SVG circles must stay on their optical midpoint
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);
  const exitOp = exitFade(frame, durationInFrames, 15);

  const sets = data.sets;
  const is3Set = sets.length === 3;

  // Resolve colors
  const resolvedColors = useMemo(
    () => sets.map((s, i) => s.color ?? DEFAULT_COLORS[i] ?? palette.umber),
    [sets]
  );

  // For 3-set layout, use a triangular arrangement
  // Left: (700, 460), Right: (1220, 460), Bottom: (960, 700)
  const circleCenters = useMemo((): [number, number][] => {
    if (!is3Set) {
      return [[LEFT_CX, CIRCLE_CY], [RIGHT_CX, CIRCLE_CY]];
    }
    return [
      [700, 460],
      [1220, 460],
      [960, 700],
    ];
  }, [is3Set]);

  // The intersection between sets identified by setIds.
  // We find the primary intersection (all sets) and pairwise intersections.
  const primaryIntersection = useMemo<VennIntersection | undefined>(() => {
    // For 2-set: the only intersection. For 3-set: the triple intersection.
    if (!is3Set) return data.intersections[0];
    return data.intersections.find((ix) => ix.setIds.length === 3) ?? data.intersections[0];
  }, [data.intersections, is3Set]);

  // For 2-set layout, compute intersection center (midpoint between circles)
  const intersectionCenter = useMemo<[number, number]>(() => {
    if (!is3Set) {
      return [(LEFT_CX + RIGHT_CX) / 2, CIRCLE_CY];
    }
    // Triple intersection center: centroid of three circle centers
    const cx = (circleCenters[0][0] + circleCenters[1][0] + circleCenters[2][0]) / 3;
    const cy = (circleCenters[0][1] + circleCenters[1][1] + circleCenters[2][1]) / 3;
    return [cx, cy];
  }, [is3Set, circleCenters]);

  // Exclusive region text centers for each set
  // For 2-set: left-only at ~(620, 540), right-only at ~(1300, 540)
  // For 3-set: approximate exclusive region centers pushed outward from each circle
  const exclusiveCenters = useMemo<[number, number][]>(() => {
    if (!is3Set) {
      return [
        [600, CIRCLE_CY],
        [1320, CIRCLE_CY],
      ];
    }
    // Push each exclusive center outward from intersection center
    const [icx, icy] = intersectionCenter;
    return circleCenters.map(([cx, cy]) => {
      const dx = cx - icx;
      const dy = cy - icy;
      const len = Math.hypot(dx, dy) || 1;
      return [cx + (dx / len) * 60, cy + (dy / len) * 60] as [number, number];
    });
  }, [is3Set, circleCenters, intersectionCenter]);

  // ── Timing ────────────────────────────────────────────────────────────
  const leftCircleStart = sec(0.0);
  const rightCircleStart = sec(0.3);
  const thirdCircleStart = sec(0.5);
  const intersectionStart = sec(0.6);
  // Set labels and items
  const leftLabelStart = sec(0.5);
  const rightLabelStart = sec(0.8);
  const thirdLabelStart = sec(1.0);
  const intersectionLabelStart = sec(1.0);

  const leftCircleOp = fadeIn(frame, leftCircleStart, sec(0.4)) * exitOp;
  const rightCircleOp = fadeIn(frame, rightCircleStart, sec(0.4)) * exitOp;
  const thirdCircleOp = is3Set ? fadeIn(frame, thirdCircleStart, sec(0.4)) * exitOp : 0;
  const intersectionHighlightOp = interpolate(
    frame,
    [intersectionStart, intersectionStart + sec(0.3)],
    [0, 1],
    CLAMP_CUBIC
  ) * exitOp;

  const leftLabelOp = fadeIn(frame, leftLabelStart, sec(0.35)) * exitOp;
  const rightLabelOp = fadeIn(frame, rightLabelStart, sec(0.35)) * exitOp;
  const thirdLabelOp = fadeIn(frame, thirdLabelStart, sec(0.35)) * exitOp;
  const intersectionLabelOp = fadeIn(frame, intersectionLabelStart, sec(0.4)) * exitOp;

  // ── Blended intersection color ─────────────────────────────────────────
  // For 2-set: simple average of set[0] and set[1] colors at higher opacity
  // We don't do actual color math; instead render both circles clipped and
  // rely on SVG additive blending. The "blended" fill color for the lens
  // region uses the second set's color.

  return (
    <Background
      variant={bgVariant}
      tint={direction.backgroundTint ?? undefined}
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

        {/* ── SVG Diagram ──────────────────────────────────────────────── */}
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <defs>
            {/* Clip paths — one per circle. Used to render the intersection
                fill clipped to the intersection lens. For 2-set diagrams
                the intersection lens = right circle clipped by left circle.
                For 3-set, each pairwise intersection uses two clip paths. */}
            {circleCenters.map(([cx, cy], i) => (
              <clipPath key={`clip-${i}`} id={`venn-clip-${i}`}>
                <circle cx={cx} cy={cy} r={CIRCLE_RADIUS} />
              </clipPath>
            ))}
          </defs>

          {/* ── Circle fills (exclusive regions, low opacity) ───────────── */}
          {sets.map((set, i) => {
            const [cx, cy] = circleCenters[i] ?? [0, 0];
            const color = resolvedColors[i] ?? palette.dustblue;
            const op = i === 0 ? leftCircleOp : i === 1 ? rightCircleOp : thirdCircleOp;
            return (
              <circle
                key={`fill-${set.id}`}
                cx={cx}
                cy={cy}
                r={CIRCLE_RADIUS}
                fill={color}
                fillOpacity={EXCLUSIVE_FILL_OPACITY}
                stroke={color}
                strokeWidth={CIRCLE_STROKE_WIDTH}
                strokeOpacity={0.85}
                opacity={op}
              />
            );
          })}

          {/* ── Intersection fill (lens region, higher opacity) ──────────
              For 2-set: render the right circle clipped by the left circle.
              For 3-set: render each pairwise intersection + the triple.
              Approach: for each intersection, render a filled version of
              the "smaller" set clipped to the "larger" set's clipPath.
              Uses blendMode mix-blend-mode="multiply" for color mixing. */}
          {!is3Set && (
            /* 2-set: right circle clipped by left → lens fill */
            <circle
              cx={circleCenters[1][0]}
              cy={circleCenters[1][1]}
              r={CIRCLE_RADIUS}
              fill={resolvedColors[1] ?? palette.gold}
              fillOpacity={INTERSECTION_FILL_OPACITY}
              clipPath="url(#venn-clip-0)"
              opacity={intersectionHighlightOp}
            />
          )}
          {is3Set && (
            <>
              {/* AB intersection: set[1] clipped by set[0] */}
              <circle
                cx={circleCenters[1][0]}
                cy={circleCenters[1][1]}
                r={CIRCLE_RADIUS}
                fill={resolvedColors[1] ?? palette.gold}
                fillOpacity={INTERSECTION_FILL_OPACITY}
                clipPath="url(#venn-clip-0)"
                opacity={intersectionHighlightOp}
              />
              {/* AC intersection: set[2] clipped by set[0] */}
              <circle
                cx={circleCenters[2][0]}
                cy={circleCenters[2][1]}
                r={CIRCLE_RADIUS}
                fill={resolvedColors[2] ?? palette.umber}
                fillOpacity={INTERSECTION_FILL_OPACITY}
                clipPath="url(#venn-clip-0)"
                opacity={intersectionHighlightOp}
              />
              {/* BC intersection: set[2] clipped by set[1] */}
              <circle
                cx={circleCenters[2][0]}
                cy={circleCenters[2][1]}
                r={CIRCLE_RADIUS}
                fill={resolvedColors[2] ?? palette.umber}
                fillOpacity={INTERSECTION_FILL_OPACITY}
                clipPath="url(#venn-clip-1)"
                opacity={intersectionHighlightOp}
              />
            </>
          )}

          {/* ── Set labels ───────────────────────────────────────────────── */}
          {sets.map((set, i) => {
            const [ecx, ecy] = exclusiveCenters[i] ?? [0, 0];
            const color = resolvedColors[i] ?? palette.dustblue;
            const op = i === 0 ? leftLabelOp : i === 1 ? rightLabelOp : thirdLabelOp;
            // Label sits above exclusive region center
            const labelY = ecy - 80;
            const itemsStartY = labelY + fontSizes.h2 + 28;

            return (
              <g key={`label-group-${set.id}`} opacity={op}>
                {/* Set label — bold display font */}
                <text
                  x={ecx}
                  y={labelY}
                  textAnchor="middle"
                  fill={color}
                  fontSize={fontSizes.h2}
                  fontFamily={fonts.display}
                  fontWeight={fontWeights.bold}
                  letterSpacing={letterSpacing.h2}
                >
                  {set.label}
                </text>
                {/* Thin rule below label */}
                <line
                  x1={ecx - 60}
                  y1={labelY + 10}
                  x2={ecx + 60}
                  y2={labelY + 10}
                  stroke={color}
                  strokeWidth={0.8}
                  opacity={0.4}
                />
              </g>
            );
          })}

          {/* ── Set items (exclusive region bullet lists) ─────────────── */}
          {sets.map((set, i) => {
            const [ecx, ecy] = exclusiveCenters[i] ?? [0, 0];
            const color = resolvedColors[i] ?? palette.dustblue;
            const labelY = ecy - 80;
            const itemsStartY = labelY + fontSizes.h2 + 34;
            const itemStartBase =
              i === 0 ? leftLabelStart + sec(0.15) :
              i === 1 ? rightLabelStart + sec(0.15) :
              thirdLabelStart + sec(0.15);

            if (set.items.length === 0) return null;
            return (
              <BulletListSVG
                key={`items-${set.id}`}
                items={set.items}
                cx={ecx + 90}
                startY={itemsStartY}
                color={color}
                frame={frame}
                itemStartBase={itemStartBase}
                itemStagger={sec(0.08)}
                exitOp={exitOp}
                fontSize={fontSizes.caption}
                maxWidth={is3Set ? 180 : 230}
              />
            );
          })}

          {/* ── Intersection label + items ────────────────────────────────
              Renders inside the lens (intersection center).
              Label: mono font, uppercase, smaller than set labels.
              Items: bullet list below. */}
          {primaryIntersection && (
            <g>
              {/* Intersection label */}
              {primaryIntersection.label && (
                <text
                  x={intersectionCenter[0]}
                  y={intersectionCenter[1] - (primaryIntersection.items.length > 0 ? 60 : 10)}
                  textAnchor="middle"
                  fill={theme.text.primary}
                  fontSize={fontSizes.label}
                  fontFamily={fonts.mono}
                  fontWeight={fontWeights.semibold}
                  letterSpacing={letterSpacing.meta}
                  opacity={intersectionLabelOp}
                  style={{ textTransform: "uppercase" } as React.CSSProperties}
                >
                  {primaryIntersection.label}
                </text>
              )}
              {/* Thin divider below label */}
              {primaryIntersection.label && (
                <line
                  x1={intersectionCenter[0] - 50}
                  y1={intersectionCenter[1] - (primaryIntersection.items.length > 0 ? 46 : -4)}
                  x2={intersectionCenter[0] + 50}
                  y2={intersectionCenter[1] - (primaryIntersection.items.length > 0 ? 46 : -4)}
                  stroke={theme.text.muted}
                  strokeWidth={0.7}
                  opacity={intersectionLabelOp * 0.5}
                />
              )}
              {/* Intersection bullet items */}
              {primaryIntersection.items.length > 0 && (
                <BulletListSVG
                  items={primaryIntersection.items}
                  cx={intersectionCenter[0] + 90}
                  startY={intersectionCenter[1] - 28}
                  color={theme.text.primary}
                  frame={frame}
                  itemStartBase={intersectionLabelStart + sec(0.2)}
                  itemStagger={sec(0.1)}
                  exitOp={exitOp}
                  fontSize={fontSizes.caption}
                  maxWidth={160}
                />
              )}
            </g>
          )}
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

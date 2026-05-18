/**
 * EditorialDirections — three exploratory layouts comparing how a single
 * dataset (Axelrod cooperation rates) can be presented at editorial register.
 *
 * Each composition is SELF-CONTAINED: it does not import EditorialFrame,
 * DataChart, HeaderStrip, FooterStrip, or any chart-level chrome component.
 * The goal is to evaluate three structural directions against the current
 * production output WITHOUT modifying the existing system. Once a direction
 * wins, the production components can be refactored toward it.
 *
 * The three directions:
 *   A — "Strip the chrome": same side-by-side layout, but every piece of
 *       chart-level chrome is removed and bars are flat. Smallest delta from
 *       current production.
 *   B — "Annotated chart" (FT / NYT Upshot register): stacked composition,
 *       hero number annotated INSIDE the chart pointing at the relevant bar,
 *       reference line for editorial threshold (50% cooperation/defection).
 *   C — "The chart is the page" (Pudding / Bloomberg flagship register): the
 *       hero number IS the design; chart structure miniaturised beneath as a
 *       strip showing the full trajectory.
 *
 * All three render at 1920×1080 against the existing EditorialSurface paper
 * background so the comparison is purely about composition + chart treatment.
 *
 * Data: Axelrod iterated-PD tournament cooperation rates across 200 rounds.
 * Hero claim: cooperation begins at 82% in round one — the one-shot PD model
 * predicts 0%, so even the first iteration breaks the model.
 */

import React from "react";
import { AbsoluteFill, Composition, useCurrentFrame, interpolate } from "remotion";
import { BrandLockup } from "../components/BrandLockup";
import { EditorialSurface } from "../components/EditorialSurface";
import { useCompositionAnimation } from "../hooks/useCompositionAnimation";
import { layout, palette, fonts, fontSizes, sec, semantic, shadows } from "../design/theme";
import { CLAMP_CUBIC, CLAMP_SINE } from "../utils/animation";
import { catalogId } from "./helpers";

// ─── Shared data ────────────────────────────────────────────────────────────

const ROUNDS = [
  { label: "Round 1",   value: 82 },
  { label: "Round 50",  value: 71 },
  { label: "Round 100", value: 67 },
  { label: "Round 150", value: 62 },
  { label: "Round 200", value: 58 },
] as const;

const HIGHLIGHT_INDEX = 0;

// One color for the hero bar; everything else neutral grey. Editorial canon:
// hierarchy through saturation, not through fill-vs-outline.
const HERO_COLOR = palette.gold;
const MUTED_COLOR = "#C7BFB0"; // warm light grey — keyed off paper
const INK = palette.ink;
const BODY_GREY = "#5C5046";
const HAIRLINE = "rgba(28, 24, 20, 0.18)";

// Editorial threshold: cooperation stays above 50% the entire tournament.
// 50% is the cooperation/defection equilibrium line — the editorial meaning
// of "iteration sustains it" is "we never crossed below this line."
const THRESHOLD = 50;

// Easings
const fadeIn = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], CLAMP_SINE);

const slideUp = (frame: number, start: number, dur: number, fromPx = 12) =>
  interpolate(frame, [start, start + dur], [fromPx, 0], CLAMP_CUBIC);

const grow = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], CLAMP_CUBIC);


// ════════════════════════════════════════════════════════════════════════════
// DIRECTION A — "Strip the chrome"
// ════════════════════════════════════════════════════════════════════════════
//
// Same side-by-side layout as the current production EditorialFrame "hero"
// variant. What changes: every piece of chart-level branding chrome is
// removed, bars are flat solid rectangles, the y-axis is gone, and a single
// reference line at 50% carries the editorial meaning.
//
// Smallest delta. Easiest to merge into production.

const DirectionA: React.FC = () => {
  const frame = useCurrentFrame();
  useCompositionAnimation({ noDrift: true });

  // Chart area sizing
  const chartLeft = layout.width * 0.42;
  const chartRight = layout.width - 120;
  const chartTop = 200;
  const chartBottom = layout.height - 220;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const maxValue = 100; // bars are percentages, fix the scale
  const barCount = ROUNDS.length;
  const barWidth = (chartWidth / barCount) * 0.55;
  const barSlot = chartWidth / barCount;

  // Reference-line y position for THRESHOLD
  const thresholdY = chartTop + chartHeight * (1 - THRESHOLD / maxValue);

  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.4}>
        {/* ── Left column: editorial copy ───────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 180,
            left: 110,
            width: layout.width * 0.32 - 110,
            opacity: fadeIn(frame, 0, sec(0.6)),
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.small,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: BODY_GREY,
              marginBottom: 48,
            }}
          >
            cooperation theory
          </div>

          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 168,
              fontWeight: 700,
              lineHeight: 0.92,
              color: INK,
              letterSpacing: -3,
              marginBottom: 32,
              transform: `translateY(${slideUp(frame, sec(0.2), sec(0.7))}px)`,
            }}
          >
            82%
          </div>

          <div
            style={{
              fontFamily: fonts.display,
              fontSize: fontSizes.h2,
              fontWeight: 500,
              lineHeight: 1.15,
              color: INK,
              letterSpacing: -0.5,
              marginBottom: 32,
            }}
          >
            Even round one breaks the model.
          </div>

          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 22,
              lineHeight: 1.5,
              color: BODY_GREY,
              maxWidth: 460,
            }}
          >
            The one-shot Prisoner's Dilemma predicts defection. Axelrod's
            iterated tournament saw 82% cooperation in round one — and
            cooperation never fell below 50% across 200 rounds.
          </div>
        </div>

        {/* ── Right column: the chart (no frame, no branding chrome) ── */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
            overflow: "visible",
          }}
        >
          {/* Threshold reference line at 50%. All bars sit above 50%, so a
              label set INSIDE the plot area (along the dashed line) gets
              sliced up by the bars it crosses. Park the label in the right
              gutter outside chartRight, stacked on two lines so it fits in
              the ~120px available without truncation. */}
          <g opacity={fadeIn(frame, sec(0.4), sec(0.6))}>
            <line
              x1={chartLeft}
              y1={thresholdY}
              x2={chartRight}
              y2={thresholdY}
              stroke={BODY_GREY}
              strokeWidth={1}
              strokeDasharray="6 6"
              opacity={0.4}
            />
            <text
              x={chartRight + 14}
              y={thresholdY - 4}
              textAnchor="start"
              fontFamily={fonts.mono}
              fontSize={fontSizes.small}
              fill={BODY_GREY}
              letterSpacing={1}
              opacity={0.8}
            >
              <tspan x={chartRight + 14} fontWeight={700}>50%</tspan>
              <tspan x={chartRight + 14} dy={20} fontSize={fontSizes.small * 0.85}>threshold</tspan>
            </text>
          </g>

          {/* Bars + labels */}
          {ROUNDS.map((r, i) => {
            const slotCenter = chartLeft + barSlot * (i + 0.5);
            const barX = slotCenter - barWidth / 2;
            const barH = chartHeight * (r.value / maxValue) * grow(frame, sec(0.4) + i * sec(0.08), sec(0.7));
            const barY = chartBottom - barH;
            const isHero = i === HIGHLIGHT_INDEX;
            const color = isHero ? HERO_COLOR : MUTED_COLOR;
            const labelOpacity = fadeIn(frame, sec(0.6) + i * sec(0.08), sec(0.4));

            return (
              <g key={r.label}>
                {/* Bar — flat solid rectangle. No rounding. No gradient. No shadow. */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  fill={color}
                />
                {/* Value label inside the bar (FT-style direct labeling) */}
                <text
                  x={slotCenter}
                  y={barY + 38}
                  textAnchor="middle"
                  fontFamily={fonts.display}
                  fontWeight={700}
                  fontSize={isHero ? 38 : 28}
                  fill={isHero ? INK : INK}
                  opacity={labelOpacity}
                  letterSpacing={-0.5}
                >
                  {r.value}%
                </text>
                {/* Round label below */}
                <text
                  x={slotCenter}
                  y={chartBottom + 30}
                  textAnchor="middle"
                  fontFamily={fonts.mono}
                  fontSize={fontSizes.small}
                  fill={BODY_GREY}
                  letterSpacing={1}
                  opacity={labelOpacity}
                >
                  {r.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Source line — small, directly below the chart, no chrome */}
        <div
          style={{
            position: "absolute",
            top: chartBottom + 80,
            left: chartLeft,
            fontFamily: fonts.body,
            fontStyle: "italic",
            fontSize: fontSizes.small,
            color: BODY_GREY,
            opacity: fadeIn(frame, sec(1.2), sec(0.5)) * 0.7,
          }}
        >
          Source: Axelrod (1984), iterated Prisoner's Dilemma tournament.
        </div>

        {/* Page-level byline — bottom-left, the ONLY brand mark */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 110,
            fontFamily: fonts.mono,
            fontSize: fontSizes.small,
            color: BODY_GREY,
            letterSpacing: 2,
            opacity: fadeIn(frame, sec(1.5), sec(0.5)) * 0.6,
          }}
        >
          <BrandLockup>parallax · cooperation theory · A</BrandLockup>
        </div>
      </EditorialSurface>
    </AbsoluteFill>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// DIRECTION B — "Annotated chart"  (FT / NYT Upshot register)
// ════════════════════════════════════════════════════════════════════════════
//
// Stacked composition: headline top, full-width chart middle, body + source
// bottom. The hero number is INSIDE the chart as a large in-context
// annotation pointing at the bar it describes. The 50% threshold is labeled
// inline. The eye reads ONE composition, not two panels.

const DirectionB: React.FC = () => {
  const frame = useCurrentFrame();
  useCompositionAnimation({ noDrift: true });

  // Headline band: top of page
  const headlineY = 120;
  const subheadY = 220;

  // Chart claims the middle 50% of vertical space
  const chartLeft = 220;
  const chartRight = layout.width - 220;
  const chartTop = 340;
  const chartBottom = 800;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const maxValue = 100;
  const barCount = ROUNDS.length;
  const barWidth = (chartWidth / barCount) * 0.42;
  const barSlot = chartWidth / barCount;

  const thresholdY = chartTop + chartHeight * (1 - THRESHOLD / maxValue);

  // Hero bar position — anchor for the annotation leader
  const heroSlotCenter = chartLeft + barSlot * (HIGHLIGHT_INDEX + 0.5);
  const heroValue = ROUNDS[HIGHLIGHT_INDEX].value;
  const heroBarH = chartHeight * (heroValue / maxValue);
  const heroBarTop = chartBottom - heroBarH;

  // Annotation block sits in the UPPER-RIGHT whitespace of the chart area
  // (above the shorter muted bars, well away from Round 1). A leader line
  // runs diagonally down-left from the annotation's left edge to the top of
  // the hero bar. This is the FT/NYT pattern: the annotation lives in
  // negative space, never over the data.
  const annoX = chartLeft + chartWidth * 0.58;
  const annoY = chartTop + 40;
  const annoWidth = chartWidth * 0.40;

  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.4}>
        {/* ── Top: kicker + headline + subhead ─────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 220,
            fontFamily: fonts.mono,
            fontSize: fontSizes.small,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: BODY_GREY,
            opacity: fadeIn(frame, 0, sec(0.4)),
          }}
        >
          <BrandLockup>parallax · cooperation theory</BrandLockup>
        </div>

        <div
          style={{
            position: "absolute",
            top: headlineY,
            left: 220,
            right: 220,
            fontFamily: fonts.display,
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.0,
            color: INK,
            letterSpacing: -2,
            opacity: fadeIn(frame, sec(0.15), sec(0.5)),
            transform: `translateY(${slideUp(frame, sec(0.15), sec(0.6), 14)}px)`,
          }}
        >
          Even round one breaks the model.
        </div>

        <div
          style={{
            position: "absolute",
            top: subheadY,
            left: 220,
            right: 220,
            fontFamily: fonts.serifBody,
            fontSize: 26,
            fontStyle: "italic",
            lineHeight: 1.4,
            color: BODY_GREY,
            opacity: fadeIn(frame, sec(0.3), sec(0.5)),
          }}
        >
          Axelrod's iterated PD tournament — cooperation rates across 200 rounds.
        </div>

        {/* ── Chart layer ─────────────────────────────────────────────── */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
            overflow: "visible",
          }}
        >
          {/* Threshold reference line — dashed across the plot area, label
              sits in the gutter to the LEFT of the chart, vertically
              centered on the line. Reads as an axis annotation rather than
              floating loose at the canvas edge. */}
          <g opacity={fadeIn(frame, sec(0.5), sec(0.6))}>
            <line
              x1={chartLeft}
              y1={thresholdY}
              x2={chartRight}
              y2={thresholdY}
              stroke={BODY_GREY}
              strokeWidth={1}
              strokeDasharray="6 6"
              opacity={0.4}
            />
            <text
              x={chartRight + 12}
              y={thresholdY + 5}
              textAnchor="start"
              fontFamily={fonts.mono}
              fontSize={fontSizes.small}
              fill={BODY_GREY}
              letterSpacing={1}
              opacity={0.8}
            >
              50% — cooperation / defection
            </text>
          </g>

          {/* Bars — every bar gets its value label above. The hero (Round 1)
              gets a larger, gold-colored label so the data point reads
              first; the prose annotation in the upper-right provides the
              editorial frame, not the number itself. */}
          {ROUNDS.map((r, i) => {
            const slotCenter = chartLeft + barSlot * (i + 0.5);
            const barX = slotCenter - barWidth / 2;
            const barH = chartHeight * (r.value / maxValue) * grow(frame, sec(0.55) + i * sec(0.08), sec(0.7));
            const barY = chartBottom - barH;
            const isHero = i === HIGHLIGHT_INDEX;
            const color = isHero ? HERO_COLOR : MUTED_COLOR;
            const labelOpacity = fadeIn(frame, sec(0.8) + i * sec(0.08), sec(0.4));

            return (
              <g key={r.label}>
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  fill={color}
                />
                <text
                  x={slotCenter}
                  y={barY - 14}
                  textAnchor="middle"
                  fontFamily={fonts.display}
                  fontWeight={isHero ? 700 : 600}
                  fontSize={isHero ? 40 : 26}
                  fill={isHero ? INK : INK}
                  opacity={labelOpacity * (isHero ? 1 : 0.75)}
                  letterSpacing={-0.5}
                >
                  {r.value}%
                </text>
                <text
                  x={slotCenter}
                  y={chartBottom + 30}
                  textAnchor="middle"
                  fontFamily={fonts.mono}
                  fontSize={fontSizes.small}
                  fill={BODY_GREY}
                  letterSpacing={1}
                  opacity={labelOpacity}
                >
                  {r.label}
                </text>
              </g>
            );
          })}

          {/* Prose annotation — lives in the UPPER-RIGHT negative space,
              well away from the Round 1 bar. A hairline leader runs
              diagonally down-left from the annotation's lower-left corner
              to the top of the hero bar. The annotation gives the editorial
              frame ("the model predicts 0%"); the bar's own label carries
              the number. */}
          <g opacity={fadeIn(frame, sec(1.1), sec(0.6))}>
            {/* Leader: starts just left of the annotation block (so the
                anchor isn't inside the text), routes diagonally to the bar
                top. Uses a small terminator dot at the bar end. */}
            {(() => {
              const leaderStartX = annoX - 12;
              const leaderStartY = annoY + 70;
              const leaderEndX = heroSlotCenter;
              const leaderEndY = heroBarTop - 10;
              return (
                <>
                  <line
                    x1={leaderStartX}
                    y1={leaderStartY}
                    x2={leaderEndX}
                    y2={leaderEndY}
                    stroke={HERO_COLOR}
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                  <circle cx={leaderEndX} cy={leaderEndY} r={3.5} fill={HERO_COLOR} />
                </>
              );
            })()}

            <text
              x={annoX}
              y={annoY + 50}
              fontFamily={fonts.display}
              fontWeight={700}
              fontSize={32}
              fill={INK}
              letterSpacing={-0.4}
            >
              The one-shot model predicts 0%.
            </text>
            <text
              x={annoX}
              y={annoY + 92}
              fontFamily={fonts.serifBody}
              fontSize={22}
              fontStyle="italic"
              fill={BODY_GREY}
            >
              <tspan x={annoX} dy={0}>Round one observed 82% cooperation —</tspan>
              <tspan x={annoX} dy={30}>the model breaks on its first iteration.</tspan>
            </text>
          </g>
        </svg>

        {/* ── Bottom: body + source ───────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 870,
            left: 220,
            right: layout.width / 2,
            fontFamily: fonts.serifBody,
            fontSize: 22,
            lineHeight: 1.55,
            color: BODY_GREY,
            opacity: fadeIn(frame, sec(1.3), sec(0.5)),
          }}
        >
          The Prisoner's Dilemma predicts mutual defection. Axelrod ran 200
          rounds; cooperation began at 82% and never fell below half. The
          one-shot model fails on its own first iteration.
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 50,
            left: 220,
            fontFamily: fonts.mono,
            fontSize: fontSizes.small,
            color: BODY_GREY,
            letterSpacing: 1,
            opacity: fadeIn(frame, sec(1.6), sec(0.5)) * 0.6,
          }}
        >
          <BrandLockup
            placement="trailing"
            prefix="Source: Axelrod (1984), iterated tournament"
          >
            parallax · B
          </BrandLockup>
        </div>
      </EditorialSurface>
    </AbsoluteFill>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// DIRECTION C — "The chart is the page"  (Pudding / Bloomberg flagship)
// ════════════════════════════════════════════════════════════════════════════
//
// The hero number IS the typographic design. The bar chart is reduced to a
// horizontal trajectory strip beneath the hero — a sparkline that shows the
// full series without dominating. One line of prose. One source line. No
// other chrome. The eye reads: the answer (82%), the structure (the strip),
// and the citation. Three glances total.

const DirectionC: React.FC = () => {
  const frame = useCurrentFrame();
  useCompositionAnimation({ noDrift: true });

  // Giant number centered horizontally, occupying the upper 60% of canvas
  const heroX = layout.width / 2;
  const heroY = 540;

  // Trajectory strip — horizontal row of small bars beneath the hero
  const stripWidth = 900;
  const stripLeft = (layout.width - stripWidth) / 2;
  const stripTop = 700;
  const stripBarHeight = 110;
  const stripBarSlot = stripWidth / ROUNDS.length;
  const stripBarWidth = stripBarSlot * 0.78;

  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.45}>
        {/* Tiny kicker — barely there */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: fonts.mono,
            fontSize: fontSizes.small,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: BODY_GREY,
            opacity: fadeIn(frame, 0, sec(0.4)) * 0.7,
          }}
        >
          axelrod · 1984 · round one
        </div>

        {/* The hero number — typeset huge.
            The bar emerges from inside the digit shapes by clipping a gold
            rectangle to the silhouette of "82%". Effect: the bar IS the
            number, the number IS the bar. */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
            overflow: "visible",
          }}
        >
          <defs>
            {/* Clip path matching the "82%" text silhouette */}
            <clipPath id="hero-text-clip">
              <text
                x={heroX}
                y={heroY}
                textAnchor="middle"
                fontFamily={fonts.display}
                fontWeight={800}
                fontSize={460}
                letterSpacing={-12}
              >
                82%
              </text>
            </clipPath>
          </defs>

          {/* Ink-colored base text — full letterform in ink */}
          <text
            x={heroX}
            y={heroY}
            textAnchor="middle"
            fontFamily={fonts.display}
            fontWeight={800}
            fontSize={460}
            letterSpacing={-12}
            fill={INK}
            opacity={fadeIn(frame, sec(0.2), sec(0.8))}
          >
            82%
          </text>

          {/* Gold rectangle filling the bottom 82% of the text silhouette.
              `growProgress` rises from 0 to 1 so the gold "fills up" the
              letters like a beaker filling with liquid. The clip is the
              text itself, so the gold only appears INSIDE the glyphs. */}
          {(() => {
            const fillStart = sec(0.6);
            const fillDur = sec(1.2);
            const growProgress = interpolate(
              frame, [fillStart, fillStart + fillDur], [0, 1], CLAMP_CUBIC,
            );
            // Text vertical extent (approx) — fontSize=460, baseline at heroY
            const textTop = heroY - 360;
            const textBottom = heroY + 30;
            const textHeight = textBottom - textTop;
            const fillHeight = textHeight * 0.82 * growProgress;
            const fillY = textBottom - fillHeight;
            return (
              <g clipPath="url(#hero-text-clip)">
                <rect
                  x={heroX - layout.width / 2}
                  y={fillY}
                  width={layout.width}
                  height={fillHeight}
                  fill={HERO_COLOR}
                />
              </g>
            );
          })()}

          {/* Trajectory strip: horizontal row of small bars, one per round.
              Each bar shows its rate INSIDE; round labels below.
              The first bar is gold (matching the hero); others are grey. */}
          {ROUNDS.map((r, i) => {
            const slotCenter = stripLeft + stripBarSlot * (i + 0.5);
            const barX = slotCenter - stripBarWidth / 2;
            const fillRatio = r.value / 100;
            const filledW = stripBarWidth * fillRatio * grow(frame, sec(1.4) + i * sec(0.1), sec(0.5));
            const isHero = i === HIGHLIGHT_INDEX;
            const labelOpacity = fadeIn(frame, sec(1.6) + i * sec(0.1), sec(0.4));

            return (
              <g key={r.label}>
                {/* Track */}
                <rect
                  x={barX}
                  y={stripTop}
                  width={stripBarWidth}
                  height={stripBarHeight}
                  fill="rgba(28, 24, 20, 0.06)"
                />
                {/* Fill — horizontal proportional to value */}
                <rect
                  x={barX}
                  y={stripTop}
                  width={filledW}
                  height={stripBarHeight}
                  fill={isHero ? HERO_COLOR : MUTED_COLOR}
                />
                {/* Value INSIDE the bar */}
                <text
                  x={barX + 18}
                  y={stripTop + stripBarHeight / 2 + 10}
                  fontFamily={fonts.display}
                  fontWeight={700}
                  fontSize={32}
                  fill={INK}
                  opacity={labelOpacity}
                  letterSpacing={-0.5}
                >
                  {r.value}%
                </text>
                {/* Round label BELOW */}
                <text
                  x={slotCenter}
                  y={stripTop + stripBarHeight + 30}
                  textAnchor="middle"
                  fontFamily={fonts.mono}
                  fontSize={fontSizes.small}
                  fill={BODY_GREY}
                  opacity={labelOpacity}
                  letterSpacing={1}
                >
                  {r.label}
                </text>
              </g>
            );
          })}

          {/* Hairline 50% threshold — short tick across each strip bar,
              showing the cooperation/defection line. Editorial meaning. */}
          {ROUNDS.map((r, i) => {
            const slotCenter = stripLeft + stripBarSlot * (i + 0.5);
            const barX = slotCenter - stripBarWidth / 2;
            const xAt50 = barX + stripBarWidth * 0.5;
            return (
              <line
                key={`thresh-${i}`}
                x1={xAt50}
                y1={stripTop - 6}
                x2={xAt50}
                y2={stripTop + stripBarHeight + 6}
                stroke={INK}
                strokeWidth={0.8}
                strokeDasharray="3 3"
                opacity={fadeIn(frame, sec(2.0), sec(0.5)) * 0.35}
              />
            );
          })}
        </svg>

        {/* Single line of prose. Single line of source. That's it. */}
        <div
          style={{
            position: "absolute",
            top: 920,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: fonts.serifBody,
            fontStyle: "italic",
            fontSize: 24,
            color: BODY_GREY,
            opacity: fadeIn(frame, sec(2.2), sec(0.6)),
          }}
        >
          One-shot Prisoner's Dilemma predicts 0% cooperation. The iterated
          tournament begins at 82% — and never falls below 50%.
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: fonts.mono,
            fontSize: fontSizes.small,
            color: BODY_GREY,
            letterSpacing: 2,
            opacity: fadeIn(frame, sec(2.6), sec(0.5)) * 0.5,
          }}
        >
          <BrandLockup>parallax · cooperation theory · C</BrandLockup>
        </div>
      </EditorialSurface>
    </AbsoluteFill>
  );
};


// ─── Composition registrations ──────────────────────────────────────────────

export const CatalogEditorialDirectionA = () => (
  <Composition
    id={catalogId("EditorialDirection", "A")}
    component={DirectionA}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(8)}
    defaultProps={{}}
  />
);

export const CatalogEditorialDirectionB = () => (
  <Composition
    id={catalogId("EditorialDirection", "B")}
    component={DirectionB}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(10)}
    defaultProps={{}}
  />
);

export const CatalogEditorialDirectionC = () => (
  <Composition
    id={catalogId("EditorialDirection", "C")}
    component={DirectionC}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(10)}
    defaultProps={{}}
  />
);


// ════════════════════════════════════════════════════════════════════════════
// DIFFUSION DATASET — the second stress test
// ════════════════════════════════════════════════════════════════════════════
//
// The cooperation chart above has a clean linear scale (all values in
// 0–100%). The diffusion data is far harder: empirical = 4 vs theory = 890.
// Linear scale collapses the 1960s/70s/80s to invisible slabs. This is the
// chart that broke production. Each direction handles the skew differently:
//
//   A — Decade-as-row, bars sized proportional to TOTAL volume per decade,
//       split gold/rust by ratio. Shows BOTH the ratio (constant ~3:1) AND
//       the explosion (each row wider than the last) in one composition.
//   B — Small multiples. Four mini-charts, one per decade, each at its own
//       scale. The 3:1 annotation lives ABOVE each pair so the ratio reads
//       across decades while the absolute totals stay legible.
//   C — Typographic 3:1 where the "3" and "1" digits themselves become
//       proportional bars. The skew vanishes; what survives is the ratio.

const DIFFUSION = [
  { decade: "1960s", theory: 12,  empirical: 4   },
  { decade: "1970s", theory: 38,  empirical: 15  },
  { decade: "1980s", theory: 140, empirical: 62  },
  { decade: "1990s", theory: 890, empirical: 310 },
] as const;

// Aggregate totals across all decades — used by direction C
const DIFFUSION_TOTAL_THEORY = DIFFUSION.reduce((s, d) => s + d.theory, 0);
const DIFFUSION_TOTAL_EMPIRICAL = DIFFUSION.reduce((s, d) => s + d.empirical, 0);

const RUST = "#C23B22"; // semantic.china — second color for the rust/empirical series


// ─── DIRECTION A (diffusion) — variable-width proportional rows ─────────────
//
// Each decade is a horizontal row. The row's WIDTH is proportional to total
// decade volume (12+4=16 → 38+15=53 → 140+62=202 → 890+310=1200), so the eye
// reads the absolute growth as bars getting wider. The row's FILL is split
// gold/rust by the theory/empirical ratio. Reads as "the model accelerated
// AND the ratio held."

const DirectionADiffusion: React.FC = () => {
  const frame = useCurrentFrame();
  useCompositionAnimation({ noDrift: true });

  const chartLeft = layout.width * 0.42;
  const chartRight = layout.width - 140;
  const chartWidth = chartRight - chartLeft;
  const rowsTop = 280;
  const rowHeight = 88;
  const rowGap = 50;

  const maxTotal = Math.max(...DIFFUSION.map(d => d.theory + d.empirical));

  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.4}>
        {/* Left column — editorial copy */}
        <div
          style={{
            position: "absolute",
            top: 180,
            left: 110,
            width: layout.width * 0.32 - 110,
            opacity: fadeIn(frame, 0, sec(0.6)),
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.small,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: BODY_GREY,
              marginBottom: 48,
            }}
          >
            theory diffusion
          </div>

          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 168,
              fontWeight: 700,
              lineHeight: 0.92,
              color: INK,
              letterSpacing: -3,
              marginBottom: 32,
              transform: `translateY(${slideUp(frame, sec(0.2), sec(0.7))}px)`,
            }}
          >
            3:1
          </div>

          <div
            style={{
              fontFamily: fonts.display,
              fontSize: fontSizes.h2,
              fontWeight: 500,
              lineHeight: 1.15,
              color: INK,
              letterSpacing: -0.5,
              marginBottom: 32,
            }}
          >
            Theory outpaced evidence — three to one.
          </div>

          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 22,
              lineHeight: 1.5,
              color: BODY_GREY,
              maxWidth: 460,
            }}
          >
            Across every decade of the game-theory boom, theoretical Prisoner's
            Dilemma papers outpaced empirical tests by roughly 3:1 — while the
            absolute volume grew a hundredfold.
          </div>
        </div>

        {/* Right column — the variable-width row chart */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
            overflow: "visible",
          }}
        >
          {/* Series legend — single inline chip, no axis labels */}
          <g opacity={fadeIn(frame, sec(0.3), sec(0.5))}>
            <rect x={chartLeft} y={rowsTop - 50} width={14} height={14} fill={HERO_COLOR} />
            <text x={chartLeft + 22} y={rowsTop - 38} fontFamily={fonts.mono} fontSize={fontSizes.small} fill={BODY_GREY} letterSpacing={1}>
              THEORY
            </text>
            <rect x={chartLeft + 160} y={rowsTop - 50} width={14} height={14} fill={RUST} />
            <text x={chartLeft + 182} y={rowsTop - 38} fontFamily={fonts.mono} fontSize={fontSizes.small} fill={BODY_GREY} letterSpacing={1}>
              EMPIRICAL
            </text>
          </g>

          {DIFFUSION.map((d, i) => {
            const y = rowsTop + i * (rowHeight + rowGap);
            const total = d.theory + d.empirical;
            const widthScale = total / maxTotal;
            const rowWidth = chartWidth * widthScale;
            const grown = grow(frame, sec(0.4) + i * sec(0.12), sec(0.8));
            const animWidth = rowWidth * grown;
            const theoryRatio = d.theory / total;
            const goldW = animWidth * theoryRatio;
            const rustW = animWidth * (1 - theoryRatio);
            const labelOpacity = fadeIn(frame, sec(0.7) + i * sec(0.12), sec(0.4));
            const ratio = (d.theory / d.empirical).toFixed(1);

            return (
              <g key={d.decade}>
                {/* Decade label — left of the row */}
                <text
                  x={chartLeft - 24}
                  y={y + rowHeight / 2 + 8}
                  textAnchor="end"
                  fontFamily={fonts.mono}
                  fontSize={fontSizes.small}
                  fill={BODY_GREY}
                  letterSpacing={2}
                  opacity={labelOpacity}
                >
                  {d.decade.toUpperCase()}
                </text>

                {/* Theory bar (gold) */}
                <rect x={chartLeft} y={y} width={goldW} height={rowHeight} fill={HERO_COLOR} />
                {/* Empirical bar (rust) */}
                <rect x={chartLeft + goldW} y={y} width={rustW} height={rowHeight} fill={RUST} />

                {/* Absolute totals INSIDE each colored segment, only when wide enough */}
                {goldW > 60 && (
                  <text
                    x={chartLeft + 14}
                    y={y + rowHeight / 2 + 10}
                    fontFamily={fonts.display}
                    fontWeight={700}
                    fontSize={28}
                    fill={INK}
                    opacity={labelOpacity}
                    letterSpacing={-0.3}
                  >
                    {d.theory}
                  </text>
                )}
                {rustW > 40 && (
                  <text
                    x={chartLeft + goldW + 14}
                    y={y + rowHeight / 2 + 10}
                    fontFamily={fonts.display}
                    fontWeight={700}
                    fontSize={28}
                    fill="#FAF6EC"
                    opacity={labelOpacity}
                    letterSpacing={-0.3}
                  >
                    {d.empirical}
                  </text>
                )}

                {/* Ratio annotation to the right of the row */}
                <text
                  x={chartLeft + animWidth + 16}
                  y={y + rowHeight / 2 + 8}
                  fontFamily={fonts.mono}
                  fontSize={20}
                  fill={INK}
                  opacity={labelOpacity}
                  letterSpacing={1}
                >
                  {ratio}:1
                </text>
              </g>
            );
          })}
        </svg>

        {/* Source */}
        <div
          style={{
            position: "absolute",
            bottom: 140,
            left: chartLeft,
            fontFamily: fonts.body,
            fontStyle: "italic",
            fontSize: fontSizes.small,
            color: BODY_GREY,
            opacity: fadeIn(frame, sec(1.4), sec(0.5)) * 0.7,
          }}
        >
          Source: JSTOR citation analysis, PD-keyword publications 1960–1999.
        </div>

        {/* Page byline */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 110,
            fontFamily: fonts.mono,
            fontSize: fontSizes.small,
            color: BODY_GREY,
            letterSpacing: 2,
            opacity: fadeIn(frame, sec(1.6), sec(0.5)) * 0.6,
          }}
        >
          <BrandLockup>parallax · academic analysis · A</BrandLockup>
        </div>
      </EditorialSurface>
    </AbsoluteFill>
  );
};


// ─── DIRECTION B (diffusion) — small multiples ─────────────────────────────
//
// Four mini-charts, one per decade. Each at its OWN scale (so the 1960s pair
// is visually proportionate even though both values are tiny). Each panel
// labels its ratio explicitly. The eye reads ratio-consistency across panels
// while absolute totals stay legible.

const DirectionBDiffusion: React.FC = () => {
  const frame = useCurrentFrame();
  useCompositionAnimation({ noDrift: true });

  // Headline band
  const headlineY = 130;
  const subheadY = 230;

  // Small-multiples grid: 4 panels in a row
  const panelsTop = 360;
  const panelsBottom = 800;
  const panelHeight = panelsBottom - panelsTop;
  const panelSpacing = 60;
  const totalWidth = layout.width - 440;
  const panelWidth = (totalWidth - panelSpacing * 3) / 4;
  const panelsLeft = 220;

  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.4}>
        {/* Kicker */}
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 220,
            fontFamily: fonts.mono,
            fontSize: fontSizes.small,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: BODY_GREY,
            opacity: fadeIn(frame, 0, sec(0.4)),
          }}
        >
          <BrandLockup>parallax · theory diffusion</BrandLockup>
        </div>

        {/* Headline */}
        <div
          style={{
            position: "absolute",
            top: headlineY,
            left: 220,
            right: 220,
            fontFamily: fonts.display,
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.0,
            color: INK,
            letterSpacing: -2,
            opacity: fadeIn(frame, sec(0.15), sec(0.5)),
            transform: `translateY(${slideUp(frame, sec(0.15), sec(0.6), 14)}px)`,
          }}
        >
          Theory outpaced evidence, three to one.
        </div>

        <div
          style={{
            position: "absolute",
            top: subheadY,
            left: 220,
            right: 220,
            fontFamily: fonts.serifBody,
            fontSize: 26,
            fontStyle: "italic",
            lineHeight: 1.4,
            color: BODY_GREY,
            opacity: fadeIn(frame, sec(0.3), sec(0.5)),
          }}
        >
          PD-keyword scholarly publications by decade. Theory papers in gold, empirical studies in rust.
        </div>

        {/* Small-multiples panels */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
            overflow: "visible",
          }}
        >
          {DIFFUSION.map((d, i) => {
            const px = panelsLeft + i * (panelWidth + panelSpacing);
            const panelMax = Math.max(d.theory, d.empirical);
            const barAreaH = panelHeight - 120; // reserve top for value labels, bottom for ratio
            const barWidth = panelWidth * 0.32;
            const gap = panelWidth * 0.08;
            const pairWidth = barWidth * 2 + gap;
            const pairLeft = px + (panelWidth - pairWidth) / 2;
            const grown = grow(frame, sec(0.5) + i * sec(0.12), sec(0.8));
            const theoryH = (d.theory / panelMax) * barAreaH * grown;
            const empH = (d.empirical / panelMax) * barAreaH * grown;
            const barsBottom = panelsTop + barAreaH + 30;
            const labelOpacity = fadeIn(frame, sec(0.8) + i * sec(0.12), sec(0.4));
            const ratio = (d.theory / d.empirical).toFixed(1);

            return (
              <g key={d.decade}>
                {/* Theory bar */}
                <rect
                  x={pairLeft}
                  y={barsBottom - theoryH}
                  width={barWidth}
                  height={theoryH}
                  fill={HERO_COLOR}
                />
                {/* Theory value above */}
                <text
                  x={pairLeft + barWidth / 2}
                  y={barsBottom - theoryH - 12}
                  textAnchor="middle"
                  fontFamily={fonts.display}
                  fontWeight={700}
                  fontSize={28}
                  fill={INK}
                  opacity={labelOpacity}
                  letterSpacing={-0.3}
                >
                  {d.theory}
                </text>

                {/* Empirical bar */}
                <rect
                  x={pairLeft + barWidth + gap}
                  y={barsBottom - empH}
                  width={barWidth}
                  height={empH}
                  fill={RUST}
                />
                <text
                  x={pairLeft + barWidth + gap + barWidth / 2}
                  y={barsBottom - empH - 12}
                  textAnchor="middle"
                  fontFamily={fonts.display}
                  fontWeight={700}
                  fontSize={28}
                  fill={INK}
                  opacity={labelOpacity}
                  letterSpacing={-0.3}
                >
                  {d.empirical}
                </text>

                {/* Decade label below the bars */}
                <text
                  x={px + panelWidth / 2}
                  y={barsBottom + 36}
                  textAnchor="middle"
                  fontFamily={fonts.display}
                  fontWeight={600}
                  fontSize={26}
                  fill={INK}
                  opacity={labelOpacity}
                  letterSpacing={-0.3}
                >
                  {d.decade}
                </text>

                {/* Ratio annotation — the editorial point per panel */}
                <text
                  x={px + panelWidth / 2}
                  y={barsBottom + 70}
                  textAnchor="middle"
                  fontFamily={fonts.mono}
                  fontSize={fontSizes.small}
                  fill={BODY_GREY}
                  opacity={labelOpacity}
                  letterSpacing={2}
                >
                  {ratio} : 1
                </text>

                {/* Hairline beneath each panel — visual separation without a box */}
                <line
                  x1={px + 20}
                  y1={barsBottom + 95}
                  x2={px + panelWidth - 20}
                  y2={barsBottom + 95}
                  stroke={HAIRLINE}
                  strokeWidth={1}
                  opacity={labelOpacity * 0.5}
                />
              </g>
            );
          })}
        </svg>

        {/* Body */}
        <div
          style={{
            position: "absolute",
            top: 870,
            left: 220,
            right: layout.width / 2,
            fontFamily: fonts.serifBody,
            fontSize: 22,
            lineHeight: 1.55,
            color: BODY_GREY,
            opacity: fadeIn(frame, sec(1.5), sec(0.5)),
          }}
        >
          The ratio held while the absolute volume grew a hundredfold. The
          Prisoner's Dilemma conquered the literature; the experiments to test
          it didn't keep pace.
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 50,
            left: 220,
            fontFamily: fonts.mono,
            fontSize: fontSizes.small,
            color: BODY_GREY,
            letterSpacing: 1,
            opacity: fadeIn(frame, sec(1.8), sec(0.5)) * 0.6,
          }}
        >
          <BrandLockup placement="trailing" prefix="Source: JSTOR citation analysis">
            parallax · B
          </BrandLockup>
        </div>
      </EditorialSurface>
    </AbsoluteFill>
  );
};


// ─── DIRECTION C (diffusion) — typographic 3:1 ──────────────────────────────
//
// The "3" and "1" digits ARE the visualization. Each digit is filled
// proportionally — "3" filled to 100% gold (the dominant share), "1" filled
// to 33% rust (the minority share, inverse of the 3:1 ratio). Beneath: a
// single aggregate bar split 76% gold / 24% rust across all decades 1960-99.
// The skew disappears entirely — what remains is the structural ratio.

const DirectionCDiffusion: React.FC = () => {
  const frame = useCurrentFrame();
  useCompositionAnimation({ noDrift: true });

  // The big "3 : 1" centerpiece
  const heroY = 540;
  const digitSize = 480;

  // Position the "3", colon, and "1" individually so each digit has its own clip
  const threeX = layout.width / 2 - 200;
  const colonX = layout.width / 2;
  const oneX = layout.width / 2 + 200;

  // Aggregate proportional bar beneath
  const aggBarTop = 720;
  const aggBarHeight = 88;
  const aggBarWidth = 900;
  const aggBarLeft = (layout.width - aggBarWidth) / 2;

  const totalAll = DIFFUSION_TOTAL_THEORY + DIFFUSION_TOTAL_EMPIRICAL;
  const theoryRatio = DIFFUSION_TOTAL_THEORY / totalAll;

  return (
    <AbsoluteFill>
      <EditorialSurface intensity={0.45}>
        {/* Tiny kicker */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: fonts.mono,
            fontSize: fontSizes.small,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: BODY_GREY,
            opacity: fadeIn(frame, 0, sec(0.4)) * 0.7,
          }}
        >
          theory : empirical · 1960 – 1999
        </div>

        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
            overflow: "visible",
          }}
        >
          <defs>
            {/* Clip path matching the "3" silhouette only */}
            <clipPath id="three-clip">
              <text
                x={threeX}
                y={heroY}
                textAnchor="middle"
                fontFamily={fonts.display}
                fontWeight={800}
                fontSize={digitSize}
                letterSpacing={-12}
              >
                3
              </text>
            </clipPath>
            {/* Clip path matching the "1" silhouette only */}
            <clipPath id="one-clip">
              <text
                x={oneX}
                y={heroY}
                textAnchor="middle"
                fontFamily={fonts.display}
                fontWeight={800}
                fontSize={digitSize}
                letterSpacing={-12}
              >
                1
              </text>
            </clipPath>
          </defs>

          {/* Ink-base letterforms — "3 : 1" — fade in first */}
          <text
            x={threeX}
            y={heroY}
            textAnchor="middle"
            fontFamily={fonts.display}
            fontWeight={800}
            fontSize={digitSize}
            letterSpacing={-12}
            fill={INK}
            opacity={fadeIn(frame, sec(0.2), sec(0.7))}
          >
            3
          </text>
          <text
            x={colonX}
            y={heroY - 60}
            textAnchor="middle"
            fontFamily={fonts.display}
            fontWeight={400}
            fontSize={260}
            fill={INK}
            opacity={fadeIn(frame, sec(0.4), sec(0.6)) * 0.6}
          >
            :
          </text>
          <text
            x={oneX}
            y={heroY}
            textAnchor="middle"
            fontFamily={fonts.display}
            fontWeight={800}
            fontSize={digitSize}
            letterSpacing={-12}
            fill={INK}
            opacity={fadeIn(frame, sec(0.2), sec(0.7))}
          >
            1
          </text>

          {/* Gold fills "3" from below to 100% (the dominant share) */}
          {(() => {
            const fillStart = sec(0.7);
            const fillDur = sec(1.2);
            const fillProgress = interpolate(frame, [fillStart, fillStart + fillDur], [0, 1], CLAMP_CUBIC);
            const textTop = heroY - digitSize * 0.78;
            const textBottom = heroY + 30;
            const textHeight = textBottom - textTop;
            return (
              <g clipPath="url(#three-clip)">
                <rect
                  x={0}
                  y={textBottom - textHeight * fillProgress}
                  width={layout.width}
                  height={textHeight * fillProgress}
                  fill={HERO_COLOR}
                />
              </g>
            );
          })()}

          {/* Rust fills "1" from below to 33% (the inverse minority share) */}
          {(() => {
            const fillStart = sec(0.9);
            const fillDur = sec(1.2);
            const targetFill = 1 / 3; // 33% — inverse of 3:1 ratio
            const fillProgress = interpolate(frame, [fillStart, fillStart + fillDur], [0, targetFill], CLAMP_CUBIC);
            const textTop = heroY - digitSize * 0.78;
            const textBottom = heroY + 30;
            const textHeight = textBottom - textTop;
            return (
              <g clipPath="url(#one-clip)">
                <rect
                  x={0}
                  y={textBottom - textHeight * fillProgress}
                  width={layout.width}
                  height={textHeight * fillProgress}
                  fill={RUST}
                />
              </g>
            );
          })()}

          {/* Aggregate proportional bar beneath — totals across all decades */}
          {(() => {
            const animDur = sec(1.4);
            const grown = grow(frame, sec(1.6), animDur);
            const filledW = aggBarWidth * grown;
            const goldW = filledW * theoryRatio;
            const rustW = filledW * (1 - theoryRatio);
            const labelOp = fadeIn(frame, sec(2.0), sec(0.5));
            return (
              <g>
                {/* Track */}
                <rect
                  x={aggBarLeft}
                  y={aggBarTop}
                  width={aggBarWidth}
                  height={aggBarHeight}
                  fill="rgba(28, 24, 20, 0.06)"
                />
                {/* Gold fill */}
                <rect
                  x={aggBarLeft}
                  y={aggBarTop}
                  width={goldW}
                  height={aggBarHeight}
                  fill={HERO_COLOR}
                />
                {/* Rust fill */}
                <rect
                  x={aggBarLeft + goldW}
                  y={aggBarTop}
                  width={rustW}
                  height={aggBarHeight}
                  fill={RUST}
                />
                {/* Inside-bar values */}
                <text
                  x={aggBarLeft + 18}
                  y={aggBarTop + aggBarHeight / 2 + 10}
                  fontFamily={fonts.display}
                  fontWeight={700}
                  fontSize={32}
                  fill={INK}
                  opacity={labelOp}
                  letterSpacing={-0.5}
                >
                  {DIFFUSION_TOTAL_THEORY.toLocaleString()} theory papers
                </text>
                <text
                  x={aggBarLeft + aggBarWidth - 18}
                  y={aggBarTop + aggBarHeight / 2 + 10}
                  textAnchor="end"
                  fontFamily={fonts.display}
                  fontWeight={700}
                  fontSize={32}
                  fill="#FAF6EC"
                  opacity={labelOp}
                  letterSpacing={-0.5}
                >
                  {DIFFUSION_TOTAL_EMPIRICAL} empirical
                </text>
              </g>
            );
          })()}
        </svg>

        {/* Prose + source */}
        <div
          style={{
            position: "absolute",
            top: 880,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: fonts.serifBody,
            fontStyle: "italic",
            fontSize: 24,
            color: BODY_GREY,
            opacity: fadeIn(frame, sec(2.4), sec(0.6)),
          }}
        >
          PD-keyword publications, 1960–1999. The ratio held across every decade;
          the absolute volume grew a hundredfold.
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: fonts.mono,
            fontSize: fontSizes.small,
            color: BODY_GREY,
            letterSpacing: 2,
            opacity: fadeIn(frame, sec(2.7), sec(0.5)) * 0.5,
          }}
        >
          <BrandLockup placement="trailing" prefix="Source: JSTOR citation analysis">
            parallax · C
          </BrandLockup>
        </div>
      </EditorialSurface>
    </AbsoluteFill>
  );
};


// ─── Composition registrations (diffusion variants) ─────────────────────────

export const CatalogEditorialDirectionADiffusion = () => (
  <Composition
    id={catalogId("EditorialDirection", "A-diffusion")}
    component={DirectionADiffusion}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(8)}
    defaultProps={{}}
  />
);

export const CatalogEditorialDirectionBDiffusion = () => (
  <Composition
    id={catalogId("EditorialDirection", "B-diffusion")}
    component={DirectionBDiffusion}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(10)}
    defaultProps={{}}
  />
);

export const CatalogEditorialDirectionCDiffusion = () => (
  <Composition
    id={catalogId("EditorialDirection", "C-diffusion")}
    component={DirectionCDiffusion}
    width={layout.width}
    height={layout.height}
    fps={layout.fps}
    durationInFrames={sec(10)}
    defaultProps={{}}
  />
);

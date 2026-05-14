/**
 * HorizontalTimeline — cinematic horizontal camera track through time.
 *
 * Renders events along a horizontal axis with a glowing spine. A virtual camera
 * tracks horizontally between events, with depth-of-field blur and scale hierarchy
 * for focus isolation. Matches the Vox/Johnny Harris documentary standard.
 *
 * Architecture:
 *   - Events distributed along a wide canvas (2-3× viewport width)
 *   - Glowing amber spine runs horizontally through the center
 *   - Event cards hang above/below the spine with elevation + accent edges
 *   - Camera tracks horizontally with eased motion, zoom per event
 *   - Unfocused events are dimmed, scaled down, and blurred
 *   - Final pullback reveals full timeline with connections
 *
 * Three modes:
 *   - "single": one spine, events alternate above/below
 *   - "dual": two parallel spines (era A top, era B bottom)
 *   - "morph": single spine, event content cross-fades between eras
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
} from "remotion";
import {
  fonts,
  fontSizes,
  layout,
  palette,
  sec,
  shadows,
  cardPresets,
  textMaxWidth,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  slideIn,
  exitFade,
  lockOnPulse,
  CLAMP,
  CLAMP_QUAD,
} from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import {
  useTimelineCamera,
  generateDefaultTimelineCameraPath,
} from "../../hooks/useTimelineCamera";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { TitleBlock } from "../../components/TitleBlock";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useTemplateLayout } from "../../hooks/useTemplateLayout";
import { warnIf } from "../../utils/dataWarnings";
import type {
  HorizontalTimelineData,
  TimelineEventData,
  TimelineCameraStep,
  TimelinePairData,
  PhaseAxisConfig,
} from "./types";

// ── Constants ──────────────────────────────────────────────────────────────

const CANVAS_WIDTH = layout.width;
const CANVAS_HEIGHT = layout.height;
/** Spacing between events on the horizontal axis */
const EVENT_SPACING = 480;
/** Horizontal padding before first and after last event */
const TIMELINE_PADDING = 400;
/** Spine Y position (vertical center of the timeline) */
const SPINE_Y = CANVAS_HEIGHT * 0.5;
/** Card width — the editorial type column. */
const CARD_WIDTH = 320;
/** Card height (varies by weight, this is base) */
const CARD_BASE_HEIGHT = 120;
/**
 * Fixed-width underline rule that anchors each event card. The rule is the
 * "card chrome" replacement (per May 13, 2026 visual-register pass): all
 * cards share the same width of era-colored rule under the title, which
 * gives the timeline a unified visual vocabulary while letting the type
 * size itself naturally to the content. NYT Upshot / FT pattern.
 */
const UNDERLINE_WIDTH = 140;
/**
 * Distance from the spine to lane-0 (default) card top edge. The connector
 * line spans this gap.
 */
const SPINE_TO_LANE_0_GAP = 40;
/**
 * Extra vertical offset for lane-1 (staggered) cards. Cards that collide
 * horizontally with their neighbors shift to this lane, which is one
 * card-height-plus-gap further from the spine. Connector line extends to
 * reach the new lane position.
 */
const LANE_1_EXTRA_OFFSET = CARD_BASE_HEIGHT + 30;

/**
 * Assign vertical lanes to a sequence of event x-positions so adjacent
 * cards that would horizontally overlap get pushed to alternating lanes.
 *
 * Lane 0 = default position (close to spine), Lane 1 = bumped further out.
 *
 * Algorithm: walk events left-to-right in x-order; if an event's x is
 * within `CARD_WIDTH + minGap` of the previous event's x, alternate its
 * lane assignment. Otherwise reset to lane 0.
 *
 * This is the auto-stagger fix for the May 12 review finding — phase-axis
 * timelines with unevenly-spaced events (e.g., phase positions 0, 1, 4, 10)
 * have tight clusters that overlap in card-space. Auto-staggering pushes
 * the closer pair to alternating lanes; sparse pairs render normally.
 *
 * Returns an array of lane assignments aligned to the input events array.
 */
const computeStaggerLanes = (
  xs: ReadonlyArray<number>,
  cardWidth: number = CARD_WIDTH,
  minGap: number = 20,
): number[] => {
  const collisionThreshold = cardWidth + minGap;
  const lanes: number[] = new Array(xs.length).fill(0);
  for (let i = 1; i < xs.length; i++) {
    const dx = Math.abs(xs[i]! - xs[i - 1]!);
    if (dx < collisionThreshold) {
      // Collision with previous neighbor — toggle to alternate lane.
      lanes[i] = 1 - lanes[i - 1]!;
    } else {
      lanes[i] = 0;
    }
  }
  return lanes;
};

// ── Spine glow component ───────────────────────────────────────────────────

const TimelineSpine: React.FC<{
  totalWidth: number;
  color: string;
  frame: number;
  mode: "light" | "dark";
}> = React.memo(({ totalWidth, color, frame, mode }) => {
  const theme = useThemeMode(mode);

  // Animated gradient pulse traveling along the spine — doubled speed
  // so the pulse is visibly traveling within a single timeline beat (~32s cycle).
  const pulseOffset = (frame * 1.0) % totalWidth;

  return (
    <div
      style={{
        position: "absolute",
        top: SPINE_Y - 2,
        left: 0,
        width: totalWidth,
        height: 4,
      }}
    >
      {/* Base spine line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: `${color}40`,
          borderRadius: 2,
        }}
      />
      {/* Glow layer */}
      <div
        style={{
          position: "absolute",
          top: -4,
          left: 0,
          width: "100%",
          height: 12,
          background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
          backgroundSize: `${totalWidth * 0.3}px 100%`,
          backgroundPosition: `${pulseOffset}px 0`,
          borderRadius: 6,
        }}
      />
      {/* Bright core pulse */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 4,
          background: `linear-gradient(90deg, transparent 0%, ${color}80 ${(pulseOffset / totalWidth) * 100}%, ${color} ${((pulseOffset + 100) / totalWidth) * 100}%, transparent ${((pulseOffset + 300) / totalWidth) * 100}%)`,
          borderRadius: 2,
        }}
      />
    </div>
  );
});

// ── Year marker on the spine ───────────────────────────────────────────────

const YearMarker: React.FC<{
  x: number;
  year: string;
  color: string;
  weight: number;
  dim: number;
  scale: number;
  blur: number;
  frame: number;
  revealFrame: number;
  mode: "light" | "dark";
  position: "above" | "below";
  /** Y coordinate of the spine this dot sits on (default: SPINE_Y). */
  spineY?: number;
  /** Whether to suppress the year label (for cinematic mode off-focus). */
  hideYear?: boolean;
}> = React.memo(({ x, year, color, weight, dim, scale, blur, frame, revealFrame, mode, position, spineY = SPINE_Y, hideYear = false }) => {
  const theme = useThemeMode(mode);
  const revealOpacity = fadeIn(frame, revealFrame, sec(0.4));
  const markerSize = 10 + weight * 4; // 14, 18, 22px based on weight
  // Brand lock-on pulse on first reveal — sells discovery
  const lockScale = lockOnPulse(frame, revealFrame, layout.fps);

  return (
    <div
      style={{
        position: "absolute",
        left: x - markerSize / 2,
        top: spineY - markerSize / 2,
        opacity: revealOpacity * (1 - dim * 0.75),
        transform: `scale(${scale * lockScale})`,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        transition: "filter 0.1s",
        willChange: "transform, opacity, filter",
      }}
    >
      {/* Marker dot */}
      <div
        style={{
          width: markerSize,
          height: markerSize,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 ${8 + weight * 4}px ${color}60, 0 0 ${16 + weight * 6}px ${color}25`, // shadows.accentGlow animated (weight-based dynamic double glow)
        }}
      />
      {/* Year label — suppressed by default since EventCard now renders the
          year as a kicker above the title. The on-spine year was creating
          a redundant "double year" visual when paired with the EventCard
          year. Keep the prop available for callers that want the on-spine
          year (e.g., cinematic mode where off-focus events hide the card). */}
      {!hideYear && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            ...(position === "above"
              ? { bottom: markerSize + 8 }
              : { top: markerSize + 8 }),
            fontSize: fontSizes.label,
            fontFamily: fonts.mono,
            fontWeight: 600,
            color,
            whiteSpace: "nowrap",
            textShadow: shadows.textLift,
          }}
        >
          {year}
        </div>
      )}
    </div>
  );
});

// ── Event card ─────────────────────────────────────────────────────────────
//
// Editorial-typography style (May 13, 2026 — replaces the boxed card chrome).
// Each event renders as:
//   YEAR · Title bold
//   ───────────────  ← fixed-width era-color underline (UNDERLINE_WIDTH)
//   Description italic
//
// No card background, no border, no drop shadow — text directly on paper.
// The underline is the visual anchor and the era-color signal. A thin 1px
// connector links the underline to the spine dot. NYT Upshot / FT pattern.
//
// Lane support: `lane` = 0 (default, close to spine) or 1 (bumped further
// out for collision-resolved staggered cards). `spineY` lets dual-mode pass
// a different spine y for era B (the bottom spine).

const EventCard: React.FC<{
  event: TimelineEventData;
  x: number;
  position: "above" | "below";
  /** Y coordinate of the spine this card connects to (default: SPINE_Y). */
  spineY?: number;
  /** Stagger lane: 0 = default, 1 = bumped further from spine for collision avoidance. */
  lane?: 0 | 1;
  color: string;
  dim: number;
  scale: number;
  blur: number;
  frame: number;
  revealFrame: number;
  isFocused: boolean;
  /**
   * When true, the card text is hidden (only the year marker / dot remains
   * visible). Used by `focusMode: "cinematic"` to remove off-focus card
   * competition during camera tracking.
   */
  hideText?: boolean;
  mode: "light" | "dark";
}> = React.memo(({ event, x, position, spineY = SPINE_Y, lane = 0, color, dim, scale, blur, frame, revealFrame, isFocused, hideText = false, mode }) => {
  const theme = useThemeMode(mode);
  const revealOpacity = fadeIn(frame, revealFrame, sec(0.5));
  const slideOffset = slideIn(frame, revealFrame, 20, sec(0.5));

  // Hide text entirely when in cinematic focus mode and off-focus.
  if (hideText) return null;

  const accentColor = event.color || color;
  // Connector + card distance from spine. Lane 0 = default, lane 1 = pushed
  // further out by one card-height-plus-gap (auto-stagger for collisions).
  const connectorLength = SPINE_TO_LANE_0_GAP + (lane === 1 ? LANE_1_EXTRA_OFFSET : 0);

  // Position the type block. For "above" position, the card grows upward
  // from spineY; we anchor by the BOTTOM of the type block (i.e., closest
  // to the spine). For "below", anchor by the TOP.
  const typeBlockTop = position === "above"
    ? spineY - connectorLength - CARD_BASE_HEIGHT
    : spineY + connectorLength;

  return (
    <div
      style={{
        position: "absolute",
        left: x - CARD_WIDTH / 2,
        top: typeBlockTop,
        width: CARD_WIDTH,
        opacity: revealOpacity * (1 - dim * 0.75),
        transform: `scale(${scale}) translateY(${position === "above" ? slideOffset : -slideOffset}px)`,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        willChange: "transform, opacity, filter",
      }}
    >
      {/* Connector line — thin 1px era-color rule from type block to spine
          dot. The opacity scales with the card's own opacity (via parent). */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          width: 1,
          backgroundColor: `${accentColor}80`,
          ...(position === "above"
            ? { bottom: -connectorLength, height: connectorLength }
            : { top: -connectorLength, height: connectorLength }),
          transform: "translateX(-50%)",
        }}
      />

      {/* Type block — title + year row, underline rule, description.
          NO background, NO border, NO shadow. Text directly on paper. */}
      <div style={{ width: "100%", textAlign: "center" }}>
        {/* Year — Plex Mono small caps in era color */}
        <div
          style={{
            fontSize: fontSizes.label,
            fontFamily: fonts.mono,
            fontWeight: 600,
            color: accentColor,
            letterSpacing: 1,
            textShadow: shadows.textLift,
            marginBottom: 4,
          }}
        >
          {event.year}
        </div>

        {/* Title — Plex Sans semibold, ink (slightly larger when focused) */}
        <div
          style={{
            fontSize: isFocused ? fontSizes.body + 2 : fontSizes.body,
            fontFamily: fonts.heading,
            fontWeight: isFocused ? 700 : 600,
            color: theme.text.primary,
            lineHeight: 1.25,
            textShadow: shadows.textLift,
          }}
        >
          {event.title}
        </div>

        {/* Fixed-width underline rule — era-color, 1.5px, centered.
            The unified visual element across the timeline; same width on
            every card regardless of content length. */}
        <div
          style={{
            width: UNDERLINE_WIDTH,
            height: 1.5,
            backgroundColor: accentColor,
            margin: `8px auto ${event.description ? 8 : 0}px`,
            opacity: isFocused ? 1 : 0.7,
          }}
        />

        {/* Description — Plex Sans regular, muted, italic for editorial
            register. Only renders if event has a description. */}
        {event.description && (
          <div
            style={{
              fontSize: fontSizes.caption,
              fontFamily: fonts.body,
              fontStyle: "italic",
              color: theme.text.secondary,
              lineHeight: 1.4,
              opacity: isFocused ? 1 : 0.55,
              textShadow: shadows.textLift,
              maxWidth: CARD_WIDTH - 20,
              margin: "0 auto",
            }}
          >
            {event.description}
          </div>
        )}
      </div>
    </div>
  );
});

// ── Connection line (dual mode, shown on pullback) ─────────────────────────

const ConnectionLine: React.FC<{
  x: number;
  label?: string;
  color: string;
  opacity: number;
  mode: "light" | "dark";
}> = React.memo(({ x, label, color, opacity, mode }) => {
  const theme = useThemeMode(mode);

  return (
    <div
      style={{
        position: "absolute",
        left: x - 1,
        top: SPINE_Y - 80,
        width: 2,
        height: 160,
        opacity,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(180deg, ${color}60, ${color}, ${color}60)`,
          borderRadius: 1,
        }}
      />
      {label && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 8,
            transform: "translateY(-50%)",
            fontSize: fontSizes.meta,
            fontFamily: fonts.mono,
            color: theme.text.accent,
            whiteSpace: "nowrap",
            textShadow: shadows.textLift,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
});

// ── Phase axis render (dual mode, when phaseAxis is set) ───────────────────
//
// Draws a shared phase axis beneath the era B spine: a thin rule with tick
// marks at canonical positions (auto-derived from pair phasePositions, or
// explicit via config.ticks) and the axis label centered below.
//
// This is the visual contract for phase-aligned timelines — the viewer sees
// the shared scale and can read "week 7 lines up on both sides" directly.
// Without this affordance, phase alignment is implicit and easily mistaken
// for calendar alignment. See: references/template-research/timeline-comparison.md § 7.

const AXIS_Y_OFFSET = 260; // pixels below SPINE_Y where the axis lives
const AXIS_TICK_HEIGHT = 8;

const PhaseAxisRender: React.FC<{
  config: PhaseAxisConfig;
  pairs: TimelinePairData[];
  pairXs: number[];
  spineY: number;
  totalWidth: number;
  color: string;
  primaryColor: string;
  frame: number;
  mode: "light" | "dark";
}> = React.memo(({ config, pairs, pairXs, spineY, totalWidth, color, primaryColor, frame, mode }) => {
  const theme = useThemeMode(mode);
  const phasePositions = pairs.map((p) => p.phasePosition as number);
  const domainMin = config.min ?? Math.min(...phasePositions);
  const domainMax = config.max ?? Math.max(...phasePositions);
  const span = Math.max(1e-9, domainMax - domainMin);
  const spanPx = Math.max(1, (pairs.length - 1) * EVENT_SPACING);

  // Auto-generate ticks if none provided: 4–6 evenly spaced steps anchored
  // at the actual pair phase positions when feasible.
  const ticks: number[] = config.ticks ?? phasePositions;

  // Axis line draws in over 600ms after events have begun settling.
  const lineProgress = interpolate(frame, [sec(0.8), sec(1.4)], [0, 1], CLAMP_QUAD);
  const labelOpacity = fadeIn(frame, sec(1.2), sec(0.5));

  const axisTop = spineY + AXIS_Y_OFFSET;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: axisTop,
        width: totalWidth,
        height: 60,
        pointerEvents: "none",
      }}
    >
      {/* Axis baseline */}
      <div
        style={{
          position: "absolute",
          left: TIMELINE_PADDING,
          top: 0,
          width: spanPx * lineProgress,
          height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${color}80 6%, ${color}80 94%, transparent 100%)`,
        }}
      />

      {/* Ticks — render at every pair's x position (matches event alignment).
          Bumped from 1px to 2px for editorial weight; the phase ticks ARE
          the visual claim of the comparison. */}
      {pairXs.map((x, i) => {
        const tickOpacity = fadeIn(frame, sec(1.0) + i * sec(0.05), sec(0.4));
        return (
          <div
            key={`tick-${i}`}
            style={{
              position: "absolute",
              left: x,
              top: 0,
              width: 2,
              height: AXIS_TICK_HEIGHT,
              background: color,
              opacity: tickOpacity,
              transform: "translateX(-1px)",
            }}
          />
        );
      })}

      {/* Tick labels (phase values) — bumped font size + weight from
          fontSizes.meta to fontSizes.caption with semibold weight, so the
          cadence values (0 yr / 1 yr / 4 yr / 10 yr) read as the load-bearing
          editorial element they are. See May 13, 2026 timeline polish pass. */}
      {ticks.map((tick, i) => {
        const tickX = TIMELINE_PADDING + ((tick - domainMin) / span) * spanPx;
        const tickOpacity = fadeIn(frame, sec(1.1) + i * sec(0.05), sec(0.4));
        return (
          <div
            key={`label-${i}`}
            style={{
              position: "absolute",
              left: tickX,
              top: AXIS_TICK_HEIGHT + 8,
              transform: "translateX(-50%)",
              fontSize: fontSizes.caption,
              fontFamily: fonts.mono,
              fontWeight: 600,
              color: theme.text.secondary,
              letterSpacing: 0.5,
              opacity: tickOpacity,
              whiteSpace: "nowrap",
              textShadow: shadows.textLift,
            }}
          >
            {tick}
            {config.unit ? ` ${config.unit}` : ""}
          </div>
        );
      })}

      {/* Axis label — centered below ticks, accented underline */}
      <div
        style={{
          position: "absolute",
          left: TIMELINE_PADDING + spanPx / 2,
          top: AXIS_TICK_HEIGHT + 36,
          transform: "translateX(-50%)",
          fontSize: fontSizes.label,
          fontFamily: fonts.metadata,
          color: theme.text.secondary,
          letterSpacing: 3,
          textTransform: "uppercase",
          opacity: labelOpacity,
          whiteSpace: "nowrap",
          textShadow: shadows.textLift,
        }}
      >
        {config.label}
        <div
          style={{
            position: "absolute",
            bottom: -4,
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: 1,
            background: `${primaryColor}60`,
          }}
        />
      </div>
    </div>
  );
});

// ── Main component ─────────────────────────────────────────────────────────

export const HorizontalTimeline: React.FC<{
  data: HorizontalTimelineData;
}> = ({ data }) => {
  // Editorial heuristic: above ~32 events, narration outruns reading speed
  // and event cards collide horizontally. Split into multiple compositions.
  const totalEventCount =
    (data.events?.length ?? 0) + (data.pairs?.length ?? 0) * 2;
  warnIf(
    totalEventCount > 32,
    "HorizontalTimeline",
    `${totalEventCount} events — HorizontalTimeline caps at ~32 total. Above ` +
      `that, narration outruns reading speed and event cards collide. Split ` +
      `into multiple compositions or demote minor events. ` +
      `See TIMELINE_TEMPLATE_SELECTOR.md.`,
  );
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const mode = (data.backgroundVariant || "light") as "light" | "dark";
  const theme = useThemeMode(mode);
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const footerHeight =
    data.mode === "dual"
      ? fontSizes.label * 2 + layout.spacing.xl
      : fontSizes.label + layout.spacing.xl;
  const { zones } = useTemplateLayout({
    title: "content",
    safeArea: "generous",
    footerHeight,
    contentFooterGap: 0,
  });

  // Dossier-canonical era default palette: rust (Era A = historical) +
  // ink (Era B = contemporary). Both already in the brand palette, so the
  // dual timeline reads in-register without introducing a non-brand color.
  // Override only when an episode has specific bilateral coloring
  // (US-blue vs China-rust, etc.).
  // See: references/template-research/timeline-comparison.md § 4
  const eraAColor = data.eraAColor || palette.rust;
  const eraBColor = data.eraBColor || palette.ink;

  // Era weight ratio — applies opacity weighting to whichever era is foiled.
  // Default `equal` keeps both eras at full opacity (Parallax's bounded-
  // analogy commitment treats them as analytical peers). Foil modes drop
  // the foil to 0.5 so the protagonist dominates the eye while the foil
  // stays continuously legible.
  // See: references/template-research/timeline-comparison.md § 3
  const eraWeight = data.eraWeight ?? "equal";
  const eraAFoilMute = eraWeight === "foil-old" ? 0.5 : 1.0;
  const eraBFoilMute = eraWeight === "foil-new" ? 0.5 : 1.0;

  // ── Focus mode resolution ────────────────────────────────────────────
  // Default: cinematic when cameraPath provided (camera is tracking — viewer
  // is being directed event by event), settled when no cameraPath (static
  // reading — show all cards at once). Episode-side data can override.
  const focusModeConfig = (() => {
    const raw = data.focusMode;
    if (typeof raw === "string") {
      return { mode: raw, dimOpacity: undefined, hideOffFocusCards: undefined };
    }
    if (raw && typeof raw === "object") {
      return {
        mode: raw.mode,
        dimOpacity: raw.dimOpacity,
        hideOffFocusCards: raw.hideOffFocusCards,
      };
    }
    // Auto-default: cinematic iff cameraPath is provided.
    return {
      mode: (data.cameraPath && data.cameraPath.length > 0 ? "cinematic" : "settled") as
        | "cinematic"
        | "settled",
      dimOpacity: undefined,
      hideOffFocusCards: undefined,
    };
  })();

  /**
   * Whether to hide the card TEXT of off-focus events. The dot + year still
   * renders (via YearMarker) so the timeline structure stays visible; only
   * the card body disappears. This is the fix for the "double card overlap"
   * problem when events are close on the spine.
   */
  const shouldHideOffFocusCards = (() => {
    if (focusModeConfig.hideOffFocusCards !== undefined) {
      return focusModeConfig.hideOffFocusCards;
    }
    return focusModeConfig.mode === "cinematic";
  })();

  // ── Compute event list and positions ─────────────────────────────────
  const eventData = useMemo((): {
    events: Array<{ event: TimelineEventData; position: "above" | "below" }>;
    positions: number[];
    totalWidth: number;
  } => {
    if (data.mode === "single" && data.events) {
      const events = data.events.map((e, i) => ({
        event: e,
        position: (i % 2 === 0 ? "above" : "below") as "above" | "below",
      }));
      const positions = data.events.map(
        (_, i) => TIMELINE_PADDING + i * EVENT_SPACING
      );
      const totalWidth =
        TIMELINE_PADDING * 2 + (data.events.length - 1) * EVENT_SPACING;
      return { events, positions, totalWidth };
    }

    if (data.mode === "dual" && data.pairs) {
      // Dual mode: era A events above, era B below, same x-positions.
      // When phaseAxis is set, x is computed from each pair's phasePosition
      // mapped to a shared phase domain — the vertical alignment IS the
      // editorial argument. See: references/template-research/timeline-comparison.md
      const events: Array<{ event: TimelineEventData; position: "above" | "below" }> = [];
      const positions: number[] = [];

      // Pair positions along x: phase-aligned or equal-spaced.
      const pairXs: number[] = (() => {
        if (data.phaseAxis && data.pairs.every((p) => p.phasePosition !== undefined)) {
          const phasePositions = data.pairs.map((p) => p.phasePosition as number);
          const domainMin = data.phaseAxis.min ?? Math.min(...phasePositions);
          const domainMax = data.phaseAxis.max ?? Math.max(...phasePositions);
          // Preserve the total width that equal-spacing would produce so
          // existing camera-path / pullback assumptions still hold.
          const spanPx = Math.max(1, (data.pairs.length - 1) * EVENT_SPACING);
          const span = Math.max(1e-9, domainMax - domainMin);
          return phasePositions.map(
            (p) => TIMELINE_PADDING + ((p - domainMin) / span) * spanPx,
          );
        }
        return data.pairs.map((_, i) => TIMELINE_PADDING + i * EVENT_SPACING);
      })();

      data.pairs.forEach((pair, i) => {
        const x = pairXs[i]!;
        // Era A above
        events.push({ event: pair.eraA, position: "above" });
        positions.push(x);
        // Era B below (same x, handled by rendering both)
        events.push({ event: pair.eraB, position: "below" });
        positions.push(x);
      });

      const totalWidth =
        TIMELINE_PADDING * 2 + (data.pairs.length - 1) * EVENT_SPACING;
      return { events, positions, totalWidth };
    }

    if (data.mode === "morph" && data.morphEvents) {
      // Morph: single spine, events alternate position
      const events = data.morphEvents.map((me, i) => ({
        event: {
          year: me.eraAYear,
          title: me.eraATitle,
          description: me.eraADescription,
          weight: me.weight,
        } as TimelineEventData,
        position: (i % 2 === 0 ? "above" : "below") as "above" | "below",
      }));
      const positions = data.morphEvents.map(
        (_, i) => TIMELINE_PADDING + i * EVENT_SPACING
      );
      const totalWidth =
        TIMELINE_PADDING * 2 + (data.morphEvents.length - 1) * EVENT_SPACING;
      return { events, positions, totalWidth };
    }

    // Fallback
    return { events: [], positions: [], totalWidth: CANVAS_WIDTH };
  }, [data]);

  // ── Camera path ──────────────────────────────────────────────────────
  const cameraPath = useMemo((): TimelineCameraStep[] => {
    if (data.cameraPath) return data.cameraPath;

    // Auto-generate: visit each unique x-position
    if (data.mode === "dual" && data.pairs) {
      // For dual, camera focuses on pair indices (every other event)
      return generateDefaultTimelineCameraPath(data.pairs.length, {
        secondsPerEvent: 2.5,
        zoomLevel: 1.3,
        pullbackZoom: 0.6,
      });
    }

    const eventCount =
      data.mode === "single"
        ? (data.events?.length ?? 0)
        : (data.morphEvents?.length ?? 0);

    return generateDefaultTimelineCameraPath(eventCount, {
      secondsPerEvent: 2.5,
      zoomLevel: 1.4,
      pullbackZoom: 0.65,
    });
  }, [data]);

  // For dual mode, event positions for the camera are the unique x-positions (one per pair).
  // eventData.positions has two entries per pair (above/below); we want the unique x-list.
  const cameraPositions = useMemo(() => {
    if (data.mode === "dual" && data.pairs) {
      // Every even index in eventData.positions is an era-A position (same x as
      // its era-B sibling). Take every other entry to get one x per pair.
      return data.pairs.map((_, i) => eventData.positions[i * 2]!);
    }
    return eventData.positions;
  }, [data, eventData.positions]);

  // ── Camera hook ──────────────────────────────────────────────────────
  const camera = useTimelineCamera({
    eventPositions: cameraPositions,
    cameraPath,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    totalTimelineWidth: eventData.totalWidth,
    spineY: SPINE_Y,
    transitionSec: 0.8,
  });

  // ── Exit fade ────────────────────────────────────────────────────────
  const exitOpacity = exitFade(frame, durationInFrames, 15);

  // ── Morph state (for morph mode) ─────────────────────────────────────
  const morphProgress = useMemo(() => {
    if (data.mode !== "morph") return 0;
    // Morph happens in the second half of the timeline
    const totalSteps = cameraPath.length;
    const morphStartStep = Math.floor(totalSteps * 0.5);
    const morphEndStep = Math.floor(totalSteps * 0.75);

    if (camera.stepIndex < morphStartStep) return 0;
    if (camera.stepIndex >= morphEndStep) return 1;

    // linear-ok: maps discrete step-index distance, not frame-time — smooth comes from camera interpolation above
    return interpolate(
      camera.stepIndex - morphStartStep,
      [0, morphEndStep - morphStartStep],
      [0, 1],
      { ...{ extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const } }
    );
  }, [data.mode, cameraPath.length, camera.stepIndex]);

  const overlayBands = useMemo(() => {
    const titleSupplementHeight = fontSizes.h3 + layout.spacing.lg;
    const titleSupplementTop = Math.min(
      zones.title.rect.top + zones.title.rect.height - titleSupplementHeight,
      zones.title.rect.top + Math.max(layout.spacing.md, Math.round(zones.title.rect.height * 0.4))
    );

    // ── Dual-mode era label bands ──────────────────────────────────────────
    // The era labels in dual mode previously rode INSIDE zones.title.rect and
    // zones.footer.rect, which collided with the subtitle (rendered by
    // TitleBlock) and the episode label (rendered in the footer). The fix:
    // hoist the era labels out of those zones into their own dedicated bands
    // that sit BETWEEN the title and the content, and BETWEEN the content
    // and the footer. This makes the era headers land near the spines they
    // describe instead of competing with the page chrome. See the May 12,
    // 2026 timeline visual-register pass.
    const eraLabelHeight = fontSizes.label + layout.spacing.xs;
    const eraABand = {
      top: zones.title.rect.top + zones.title.rect.height + layout.spacing.xs,
      left: zones.title.rect.left,
      width: zones.title.rect.width,
      height: eraLabelHeight,
    };
    const eraBBand = {
      top: zones.footer.rect.top - eraLabelHeight - layout.spacing.sm,
      left: zones.footer.rect.left,
      width: zones.footer.rect.width,
      height: eraLabelHeight,
    };

    return {
      titleBox: zones.title.rect,
      titleSupplement: {
        top: titleSupplementTop,
        left: zones.title.rect.left,
        width: zones.title.rect.width,
        height: titleSupplementHeight,
      },
      eraABand,
      eraBBand,
      footerBox: zones.footer.rect,
    };
  }, [zones.footer.rect, zones.title.rect]);

  // ── Render ───────────────────────────────────────────────────────────
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
      <AbsoluteFill style={{ ...compStyle, opacity: exitOpacity }}>
        {/* Brand strips */}
        <HeaderStrip mode={mode} metadata={data.episode} />
        <FooterStrip mode={mode} />

        {/* Title */}
        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={mode}
          safeAreaTier="generous"
          syncPoints={direction.syncPoints}
        />

        {/* Camera viewport — contains all timeline content */}
        <div style={camera.viewportStyle}>
          <div style={camera.contentStyle}>
            {/* ── Glowing spine — era A.
                Wrapped in foil-mute opacity for dual mode so the rail
                recedes consistently with its events when eraWeight is
                "foil-old". For single/morph modes, eraAFoilMute is 1.0
                (eraWeight defaults to "equal"), so this is a no-op. */}
            <div style={{ opacity: eraAFoilMute }}>
              <TimelineSpine
                totalWidth={eventData.totalWidth}
                color={eraAColor}
                frame={frame}
                mode={mode}
              />
            </div>

            {/* ── Dual mode: second spine for era B.
                Foil-mute opacity wraps the entire spine block so the rail
                recedes consistently with its events when eraWeight is
                "foil-new". Default (eraWeight="equal") leaves it at 1.0. */}
            {data.mode === "dual" && (
              <div
                style={{
                  position: "absolute",
                  top: SPINE_Y + 80 - 2,
                  left: 0,
                  width: eventData.totalWidth,
                  height: 4,
                  opacity: eraBFoilMute,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: `${eraBColor}40`,
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    left: 0,
                    width: "100%",
                    height: 12,
                    background: `linear-gradient(90deg, transparent, ${eraBColor}25, transparent)`,
                    borderRadius: 6,
                  }}
                />
              </div>
            )}

            {/* ── Event markers and cards ───────────────────────────── */}
            {data.mode === "single" && data.events && (
              <>
                {(() => {
                  // Compute per-event lane assignment to handle close-spaced
                  // events colliding in card-space. Lane 0 = default,
                  // lane 1 = bumped further from spine.
                  const xs = data.events.map((_, i) => eventData.positions[i]!);
                  const lanes = computeStaggerLanes(xs);
                  return data.events.map((event, i) => {
                    const x = eventData.positions[i];
                    const eventDim = camera.getEventDim(i);
                    const eventScale = camera.getEventScale(i);
                    const eventBlur = camera.getEventBlur(i);
                    const isFocused = camera.focusIndex === i;
                    const position = (i % 2 === 0 ? "above" : "below") as "above" | "below";
                    const revealFrame = sec(0.5) + i * sec(0.15);
                    // focusIndex === -1 means "pullback" (overview shot) — show all cards.
                    const isPullback = camera.focusIndex === -1;
                    const hideText =
                      shouldHideOffFocusCards && !isFocused && !isPullback;
                    // In cinematic mode, the focused card has no visible
                    // neighbors to dodge, so pin it to lane 0 close to the
                    // spine. Staggered lanes only matter when neighbors are
                    // visible (settled mode or pullback overview).
                    const lane = (
                      shouldHideOffFocusCards && isFocused
                        ? 0
                        : lanes[i] ?? 0
                    ) as 0 | 1;

                    return (
                      <React.Fragment key={`single-${i}`}>
                        <YearMarker
                          x={x}
                          year={event.year}
                          color={event.color || eraAColor}
                          weight={event.weight || 1}
                          dim={eventDim}
                          scale={eventScale}
                          blur={eventBlur}
                          frame={frame}
                          revealFrame={revealFrame}
                          mode={mode}
                          position={position}
                          // Hide the on-spine year unless the card text is
                          // being suppressed (cinematic off-focus) — that's
                          // the only case where the year needs to show on
                          // the spine to keep the timeline structure readable.
                          hideYear={!hideText}
                        />
                        <EventCard
                          event={event}
                          x={x}
                          position={position}
                          lane={lane}
                          hideText={hideText}
                          color={eraAColor}
                          dim={eventDim}
                          scale={eventScale}
                          blur={eventBlur}
                          frame={frame}
                          revealFrame={revealFrame}
                          isFocused={isFocused}
                          mode={mode}
                        />
                      </React.Fragment>
                    );
                  });
                })()}
              </>
            )}

            {/* ── Dual mode: paired events ─────────────────────────── */}
            {data.mode === "dual" && data.pairs && (
              <>
                {(() => {
                  // Compute lane assignments per era separately — era A
                  // cards stack ABOVE the top spine, era B cards stack
                  // BELOW the bottom spine. Each era has its own collision
                  // set since they live on different spines.
                  const xs = data.pairs.map((_, i) => eventData.positions[i * 2]!);
                  const lanes = computeStaggerLanes(xs);
                  const SPINE_Y_B = SPINE_Y + 80;

                  return data.pairs.map((pair, i) => {
                    const x = eventData.positions[i * 2]!;
                    const eventDim = camera.getEventDim(i);
                    const eventScale = camera.getEventScale(i);
                    const eventBlur = camera.getEventBlur(i);
                    const isFocused = camera.focusIndex === i;
                    const isPullback = camera.focusIndex === -1;
                    const revealFrame = sec(0.5) + i * sec(0.15);
                    const hideText =
                      shouldHideOffFocusCards && !isFocused && !isPullback;
                    // In cinematic mode, off-focus neighbors are hidden so
                    // the focused card has no collision to dodge — pin to
                    // lane 0 (close to spine). Use the staggered lane only
                    // when neighbors are visible (settled mode or pullback).
                    const lane = (
                      shouldHideOffFocusCards && isFocused
                        ? 0
                        : lanes[i] ?? 0
                    ) as 0 | 1;

                    return (
                      <React.Fragment key={`dual-${i}`}>
                        {/* Era A marker + card — above top spine.
                            Foil-mute opacity wraps for foil-old mode. */}
                        <div style={{ opacity: eraAFoilMute }}>
                          <YearMarker
                            x={x}
                            year={pair.eraA.year}
                            color={pair.eraA.color || eraAColor}
                            weight={pair.eraA.weight || 1}
                            dim={eventDim}
                            scale={eventScale}
                            blur={eventBlur}
                            frame={frame}
                            revealFrame={revealFrame}
                            mode={mode}
                            position="above"
                            spineY={SPINE_Y}
                            hideYear={!hideText}
                          />
                          <EventCard
                            event={pair.eraA}
                            x={x}
                            position="above"
                            spineY={SPINE_Y}
                            lane={lane}
                            hideText={hideText}
                            color={pair.eraA.color || eraAColor}
                            dim={eventDim}
                            scale={eventScale}
                            blur={eventBlur}
                            frame={frame}
                            revealFrame={revealFrame}
                            isFocused={isFocused}
                            mode={mode}
                          />
                        </div>

                        {/* Era B marker + card — below bottom spine.
                            Same component as era A, just with spineY set
                            to the bottom spine. Refactored from inline mess
                            (May 13, 2026 visual-register pass). */}
                        <div style={{ opacity: eraBFoilMute }}>
                          <YearMarker
                            x={x}
                            year={pair.eraB.year}
                            color={pair.eraB.color || eraBColor}
                            weight={pair.eraB.weight || 1}
                            dim={eventDim}
                            scale={eventScale}
                            blur={eventBlur}
                            frame={frame}
                            revealFrame={revealFrame}
                            mode={mode}
                            position="below"
                            spineY={SPINE_Y_B}
                            hideYear={!hideText}
                          />
                          <EventCard
                            event={pair.eraB}
                            x={x}
                            position="below"
                            spineY={SPINE_Y_B}
                            lane={lane}
                            hideText={hideText}
                            color={pair.eraB.color || eraBColor}
                            dim={eventDim}
                            scale={eventScale}
                            blur={eventBlur}
                            frame={frame}
                            revealFrame={revealFrame}
                            isFocused={isFocused}
                            mode={mode}
                          />
                        </div>

                      {/* Connection line (visible on pullback).
                          Stage AFTER both eras are visually established —
                          connections are editorial claims, so the viewer
                          should see the evidence first. Default reveal at
                          sec(0.3); override via data.connectionRevealStart.
                          See: timeline-comparison.md § 3 */}
                      {pair.connection && (() => {
                        const connRevealStart = sec(data.connectionRevealStart ?? 0.3);
                        return (
                          <ConnectionLine
                            x={x}
                            label={pair.connection}
                            color={theme.text.muted}
                            opacity={camera.focusIndex === -1 ? fadeIn(frame, connRevealStart, sec(0.5)) : 0}
                            mode={mode}
                          />
                        );
                      })()}
                      </React.Fragment>
                    );
                  });
                })()}
              </>
            )}

            {/* ── Phase axis (dual mode only, when phaseAxis is set) ── */}
            {data.mode === "dual" && data.phaseAxis && data.pairs && (
              <PhaseAxisRender
                config={data.phaseAxis}
                pairs={data.pairs}
                pairXs={data.pairs.map((_, i) => eventData.positions[i * 2]!)}
                spineY={SPINE_Y}
                totalWidth={eventData.totalWidth}
                color={theme.text.muted}
                primaryColor={eraBColor}
                frame={frame}
                mode={mode}
              />
            )}

            {/* ── Morph mode: events with cross-fade ───────────────── */}
            {data.mode === "morph" && data.morphEvents && (
              <>
                {data.morphEvents.map((morphEvent, i) => {
                  const x = eventData.positions[i];
                  const eventDim = camera.getEventDim(i);
                  const eventScale = camera.getEventScale(i);
                  const eventBlur = camera.getEventBlur(i);
                  const isFocused = camera.focusIndex === i;
                  const position = (i % 2 === 0 ? "above" : "below") as "above" | "below";
                  const revealFrame = sec(0.5) + i * sec(0.15);

                  // Morph color
                  const morphColor = interpolateColors(
                    morphProgress,
                    [0, 1],
                    [eraAColor, eraBColor]
                  );

                  // Text opacity for cross-fade
                  const eraATextOpacity = 1 - morphProgress;
                  const eraBTextOpacity = morphProgress;

                  return (
                    <React.Fragment key={`morph-${i}`}>
                      <YearMarker
                        x={x}
                        year={morphProgress < 0.5 ? morphEvent.eraAYear : morphEvent.eraBYear}
                        color={morphColor}
                        weight={morphEvent.weight || 1}
                        dim={eventDim}
                        scale={eventScale}
                        blur={eventBlur}
                        frame={frame}
                        revealFrame={revealFrame}
                        mode={mode}
                        position={position}
                      />

                      {/* Morph card — cross-fades content */}
                      <div
                        style={{
                          position: "absolute",
                          left: x - CARD_WIDTH / 2,
                          top: position === "above"
                            ? SPINE_Y - 40 - CARD_BASE_HEIGHT
                            : SPINE_Y + 40,
                          width: CARD_WIDTH,
                          height: CARD_BASE_HEIGHT,
                          opacity: fadeIn(frame, revealFrame, sec(0.5)) * (1 - eventDim * 0.75),
                          transform: `scale(${eventScale})`,
                          filter: eventBlur > 0 ? `blur(${eventBlur}px)` : undefined,
                          willChange: "transform, opacity, filter",
                        }}
                      >
                        {/* Connector */}
                        <div
                          style={{
                            position: "absolute",
                            left: "50%",
                            width: 2,
                            backgroundColor: `${morphColor}50`,
                            ...(position === "above"
                              ? { bottom: -40, height: 40 }
                              : { top: -40, height: 40 }),
                            transform: "translateX(-50%)",
                          }}
                        />

                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            ...cardPresets.accentEdge(morphColor, mode === "dark"),
                            boxShadow: isFocused
                              ? `0 8px 32px rgba(0,0,0,0.25)`
                              : `0 4px 16px rgba(0,0,0,0.12)`,
                            position: "relative",
                          }}
                        >
                          {/* Era A content */}
                          <div style={{ opacity: eraATextOpacity, position: "absolute", top: 16, left: 16, right: 16 }}>
                            <div
                              style={{
                                fontSize: fontSizes.body,
                                fontWeight: 600,
                                color: theme.text.primary,
                                lineHeight: 1.3,
                                marginBottom: layout.spacing.xs,
                                textShadow: shadows.textLift,
                              }}
                            >
                              {morphEvent.eraATitle}
                            </div>
                            {morphEvent.eraADescription && (
                              <div style={{ fontSize: fontSizes.caption, color: theme.text.secondary, lineHeight: 1.4 }}>
                                {morphEvent.eraADescription}
                              </div>
                            )}
                          </div>

                          {/* Era B content (overlaid, fading in) */}
                          <div style={{ opacity: eraBTextOpacity, position: "absolute", top: 16, left: 16, right: 16 }}>
                            <div
                              style={{
                                fontSize: fontSizes.body,
                                fontWeight: 600,
                                color: theme.text.primary,
                                lineHeight: 1.3,
                                marginBottom: layout.spacing.xs,
                                textShadow: shadows.textLift,
                              }}
                            >
                              {morphEvent.eraBTitle}
                            </div>
                            {morphEvent.eraBDescription && (
                              <div style={{ fontSize: fontSizes.caption, color: theme.text.secondary, lineHeight: 1.4 }}>
                                {morphEvent.eraBDescription}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* ── Camera step label overlay ─────────────────────────────── */}
        {camera.currentLabel && (
          <div
            style={{
              position: "absolute",
              top: overlayBands.titleBox.top,
              right: overlayBands.titleBox.right,
              fontSize: fontSizes.label,
              fontFamily: fonts.mono,
              fontWeight: 600,
              color: theme.text.accent,
              letterSpacing: 1,
              textTransform: "uppercase",
              opacity: fadeIn(frame, 0, sec(0.5)),
              textShadow: shadows.textLift,
            }}
          >
            {camera.currentLabel}
          </div>
        )}

        {/* ── Dual mode era labels ──────────────────────────────────── */}
        {/* Each era label hovers next to the spine it describes — eraA above
            the top spine, eraB below the bottom spine — using dedicated
            bands that sit OUTSIDE the title and footer zones. Pre-May 12 the
            labels rode inside titleSupplement / footerBox, which overlapped
            with subtitle and episode-label text. See overlayBands above. */}
        {data.mode === "dual" && (
          <>
            {data.eraATitle && (
              <div
                style={{
                  position: "absolute",
                  top: overlayBands.eraABand.top,
                  left: overlayBands.eraABand.left,
                  width: overlayBands.eraABand.width,
                  fontSize: fontSizes.label,
                  fontFamily: fonts.mono,
                  fontWeight: 600,
                  color: eraAColor,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  opacity: fadeIn(frame, sec(0.3), sec(0.5)),
                  textShadow: shadows.textLift,
                }}
              >
                {data.eraATitle}
              </div>
            )}
            {data.eraBTitle && (
              <div
                style={{
                  position: "absolute",
                  top: overlayBands.eraBBand.top,
                  left: overlayBands.eraBBand.left,
                  width: overlayBands.eraBBand.width,
                  fontSize: fontSizes.label,
                  fontFamily: fonts.mono,
                  fontWeight: 600,
                  color: eraBColor,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  opacity: fadeIn(frame, sec(0.4), sec(0.5)),
                  textShadow: shadows.textLift,
                }}
              >
                {data.eraBTitle}
              </div>
            )}
          </>
        )}

        {/* ── Morph era title (morphs between A and B) ──────────────── */}
        {data.mode === "morph" && (
          <div
            style={{
              position: "absolute",
              top: overlayBands.titleSupplement.top,
              left: overlayBands.titleSupplement.left,
              width: overlayBands.titleSupplement.width,
              fontSize: fontSizes.h3,
              maxWidth: textMaxWidth.h3,
              fontFamily: fonts.heading,
              fontWeight: 600,
              color: interpolateColors(morphProgress, [0, 1], [eraAColor, eraBColor]),
              opacity: fadeIn(frame, sec(0.3), sec(0.5)),
              textShadow: shadows.textLift,
            }}
          >
            <span style={{ opacity: 1 - morphProgress }}>
              {data.morphEraATitle}
            </span>
            <span style={{ position: "absolute", top: 0, left: 0, opacity: morphProgress }}>
              {data.morphEraBTitle}
            </span>
          </div>
        )}

        {/* ── Episode label ─────────────────────────────────────────── */}
        {data.episode && (
          <div
            style={{
              position: "absolute",
              top:
                overlayBands.footerBox.top +
                overlayBands.footerBox.height -
                (fontSizes.label + layout.spacing.xs),
              left: overlayBands.footerBox.left,
              width: overlayBands.footerBox.width,
              fontSize: fontSizes.label,
              color: theme.text.muted,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: fadeIn(frame, 0, sec(1)),
              transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
            }}
          >
            {data.episode}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};

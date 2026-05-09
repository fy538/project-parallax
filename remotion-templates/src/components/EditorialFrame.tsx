/**
 * EditorialFrame — Magazine-layout scaffolding wrapper for Remotion templates.
 *
 * Adds editorial typographic hierarchy (kicker → hero → headline → body →
 * brand mark → byline) around an inner template (chart, map, diagram), pulling
 * the analytical layer closer to the channel's Fortune-1955 editorial register.
 *
 * Three variants, one dial from "rhetorical scaffolding dominates" to "data
 * dominates." Default is "minimal" — explicit opt-in required.
 *
 * Animation sequencing (hero variant):
 *   0–15   kicker rule extends + label fades
 *   10–30  hero stat scales in (0.9 → 1.0) + Y-translate (5px → 0)
 *   25–50  headline slides in
 *   45–70  body fades in
 *   60+    children mount (Sequence from=60 shifts their own frame counter)
 *   90–110 brand mark circle draws
 *   100–130 byline rule extends + label fades
 *
 * Usage:
 *   <EditorialFrame variant="hero" kicker="iterated prisoner's dilemma"
 *     hero="23%" headline="Does cooperation need memory?"
 *     body="Cooperation rate after 200 rounds..."
 *     byline="parallax · prisoner's dilemma · 2026"
 *   >
 *     <DataChart data={data} />
 *   </EditorialFrame>
 */

import React, { type ReactNode } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  layout,
} from "../design/theme";
import { useEpisodeColorEmphasis } from "../hooks/useEpisodeColorEmphasis";
import { CLAMP_CUBIC, CLAMP_SINE } from "../utils/animation";

// ── Types ─────────────────────────────────────────────────────────────────────

export type EditorialVariant = "hero" | "aside" | "minimal";

export interface EditorialFrameProps {
  /**
   * Layout variant. Default "minimal" — explicit opt-in to editorial scaffolding.
   * - "hero": full editorial layout with kicker, large hero stat, headline, body,
   *   and children in the right two-thirds of the frame.
   * - "aside": chart-dominant variant — smaller hero, compressed layout, children
   *   claim the primary visual real estate.
   * - "minimal": pure passthrough. Children render in their natural composition,
   *   with an optional tiny ∴ mark in the lower-right corner.
   */
  variant?: EditorialVariant;
  /**
   * Small kicker label, top-left. Rendered in IBM Plex Mono lowercase with
   * tracked-out letter-spacing. Preceded by a short rule in the episode
   * emphasis primary accent color.
   */
  kicker?: string;
  /**
   * Hero value: large display number, percentage, payoff pair, date, or
   * short name. Space Grotesk Medium (weight 500) — size carries the impact,
   * not weight.
   */
  hero?: string | number;
  /** 1-2 line headline. Sentence case. Question form preferred for Parallax voice. */
  headline?: string;
  /** 1-2 line body context, smaller scale, slightly reduced opacity (0.7). */
  body?: string;
  /** Bottom-left byline. IBM Plex Mono lowercase, preceded by a short ink rule. */
  byline?: string;
  /** The inner template content — chart, map, or diagram. */
  children: ReactNode;
  /**
   * Show the ∴ brand mark in a hairline circle at the lower-right corner.
   * Default: true for "hero" and "aside", false for "minimal".
   */
  showBrandMark?: boolean;
}

// ── Layout constants ──────────────────────────────────────────────────────────

// Hero variant: left text panel occupies ~38% of frame width (safe-area-inset)
const HERO_LEFT_PANEL_WIDTH = 560;
const HERO_RIGHT_PANEL_LEFT = layout.safeArea.left + HERO_LEFT_PANEL_WIDTH + layout.spacing.xxxl;

// Aside variant: left panel narrower (30%), children claim the majority
const ASIDE_LEFT_PANEL_WIDTH = 440;
const ASIDE_RIGHT_PANEL_LEFT =
  layout.safeArea.left + ASIDE_LEFT_PANEL_WIDTH + layout.spacing.xl;

// Type sizes specific to this component (non-theme-token editorial sizes)
const HERO_FONT_SIZE = 120; // ~120pt — between display(96) and 1.5× h1(96), Medium weight
const ASIDE_HERO_FONT_SIZE = 56; // smaller hero for chart-dominant layout
const HERO_HEADLINE_SIZE = 28; // between h3(36) and body(22) — editorial subhead
const BODY_FONT_SIZE = 15; // between caption(14) and body(22) — supporting context
const KICKER_FONT_SIZE = fontSizes.meta; // 11px — IBM Plex Mono register

// ── Shared sub-components ─────────────────────────────────────────────────────

/**
 * Animated ∴ brand mark inside a hairline ink circle.
 * Circle stroke draws from 0 to full circumference, then the glyph fades in.
 */
const BrandMark = React.memo(
  ({ radius, enterFrame }: { radius: number; enterFrame: number }) => {
    const frame = useCurrentFrame();
    const circumference = 2 * Math.PI * radius;

    // Circle stroke draws from top (rotate -90° to start at 12 o'clock)
    const strokeDashoffset = interpolate(
      frame,
      [enterFrame, enterFrame + 20],
      [circumference, 0],
      CLAMP_CUBIC,
    );

    // ∴ glyph fades in after circle is 75% drawn
    const glyphOpacity = interpolate(
      frame,
      [enterFrame + 15, enterFrame + 28],
      [0, 1],
      CLAMP_SINE,
    );

    const size = radius * 2;
    const glyphSize = Math.round(radius * 1.1);

    return (
      <div style={{ position: "relative", width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <circle
            cx={radius}
            cy={radius}
            r={radius - 1}
            fill="none"
            stroke={palette.ink}
            strokeWidth={1}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90, ${radius}, ${radius})`}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.heading,
            fontSize: glyphSize,
            fontWeight: 500,
            color: palette.ink,
            opacity: glyphOpacity,
            userSelect: "none",
          }}
        >
          ∴
        </div>
      </div>
    );
  },
);
BrandMark.displayName = "BrandMark";

// ── Hero variant ──────────────────────────────────────────────────────────────

const HeroLayout = React.memo(
  ({
    kicker,
    hero,
    headline,
    body,
    byline,
    children,
    showBrandMark,
    kickerColor,
  }: Omit<EditorialFrameProps, "variant"> & { kickerColor: string }) => {
    const frame = useCurrentFrame();

    // Frame 0–15: kicker rule extends, label fades
    const kickerRuleWidth = interpolate(frame, [0, 15], [0, 40], CLAMP_CUBIC);
    const kickerOpacity = interpolate(frame, [8, 20], [0, 1], CLAMP_SINE);

    // Frame 10–30: hero scales up from 0.9 + Y-translate 5px → 0 + opacity
    const heroOpacity = interpolate(frame, [10, 30], [0, 1], CLAMP_CUBIC);
    const heroScale = interpolate(frame, [10, 30], [0.9, 1.0], CLAMP_CUBIC);
    const heroTranslateY = interpolate(frame, [10, 30], [5, 0], CLAMP_CUBIC);

    // Frame 25–50: headline slides up + fades
    const headlineOpacity = interpolate(frame, [25, 50], [0, 1], CLAMP_SINE);
    const headlineTranslateY = interpolate(frame, [25, 50], [8, 0], CLAMP_CUBIC);

    // Frame 45–70: body fades
    const bodyOpacity = interpolate(frame, [45, 70], [0, 1], CLAMP_SINE);

    // Frame 100–130: byline rule extends, text fades
    const bylineRuleWidth = interpolate(frame, [100, 130], [0, 60], CLAMP_CUBIC);
    const bylineOpacity = interpolate(frame, [115, 135], [0, 1], CLAMP_SINE);

    return (
      <AbsoluteFill>
        {/* ── Left text panel ──────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: layout.safeArea.left,
            bottom: 0,
            width: HERO_LEFT_PANEL_WIDTH,
            pointerEvents: "none",
          }}
        >
          {/* Kicker: rule + label */}
          {kicker && (
            <div
              style={{
                position: "absolute",
                top: layout.safeArea.top + 8,
                left: 0,
                display: "flex",
                alignItems: "center",
                gap: layout.spacing.xs,
              }}
            >
              <div
                style={{
                  width: kickerRuleWidth,
                  height: 1,
                  backgroundColor: kickerColor,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: KICKER_FONT_SIZE,
                  fontWeight: 400,
                  color: palette.ink,
                  letterSpacing: 2,
                  textTransform: "lowercase" as const,
                  opacity: kickerOpacity,
                  whiteSpace: "nowrap",
                }}
              >
                {kicker}
              </div>
            </div>
          )}

          {/* Hero stat */}
          {hero !== undefined && (
            <div
              style={{
                position: "absolute",
                top: layout.safeArea.top + 56,
                left: 0,
                fontFamily: fonts.heading,
                fontSize: HERO_FONT_SIZE,
                fontWeight: 500,
                color: palette.ink,
                letterSpacing: -5,
                lineHeight: 1,
                maxWidth: HERO_LEFT_PANEL_WIDTH,
                overflow: "hidden",
                opacity: heroOpacity,
                transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
                transformOrigin: "left center",
              }}
            >
              {hero}
            </div>
          )}

          {/* Headline */}
          {headline && (
            <div
              style={{
                position: "absolute",
                top: layout.safeArea.top + 200,
                left: 0,
                fontFamily: fonts.heading,
                fontSize: HERO_HEADLINE_SIZE,
                fontWeight: 500,
                color: palette.ink,
                letterSpacing: 0,
                lineHeight: 1.3,
                maxWidth: HERO_LEFT_PANEL_WIDTH,
                overflow: "hidden",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                opacity: headlineOpacity,
                transform: `translateY(${headlineTranslateY}px)`,
              }}
            >
              {headline}
            </div>
          )}

          {/* Body */}
          {body && (
            <div
              style={{
                position: "absolute",
                top: layout.safeArea.top + 280,
                left: 0,
                fontFamily: fonts.heading,
                fontSize: BODY_FONT_SIZE,
                fontWeight: 400,
                color: palette.ink,
                letterSpacing: 0,
                lineHeight: 1.55,
                maxWidth: HERO_LEFT_PANEL_WIDTH,
                overflow: "hidden",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                opacity: bodyOpacity * 0.7,
              }}
            >
              {body}
            </div>
          )}

          {/* Byline: ink rule + text, bottom-anchored */}
          {byline && (
            <div
              style={{
                position: "absolute",
                bottom: layout.safeArea.bottom,
                left: 0,
              }}
            >
              <div
                style={{
                  width: bylineRuleWidth,
                  height: 1,
                  backgroundColor: palette.ink,
                  opacity: 0.35,
                  marginBottom: layout.spacing.xs,
                }}
              />
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: KICKER_FONT_SIZE,
                  fontWeight: 400,
                  color: palette.ink,
                  letterSpacing: 1,
                  textTransform: "lowercase" as const,
                  opacity: bylineOpacity * 0.6,
                  whiteSpace: "nowrap",
                }}
              >
                {byline}
              </div>
            </div>
          )}
        </div>

        {/* ── Right children panel ──────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: HERO_RIGHT_PANEL_LEFT,
            right: layout.safeArea.right,
            bottom: 0,
            overflow: "hidden",
          }}
        >
          {/*
           * Sequence from=60: shifts children's frame counter so they start
           * their own entrance animation when EditorialFrame is at frame 60.
           * Without this, chart bars would be ~50% grown by the time they
           * fade into view.
           */}
          <Sequence from={60}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
              }}
            >
              {children}
            </div>
          </Sequence>
        </div>

        {/* ── Brand mark: lower-right ───────────────────────────────────── */}
        {showBrandMark && (
          <div
            style={{
              position: "absolute",
              right: layout.safeArea.right + layout.spacing.xs,
              bottom: layout.safeArea.bottom + layout.spacing.xs,
            }}
          >
            <BrandMark radius={20} enterFrame={90} />
          </div>
        )}
      </AbsoluteFill>
    );
  },
);
HeroLayout.displayName = "HeroLayout";

// ── Aside variant ─────────────────────────────────────────────────────────────

const AsideLayout = React.memo(
  ({
    kicker,
    hero,
    body,
    byline,
    children,
    showBrandMark,
    kickerColor,
  }: Omit<EditorialFrameProps, "variant" | "headline"> & {
    kickerColor: string;
  }) => {
    const frame = useCurrentFrame();

    // Compressed timing: all scaffolding elements in 0–80 frames
    const kickerRuleWidth = interpolate(frame, [0, 12], [0, 40], CLAMP_CUBIC);
    const kickerOpacity = interpolate(frame, [6, 18], [0, 1], CLAMP_SINE);

    const heroOpacity = interpolate(frame, [8, 25], [0, 1], CLAMP_CUBIC);
    const heroScale = interpolate(frame, [8, 25], [0.9, 1.0], CLAMP_CUBIC);
    const heroTranslateY = interpolate(frame, [8, 25], [5, 0], CLAMP_CUBIC);

    const bodyOpacity = interpolate(frame, [20, 40], [0, 1], CLAMP_SINE);

    const bylineRuleWidth = interpolate(frame, [60, 80], [0, 60], CLAMP_CUBIC);
    const bylineOpacity = interpolate(frame, [68, 80], [0, 1], CLAMP_SINE);

    return (
      <AbsoluteFill>
        {/* ── Left panel ───────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: layout.safeArea.left,
            bottom: 0,
            width: ASIDE_LEFT_PANEL_WIDTH,
            pointerEvents: "none",
          }}
        >
          {kicker && (
            <div
              style={{
                position: "absolute",
                top: layout.safeArea.top + 8,
                left: 0,
                display: "flex",
                alignItems: "center",
                gap: layout.spacing.xs,
              }}
            >
              <div
                style={{
                  width: kickerRuleWidth,
                  height: 1,
                  backgroundColor: kickerColor,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: KICKER_FONT_SIZE,
                  fontWeight: 400,
                  color: palette.ink,
                  letterSpacing: 2,
                  textTransform: "lowercase" as const,
                  opacity: kickerOpacity,
                  whiteSpace: "nowrap",
                }}
              >
                {kicker}
              </div>
            </div>
          )}

          {hero !== undefined && (
            <div
              style={{
                position: "absolute",
                top: layout.safeArea.top + 56,
                left: 0,
                fontFamily: fonts.heading,
                fontSize: ASIDE_HERO_FONT_SIZE,
                fontWeight: 500,
                color: palette.ink,
                letterSpacing: -2,
                lineHeight: 1.1,
                maxWidth: ASIDE_LEFT_PANEL_WIDTH,
                overflow: "hidden",
                opacity: heroOpacity,
                transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
                transformOrigin: "left center",
              }}
            >
              {hero}
            </div>
          )}

          {body && (
            <div
              style={{
                position: "absolute",
                top: layout.safeArea.top + 148,
                left: 0,
                fontFamily: fonts.heading,
                fontSize: BODY_FONT_SIZE,
                fontWeight: 400,
                color: palette.ink,
                lineHeight: 1.55,
                maxWidth: ASIDE_LEFT_PANEL_WIDTH,
                overflow: "hidden",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                opacity: bodyOpacity * 0.7,
              }}
            >
              {body}
            </div>
          )}

          {byline && (
            <div
              style={{
                position: "absolute",
                bottom: layout.safeArea.bottom,
                left: 0,
              }}
            >
              <div
                style={{
                  width: bylineRuleWidth,
                  height: 1,
                  backgroundColor: palette.ink,
                  opacity: 0.35,
                  marginBottom: layout.spacing.xs,
                }}
              />
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: KICKER_FONT_SIZE,
                  fontWeight: 400,
                  color: palette.ink,
                  letterSpacing: 1,
                  textTransform: "lowercase" as const,
                  opacity: bylineOpacity * 0.6,
                  whiteSpace: "nowrap",
                }}
              >
                {byline}
              </div>
            </div>
          )}
        </div>

        {/* ── Right children panel (dominant) ──────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: ASIDE_RIGHT_PANEL_LEFT,
            right: layout.safeArea.right,
            bottom: 0,
            overflow: "hidden",
          }}
        >
          <Sequence from={35}>
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              {children}
            </div>
          </Sequence>
        </div>

        {showBrandMark && (
          <div
            style={{
              position: "absolute",
              right: layout.safeArea.right + layout.spacing.xs,
              bottom: layout.safeArea.bottom + layout.spacing.xs,
            }}
          >
            <BrandMark radius={15} enterFrame={50} />
          </div>
        )}
      </AbsoluteFill>
    );
  },
);
AsideLayout.displayName = "AsideLayout";

// ── Minimal variant ───────────────────────────────────────────────────────────

const MinimalLayout = React.memo(
  ({
    children,
    showBrandMark,
  }: {
    children: ReactNode;
    showBrandMark: boolean;
  }) => {
    const frame = useCurrentFrame();
    const markOpacity = showBrandMark
      ? interpolate(frame, [0, 15], [0, 1], CLAMP_SINE) * 0.35
      : 0;

    return (
      <AbsoluteFill>
        {children}
        {showBrandMark && (
          <div
            style={{
              position: "absolute",
              right: layout.safeArea.right,
              bottom: layout.safeArea.bottom,
              fontFamily: fonts.heading,
              fontSize: fontSizes.label,
              fontWeight: 500,
              color: palette.ink,
              opacity: markOpacity,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            ∴
          </div>
        )}
      </AbsoluteFill>
    );
  },
);
MinimalLayout.displayName = "MinimalLayout";

// ── Main component ────────────────────────────────────────────────────────────

/**
 * Compositional wrapper that adds editorial-magazine layout scaffolding around
 * an inner template (chart, map, diagram). Three variants provide a single dial
 * from "rhetorical scaffolding dominates" (hero) to "data dominates" (minimal).
 *
 * All scaffold animations use eased interpolation per BRAND.md timing principles.
 * The kicker rule color reads from the episode color emphasis context, adapting
 * to per-episode visual identity (Soviet → rust, american-modernist → gold, etc.).
 */
export const EditorialFrame = React.memo(
  ({
    variant = "minimal",
    kicker,
    hero,
    headline,
    body,
    byline,
    children,
    showBrandMark,
  }: EditorialFrameProps) => {
    const emphasis = useEpisodeColorEmphasis();
    // Kicker rule color follows episode accent — ties editorial scaffolding
    // to per-episode visual identity (rust for Soviet, gold for neutral/modernist).
    const kickerColor = emphasis.primaryAccent;

    const _showBrandMark = showBrandMark ?? variant !== "minimal";

    if (variant === "hero") {
      return (
        <HeroLayout
          kicker={kicker}
          hero={hero}
          headline={headline}
          body={body}
          byline={byline}
          children={children}
          showBrandMark={_showBrandMark}
          kickerColor={kickerColor}
        />
      );
    }

    if (variant === "aside") {
      return (
        <AsideLayout
          kicker={kicker}
          hero={hero}
          body={body}
          byline={byline}
          children={children}
          showBrandMark={_showBrandMark}
          kickerColor={kickerColor}
        />
      );
    }

    // minimal
    return (
      <MinimalLayout showBrandMark={_showBrandMark}>
        {children}
      </MinimalLayout>
    );
  },
);
EditorialFrame.displayName = "EditorialFrame";

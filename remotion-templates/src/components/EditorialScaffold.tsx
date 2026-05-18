/**
 * EditorialScaffold — Magazine-layout scaffolding wrapper for Remotion templates.
 *
 * NOTE — disambiguation: this is the older typographic-chrome wrapper
 * (kicker + hero stat + headline + body + brand mark + byline around a child
 * composition). The newer chart-composition system lives at
 * `components/EditorialFrame/` and is the canonical wrapper for chart
 * templates (see `EDITORIAL_FRAME_ARCHITECTURE.md`). This scaffold is kept
 * for the EditorialTest compositions + catalog stand-alone variants.
 *
 * Adds editorial typographic hierarchy (kicker → hero → headline → body →
 * brand mark → byline) around an inner template (chart, map, diagram), pulling
 * the analytical layer closer to the channel's Fortune-1955 editorial register.
 *
 * Three variants, one dial from "rhetorical scaffolding dominates" to "data
 * dominates." Default is "minimal" — explicit opt-in required.
 *
 * Mode: light (ink-on-paper, default) or dark (bone-on-near-black). Resolved
 * via prop > context > "light". FullEpisode sets the context per segment from
 * the active backdrop's `register` field — no script tag or episode toggle.
 * See src/design/editorialModes.ts.
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
 *   <EditorialScaffold variant="hero" kicker="iterated prisoner's dilemma"
 *     hero="23%" headline="Does cooperation need memory?"
 *     body="Cooperation rate after 200 rounds..."
 *     byline="parallax · prisoner's dilemma · 2026"
 *   >
 *     <DataChart data={data} />
 *   </EditorialScaffold>
 */

import React, { type ReactNode } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import {
  brandMark,
  fonts,
  fontSizes,
  layout,
} from "../design/theme";
import {
  type EditorialMode,
  type EditorialModeColors,
  editorialColors,
  useEditorialMode,
} from "../design/editorialModes";
import { useEpisodeColorEmphasis } from "../hooks/useEpisodeColorEmphasis";
import { CLAMP_CUBIC, CLAMP_SINE } from "../utils/animation";

// ── Types ─────────────────────────────────────────────────────────────────────

export type EditorialScaffoldVariant = "hero" | "hero-flipped" | "aside" | "minimal";

export interface EditorialScaffoldProps {
  /**
   * Layout variant. Default "minimal" — explicit opt-in to editorial scaffolding.
   * - "hero": full editorial layout with kicker, large hero stat, headline, body,
   *   on the left, and children in the right two-thirds of the frame.
   * - "hero-flipped": mirror of "hero" — hero block right, chart left. Pair with
   *   right-anchored atmospheric backdrops (e.g. reading-room) so the hero
   *   block sits on the dense side and the chart over the quiet zone.
   * - "aside": chart-dominant variant — smaller hero, compressed layout, children
   *   claim the primary visual real estate.
   * - "minimal": pure passthrough. Children render in their natural composition,
   *   with an optional tiny ∴ mark in the lower-right corner.
   */
  variant?: EditorialScaffoldVariant;
  /**
   * Foreground typography mode. When omitted, reads from EditorialModeContext
   * (set by FullEpisode based on the active backdrop's `register`). Outside
   * any provider, defaults to "light". Pass explicitly in standalone test
   * compositions or for one-off overrides.
   */
  mode?: EditorialMode;
  /**
   * Small kicker label, top-left. Rendered in IBM Plex Mono lowercase with
   * tracked-out letter-spacing. Preceded by a short rule in the episode
   * emphasis primary accent color.
   */
  kicker?: string;
  /**
   * Hero value: large display number, percentage, payoff pair, date, or
   * short name. IBM Plex Sans Medium (weight 500) — size carries the impact,
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
 * Animated brand mark inside a hairline ink circle.
 * Circle stroke draws from 0 to full circumference, then the glyph fades in.
 *
 * The glyph itself comes from `brandMark.glyph` in theme.ts (single source
 * of truth; ultimately tools/brand-treatment/palette.json::brandMark.glyph).
 * If `brandMark.svg` is non-null, this renders the SVG asset instead of the
 * glyph — letting a future logo swap to an image asset live in one place.
 *
 * The lint rule `no-literal-brand-mark` (scripts/lint-conventions.mjs) blocks
 * any other file from inlining a literal "∴" — every other render site must
 * route through this component (or `<BrandLockup>` for the footer pattern,
 * or `brandMark.glyph` for plain-text contexts like the dashboard HTML).
 */
const BrandMark = React.memo(
  ({
    radius,
    enterFrame,
    colors,
  }: {
    radius: number;
    enterFrame: number;
    colors: EditorialModeColors;
  }) => {
    const frame = useCurrentFrame();
    const circumference = 2 * Math.PI * radius;

    // Circle stroke draws from top (rotate -90° to start at 12 o'clock)
    const strokeDashoffset = interpolate(
      frame,
      [enterFrame, enterFrame + 20],
      [circumference, 0],
      CLAMP_CUBIC,
    );

    // Glyph/SVG fades in after circle is 75% drawn
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
            stroke={colors.brandMark}
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
            fontFamily: brandMark.fontFamily,
            fontSize: glyphSize,
            fontWeight: 500,
            color: colors.brandMark,
            opacity: glyphOpacity,
            userSelect: "none",
          }}
        >
          {brandMark.svg ? (
            <img
              src={brandMark.svg}
              alt=""
              width={glyphSize}
              height={glyphSize}
              style={{ display: "block" }}
            />
          ) : (
            brandMark.glyph
          )}
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
    colors,
    flipped = false,
  }: Omit<EditorialScaffoldProps, "variant" | "mode"> & {
    kickerColor: string;
    colors: EditorialModeColors;
    /**
     * When true, mirror the layout horizontally: hero block on the right,
     * chart on the left, brand mark lower-left, byline bottom-right.
     * Kicker stays top-left (channel-default anchor).
     */
    flipped?: boolean;
  }) => {
    const frame = useCurrentFrame();

    // Horizontal placement: flipped swaps text panel and chart panel.
    // Kicker stays top-left regardless of flip (channel-default anchor).
    const textPanelStyle = flipped
      ? {
          right: layout.safeArea.right,
          width: HERO_LEFT_PANEL_WIDTH,
        }
      : {
          left: layout.safeArea.left,
          width: HERO_LEFT_PANEL_WIDTH,
        };
    const textAlign: "left" | "right" = flipped ? "right" : "left";
    const heroTransformOrigin = flipped ? "right center" : "left center";

    const childrenPanelStyle = flipped
      ? {
          left: layout.safeArea.left,
          right: HERO_RIGHT_PANEL_LEFT,
        }
      : {
          left: HERO_RIGHT_PANEL_LEFT,
          right: layout.safeArea.right,
        };

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

    // Inner-item horizontal alignment inside the text panel: standard hero
    // hugs the left edge; flipped hero hugs the right edge of its panel.
    const innerEdge = flipped ? { right: 0 } : { left: 0 };

    return (
      <AbsoluteFill>
        {/* ── Kicker: always top-left of frame (channel-default anchor) ─ */}
        {kicker && (
          <div
            style={{
              position: "absolute",
              top: layout.safeArea.top + 8,
              left: layout.safeArea.left,
              display: "flex",
              alignItems: "center",
              gap: layout.spacing.xs,
              pointerEvents: "none",
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
                color: colors.textSecondary,
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

        {/* ── Hero text panel (flips left↔right) ──────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            pointerEvents: "none",
            ...textPanelStyle,
          }}
        >
          {/* Hero stat */}
          {hero !== undefined && (
            <div
              style={{
                position: "absolute",
                top: layout.safeArea.top + 56,
                ...innerEdge,
                fontFamily: fonts.heading,
                fontSize: HERO_FONT_SIZE,
                fontWeight: 500,
                color: colors.text,
                letterSpacing: -5,
                lineHeight: 1,
                maxWidth: HERO_LEFT_PANEL_WIDTH,
                overflow: "hidden",
                textAlign,
                opacity: heroOpacity,
                transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
                transformOrigin: heroTransformOrigin,
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
                top: layout.safeArea.top + 210,
                ...innerEdge,
                fontFamily: fonts.heading,
                fontSize: HERO_HEADLINE_SIZE,
                fontWeight: 500,
                color: colors.text,
                letterSpacing: 0,
                lineHeight: 1.3,
                maxWidth: HERO_LEFT_PANEL_WIDTH,
                overflow: "hidden",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                textAlign,
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
                top: layout.safeArea.top + 320,
                ...innerEdge,
                fontFamily: fonts.heading,
                fontSize: BODY_FONT_SIZE,
                fontWeight: 400,
                color: colors.text,
                letterSpacing: 0,
                lineHeight: 1.55,
                maxWidth: HERO_LEFT_PANEL_WIDTH,
                overflow: "hidden",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                textAlign,
                opacity: bodyOpacity * 0.7,
              }}
            >
              {body}
            </div>
          )}

          {/* Byline: rule + text, bottom-anchored to same side as hero */}
          {byline && (
            <div
              style={{
                position: "absolute",
                bottom: layout.safeArea.bottom,
                ...innerEdge,
                display: "flex",
                flexDirection: "column",
                alignItems: flipped ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  width: bylineRuleWidth,
                  height: 1,
                  backgroundColor: colors.rule,
                  opacity: 0.35,
                  marginBottom: layout.spacing.xs,
                }}
              />
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: KICKER_FONT_SIZE,
                  fontWeight: 400,
                  color: colors.textSecondary,
                  letterSpacing: 1,
                  textTransform: "lowercase" as const,
                  opacity: bylineOpacity * 0.6,
                  whiteSpace: "nowrap",
                  textAlign,
                }}
              >
                {byline}
              </div>
            </div>
          )}
        </div>

        {/* ── Chart panel (flips left↔right) ───────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            overflow: "hidden",
            ...childrenPanelStyle,
          }}
        >
          {/*
           * Sequence from=60: shifts children's frame counter so they start
           * their own entrance animation when EditorialScaffold is at frame 60.
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

        {/* ── Brand mark: opposite corner from hero block ─────────────── */}
        {showBrandMark && (
          <div
            style={{
              position: "absolute",
              ...(flipped
                ? { left: layout.safeArea.left + layout.spacing.xs }
                : { right: layout.safeArea.right + layout.spacing.xs }),
              bottom: layout.safeArea.bottom + layout.spacing.xs,
            }}
          >
            <BrandMark radius={20} enterFrame={90} colors={colors} />
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
    colors,
  }: Omit<EditorialScaffoldProps, "variant" | "headline" | "mode"> & {
    kickerColor: string;
    colors: EditorialModeColors;
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
                  color: colors.textSecondary,
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
                color: colors.text,
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
                color: colors.text,
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
                  backgroundColor: colors.rule,
                  opacity: 0.35,
                  marginBottom: layout.spacing.xs,
                }}
              />
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: KICKER_FONT_SIZE,
                  fontWeight: 400,
                  color: colors.textSecondary,
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
            <BrandMark radius={15} enterFrame={50} colors={colors} />
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
    colors,
  }: {
    children: ReactNode;
    showBrandMark: boolean;
    colors: EditorialModeColors;
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
              fontFamily: brandMark.fontFamily,
              fontSize: fontSizes.label,
              fontWeight: 500,
              color: colors.brandMark,
              opacity: markOpacity,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {brandMark.glyph}
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
 * Mode resolution: `mode` prop > `EditorialModeContext` (set by FullEpisode
 * from backdrop register) > `"light"`. The variant logic and animation
 * sequencing are identical across modes — only colors change.
 *
 * All scaffold animations use eased interpolation per BRAND.md timing principles.
 * The kicker rule color reads from the episode color emphasis context, adapting
 * to per-episode visual identity (Soviet → rust, american-modernist → gold, etc.).
 */
export const EditorialScaffold = React.memo(
  ({
    variant = "minimal",
    mode,
    kicker,
    hero,
    headline,
    body,
    byline,
    children,
    showBrandMark,
  }: EditorialScaffoldProps) => {
    const contextMode = useEditorialMode();
    const resolvedMode: EditorialMode = mode ?? contextMode;
    const colors = editorialColors(resolvedMode);

    const emphasis = useEpisodeColorEmphasis();
    // Kicker rule color follows episode accent — ties editorial scaffolding
    // to per-episode visual identity (rust for Soviet, gold for neutral/modernist).
    // Same in both modes — episode accents already pass contrast on light AND
    // dark backdrops per the palette discipline (rust/gold/dustblue all sit at
    // muted ~40-50% saturation that reads on either ground).
    const kickerColor = emphasis.primaryAccent;

    const _showBrandMark = showBrandMark ?? variant !== "minimal";

    if (variant === "hero" || variant === "hero-flipped") {
      return (
        <HeroLayout
          kicker={kicker}
          hero={hero}
          headline={headline}
          body={body}
          byline={byline}
          showBrandMark={_showBrandMark}
          kickerColor={kickerColor}
          colors={colors}
          flipped={variant === "hero-flipped"}
        >
          {children}
        </HeroLayout>
      );
    }

    if (variant === "aside") {
      return (
        <AsideLayout
          kicker={kicker}
          hero={hero}
          body={body}
          byline={byline}
          showBrandMark={_showBrandMark}
          kickerColor={kickerColor}
          colors={colors}
        >
          {children}
        </AsideLayout>
      );
    }

    // minimal
    return (
      <MinimalLayout showBrandMark={_showBrandMark} colors={colors}>
        {children}
      </MinimalLayout>
    );
  },
);
EditorialScaffold.displayName = "EditorialScaffold";

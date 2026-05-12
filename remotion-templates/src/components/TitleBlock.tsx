/**
 * TitleBlock — shared title + subtitle component for all data templates.
 *
 * Replaces the duplicated title pattern (FadeIn + absolute position + h2 + subtitle)
 * that was copy-pasted across DataChart, FrameworkDiagram, TimeSeriesChart,
 * ChoroplethMap, GameBoard, DecisionTree, NetworkDiagram, SankeyFlow, etc.
 *
 * Enforces:
 *   - POLISH.md L5/L7: title-to-content gap via safe area positioning
 *   - POLISH.md L9: maxWidth from textMaxWidth tokens
 *   - POLISH.md T1-T3: typography hierarchy (h2 title, body subtitle)
 *   - POLISH.md L14: mode-aware colors via useThemeMode
 *   - Cinematic entrance animation via FadeIn
 *
 * Usage:
 *   <TitleBlock
 *     title="SMIC Yield Curve"
 *     subtitle="7nm process, quarterly data"
 *     mode={data.backgroundVariant}
 *   />
 *
 * POLISH.md L13: Use TitleBlock, don't hand-build title blocks.
 */

import React, { useMemo } from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { measureText } from "@remotion/layout-utils";
import {
  durations,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  palette,
  sec,
  textMaxWidth,
  type Mode,
} from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";
import { useEpisodeColorEmphasis } from "../hooks/useEpisodeColorEmphasis";
import type { DirectionSyncPoint } from "../hooks/useDirection";
import { FadeIn } from "./FadeIn";
import { CLAMP, anticipatoryStartFrame } from "../utils/animation";

interface TitleBlockProps {
  /** Main title text */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Background mode — determines text colors automatically */
  mode?: Mode | string;
  /** Override accent color for decorative elements */
  accentColor?: string;
  /** Position alignment. Default: "top-left" (standard data template position) */
  align?: "top-left" | "top-center";
  /** Safe area tier — controls distance from edges. Default: "generous" (120px), per L69.
   *  Override to "tight" for centered single-element compositions, "broadcast" for TV-style padding. */
  safeAreaTier?: keyof typeof layout.safeAreaTier;
  /** Override the FadeIn start frame. Default: 0 */
  startFrame?: number;
  /** Skip the cinematic entrance animation */
  noAnimation?: boolean;
  /** Show an accent underline that draws in beneath the title (brand signature). Default: false. */
  underline?: boolean;
  /**
   * Narration sync points from `useDirection(data._direction).syncPoints`.
   * When provided AND `syncPoints[0]` carries a Whisper-resolved cue frame,
   * the entrance start is computed via `anticipatoryStartFrame()` so the
   * block lands ~150ms BEFORE the narrator says the title — POLISH.md D17.
   *
   * When absent (the common case today, before the visual-spec pipeline
   * emits sync points), the entrance falls back to the `startFrame` prop,
   * preserving the existing visual baseline byte-for-byte.
   *
   * Note: only `syncPoints[0]` is consumed. The title and subtitle land
   * together as a single block (single FadeIn wrapper); per-element
   * anticipation of the subtitle would require splitting the wrapper,
   * which would shift the baseline for every consumer. Templates that need
   * fine-grained title-vs-subtitle anticipation should use the
   * `TitleTransition.editorial-title` variant's split pattern (commit 1da5a49)
   * instead of `TitleBlock`.
   */
  syncPoints?: DirectionSyncPoint[];
  /** Additional content rendered below subtitle (e.g., legend) */
  children?: React.ReactNode;
}

export const TitleBlock: React.FC<TitleBlockProps> = ({
  title,
  subtitle,
  mode,
  accentColor,
  align = "top-left",
  safeAreaTier = "generous",
  startFrame = 0,
  noAnimation = false,
  underline = false,
  syncPoints,
  children,
}) => {
  const theme = useThemeMode(mode);
  const safe = layout.safeAreaTier[safeAreaTier];
  const frame = useCurrentFrame();
  const accent =
    accentColor || (mode === "dark" ? palette.amber : palette.oxblood);
  // Per-episode display-font override. emphasis.displayFont (when set by
  // EMPHASIS_MAP for the active episode) wins over the channel default,
  // so a Soviet/Showa/Chinese-state episode has typographic voice
  // continuity with its AI cover art (recraft.py text_treatment) — not
  // just shared color emphasis.
  const emphasis = useEpisodeColorEmphasis();
  const titleFontFamily = emphasis.displayFont ?? fonts.heading;
  // Actual rendered font size for the title.
  // measureText() measures the exact browser-rendered width of the title string
  // at h2 size, then scales down proportionally if it exceeds the available safe
  // area width. Floor at h3 (36px) so the title never becomes unreadable.
  // Falls back to system-font measurement on first Studio frame before fonts load
  // (validateFontIsLoaded intentionally omitted — render mode pre-loads fonts;
  // a first-frame preview glitch is preferable to a thrown error).
  const titleFontSize = useMemo(() => {
    const availableWidth = Math.min(
      textMaxWidth.h2,
      layout.width - safe.left - safe.right
    );
    const { width: measuredWidth } = measureText({
      text: title,
      fontFamily: titleFontFamily,
      fontSize: fontSizes.h2,
      fontWeight: fontWeights.semibold,
      letterSpacing: `${letterSpacing.h2}px`,
    });
    const scale = Math.min(1, availableWidth / Math.max(1, measuredWidth));
    const minScale = fontSizes.h3 / fontSizes.h2;
    return Math.max(fontSizes.h3, fontSizes.h2 * Math.max(scale, minScale));
  }, [title, titleFontFamily, safe.left, safe.right]);

  // ── Anticipatory-reveal adoption (POLISH.md D17, motion-design.md § 3) ──
  // When `syncPoints[0]` carries a Whisper-resolved cue, the block lands
  // ~150ms before the narrator says the title. Fall back to the `startFrame`
  // prop otherwise — preserves byte-identical baseline in the no-sync case.
  // Settle envelope matches `durations.fadeIn` (the FadeIn wrapper's opacity
  // envelope below). See TitleTransition.editorial-title (commit 1da5a49)
  // for the canonical idiom this mirrors.
  const effectiveStartFrame =
    syncPoints?.[0]?.frame !== undefined
      ? anticipatoryStartFrame(syncPoints[0].frame, durations.fadeIn)
      : startFrame;

  // Underline scale-in animation (after title fade-in completes)
  const underlineProgress = interpolate(
    frame,
    [effectiveStartFrame + sec(0.4), effectiveStartFrame + sec(1.0)],
    [0, 1],
    { ...CLAMP, easing: Easing.out(Easing.cubic) }
  );

  const content = (
    <div
      style={{
        position: "absolute",
        top: safe.top,
        left: safe.left,
        right: align === "top-center" ? safe.right : undefined,
        textAlign: align === "top-center" ? "center" : "left",
      }}
    >
      {/* Title — h2, heading font, primary text color.
          Font size is pre-computed via measureText() — see titleFontSize above. */}
      <div
        style={{
          fontSize: titleFontSize,
          fontWeight: fontWeights.semibold,
          color: theme.text.primary,
          fontFamily: titleFontFamily,
          textShadow: theme.textShadow,
          maxWidth: textMaxWidth.h2,
          letterSpacing: letterSpacing.h2,
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>

      {/* Optional accent underline — gradient-fade signature, draws in left-to-right */}
      {underline && (
        <div
          style={{
            height: 2,
            width: 88,
            background: `linear-gradient(${align === "top-center" ? "90deg" : "90deg"}, ${accent} 0%, ${accent}80 70%, transparent 100%)`,
            marginTop: layout.spacing.xs,
            marginLeft: align === "top-center" ? "auto" : 0,
            marginRight: align === "top-center" ? "auto" : 0,
            transform: `scaleX(${underlineProgress})`,
            transformOrigin: align === "top-center" ? "center" : "left center",
            boxShadow: `0 0 6px ${accent}50`,
            opacity: underlineProgress,
          }}
        />
      )}

      {/* Subtitle — body, muted text color */}
      {subtitle && (
        <div
          style={{
            fontSize: fontSizes.body,
            color: theme.text.muted,
            marginTop: layout.spacing.xs,
            textShadow: theme.textShadow,
            maxWidth: textMaxWidth.body,
          }}
        >
          {subtitle}
        </div>
      )}

      {/* Optional extra content (legend, context note, etc.) */}
      {children}
    </div>
  );

  if (noAnimation) {
    return content;
  }

  return (
    <FadeIn startFrame={effectiveStartFrame} direction="up" distance={30} cinematic>
      {content}
    </FadeIn>
  );
};

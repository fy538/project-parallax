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

import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import {
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
import { FadeIn } from "./FadeIn";
import { CLAMP } from "../utils/animation";

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
  children,
}) => {
  const theme = useThemeMode(mode);
  const safe = layout.safeAreaTier[safeAreaTier];
  const frame = useCurrentFrame();
  const accent =
    accentColor || (mode === "dark" ? palette.amber : palette.oxblood);
  // Underline scale-in animation (after title fade-in completes)
  const underlineProgress = interpolate(
    frame,
    [startFrame + sec(0.4), startFrame + sec(1.0)],
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
          Dynamic font size: long titles auto-scale down so they don't
          overflow the safe area. Estimate width using a 0.55 char-width
          factor (rough but reliable for English headings) and reduce
          font-size proportionally. Floor at h3 so headings never become
          unreadable; titles longer than that should be split into
          title + subtitle by the data author. */}
      {(() => {
        const charWidthFactor = 0.55;
        const availableWidth = Math.min(
          textMaxWidth.h2,
          layout.width - safe.left - safe.right
        );
        const estimatedWidth = title.length * fontSizes.h2 * charWidthFactor;
        const scale = Math.min(1, availableWidth / Math.max(1, estimatedWidth));
        const minScale = fontSizes.h3 / fontSizes.h2;
        const finalSize = Math.max(fontSizes.h3, fontSizes.h2 * Math.max(scale, minScale));
        return (
          <div
            style={{
              fontSize: finalSize,
              fontWeight: fontWeights.semibold,
              color: theme.text.primary,
              fontFamily: fonts.heading,
              textShadow: theme.textShadow,
              maxWidth: textMaxWidth.h2,
              letterSpacing: letterSpacing.h2,
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
        );
      })()}

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
    <FadeIn startFrame={startFrame} direction="up" distance={30} cinematic>
      {content}
    </FadeIn>
  );
};

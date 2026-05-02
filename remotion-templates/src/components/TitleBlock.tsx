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
import {
  fonts,
  fontSizes,
  fontWeights,
  layout,
  textMaxWidth,
  shadows,
  type Mode,
} from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";
import { FadeIn } from "./FadeIn";

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
  /** Override the FadeIn start frame. Default: 0 */
  startFrame?: number;
  /** Skip the cinematic entrance animation */
  noAnimation?: boolean;
  /** Additional content rendered below subtitle (e.g., legend) */
  children?: React.ReactNode;
}

export const TitleBlock: React.FC<TitleBlockProps> = ({
  title,
  subtitle,
  mode,
  accentColor,
  align = "top-left",
  startFrame = 0,
  noAnimation = false,
  children,
}) => {
  const theme = useThemeMode(mode);

  const content = (
    <div
      style={{
        position: "absolute",
        top: layout.safeArea.top,
        left: layout.safeArea.left,
        right: align === "top-center" ? layout.safeArea.right : undefined,
        textAlign: align === "top-center" ? "center" : "left",
      }}
    >
      {/* Title — h2, heading font, primary text color */}
      <div
        style={{
          fontSize: fontSizes.h2,
          fontWeight: fontWeights.semibold,
          color: theme.text.primary,
          fontFamily: fonts.heading,
          textShadow: theme.textShadow,
          maxWidth: textMaxWidth.h2,
          letterSpacing: 2,
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>

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

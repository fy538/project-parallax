/**
 * ShortsWrapper — standard vertical shell for 9:16 Shorts compositions.
 *
 * Provides:
 *   - Background with vertical grain
 *   - Composition animation (enter/exit fades)
 *   - Vertical title block
 *   - Safe area enforcement
 *
 * Templates wrap their vertical layout in this instead of building
 * their own boilerplate. The wrapper handles everything that's the
 * same across all Shorts; the template only provides what's unique.
 *
 * Usage:
 *   <ShortsWrapper title="..." subtitle="..." mode={data.backgroundVariant}>
 *     {(vl, theme, frame, exit) => (
 *       <div style={{ top: vl.contentTop }}>...custom content...</div>
 *     )}
 *   </ShortsWrapper>
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  fonts,
  fontWeights,
  type Mode,
} from "../design/theme";
import { useThemeMode, type ThemeTokens } from "../hooks/useThemeMode";
import {
  useVerticalLayout,
  type VerticalLayoutTokens,
} from "../hooks/useVerticalLayout";
import { useCompositionAnimation } from "../hooks/useCompositionAnimation";
import { exitFade, fadeIn } from "../utils/animation";
import { Background } from "./Background";

interface ShortsWrapperProps {
  /** Title shown at top */
  title?: string;
  /** Subtitle below title */
  subtitle?: string;
  /** Theme mode */
  mode?: Mode | string;
  /** Render function receiving layout tokens and theme */
  children: (
    vl: VerticalLayoutTokens,
    theme: ThemeTokens,
    frame: number,
    exit: number
  ) => React.ReactNode;
}

export const ShortsWrapper: React.FC<ShortsWrapperProps> = ({
  title,
  subtitle,
  mode,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const vl = useVerticalLayout();
  const theme = useThemeMode(mode);
  const { style: compStyle } = useCompositionAnimation();

  const exit = exitFade(frame, durationInFrames, 30); // ~1s exit
  const titleOpacity = fadeIn(frame, 0, 15) * exit;

  return (
    <Background variant={(mode as Mode) || "light"}>
      <AbsoluteFill style={compStyle}>
        {/* Title */}
        {title && (
          <div
            style={{
              position: "absolute",
              top: vl.titleTop,
              left: vl.safeArea.left,
              right: vl.safeArea.right,
              textAlign: "center",
              opacity: titleOpacity,
            }}
          >
            <div
              style={{
                fontSize: vl.fontSizes.h2,
                fontWeight: fontWeights.semibold,
                color: theme.text.primary,
                fontFamily: fonts.heading,
                textShadow: theme.textShadow,
                letterSpacing: 2,
                lineHeight: 1.1,
                maxWidth: vl.textMaxWidth.h2,
                margin: "0 auto",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: vl.fontSizes.body,
                  color: theme.text.muted,
                  marginTop: vl.spacing.sm,
                  textShadow: theme.textShadow,
                  maxWidth: vl.textMaxWidth.body,
                  margin: `${vl.spacing.sm}px auto 0`,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        )}

        {/* Template content */}
        {children(vl, theme, frame, exit)}
      </AbsoluteFill>
    </Background>
  );
};

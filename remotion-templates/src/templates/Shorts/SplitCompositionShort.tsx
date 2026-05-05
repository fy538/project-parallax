/**
 * SplitCompositionShort — vertical 9:16 split composition for Shorts.
 *
 * Adapts SplitComposition for vertical layout. Stacks left and right panels
 * vertically with clear separation. Shows each side's tag, title, body text,
 * and bullet points in flowing vertical layout.
 */

import React from "react";
import {
  palette,
  fonts,
  fontWeights,
  sec,
} from "../../design/theme";
import { fadeIn, slideIn } from "../../utils/animation";
import { ShortsWrapper } from "../../components/ShortsWrapper";
import type { SplitCompositionData } from "../SplitComposition/types";

export const SplitCompositionShort: React.FC<{ data: SplitCompositionData }> = ({
  data,
}) => {
  return (
    <ShortsWrapper
      title={data.title}
      subtitle={data.subtitle}
      mode={data.backgroundVariant}
    >
      {(vl, theme, frame, exit) => {
        const startDelay = sec(0.3);
        const sideStagger = sec(0.4);
        const itemStagger = sec(0.15);
        const sideFadeDuration = sec(0.5);
        const itemFadeDuration = sec(0.4);

        const renderSide = (side: typeof data.left, sideIdx: number) => {
          const sideStart = startDelay + sideIdx * sideStagger;
          const sideOpacity = fadeIn(frame, sideStart, sideFadeDuration) * exit;
          const sideColor = side.accentColor || (sideIdx === 0 ? palette.amber : palette.rust);

          return (
            <div
              key={sideIdx}
              style={{
                opacity: sideOpacity,
                padding: vl.spacing.lg,
                borderRadius: 8,
                background: side.bgTint ? `${side.bgTint}15` : `${sideColor}10`,
                borderTop: `4px solid ${sideColor}`,
              }}
            >
              {/* Tag */}
              {side.tag && (
                <div
                  style={{
                    fontSize: vl.fontSizes.caption,
                    fontWeight: fontWeights.bold,
                    color: sideColor,
                    fontFamily: fonts.data,
                    letterSpacing: 2,
                    marginBottom: vl.spacing.sm,
                    textShadow: theme.textShadow,
                  }}
                >
                  {side.tag}
                </div>
              )}

              {/* Title */}
              <div
                style={{
                  fontSize: vl.fontSizes.label,
                  fontWeight: fontWeights.bold,
                  color: theme.text.primary,
                  fontFamily: fonts.heading,
                  marginBottom: vl.spacing.md,
                  textShadow: theme.textShadow,
                }}
              >
                {side.title}
              </div>

              {/* Subtitle */}
              {side.subtitle && (
                <div
                  style={{
                    fontSize: vl.fontSizes.body,
                    color: theme.text.secondary,
                    fontFamily: fonts.body,
                    marginBottom: vl.spacing.md,
                    textShadow: theme.textShadow,
                  }}
                >
                  {side.subtitle}
                </div>
              )}

              {/* Items list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: vl.spacing.sm,
                }}
              >
                {side.items.map((item, itemIdx) => {
                  const itemStart = sideStart + itemIdx * itemStagger;
                  const itemOpacity = fadeIn(frame, itemStart, itemFadeDuration) * exit;
                  const itemTranslate = slideIn(frame, itemStart, 12, itemFadeDuration);

                  return (
                    <div
                      key={itemIdx}
                      style={{
                        opacity: itemOpacity,
                        transform: `translateX(${itemTranslate}px)`,
                        fontSize: vl.fontSizes.body,
                        color: theme.text.secondary,
                        fontFamily: fonts.body,
                        paddingLeft: vl.spacing.md,
                        textShadow: theme.textShadow,
                      }}
                    >
                      <span style={{ marginRight: vl.spacing.sm }}>•</span>
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        };

        return (
          <div
            style={{
              position: "absolute",
              top: vl.contentTop,
              left: vl.safeArea.left,
              right: vl.safeArea.right,
              bottom: vl.safeArea.bottom,
              display: "flex",
              flexDirection: "column",
              gap: vl.spacing.lg,
            }}
          >
            {/* Left side */}
            {renderSide(data.left, 0)}

            {/* Divider label */}
            {!data.noDivider && (
              <div
                style={{
                  textAlign: "center",
                  opacity: fadeIn(frame, startDelay + sideStagger, sec(0.3)) * exit,
                  fontSize: vl.fontSizes.label,
                  fontWeight: fontWeights.bold,
                  color: palette.amber,
                  fontFamily: fonts.heading,
                  textShadow: theme.textShadow,
                }}
              >
                {data.dividerLabel || "vs"}
              </div>
            )}

            {/* Right side */}
            {renderSide(data.right, 1)}

            {/* Source */}
            {data.source && (
              <div
                style={{
                  marginTop: vl.spacing.lg,
                  fontSize: vl.fontSizes.caption,
                  color: theme.text.muted,
                  fontFamily: fonts.body,
                  textAlign: "center",
                  opacity: fadeIn(
                    frame,
                    startDelay + 2 * sideStagger + sec(0.5),
                    sec(0.3)
                  ) * exit,
                  textShadow: theme.textShadow,
                }}
              >
                {data.source}
              </div>
            )}
          </div>
        );
      }}
    </ShortsWrapper>
  );
};

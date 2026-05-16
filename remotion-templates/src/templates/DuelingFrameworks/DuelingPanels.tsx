/**
 * Display sub-components for DuelingFrameworks:
 *   ScoringBar, FrameworkPanel
 *
 * @composition-animation: delegated — sub-component helper rendered by
 * CinematicDuelingFrameworks / StaticDuelingFrameworks, which own the hook call.
 */

import React from "react";
import {
  interpolate,
} from "remotion";
import {
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  lineHeight,
  textMaxWidth,
  layout,
  sec,
  shadows,
  radii,
  cardPresets,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  stagger,
  CLAMP_QUARTIC,
} from "../../utils/animation";
import { type ThemeTokens } from "../../hooks/useThemeMode";
import type { Framework } from "./types";
import { getFontFamily, getBodyFont } from "./dueling-utils";

// ── ScoringBar component (animated horizontal bar with glow) ────────────
export const ScoringBar: React.FC<{
  score: number;
  color: string;
  frame: number;
  startFrame: number;
  duration: number;
  theme: ThemeTokens;
  /** Pass true for dark-mode backgrounds so shimmer uses a subtle white-on-dark stop */
  isDark?: boolean;
}> = React.memo(({ score, color, frame, startFrame, duration, theme, isDark = false }) => {
  const barProgress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, score / 100],
    CLAMP_QUARTIC
  );

  const barWidth = barProgress * 100;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 32,
        backgroundColor: "rgba(0,0,0,0.05)",
        border: "none",
        borderRadius: radii.xs,
        overflow: "hidden",
        marginBottom: layout.spacing.md,
        boxShadow: `inset 0 1px 2px rgba(0,0,0,0.08)`, // shadows.none equivalent — inset surface (no token)
      }}
    >
      {/* Outer glow layer */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${barWidth}%`,
          backgroundColor: color,
          opacity: 0.3,
          filter: "blur(8px)",
          zIndex: 0,
        }}
      />
      {/* Bar fill — vertical gradient (light top → solid bottom) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${barWidth}%`,
          background: `linear-gradient(180deg, ${color}E0 0%, ${color} 100%)`,
          zIndex: 1,
          boxShadow: `inset 0 -1px 2px rgba(0,0,0,0.2), inset -1px 0 2px rgba(0,0,0,0.18)`, // shadows.none equivalent — inset border composite (no token)
        }}
      />
      {/* Specular highlight — thin bright line at top.
          Dark mode: subtle white-on-dark (low opacity); light mode: more visible shimmer. */}
      {barWidth > 1 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 1,
            height: 1.5,
            width: `${barWidth}%`,
            background: isDark
              ? `linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.08) 70%, rgba(255,255,255,0.0) 100%)`
              : `linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 70%, rgba(255,255,255,0.0) 100%)`,
            zIndex: 2,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          right: layout.spacing.md,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: fontSizes.label,
          fontWeight: fontWeights.bold,
          color: theme.text.primary,
          fontFamily: fonts.mono,
          zIndex: 3,
          opacity: fadeIn(frame, startFrame + duration * 0.5, sec(0.3)),
          textShadow: shadows.textLift,
        }}
      >
        {Math.round(score)}%
      </div>
    </div>
  );
});

// ── FrameworkPanel component (left or right side) ─────────────────────
export const FrameworkPanel: React.FC<{
  side: "left" | "right";
  data: Framework;
  frame: number;
  startFrame: number;
  theme: ThemeTokens;
  isDimmed: boolean;
  isDark: boolean;
  /** Zone style from useTemplateLayout — no manual positioning needed */
  zoneStyle: React.CSSProperties;
  /** Visual card style. Default "inset". */
  cardStyle?: "inset" | "editorial" | "magazine";
}> = React.memo(({ side, data, frame, startFrame, theme, isDimmed, isDark, zoneStyle, cardStyle = "inset" }) => {
  const isLeft = side === "left";
  const alignText: "left" | "right" = isLeft ? "left" : "right";

  const nameDelay = startFrame;
  const tenetBaseDelay = startFrame + sec(0.3);

  const contentOpacity = isDimmed ? 0.3 : 1;

  return (
    <div
      style={{
        ...zoneStyle,
        opacity: contentOpacity,
      }}
    >
      {/* Framework name */}
      <h3
        style={{
          fontSize: fontSizes.h2,
          fontWeight: fontWeights.bold,
          letterSpacing: letterSpacing.h2,
          color: data.color,
          textAlign: alignText,
          margin: 0,
          marginBottom: layout.spacing.md,
          maxWidth: textMaxWidth.h2,
          fontFamily: getFontFamily(data.name),
          lineHeight: lineHeight.h2,
          textShadow: shadows.textLift,
          opacity: fadeIn(frame, nameDelay, sec(0.4)),
          transform: `translateY(${slideIn(frame, nameDelay, 20, sec(0.4))}px)`,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {data.name}
      </h3>

      {/* Tenets (staggered list) */}
      <div style={{ display: "flex", flexDirection: "column", gap: cardStyle === "editorial" ? 0 : layout.spacing.sm }}>
        {data.tenets.map((tenet, idx) => {
          const tenetStart = stagger(idx, sec(0.12), tenetBaseDelay);
          const tenetOpacity = fadeIn(frame, tenetStart, sec(0.4));
          const tenetSlide = slideIn(frame, tenetStart, 16, sec(0.4));

          if (cardStyle === "editorial") {
            // Editorial variant: hairline top rule + ordinal chip, no card box
            return (
              <div
                key={idx}
                style={{
                  borderTop: idx === 0 ? `1px solid ${data.color}30` : `1px solid rgba(0,0,0,0.10)`,
                  padding: "10px 0 10px 0",
                  opacity: tenetOpacity,
                  transform: isLeft
                    ? `translateX(${tenetSlide}px)`
                    : `translateX(${-tenetSlide}px)`,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                  flexDirection: isLeft ? "row" : "row-reverse",
                }}
              >
                {/* Ordinal chip */}
                <span style={{
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  fontWeight: 600,
                  color: data.color,
                  opacity: 0.7,
                  minWidth: 20,
                  letterSpacing: "0.04em",
                  flexShrink: 0,
                }}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                {/* Tenet text */}
                <span style={{
                  fontFamily: fonts.body,
                  fontSize: fontSizes.body,
                  color: isDark ? "rgba(255,255,255,0.85)" : "rgba(28,24,20,0.85)",
                  lineHeight: 1.4,
                  textAlign: isLeft ? "left" : "right",
                }}>
                  {tenet.text}
                </span>
              </div>
            );
          }

          if (cardStyle === "magazine") {
            // Magazine variant: accent left/right sidebar bar, transparent background, no box shadow
            return (
              <div
                key={idx}
                style={{
                  borderLeft: isLeft ? `3px solid ${data.color}` : "none",
                  borderRight: !isLeft ? `3px solid ${data.color}` : "none",
                  paddingLeft: isLeft ? 12 : 0,
                  paddingRight: !isLeft ? 12 : 0,
                  paddingTop: 10,
                  paddingBottom: 10,
                  backgroundColor: "transparent",
                  opacity: tenetOpacity,
                  transform: isLeft
                    ? `translateX(${tenetSlide}px)`
                    : `translateX(${-tenetSlide}px)`,
                  marginBottom: 8,
                }}
              >
                <span style={{
                  fontFamily: fonts.body,
                  fontSize: fontSizes.body,
                  color: isDark ? "rgba(255,255,255,0.85)" : "rgba(28,24,20,0.85)",
                  lineHeight: 1.4,
                  textAlign: isLeft ? "left" : "right",
                  display: "block",
                }}>
                  {tenet.text}
                </span>
              </div>
            );
          }

          // Default "inset" — inset card rendering
          // Bilingual: when textCn is provided, render Chinese as primary (h3-ish)
          // and English at 60% size, muted, beneath. Otherwise single-line.
          const hasBilingual = !!tenet.textCn;
          return (
            <div
              key={idx}
              style={{
                ...cardPresets.inset(isDark),
                opacity: tenetOpacity,
                transform: isLeft
                  ? `translateX(${tenetSlide}px)`
                  : `translateX(${-tenetSlide}px)`,
                overflow: "hidden",
              }}
            >
              {hasBilingual ? (
                <>
                  <div
                    style={{
                      fontSize: fontSizes.body,
                      maxWidth: textMaxWidth.body,
                      fontWeight: fontWeights.medium,
                      color: theme.text.primary,
                      fontFamily: fonts.chinese,
                      lineHeight: lineHeight.body,
                      textAlign: alignText,
                      textShadow: shadows.textLift,
                    }}
                  >
                    {tenet.textCn}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: Math.round(fontSizes.body * 0.6),
                      maxWidth: textMaxWidth.body,
                      fontWeight: fontWeights.regular,
                      color: theme.text.muted,
                      fontFamily: fonts.body,
                      lineHeight: lineHeight.body,
                      textAlign: alignText,
                      textShadow: shadows.textLift,
                      opacity: 0.85,
                    }}
                  >
                    {tenet.text}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    fontSize: fontSizes.body,
                    maxWidth: textMaxWidth.body,
                    fontWeight: fontWeights.regular,
                    color: theme.text.secondary,
                    fontFamily: getBodyFont(tenet.text),
                    lineHeight: lineHeight.body,
                    textAlign: alignText,
                    textShadow: shadows.textLift,
                  }}
                >
                  {tenet.text}
                </div>
              )}
            </div>
          );
        })}
        {/* Closing hairline rule for editorial variant */}
        {cardStyle === "editorial" && (
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.10)", marginTop: 0 }} />
        )}
      </div>
    </div>
  );
});

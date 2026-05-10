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
}> = React.memo(({ score, color, frame, startFrame, duration, theme }) => {
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
      {/* Specular highlight — thin bright line at top */}
      {barWidth > 1 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 1,
            height: 1.5,
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0.5) 70%, transparent 100%)`,
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
}> = React.memo(({ side, data, frame, startFrame, theme, isDimmed, isDark, zoneStyle }) => {
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

      {/* Tenets (staggered list with inset cards) */}
      <div style={{ display: "flex", flexDirection: "column", gap: layout.spacing.sm }}>
        {data.tenets.map((tenet, idx) => {
          const tenetStart = stagger(idx, sec(0.12), tenetBaseDelay);
          const tenetOpacity = fadeIn(frame, tenetStart, sec(0.4));
          const tenetSlide = slideIn(frame, tenetStart, 16, sec(0.4));

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
      </div>
    </div>
  );
});

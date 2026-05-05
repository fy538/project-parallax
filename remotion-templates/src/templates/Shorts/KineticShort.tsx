/**
 * KineticShort — vertical 9:16 kinetic typography for Shorts.
 *
 * Uses ShortsWrapper + useVerticalLayout for systematic vertical
 * adaptation. Supports quote, statistic, definition, and bilingual
 * variants. Same data schema as landscape KineticTypography.
 *
 * Series: "Framework in 45 Seconds", "History Rhymes"
 */

import React from "react";
import { interpolate } from "remotion";
import {
  palette,
  fonts,
  fontWeights,
  letterSpacing,
} from "../../design/theme";
import { fadeIn, slideIn, CLAMP, CLAMP_CUBIC } from "../../utils/animation";
import { ShortsWrapper } from "../../components/ShortsWrapper";
import type { QuoteData } from "../KineticTypography/types";

// ── Quote variant ────────────────────────────────────────────────────────

const QuoteContent: React.FC<{
  data: QuoteData;
  frame: number;
  exit: number;
  vl: any;
  theme: any;
}> = ({ data, frame, exit, vl, theme }) => {
  const accent = data.accentColor || palette.amber;

  return (
    <>
      {/* Opening quote mark — Georgia serif with brand glow */}
      <div
        style={{
          fontSize: 140,
          fontFamily: "Georgia, serif",
          color: accent,
          opacity: fadeIn(frame, 0, 8) * exit,
          lineHeight: 0.6,
          marginBottom: 24,
          textShadow: `0 0 30px ${accent}50, 0 0 12px ${accent}40`,
        }}
      >
        &ldquo;
      </div>

      {/* Quote text — word by word reveal */}
      <div
        style={{
          fontSize: 42,
          fontFamily: fonts.display,
          fontWeight: fontWeights.bold,
          color: theme.text.primary,
          lineHeight: 1.4,
          maxWidth: vl.textMaxWidth.body,
          textShadow: theme.textShadow,
        }}
      >
        {(data.text || "").split(" ").map((word, i) => {
          const wordStart = 6 + i * 3;
          const opacity = fadeIn(frame, wordStart, 4) * exit;
          const y = interpolate(
            frame,
            [wordStart, wordStart + 4],
            [12, 0],
            CLAMP_CUBIC
          );
          return (
            <span
              key={i}
              style={{
                opacity,
                transform: `translateY(${y}px)`,
                display: "inline-block",
                marginRight: "0.3em",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Attribution */}
      {data.attribution && (
        <div
          style={{
            marginTop: vl.spacing.xxl,
            opacity: fadeIn(frame, 30, 10) * exit,
            transform: `translateY(${slideIn(frame, 30, 15, 10)}px)`,
          }}
        >
          <div
            style={{
              width: 60,
              height: 2,
              background: accent,
              margin: "0 auto 16px",
            }}
          />
          <div
            style={{
              fontSize: vl.fontSizes.body,
              fontFamily: fonts.body,
              color: theme.text.secondary,
              letterSpacing: letterSpacing.label,
              textShadow: theme.textShadow,
            }}
          >
            — {data.attribution}
          </div>
          {data.attributionContext && (
            <div
              style={{
                fontSize: vl.fontSizes.label,
                fontFamily: fonts.body,
                color: theme.text.muted,
                marginTop: vl.spacing.sm,
                textShadow: theme.textShadow,
              }}
            >
              {data.attributionContext}
            </div>
          )}
        </div>
      )}
    </>
  );
};

// ── Statistic variant ────────────────────────────────────────────────────

const StatisticContent: React.FC<{
  data: QuoteData;
  frame: number;
  exit: number;
  vl: any;
  theme: any;
}> = ({ data, frame, exit, vl, theme }) => {
  const accent = data.accentColor || palette.amber;
  const raw = data.statValue || "0";
  const numericMatch = raw.match(/^([\d.]+)(.*)/);
  const targetNum = numericMatch ? parseFloat(numericMatch[1]) : 0;
  const suffix = numericMatch ? numericMatch[2] : raw;

  const countProgress = interpolate(frame, [8, 35], [0, 1], CLAMP_CUBIC);
  const displayNum =
    targetNum % 1 === 0
      ? Math.round(targetNum * countProgress)
      : (targetNum * countProgress).toFixed(1);

  return (
    <>
      <div
        style={{
          opacity: fadeIn(frame, 5, 8) * exit,
          transform: `scale(${interpolate(frame, [5, 15], [0.8, 1], CLAMP_CUBIC)})`,
        }}
      >
        <span
          style={{
            fontSize: 160,
            fontFamily: fonts.data,
            fontWeight: fontWeights.bold,
            color: accent,
            lineHeight: 1,
            textShadow: theme.textShadow,
          }}
        >
          {displayNum}
        </span>
        <span
          style={{
            fontSize: 72,
            fontFamily: fonts.data,
            fontWeight: fontWeights.bold,
            color: accent,
          }}
        >
          {suffix}
        </span>
      </div>

      {data.statLabel && (
        <div
          style={{
            fontSize: vl.fontSizes.h2,
            fontFamily: fonts.display,
            fontWeight: fontWeights.medium,
            color: theme.text.primary,
            marginTop: vl.spacing.xl,
            opacity: fadeIn(frame, 20, 8) * exit,
            maxWidth: vl.textMaxWidth.body,
            lineHeight: 1.3,
            textShadow: theme.textShadow,
          }}
        >
          {data.statLabel}
        </div>
      )}

      {data.statContext && (
        <div
          style={{
            fontSize: vl.fontSizes.body,
            fontFamily: fonts.body,
            color: theme.text.secondary,
            marginTop: vl.spacing.lg,
            opacity: fadeIn(frame, 30, 8) * exit,
            maxWidth: vl.textMaxWidth.body,
            textShadow: theme.textShadow,
          }}
        >
          {data.statContext}
        </div>
      )}
    </>
  );
};

// ── Definition variant ───────────────────────────────────────────────────

const DefinitionContent: React.FC<{
  data: QuoteData;
  frame: number;
  exit: number;
  vl: any;
  theme: any;
}> = ({ data, frame, exit, vl, theme }) => {
  const accent = data.accentColor || palette.amber;

  return (
    <>
      {data.term && (
        <div
          style={{
            fontSize: 120,
            fontFamily: fonts.chinese,
            fontWeight: fontWeights.bold,
            color: theme.text.primary,
            letterSpacing: 8,
            textShadow: theme.textShadow,
          }}
        >
          {data.term.split("").map((char, i) => (
            <span
              key={i}
              style={{
                opacity: fadeIn(frame, i * 5, 6) * exit,
                display: "inline-block",
              }}
            >
              {char}
            </span>
          ))}
        </div>
      )}

      {data.termPinyin && (
        <div
          style={{
            fontSize: vl.fontSizes.body,
            fontFamily: fonts.body,
            color: theme.text.muted,
            marginTop: vl.spacing.md,
            opacity: fadeIn(frame, 15, 8) * exit,
            letterSpacing: 2,
            textShadow: theme.textShadow,
          }}
        >
          {data.termPinyin}
        </div>
      )}

      <div
        style={{
          width: 80,
          height: 2,
          backgroundColor: accent,
          margin: `${vl.spacing.xl}px auto`,
          opacity: fadeIn(frame, 20, 6) * exit,
          transform: `scaleX(${interpolate(frame, [20, 28], [0, 1], CLAMP)})`,
        }}
      />

      {data.termTranslation && (
        <div
          style={{
            fontSize: vl.fontSizes.h2,
            fontFamily: fonts.display,
            fontWeight: fontWeights.semibold,
            color: accent,
            opacity: fadeIn(frame, 25, 8) * exit,
            letterSpacing: letterSpacing.h3,
            textShadow: theme.textShadow,
          }}
        >
          {data.termTranslation}
        </div>
      )}

      {data.definitionText && (
        <div
          style={{
            fontSize: vl.fontSizes.body,
            fontFamily: fonts.body,
            color: theme.text.secondary,
            marginTop: vl.spacing.lg,
            opacity: fadeIn(frame, 35, 8) * exit,
            maxWidth: vl.textMaxWidth.body,
            lineHeight: 1.5,
            textShadow: theme.textShadow,
          }}
        >
          {data.definitionText}
        </div>
      )}
    </>
  );
};

// ── Main component ───────────────────────────────────────────────────────

export const KineticShort: React.FC<{ data: QuoteData }> = ({ data }) => {
  return (
    <ShortsWrapper mode={data.backgroundVariant}>
      {(vl, theme, frame, exit) => (
        <div
          style={{
            position: "absolute",
            top: vl.contentTop,
            left: vl.safeArea.left,
            right: vl.safeArea.right,
            bottom: vl.safeArea.bottom,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {(data.variant === "quote") && (
            <QuoteContent data={data} frame={frame} exit={exit} vl={vl} theme={theme} />
          )}
          {(data.variant === "statistic") && (
            <StatisticContent data={data} frame={frame} exit={exit} vl={vl} theme={theme} />
          )}
          {(data.variant === "definition" || data.variant === "bilingual") && (
            <DefinitionContent data={data} frame={frame} exit={exit} vl={vl} theme={theme} />
          )}
        </div>
      )}
    </ShortsWrapper>
  );
};

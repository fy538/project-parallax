/**
 * KineticShort — vertical 9:16 kinetic typography for Shorts.
 *
 * Optimized for "Framework in 45 Seconds" and "History Rhymes" series.
 * Same data schema as KineticTypography but with:
 *   - Larger text for mobile readability
 *   - Faster animations (Shorts pace)
 *   - Centered vertical layout
 *   - No MetadataStrip (too small for mobile)
 *
 * Usage: Feed the same JSON as landscape KineticTypography.
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
  durations,
  light,
} from "../../design/theme";
import { fadeIn, slideIn, CLAMP, CLAMP_CUBIC } from "../../utils/animation";
import { Background } from "../../components/Background";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { QuoteData } from "../KineticTypography/types";
import { shortsLayout } from "./types";

// ── Quote variant (vertical) ──────────────────────────────────────────────

const QuoteVertical: React.FC<{ data: QuoteData; frame: number }> = ({
  data,
  frame,
}) => {
  const accent = data.accentColor || palette.amber;

  return (
    <div
      style={{
        position: "absolute",
        top: shortsLayout.safeArea.top,
        left: shortsLayout.safeArea.left,
        right: shortsLayout.safeArea.right,
        bottom: shortsLayout.safeArea.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Opening quote mark */}
      <div
        style={{
          fontSize: 120,
          fontFamily: fonts.display,
          color: accent,
          opacity: fadeIn(frame, 0, 8),
          lineHeight: 0.6,
          marginBottom: 24,
        }}
      >
        "
      </div>

      {/* Quote text — word by word reveal */}
      <div
        style={{
          fontSize: 42,
          fontFamily: fonts.display,
          fontWeight: fontWeights.bold,
          color: light.text.primary,
          lineHeight: 1.4,
          maxWidth: 900,
        }}
      >
        {(data.text || "").split(" ").map((word, i) => {
          const wordStart = 6 + i * 3; // Faster pace for Shorts
          const opacity = fadeIn(frame, wordStart, 4);
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
            marginTop: 48,
            opacity: fadeIn(frame, 30, 10),
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
              fontSize: 24,
              fontFamily: fonts.body,
              color: light.text.secondary,
              letterSpacing: letterSpacing.label,
            }}
          >
            — {data.attribution}
          </div>
          {data.attributionContext && (
            <div
              style={{
                fontSize: 18,
                fontFamily: fonts.body,
                color: light.text.muted,
                marginTop: 8,
              }}
            >
              {data.attributionContext}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Statistic variant (vertical) ──────────────────────────────────────────

const StatisticVertical: React.FC<{ data: QuoteData; frame: number }> = ({
  data,
  frame,
}) => {
  const accent = data.accentColor || palette.amber;
  const raw = data.statValue || "0";
  const numericMatch = raw.match(/^([\d.]+)(.*)/);
  const targetNum = numericMatch ? parseFloat(numericMatch[1]) : 0;
  const suffix = numericMatch ? numericMatch[2] : raw;

  // Count-up animation
  const countProgress = interpolate(frame, [8, 35], [0, 1], CLAMP_CUBIC);
  const displayNum =
    targetNum % 1 === 0
      ? Math.round(targetNum * countProgress)
      : (targetNum * countProgress).toFixed(1);

  return (
    <div
      style={{
        position: "absolute",
        top: shortsLayout.safeArea.top,
        left: shortsLayout.safeArea.left,
        right: shortsLayout.safeArea.right,
        bottom: shortsLayout.safeArea.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Big number */}
      <div
        style={{
          opacity: fadeIn(frame, 5, 8),
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

      {/* Label */}
      {data.statLabel && (
        <div
          style={{
            fontSize: 32,
            fontFamily: fonts.display,
            fontWeight: fontWeights.medium,
            color: light.text.primary,
            marginTop: 32,
            opacity: fadeIn(frame, 20, 8),
            maxWidth: 800,
            lineHeight: 1.3,
          }}
        >
          {data.statLabel}
        </div>
      )}

      {/* Context */}
      {data.statContext && (
        <div
          style={{
            fontSize: 22,
            fontFamily: fonts.body,
            color: light.text.secondary,
            marginTop: 24,
            opacity: fadeIn(frame, 30, 8),
            maxWidth: 700,
          }}
        >
          {data.statContext}
        </div>
      )}
    </div>
  );
};

// ── Definition variant (vertical) ─────────���───────────────────────────────

const DefinitionVertical: React.FC<{ data: QuoteData; frame: number }> = ({
  data,
  frame,
}) => {
  const accent = data.accentColor || palette.amber;

  return (
    <div
      style={{
        position: "absolute",
        top: shortsLayout.safeArea.top,
        left: shortsLayout.safeArea.left,
        right: shortsLayout.safeArea.right,
        bottom: shortsLayout.safeArea.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Chinese term — large */}
      {data.term && (
        <div
          style={{
            fontSize: 120,
            fontFamily: fonts.chinese,
            fontWeight: fontWeights.bold,
            color: light.text.primary,
            opacity: fadeIn(frame, 0, 10),
            letterSpacing: 8,
          }}
        >
          {data.term.split("").map((char, i) => {
            const charStart = i * 5;
            return (
              <span
                key={i}
                style={{
                  opacity: fadeIn(frame, charStart, 6),
                  display: "inline-block",
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
      )}

      {/* Pinyin */}
      {data.termPinyin && (
        <div
          style={{
            fontSize: 28,
            fontFamily: fonts.body,
            color: light.text.muted,
            marginTop: 16,
            opacity: fadeIn(frame, 15, 8),
            letterSpacing: 2,
          }}
        >
          {data.termPinyin}
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          width: 80,
          height: 2,
          backgroundColor: accent,
          margin: "32px auto",
          opacity: fadeIn(frame, 20, 6),
          transform: `scaleX(${interpolate(frame, [20, 28], [0, 1], CLAMP)})`,
        }}
      />

      {/* Translation */}
      {data.termTranslation && (
        <div
          style={{
            fontSize: 36,
            fontFamily: fonts.display,
            fontWeight: fontWeights.semibold,
            color: accent,
            opacity: fadeIn(frame, 25, 8),
            letterSpacing: letterSpacing.h3,
          }}
        >
          {data.termTranslation}
        </div>
      )}

      {/* Definition */}
      {data.definitionText && (
        <div
          style={{
            fontSize: 24,
            fontFamily: fonts.body,
            color: light.text.secondary,
            marginTop: 24,
            opacity: fadeIn(frame, 35, 8),
            maxWidth: 800,
            lineHeight: 1.5,
          }}
        >
          {data.definitionText}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────

export const KineticShort: React.FC<{ data: QuoteData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });

  const bgVariant = data.backgroundVariant || "light";

  return (
    <Background variant={bgVariant}>
      <AbsoluteFill style={compStyle}>
        {data.variant === "quote" && (
          <QuoteVertical data={data} frame={frame} />
        )}
        {data.variant === "statistic" && (
          <StatisticVertical data={data} frame={frame} />
        )}
        {data.variant === "definition" && (
          <DefinitionVertical data={data} frame={frame} />
        )}
        {data.variant === "bilingual" && (
          <DefinitionVertical data={data} frame={frame} />
        )}
      </AbsoluteFill>
    </Background>
  );
};

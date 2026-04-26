/**
 * KineticTypography — animated quotes, definitions, bilingual text, and statistics.
 *
 * Four variants:
 * - "quote": Big text with attribution, word-by-word reveal
 * - "definition": Term + pinyin + translation + definition
 * - "bilingual": Chinese text above, English below
 * - "statistic": Large number with label and context
 *
 * EP01 use cases: Morris Chang quote, 卡脖子 definition, key statistics.
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { palette, dark, semantic, fonts, fontSizes, layout, sec } from "../../design/theme";
import { fadeIn, slideIn } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { Background } from "../../components/Background";
import { AnimatedText } from "../../components/AnimatedText";
import type { QuoteData } from "./types";

// ── Quote variant ──────────────────────────────────────────────────────────

const QuoteVariant: React.FC<{ data: QuoteData; frame: number }> = ({
  data,
  frame,
}) => {
  const accentColor = data.accentColor || palette.amber;

  return (
    <div
      style={{
        position: "absolute",
        top: layout.safeArea.top,
        left: layout.safeArea.left + 60,
        right: layout.safeArea.right + 60,
        bottom: layout.safeArea.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Opening quote mark */}
      <div
        style={{
          fontSize: 160,
          color: accentColor,
          opacity: fadeIn(frame, 0, sec(0.3)),
          fontFamily: "Georgia, serif",
          lineHeight: 0.6,
          marginBottom: 20,
        }}
      >
        &ldquo;
      </div>

      {/* Quote text — word-by-word reveal */}
      <AnimatedText
        text={data.text || ""}
        startFrame={sec(0.3)}
        framesPerUnit={3}
        mode="word"
        fontSize={fontSizes.h1}
        fontFamily={fonts.heading}
        color={dark.text.primary}
        fontWeight={500}
        style={{ lineHeight: 1.4, maxWidth: 1400 }}
      />

      {/* Attribution */}
      {data.attribution && (
        <div
          style={{
            marginTop: 48,
            opacity: fadeIn(frame, sec(2.5), sec(0.5)),
            transform: `translateY(${slideIn(frame, sec(2.5), 16, sec(0.5))}px)`,
          }}
        >
          <div
            style={{
              fontSize: fontSizes.h3,
              color: accentColor,
              fontWeight: 500,
            }}
          >
            — {data.attribution}
          </div>
          {data.attributionContext && (
            <div
              style={{
                fontSize: fontSizes.body,
                color: dark.text.muted,
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

// ── Definition variant ─────────────────────────────────────────────────────

const DefinitionVariant: React.FC<{ data: QuoteData; frame: number }> = ({
  data,
  frame,
}) => {
  const accentColor = data.accentColor || semantic.highlight;

  return (
    <div
      style={{
        position: "absolute",
        top: layout.safeArea.top,
        left: layout.safeArea.left + 60,
        right: layout.safeArea.right + 60,
        bottom: layout.safeArea.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Term — large, character-by-character */}
      <AnimatedText
        text={data.term || ""}
        startFrame={sec(0.2)}
        framesPerUnit={6}
        mode="character"
        fontSize={120}
        fontFamily={fonts.chinese}
        color={dark.text.primary}
        fontWeight={700}
      />

      {/* Pinyin */}
      {data.termPinyin && (
        <div
          style={{
            fontSize: fontSizes.h3,
            color: dark.text.muted,
            fontFamily: fonts.mono,
            marginTop: 12,
            opacity: fadeIn(frame, sec(1), sec(0.4)),
          }}
        >
          {data.termPinyin}
        </div>
      )}

      {/* Translation */}
      {data.termTranslation && (
        <div
          style={{
            fontSize: fontSizes.h2,
            color: accentColor,
            fontWeight: 600,
            marginTop: 20,
            opacity: fadeIn(frame, sec(1.5), sec(0.5)),
            transform: `translateY(${slideIn(frame, sec(1.5), 16, sec(0.5))}px)`,
          }}
        >
          {data.termTranslation}
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          width: interpolate(
            frame,
            [sec(2), sec(2.5)],
            [0, 200],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
          height: 2,
          backgroundColor: accentColor,
          marginTop: 32,
          marginBottom: 32,
        }}
      />

      {/* Definition text */}
      {data.definitionText && (
        <div
          style={{
            fontSize: fontSizes.body,
            color: dark.text.primary,
            lineHeight: 1.6,
            maxWidth: 1100,
            opacity: fadeIn(frame, sec(2.5), sec(0.5)),
            transform: `translateY(${slideIn(frame, sec(2.5), 20, sec(0.5))}px)`,
          }}
        >
          {data.definitionText}
        </div>
      )}
    </div>
  );
};

// ── Bilingual variant ──────────────────────────────────────────────────────

const BilingualVariant: React.FC<{ data: QuoteData; frame: number }> = ({
  data,
  frame,
}) => {
  const accentColor = data.accentColor || palette.amber;

  return (
    <div
      style={{
        position: "absolute",
        top: layout.safeArea.top,
        left: layout.safeArea.left + 60,
        right: layout.safeArea.right + 60,
        bottom: layout.safeArea.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 40,
      }}
    >
      {/* Chinese text */}
      {data.chineseText && (
        <AnimatedText
          text={data.chineseText}
          startFrame={sec(0.3)}
          framesPerUnit={5}
          mode="character"
          fontSize={fontSizes.h1}
          fontFamily={fonts.chinese}
          color={dark.text.primary}
          fontWeight={600}
          style={{ lineHeight: 1.5 }}
        />
      )}

      {/* Divider */}
      <div
        style={{
          width: interpolate(
            frame,
            [sec(1.5), sec(2)],
            [0, 120],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
          height: 2,
          backgroundColor: accentColor,
        }}
      />

      {/* English text */}
      {data.englishText && (
        <AnimatedText
          text={data.englishText}
          startFrame={sec(2)}
          framesPerUnit={3}
          mode="word"
          fontSize={fontSizes.h2}
          fontFamily={fonts.heading}
          color={dark.text.muted}
          fontWeight={400}
          style={{ lineHeight: 1.5 }}
        />
      )}
    </div>
  );
};

// ── Statistic variant ──────────────────────────────────────────────────────

const StatisticVariant: React.FC<{ data: QuoteData; frame: number }> = ({
  data,
  frame,
}) => {
  const accentColor = data.accentColor || palette.amber;

  // Animate the number if it starts with digits
  const rawValue = data.statValue || "0";
  const numericMatch = rawValue.match(/^([\d.]+)(.*)$/);
  let displayValue = rawValue;

  if (numericMatch) {
    const targetNum = parseFloat(numericMatch[1]);
    const suffix = numericMatch[2]; // e.g., "%", "B", "nm"
    const countProgress = interpolate(
      frame,
      [sec(0.5), sec(1.8)],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      }
    );
    const currentNum =
      targetNum % 1 === 0
        ? Math.round(targetNum * countProgress)
        : (targetNum * countProgress).toFixed(1);
    displayValue = `${currentNum}${suffix}`;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: layout.safeArea.top,
        left: layout.safeArea.left + 60,
        right: layout.safeArea.right + 60,
        bottom: layout.safeArea.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Big number */}
      <div
        style={{
          fontSize: 180,
          fontWeight: 700,
          color: accentColor,
          fontFamily: fonts.mono,
          opacity: fadeIn(frame, sec(0.3), sec(0.4)),
          lineHeight: 1,
        }}
      >
        {displayValue}
      </div>

      {/* Label */}
      {data.statLabel && (
        <div
          style={{
            fontSize: fontSizes.h2,
            color: dark.text.primary,
            fontWeight: 500,
            marginTop: 24,
            opacity: fadeIn(frame, sec(1.5), sec(0.5)),
            transform: `translateY(${slideIn(frame, sec(1.5), 16, sec(0.5))}px)`,
          }}
        >
          {data.statLabel}
        </div>
      )}

      {/* Context */}
      {data.statContext && (
        <div
          style={{
            fontSize: fontSizes.body,
            color: dark.text.muted,
            marginTop: 16,
            opacity: fadeIn(frame, sec(2.2), sec(0.5)),
          }}
        >
          {data.statContext}
        </div>
      )}
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

export const KineticTypography: React.FC<{ data: QuoteData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation();
  const bgVariant = data.backgroundVariant || "dark";

  return (
    <Background variant={bgVariant}>
      <AbsoluteFill style={compStyle}>
        {data.variant === "quote" && <QuoteVariant data={data} frame={frame} />}
        {data.variant === "definition" && (
          <DefinitionVariant data={data} frame={frame} />
        )}
        {data.variant === "bilingual" && (
          <BilingualVariant data={data} frame={frame} />
        )}
        {data.variant === "statistic" && (
          <StatisticVariant data={data} frame={frame} />
        )}

        {/* Episode label */}
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom,
            left: layout.safeArea.left,
            fontSize: fontSizes.label,
            color: dark.text.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: fadeIn(frame, 0, sec(1)),
          }}
        >
          {data.episode}
        </div>
      </AbsoluteFill>
    </Background>
  );
};

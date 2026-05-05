/**
 * KineticTypography — animated quotes, definitions, bilingual text, and statistics.
 *
 * Cinematic overhaul v2:
 * - Parallax depth layers: elements drift at different rates (quote mark 1.5×, text 1.0×, attribution 0.6×)
 * - Eased Chinese character stagger (logarithmic fast→slow)
 * - Dividers: scaleX from center with ease-out
 * - Count-up overshoot on statistics (102%→100% settle)
 * - Smooth bloom envelope (no hard seam)
 * - No naked fades — all elements get slideIn
 * - Stat numbers use Space Grotesk (warmer editorial feel)
 *
 * Four variants: quote, definition, bilingual, statistic
 * silicon-trap use cases: Morris Chang quote, 卡脖子 definition, key statistics.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { palette, semantic, fonts, fontSizes, layout, sec, shadows } from "../../design/theme";
import { fadeIn, slideIn, heroSpring, pulse, exitFade, kenBurnsDrift, scaleReveal, CLAMP, CLAMP_QUAD, CLAMP_CUBIC } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { Background } from "../../components/Background";
import { AnimatedText } from "../../components/AnimatedText";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import type { QuoteData } from "./types";

// ── Smooth bloom: single 3-point curve ────────────────────────────────────

const smoothBloom = (
  frame: number,
  startFrame: number,
  riseDuration: number,
  sustainLevel: number = 0.5,
): number => {
  const peakFrame = startFrame + riseDuration;
  const settleFrame = peakFrame + riseDuration * 2;
  return interpolate(
    frame,
    [startFrame, peakFrame, settleFrame],
    [0, 1, sustainLevel],
    CLAMP
  );
};

// ── Parallax drift: differential Ken Burns per layer ──────────────────────
// Rate multiplier controls how fast each layer drifts.
// >1 = foreground (moves more), <1 = background (moves less).

const parallaxDrift = (
  frame: number,
  totalFrames: number,
  rateMultiplier: number = 1.0,
  maxScale: number = 1.02,
): number => {
  const drift = kenBurnsDrift(frame, totalFrames, maxScale);
  // Scale the drift amount by the rate multiplier
  const baseAmount = drift - 1.0; // how much above 1.0
  return 1.0 + baseAmount * rateMultiplier;
};

// ── Divider scaleX from center ────────────────────────────────────────────

const dividerScale = (
  frame: number,
  startFrame: number,
  duration: number,
): number =>
  interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    CLAMP_QUAD
  );

// ── Quote variant ──────────────────────────────────────────────────────────

const QuoteVariant: React.FC<{ data: QuoteData; frame: number }> = ({
  data,
  frame,
}) => {
  const theme = useThemeMode(data.backgroundVariant || "light");
  const accentColor = data.accentColor || palette.amber;
  const totalFrames = sec(data.durationSec || 5);

  // Cinematic scale reveal for the quote mark
  const quoteMarkScale = scaleReveal(frame, 0, sec(0.6), 1.4, 1.0);
  const quoteMarkOpacity = fadeIn(frame, 0, sec(0.3));

  // Hero spring entrance for quote container
  const heroSpringValue = heroSpring(frame, sec(0.3), sec(0.8));
  // Driven by spring — no extra easing needed (easing: spring-driven)
  const heroTranslateY = interpolate(heroSpringValue, [0, 1], [60, 0]);

  // Exit fade in last 15 frames
  const exitOpacity = exitFade(frame, totalFrames, 15);

  // Smooth bloom behind quote mark
  const quoteBloom = smoothBloom(frame, 0, sec(0.2), 0.4);

  // ── Parallax depth layers (memoized to avoid recalculation) ──
  const { quoteMarkDrift, textDrift, attributionDrift } = useMemo(() => ({
    quoteMarkDrift: parallaxDrift(frame, totalFrames, 1.5),   // foreground — moves more
    textDrift: parallaxDrift(frame, totalFrames, 1.0),        // mid-ground
    attributionDrift: parallaxDrift(frame, totalFrames, 0.6), // background — moves less
  }), [frame, totalFrames]);

  return (
    <div
      style={{
        position: "absolute",
        top: layout.safeAreaTier.generous.top,
        left: layout.safeAreaTier.generous.left + layout.spacing.xxl,
        right: layout.safeAreaTier.generous.right + layout.spacing.xxl,
        bottom: layout.safeAreaTier.generous.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        opacity: exitOpacity,
      }}
    >
      {/* Bloom behind quote mark — smooth envelope */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: layout.safeAreaTier.generous.left,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${accentColor}35 0%, transparent 70%)`,
          opacity: quoteBloom,
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Opening quote mark — parallax foreground layer (1.5× drift) */}
      <div
        style={{
          fontSize: 160,
          color: accentColor,
          opacity: quoteMarkOpacity,
          fontFamily: "Georgia, serif",
          lineHeight: 0.6,
          marginBottom: layout.spacing.md,
          transform: `scale(${quoteMarkScale * quoteMarkDrift})`,
          transformOrigin: "left center",
          textShadow: `0 0 40px ${accentColor}40`,
        }}
      >
        &ldquo;
      </div>

      {/* Quote text — mid-ground layer (1.0× drift) */}
      <div
        style={{
          transform: `translateY(${heroTranslateY}px) scale(${textDrift})`,
          transformOrigin: "left center",
        }}
      >
        <AnimatedText
          text={data.text || ""}
          startFrame={sec(0.3)}
          framesPerUnit={3}
          mode="word"
          fontSize={fontSizes.h1}
          fontFamily={fonts.heading}
          color={theme.text.primary}
          fontWeight={600}
          style={{
            lineHeight: 1.4,
            maxWidth: 1400,
            textShadow: shadows.textLift,
          }}
        />
      </div>

      {/* Attribution — background layer (0.6× drift) */}
      {data.attribution && (
        <div
          style={{
            marginTop: layout.spacing.xl,
            opacity: fadeIn(frame, sec(2.5), sec(0.5)),
            transform: `translateY(${slideIn(frame, sec(2.5), 30, sec(0.6))}px) scale(${attributionDrift})`,
            transformOrigin: "left center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              fontSize: fontSizes.h3,
              color: accentColor,
              fontWeight: 500,
              textShadow: `0 0 20px ${accentColor}30, 0 1px 3px rgba(0,0,0,0.5)`,
              position: "relative",
              paddingBottom: 4,
            }}
          >
            — {data.attribution}
            {/* Signature underline — draws in left-to-right after attribution settles */}
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                height: 1,
                width: "100%",
                background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}80 70%, transparent 100%)`,
                transform: `scaleX(${dividerScale(frame, sec(3.0), sec(0.7))})`,
                transformOrigin: "left center",
                opacity: 0.7,
              }}
            />
          </div>
          {data.attributionContext && (
            <div
              style={{
                fontSize: fontSizes.body,
                color: theme.text.muted,
                marginTop: layout.spacing.xs,
                opacity: fadeIn(frame, sec(2.8), sec(0.4)),
                transform: `translateY(${slideIn(frame, sec(2.8), 8, sec(0.4))}px)`,
                textShadow: shadows.textLift,
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
  const theme = useThemeMode(data.backgroundVariant || "light");
  const accentColor = data.accentColor || semantic.highlight;
  const totalFrames = sec(data.durationSec || 5.5);

  // Exit fade in last 15 frames
  const exitOpacity = exitFade(frame, totalFrames, 15);

  // ── Parallax depth layers (memoized to avoid recalculation) ──
  const { termDrift, supportDrift } = useMemo(() => ({
    termDrift: parallaxDrift(frame, totalFrames, 1.3),        // term is dominant
    supportDrift: parallaxDrift(frame, totalFrames, 0.7),     // supporting text recedes
  }), [frame, totalFrames]);

  return (
    <div
      style={{
        position: "absolute",
        top: layout.safeAreaTier.generous.top,
        left: layout.safeAreaTier.generous.left + layout.spacing.xxl,
        right: layout.safeAreaTier.generous.right + layout.spacing.xxl,
        bottom: layout.safeAreaTier.generous.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        opacity: exitOpacity,
      }}
    >
      {/* Term — large, character-by-character with eased stagger + parallax */}
      <div style={{ transform: `scale(${termDrift})`, transformOrigin: "left center" }}>
        <AnimatedText
          text={data.term || ""}
          startFrame={sec(0.2)}
          framesPerUnit={8}
          mode="character"
          fontSize={120}
          fontFamily={fonts.chinese}
          color={theme.text.primary}
          fontWeight={700}
          easedStagger
          style={{
            textShadow: shadows.textLift,
          }}
        />
      </div>

      {/* Pinyin — italic mono for phonetic differentiation */}
      {data.termPinyin && (
        <div
          style={{
            fontSize: fontSizes.h3,
            color: theme.text.muted,
            fontFamily: fonts.mono,
            fontStyle: "italic",
            marginTop: layout.spacing.sm,
            opacity: fadeIn(frame, sec(1), sec(0.4)),
            transform: `translateY(${slideIn(frame, sec(1), 8, sec(0.4))}px) scale(${supportDrift})`,
            transformOrigin: "left center",
            textShadow: shadows.textLift,
            letterSpacing: 1,
          }}
        >
          {data.termPinyin}
        </div>
      )}

      {/* Translation — slideIn + parallax */}
      {data.termTranslation && (
        <div
          style={{
            fontSize: fontSizes.h2,
            color: accentColor,
            fontWeight: 600,
            marginTop: layout.spacing.md,
            opacity: fadeIn(frame, sec(1.5), sec(0.5)),
            transform: `translateY(${slideIn(frame, sec(1.5), 16, sec(0.5))}px) scale(${supportDrift})`,
            transformOrigin: "left center",
            textShadow: shadows.textLift,
          }}
        >
          {data.termTranslation}
        </div>
      )}

      {/* Divider — scaleX from center (replaces linear width draw) */}
      <div
        style={{
          width: 200,
          height: 2,
          backgroundColor: accentColor,
          marginTop: layout.spacing.lg,
          marginBottom: layout.spacing.lg,
          transform: `scaleX(${dividerScale(frame, sec(2), sec(0.5))})`,
          transformOrigin: "left center",
          opacity: fadeIn(frame, sec(2), sec(0.3)),
        }}
      />

      {/* Definition text — slideIn + parallax background */}
      {data.definitionText && (
        <div
          style={{
            fontSize: fontSizes.body,
            color: theme.text.primary,
            lineHeight: 1.6,
            maxWidth: 1100,
            opacity: fadeIn(frame, sec(2.5), sec(0.5)),
            transform: `translateY(${slideIn(frame, sec(2.5), 20, sec(0.5))}px) scale(${supportDrift})`,
            transformOrigin: "left center",
            textShadow: shadows.textLift,
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
  const theme = useThemeMode(data.backgroundVariant || "light");
  const accentColor = data.accentColor || palette.amber;
  const totalFrames = sec(data.durationSec || 5.5);

  // Exit fade in last 15 frames
  const exitOpacity = exitFade(frame, totalFrames, 15);

  // ── Parallax depth layers (memoized to avoid recalculation) ──
  const { chineseDrift, englishDrift } = useMemo(() => ({
    chineseDrift: parallaxDrift(frame, totalFrames, 1.3),  // Chinese = primary, drifts more
    englishDrift: parallaxDrift(frame, totalFrames, 0.7),  // English = secondary, drifts less
  }), [frame, totalFrames]);

  return (
    <div
      style={{
        position: "absolute",
        top: layout.safeAreaTier.generous.top,
        left: layout.safeAreaTier.generous.left + layout.spacing.xxl,
        right: layout.safeAreaTier.generous.right + layout.spacing.xxl,
        bottom: layout.safeAreaTier.generous.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: layout.spacing.xl,
        opacity: exitOpacity,
      }}
    >
      {/* Chinese text — eased stagger + parallax foreground (7 frames/char for weight) */}
      {data.chineseText && (
        <div style={{ transform: `scale(${chineseDrift})`, transformOrigin: "left center" }}>
          <AnimatedText
            text={data.chineseText}
            startFrame={sec(0.3)}
            framesPerUnit={7}
            mode="character"
            fontSize={fontSizes.h1}
            fontFamily={fonts.chinese}
            color={theme.text.primary}
            fontWeight={600}
            easedStagger
            style={{
              lineHeight: 1.5,
              textShadow: shadows.textLift,
            }}
          />
        </div>
      )}

      {/* Divider — gradient-fade signature underline */}
      <div
        style={{
          width: 120,
          height: 2,
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}80 70%, transparent 100%)`,
          transform: `scaleX(${dividerScale(frame, sec(1.5), sec(0.5))})`,
          transformOrigin: "left center",
          opacity: fadeIn(frame, sec(1.5), sec(0.3)),
          boxShadow: `0 0 8px ${accentColor}40`,
        }}
      />

      {/* English text — parallax background layer */}
      {data.englishText && (
        <div style={{ transform: `scale(${englishDrift})`, transformOrigin: "left center" }}>
          <AnimatedText
            text={data.englishText}
            startFrame={sec(2) + sec(0.15)}
            framesPerUnit={3}
            mode="word"
            fontSize={fontSizes.h2}
            fontFamily={fonts.heading}
            color={theme.text.muted}
            fontWeight={400}
            style={{
              lineHeight: 1.5,
              textShadow: shadows.textLift,
            }}
          />
        </div>
      )}
    </div>
  );
};

// ── Statistic variant ──────────────────────────────────────────────────────

const StatisticVariant: React.FC<{ data: QuoteData; frame: number }> = ({
  data,
  frame,
}) => {
  const theme = useThemeMode(data.backgroundVariant || "light");
  const accentColor = data.accentColor || palette.amber;
  const totalFrames = sec(data.durationSec || 5);

  // Animate the number with overshoot-settle
  const rawValue = data.statValue || "0";
  const numericMatch = rawValue.match(/^([\d.]+)(.*)$/);
  let displayValue = rawValue;
  const countUpEndFrame = sec(1.8);
  const overshootAmount = 0.03; // 3% overshoot on the count itself

  if (numericMatch) {
    const targetNum = parseFloat(numericMatch[1]);
    const suffix = numericMatch[2]; // e.g., "%", "B", "nm"

    // Count-up with overshoot: 0 → 103% → 100%
    const countProgress = interpolate(
      frame,
      [sec(0.5), countUpEndFrame, countUpEndFrame + sec(0.3)],
      [0, 1 + overshootAmount, 1],
      CLAMP_CUBIC
    );

    const currentNum =
      targetNum % 1 === 0
        ? Math.round(targetNum * Math.min(countProgress, 1 + overshootAmount))
        : (targetNum * Math.min(countProgress, 1 + overshootAmount)).toFixed(1);
    displayValue = `${currentNum}${suffix}`;
  }

  // Cinematic scale reveal: number arrives at 130% and eases down
  const revealScale = scaleReveal(frame, sec(0.2), sec(0.8), 1.3, 1.0);
  // Micro-settle pulse after count-up — slightly stronger
  const pulseScale = pulse(frame, countUpEndFrame, 9, 1.04);
  // Smooth bloom behind the number
  const bloom = smoothBloom(frame, sec(0.3), sec(0.3), 0.5);

  // Chromatic-aberration kick — 1 frame of R/B channel split as count-up locks
  // Amplitude 1px max, peaks at countUpEndFrame, decays in 3 frames.
  const chromaticPx =
    frame >= countUpEndFrame && frame <= countUpEndFrame + 3
      ? 1.0 - (frame - countUpEndFrame) / 3
      : 0;

  // Exit fade in last 15 frames
  const exitOpacity = exitFade(frame, totalFrames, 15);

  return (
    <div
      style={{
        position: "absolute",
        top: layout.safeAreaTier.generous.top,
        left: layout.safeAreaTier.generous.left + layout.spacing.xxl,
        right: layout.safeAreaTier.generous.right + layout.spacing.xxl,
        bottom: layout.safeAreaTier.generous.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
      }}
    >
      {/* Light bloom — smooth radial glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 500,
          height: 300,
          transform: "translate(-50%, -60%)",
          background: `radial-gradient(ellipse at center, ${accentColor}30 0%, ${accentColor}18 40%, transparent 70%)`,
          opacity: bloom,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      {/* Big number — Space Grotesk + overshoot + bloom + chromatic-kick on lock-in */}
      <div
        style={{
          position: "relative",
          fontSize: 180,
          fontWeight: 700,
          color: accentColor,
          fontFamily: fonts.heading,
          opacity: fadeIn(frame, sec(0.2), sec(0.4)),
          lineHeight: 1,
          textShadow: `0 0 60px ${accentColor}60, 0 0 120px ${accentColor}20`,
          transform: `scale(${revealScale * pulseScale})`,
          transformOrigin: "center",
        }}
      >
        {/* Red ghost — offsets right during chromatic kick */}
        {chromaticPx > 0 && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              color: "#FF4040",
              transform: `translate(${chromaticPx}px, 0)`,
              opacity: 0.6,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          >
            {displayValue}
          </span>
        )}
        {/* Blue ghost — offsets left during chromatic kick */}
        {chromaticPx > 0 && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              color: "#40A0FF",
              transform: `translate(${-chromaticPx}px, 0)`,
              opacity: 0.6,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          >
            {displayValue}
          </span>
        )}
        {displayValue}
      </div>

      {/* Label — slideIn (was always there, keeping consistent) */}
      {data.statLabel && (
        <div
          style={{
            fontSize: fontSizes.h2,
            color: theme.text.primary,
            fontWeight: 500,
            marginTop: layout.spacing.md,
            opacity: fadeIn(frame, sec(1.5), sec(0.5)),
            transform: `translateY(${slideIn(frame, sec(1.5), 30, sec(0.6))}px)`,
            textShadow: shadows.textLift,
          }}
        >
          {data.statLabel}
        </div>
      )}

      {/* Context — slideIn */}
      {data.statContext && (
        <div
          style={{
            fontSize: fontSizes.body,
            color: theme.text.muted,
            marginTop: layout.spacing.sm,
            opacity: fadeIn(frame, sec(2.2), sec(0.5)),
            transform: `translateY(${slideIn(frame, sec(2.2), 16, sec(0.5))}px)`,
            textShadow: shadows.textLift,
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
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant || "light";
  const theme = useThemeMode(bgVariant);

  return (
    <Background
      variant={bgVariant}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* Brand strips — intelligence-briefing texture */}
        <HeaderStrip metadata={data.episode} mode={bgVariant} />
        <FooterStrip mode={bgVariant} hideRec={data.variant === "quote"} />

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

        {/* Episode label — slideIn (was naked fade) */}
        <div
          style={{
            position: "absolute",
            bottom: layout.safeAreaTier.generous.bottom,
            left: layout.safeAreaTier.generous.left,
            fontSize: fontSizes.label,
            color: theme.text.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: fadeIn(frame, 0, sec(1)),
            transform: `translateY(${slideIn(frame, 0, 10, sec(1))}px)`,
            textShadow: shadows.textLift,
          }}
        >
          {data.episode}
        </div>
      </AbsoluteFill>
    </Background>
  );
};

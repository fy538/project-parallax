/**
 * KineticTypography — animated quotes, definitions, bilingual text, and statistics.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * SCOPE GUARDRAIL — NOT FOR TITLE CARDS.
 *
 * This template is for IN-ESSAY EMPHASIS only: pull-quotes, definitions,
 * bilingual reveals, statistic moments. The animation register (letter-by-
 * letter or word-by-word kinetic reveal, count-up overshoot, parallax depth
 * drift) is intentionally energetic — appropriate inside the body of an
 * argument where the moment is a punctuation, not the opening contract.
 *
 * Title cards are TitleTransition.editorial-title: Kicker + Title + Dek,
 * fade-only entrance, 2.0s held in silence. Kinetic letter-by-letter title
 * reveals belong to Vox / Johnny Harris register, NOT Parallax. See:
 * references/template-research/title-card.md § 3 (failure mode: kinetic
 * letter-by-letter title).
 *
 * If you find yourself reaching for KineticTypography to open an episode,
 * use TitleTransition variant="editorial-title" instead.
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Cinematic overhaul v2:
 * - Parallax depth layers: elements drift at different rates (quote mark 1.5×, text 1.0×, attribution 0.6×)
 * - Eased Chinese character stagger (logarithmic fast→slow)
 * - Dividers: scaleX from center with ease-out
 * - Count-up overshoot on statistics (102%→100% settle)
 * - Smooth bloom envelope (no hard seam)
 * - No naked fades — all elements get slideIn
 * - Stat numbers use the display face (IBM Plex Sans per D40; was Space Grotesk pre-May 10, 2026)
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
import { palette, semantic, fonts, fontSizes, layout, sec, shadows, textMaxWidth } from "../../design/theme";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { fadeIn, slideIn, heroSpring, pulse, exitFade, kenBurnsDrift, scaleReveal, anticipatoryStartFrame, CLAMP, CLAMP_QUAD, CLAMP_CUBIC } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection, type DirectionSyncPoint } from "../../hooks/useDirection";
import { useBeatSync } from "../../hooks/useBeatSync";
import { useThemeMode } from "../../hooks/useThemeMode";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { AnimatedText } from "../../components/AnimatedText";
import {
  DefinitionReveal,
  QuoteAttribution,
  StatCaption,
} from "../../components/CompositePatterns";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { warnIf } from "../../utils/dataWarnings";
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
  // linear-ok: 3-point bloom envelope — linear rise/settle segments are intentional
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

const QuoteVariant: React.FC<{
  data: QuoteData;
  frame: number;
  syncPoints?: DirectionSyncPoint[];
}> = ({ data, frame, syncPoints }) => {
  const theme = useThemeMode(data.backgroundVariant || "light");
  const emphasis = useEpisodeColorEmphasis();
  const accentColor = data.accentColor || emphasis.primaryAccent;
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
          textShadow: `0 0 40px ${accentColor}40`, // shadows.accentGlow (40px large variant)
        }}
      >
        &ldquo;
      </div>

      {/* Quote text — mid-ground layer (1.0× drift) */}
      {/* Anticipatory-reveal adoption (POLISH.md D17): quote text is the
          hero — the editorially-loaded phrase. When `syncPoints[0]` carries
          the narration cue, AnimatedText's startFrame is shifted so the
          FIRST word lands 5 frames before the narrator says it. Settle = one
          stagger unit (framesPerUnit=3). Falls back to the original sec(0.3)
          when no cue is supplied → identical visual baseline.
          See TitleTransition.editorial-title (commit 1da5a49). */}
      <div
        style={{
          transform: `translateY(${heroTranslateY}px) scale(${textDrift})`,
          transformOrigin: "left center",
        }}
      >
        <AnimatedText
          text={data.text || ""}
          startFrame={
            syncPoints?.[0]?.frame !== undefined
              ? anticipatoryStartFrame(syncPoints[0].frame, 3)
              : sec(0.3)
          }
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
              maxWidth: textMaxWidth.h3,
              color: accentColor,
              fontWeight: 500,
              textShadow: `0 0 20px ${accentColor}30, 0 1px 3px rgba(0,0,0,0.5)`, // shadows.accentGlow + shadows.textLift composite
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
                maxWidth: textMaxWidth.body,
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

const DefinitionVariant: React.FC<{
  data: QuoteData;
  frame: number;
  syncPoints?: DirectionSyncPoint[];
}> = ({ data, frame, syncPoints }) => {
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
      {/* Anticipatory-reveal adoption (POLISH.md D17): the term IS the
          definition's hero — the named concept. First character lands 5
          frames before the narrator says it when `syncPoints[0]` carries
          the cue; settle = one stagger unit (framesPerUnit=8). Falls back
          to sec(0.2) absent a cue → identical baseline. */}
      <div style={{ transform: `scale(${termDrift})`, transformOrigin: "left center" }}>
        <AnimatedText
          text={data.term || ""}
          startFrame={
            syncPoints?.[0]?.frame !== undefined
              ? anticipatoryStartFrame(syncPoints[0].frame, 8)
              : sec(0.2)
          }
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
            maxWidth: textMaxWidth.h3,
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
            maxWidth: textMaxWidth.h2,
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

const BilingualVariant: React.FC<{
  data: QuoteData;
  frame: number;
  syncPoints?: DirectionSyncPoint[];
}> = ({ data, frame, syncPoints }) => {
  const theme = useThemeMode(data.backgroundVariant || "light");
  const emphasis = useEpisodeColorEmphasis();
  const accentColor = data.accentColor || emphasis.primaryAccent;
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
      {/* Anticipatory-reveal adoption (POLISH.md D17): the Chinese phrase
          is the hero — the named foreign concept (e.g., 卡脖子). First
          character lands 5 frames before narration via `syncPoints[0]`.
          Settle = one stagger unit (framesPerUnit=7). Falls back to sec(0.3)
          → identical baseline absent a cue. */}
      {data.chineseText && (
        <div style={{ transform: `scale(${chineseDrift})`, transformOrigin: "left center" }}>
          <AnimatedText
            text={data.chineseText}
            startFrame={
              syncPoints?.[0]?.frame !== undefined
                ? anticipatoryStartFrame(syncPoints[0].frame, 7)
                : sec(0.3)
            }
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
          boxShadow: shadows.accentGlowSm(accentColor),
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

  // Pace-aware timing scale for the count-up + reveal cadence. Pulled via
  // useDirection here (it's the cheapest way to get the canonical scale
  // resolution; main KineticTypography also calls it but the cost is trivial).
  // Drives the felt tempo of the stat reveal — urgent ticks faster, breathing
  // lingers.
  const direction = useDirection(data._direction);
  const t = direction.paceTimingScale;

  // Animate the number with overshoot-settle.
  //
  // Anticipatory-reveal adoption (POLISH.md D17, motion-design.md § 3):
  // the number is the editorially-loaded hero. When `syncPoints[0]` carries
  // the narration cue (the moment the figure is voiced), the count-up start
  // is shifted so the count REACHES its final value ~150ms (5 frames) before
  // the cue — the eye finds the settled number a beat before the ear hears
  // it. Settle envelope = the count-up duration itself (`sec(1.3 * t)` =
  // countUpEndFrame − countStart). Falls back to the original sec(0.5 * t)
  // when no cue is present → identical visual baseline.
  // See StatReveal (commit e9b4bd3) for the analogous count-up pattern.
  const rawValue = data.statValue || "0";
  const numericMatch = rawValue.match(/^([\d.]+)(.*)$/);
  let displayValue = rawValue;
  const COUNT_UP_DURATION = sec(1.3 * t);
  const COUNT_START_DEFAULT = sec(0.5 * t);
  const countCueFrame = direction.syncPoints?.[0]?.frame;
  const countStart =
    countCueFrame !== undefined
      ? anticipatoryStartFrame(countCueFrame, COUNT_UP_DURATION)
      : COUNT_START_DEFAULT;
  const countUpEndFrame = countStart + COUNT_UP_DURATION;
  const overshootAmount = 0.03; // 3% overshoot on the count itself

  if (numericMatch) {
    const targetNum = parseFloat(numericMatch[1]);
    const suffix = numericMatch[2]; // e.g., "%", "B", "nm"

    // Count-up with overshoot: 0 → 103% → 100%
    const countProgress = interpolate(
      frame,
      [countStart, countUpEndFrame, countUpEndFrame + sec(0.3 * t)],
      [0, 1 + overshootAmount, 1],
      CLAMP_CUBIC
    );

    const currentNum =
      targetNum % 1 === 0
        ? Math.round(targetNum * Math.min(countProgress, 1 + overshootAmount))
        : (targetNum * Math.min(countProgress, 1 + overshootAmount)).toFixed(1);
    displayValue = `${currentNum}${suffix}`;
  }

  // Cinematic scale reveal: number arrives at 130% and eases down (pace-scaled)
  const revealScale = scaleReveal(frame, sec(0.2 * t), sec(0.8 * t), 1.3, 1.0);
  // Micro-settle pulse after count-up — slightly stronger
  const pulseScale = pulse(frame, countUpEndFrame, 9, 1.04);
  // Audio-reactive bloom: pulse on Whisper-resolved sync points. Read straight
  // off data._direction to avoid double-calling useDirection (already called
  // by parent KineticTypography). Clamped because bloom drives CSS opacity.
  const beat = useBeatSync({
    markers: (direction.syncPoints ?? []).map((p) => p.timeSec),
    pulseDecay: 0.3,
  });
  const bloom = Math.min(1, smoothBloom(frame, sec(0.3 * t), sec(0.3 * t), 0.5) + beat.pulse * 0.25);

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

      {/* Big number — display face (IBM Plex Sans per D40) + overshoot + bloom + chromatic-kick on lock-in */}
      <div
        style={{
          position: "relative",
          fontSize: 180,
          fontWeight: 700,
          color: accentColor,
          fontFamily: fonts.heading,
          opacity: fadeIn(frame, sec(0.2), sec(0.4)),
          lineHeight: 1,
          textShadow: `0 0 60px ${accentColor}60, 0 0 120px ${accentColor}20`, // shadows.accentGlow cinematic (60px + 120px double)
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
            maxWidth: textMaxWidth.h2,
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
            maxWidth: textMaxWidth.body,
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

// ── Composite-pattern dispatch wrappers ────────────────────────────────────
//
// Each adapts the legacy QuoteData shape to the matching composite
// component's props. Wrapped in their own components so they have their
// own render scope and don't pollute the main render with extra hooks.
// Opt-in via `_direction.textAnimation`.

const QuoteAttributionDispatch: React.FC<{ data: QuoteData }> = ({ data }) => {
  // Build attribution string from authored fields. `attribution` carries
  // the speaker name; `attributionContext` (optional) adds role + date
  // (e.g. "Founder of TSMC, 2024"). We render the speaker via QuoteAttribution's
  // `attribution` prop and pass the context as `year` (it gets the mono
  // letter-tracked styling that suits "context" metadata).
  //
  // Archival auto-detection: if attributionContext references a pre-1980
  // year or archival document markers (RAND, RM-..., declassified, cable,
  // memo), switch QuoteAttribution to archival register (Plex Mono). This
  // matches the doctrine doc's "transcribed historical document" register
  // for figures like Nash (1950), von Neumann, Schelling, FDR.
  const archival = isArchivalAttribution(data.attributionContext);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 12%",
      }}
    >
      <QuoteAttribution
        text={data.text ?? ""}
        attribution={data.attribution ?? ""}
        year={data.attributionContext}
        archival={archival}
        align="center"
      />
    </div>
  );
};

/**
 * Decide whether a quote's `attributionContext` reads as archival (use
 * Plex Mono) vs modern (use Plex Sans display).
 *
 * Archival signals:
 *   - Year 1900–1979 (typewriters were the editorial register of that era)
 *   - Document markers: RAND, RM-..., declassified, classified, cable,
 *     memo, telegram, telex, archive
 *
 * Modern signals (defaults): any context lacking the above. Morris Chang
 * 2022 → modern. Nash 1950 → archival. Schelling textbook 1960 → archival.
 */
function isArchivalAttribution(context: string | undefined): boolean {
  if (!context) return false;
  const yearMatch = context.match(/\b(19[0-7]\d|18\d\d)\b/);
  if (yearMatch) return true;
  return /\b(RAND|RM-\d|declassified|classified|cable|memo|telegram|telex|archive)\b/i.test(
    context,
  );
}

const DefinitionRevealDispatch: React.FC<{ data: QuoteData }> = ({ data }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 12%",
      }}
    >
      <DefinitionReveal
        term={data.term ?? ""}
        pinyin={data.termPinyin}
        translation={data.termTranslation ?? data.definitionText ?? ""}
        accentColor={data.accentColor}
        isCallback={!!data._direction?.isCallback}
        align="center"
      />
    </div>
  );
};

const StatCaptionDispatch: React.FC<{ data: QuoteData }> = ({ data }) => {
  // statValue is authored as a string ("7%", "$165B", "0"). Extract a
  // numeric value + unit/prefix so StatCaption's ticker can drive the
  // animation. Falls back to value=0 with the full string as the caption
  // prefix if parsing fails — never crashes.
  const parsed = React.useMemo(
    () => parseStatValueString(data.statValue ?? "0"),
    [data.statValue],
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 10%",
      }}
    >
      <StatCaption
        value={parsed.value}
        unit={parsed.unit}
        caption={data.statLabel ?? ""}
        source={data.statContext}
        accentColor={data.accentColor}
        align="center"
      />
    </div>
  );
};

/**
 * Parse an authored statValue string into { value, unit }.
 *
 *   "82%"   → { value: 82,   unit: "%" }
 *   "$165B" → { value: 165,  unit: "$ B" }  // both prefix and suffix collapsed
 *   "0"     → { value: 0,    unit: "" }
 *   "1,500" → { value: 1500, unit: "" }
 *
 * Failure mode (non-parseable): returns { value: 0, unit: original }, so
 * the StatCaption ticker becomes a no-op and the unit displays the full
 * original string. Editorial intent preserved even when format is unusual.
 */
function parseStatValueString(s: string): { value: number; unit: string } {
  const match = s.match(/^\s*([^\d\-+.]*)\s*(-?[\d,]+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return { value: 0, unit: s };
  const prefix = match[1].trim();
  const numStr = match[2].replace(/,/g, "");
  const suffix = match[3].trim();
  const value = parseFloat(numStr);
  if (!Number.isFinite(value)) return { value: 0, unit: s };
  const unit =
    prefix && suffix
      ? `${prefix} ${suffix}`
      : prefix || suffix;
  return { value, unit };
}


// ── Main component ──────────────────────────────────────────────────────────

export const KineticTypography: React.FC<{ data: QuoteData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  // L66: each variant uses parallaxDrift() to drive multi-rate parallax across
  // elements (quoteMark/text/attribution etc. drift at different rates). Pass
  // noDrift: true so compStyle provides only enter/exit fade — the parallaxDrift
  // values become the single source of zoom per element. Without noDrift, every
  // element's drift was compounding with compStyle's 1.06 background drift,
  // producing ~1.09 zoom instead of the intended ~1.02-1.03.
  const { style: compStyle } = useCompositionAnimation({
    ...direction.driftOptions,
    noDrift: true,
  });
  const bgVariant = data.backgroundVariant || "light";
  const theme = useThemeMode(bgVariant);

  // ── A6 data-quality guards ───────────────────────────────────────────────
  // Guard 1: statistic variant with comparisonBars — use StatReveal instead.
  warnIf(data.variant === "statistic" && ((data as any).comparisonBars?.length ?? 0) > 0, "KineticTypography", "variant='statistic' with comparisonBars — use StatReveal instead (StatReveal is purpose-built for stat + comparison bar compositions)"); // no-as-any-ok: comparisonBars not in QuoteData type; guard for untyped JSON input
  // Guard 2: quote variant without attribution — every quote must cite its source.
  warnIf(data.variant === "quote" && !data.attribution, "KineticTypography", "variant='quote' without attribution — every quote must cite its source (add data.attribution)");
  // Guard 3: backgroundTintReason not present in QuoteData type — skipped per A6 spec.

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* Brand strips — intelligence-briefing texture */}
        <HeaderStrip metadata={data.episode} mode={bgVariant} />
        <FooterStrip mode={bgVariant} hideRec={data.variant === "quote"} />

        {/* Variant dispatch.
         *
         * When `data._direction.textAnimation` names a composite pattern
         * matching this variant ("quote-attribution" / "definition-reveal"
         * / "stat-caption"), the new composable component renders instead
         * of the legacy variant block. Backward-compatible: any data file
         * without `_direction.textAnimation` continues to render through
         * the legacy variants — bitwise-identical output. New episodes
         * opt in by setting the field via visual-spec.
         *
         * See project/TEXT_ANIMATION_REGISTER.md for the editorial
         * rationale and `_direction.textAnimation` ↔ variant mapping.
         */}
        {data.variant === "quote" && (
          data._direction?.textAnimation === "quote-attribution"
            ? <QuoteAttributionDispatch data={data} />
            : <QuoteVariant data={data} frame={frame} syncPoints={direction.syncPoints} />
        )}
        {data.variant === "definition" && (
          data._direction?.textAnimation === "definition-reveal"
            ? <DefinitionRevealDispatch data={data} />
            : <DefinitionVariant data={data} frame={frame} syncPoints={direction.syncPoints} />
        )}
        {data.variant === "bilingual" && (
          // No composite pattern for bilingual yet — falls through to legacy.
          <BilingualVariant data={data} frame={frame} syncPoints={direction.syncPoints} />
        )}
        {data.variant === "statistic" && (
          data._direction?.textAnimation === "stat-caption"
            ? <StatCaptionDispatch data={data} />
            : <StatisticVariant data={data} frame={frame} />
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

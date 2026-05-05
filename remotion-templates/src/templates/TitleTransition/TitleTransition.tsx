/**
 * TitleTransition — episode titles, section dividers, and end cards.
 *
 * Cinematic overhaul v2:
 * - Letter-spacing animation: tracking tightens from wide→tight ("lens focus")
 * - Dividers: scaleX from center with ease-out (replaces linear width draw)
 * - All secondary elements get slideIn (no naked fades)
 * - Bloom uses smooth 3-point envelope (no hard seam at peak)
 *
 * Designed for ~2-5 second transitions between video sections.
 * silicon-trap use cases: Episode title card, "Act I / Act II" dividers, end CTA.
 */

import React from "react";
import {
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { palette, fonts, fontSizes, layout, sec, shadows, gradients, durations } from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { fadeIn, fadeOut, slideIn, stagger, heroSpring, exitFade, scaleReveal, CLAMP, CLAMP_QUARTIC, CLAMP_QUAD } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { Background } from "../../components/Background";
import { Crosshair } from "../../components/Crosshair";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import type { TitleTransitionData } from "./types";

// ── Smooth bloom: single 3-point curve (no hard seam at peak) ─────────────

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

// ── Letter-spacing animation: wide→tight ("lens focus") ───────────────────

const letterSpacingAnim = (
  frame: number,
  startFrame: number,
  duration: number,
  fromSpacing: number = 12,
  toSpacing: number = 2,
): number =>
  interpolate(
    frame,
    [startFrame, startFrame + duration],
    [fromSpacing, toSpacing],
    CLAMP_QUARTIC
  );

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

// ── Episode title variant ──────────────────────────────────────────────────

const EpisodeTitleVariant: React.FC<{
  data: TitleTransitionData;
  frame: number;
  totalFrames: number;
}> = ({ data, frame, totalFrames }) => {
  const theme = useThemeMode(data.backgroundVariant || "light");
  const accentColor = data.accentColor || palette.amber;
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation({ noExit: true, ...direction.driftOptions });

  // Fade out near end
  const outOpacity = fadeOut(frame, totalFrames, sec(0.5));

  // Cinematic scale reveal for title — arrives at 120% and eases down
  const titleScale = scaleReveal(frame, sec(0.4), sec(0.8), 1.2, 1.0);
  // Spring-based entrance for title (A2 physics)
  const titleSpringY = interpolate(
    heroSpring(frame, layout.fps, stagger(1, 9)),
    [0, 1],
    [60, 0],
    CLAMP
  );

  // Letter-spacing "lens focus" — tracking tightens as title arrives
  const titleLetterSpacing = letterSpacingAnim(frame, sec(0.4), sec(0.8), 12, 2);

  // Smooth bloom behind title (no hard seam)
  const titleBloom = smoothBloom(frame, sec(0.4), sec(0.3), 0.5);

  // Exit fade wrapper (A7)
  const contentExitOpacity = exitFade(frame, totalFrames, 15);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        ...compStyle,
        opacity: outOpacity,
      }}
    >
      {/* Crosshair reticle — tracks from center to right-third, locks on after title lands */}
      {(() => {
        // Crosshair appears after title has landed (~1.8s), tracks to right-third of frame
        const crosshairStartSec = 1.8;
        const crosshairStart = sec(crosshairStartSec);
        // Track from center to right-third (BRAND.md: "Right-third of frame for title cards")
        const startX = layout.width / 2;
        const startY = layout.height / 2;
        const endX = layout.width * 0.72; // right-third
        const endY = layout.height * 0.42; // slightly above center
        // Smooth tracking movement (600-800ms as per BRAND.md)
        const trackDuration = durations.crosshairTrack;
        // Total draw-in time before tracking begins
        const drawInTime = durations.hairlinesExtend + durations.outerCircleDraw;
        const trackStart = crosshairStart + drawInTime;
        const trackProgress = interpolate(
          frame,
          [trackStart, trackStart + trackDuration],
          [0, 1],
          { ...CLAMP, easing: Easing.inOut(Easing.cubic) }
        );
        const cx = startX + (endX - startX) * trackProgress;
        const cy = startY + (endY - startY) * trackProgress;

        const mode = data.backgroundVariant || "light";
        const crosshairColor = mode === "dark" ? palette.amber : palette.oxblood;
        const crosshairOpacity = mode === "dark" ? 0.5 : 0.35;

        return (
          <Crosshair
            x={cx}
            y={cy}
            startFrame={crosshairStart}
            size={72}
            color={crosshairColor}
            opacity={crosshairOpacity}
            hairlineExtension={24}
          />
        );
      })()}

      {/* Title bloom glow — smooth 3-point envelope */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "50%",
          width: 700,
          height: 200,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(ellipse at center, ${accentColor}25 0%, ${accentColor}18 50%, transparent 80%)`,
          opacity: titleBloom,
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Anamorphic streak — horizontal lens flare across the bloom (J.J. Abrams flourish) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "10%",
          width: "80%",
          height: 1.5,
          transform: "translateY(-50%)",
          background: `linear-gradient(90deg, transparent 0%, ${accentColor}80 30%, ${accentColor} 50%, ${accentColor}80 70%, transparent 100%)`,
          opacity: titleBloom * 0.45,
          filter: "blur(0.5px)",
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />

      {/* Content wrapper with exit fade (A7) */}
      <div
        style={{
          opacity: contentExitOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Episode label — now with slideIn (no naked fade) */}
        {data.episodeLabel && (
          <div
            style={{
              fontSize: fontSizes.label,
              color: accentColor,
              letterSpacing: 6,
              textTransform: "uppercase",
              fontFamily: fonts.mono,
              fontWeight: 600,
              marginBottom: layout.spacing.md,
              opacity: fadeIn(frame, sec(0.3), sec(0.5)),
              transform: `translateY(${slideIn(frame, sec(0.3), 20, sec(0.5))}px)`,
            }}
          >
            {data.episodeLabel}
          </div>
        )}

        {/* Series name — now with slideIn (was naked fade) */}
        {data.seriesName && (
          <div
            style={{
              fontSize: fontSizes.caption,
              color: theme.text.muted,
              letterSpacing: 4,
              textTransform: "uppercase",
              marginBottom: layout.spacing.sm,
              opacity: fadeIn(frame, sec(0.2), sec(0.5)),
              transform: `translateY(${slideIn(frame, sec(0.2), 12, sec(0.5))}px)`,
            }}
          >
            {data.seriesName}
          </div>
        )}

        {/* Title line — scale reveal + spring + letter-spacing focus + bloom */}
        <div
          style={{
            fontSize: fontSizes.title,
            fontWeight: 700,
            color: theme.text.primary,
            fontFamily: fonts.heading,
            textAlign: "center",
            maxWidth: 1400,
            lineHeight: 1.2,
            letterSpacing: titleLetterSpacing,
            opacity: fadeIn(frame, sec(0.4), sec(0.6)),
            transform: `scale(${titleScale}) translateY(${titleSpringY}px)`,
            transformOrigin: "center center",
            textShadow: `0 0 60px ${accentColor}40, 0 0 120px ${accentColor}15, 0 2px 8px rgba(0,0,0,0.6)`,
          }}
        >
          {data.title}
        </div>

        {/* Gradient divider — scaleX from center (replaces linear width draw) */}
        <div
          style={{
            width: 280,
            height: 2,
            background: gradients.dividerFade(accentColor),
            marginTop: layout.spacing.lg,
            marginBottom: layout.spacing.lg,
            opacity: fadeIn(frame, sec(1.2), sec(0.4)),
            transform: `scaleX(${dividerScale(frame, sec(1.2), sec(0.6))})`,
            transformOrigin: "center",
            boxShadow: `0 0 12px ${accentColor}40`,
          }}
        />

        {/* Subtitle — dramatic slide-in + 1.02→1.0 scale settle */}
        {data.subtitle && (
          <div
            style={{
              fontSize: fontSizes.h3,
              color: theme.text.muted,
              fontWeight: 400,
              textAlign: "center",
              maxWidth: 1100,
              lineHeight: 1.4,
              opacity: fadeIn(frame, sec(1.5), sec(0.5)),
              transform: `translateY(${slideIn(frame, sec(1.5), 30, sec(0.6))}px) scale(${scaleReveal(frame, sec(1.5), sec(0.7), 1.02, 1.0)})`,
              transformOrigin: "center center",
              textShadow: shadows.textLift,
            }}
          >
            {data.subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Section divider variant ────────────────────────────────────────────────

const SectionVariant: React.FC<{
  data: TitleTransitionData;
  frame: number;
  totalFrames: number;
}> = ({ data, frame, totalFrames }) => {
  const theme = useThemeMode(data.backgroundVariant || "light");
  const accentColor = data.accentColor || palette.amber;
  const outOpacity = fadeOut(frame, totalFrames, sec(0.4));

  // Cinematic scale for section number — arrives at 140%
  const numberScale = scaleReveal(frame, sec(0.1), sec(0.6), 1.4, 1.0);

  // Spring-based entrance for section title
  const titleSpringY = interpolate(
    heroSpring(frame, layout.fps, stagger(1, 9)),
    [0, 1],
    [50, 0],
    CLAMP
  );
  const titleScale = scaleReveal(frame, sec(0.3), sec(0.7), 1.15, 1.0);

  // Letter-spacing focus on section title
  const titleLetterSpacing = letterSpacingAnim(frame, sec(0.3), sec(0.7), 8, 1.5);

  // Smooth bloom behind title
  const bloom = smoothBloom(frame, sec(0.3), sec(0.2), 0.4);

  // Exit fade wrapper (A7)
  const contentExitOpacity = exitFade(frame, totalFrames, 15);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        opacity: outOpacity,
      }}
    >
      {/* Bloom behind section title — smooth envelope */}
      <div
        style={{
          position: "absolute",
          top: "48%",
          left: "50%",
          width: 500,
          height: 150,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(ellipse at center, ${accentColor}20 0%, transparent 70%)`,
          opacity: bloom,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      {/* Content wrapper with exit fade (A7) */}
      <div
        style={{
          opacity: contentExitOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Section number — dramatic scale entrance */}
        {data.sectionNumber && (
          <div
            style={{
              fontSize: 120,
              fontWeight: 400,
              color: `${accentColor}40`,
              fontFamily: fonts.mono,
              lineHeight: 1,
              opacity: fadeIn(frame, sec(0.1), sec(0.4)),
              transform: `scale(${numberScale})`,
              transformOrigin: "center center",
            }}
          >
            {data.sectionNumber}
          </div>
        )}

        {/* Section title — scale reveal + spring + letter-spacing focus + bloom */}
        {data.sectionTitle && (
          <div
            style={{
              fontSize: fontSizes.h1,
              fontWeight: 600,
              color: theme.text.primary,
              fontFamily: fonts.heading,
              marginTop: layout.spacing.sm,
              letterSpacing: titleLetterSpacing,
              opacity: fadeIn(frame, sec(0.4), sec(0.5)),
              transform: `scale(${titleScale}) translateY(${titleSpringY}px)`,
              transformOrigin: "center center",
              textShadow: `0 0 50px ${accentColor}35, 0 2px 6px rgba(0,0,0,0.6)`,
            }}
          >
            {data.sectionTitle}
          </div>
        )}

        {/* Gradient underline — scaleX from center */}
        <div
          style={{
            width: 180,
            height: 2,
            background: gradients.dividerFade(accentColor),
            marginTop: layout.spacing.md,
            opacity: fadeIn(frame, sec(0.8), sec(0.3)),
            transform: `scaleX(${dividerScale(frame, sec(0.8), sec(0.4))})`,
            transformOrigin: "center",
            boxShadow: `0 0 10px ${accentColor}40`,
          }}
        />
      </div>
    </div>
  );
};

// ── End card variant ───────────────────────────────────────────────────────

const EndCardVariant: React.FC<{
  data: TitleTransitionData;
  frame: number;
  totalFrames: number;
}> = ({ data, frame, totalFrames }) => {
  const theme = useThemeMode(data.backgroundVariant || "light");
  const accentColor = data.accentColor || palette.amber;

  // Spring-based entrance for CTA (A2 physics)
  const ctaSpringY = interpolate(
    heroSpring(frame, layout.fps, stagger(0, 9)),
    [0, 1],
    [40, 0],
    CLAMP
  );

  // Exit fade wrapper (A7)
  const contentExitOpacity = exitFade(frame, totalFrames, 15);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Content wrapper with exit fade (A7) */}
      <div
        style={{
          opacity: contentExitOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* CTA text with glow and spring physics */}
        {data.ctaText && (
          <div
            style={{
              fontSize: fontSizes.h2,
              color: theme.text.primary,
              fontWeight: 500,
              textAlign: "center",
              opacity: fadeIn(frame, sec(0.5), sec(0.5)),
              transform: `translateY(${ctaSpringY}px)`,
              textShadow: shadows.textLift,
            }}
          >
            {data.ctaText}
          </div>
        )}

        {/* Gradient divider — scaleX from center */}
        <div
          style={{
            width: 60,
            height: 2,
            background: gradients.dividerFade(accentColor),
            marginTop: layout.spacing.lg,
            marginBottom: layout.spacing.lg,
            opacity: fadeIn(frame, sec(1), sec(0.3)),
            transform: `scaleX(${dividerScale(frame, sec(1), sec(0.5))})`,
            transformOrigin: "center",
          }}
        />

        {/* Next episode teaser — slideIn (no naked fade) */}
        {data.nextEpisodeTeaser && (
          <div
            style={{
              fontSize: fontSizes.body,
              color: theme.text.muted,
              textAlign: "center",
              maxWidth: 900,
              lineHeight: 1.5,
              opacity: fadeIn(frame, sec(1.5), sec(0.5)),
              transform: `translateY(${slideIn(frame, sec(1.5), 12, sec(0.5))}px)`,
              textShadow: shadows.textLift,
            }}
          >
            Next: {data.nextEpisodeTeaser}
          </div>
        )}
      </div>

      {/* Episode label — slideIn (was naked fade) */}
      <div
        style={{
          position: "absolute",
          bottom: layout.safeAreaTier.generous.bottom,
          fontSize: fontSizes.label,
          color: theme.text.muted,
          letterSpacing: 2,
          textTransform: "uppercase",
          opacity: fadeIn(frame, sec(0.3), sec(0.5)),
          transform: `translateY(${slideIn(frame, sec(0.3), 10, sec(0.5))}px)`,
          textShadow: shadows.textLift,
        }}
      >
        {data.episode}
      </div>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

export const TitleTransition: React.FC<{ data: TitleTransitionData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const bgVariant = data.backgroundVariant || "light";
  const totalFrames = sec(data.durationSec || 4);

  return (
    <Background
      variant={bgVariant}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      {data.variant === "episode-title" && (
        <EpisodeTitleVariant data={data} frame={frame} totalFrames={totalFrames} />
      )}
      {data.variant === "section" && (
        <SectionVariant data={data} frame={frame} totalFrames={totalFrames} />
      )}
      {data.variant === "end-card" && (
        <EndCardVariant data={data} frame={frame} totalFrames={totalFrames} />
      )}
      {/* Brand chrome — intelligence briefing texture */}
      <HeaderStrip
        mode={bgVariant}
        metadata={data.episodeLabel || data.episode}
        startSec={0.2}
      />
      <FooterStrip
        mode={bgVariant}
        hideRec={data.variant === "end-card"}
        startSec={0.2}
      />
    </Background>
  );
};

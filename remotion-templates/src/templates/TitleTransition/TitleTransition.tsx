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
import { brandMark as brandMarkToken, palette, fonts, fontSizes, textMaxWidth, layout, sec, shadows, gradients, durations } from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { fadeIn, fadeOut, slideIn, stagger, heroSpring, exitFade, scaleReveal, anticipatoryStartFrame, ANTICIPATE_FRAMES_DEFAULT, CLAMP, CLAMP_QUARTIC, CLAMP_QUAD } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useBeatSync } from "../../hooks/useBeatSync";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
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
  // linear-ok: 3-point bloom envelope — linear rise/settle segments are intentional
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
  const emphasis = useEpisodeColorEmphasis();
  const accentColor = data.accentColor || emphasis.primaryAccent;
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation({ noExit: true, ...direction.driftOptions });

  // Pace-aware timing scale — urgent=0.7 (faster), analytical=1.0 (default),
  // breathing=1.4 (slower, more deliberate). Multiply key entrance durations
  // and start frames by this so PACE: annotations actually move the felt
  // tempo of the title reveal, not just the segment length.
  const t = direction.paceTimingScale;

  // Fade out near end
  const outOpacity = fadeOut(frame, totalFrames, sec(0.5));

  // Cinematic scale reveal for title — arrives at 120% and eases down.
  // Start and duration both pace-scaled so urgent titles snap, breathing
  // titles linger.
  const titleScale = scaleReveal(frame, sec(0.4 * t), sec(0.8 * t), 1.2, 1.0);
  // Spring-based entrance for title (A2 physics)
  // linear-ok: input is heroSpring() output [0,1] — spring provides easing, not frame index
  const titleSpringY = interpolate(
    heroSpring(frame, layout.fps, stagger(1, 9)),
    [0, 1],
    [60, 0],
    CLAMP
  );

  // Letter-spacing "lens focus" — tracking tightens as title arrives.
  // Pace-scaled to match the scale reveal cadence above.
  const titleLetterSpacing = letterSpacingAnim(frame, sec(0.4 * t), sec(0.8 * t), 12, 2);

  // ── Anticipatory-reveal adoption (POLISH.md D17, motion-design.md § 3) ──
  // Title and subtitle are the editorially-loaded reveals. Convention:
  //   syncPoints[0] → title narration cue
  //   syncPoints[1] → subtitle narration cue
  // Each opacity fadeIn lands 5 frames before the cue when syncPoints exist.
  // Falls back to original estimate start frames otherwise → identical
  // visual baseline.
  // See editorial-title variant (commit 1da5a49) for the reference idiom —
  // identical convention, applied here to episode-title.
  const TITLE_START_DEFAULT = sec(0.4);
  const TITLE_SETTLE = sec(0.6);
  const SUBTITLE_START_DEFAULT = sec(1.5);
  const SUBTITLE_SETTLE = sec(0.5);
  const titleStartFrame =
    direction.syncPoints?.[0]?.frame !== undefined
      ? anticipatoryStartFrame(direction.syncPoints[0].frame, TITLE_SETTLE)
      : TITLE_START_DEFAULT;
  const subtitleStartFrame =
    direction.syncPoints?.[1]?.frame !== undefined
      ? anticipatoryStartFrame(direction.syncPoints[1].frame, SUBTITLE_SETTLE)
      : SUBTITLE_START_DEFAULT;

  // Smooth bloom behind title (no hard seam) + audio-reactive pulse from
  // Whisper-resolved sync points. When direction.syncPoints is empty (estimate
  // mode, no narration recorded yet), beat.pulse stays at 0 and titleBloom
  // is unchanged. When sync points exist, the bloom intensifies on the exact
  // word the script writer marked — visual lands on consonant, not on
  // estimated time.
  const beat = useBeatSync({
    markers: (direction.syncPoints ?? []).map((p) => p.timeSec),
    pulseDecay: 0.35,
  });
  // Clamp at 1 because titleBloom is consumed as CSS opacity. Without the
  // clamp, a beat landing during the entrance peak (smoothBloom already at
  // ~1.0) would silently overflow — CSS clips opacity to 1 and the beat
  // pulse becomes invisible exactly when it's supposed to be most intense.
  const titleBloom = Math.min(1, smoothBloom(frame, sec(0.4), sec(0.3), 0.5) + beat.pulse * 0.35);

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
            opacity: fadeIn(frame, titleStartFrame, TITLE_SETTLE),
            transform: `scale(${titleScale}) translateY(${titleSpringY}px)`,
            transformOrigin: "center center",
            textShadow: `0 0 60px ${accentColor}40, 0 0 120px ${accentColor}15, 0 2px 8px rgba(0,0,0,0.6)`, // shadows.accentGlow cinematic triple (60px + 120px + depth)
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
            boxShadow: shadows.accentGlowMd(accentColor),
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
              opacity: fadeIn(frame, subtitleStartFrame, SUBTITLE_SETTLE),
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
  const emphasis = useEpisodeColorEmphasis();
  const accentColor = data.accentColor || emphasis.primaryAccent;
  const outOpacity = fadeOut(frame, totalFrames, sec(0.4));
  const direction = useDirection(data._direction);

  // Audio-reactive pulse on Whisper-resolved sync points. Same pattern as
  // EpisodeTitleVariant — bloom intensifies on the exact word the script
  // marks. Returns neutral state when no sync points are available.
  const beat = useBeatSync({
    markers: (direction.syncPoints ?? []).map((p) => p.timeSec),
    pulseDecay: 0.3,
  });

  // Pace-aware timing scale (see EpisodeTitleVariant for full rationale).
  const t = direction.paceTimingScale;

  // Cinematic scale for section number — arrives at 140%, pace-scaled.
  const numberScale = scaleReveal(frame, sec(0.1 * t), sec(0.6 * t), 1.4, 1.0);

  // Spring-based entrance for section title
  // linear-ok: input is heroSpring() output [0,1] — spring provides easing, not frame index
  const titleSpringY = interpolate(
    heroSpring(frame, layout.fps, stagger(1, 9)),
    [0, 1],
    [50, 0],
    CLAMP
  );
  const titleScale = scaleReveal(frame, sec(0.3), sec(0.7), 1.15, 1.0);

  // Letter-spacing focus on section title
  const titleLetterSpacing = letterSpacingAnim(frame, sec(0.3), sec(0.7), 8, 1.5);

  // ── Anticipatory-reveal adoption (POLISH.md D17) ──
  // The section title (e.g., "THE LOGIC OF DENIAL") is the verbal anchor —
  // the narrator voices this on entry to the section. `syncPoints[0]` carries
  // the cue; opacity settles 5 frames before. Section number stays on plain
  // fadeIn — decorative/structural ordinal, not narration-keyed.
  const SECTION_TITLE_START_DEFAULT = sec(0.4);
  const SECTION_TITLE_SETTLE = sec(0.5);
  const sectionTitleStartFrame =
    direction.syncPoints?.[0]?.frame !== undefined
      ? anticipatoryStartFrame(direction.syncPoints[0].frame, SECTION_TITLE_SETTLE)
      : SECTION_TITLE_START_DEFAULT;

  // Smooth bloom behind title + beat pulse — clamped to 1 because consumed
  // as CSS opacity (see EpisodeTitleVariant note for full rationale).
  const bloom = Math.min(1, smoothBloom(frame, sec(0.3), sec(0.2), 0.4) + beat.pulse * 0.3);

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
              maxWidth: textMaxWidth.h1,
              letterSpacing: titleLetterSpacing,
              opacity: fadeIn(frame, sectionTitleStartFrame, SECTION_TITLE_SETTLE),
              transform: `scale(${titleScale}) translateY(${titleSpringY}px)`,
              transformOrigin: "center center",
              textShadow: `0 0 50px ${accentColor}35, 0 2px 6px rgba(0,0,0,0.6)`, // shadows.accentGlow cinematic + depth composite
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
            boxShadow: `0 0 10px ${accentColor}40`, // shadows.accentGlowSm (10px variant)
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
  const emphasis = useEpisodeColorEmphasis();
  const accentColor = data.accentColor || emphasis.primaryAccent;
  const direction = useDirection(data._direction);

  // ── Anticipatory-reveal adoption (POLISH.md D17) ──
  // The CTA text is the editorial hero of the end card — the closing line
  // the narrator voices ("if this matters to you, subscribe…"). Opacity
  // settles 5 frames before `syncPoints[0]`'s cue. Divider, teaser, and
  // episode label remain on plain fadeIn — structural / supporting.
  const CTA_START_DEFAULT = sec(0.5);
  const CTA_SETTLE = sec(0.5);
  const ctaStartFrame =
    direction.syncPoints?.[0]?.frame !== undefined
      ? anticipatoryStartFrame(direction.syncPoints[0].frame, CTA_SETTLE)
      : CTA_START_DEFAULT;

  // Spring-based entrance for CTA (A2 physics)
  // linear-ok: input is heroSpring() output [0,1] — spring provides easing, not frame index
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
              maxWidth: textMaxWidth.h2,
              opacity: fadeIn(frame, ctaStartFrame, CTA_SETTLE),
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

        {/* Photo / asset credits — small mono block, slides in last. Required
            for CC BY-SA on-screen attribution when the episode uses such
            photos. Sourced from data.credits[]; record of truth is
            episodes/<slug>/CREDITS.md. */}
        {data.credits && data.credits.length > 0 && (
          <div
            style={{
              marginTop: layout.spacing.lg,
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: theme.text.muted,
              textAlign: "center",
              maxWidth: 1000,
              lineHeight: 1.55,
              opacity: fadeIn(frame, sec(2.0), sec(0.5)),
              transform: `translateY(${slideIn(frame, sec(2.0), 10, sec(0.5))}px)`,
            }}
          >
            {data.credits.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
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

// ── Editorial title variant ────────────────────────────────────────────────
// Kicker + Title + Dek three-line magazine stack. Fade-only entrance with
// `ease-out-cubic`, 2.0s settled hold, ∴ brand mark in corner. Paper bg,
// ink type, amber reserved for the brand mark only — no bloom, no beat-sync,
// no scale reveal. The Atlantic / FT / NYT Magazine convention applied to
// the analytical-essay register.
//
// Reference: references/template-research/title-card.md
//
// Forbidden patterns this variant explicitly avoids:
//   - slide-in body type (dek fades; never slides)
//   - kinetic letter-by-letter title reveals (Vox/Harris register, not Parallax)
//   - amber/rust on the title type itself (accent reserved for ∴ glyph)
//   - bloom or anamorphic flare (cinematic register, wrong for editorial)
//   - audio-sync pulse (the title is held, not punched)

const EditorialTitleVariant: React.FC<{
  data: TitleTransitionData;
  frame: number;
  totalFrames: number;
}> = ({ data, frame, totalFrames }) => {
  const mode = data.backgroundVariant || "light";
  const theme = useThemeMode(mode);
  const direction = useDirection(data._direction);
  // Fall back through kicker → seriesName → episodeLabel so callers can drop
  // in this variant without touching legacy data shapes.
  const kicker = data.kicker || data.seriesName || data.episodeLabel;
  const dek = data.dek || data.subtitle;
  const brandMark = data.brandMark ?? "top-right";

  // Measured fade-only entrance — no slide, no scale, no spring.
  // Stagger: kicker → title → dek, each settling within ~600ms.
  // Settle pacing (frames from start, at 30 fps):
  //   kicker  fade-in 12 → 30  (400–1000 ms)
  //   title   fade-in 18 → 42  (600–1400 ms)
  //   dek     fade-in 30 → 54  (1000–1800 ms)
  // Title is fully settled by frame 42 (~1.4s); the rest of the duration is
  // the editorial hold. The dossier specifies 2.0s minimum hold post-settle.
  //
  // ── Anticipatory-reveal adoption (POLISH.md D17, motion-design.md § 3) ──
  // Title and dek are the two editorially-loaded reveals — the title names
  // the subject, the dek frames the analytical claim. Both land settled
  // ~150ms BEFORE the narrator says them (Economist convention). When
  // `_direction.syncPoints` contains the narration cues, those cues drive
  // the START frames; otherwise the original estimate start frames are
  // preserved, producing the IDENTICAL fade curve as before this adoption.
  //
  // We use `anticipatoryStartFrame()` (the start-frame helper) combined
  // with plain `fadeIn` rather than `anticipatoryReveal` (which would
  // change the easing from linear to cubic — a meaningful visual shift
  // that would invalidate baselines for no narration-time benefit).
  //
  // The kicker and divider stay on plain fadeIn — they're scaffold/structure,
  // not editorial claims.
  //
  // Convention: syncPoints[0] = title cue, syncPoints[1] = dek cue. Future
  // narration pipelines emit these via the visual-spec → assembly-manifest
  // path.
  const syncPoints = direction.syncPoints ?? [];
  const TITLE_START = sec(0.6);
  const TITLE_SETTLE = sec(0.8);
  const DEK_START = sec(1.0);
  const DEK_SETTLE = sec(0.8);
  // When sync point present: start = cue - 5 - settle  → settles 5 frames
  // before the narrator says the word.
  // When sync point absent: keep the original estimate start frame.
  const titleStartFrame =
    syncPoints[0]?.timeSec !== undefined
      ? anticipatoryStartFrame(
          Math.round(syncPoints[0].timeSec * layout.fps),
          TITLE_SETTLE,
        )
      : TITLE_START;
  const dekStartFrame =
    syncPoints[1]?.timeSec !== undefined
      ? anticipatoryStartFrame(
          Math.round(syncPoints[1].timeSec * layout.fps),
          DEK_SETTLE,
        )
      : DEK_START;

  const kickerOpacity = fadeIn(frame, sec(0.4), sec(0.6));
  const titleOpacity = fadeIn(frame, titleStartFrame, TITLE_SETTLE);
  const dekOpacity = fadeIn(frame, dekStartFrame, DEK_SETTLE);
  const dividerOpacity = fadeIn(frame, sec(0.8), sec(0.6));

  // Exit fade. Default duration is 4s; the dossier wants the card held ~2s
  // post-settle then a clean exit. If durationSec ≥ 3, we keep the last
  // 30 frames (1s) for the fade; otherwise we scale proportionally.
  const fadeOutFrames = totalFrames >= sec(3) ? sec(1) : Math.floor(totalFrames * 0.25);
  const outOpacity = fadeOut(frame, totalFrames, fadeOutFrames);

  // ∴ brand mark — amber, hold steady (does not fade with content). Lands
  // slightly before the title settles so it reads as a fixture of the page.
  const markOpacity = fadeIn(frame, sec(0.3), sec(0.4));
  const markPosition = (() => {
    if (brandMark === "top-right") {
      return { top: layout.safeAreaTier.generous.top, right: layout.safeAreaTier.generous.right };
    }
    if (brandMark === "bottom-left") {
      return { bottom: layout.safeAreaTier.generous.bottom, left: layout.safeAreaTier.generous.left };
    }
    return null;
  })();

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
        paddingLeft: layout.safeAreaTier.generous.left,
        paddingRight: layout.safeAreaTier.generous.right,
      }}
    >
      {/* Kicker — Plex Mono, ink @ 60%, uppercase, letter-spaced */}
      {kicker && (
        <div
          style={{
            fontSize: fontSizes.label,
            fontFamily: fonts.mono,
            color: theme.text.secondary,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 500,
            marginBottom: layout.spacing.lg,
            opacity: kickerOpacity,
            maxWidth: textMaxWidth.body,
            textAlign: "center",
          }}
        >
          {kicker}
        </div>
      )}

      {/* Title — Plex Sans Display, ink, hero scale, no accent color */}
      {data.title && (
        <div
          style={{
            fontSize: fontSizes.title,
            fontFamily: fonts.display,
            color: theme.text.primary,
            fontWeight: 700,
            textAlign: "center",
            maxWidth: textMaxWidth.h1,
            lineHeight: 1.1,
            letterSpacing: -0.5,
            opacity: titleOpacity,
          }}
        >
          {data.title}
        </div>
      )}

      {/* Thin ink rule — magazine convention separating title from dek */}
      {dek && (
        <div
          style={{
            width: 64,
            height: 1,
            background: theme.text.muted,
            opacity: dividerOpacity * 0.6,
            marginTop: layout.spacing.lg,
            marginBottom: layout.spacing.lg,
          }}
        />
      )}

      {/* Dek — Plex Serif Italic, ink @ 80%, one-line summary */}
      {dek && (
        <div
          style={{
            fontSize: fontSizes.h3,
            fontFamily: fonts.serifBody,
            fontStyle: "italic",
            color: theme.text.secondary,
            fontWeight: 400,
            textAlign: "center",
            maxWidth: textMaxWidth.h2,
            lineHeight: 1.4,
            opacity: dekOpacity,
          }}
        >
          {dek}
        </div>
      )}

      {/* ∴ Parallax brand mark — amber, fixed corner position. The only
          element on the card that uses an accent color. JetBrains Mono
          renders ∴ as three weighted dots (matches GameBoard pd-canonical). */}
      {markPosition && (
        <div
          style={{
            position: "absolute",
            ...markPosition,
            fontSize: fontSizes.h2,
            fontFamily: fonts.data,
            color: palette.amber,
            fontWeight: 700,
            lineHeight: 0.7,
            letterSpacing: -2,
            opacity: markOpacity,
            maxWidth: fontSizes.h1,
          }}
          aria-label="Parallax"
        >
          {brandMarkToken.glyph}
        </div>
      )}
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
      {data.variant === "editorial-title" && (
        <EditorialTitleVariant data={data} frame={frame} totalFrames={totalFrames} />
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

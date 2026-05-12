/**
 * StatReveal — dramatic single-statistic reveal with comparison bars.
 *
 * The hero number counts up from zero with an eased counter, then
 * comparison bars grow in from the left to provide context. The layout
 * is split: hero stat on the left, comparison bars on the right.
 *
 * Designed for the visceral "holy shit" number moment.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  layout,
  sec,
  shadows,
  radii,
  getCategoricalColor,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  exitFade,
  heroSpring,
  scaleReveal,
  anticipatoryStartFrame,
  CLAMP_QUARTIC,
} from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { warnIf } from "../../utils/dataWarnings";
import { useBeatSync } from "../../hooks/useBeatSync";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useTemplateLayout } from "../../hooks/useTemplateLayout";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { TitleBlock } from "../../components/TitleBlock";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import type { StatRevealData, ComparisonBar } from "./types";
import { formatNumber as sharedFormatNumber } from "../../utils/numberFormat";

// ── Number formatting (delegates to shared utility) ──────────────────────────

const formatNumber = (
  value: number,
  decimals: number = 0,
  prefix: string = "",
  suffix: string = ""
): string =>
  sharedFormatNumber(value, { decimals, prefix, suffix });

// ── Sub-components ───────────────────────────────────────────────────────────

interface HeroStatProps {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  decimals?: number;
  progress: number;
  opacity: number;
  /** Cinematic scale reveal — number arrives at 1.3× and eases to 1.0× */
  revealScale: number;
  theme: ReturnType<typeof useThemeMode>;
  /** Per-episode primary accent. Defaults to channel amber if not provided. */
  accentColor?: string;
}

const HeroStat: React.FC<HeroStatProps> = ({
  value,
  prefix,
  suffix,
  label,
  decimals,
  progress,
  opacity,
  revealScale,
  theme,
  accentColor = palette.amber,
}) => {
  const currentValue = value * progress;
  const displayValue = formatNumber(currentValue, decimals, prefix, suffix);

  return (
    <div
      style={{
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* The big number — cinematic scale-reveal (1.3× → 1.0×) */}
      <div
        style={{
          fontSize: 120,
          fontWeight: fontWeights.bold,
          color: accentColor,
          fontFamily: fonts.data,
          textShadow: `0 0 24px ${accentColor}50, ${theme.textShadow}`, // shadows.accentGlow + theme.textShadow composite
          letterSpacing: -2,
          lineHeight: 1,
          transform: `scale(${revealScale})`,
          transformOrigin: "center center",
        }}
      >
        {displayValue}
      </div>

      {/* Label below the number */}
      <div
        style={{
          fontSize: fontSizes.body,
          color: theme.text.secondary,
          fontFamily: fonts.body,
          marginTop: layout.spacing.md,
          textShadow: theme.textShadow,
          textAlign: "center",
          maxWidth: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
};

interface BarItemProps {
  bar: ComparisonBar;
  maxValue: number;
  index: number;
  barWidth: number;
  progress: number;
  opacity: number;
  theme: ReturnType<typeof useThemeMode>;
}

const BarItem: React.FC<BarItemProps> = ({
  bar,
  maxValue,
  index,
  barWidth,
  progress,
  opacity,
  theme,
}) => {
  const barFraction = bar.value / maxValue;
  const currentWidth = barWidth * barFraction * progress;
  // Multi-bar charts get distinct hues by default — only fall back to a
  // single color when the data author hasn't decided per-bar colors.
  const barColor = bar.color || getCategoricalColor(index);
  const barHeight = 56;
  const barGap = layout.spacing.sm;

  return (
    <div
      style={{
        opacity,
        display: "flex",
        alignItems: "center",
        gap: layout.spacing.md,
        marginBottom: barGap,
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: fontSizes.label,
          color: theme.text.secondary,
          fontFamily: fonts.body,
          width: 200,
          textAlign: "right",
          textShadow: theme.textShadow,
          flexShrink: 0,
        }}
      >
        {bar.label}
      </div>

      {/* Bar */}
      <div
        style={{
          position: "relative",
          height: barHeight,
          width: currentWidth,
          borderRadius: radii.sm,
          background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}C0 100%)`,
          boxShadow: shadows.subtle,
          minWidth: 2,
        }}
      />

      {/* Value label */}
      <div
        style={{
          fontSize: fontSizes.label,
          color: theme.text.muted,
          fontFamily: fonts.data,
          textShadow: theme.textShadow,
          flexShrink: 0,
        }}
      >
        {formatNumber(bar.value * progress)}
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

export const StatReveal: React.FC<{ data: StatRevealData }> = ({ data }) => {
  warnIf(
    !data.comparisons || data.comparisons.length === 0,
    "StatReveal",
    `StatReveal called without comparison bars — context evaporates. ` +
      `Either add comparisons[] (mandatory for this template) OR switch to ` +
      `KineticTypography (statistic variant) for a context-free hero number. ` +
      `See CHART_TEMPLATE_SELECTOR.md.`,
  );
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = useThemeMode(data.backgroundVariant);
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  // Audio-reactive scale kick on Whisper-resolved sync points. Returns
  // neutral state when no sync points exist.
  const beat = useBeatSync({
    markers: (direction.syncPoints ?? []).map((p) => p.timeSec),
    pulseDecay: 0.3,
  });
  // Pace-aware scaling — see TitleTransition for the pattern.
  const t = direction.paceTimingScale;
  const s = direction.paceStaggerScale;
  // Per-episode color emphasis for hero stat color.
  const emphasis = useEpisodeColorEmphasis();

  // ── Layout zones — replaces contentArea("content") ─────────────────
  const { zones } = useTemplateLayout({ title: "content", footerHeight: 40, safeArea: "generous" });
  const area = zones.content.rect;

  // ── Timing (pace-scaled) ────────────────────────────────────────────────
  const heroCountFrames = sec(2 * t);
  const heroHoldFrames = sec(0.5 * t);
  const barStagger = sec(0.06 * s); // 60ms baseline — dense whip stagger per POLISH A3
  const barGrowFrames = sec(1 * t);
  const outroFrames = sec(1.5);

  // ── Anticipatory-reveal adoption (POLISH.md D17, motion-design.md § 3) ──
  // The hero number is the editorial "land" — the figure the narrator names.
  // Per D17 (Economist convention), the count-up should finish ~150ms BEFORE
  // the narrator says the figure, so the eye finds the settled number a beat
  // ahead of the ear. The count-up duration (`heroCountFrames`) is the
  // entrance "settle" — `anticipatoryStartFrame()` shifts `heroStart` back
  // so `heroStart + heroCountFrames` lands 5 frames before the cue.
  //
  // Convention: syncPoints[0] = hero figure cue. When the visual-spec pipeline
  // emits this via Whisper-resolved cues, the hero anticipates narration.
  // When absent (the common case today), the original estimate start frame
  // is preserved → identical visual baseline as pre-adoption.
  //
  // See TitleTransition.editorial-title (commit 1da5a49) for the reference
  // adoption — same idiom, opacity-only reveal there vs count-up here.
  const HERO_START_DEFAULT = sec(0.5 * t);
  const heroCueFrame = direction.syncPoints?.[0]?.frame;
  const heroStart =
    heroCueFrame !== undefined
      ? anticipatoryStartFrame(heroCueFrame, heroCountFrames)
      : HERO_START_DEFAULT;
  const barsStart = heroStart + heroCountFrames + heroHoldFrames;

  // ── Hero count-up progress ──────────────────────────────────────────────
  const heroProgress = interpolate(
    frame,
    [heroStart, heroStart + heroCountFrames],
    [0, 1],
    CLAMP_QUARTIC
  );

  const heroOpacity = fadeIn(frame, heroStart, sec(0.4));

  // ── Max value for bar scaling ───────────────────────────────────────────
  const allValues = useMemo(
    () => [
      data.heroIsMax !== false ? data.stat.value : 0,
      ...data.comparisons.map((c) => c.value),
    ],
    [data.stat.value, data.comparisons, data.heroIsMax]
  );
  const maxValue = Math.max(...allValues);

  // ── Bar area dimensions ─────────────────────────────────────────────────
  const barAreaWidth = area.width * 0.55;

  // ── Exit fade ───────────────────────────────────────────────────────────
  const exit = exitFade(frame, durationInFrames, outroFrames);

  // ── Source ──────────────────────────────────────────────────────────────
  const sourceOpacity = fadeIn(frame, barsStart + sec(0.5), sec(0.5)) * exit;

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={compStyle}>

      {/* Brand strips */}
      <HeaderStrip mode={data.backgroundVariant === "dark" ? "dark" : "light"} />
      <FooterStrip mode={data.backgroundVariant === "dark" ? "dark" : "light"} />

      <TitleBlock
        title={data.title}
        subtitle={data.subtitle}
        mode={data.backgroundVariant}
        safeAreaTier="generous"
        syncPoints={direction.syncPoints}
      />

      {/* Content area — hero stat left, comparison bars right */}
      <div
        style={{
          position: "absolute",
          top: area.top,
          left: area.left,
          width: area.width,
          height: area.height,
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Hairline vertical divider between hero and bars (60% height, gradient-fade ends) */}
        <div
          style={{
            position: "absolute",
            left: area.width * 0.42,
            top: area.height * 0.2,
            width: 1,
            height: area.height * 0.6,
            background: `linear-gradient(180deg, transparent 0%, ${theme.text.muted}40 25%, ${theme.text.muted}60 50%, ${theme.text.muted}40 75%, transparent 100%)`,
            opacity: fadeIn(frame, barsStart, sec(0.5)) * exit,
            pointerEvents: "none",
          }}
        />

        {/* Hero stat — left 40% */}
        <div
          style={{
            width: area.width * 0.4,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: `scale(${0.96 + 0.04 * heroSpring(frame, layout.fps, heroStart + heroCountFrames)})`,
            transformOrigin: "center center",
          }}
        >
          <HeroStat
            value={data.stat.value}
            prefix={data.stat.prefix}
            suffix={data.stat.suffix}
            label={data.stat.label}
            decimals={data.stat.decimals}
            progress={heroProgress}
            opacity={heroOpacity * exit}
            revealScale={scaleReveal(frame, heroStart, sec(0.8), 1.3, 1.0) * (1 + beat.pulse * 0.05)}
            theme={theme}
            accentColor={emphasis.primaryAccent}
          />
        </div>

        {/* Comparison bars — right 55% */}
        <div
          style={{
            width: barAreaWidth,
            marginLeft: area.width * 0.05,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {data.comparisons.map((bar, i) => {
            const barStart = barsStart + i * barStagger;
            const barProgress = interpolate(
              frame,
              [barStart, barStart + barGrowFrames],
              [0, 1],
              CLAMP_QUARTIC
            );
            const barOpacity = fadeIn(frame, barStart, sec(0.3)) * exit;

            return (
              <BarItem
                key={i}
                bar={bar}
                maxValue={maxValue}
                index={i}
                barWidth={barAreaWidth - 280}
                progress={barProgress}
                opacity={barOpacity}
                theme={theme}
              />
            );
          })}
        </div>
      </div>

      {/* Source attribution */}
      {data.source && (
        <div
          style={{
            position: "absolute",
            bottom: zones.footer.rect.bottom,
            right: zones.footer.rect.right,
            fontSize: fontSizes.caption,
            color: theme.text.muted,
            fontFamily: fonts.body,
            opacity: sourceOpacity,
            textShadow: theme.textShadow,
          }}
        >
          {data.source}
        </div>
      )}
    </AbsoluteFill>
    </Background>
  );
};

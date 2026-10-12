/**
 * Syllogism — formal deductive argument structure.
 *
 *   1. Major Premise        ← general claim
 *   2. Minor Premise        ← specific claim
 *   3. ∴ Conclusion         ← follows from 1 and 2 (brand mark = logical hinge)
 *
 * Reveal sequence:
 *   t=0.4s   premise 1 fades in
 *   t=2.0s   premise 2 fades in
 *   t=3.6s   ∴ symbol scales in from 0 (the editorial pivot)
 *   t=4.0s   conclusion fades in
 *   t=5.5s   fallacy strike-through (when validity = "fallacy")
 *
 * @composition-animation: useCompositionAnimation
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  brandMark,
  fontSizes,
  fontWeights,
  fonts,
  layout,
  palette,
  sec,
  semantic,
} from "../../design/theme";
import { fadeIn } from "../../utils/animation";
import type { SyllogismData } from "./types";

// ── Reveal timing ──────────────────────────────────────────────────────────

const T_P1 = 0.4;
const T_P2 = 2.0;
const T_THEREFORE = 3.6;
const T_CONCLUSION = 4.0;
const T_FALLACY = 5.5;

// ── Component ──────────────────────────────────────────────────────────────

export const Syllogism: React.FC<{ data: SyllogismData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();

  const isFallacy = data.validity === "fallacy";
  const thereforeColor = isFallacy ? semantic.china : (emphasis.primaryAccent ?? palette.gold);

  // ── Premise reveal envelopes ─────────────────────────────────────────────
  const p1Opacity = fadeIn(frame, sec(T_P1), sec(0.7));
  const p2Opacity = fadeIn(frame, sec(T_P2), sec(0.7));
  const concOpacity = fadeIn(frame, sec(T_CONCLUSION), sec(0.7));

  // ∴ symbol scales in dramatically — the editorial pivot of the argument.
  const thereforeScale = interpolate(
    frame,
    [sec(T_THEREFORE), sec(T_THEREFORE + 0.6)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(1.6)),
    },
  );
  const thereforeOpacity = fadeIn(frame, sec(T_THEREFORE), sec(0.5));

  // Fallacy strike-through animates left-to-right after conclusion settles.
  const strikeProgress = isFallacy
    ? interpolate(
        frame,
        [sec(T_FALLACY), sec(T_FALLACY + 0.6)],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 0;
  const fallacyLabelOpacity = isFallacy
    ? fadeIn(frame, sec(T_FALLACY + 0.7), sec(0.5))
    : 0;

  // Layout: centred column, 70% of canvas width, vertically distributed.
  const colWidth = layout.width * 0.72;
  const colLeft = (layout.width - colWidth) / 2;
  const topPad = data.title ? 240 : 160;
  const bottomReserve = 100;
  const colHeight = layout.height - topPad - bottomReserve;

  // Three rows: P1, P2, Conclusion. Each gets ~1/3 of column height.
  // ∴ symbol lives BETWEEN P2 and conclusion as the editorial pivot.
  const rowHeight = colHeight / 3;

  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        <HeaderStrip metadata={data.episode} mode={mode} />
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
            syncPoints={direction.syncPoints}
          />
        )}

        {/* Premise 1 — Major Premise */}
        <PremiseRow
          number="1"
          numberLabel="Major Premise"
          text={data.majorPremise}
          top={topPad}
          height={rowHeight}
          left={colLeft}
          width={colWidth}
          opacity={p1Opacity}
          theme={theme}
        />

        {/* Premise 2 — Minor Premise */}
        <PremiseRow
          number="2"
          numberLabel="Minor Premise"
          text={data.minorPremise}
          top={topPad + rowHeight}
          height={rowHeight}
          left={colLeft}
          width={colWidth}
          opacity={p2Opacity}
          theme={theme}
        />

        {/* ∴ symbol — brand mark as logical pivot */}
        <div
          style={{
            position: "absolute",
            top: topPad + rowHeight * 2 - 28,
            left: colLeft,
            width: colWidth,
            textAlign: "center",
            fontFamily: fonts.display,
            fontSize: fontSizes.h1,
            fontWeight: fontWeights.semibold,
            color: thereforeColor,
            lineHeight: 1,
            opacity: thereforeOpacity,
            transform: `scale(${thereforeScale})`,
            transformOrigin: "center",
            textDecoration: isFallacy && strikeProgress > 0 ? "line-through" : undefined,
            textDecorationThickness: 3,
            textDecorationColor: isFallacy ? semantic.china : undefined,
          }}
        >
          {brandMark.glyph}
        </div>

        {/* Conclusion */}
        <PremiseRow
          number="C"
          numberLabel="Conclusion"
          text={data.conclusion}
          top={topPad + rowHeight * 2 + 32}
          height={rowHeight}
          left={colLeft}
          width={colWidth}
          opacity={concOpacity}
          theme={theme}
          accent
          accentColor={thereforeColor}
          strikeProgress={isFallacy ? strikeProgress : 0}
        />

        {/* Fallacy label (only when validity = "fallacy"). */}
        {isFallacy && data.fallacyType && (
          <div
            style={{
              position: "absolute",
              top: topPad + rowHeight * 3 - 4,
              left: colLeft,
              width: colWidth,
              textAlign: "center",
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: semantic.china,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: fallacyLabelOpacity,
            }}
          >
            Fallacy · {data.fallacyType}
          </div>
        )}

        {/* Argument attribution (e.g., "Mearsheimer 2014"). */}
        {data.argumentAttribution && (
          <div
            style={{
              position: "absolute",
              bottom: 120,
              left: colLeft,
              width: colWidth,
              textAlign: "right",
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: fontSizes.caption,
              color: theme.text.muted,
              opacity: fadeIn(frame, sec(T_CONCLUSION + 1), sec(0.6)),
            }}
          >
            — as articulated by {data.argumentAttribution}
          </div>
        )}

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
        <FooterStrip mode={mode} />
      </AbsoluteFill>
    </Background>
  );
};

// ── PremiseRow ─────────────────────────────────────────────────────────────

const PremiseRow: React.FC<{
  number: string;
  numberLabel: string;
  text: string;
  top: number;
  height: number;
  left: number;
  width: number;
  opacity: number;
  theme: ReturnType<typeof useThemeMode>;
  accent?: boolean;
  accentColor?: string;
  strikeProgress?: number;
}> = ({
  number,
  numberLabel,
  text,
  top,
  height,
  left,
  width,
  opacity,
  theme,
  accent,
  accentColor,
  strikeProgress = 0,
}) => {
  const numberFontColor = accent ? (accentColor ?? palette.gold) : theme.text.muted;
  const textColor = accent ? theme.text.primary : theme.text.primary;
  const textWeight = accent ? fontWeights.medium : fontWeights.regular;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 32,
        opacity,
      }}
    >
      {/* Ordinal — small mono-caps ledger column. */}
      <div
        style={{
          width: 90,
          flexShrink: 0,
          textAlign: "right",
          fontFamily: fonts.mono,
          fontSize: fontSizes.caption,
          color: numberFontColor,
          letterSpacing: 2,
          textTransform: "uppercase",
          lineHeight: 1.3,
        }}
      >
        <div style={{ fontSize: fontSizes.h3, lineHeight: 1, fontWeight: fontWeights.semibold }}>
          {number}.
        </div>
        <div style={{ marginTop: 6 }}>{numberLabel}</div>
      </div>

      {/* Premise / Conclusion text. */}
      <div
        style={{
          flex: 1,
          fontFamily: fonts.serifBody,
          fontSize: accent ? fontSizes.h2 : fontSizes.h3,
          fontWeight: textWeight,
          color: textColor,
          lineHeight: 1.25,
          letterSpacing: "-0.005em",
          fontStyle: accent ? "normal" : "italic",
          position: "relative",
        }}
      >
        {text}
        {/* Strike-through overlay for fallacy mode. */}
        {strikeProgress > 0 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              width: `${strikeProgress * 100}%`,
              height: 3,
              background: semantic.china,
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
};

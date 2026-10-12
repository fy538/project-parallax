/**
 * NewspaperHeadlineRotator — sequential reveal of period newspaper front
 * pages making the same editorial point ("the world saw it this way").
 *
 * Each page: real masthead crop + editorial headline gloss + dateline strip
 * on archival newsprint paper. Sequential reveal via stack-shift,
 * crossfade-scale, or cut.
 *
 * Authoring requirement (documented, not enforced): mastheads must be real
 * scanned crops, not typeset. The whole editorial point is "these are real
 * pages from real archives" — typeset reconstructions destroy the claim.
 *
 * @composition-animation: useCompositionAnimation
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { ArchivalPaper } from "../../components/ArchivalChrome";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import {
  fontSizes,
  fontWeights,
  fonts,
  layout,
  palette,
  sec,
} from "../../design/theme";
import { fadeIn } from "../../utils/animation";
import { resolveAssetSrc } from "../../utils/assetPath";
import type {
  NewspaperHeadline,
  NewspaperHeadlineRotatorData,
} from "./types";

// ── Component ──────────────────────────────────────────────────────────────

export const NewspaperHeadlineRotator: React.FC<{
  data: NewspaperHeadlineRotatorData;
}> = ({ data }) => {
  const frame = useCurrentFrame();
  const fps = layout.fps;
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const mode = data.backgroundVariant ?? "light";
  const emphasis = useEpisodeColorEmphasis();

  const holdSec = data.holdSec ?? 3;
  const transition = data.transition ?? "crossfade-scale";
  const transitionDurSec = transition === "cut" ? 0 : 0.5;
  const paperVariant: "newsprint" = "newsprint";

  // Compute per-headline frame ranges. Each headline appears at i * holdSec,
  // then holds for holdSec, then transitions out as the next appears.
  const ranges = useMemo(() => {
    return data.headlines.map((h, i) => {
      const explicit = h.appearAtSec;
      const startSec =
        explicit != null && explicit !== "auto" ? explicit : i * holdSec;
      const endSec = startSec + holdSec + transitionDurSec;
      return { startFrame: sec(startSec), endFrame: sec(endSec) };
    });
  }, [data.headlines, holdSec, transitionDurSec]);

  const titleTop = layout.spacing.xl;
  const titleHeight = data.title || data.subtitle ? 140 : 0;
  const cardTop = titleTop + titleHeight + 20;
  const cardHeight = layout.height - cardTop - 120;
  const cardWidth = layout.width * 0.72;
  const cardLeft = (layout.width - cardWidth) / 2;
  const accentColor = emphasis.primaryAccent ?? palette.gold;

  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
            syncPoints={direction.syncPoints}
          />
        )}

        {/* Headline pages — render each, animate visibility via transition. */}
        {data.headlines.map((h, i) => {
          const range = ranges[i];
          const local = frame - range.startFrame;
          const transFrames = sec(transitionDurSec);
          const visible =
            frame >= range.startFrame &&
            frame <
              range.startFrame +
                sec(holdSec) +
                transFrames * 2; // hold + in + out

          if (!visible) return null;

          // Visibility envelope: fade in over transition, hold, fade out
          // as next page enters.
          let opacity = 1;
          let scale = 1;
          let tx = 0;
          if (local < transFrames) {
            const p = local / transFrames;
            if (transition === "crossfade-scale") {
              opacity = p;
              scale = 0.96 + p * 0.04;
            } else if (transition === "stack-shift") {
              opacity = 1;
              tx = (1 - p) * cardWidth * 0.6;
            } else {
              opacity = 1;
            }
          } else if (local > sec(holdSec) + transFrames) {
            const p = (local - sec(holdSec) - transFrames) / transFrames;
            if (transition === "crossfade-scale") {
              opacity = 1 - p;
              scale = 1 - p * 0.04;
            } else if (transition === "stack-shift") {
              opacity = 1 - p * 0.6;
              tx = -p * cardWidth * 0.5;
              scale = 1 - p * 0.06;
            }
          }

          return (
            <div
              key={`page-${i}`}
              style={{
                position: "absolute",
                top: cardTop,
                left: cardLeft,
                width: cardWidth,
                height: cardHeight,
                opacity,
                transform: `translateX(${tx}px) scale(${scale})`,
                transformOrigin: "center",
              }}
            >
              <NewspaperPage
                headline={h}
                width={cardWidth}
                height={cardHeight}
                paperVariant={paperVariant}
                accentColor={accentColor}
                textColor={palette.ink}
                indexBadge={`${i + 1} of ${data.headlines.length}`}
                frame={frame}
                startFrame={range.startFrame}
              />
            </div>
          );
        })}

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
      </AbsoluteFill>
    </Background>
  );
};

// ── NewspaperPage ──────────────────────────────────────────────────────────

const NewspaperPage: React.FC<{
  headline: NewspaperHeadline;
  width: number;
  height: number;
  paperVariant: "newsprint";
  accentColor: string;
  textColor: string;
  indexBadge: string;
  frame: number;
  startFrame: number;
}> = ({
  headline,
  width,
  height,
  accentColor,
  textColor,
  indexBadge,
  frame,
  startFrame,
}) => {
  const localFrame = frame - startFrame;
  const headlineOpacity = fadeIn(localFrame, sec(0.3), sec(0.5));
  const deckOpacity = fadeIn(localFrame, sec(0.55), sec(0.5));
  const datelineOpacity = fadeIn(localFrame, sec(0.1), sec(0.4));

  return (
    <ArchivalPaper
      width={width}
      height={height}
      variant="newsprint"
      aged={0.32}
      seed={(width + height) % 19}
    >
      <div
        style={{
          padding: "48px 64px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Masthead crop — real scanned image (NOT typeset). */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            marginBottom: 28,
            borderBottom: "1.5px solid rgba(28,24,20,0.45)",
            paddingBottom: 18,
          }}
        >
          {headline.mastheadImageUrl ? (
            <Img
              src={resolveAssetSrc(headline.mastheadImageUrl)}
              style={{
                maxWidth: "85%",
                maxHeight: 140,
                objectFit: "contain",
                filter: "saturate(0.85)",
              }}
            />
          ) : headline.publicationName ? (
            <div
              style={{
                fontFamily: fonts.serifBody,
                fontSize: fontSizes.h2,
                fontWeight: fontWeights.semibold,
                color: textColor,
                letterSpacing: -1,
              }}
            >
              {headline.publicationName}
            </div>
          ) : null}
        </div>

        {/* Dateline strip. */}
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.caption,
            color: textColor,
            opacity: datelineOpacity * 0.7,
            textTransform: "uppercase",
            letterSpacing: 2,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          {headline.dateline}
        </div>

        {/* Headline — editorial gloss (typeset in Plex Sans, NOT meant to
            match the page's own typography). */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: fontSizes.h1,
              fontWeight: fontWeights.semibold,
              color: textColor,
              lineHeight: 1.05,
              textAlign: "center",
              letterSpacing: -1,
              opacity: headlineOpacity,
            }}
          >
            {headline.headlineText}
          </div>
          {headline.deck && (
            <div
              style={{
                fontFamily: fonts.serifBody,
                fontStyle: "italic",
                fontSize: fontSizes.body,
                color: textColor,
                opacity: deckOpacity * 0.8,
                textAlign: "center",
                marginTop: 18,
                lineHeight: 1.35,
              }}
            >
              {headline.deck}
            </div>
          )}
        </div>

        {/* Index badge — bottom-right hairline corner mark. */}
        <div
          style={{
            position: "absolute",
            bottom: 18,
            right: 24,
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            color: accentColor,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            opacity: 0.85,
          }}
        >
          {indexBadge}
        </div>
      </div>
    </ArchivalPaper>
  );
};

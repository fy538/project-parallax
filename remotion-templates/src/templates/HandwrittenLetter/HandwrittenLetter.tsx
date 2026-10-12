/**
 * HandwrittenLetter — handwritten-correspondence visualisation.
 *
 * Two modes:
 *   • photograph (canonical) — the actual letter image holds still; the
 *     camera slowly pans across it (Ken Burns), with a side transcription
 *     column fading in paragraph-by-paragraph synced to narration.
 *   • typeset (fallback)     — letter text in script font on aged paper;
 *     paragraphs fade in (or write-on with `inkTrail: true`).
 *
 * Documentary canon: the artifact IS the argument. Burns, Curtis, Morris
 * all hold the real image still and let the camera do the moving. Typeset
 * mode is the fallback when no archival photograph exists.
 *
 * @composition-animation: useCompositionAnimation({ noDrift: true })
 *   Camera motion is owned by the Ken Burns logic inside this template (in
 *   photograph mode). No outer Ken Burns drift on top — that would compete
 *   with the editorial motion.
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
import { useThemeMode } from "../../hooks/useThemeMode";
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
import type { HandwrittenLetterData, HandwrittenParagraph } from "./types";

// ── Component ──────────────────────────────────────────────────────────────

export const HandwrittenLetter: React.FC<{ data: HandwrittenLetterData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const fps = layout.fps;
  const t = frame / fps;
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();

  const renderMode = data.mode ?? "photograph";
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

        {/* Main composition — photograph OR typeset mode */}
        {renderMode === "photograph" ? (
          <PhotographMode
            data={data}
            t={t}
            frame={frame}
            fps={fps}
            theme={theme}
            accentColor={accentColor}
            hasTitle={Boolean(data.title)}
          />
        ) : (
          <TypesetMode
            data={data}
            t={t}
            frame={frame}
            fps={fps}
            theme={theme}
            accentColor={accentColor}
            hasTitle={Boolean(data.title)}
          />
        )}

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
      </AbsoluteFill>
    </Background>
  );
};

// ── Photograph mode ────────────────────────────────────────────────────────

interface ModeProps {
  data: HandwrittenLetterData;
  t: number;
  frame: number;
  fps: number;
  theme: ReturnType<typeof useThemeMode>;
  accentColor: string;
  hasTitle: boolean;
}

const PhotographMode: React.FC<ModeProps> = ({
  data,
  frame,
  fps,
  theme,
  accentColor,
  hasTitle,
}) => {
  const durationFrames = sec(data.durationSec ?? 16);
  // Hoist out of render body — data.paragraphs is stable across frames.
  const lastParagraphEndSec = useMemo(
    () => Math.max(...data.paragraphs.map((p) => p.appearAtSec + 1)),
    [data.paragraphs],
  );
  const kb = data.kenBurns ?? {};
  const fromZoom = kb.fromZoom ?? 1.0;
  const toZoom = kb.toZoom ?? 1.08;
  const panToX = kb.panToX ?? 0;
  const panToY = kb.panToY ?? 0;

  // Ken Burns interpolation across the full clip duration.
  const kbProgress = interpolate(
    frame,
    [0, durationFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.6, 1),
    },
  );
  const zoom = fromZoom + (toZoom - fromZoom) * kbProgress;
  const tx = panToX * kbProgress;
  const ty = panToY * kbProgress;

  // Layout: image takes 60% of canvas width on left, transcription column 35% on right.
  // edgeMargin is the symmetric side inset; it stays 80 (not the 108 generous tier)
  // because transcriptLeft = imageWidth + 100 assumes the image hugs this margin —
  // widening it to 108 would close the 20px gap and overlap the transcript column.
  const edgeMargin = 80;
  const topPad = hasTitle ? 220 : 120;
  const bottomPad = 120;
  const cardHeight = layout.height - topPad - bottomPad;
  const imageWidth = layout.width * 0.55;
  const transcriptLeft = imageWidth + 100;
  const transcriptWidth = layout.width - transcriptLeft - edgeMargin;

  return (
    <>
      {/* Left: archival image with Ken Burns. */}
      <div
        style={{
          position: "absolute",
          top: topPad,
          left: edgeMargin,
          width: imageWidth,
          height: cardHeight,
          overflow: "hidden",
          boxShadow: "0 8px 36px rgba(28,24,20,0.28)",
          background: palette.midnight,
        }}
      >
        {data.imageUrl && (
          <Img
            src={resolveAssetSrc(data.imageUrl)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${zoom}) translate(${tx}%, ${ty}%)`,
              transformOrigin: "center",
              filter: data.imageTreatment
                ? `sepia(${data.imageTreatment * 0.6}) saturate(${1 - data.imageTreatment * 0.4})`
                : undefined,
            }}
          />
        )}
        {/* Dateline strip overlaid at top of image. */}
        {data.dateline && (
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              padding: "6px 14px",
              background: "rgba(28,24,20,0.78)",
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: palette.bone,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {data.dateline}
          </div>
        )}
      </div>

      {/* Right: transcription column with paragraph fade-ins. */}
      <div
        style={{
          position: "absolute",
          top: topPad,
          left: transcriptLeft,
          width: transcriptWidth,
          height: cardHeight,
          overflow: "hidden",
        }}
      >
        {/* Salutation */}
        {data.salutation && (
          <div
            style={{
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: fontSizes.label,
              color: theme.text.secondary,
              marginBottom: 18,
              opacity: fadeIn(frame, 0, sec(0.6)),
            }}
          >
            {data.salutation}
          </div>
        )}
        {/* Paragraphs */}
        {data.paragraphs.map((p, i) => (
          <TranscriptParagraph
            key={`p-${i}`}
            paragraph={p}
            frame={frame}
            fps={fps}
            accentColor={accentColor}
            textColor={theme.text.primary}
          />
        ))}
        {/* Signature */}
        {data.signature && (
          <div
            style={{
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: fontSizes.label,
              color: theme.text.secondary,
              marginTop: 24,
              opacity: fadeIn(frame, sec(lastParagraphEndSec), sec(0.6)),
            }}
          >
            {data.signature}
          </div>
        )}
      </div>
    </>
  );
};

const TranscriptParagraph: React.FC<{
  paragraph: HandwrittenParagraph;
  frame: number;
  fps: number;
  accentColor: string;
  textColor: string;
}> = ({ paragraph, frame, accentColor, textColor }) => {
  const startFrame = sec(paragraph.appearAtSec);
  const opacity = fadeIn(frame, startFrame, sec(0.6));
  const isKey = paragraph.emphasis === "key";
  return (
    <div
      style={{
        fontFamily: fonts.serifBody,
        fontSize: isKey ? fontSizes.body : fontSizes.label,
        lineHeight: 1.45,
        color: textColor,
        marginBottom: 14,
        opacity,
        borderLeft: isKey ? `3px solid ${accentColor}` : undefined,
        paddingLeft: isKey ? 12 : 0,
      }}
    >
      {paragraph.text}
    </div>
  );
};

// ── Typeset mode ───────────────────────────────────────────────────────────

const TypesetMode: React.FC<ModeProps> = ({
  data,
  frame,
  fps,
  theme: _theme,
  accentColor,
  hasTitle,
}) => {
  // Hoist out of render body — data.paragraphs is stable across frames.
  const lastParagraphEndSec = useMemo(
    () => Math.max(...data.paragraphs.map((p) => p.appearAtSec + 1)),
    [data.paragraphs],
  );
  const topPad = hasTitle ? 240 : 120;
  const bottomPad = 140;
  const paperWidth = layout.width * 0.72;
  const paperHeight = layout.height - topPad - bottomPad;
  const paperLeft = (layout.width - paperWidth) / 2;
  const scriptFont = fonts.handwriting;
  const inkColor = "#1f1a14"; // ink brown-black

  return (
    <div
      style={{
        position: "absolute",
        top: topPad,
        left: paperLeft,
      }}
    >
      <ArchivalPaper
        width={paperWidth}
        height={paperHeight}
        variant="letter"
        aged={0.35}
        seed={7}
      >
        <div
          style={{
            padding: "72px 96px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {data.dateline && (
            <div
              style={{
                fontFamily: scriptFont,
                fontSize: fontSizes.body,
                color: inkColor,
                textAlign: "right",
                marginBottom: 24,
                opacity: fadeIn(frame, 0, sec(0.6)),
              }}
            >
              {data.dateline}
            </div>
          )}
          {data.salutation && (
            <div
              style={{
                fontFamily: scriptFont,
                fontSize: fontSizes.h3,
                color: inkColor,
                marginBottom: 18,
                opacity: fadeIn(frame, sec(0.4), sec(0.6)),
              }}
            >
              {data.salutation}
            </div>
          )}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {data.paragraphs.map((p, i) => (
              <TypesetParagraph
                key={`tp-${i}`}
                paragraph={p}
                frame={frame}
                fps={fps}
                scriptFont={scriptFont}
                inkColor={inkColor}
                accentColor={accentColor}
                inkTrail={data.inkTrail ?? false}
              />
            ))}
          </div>
          {data.signature && (
            <div
              style={{
                fontFamily: scriptFont,
                fontSize: fontSizes.h3,
                color: inkColor,
                textAlign: "right",
                marginTop: 24,
                opacity: fadeIn(frame, sec(lastParagraphEndSec), sec(0.6)),
                whiteSpace: "pre-line",
              }}
            >
              {data.signature}
            </div>
          )}
        </div>
      </ArchivalPaper>
    </div>
  );
};

const TypesetParagraph: React.FC<{
  paragraph: HandwrittenParagraph;
  frame: number;
  fps: number;
  scriptFont: string;
  inkColor: string;
  accentColor: string;
  inkTrail: boolean;
}> = ({ paragraph, frame, scriptFont, inkColor, accentColor, inkTrail }) => {
  const startFrame = sec(paragraph.appearAtSec);
  const opacity = fadeIn(frame, startFrame, sec(inkTrail ? 1.2 : 0.6));
  const isKey = paragraph.emphasis === "key";
  // Ink-trail effect (subtle): mask the paragraph from left-to-right as it
  // fades in, simulating a pen sweeping across. Only when `inkTrail: true`.
  const trail = inkTrail
    ? interpolate(
        frame,
        [startFrame, startFrame + sec(1.4)],
        [0, 100],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 100;
  return (
    <div
      style={{
        fontFamily: scriptFont,
        fontSize: isKey ? fontSizes.h3 : fontSizes.body + 6,
        lineHeight: 1.45,
        color: isKey ? accentColor : inkColor,
        marginBottom: 16,
        opacity,
        WebkitMaskImage: inkTrail
          ? `linear-gradient(to right, black 0%, black ${trail}%, transparent ${trail + 8}%, transparent 100%)`
          : undefined,
      }}
    >
      {paragraph.text}
    </div>
  );
};

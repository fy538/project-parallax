/**
 * TitleTransition — episode titles, section dividers, and end cards.
 *
 * Clean cinematic text with smooth fade and scale animations.
 * Designed for the ~2-5 second transitions between video sections.
 *
 * EP01 use cases: Episode title card, "Act I / Act II" dividers, end CTA.
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { palette, dark, semantic, fonts, fontSizes, layout, sec } from "../../design/theme";
import { fadeIn, fadeOut, slideIn } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { Background } from "../../components/Background";
import type { TitleTransitionData } from "./types";

// ── Episode title variant ──────────────────────────────────────────────────

const EpisodeTitleVariant: React.FC<{
  data: TitleTransitionData;
  frame: number;
  totalFrames: number;
}> = ({ data, frame, totalFrames }) => {
  const accentColor = data.accentColor || palette.amber;
  const { style: compStyle } = useCompositionAnimation({ noExit: true });

  // Fade out near end
  const outOpacity = fadeOut(frame, totalFrames, sec(0.5));

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
      {/* Episode label */}
      {data.episodeLabel && (
        <div
          style={{
            fontSize: fontSizes.label,
            color: accentColor,
            letterSpacing: 6,
            textTransform: "uppercase",
            fontFamily: fonts.mono,
            fontWeight: 600,
            marginBottom: 20,
            opacity: fadeIn(frame, sec(0.3), sec(0.5)),
          }}
        >
          {data.episodeLabel}
        </div>
      )}

      {/* Series name */}
      {data.seriesName && (
        <div
          style={{
            fontSize: fontSizes.caption,
            color: dark.text.muted,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 16,
            opacity: fadeIn(frame, sec(0.2), sec(0.5)),
          }}
        >
          {data.seriesName}
        </div>
      )}

      {/* Title line */}
      <div
        style={{
          fontSize: fontSizes.title,
          fontWeight: 700,
          color: dark.text.primary,
          fontFamily: fonts.heading,
          textAlign: "center",
          maxWidth: 1400,
          lineHeight: 1.2,
          opacity: fadeIn(frame, sec(0.5), sec(0.6)),
          transform: `translateY(${slideIn(frame, sec(0.5), 24, sec(0.6))}px)`,
        }}
      >
        {data.title}
      </div>

      {/* Accent divider */}
      <div
        style={{
          width: interpolate(
            frame,
            [sec(1.2), sec(1.8)],
            [0, 120],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
          height: 3,
          backgroundColor: accentColor,
          marginTop: 32,
          marginBottom: 32,
        }}
      />

      {/* Subtitle */}
      {data.subtitle && (
        <div
          style={{
            fontSize: fontSizes.h3,
            color: dark.text.muted,
            fontWeight: 400,
            textAlign: "center",
            maxWidth: 1100,
            lineHeight: 1.4,
            opacity: fadeIn(frame, sec(1.5), sec(0.5)),
            transform: `translateY(${slideIn(frame, sec(1.5), 16, sec(0.5))}px)`,
          }}
        >
          {data.subtitle}
        </div>
      )}
    </div>
  );
};

// ── Section divider variant ────────────────────────────────────────────────

const SectionVariant: React.FC<{
  data: TitleTransitionData;
  frame: number;
  totalFrames: number;
}> = ({ data, frame, totalFrames }) => {
  const accentColor = data.accentColor || palette.amber;
  const outOpacity = fadeOut(frame, totalFrames, sec(0.4));

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
      {/* Section number — large, muted */}
      {data.sectionNumber && (
        <div
          style={{
            fontSize: 120,
            fontWeight: 200,
            color: `${accentColor}40`,
            fontFamily: fonts.mono,
            lineHeight: 1,
            opacity: fadeIn(frame, sec(0.1), sec(0.4)),
          }}
        >
          {data.sectionNumber}
        </div>
      )}

      {/* Section title */}
      {data.sectionTitle && (
        <div
          style={{
            fontSize: fontSizes.h1,
            fontWeight: 600,
            color: dark.text.primary,
            fontFamily: fonts.heading,
            marginTop: 16,
            opacity: fadeIn(frame, sec(0.4), sec(0.5)),
            transform: `translateY(${slideIn(frame, sec(0.4), 20, sec(0.5))}px)`,
          }}
        >
          {data.sectionTitle}
        </div>
      )}

      {/* Underline accent */}
      <div
        style={{
          width: interpolate(
            frame,
            [sec(0.8), sec(1.2)],
            [0, 80],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
          height: 2,
          backgroundColor: accentColor,
          marginTop: 20,
        }}
      />
    </div>
  );
};

// ── End card variant ───────────────────────────────────────────────────────

const EndCardVariant: React.FC<{
  data: TitleTransitionData;
  frame: number;
  totalFrames: number;
}> = ({ data, frame, totalFrames }) => {
  const accentColor = data.accentColor || palette.amber;

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
      {/* CTA text */}
      {data.ctaText && (
        <div
          style={{
            fontSize: fontSizes.h2,
            color: dark.text.primary,
            fontWeight: 500,
            textAlign: "center",
            opacity: fadeIn(frame, sec(0.5), sec(0.5)),
          }}
        >
          {data.ctaText}
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          width: interpolate(
            frame,
            [sec(1), sec(1.5)],
            [0, 60],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
          height: 2,
          backgroundColor: accentColor,
          marginTop: 28,
          marginBottom: 28,
        }}
      />

      {/* Next episode teaser */}
      {data.nextEpisodeTeaser && (
        <div
          style={{
            fontSize: fontSizes.body,
            color: dark.text.muted,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.5,
            opacity: fadeIn(frame, sec(1.5), sec(0.5)),
            transform: `translateY(${slideIn(frame, sec(1.5), 12, sec(0.5))}px)`,
          }}
        >
          Next: {data.nextEpisodeTeaser}
        </div>
      )}

      {/* Episode label */}
      <div
        style={{
          position: "absolute",
          bottom: layout.safeArea.bottom,
          fontSize: fontSizes.label,
          color: dark.text.muted,
          letterSpacing: 2,
          textTransform: "uppercase",
          opacity: fadeIn(frame, sec(0.3), sec(0.5)),
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
  const bgVariant = data.backgroundVariant || "dark";
  const totalFrames = sec(data.durationSec || 4);

  return (
    <Background variant={bgVariant}>
      {data.variant === "episode-title" && (
        <EpisodeTitleVariant data={data} frame={frame} totalFrames={totalFrames} />
      )}
      {data.variant === "section" && (
        <SectionVariant data={data} frame={frame} totalFrames={totalFrames} />
      )}
      {data.variant === "end-card" && (
        <EndCardVariant data={data} frame={frame} totalFrames={totalFrames} />
      )}
    </Background>
  );
};

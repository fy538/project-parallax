/**
 * FooterStrip — bottom intelligence-briefing strip per BRAND.md.
 *
 * Layout:
 *   ● REC · {runtime}     {scale or subject}     FILED {date}
 *   IBM Plex Mono, 11px, letter-spacing 2-3px, muted color.
 *
 * The REC dot pulses subtly (1Hz) for the recording-feed feel. Runtime
 * is computed from the current frame; date defaults to today's date but
 * can be overridden per episode.
 *
 * Source attribution lives separately (SourceAttribution component) so
 * footer + source can coexist without competing.
 */

import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { fonts, fontSizes, layout, palette, sec, shadows } from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";
import { fadeIn, slideIn } from "../utils/animation";

export interface FooterStripProps {
  /** Center-positioned label — usually scale, subject, or location. */
  scale?: string;
  /** Override "FILED" date string. Defaults to today (YYYY-MM-DD). */
  filedDate?: string;
  /** Hide the REC indicator (some compositions don't want the recording feel). */
  hideRec?: boolean;
  /** Mode for color resolution. Defaults to "light". */
  mode?: "light" | "dark";
  /** When the strip should appear, in seconds from comp start. Default 0. */
  startSec?: number;
}

const formatRuntime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const formatToday = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const FooterStrip: React.FC<FooterStripProps> = React.memo(
  ({ scale, filedDate, hideRec = false, mode = "light", startSec = 0 }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const theme = useThemeMode(mode);
    const startFrame = sec(startSec);
    const opacity = fadeIn(frame, startFrame, sec(0.6));
    const slideY = slideIn(frame, startFrame, -6, sec(0.5)); // up from below

    const runtime = formatRuntime(frame / fps);
    const date = filedDate || formatToday();

    // REC dot pulses at ~1Hz
    const recPulse = 0.55 + 0.35 * Math.sin(frame / fps * Math.PI * 2);

    const recColor = mode === "dark" ? palette.rust : palette.oxblood;

    return (
      <div
        style={{
          position: "absolute",
          bottom: layout.safeArea.bottom,
          left: layout.safeArea.left,
          right: layout.safeArea.right,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity,
          transform: `translateY(${slideY}px)`,
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        {/* Left: REC + runtime */}
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            fontWeight: 400,
            color: theme.text.muted,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            textShadow: shadows.textLift,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {!hideRec && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: recColor,
                opacity: recPulse,
                boxShadow: `0 0 4px ${recColor}80`,
              }}
            />
          )}
          {!hideRec && <span style={{ color: recColor, opacity: 0.85 }}>REC</span>}
          {!hideRec && <span style={{ opacity: 0.5 }}>·</span>}
          <span>{runtime}</span>
        </div>

        {/* Center: scale / subject */}
        {scale && (
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.meta,
              fontWeight: 400,
              color: theme.text.muted,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              textShadow: shadows.textLift,
            }}
          >
            {scale}
          </div>
        )}

        {/* Right: FILED date */}
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            fontWeight: 400,
            color: theme.text.muted,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            textShadow: shadows.textLift,
          }}
        >
          FILED {date}
        </div>
      </div>
    );
  }
);

FooterStrip.displayName = "FooterStrip";

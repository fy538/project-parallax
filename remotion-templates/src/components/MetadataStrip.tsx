/**
 * MetadataStrip — branded header + footer chrome for compositions.
 *
 * Header: ∴ STRUCTURAL · PARALLELS | EP.XX — EPISODE TITLE
 * Footer: ● REC | 1:150,000 | FILED 2026-04-25
 *
 * Uses IBM Plex Mono at meta size (11px, tracking 2.5px) per BRAND.md.
 * Positioned within the 80px safe area — does not compete with content.
 *
 * Usage:
 *   <MetadataStrip
 *     episodeNumber={1}
 *     episodeTitle="THE SILICON TRAP"
 *     date="2026-04-25"
 *     scale="1:150,000"
 *     variant="dark"
 *   />
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import { AbsoluteFill } from "remotion";
import {
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  dark,
  light,
  palette,
  layout,
  durations,
} from "../design/theme";
import { fadeIn } from "../utils/animation";

interface MetadataStripProps {
  episodeNumber?: number;
  episodeTitle?: string;
  date?: string;
  scale?: string;
  variant?: "dark" | "light";
  /** Hide header (default: show) */
  noHeader?: boolean;
  /** Hide footer (default: show) */
  noFooter?: boolean;
  /** Delay before strip fades in (frames) */
  startFrame?: number;
}

export const MetadataStrip: React.FC<MetadataStripProps> = ({
  episodeNumber,
  episodeTitle,
  date,
  scale,
  variant = "dark",
  noHeader = false,
  noFooter = false,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const isDark = variant === "dark";
  const mode = isDark ? dark : light;

  const opacity = fadeIn(frame, startFrame, durations.fadeIn);

  // Common text style for all metadata text
  const metaStyle: React.CSSProperties = {
    fontFamily: fonts.body, // IBM Plex Mono
    fontSize: fontSizes.meta,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.meta,
    lineHeight: 1,
    textTransform: "uppercase" as const,
  };

  // Episode label: "EP.01 — THE SILICON TRAP"
  const epLabel = episodeNumber
    ? `EP.${String(episodeNumber).padStart(2, "0")}${episodeTitle ? ` — ${episodeTitle}` : ""}`
    : null;

  // Date label: "FILED 2026-04-25"
  const dateLabel = date ? `FILED ${date}` : null;

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      {/* ── Header ─────────────────────────────────────────── */}
      {!noHeader && (
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top - 40,
            left: layout.safeArea.left,
            right: layout.safeArea.right,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand mark + channel name */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                ...metaStyle,
                color: mode.mark,
                fontSize: 14,
                fontWeight: fontWeights.bold,
              }}
            >
              ∴
            </span>
            <span style={{ ...metaStyle, color: mode.text.muted }}>
              STRUCTURAL
            </span>
            <span
              style={{
                ...metaStyle,
                color: mode.text.muted,
                opacity: 0.4,
                margin: "0 2px",
              }}
            >
              ·
            </span>
            <span style={{ ...metaStyle, color: mode.text.muted }}>
              PARALLELS
            </span>
          </div>

          {/* Episode info */}
          {epLabel && (
            <span style={{ ...metaStyle, color: mode.text.muted }}>
              {epLabel}
            </span>
          )}
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      {!noFooter && (
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom - 40,
            left: layout.safeArea.left,
            right: layout.safeArea.right,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* REC indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: isDark ? palette.rust : palette.oxblood,
                // Subtle pulse via opacity would need useCurrentFrame — keep static for now
              }}
            />
            <span style={{ ...metaStyle, color: mode.text.muted }}>REC</span>
          </div>

          {/* Center: scale */}
          {scale && (
            <span style={{ ...metaStyle, color: mode.text.muted }}>
              {scale}
            </span>
          )}

          {/* Right: filed date */}
          {dateLabel && (
            <span style={{ ...metaStyle, color: mode.text.muted }}>
              {dateLabel}
            </span>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

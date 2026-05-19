/**
 * MathReveal — full-screen reveal of a single equation. Phase 1 of the
 * math-rendering register (`project/MATH_RENDER_REGISTER.md`, written in
 * Phase 4).
 *
 * Editorial intent: "smart friend deriving something on a napkin in
 * front of you." The equation reveals left-to-right via a clip-path mask
 * — the same `reveal-mask` primitive used elsewhere in the text-animation
 * register, applied to TeX-rendered math. After the sweep settles, an
 * optional Plex-Mono caption translates the notation into prose; an
 * optional source line credits where the equation comes from.
 *
 * Layout:
 *
 *       [ TITLE ]            ← (optional, via TitleBlock — content area top)
 *
 *       ────────────────
 *         𝔼[U_i] = pa + (1-p)b           ← math, centered, reveal-masked
 *       ────────────────
 *
 *       cooperation utility under prob p ← caption (Plex Mono, muted)
 *
 *                                          source (Plex Mono, bottom)
 *
 * Drives off `compositionBase`'s standard editorial-shell fields. Hold
 * motion defaults to `"breathing"` (HOLD_MOTION_REGISTER Register B,
 * same as StatReveal — the equation should read alive, not static).
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts, fontSizes, layout, palette, sec } from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useTemplateLayout } from "../../hooks/useTemplateLayout";
import { exitFade, fadeIn, CLAMP_CUBIC } from "../../utils/animation";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { MathExpression } from "../../components/MathExpression";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { interpolate } from "remotion";
import type { MathRevealData } from "./types";

const DEFAULT_REVEAL_SEC = 1.2;
const DEFAULT_FONT_SIZE = 72;
const ENTRANCE_OUTRO_FRAMES_SEC = 1.5;

export const MathReveal: React.FC<{ data: MathRevealData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = useThemeMode(data.backgroundVariant);
  // Same default as StatReveal — single-hero compositions read better
  // with the gentle breathing drift during the post-reveal hold.
  const direction = useDirection(data._direction, "breathing");
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  // Layout: full content area below the title. We center the equation
  // both axes and stack caption + source below it.
  useTemplateLayout({ title: data.title ? "content" : "none", safeArea: "generous" });

  // ── Timing (track in seconds where it's exposed via props; convert via
  //     `sec()` for frame-based interpolate/fadeIn calls) ─────────────────
  const titleStartSec = 0.2;
  const titleSettleSec = 0.6;
  // Math starts revealing 0.3s after title settles so the eye can move down.
  const mathStartSec = data.title ? titleStartSec + titleSettleSec + 0.3 : 0.3;
  const revealSecValue = data.revealSec ?? DEFAULT_REVEAL_SEC;
  const captionStartSec = mathStartSec + revealSecValue + 0.4;
  const sourceStartSec = captionStartSec + 0.5;
  const outroFrames = sec(ENTRANCE_OUTRO_FRAMES_SEC);

  // Reveal progress (0 → 1) drives the clip-path mask in <MathExpression>.
  // Cubic ease matches the channel's other editorial reveals.
  const reveal = interpolate(
    frame,
    [sec(mathStartSec), sec(mathStartSec + revealSecValue)],
    [0, 1],
    CLAMP_CUBIC,
  );

  // ── Exit fade (whole composition) ───────────────────────────────────────
  const exit = exitFade(frame, durationInFrames, outroFrames);

  // Caption fades in 0.4s after math finishes revealing. Source uses
  // SourceAttribution's own fade-in (driven by its `startSec` prop).
  const captionOpacity = data.caption
    ? fadeIn(frame, sec(captionStartSec), sec(0.5)) * exit
    : 0;

  // ── Computed visual constants ───────────────────────────────────────────
  const display = data.display ?? true;
  const fontSize = data.fontSize ?? DEFAULT_FONT_SIZE;
  // Caption color picks up the theme's muted text — same register as
  // FooterStrip metadata.
  const captionColor = theme.text.muted;

  // ── Memoised math-component to avoid re-render on every frame ───────────
  // The KaTeX render is pure-CPU; useMemo keeps it off the per-frame path.
  // (reveal changes per-frame, but the inner DOM is identical — only the
  // clip-path style updates.)
  const formulaSlug = useMemo(() => data.formula, [data.formula]);

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
      <AbsoluteFill style={{ ...compStyle, opacity: exit }}>

        {/* Brand chrome */}
        <HeaderStrip mode={data.backgroundVariant === "dark" ? "dark" : "light"} />
        <FooterStrip mode={data.backgroundVariant === "dark" ? "dark" : "light"} />

        {/* Optional editorial title */}
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={data.backgroundVariant === "dark" ? "dark" : "light"}
            startFrame={sec(titleStartSec)}
            safeAreaTier="generous"
          />
        )}

        {/* Math + caption stack — centered absolutely on the frame */}
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            // When a title is present, nudge the math down slightly so
            // the title doesn't crowd it.
            paddingTop: data.title ? layout.spacing.xxxl * 2 : 0,
          }}
        >
          <MathExpression
            formula={formulaSlug}
            reveal={reveal}
            fontSize={fontSize}
            display={display}
            color={palette.ink}
          />

          {data.caption && (
            <div
              style={{
                marginTop: layout.spacing.lg,
                fontFamily: fonts.mono,
                fontSize: fontSizes.body,
                color: captionColor,
                letterSpacing: 0.5,
                textAlign: "center",
                maxWidth: layout.width - layout.safeArea.left * 2 - 80,
                opacity: captionOpacity,
              }}
            >
              {data.caption}
            </div>
          )}
        </AbsoluteFill>

        {/* Source attribution — bottom of frame, above FooterStrip. The
            component owns its own fade-in via `startSec`. Exit fade is
            inherited through the AbsoluteFill wrapper's opacity. */}
        {data.source && (
          <SourceAttribution
            source={data.source}
            mode={data.backgroundVariant === "dark" ? "dark" : "light"}
            startSec={sourceStartSec}
            bottomOffset={48}
          />
        )}
      </AbsoluteFill>
    </Background>
  );
};

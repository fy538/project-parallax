/**
 * MathDerivation — full-screen multi-step derivation chain.
 *
 * Phase 2 of the math-rendering register (Phase 4 doctrine doc:
 * project/MATH_RENDER_REGISTER.md). The "derivation IS the argument"
 * editorial move — show a Bayesian update or a payoff dominance proof
 * unfold step by step, with each line replacing the previous via a
 * cubic-eased crossfade.
 *
 * Layout:
 *
 *       [ TITLE ]                       ← optional editorial title
 *
 *         STEP 2 OF 4                   ← Plex Mono step counter (auto)
 *
 *         𝔼[U] = p(a - b) + b           ← current step's formula
 *
 *         "Factor out b"                ← current step's annotation
 *
 *                                          source attribution (bottom)
 *
 * Differs from MathReveal: that template shows ONE equation with a
 * left-to-right reveal mask. This template shows N equations in
 * sequence, each one fully visible, with crossfades between them.
 * Different editorial intent: MathReveal lands a single formal claim;
 * MathDerivation walks through a proof or worked example.
 */

import React, { useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts, fontSizes, layout, palette, sec } from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useTemplateLayout } from "../../hooks/useTemplateLayout";
import { exitFade, fadeIn } from "../../utils/animation";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import {
  MathCrossfade,
  activeStepIndex,
} from "../../components/MathCrossfade";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import type { MathDerivationData } from "./types";

const DEFAULT_CROSSFADE_SEC = 0.5;
const DEFAULT_FONT_SIZE = 56;
const ENTRANCE_OUTRO_FRAMES_SEC = 1.5;

export const MathDerivation: React.FC<{ data: MathDerivationData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = useThemeMode(data.backgroundVariant);
  const direction = useDirection(data._direction, "breathing");
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  useTemplateLayout({ title: data.title ? "content" : "none", safeArea: "generous" });

  // ── Active step index — drives the step counter UI ──────────────────────
  // Mirrors MathCrossfade's internal calculation. We compute here directly
  // (instead of via the component's onActiveStepChange callback) so the
  // counter reflects the same frame the math is rendering.
  const active = activeStepIndex(data.steps, frame);

  // For the annotation, we crossfade between annotations the same way
  // MathCrossfade does the math. Store the active annotation; React's
  // own state is overkill — we just compute opacity per-step here.
  const [/* unused placeholder for active-change callbacks */, ] = useState(active);

  // ── Timing ──────────────────────────────────────────────────────────────
  const titleStartSec = 0.2;
  const titleSettleSec = 0.6;
  const counterFadeInSec = data.title ? titleStartSec + titleSettleSec + 0.2 : 0.3;
  const sourceStartSec = 1.0;
  const outroFrames = sec(ENTRANCE_OUTRO_FRAMES_SEC);

  // ── Exit fade (whole composition) ───────────────────────────────────────
  const exit = exitFade(frame, durationInFrames, outroFrames);
  const counterOpacity = fadeIn(frame, sec(counterFadeInSec), sec(0.4)) * exit;

  const display = data.display ?? true;
  const fontSize = data.fontSize ?? DEFAULT_FONT_SIZE;
  const crossfadeSec = data.crossfadeSec ?? DEFAULT_CROSSFADE_SEC;
  const showCounter = data.showStepCounter ?? true;

  // Annotation comes from the active step. We render only the current
  // step's annotation (no crossfade on the prose — keeps the reading
  // surface simple; the visual crossfade is on the math).
  const activeStep = data.steps[active];

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
        <HeaderStrip mode={data.backgroundVariant === "dark" ? "dark" : "light"} />
        <FooterStrip mode={data.backgroundVariant === "dark" ? "dark" : "light"} />

        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={data.backgroundVariant === "dark" ? "dark" : "light"}
            startFrame={sec(titleStartSec)}
            safeAreaTier="generous"
          />
        )}

        {/* Center stack: step counter / math / annotation */}
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: layout.spacing.md,
            paddingTop: data.title ? layout.spacing.xxxl * 2 : 0,
          }}
        >
          {showCounter && data.steps.length > 1 && (
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.meta,
                letterSpacing: 3,
                color: theme.text.muted,
                textTransform: "uppercase",
                opacity: counterOpacity,
              }}
            >
              Step {active + 1} of {data.steps.length}
            </div>
          )}

          <MathCrossfade
            steps={data.steps}
            fontSize={fontSize}
            crossfadeSec={crossfadeSec}
            display={display}
            color={palette.ink}
          />

          {activeStep.annotation && (
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.body,
                color: theme.text.muted,
                letterSpacing: 0.5,
                textAlign: "center",
                maxWidth: layout.width - layout.safeArea.left * 2 - 80,
                // Annotation fades in 0.3s into each step. Use the same
                // `active`-driven approach: each step's annotation appears
                // with its own fade keyed off the step's startFrame.
                // For simplicity, use a global fade-in keyed off the
                // composition start; per-step fade is a Phase 3 polish.
                opacity: fadeIn(frame, sec(counterFadeInSec + 0.3), sec(0.4)) * exit,
              }}
            >
              {activeStep.annotation}
            </div>
          )}
        </AbsoluteFill>

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

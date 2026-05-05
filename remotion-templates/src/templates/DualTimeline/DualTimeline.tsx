/**
 * @deprecated Use HorizontalTimeline instead. This template uses a static vertical
 * dot-line-card layout. HorizontalTimeline provides cinematic horizontal camera tracking,
 * depth-of-field focus isolation, and configurable modes (single/dual/morph) that replace
 * all three legacy timeline templates.
 *
 * DualTimeline — Two parallel timelines with cinematic crossfade intercutting.
 *
 * Animation sequence:
 * 1. Intro: Title + era labels fade in
 * 2. Era A Focus: Left brightens, right dims; era A events reveal with stagger
 * 3. Crossfade: Opacity crossfade between eras
 * 4. Era B Focus: Right brightens, left dims; era B events reveal with stagger
 * 5. Pullback: Both brighten; connecting lines draw between paired events
 * 6. Exit: Fade out
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  cardPresets,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useDirection } from "../../hooks/useDirection";
import {
  fadeIn,
  slideIn,
  stagger,
  exitFade,
  CLAMP,
  CLAMP_QUAD,
  CLAMP_CUBIC,
  CLAMP_CUBIC_INOUT,
} from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useTemplateLayout } from "../../hooks/useTemplateLayout";
import { usePhase } from "../../hooks/usePhase";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import type { DualTimelineData, DualTimelineEvent } from "./types";

// ── Single event card ───────────────────────────────────────────────────────

const EventCard: React.FC<{
  event: DualTimelineEvent;
  frame: number;
  startFrame: number;
  accentColor: string;
  durationInFrames: number;
  mode: "light" | "dark";
}> = React.memo(({ event, frame, startFrame, accentColor, durationInFrames, mode }) => {
  const theme = useThemeMode(mode);
  const cardOpacity = fadeIn(frame, startFrame, sec(0.5));
  const offsetY = slideIn(frame, startFrame, 24, sec(0.5));
  const exitOpacity = exitFade(frame, durationInFrames, 15);

  return (
    <div
      style={{
        opacity: cardOpacity * exitOpacity,
        transform: `translateY(${offsetY}px)`,
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: layout.spacing.sm,
        marginBottom: layout.spacing.lg,
      }}
    >
      {/* Timeline dot + line */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          width: 24,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: accentColor,
            boxShadow: `0 0 10px ${accentColor}80`,
          }}
        />
        <div
          style={{
            width: 3,
            flex: 1,
            minHeight: 40,
            backgroundColor: `${accentColor}60`,
          }}
        />
      </div>

      {/* Content card — accent edge: left line + tint, no full border */}
      <div
        style={{
          flex: 1,
          ...cardPresets.accentEdge(accentColor, mode === "dark"),
        }}
      >
        <div
          style={{
            fontSize: fontSizes.label,
            color: accentColor,
            fontWeight: 600,
            marginBottom: layout.spacing.xs,
            fontFamily: fonts.mono,
            textShadow: shadows.textLift,
          }}
        >
          {event.label}
        </div>
        <div
          style={{
            fontSize: fontSizes.body,
            color: theme.text.primary,
            fontWeight: 500,
            lineHeight: 1.4,
            textShadow: shadows.textLift,
          }}
        >
          {event.text}
        </div>
      </div>
    </div>
  );
});

// ── Main component ──────────────────────────────────────────────────────────

export const DualTimeline: React.FC<{
  data: DualTimelineData;
}> = ({ data }) => {
  const frame = useCurrentFrame();
  const mode = (data.backgroundVariant || "light") as "light" | "dark";
  const theme = useThemeMode(mode);
  const direction = useDirection(data._direction);
  const { durationInFrames } = useVideoConfig();
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  // ── Layout zones — replaces manual contentArea() math ──────────────
  const { zones } = useTemplateLayout({
    title: "minimal",     // h3-height title (single line era headers)
    safeArea: "generous",
    split: true,          // left/right columns
    splitGap: layout.spacing.md,
    footerHeight: 40,
  });

  // Phase manager
  const { phase, getPhaseStart } = usePhase([
    { name: "intro", duration: sec(1) },
    { name: "eraA", duration: sec(3.5) },
    { name: "crossfade", duration: sec(0.5) },
    { name: "eraB", duration: sec(3.5) },
    { name: "pullback", duration: sec(1.5) },
    { name: "exit", duration: sec(0.5) },
  ]);

  const eraAColor = data.eraAColor || "#3266AD";
  const eraBColor = data.eraBColor || "#C23B22";

  // Column focus opacity (crossfade between eras)
  // Computed directly — no useMemo, since frame changes every render anyway.
  let eraAOpacity = 1.0;
  let eraBOpacity = 1.0;

  if (phase === "intro") {
    eraAOpacity = 0.4;
    eraBOpacity = 0.4;
  } else if (phase === "eraA") {
    eraAOpacity = 1.0;
    eraBOpacity = 0.2;
  } else if (phase === "crossfade") {
    eraAOpacity = interpolate(frame, [getPhaseStart("crossfade"), getPhaseStart("eraB")], [1.0, 0.2], CLAMP_CUBIC_INOUT);
    eraBOpacity = interpolate(frame, [getPhaseStart("crossfade"), getPhaseStart("eraB")], [0.2, 1.0], CLAMP_CUBIC_INOUT);
  } else if (phase === "eraB") {
    eraAOpacity = 0.2;
    eraBOpacity = 1.0;
  } else if (phase === "pullback") {
    eraAOpacity = interpolate(frame, [getPhaseStart("pullback"), getPhaseStart("exit")], [0.2, 1.0], CLAMP_CUBIC_INOUT);
    eraBOpacity = 1.0;
  }

  // Event stagger timing
  const eraAStartFrame = getPhaseStart("eraA");
  const eraBStartFrame = getPhaseStart("eraB");
  const eventStaggerDelay = sec(0.1);

  return (
    <Background
      variant={data.backgroundVariant || "light"}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={compStyle}>
        {/* All content in one transform context — compStyle handles drift.
            No inner kenBurnsDrift wrapper (L66: one drift per composition). */}

          {/* ── Title + subtitle — centralized TitleBlock ─────────────── */}
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={data.backgroundVariant || "light"}
            safeAreaTier="generous"
          />

          {/* ── Era column headers — uses zones.content top ────── */}
          <div
            style={{
              position: "absolute",
              top: zones.content.rect.top,
              left: zones.content.rect.left,
              width: zones.content.rect.width,
              display: "flex",
              justifyContent: "space-between",
              opacity: fadeIn(frame, sec(0.2), sec(0.6)),
            }}
          >
            <div
              style={{
                width: "47%",
                opacity: eraAOpacity,
              }}
            >
              <div
                style={{
                  fontSize: fontSizes.h3,
                  fontWeight: 700,
                  color: eraAColor,
                  fontFamily: fonts.heading,
                  textShadow: shadows.textLift,
                  transform: `translateY(${slideIn(frame, sec(0.3), 16, sec(0.5))}px)`,
                }}
              >
                {data.eraATitle}
              </div>
              <div
                style={{
                  height: 4,
                  background: `linear-gradient(90deg, ${eraAColor} 0%, ${eraAColor}80 70%, transparent 100%)`,
                  borderRadius: 2,
                  marginTop: layout.spacing.xs,
                  transform: `scaleX(${interpolate(frame, [sec(0.4), sec(1.0)], [0, 1], CLAMP_QUAD)})`,
                  transformOrigin: "left center",
                }}
              />
            </div>

            <div
              style={{
                width: "47%",
                opacity: eraBOpacity,
              }}
            >
              <div
                style={{
                  fontSize: fontSizes.h3,
                  fontWeight: 700,
                  color: eraBColor,
                  fontFamily: fonts.heading,
                  textShadow: shadows.textLift,
                  transform: `translateY(${slideIn(frame, sec(0.4), 16, sec(0.5))}px)`,
                }}
              >
                {data.eraBTitle}
              </div>
              <div
                style={{
                  height: 4,
                  background: `linear-gradient(90deg, ${eraBColor} 0%, ${eraBColor}80 70%, transparent 100%)`,
                  borderRadius: 2,
                  marginTop: layout.spacing.xs,
                  transform: `scaleX(${interpolate(frame, [sec(0.5), sec(1.1)], [0, 1], CLAMP_QUAD)})`,
                  transformOrigin: "left center",
                }}
              />
            </div>
          </div>

          {/* ── Timeline columns — offset below era headers ─────── */}
          <div
            style={{
              position: "absolute",
              top: zones.content.rect.top + layout.spacing.xl,
              left: zones.content.rect.left,
              width: zones.content.rect.width,
              bottom: zones.footer.rect.bottom + zones.footer.rect.height + layout.spacing.lg,
              display: "flex",
              justifyContent: "space-between",
              gap: layout.spacing.md,
              overflow: "hidden",
            }}
          >
            {/* Left column — Era A */}
            <div
              style={{
                width: "47%",
                opacity: eraAOpacity,
              }}
            >
              {data.pairs.map((pair, i) => (
                <EventCard
                  key={`a-${i}`}
                  event={pair.eraA}
                  frame={frame}
                  startFrame={stagger(i, eventStaggerDelay, eraAStartFrame)}
                  accentColor={eraAColor}
                  durationInFrames={durationInFrames}
                  mode={mode}
                />
              ))}
            </div>

            {/* Right column — Era B */}
            <div
              style={{
                width: "47%",
                opacity: eraBOpacity,
              }}
            >
              {data.pairs.map((pair, i) => (
                <EventCard
                  key={`b-${i}`}
                  event={pair.eraB}
                  frame={frame}
                  startFrame={stagger(i, eventStaggerDelay, eraBStartFrame)}
                  accentColor={eraBColor}
                  durationInFrames={durationInFrames}
                  mode={mode}
                />
              ))}
            </div>
          </div>

          {/* ── Connecting lines (pullback phase) ────────────────── */}
          {phase === "pullback" && (
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
            >
              {data.pairs.map((pair, i) => {
                const eventHeight = 160; // approximate height per event card
                const yPos = zones.content.rect.top + layout.spacing.xl + i * eventHeight + 60;

                const connectionStartFrame = getPhaseStart("pullback") + i * sec(0.15);
                const connectionDuration = sec(0.6);

                const connOpacity = interpolate(
                  frame,
                  [connectionStartFrame, connectionStartFrame + connectionDuration],
                  [0, 0.6],
                  CLAMP_CUBIC
                );

                const labelOpacity = interpolate(
                  frame,
                  [connectionStartFrame + sec(0.3), connectionStartFrame + connectionDuration],
                  [0, 1],
                  CLAMP_CUBIC
                );

                return (
                  <g key={`conn-${i}`} opacity={connOpacity}>
                    <path
                      d={`M 120 ${yPos} Q ${layout.width / 2} ${yPos} ${layout.width - 120} ${yPos}`}
                      stroke={theme.text.muted}
                      strokeWidth={1}
                      strokeDasharray="6 4"
                      fill="none"
                    />
                    {/* Connection label centered on the line */}
                    {pair.connection && (
                      <text
                        x={layout.width / 2}
                        y={yPos - 10}
                        textAnchor="middle"
                        fill={theme.text.accent}
                        fontSize={fontSizes.caption}
                        fontFamily={fonts.mono}
                        opacity={labelOpacity}
                      >
                        {pair.connection}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

        {/* ── Episode label — uses zones.footer ─────────────────────── */}
        {data.episode && (
          <div
            style={{
              position: "absolute",
              bottom: zones.footer.rect.bottom,
              left: zones.footer.rect.left,
              fontSize: fontSizes.label,
              color: theme.text.muted,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: fadeIn(frame, 0, sec(1)),
              transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
            }}
          >
            {data.episode}
          </div>
        )}
      </AbsoluteFill>
      {/* Brand strips */}
      <HeaderStrip mode={mode} metadata={data.episode} />
      <FooterStrip mode={mode} />
    </Background>
  );
};

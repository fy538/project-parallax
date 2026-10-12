/**
 * CounterfactualPath — actual + branching counterfactual paths.
 *
 * Horizontal timeline. Pre-branch trunk → vertical decision marker at
 * branchYear → actual path continues straight (solid gold), counterfactuals
 * arc up/down (dashed muted).
 *
 *                                      ╱──────────  [CF Up label]
 *  pre-branch  ──────●──────────────────────────────  [Actual label]
 *                  branch              ╲──────────  [CF Down label]
 *
 * Reveal sequence:
 *   t=0.4s   Trunk draws left → branch point
 *   t=1.8s   Branch-point marker scales in
 *   t=2.6s   Actual path draws + label fades
 *   t=4.0s   Counterfactual paths draw (in parallel) + labels fade
 *   t=6.0s   Caption (when present)
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
  fontSizes,
  fontWeights,
  fonts,
  layout,
  palette,
  sec,
  semantic,
} from "../../design/theme";
import { fadeIn } from "../../utils/animation";
import type { CounterfactualPathData } from "./types";

// ── Reveal timing ──────────────────────────────────────────────────────────

const T_TRUNK = 0.4;
const T_BRANCH = 1.8;
const T_ACTUAL = 2.6;
const T_COUNTERFACTUAL = 4.0;
const T_CAPTION = 6.0;

// ── Component ──────────────────────────────────────────────────────────────

export const CounterfactualPath: React.FC<{ data: CounterfactualPathData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);
  const emphasis = useEpisodeColorEmphasis();
  const accentColor = emphasis.primaryAccent ?? palette.gold;
  const counterColor = mode === "dark" ? palette.taupe : palette.walnut;

  // Layout — horizontal timeline.
  const topPad = data.title ? 240 : 180;
  const timelineY = topPad + 200;
  const trunkStart = 200;
  const branchX = layout.width * 0.32; // branch point at ~1/3 from left
  const pathEndX = layout.width - 360; // leave room for end labels
  const branchPointSize = 18;

  // Reveal envelopes.
  const trunkProgress = interpolate(
    frame,
    [sec(T_TRUNK), sec(T_TRUNK + 0.8)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const branchOpacity = fadeIn(frame, sec(T_BRANCH), sec(0.4));
  const branchScale = interpolate(
    frame,
    [sec(T_BRANCH), sec(T_BRANCH + 0.4)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(1.6)),
    },
  );
  const actualProgress = interpolate(
    frame,
    [sec(T_ACTUAL), sec(T_ACTUAL + 0.9)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const actualLabelOpacity = fadeIn(frame, sec(T_ACTUAL + 0.5), sec(0.6));
  const cfProgress = interpolate(
    frame,
    [sec(T_COUNTERFACTUAL), sec(T_COUNTERFACTUAL + 1.0)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const cfLabelOpacity = fadeIn(frame, sec(T_COUNTERFACTUAL + 0.6), sec(0.6));
  const captionOpacity = data.caption ? fadeIn(frame, sec(T_CAPTION), sec(0.6)) : 0;

  // Counterfactual arc params. The rise height needs to be ≥ ~180 so the
  // end-of-path labels (actual + up + down) don't crowd each other — each
  // label takes ~90px of vertical space (label + body + plausibility),
  // and we want ~30px of breathing room between them.
  const cfRiseHeight = 200;
  const cfPathLength = pathEndX - branchX;

  // Path geometry for each counterfactual.
  // Quadratic bezier: starts at (branchX, timelineY), arcs to (pathEndX, timelineY ± cfRiseHeight).
  function counterfactualPath(direction: "up" | "down"): string {
    const sign = direction === "up" ? -1 : 1;
    const endY = timelineY + sign * cfRiseHeight;
    const cpX = branchX + cfPathLength * 0.4;
    const cpY = timelineY + sign * cfRiseHeight * 0.8;
    return `M ${branchX} ${timelineY} Q ${cpX} ${cpY} ${pathEndX} ${endY}`;
  }

  // Each CF gets `direction` from its data, defaulting to alternating.
  const counterfactuals = data.counterfactuals.map((cf, i) => ({
    ...cf,
    resolvedDirection:
      cf.direction ?? (i === 0 ? "up" : "down") as "up" | "down",
  }));

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

        {/* SVG diagram. */}
        <svg
          width={layout.width}
          height={layout.height}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        >
          {/* Trunk (pre-branch). */}
          <line
            x1={trunkStart}
            y1={timelineY}
            x2={trunkStart + (branchX - trunkStart) * trunkProgress}
            y2={timelineY}
            stroke={counterColor}
            strokeWidth={2}
            opacity={0.85}
          />

          {/* Counterfactual paths — arc up/down (dashed). */}
          {counterfactuals.map((cf, i) => {
            const pathStr = counterfactualPath(cf.resolvedDirection);
            const approxLen = cfPathLength * 1.15;
            return (
              <path
                key={`cf-${i}`}
                d={pathStr}
                fill="none"
                stroke={counterColor}
                strokeWidth={1.5}
                strokeDasharray={`12 6`}
                strokeDashoffset={approxLen * (1 - cfProgress)}
                opacity={0.45}
              />
            );
          })}

          {/* Actual path — straight, solid gold. */}
          <line
            x1={branchX}
            y1={timelineY}
            x2={branchX + (pathEndX - branchX) * actualProgress}
            y2={timelineY}
            stroke={accentColor}
            strokeWidth={3.5}
            strokeLinecap="round"
          />

          {/* End-of-path markers (small dots). */}
          {actualProgress > 0.95 && (
            <circle cx={pathEndX} cy={timelineY} r={5} fill={accentColor} />
          )}
          {cfProgress > 0.95 &&
            counterfactuals.map((cf, i) => {
              const sign = cf.resolvedDirection === "up" ? -1 : 1;
              return (
                <circle
                  key={`cf-end-${i}`}
                  cx={pathEndX}
                  cy={timelineY + sign * cfRiseHeight}
                  r={4}
                  fill="none"
                  stroke={counterColor}
                  strokeWidth={1.5}
                />
              );
            })}

          {/* Branch-point marker — a vertical bar + dot at the divergence. */}
          <g
            opacity={branchOpacity}
            transform={`translate(${branchX} ${timelineY}) scale(${branchScale})`}
          >
            <line
              x1={0}
              y1={-30}
              x2={0}
              y2={30}
              stroke={accentColor}
              strokeWidth={2}
            />
            <circle
              cx={0}
              cy={0}
              r={branchPointSize / 2}
              fill={accentColor}
              stroke={palette.paper}
              strokeWidth={2}
            />
          </g>
        </svg>

        {/* Pre-branch label. */}
        {data.preBranchLabel && (
          <div
            style={{
              position: "absolute",
              top: timelineY - 40,
              left: trunkStart,
              width: branchX - trunkStart - 30,
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: theme.text.muted,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              opacity: trunkProgress,
            }}
          >
            {data.preBranchLabel}
          </div>
        )}

        {/* Branch-point year + event label. */}
        <div
          style={{
            position: "absolute",
            top: timelineY + 44,
            left: branchX - 100,
            width: 200,
            textAlign: "center",
            opacity: branchOpacity,
          }}
        >
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: fontSizes.h3,
              fontWeight: fontWeights.semibold,
              color: accentColor,
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            {data.branchYear}
          </div>
          <div
            style={{
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: fontSizes.body,
              color: theme.text.primary,
              marginTop: 6,
              lineHeight: 1.25,
            }}
          >
            {data.branchEvent}
          </div>
        </div>

        {/* Actual path end-label. */}
        <div
          style={{
            position: "absolute",
            top: timelineY - 56,
            left: pathEndX + 14,
            width: 320,
            opacity: actualLabelOpacity,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.caption,
              color: accentColor,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontWeight: fontWeights.semibold,
            }}
          >
            Actual · {data.actual.label}
          </div>
          <div
            style={{
              fontFamily: fonts.serifBody,
              fontSize: fontSizes.body,
              color: theme.text.primary,
              marginTop: 6,
              lineHeight: 1.35,
            }}
          >
            {data.actual.outcome}
          </div>
        </div>

        {/* Counterfactual end-labels. */}
        {counterfactuals.map((cf, i) => {
          const sign = cf.resolvedDirection === "up" ? -1 : 1;
          const labelY = timelineY + sign * cfRiseHeight - 56;
          return (
            <div
              key={`cf-label-${i}`}
              style={{
                position: "absolute",
                top: labelY,
                left: pathEndX + 14,
                width: 320,
                opacity: cfLabelOpacity,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.caption,
                  color: counterColor,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontStyle: "italic",
                }}
              >
                Counterfactual · {cf.label}
              </div>
              <div
                style={{
                  fontFamily: fonts.serifBody,
                  fontStyle: "italic",
                  fontSize: fontSizes.body,
                  color: theme.text.secondary,
                  marginTop: 6,
                  lineHeight: 1.35,
                }}
              >
                {cf.outcome}
              </div>
              {cf.plausibility && (
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: fontSizes.meta,
                    color: theme.text.muted,
                    marginTop: 6,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  Plausibility · {cf.plausibility}
                </div>
              )}
            </div>
          );
        })}

        {/* Caption (centred below timeline). */}
        {data.caption && (
          <div
            style={{
              position: "absolute",
              top: timelineY + cfRiseHeight + 120,
              left: layout.width * 0.15,
              width: layout.width * 0.7,
              textAlign: "center",
              fontFamily: fonts.serifBody,
              fontStyle: "italic",
              fontSize: fontSizes.body,
              color: theme.text.muted,
              lineHeight: 1.4,
              opacity: captionOpacity,
            }}
          >
            {data.caption}
          </div>
        )}

        <SourceAttribution source={data.source} mode={mode} prefix="Source · " />
        <FooterStrip mode={mode} />
      </AbsoluteFill>
    </Background>
  );
};

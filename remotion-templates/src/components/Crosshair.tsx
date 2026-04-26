/**
 * Crosshair — animated reticle / targeting element.
 *
 * Meridian signature visual: outer ring → inner ring → center dot → hairlines.
 * Used on maps (lock onto a country/city), data points, and emphasis moments.
 *
 * Animation sequence:
 *   1. Hairlines extend from center outward (0.2s)
 *   2. Outer circle draws in (0.3s, slight overlap)
 *   3. Inner circle appears (0.2s)
 *   4. Center dot pulses once on "lock" (0.2s)
 *
 * Usage:
 *   <Crosshair x={960} y={540} startFrame={30} />
 *   <Crosshair x={300} y={400} startFrame={0} color={semantic.china} size={80} />
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import { interpolate, Easing } from "remotion";
import {
  dark,
  palette,
  durations,
  crosshair as crosshairConfig,
} from "../design/theme";

interface CrosshairProps {
  /** Center X position (px from left) */
  x: number;
  /** Center Y position (px from top) */
  y: number;
  /** Frame to start the animation */
  startFrame?: number;
  /** Overall size (diameter of outer circle, px) */
  size?: number;
  /** Crosshair color — defaults to dark.crosshair (amber) */
  color?: string;
  /** Opacity — defaults to dark.crosshairOpacity (0.5) */
  opacity?: number;
  /** Hairline length beyond outer circle (px) */
  hairlineExtension?: number;
}

export const Crosshair: React.FC<CrosshairProps> = ({
  x,
  y,
  startFrame = 0,
  size = 64,
  color = dark.crosshair,
  opacity = dark.crosshairOpacity,
  hairlineExtension = 20,
}) => {
  const frame = useCurrentFrame();

  const outerR = size / 2;
  const innerR = outerR * 0.4;
  const dotR = 3;

  // Timing (all relative to startFrame)
  const t = frame - startFrame;

  // Phase 1: Hairlines extend (0 → hairlinesExtend frames)
  const hairlineProgress = interpolate(
    t,
    [0, durations.hairlinesExtend],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // Phase 2: Outer circle draws in (starts at 30% of hairline duration)
  const outerStart = Math.floor(durations.hairlinesExtend * 0.3);
  const outerProgress = interpolate(
    t,
    [outerStart, outerStart + durations.outerCircleDraw],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // Phase 3: Inner circle appears (after outer is ~60% done)
  const innerStart = outerStart + Math.floor(durations.outerCircleDraw * 0.6);
  const innerProgress = interpolate(
    t,
    [innerStart, innerStart + durations.innerCircleAppear],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // Phase 4: Center dot + lock-on pulse
  const dotStart = innerStart + durations.innerCircleAppear;
  const dotOpacity = interpolate(
    t,
    [dotStart, dotStart + 3],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Lock-on pulse: scale 1 → 1.3 → 1 over lockOnPulse frames
  const pulseStart = dotStart + 3;
  const pulseScale = interpolate(
    t,
    [pulseStart, pulseStart + durations.lockOnPulse / 2, pulseStart + durations.lockOnPulse],
    [1, 1.3, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Overall fade-in
  const overallOpacity = interpolate(
    t,
    [0, 4],
    [0, opacity],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  if (t < 0) return null;

  // SVG measurements
  const svgSize = size + hairlineExtension * 2 + 10; // extra padding
  const center = svgSize / 2;

  // Outer circle circumference for stroke-dasharray animation
  const outerCircumference = 2 * Math.PI * outerR;

  // Hairline endpoints
  const hairlineLength = outerR + hairlineExtension;
  const currentHairlineLength = hairlineLength * hairlineProgress;

  return (
    <div
      style={{
        position: "absolute",
        left: x - svgSize / 2,
        top: y - svgSize / 2,
        width: svgSize,
        height: svgSize,
        pointerEvents: "none",
        opacity: overallOpacity,
      }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
      >
        {/* Hairlines — four cardinal directions */}
        {/* Top */}
        <line
          x1={center}
          y1={center - 2}
          x2={center}
          y2={center - currentHairlineLength}
          stroke={color}
          strokeWidth={crosshairConfig.hairlineStroke}
        />
        {/* Bottom */}
        <line
          x1={center}
          y1={center + 2}
          x2={center}
          y2={center + currentHairlineLength}
          stroke={color}
          strokeWidth={crosshairConfig.hairlineStroke}
        />
        {/* Left */}
        <line
          x1={center - 2}
          y1={center}
          x2={center - currentHairlineLength}
          y2={center}
          stroke={color}
          strokeWidth={crosshairConfig.hairlineStroke}
        />
        {/* Right */}
        <line
          x1={center + 2}
          y1={center}
          x2={center + currentHairlineLength}
          y2={center}
          stroke={color}
          strokeWidth={crosshairConfig.hairlineStroke}
        />

        {/* Outer circle — stroke-dasharray draw-in */}
        <circle
          cx={center}
          cy={center}
          r={outerR}
          fill="none"
          stroke={color}
          strokeWidth={crosshairConfig.outerStroke}
          strokeDasharray={outerCircumference}
          strokeDashoffset={outerCircumference * (1 - outerProgress)}
          transform={`rotate(-90, ${center}, ${center})`}
        />

        {/* Inner circle — scale in */}
        <circle
          cx={center}
          cy={center}
          r={innerR * innerProgress}
          fill="none"
          stroke={color}
          strokeWidth={crosshairConfig.innerStroke}
          opacity={innerProgress}
        />

        {/* Center dot — appears + pulse */}
        <circle
          cx={center}
          cy={center}
          r={dotR * pulseScale}
          fill={color}
          opacity={dotOpacity}
        />
      </svg>
    </div>
  );
};

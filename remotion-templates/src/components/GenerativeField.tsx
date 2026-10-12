/**
 * GenerativeField — reusable generative flow-field backdrop.
 *
 * Promoted from the NoiseField prototype (REMOTION_CAPABILITY_MAP.md #6). A grid
 * of short strokes, each oriented by a 3D simplex noise field that evolves over
 * time → a slowly-flowing constructivist field that is never a static loop.
 *
 * EDITORIAL GATING (important): this is an ATMOSPHERIC register-B/C backdrop for
 * specific hold beats — diffusion / contagion / trade-spread / "the idea
 * permeates" moments. Like CinematicMap, it should be RARE (≈1 per episode). A
 * generative field on every hold beat reads as a screensaver and dilutes the
 * one moment where motion-as-argument actually earns its place. It is a
 * background layer, not a segment that carries information.
 *
 * Palette-tokenized; defaults to ink ground + gold strokes + bone "hot" accents.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D, noise3D } from "@remotion/noise";
import { palette } from "../design/theme";

export interface GenerativeFieldProps {
  width?: number;
  height?: number;
  /** Grid spacing in px (larger = sparser/quieter). Default 52. */
  gap?: number;
  /** Stroke length in px. Default 22. */
  length?: number;
  /** Time multiplier for the drift; smaller = slower. Default 0.25. */
  driftSpeed?: number;
  /** Noise threshold above which a stroke becomes a brighter "particle". Default 0.74. */
  hotRate?: number;
  groundColor?: string;
  strokeColor?: string;
  hotColor?: string;
  /** Render the inset vignette finish. Default true. */
  vignette?: boolean;
  /** Render the ground fill. Set false to overlay the field on existing content. Default true. */
  fillGround?: boolean;
}

export const GenerativeField: React.FC<GenerativeFieldProps> = ({
  width = 1920,
  height = 1080,
  gap = 52,
  length = 22,
  driftSpeed = 0.25,
  hotRate = 0.74,
  groundColor = palette.ink,
  strokeColor = palette.gold,
  hotColor = palette.bone,
  vignette = true,
  fillGround = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * driftSpeed;

  const cols = Math.ceil(width / gap);
  const rows = Math.ceil(height / gap);

  const strokes: React.ReactNode[] = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const px = c * gap;
      const py = r * gap;
      const angle = noise3D("flow", px * 0.0017, py * 0.0017, t) * Math.PI * 1.6;
      const op = 0.18 + 0.6 * ((noise2D("op", px * 0.003, py * 0.003 + t) + 1) / 2);
      const hot = noise2D("hot", px * 0.004, py * 0.004 - t) > hotRate;
      strokes.push(
        <line
          key={`${r}-${c}`}
          x1={px}
          y1={py}
          x2={px + Math.cos(angle) * length}
          y2={py + Math.sin(angle) * length}
          stroke={hot ? hotColor : strokeColor}
          strokeWidth={hot ? 3.5 : 2.2}
          strokeLinecap="round"
          opacity={hot ? Math.min(1, op + 0.3) : op}
        />,
      );
    }
  }

  return (
    <AbsoluteFill style={fillGround ? { backgroundColor: groundColor } : undefined}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        {strokes}
      </svg>
      {vignette && (
        <AbsoluteFill
          style={{ boxShadow: "inset 0 0 360px 100px rgba(0,0,0,0.5)", pointerEvents: "none" }}
        />
      )}
    </AbsoluteFill>
  );
};

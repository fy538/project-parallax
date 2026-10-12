/**
 * NoiseField — PROTOTYPE (May 23, 2026; refactored to shared lib May 23)
 *
 * Generative atmospheric backdrop (REMOTION_CAPABILITY_MAP.md #6). Now dogfoods
 * the production component `src/components/GenerativeField.tsx` — this proto is
 * just the shared field plus a label overlay.
 *
 * Parallax use: hold-beat backdrops for diffusion / contagion / trade-spread /
 * "the idea permeates" moments — generative, never a static loop, on-palette.
 * Gate hard (≈1 per episode) — see GenerativeField's editorial note.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { GenerativeField } from "../../components/GenerativeField";

const BONE = "#F0E6D0";
const WALNUT = "#5C4A3D";

export const NOISE_FIELD_DURATION = 150;

export const NoiseField: React.FC = () => (
  <AbsoluteFill>
    <GenerativeField />
    <div style={{ position: "absolute", left: 120, top: 110, fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div style={{ color: WALNUT, fontSize: 24, letterSpacing: 8, textTransform: "uppercase" }}>
        @remotion/noise · noise3D
      </div>
      <div style={{ color: BONE, fontSize: 64, fontWeight: 800, marginTop: 6 }}>GENERATIVE FIELD</div>
    </div>
  </AbsoluteFill>
);

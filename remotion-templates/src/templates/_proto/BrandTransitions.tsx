/**
 * BrandTransitions — PROTOTYPE (May 23, 2026; refactored to shared lib May 23)
 *
 * Demonstrates native, frame-perfect, BRANDED transitions in Remotion via
 * @remotion/transitions — the P1 unlock from REMOTION_MOTION_LAYER_ROADMAP.md.
 * Today the transition grammar (cut/dissolve/iris/color-wash) is done by hand in
 * the NLE; this shows it living in code instead.
 *
 * Now dogfoods the production library `src/transitions/grammar.tsx`
 * (GrammarTransitionSeries) instead of a hand-rolled colorWash — proving the
 * shared module reproduces the branded seams. Shows: dissolve · custom amber
 * COLOR-WASH · built-in IRIS.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { GrammarTransitionSeries } from "../../transitions/grammar";

const INK = "#1C1814";
const AMBER = "#C4A747";
const BONE = "#F0E6D0";
const WALNUT = "#5C4A3D";

const W = 1920;
const H = 1080;
// Each sequence must be ≥ the sum of its two adjacent transitions, or the
// seams overlap (color-wash bleeds into the iris). Middle panels host
// 26 + 26 = 52 frames of transition → HOLD ≥ 52.
const HOLD = 54;

// ── Constructivist panel ────────────────────────────────────────────────────
const Panel: React.FC<{ n: string; label: string; sub: string; accent: string }> = ({
  n,
  label,
  sub,
  accent,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: INK,
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "Helvetica, Arial, sans-serif",
    }}
  >
    <div style={{ position: "absolute", top: 110, left: 150, width: 170, height: 170, backgroundColor: accent }} />
    <div style={{ position: "absolute", bottom: 150, right: 170, width: 260, height: 12, backgroundColor: WALNUT }} />
    <div style={{ fontSize: 230, fontWeight: 800, color: accent, lineHeight: 1 }}>{n}</div>
    <div style={{ fontSize: 66, fontWeight: 700, color: BONE, letterSpacing: 3, marginTop: 8 }}>{label}</div>
    <div style={{ fontSize: 26, color: WALNUT, letterSpacing: 8, marginTop: 20, textTransform: "uppercase" }}>{sub}</div>
  </AbsoluteFill>
);

// Total = 4*HOLD − (18 + 26 + 26) = 216 − 70 = 146 frames.
export const PROTO_BRAND_TRANSITIONS_DURATION = 146;

export const BrandTransitions: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: INK }}>
    <GrammarTransitionSeries
      fps={30}
      width={W}
      height={H}
      segments={[
        { durationInFrames: HOLD, content: <Panel n="01" label="OPEN" sub="first panel" accent={AMBER} /> },
        { durationInFrames: HOLD, content: <Panel n="02" label="DISSOLVE" sub="opacity + scale" accent={BONE} /> },
        { durationInFrames: HOLD, content: <Panel n="03" label="COLOR-WASH" sub="brand amber" accent={AMBER} /> },
        { durationInFrames: HOLD, content: <Panel n="04" label="IRIS" sub="reveal" accent={BONE} /> },
      ]}
      seams={[
        { transition: "dissolve", durationSec: 18 / 30 },
        { transition: "color-wash", durationSec: 26 / 30 },
        { transition: "iris", durationSec: 26 / 30 },
      ]}
    />
  </AbsoluteFill>
);

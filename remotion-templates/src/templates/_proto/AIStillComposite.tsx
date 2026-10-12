/**
 * AIStillComposite — PROTOTYPE (May 23, 2026)
 *
 * The compositing unlock (REMOTION_CAPABILITY_MAP.md #5 / roadmap P2): an
 * AI-generated still provides the painterly TEXTURE; Remotion adds a precise,
 * eased, code-driven VECTOR ANNOTATION on top — a callout that draws itself
 * onto a feature of the still. This is the layer that dissolves the wall
 * between the "illustration" and "motion" pillars: AI richness + motion-design
 * precision in one composition, no NLE, no AI-morph.
 *
 * Still: aigen-01 (RAND office). Annotation: a ring around the tally grids,
 * a leader drawing out to a stat label. Color preserved (documentary-finish
 * doctrine — no duotone), with a subtle in-comp vignette.
 */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { evolvePath, translatePath } from "@remotion/paths";
import { makeCircle } from "@remotion/shapes";
import { easing } from "../../design/theme";

const AMBER = "#C4A747";
const BONE = "#F0E6D0";
const WALNUT = "#5C4A3D";

export const AI_STILL_COMPOSITE_DURATION = 96;

// Ring around the tally grids on the table (~center-low of the office still).
const RING_CX = 880;
const RING_CY = 690;
const RING_R = 130;
const RING = translatePath(makeCircle({ radius: RING_R }).path, RING_CX - RING_R, RING_CY - RING_R);
// Leader line from the ring out to the label anchor (upper-right).
const LEADER = `M ${RING_CX + RING_R - 10} ${RING_CY - 70} L 1380 360`;

const ease = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {
    easing: Easing.bezier(...easing.decelerate),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const AIStillComposite: React.FC = () => {
  const frame = useCurrentFrame();

  const ring = evolvePath(ease(frame, 4, 30), RING);
  const leader = evolvePath(ease(frame, 22, 48), LEADER);
  const labelIn = ease(frame, 44, 60);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1C1814" }}>
      {/* Layer 1 — AI still (texture). Color preserved. */}
      <Img
        src={staticFile("proto/aigen-01.png")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Layer 2 — code-driven vector annotation (precision) */}
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path d={RING} fill="none" stroke={AMBER} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={ring.strokeDasharray} strokeDashoffset={ring.strokeDashoffset} />
        <path d={LEADER} fill="none" stroke={AMBER} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={leader.strokeDasharray} strokeDashoffset={leader.strokeDashoffset} />
        {labelIn > 0 && <circle cx={1380} cy={360} r={6} fill={AMBER} opacity={labelIn} />}
      </svg>

      {/* Layer 3 — label (fades in after the leader arrives) */}
      <div
        style={{
          position: "absolute", left: 1400, top: 300, opacity: labelIn,
          transform: `translateY(${(1 - labelIn) * 12}px)`,
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ color: WALNUT, fontSize: 22, letterSpacing: 6, textTransform: "uppercase" }}>RAND · 1950</div>
        <div style={{ color: BONE, fontSize: 70, fontWeight: 800, lineHeight: 1.05, marginTop: 4 }}>
          ≈60%<br />cooperated
        </div>
      </div>

      {/* Layer 4 — subtle in-comp vignette (render-time finish) */}
      <AbsoluteFill style={{ boxShadow: "inset 0 0 320px 80px rgba(0,0,0,0.45)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

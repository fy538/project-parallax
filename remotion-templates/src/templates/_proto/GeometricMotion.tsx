/**
 * GeometricMotion — PROTOTYPE (May 23, 2026)
 *
 * Demonstrates the slick geometric vector layer (REMOTION_CAPABILITY_MAP.md #4):
 *   Beat 1 — DRAW-ON: a route draws itself stroke-by-stroke (@remotion/paths
 *            evolvePath), with waypoint nodes placed EXACTLY on the path via
 *            getPointAtLength and revealed as the line reaches them.
 *   Beat 2 — PATH MORPH: a shape cleanly morphs square → circle → triangle
 *            (@remotion/paths interpolatePath over @remotion/shapes paths).
 *
 * This is the deterministic, eased, non-gooey alternative to AI morph for
 * geometric transforms. Easing from theme tokens (never linear).
 */
import React from "react";
import { AbsoluteFill, Series, useCurrentFrame, interpolate, Easing } from "remotion";
import { interpolatePath, translatePath } from "@remotion/paths";
import { makeRect, makeCircle, makeTriangle } from "@remotion/shapes";
import { DrawOnPath, type DrawOnNode } from "../../components/DrawOnPath";
import { easing } from "../../design/theme";

const INK = "#1C1814";
const AMBER = "#C4A747";
const BONE = "#F0E6D0";
const WALNUT = "#5C4A3D";

const DRAW = 84;
const MORPH = 84;
export const GEOMETRIC_MOTION_DURATION = DRAW + MORPH;

// ── Beat 1: draw-on route ───────────────────────────────────────────────────
const ROUTE =
  "M 280 770 C 520 770 600 430 880 430 C 1140 430 1180 720 1440 660 C 1600 624 1660 360 1680 330";
const NODES: DrawOnNode[] = [0, 0.42, 0.78, 1].map((at) => ({ at }));

const Label: React.FC<{ kicker: string; title: string }> = ({ kicker, title }) => (
  <div style={{ position: "absolute", left: 120, top: 110, fontFamily: "Helvetica, Arial, sans-serif" }}>
    <div style={{ color: WALNUT, fontSize: 24, letterSpacing: 8, textTransform: "uppercase" }}>{kicker}</div>
    <div style={{ color: BONE, fontSize: 64, fontWeight: 800, marginTop: 6 }}>{title}</div>
  </div>
);

const DrawOnRoute: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [6, DRAW - 8], [0, 1], {
    easing: Easing.bezier(...easing.decelerate),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Label kicker="evolvePath · getPointAtLength" title="DRAW-ON" />
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <DrawOnPath
          d={ROUTE}
          progress={progress}
          color={AMBER}
          endNodeColor={AMBER}
          midNodeColor={BONE}
          nodes={NODES}
        />
      </svg>
    </AbsoluteFill>
  );
};

// ── Beat 2: shape morph ─────────────────────────────────────────────────────
const SQUARE = translatePath(makeRect({ width: 300, height: 300 }).path, 50, 50);
const CIRCLE = translatePath(makeCircle({ radius: 150 }).path, 50, 50);
const TRI = translatePath(makeTriangle({ length: 340, direction: "up" }).path, 30, 58);

const ShapeMorph: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [6, MORPH - 6], [0, 1], {
    easing: Easing.bezier(...easing.standard),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const d = t < 0.5 ? interpolatePath(t / 0.5, SQUARE, CIRCLE) : interpolatePath((t - 0.5) / 0.5, CIRCLE, TRI);
  const stage = t < 0.5 ? "square → circle" : "circle → triangle";
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Label kicker="interpolatePath · makeShapes" title="PATH MORPH" />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <svg viewBox="0 0 400 400" width={560} height={560}>
          <path d={d} fill={AMBER} />
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 130, width: "100%", textAlign: "center", color: WALNUT, fontFamily: "Helvetica, Arial, sans-serif", fontSize: 28, letterSpacing: 6, textTransform: "uppercase" }}>
        {stage}
      </div>
    </AbsoluteFill>
  );
};

export const GeometricMotion: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={DRAW}>
      <DrawOnRoute />
    </Series.Sequence>
    <Series.Sequence durationInFrames={MORPH}>
      <ShapeMorph />
    </Series.Sequence>
  </Series>
);

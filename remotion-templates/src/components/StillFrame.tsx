/**
 * StillFrame — an illustration shown through a moving frame.
 *
 * The still is drawn by the browser from its full-resolution file, and the
 * "camera" is a framing: where the frame's centre sits on the image (cx, cy,
 * as fractions of its width and height) and how far in it is (zoom, 1 = the
 * whole image). A shot moves from one framing to another over its segment.
 *
 * This replaces clips baked ahead of time with ffmpeg (tools/ai-video/
 * render_kenburns.py): the same still can now be a wide, a medium and a
 * detail in different places, the move is part of the manifest so a re-time
 * carries it along, and a render above 1080p draws from the still's own
 * pixels instead of enlarging a 1080p clip.
 *
 * Framing convention shared with src/experiments/StillsReel.tsx.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export interface Framing {
  /** Centre of the frame on the image, 0–1 across its width. */
  cx: number;
  /** Centre of the frame on the image, 0–1 down its height. */
  cy: number;
  /** 1 shows the whole image; 2 shows half its width. */
  zoom: number;
}

export interface StillFraming {
  from: Framing;
  to: Framing;
  /**
   * "linear" (default): the move is already under way at the cut in and still
   * going at the cut out. "settle": it slows to rest, for a shot that ends on
   * a hold or a fade. "glide": it eases at both ends.
   */
  ease?: "linear" | "settle" | "glide";
}

/** The framing used when a still segment gives none: a slow, slight push. */
export const DEFAULT_STILL_FRAMING: StillFraming = {
  from: { cx: 0.5, cy: 0.5, zoom: 1 },
  to: { cx: 0.5, cy: 0.48, zoom: 1.06 },
};

const EASE = {
  linear: (t: number) => t,
  settle: Easing.out(Easing.quad),
  glide: Easing.inOut(Easing.quad),
} as const;

/**
 * Keep the frame on the image: a framing that would show past an edge is
 * moved inward, so a hand-written value can never reveal the ground behind.
 */
export const clampFraming = (f: Framing): Framing => {
  const zoom = Math.max(1, f.zoom);
  const half = 0.5 / zoom;
  return {
    zoom,
    cx: Math.min(1 - half, Math.max(half, f.cx)),
    cy: Math.min(1 - half, Math.max(half, f.cy)),
  };
};

/** The framing at progress p (0–1) through a move. */
export const framingAt = (framing: StillFraming, p: number): Framing => {
  const e = EASE[framing.ease ?? "linear"](Math.min(1, Math.max(0, p)));
  const a = clampFraming(framing.from);
  const b = clampFraming(framing.to);
  return clampFraming({
    cx: a.cx + (b.cx - a.cx) * e,
    cy: a.cy + (b.cy - a.cy) * e,
    zoom: a.zoom + (b.zoom - a.zoom) * e,
  });
};

/** CSS transform (origin top-left) that puts framing `f` in a W×H frame. */
export const framingTransform = (f: Framing, W: number, H: number): string => {
  const tx = W / 2 - f.cx * W * f.zoom;
  const ty = H / 2 - f.cy * H * f.zoom;
  return `translate(${tx}px, ${ty}px) scale(${f.zoom})`;
};

export const StillFrame: React.FC<{
  src: string;
  framing?: StillFraming;
  /** Length of the move in frames (the segment's own length, without any held tail). */
  durationInFrames: number;
}> = ({ src, framing = DEFAULT_STILL_FRAMING, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={src}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height,
          objectFit: "cover",
          transformOrigin: "0 0",
          transform: framingTransform(framingAt(framing, p), width, height),
        }}
      />
    </AbsoluteFill>
  );
};

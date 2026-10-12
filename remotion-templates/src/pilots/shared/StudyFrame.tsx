import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { easing, fonts, palette, timing } from "../../design/theme";

export const NarrationTrack: React.FC<{
  beats: readonly { key: string; src: string; start: number; durationInFrames: number }[];
  volume: number;
}> = ({ beats, volume }) => <>{beats.map((beat) => (
  <Sequence key={beat.key} name={beat.key} from={beat.start} durationInFrames={beat.durationInFrames} layout="none">
    <Audio src={staticFile(beat.src)} volume={volume} />
  </Sequence>
))}</>;

const EASE = Easing.bezier(...easing.decelerate);
const META: React.CSSProperties = { fontFamily: fonts.metadata, fontSize: 20, letterSpacing: 2 };

/** Shared editorial canvas. The scene is composed as children, not a collection of modes. */
export const StudyFrame: React.FC<{
  title: string;
  number: string;
  topic: string;
  captions: readonly { key: string; text: string; opacity: number }[];
  progress: readonly number[];
  children: React.ReactNode;
}> = ({ title, number, topic, captions, progress, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const tailFade = interpolate(frame, [durationInFrames - timing.exit.slow, durationInFrames - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  return <AbsoluteFill style={{ backgroundColor: palette.paper, color: palette.ink, fontFamily: fonts.body }}>
    <AbsoluteFill style={{ opacity: tailFade }}>
      <div style={{ position: "absolute", left: 96, right: 96, top: 66, display: "flex", justifyContent: "space-between", ...META, color: palette.umber }}>
        <span>THOUGHT EXPERIMENT / {number}</span><span>{topic}</span>
      </div>
      <div style={{ position: "absolute", left: 96, right: 96, top: 132, fontFamily: fonts.serifBody, fontSize: 78, lineHeight: 1.12, letterSpacing: -2 }}>{title}</div>
      {captions.map(({ key, text, opacity }) => <div key={key} style={{ position: "absolute", left: 100, top: 258, fontSize: 34, color: palette.walnut, opacity, transform: `translateY(${(1 - opacity) * 8}px)` }}>{text}</div>)}
      {children}
      <div style={{ position: "absolute", left: 96, right: 96, bottom: 43, borderTop: `1px solid ${palette.sand}`, paddingTop: 18, display: "flex", justifyContent: "space-between", fontFamily: fonts.metadata, fontSize: 16, color: palette.umber }}>
        <span>PARALLAX / VISUAL STUDY</span>
        <span>FICTIONAL SCENARIO · SYNTHETIC SCRATCH VOICE</span>
        <div style={{ display: "flex", gap: 12 }}>
          {progress.map((value, i) => <span key={i} style={{ width: 18, height: 3, marginTop: 8, backgroundColor: palette.walnut, opacity: value * 0.7 + 0.2 }} />)}
        </div>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

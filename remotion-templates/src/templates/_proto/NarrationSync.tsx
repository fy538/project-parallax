/**
 * NarrationSync — PROTOTYPE (May 23, 2026)
 *
 * The highest-leverage underused capability (REMOTION_CAPABILITY_MAP.md #1):
 * word-level narration timing → on-screen animation. Two halves of the same
 * idea, driven by ONE audio file:
 *
 *   Top    — TEXT REVEAL off word-timings. A Caption[] (the shape Whisper
 *            emits via @remotion/captions) lights each word amber exactly as
 *            the narrator reaches it. In production these timings come from
 *            install-whisper-cpp on the narration WAV — here they are mocked
 *            so the mechanism is visible without the model.
 *   Bottom — AUDIO-REACTIVE SPECTRUM via @remotion/media-utils
 *            (useAudioData + visualizeAudio): a symmetric bar field that
 *            breathes with the actual waveform amplitude.
 *
 * This is the layer that removes hand-timed syncPoints / revealAtSec: the
 * narration drives the motion, not a human guessing frame numbers.
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  delayRender,
  continueRender,
} from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { easing } from "../../design/theme";

const INK = "#1C1814";
const AMBER = "#C4A747";
const BONE = "#F0E6D0";
const WALNUT = "#5C4A3D";
const MIDNIGHT = "#2A2520";

export const NARRATION_SYNC_DURATION = 180; // 6s @ 30fps

const SRC = "proto/narration.wav";

// Mock word-level timing — the shape @remotion/captions / Whisper emit.
// In production: derived from the narration WAV by install-whisper-cpp.
type Caption = { text: string; startMs: number; endMs: number };
const CAPTIONS: Caption[] = [
  { text: "The", startMs: 120, endMs: 360 },
  { text: "prisoner's", startMs: 360, endMs: 820 },
  { text: "dilemma", startMs: 820, endMs: 1280 },
  { text: "is", startMs: 1320, endMs: 1480 },
  { text: "not", startMs: 1480, endMs: 1760 },
  { text: "about", startMs: 1760, endMs: 2080 },
  { text: "prisoners", startMs: 2080, endMs: 2680 },
  { text: "—", startMs: 2680, endMs: 2900 },
  { text: "it", startMs: 3100, endMs: 3260 },
  { text: "is", startMs: 3260, endMs: 3440 },
  { text: "about", startMs: 3440, endMs: 3760 },
  { text: "trust", startMs: 3760, endMs: 4280 },
  { text: "under", startMs: 4360, endMs: 4720 },
  { text: "threat.", startMs: 4720, endMs: 5400 },
];

const Word: React.FC<{ cap: Caption; nowMs: number }> = ({ cap, nowMs }) => {
  // Settle ~120ms BEFORE the word is spoken (D17 anticipatory reveal doctrine).
  const lead = 120;
  const appear = interpolate(nowMs, [cap.startMs - lead - 160, cap.startMs - lead], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...easing.decelerate),
  });
  const spoken = nowMs >= cap.startMs && nowMs <= cap.endMs + 200;
  const past = nowMs > cap.endMs + 200;
  // amber while spoken → settles to bone after, walnut before it arrives.
  const color = appear < 1 ? WALNUT : spoken ? AMBER : past ? BONE : WALNUT;
  return (
    <span
      style={{
        display: "inline-block",
        marginRight: 18,
        color,
        opacity: 0.25 + 0.75 * appear,
        transform: `translateY(${(1 - appear) * 14}px)`,
        transition: "none",
        textShadow: spoken ? `0 0 22px rgba(196,167,71,0.45)` : "none",
      }}
    >
      {cap.text}
    </span>
  );
};

export const NarrationSync: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  const audioData = useAudioData(staticFile(SRC));

  // delayRender until audio metadata is parsed (clean first frame).
  const [handle] = React.useState(() => delayRender("audio-data"));
  React.useEffect(() => {
    if (audioData) continueRender(handle);
  }, [audioData, handle]);

  // visualizeAudio returns frequency bins (bass at index 0). Take a power-of-two
  // slice, then MIRROR it center-out so the field reads as a symmetric spectrum
  // breathing from the centerline rather than a bass spike on the left edge.
  const HALF = 32; // power of two
  const bins = audioData
    ? visualizeAudio({ audioData, frame, fps, numberOfSamples: HALF, smoothing: true })
    : new Array(HALF).fill(0);
  // strongest (bass) bins toward the center; higher freqs toward the edges.
  const spectrum = [...bins].reverse().concat(bins);
  const NUM_BARS = spectrum.length; // 64

  const barGap = 6;
  const barW = (width - 240 - (NUM_BARS - 1) * barGap) / NUM_BARS;

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Audio src={staticFile(SRC)} />

      {/* Kicker */}
      <div style={{ position: "absolute", left: 120, top: 96, fontFamily: "Helvetica, Arial, sans-serif" }}>
        <div style={{ color: WALNUT, fontSize: 22, letterSpacing: 8, textTransform: "uppercase" }}>
          whisper word-timing · @remotion/captions
        </div>
      </div>

      {/* Word-timed reveal */}
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 300,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 76,
          fontWeight: 600,
          lineHeight: 1.25,
        }}
      >
        {CAPTIONS.map((c, i) => (
          <Word key={i} cap={c} nowMs={nowMs} />
        ))}
      </div>

      {/* Audio-reactive spectrum (symmetric bars) */}
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          bottom: 150,
          height: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {spectrum.map((v, i) => {
          const h = Math.max(3, v * 1400);
          // center bars hotter than edges
          const edge = Math.abs(i - NUM_BARS / 2) / (NUM_BARS / 2);
          const hot = v > 0.06 && edge < 0.4;
          return (
            <div
              key={i}
              style={{
                width: barW,
                height: h,
                backgroundColor: hot ? BONE : AMBER,
                opacity: 0.45 + Math.min(0.55, v * 6),
                borderRadius: barW / 2,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 120,
          bottom: 96,
          color: WALNUT,
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: 22,
          letterSpacing: 8,
          textTransform: "uppercase",
        }}
      >
        useAudioData · visualizeAudio
      </div>

      {/* baseline rule */}
      <div style={{ position: "absolute", left: 120, right: 120, bottom: 150, height: 1, backgroundColor: MIDNIGHT }} />

      <AbsoluteFill style={{ boxShadow: "inset 0 0 320px 90px rgba(0,0,0,0.45)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

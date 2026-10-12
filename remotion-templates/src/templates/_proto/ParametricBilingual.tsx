/**
 * ParametricBilingual — PROTOTYPE (May 23, 2026)
 *
 * The pipeline-compression capability (REMOTION_CAPABILITY_MAP.md #2):
 * ONE composition → many variants via `calculateMetadata` + Zod-typed props.
 * Two things the roadmap wants are demonstrated together:
 *
 *   1. BILINGUAL from one component — a `lang: "en" | "zh"` prop selects the
 *      EN or ZH content block at render time. The same component renders both
 *      the English and Mandarin cuts; no duplicated template.
 *   2. AUTO-DURATION from narration — `calculateMetadata` is async and reads
 *      the real length of the narration WAV via getAudioDurationInSeconds,
 *      then sets durationInFrames automatically. No hand-typed durationSec;
 *      the audio file IS the source of truth (different per language).
 *
 * Registered twice in Root (proto-parametric-en / proto-parametric-zh) — same
 * component, same calculateMetadata, different defaultProps. That pair is the
 * whole point: the EN/ZH split costs one defaultProps object, not one template.
 */
import React from "react";
import { z } from "zod";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  staticFile,
} from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { evolvePath } from "@remotion/paths";
import { makeRect } from "@remotion/shapes";
import { easing } from "../../design/theme";

const INK = "#1C1814";
const AMBER = "#C4A747";
const BONE = "#F0E6D0";
const WALNUT = "#5C4A3D";

const EN_FONT = "Georgia, 'Times New Roman', serif";
const ZH_FONT = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
const META_FONT = "Helvetica, Arial, sans-serif";

export const ParametricSchema = z.object({
  lang: z.enum(["en", "zh"]),
  narrationSrc: z.string(),
  // durationSec is intentionally OPTIONAL — calculateMetadata fills it from the WAV.
  durationSec: z.number().positive().optional(),
});
export type ParametricData = z.infer<typeof ParametricSchema>;

// Per-language content. The editorial copy lives here, keyed by lang.
const CONTENT = {
  en: {
    kicker: "GAME THEORY · 1950",
    title: "The Payoff Matrix",
    body: "Two prisoners. Each is better off betraying — yet both end up worse when both do.",
    stat: "≈60%",
    statLabel: "COOPERATED",
    font: EN_FONT,
  },
  zh: {
    kicker: "博弈论 · 1950",
    title: "收益矩阵",
    body: "两名囚徒。背叛对各自更有利——但当双双背叛，二者皆输。",
    stat: "≈60%",
    statLabel: "选择合作",
    font: ZH_FONT,
  },
} as const;

const fade = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...easing.decelerate),
  });

export const ParametricBilingual: React.FC<ParametricData> = ({ lang, durationSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = CONTENT[lang];

  const kIn = fade(frame, 4, 18);
  const tIn = fade(frame, 14, 34);
  const bIn = fade(frame, 30, 54);
  const sIn = fade(frame, 48, 70);

  // underline draws under the title as it settles
  const RULE = makeRect({ width: 560, height: 6 }).path;
  const rule = evolvePath(fade(frame, 26, 50), RULE);

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      {/* lang badge — makes the "same component, different prop" visible */}
      <div
        style={{
          position: "absolute",
          right: 110,
          top: 96,
          fontFamily: META_FONT,
          fontSize: 20,
          letterSpacing: 6,
          color: INK,
          background: AMBER,
          padding: "8px 16px",
          fontWeight: 700,
        }}
      >
        {lang.toUpperCase()}
      </div>

      <div style={{ position: "absolute", left: 120, top: 240, right: 120 }}>
        <div
          style={{
            fontFamily: META_FONT,
            fontSize: 24,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: WALNUT,
            opacity: kIn,
            transform: `translateY(${(1 - kIn) * 10}px)`,
          }}
        >
          {c.kicker}
        </div>

        <div
          style={{
            fontFamily: c.font,
            fontSize: 92,
            fontWeight: 800,
            color: BONE,
            marginTop: 10,
            opacity: tIn,
            transform: `translateY(${(1 - tIn) * 14}px)`,
          }}
        >
          {c.title}
        </div>

        <svg width={560} height={10} style={{ marginTop: 12, overflow: "visible" }}>
          <path
            d={RULE}
            fill="none"
            stroke={AMBER}
            strokeWidth={6}
            strokeDasharray={rule.strokeDasharray}
            strokeDashoffset={rule.strokeDashoffset}
          />
        </svg>

        <div
          style={{
            fontFamily: c.font,
            fontSize: 42,
            lineHeight: 1.5,
            color: BONE,
            opacity: bIn * 0.92,
            transform: `translateY(${(1 - bIn) * 12}px)`,
            marginTop: 40,
            maxWidth: 1200,
          }}
        >
          {c.body}
        </div>

        <div
          style={{
            marginTop: 64,
            opacity: sIn,
            transform: `translateY(${(1 - sIn) * 12}px)`,
            display: "flex",
            alignItems: "baseline",
            gap: 24,
          }}
        >
          <span style={{ fontFamily: META_FONT, fontSize: 130, fontWeight: 800, color: AMBER, lineHeight: 1 }}>
            {c.stat}
          </span>
          <span style={{ fontFamily: c.font, fontSize: 36, letterSpacing: 4, color: WALNUT }}>
            {c.statLabel}
          </span>
        </div>
      </div>

      {/* mechanism readout — proves duration came from the WAV, not a literal */}
      <div
        style={{
          position: "absolute",
          left: 120,
          bottom: 84,
          fontFamily: META_FONT,
          fontSize: 19,
          letterSpacing: 3,
          color: WALNUT,
        }}
      >
        calculateMetadata · duration auto-derived from narration WAV →{" "}
        {durationSec ? durationSec.toFixed(2) : "?"}s @ {fps}fps
      </div>

      <AbsoluteFill style={{ boxShadow: "inset 0 0 320px 90px rgba(0,0,0,0.4)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

/**
 * Async calculateMetadata: read the real narration length at render time and
 * write durationSec back into props so the component can display it. Falls back
 * to 6s if the WAV can't be probed (e.g. offline). This is the function that
 * removes hand-typed durations from the pipeline.
 */
export async function parametricMetadata({ props }: { props: ParametricData }) {
  const fps = 30;
  let durationSec = props.durationSec ?? 6;
  try {
    durationSec = await getAudioDurationInSeconds(staticFile(props.narrationSrc));
  } catch {
    // keep fallback
  }
  return {
    durationInFrames: Math.max(1, Math.round(durationSec * fps)),
    fps,
    width: 1920,
    height: 1080,
    props: { ...props, durationSec },
  };
}

export const PARAMETRIC_EN_DEFAULTS: ParametricData = { lang: "en", narrationSrc: "proto/narration.wav" };
export const PARAMETRIC_ZH_DEFAULTS: ParametricData = { lang: "zh", narrationSrc: "proto/narration.wav" };

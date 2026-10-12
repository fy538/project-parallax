/** Compare the shipped editorial-title treatment with a type-led argument frame. */
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { fonts, palette } from "../design/theme";
import { TitleTransition } from "../templates/TitleTransition/TitleTransition";
import type { TitleTransitionData } from "../templates/TitleTransition/types";

const FRAMES_PER_DIRECTION = 120;
export const TYPOGRAPHY_DIRECTION_STUDY_DURATION = FRAMES_PER_DIRECTION * 2;

const currentData: TitleTransitionData = {
  episode: "promise-and-copy",
  episodeLabel: "PHILOSOPHY / 001",
  variant: "editorial-title",
  kicker: "PROMISE AND COPY",
  title: "The memory survives.",
  dek: "Does the duty?",
  backgroundVariant: "light",
  brandMark: "top-right",
  // Hold through the comparison cut instead of starting the template's exit fade.
  durationSec: 5,
};

const fade = (frame: number, start: number, end: number): number =>
  interpolate(frame, [start, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

type TypeLine = { text: string; size: number; indent?: number };
type TypeLedSpec = {
  kicker: string;
  meta: string;
  lines: TypeLine[];
  titleTop: number;
  titleTracking: number;
  titleLeading: number;
  question: string;
  questionSize: number;
  footer: string;
  image?: string;
};

const PROMISE_PLAIN: TypeLedSpec = {
  kicker: "PROMISE AND COPY",
  meta: "PHILOSOPHY / 001",
  lines: [{ text: "THE MEMORY", size: 184 }, { text: "SURVIVES.", size: 208, indent: 242 }],
  titleTop: 177,
  titleTracking: -10,
  titleLeading: 0.87,
  question: "DOES THE DUTY?",
  questionSize: 145,
  footer: "IMAGINED CASE / IDENTITY AND OBLIGATION",
};

const PROMISE_ILLUSTRATED: TypeLedSpec = {
  ...PROMISE_PLAIN,
  lines: [{ text: "THE MEMORY", size: 116 }, { text: "SURVIVES.", size: 144 }],
  titleTop: 225,
  titleTracking: -6,
  titleLeading: 0.94,
  image: "style-lab/promise-transfer-constructivist-v2.png",
};

const UNDERSTANDING_ILLUSTRATED: TypeLedSpec = {
  kicker: "ALIGNMENT / THE ANSWER",
  meta: "PHILOSOPHY / 002",
  lines: [
    { text: "IT GIVES THE", size: 112 },
    { text: "ANSWER", size: 165 },
    { text: "WE WANT.", size: 120 },
  ],
  titleTop: 184,
  titleTracking: -6,
  titleLeading: 0.91,
  question: "DID IT UNDERSTAND WHY?",
  questionSize: 106,
  footer: "IMAGINED CASE / ANSWERS AND REASONS",
  image: "style-lab/understanding-grid-constructivist-v2.png",
};

const TypeLedArgument: React.FC<{ spec: TypeLedSpec }> = ({ spec }) => {
  const frame = useCurrentFrame();
  const kickerOpacity = fade(frame, 12, 30);
  const statementOpacity = fade(frame, 18, 42);
  const questionOpacity = fade(frame, 30, 54);

  return (
    <AbsoluteFill style={{ background: palette.paper, color: palette.ink, overflow: "hidden" }}>
      {spec.image && (
        <Img
          src={staticFile(spec.image)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: statementOpacity }}
        />
      )}
      <div style={{ position: "absolute", left: 80, top: 63, fontFamily: fonts.metadata, fontSize: 19, letterSpacing: 2.2, color: palette.walnut, opacity: kickerOpacity }}>
        {spec.kicker}
      </div>
      <div style={{ position: "absolute", right: 80, top: 63, fontFamily: fonts.metadata, fontSize: 18, letterSpacing: 2, color: palette.walnut, opacity: kickerOpacity }}>
        {spec.meta}
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 107, height: 2, background: palette.ink, opacity: kickerOpacity }} />

      <div style={{ position: "absolute", left: 68, top: spec.titleTop, right: 50, fontFamily: fonts.display, fontWeight: 600, letterSpacing: spec.titleTracking, lineHeight: spec.titleLeading, opacity: statementOpacity }}>
        {spec.lines.map((line) => (
          <div key={line.text} style={{ fontSize: line.size, marginLeft: line.indent ?? 0, whiteSpace: "nowrap" }}>{line.text}</div>
        ))}
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 684, bottom: 0, background: palette.ink, opacity: questionOpacity }} />
      <div style={{ position: "absolute", left: 80, top: 733, right: 50, fontFamily: fonts.display, fontSize: spec.questionSize, fontWeight: 600, letterSpacing: -6, lineHeight: 0.98, whiteSpace: "nowrap", color: palette.paper, opacity: questionOpacity }}>
        {spec.question}
      </div>
      <div style={{ position: "absolute", left: 80, bottom: 63, fontFamily: fonts.metadata, fontSize: 17, letterSpacing: 1.5, color: palette.gold, opacity: questionOpacity }}>
        {spec.footer}
      </div>
    </AbsoluteFill>
  );
};

export const TypographyDirectionStudy: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={FRAMES_PER_DIRECTION}>
      <TitleTransition data={currentData} />
    </Sequence>
    <Sequence from={FRAMES_PER_DIRECTION} durationInFrames={FRAMES_PER_DIRECTION}>
      <TypeLedArgument spec={PROMISE_PLAIN} />
    </Sequence>
  </AbsoluteFill>
);

export const TypographyIllustrationStudy: React.FC = () => <TypeLedArgument spec={PROMISE_ILLUSTRATED} />;
export const TypographyUnderstandingStudy: React.FC = () => <TypeLedArgument spec={UNDERSTANDING_ILLUSTRATED} />;

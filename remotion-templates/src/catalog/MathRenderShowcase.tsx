/**
 * MathRenderShowcase — visual reference for MATH_RENDER_REGISTER.md.
 *
 * A sequential tour through all six math-rendering primitives, with a
 * label strip at the top of each section naming the primitive and its
 * editorial claim. Plays the role for math that
 * `TextAnimationShowcase` and `CompositePatternsShowcase` play for
 * their respective registers — a single composition the
 * visual-spec / script-draft / script-audit skills can reference for
 * "what does each primitive look like in motion."
 *
 * Sequenced sections (full-screen each, with a primitive label):
 *
 *   01 · REVEAL          MathReveal — single-equation write-on
 *   02 · STEP-BY-STEP    MathDerivation — Bayes update worked example
 *   03 · TERM-HIGHLIGHT  Substitute step with gold/rust color
 *   04 · ANNOTATION      KaTeX \underbrace / \overbrace on Bayes' rule
 *   05 · INLINE          MathInline in flowing prose
 *   06 · BOUNDED         MathDerivation — Newton's law where it breaks
 *
 * The "tour" format (vs. a mosaic) is the right cut here because math
 * primitives are MORE different from each other than text-animation
 * variants are — a side-by-side mosaic would be chaotic, while a
 * sequence reads as "watch how each editorial primitive lands."
 *
 * Reference: project/MATH_RENDER_REGISTER.md
 */

import React from "react";
import {
  AbsoluteFill,
  Composition,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  fonts,
  fontSizes,
  layout,
  palette,
  sec,
} from "../design/theme";
import { useCompositionAnimation } from "../hooks/useCompositionAnimation";
import { Background } from "../components/Background";
import { HeaderStrip } from "../components/HeaderStrip";
import { FooterStrip } from "../components/FooterStrip";
import { MathExpression } from "../components/MathExpression";
import { MathInline } from "../components/MathInline";
import { MathDerivation } from "../templates/MathDerivation/MathDerivation";
import { interpolate } from "remotion";
import { CLAMP_CUBIC } from "../utils/animation";
import { catalogId } from "./helpers";

import bayesAnnotatedData from "../../data/episodes/catalog/math-annotated-bayes.json";
import newtonBoundedData from "../../data/episodes/catalog/math-newton-bounded.json";
import type { MathDerivationData } from "../templates/MathDerivation/types";

// ── Section timing ────────────────────────────────────────────────────────

// Each section runs for `SECTION_SEC` seconds, with a small `LABEL_SEC`
// at the start where the primitive name fades in. Sections sum into the
// total composition duration.
const SECTION_SECONDS = [
  /* 01 reveal           */ 7,
  /* 02 step-by-step     */ 16,   // 4 steps × ~3.5s + entrance
  /* 03 term-highlight   */ 7,
  /* 04 annotation       */ 18,   // 4 annotated steps × ~4s
  /* 05 inline           */ 7,
  /* 06 bounded          */ 17,   // 4 bounded steps × ~4s
];
const SECTIONS_TOTAL_SEC = SECTION_SECONDS.reduce((a, b) => a + b, 0);
const SLATE_SEC = 2.5;   // Opening title card before section 01 begins
const TOTAL_SEC = SLATE_SEC + SECTIONS_TOTAL_SEC + 1.0; // Outro buffer

// ── Section label strip ───────────────────────────────────────────────────

const SectionLabel: React.FC<{
  ordinal: string;
  name: string;
  claim: string;
}> = ({ ordinal, name, claim }) => {
  const frame = useCurrentFrame();
  // The label fades in over the first 0.4s of each section, then sticks.
  const opacity = interpolate(frame, [0, sec(0.4)], [0, 1], CLAMP_CUBIC);
  return (
    <div
      style={{
        position: "absolute",
        top: layout.safeArea.top + 16,
        left: layout.safeArea.left,
        right: layout.safeArea.right,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: fontSizes.meta,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: palette.umber,
        }}
      >
        {ordinal} · {name}
      </div>
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 13,
          letterSpacing: 0.5,
          color: palette.walnut,
        }}
      >
        {claim}
      </div>
    </div>
  );
};

// ── Slate (opening title) ─────────────────────────────────────────────────

const Slate: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, sec(0.5), sec(SLATE_SEC - 0.6), sec(SLATE_SEC - 0.1)],
    [0, 1, 1, 0],
    CLAMP_CUBIC,
  );
  return (
    <Background variant="light">
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity,
        }}
      >
        <HeaderStrip mode="light" />
        <FooterStrip mode="light" />
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: palette.umber,
            marginBottom: 16,
          }}
        >
          Math render register · visual reference
        </div>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 56,
            fontWeight: 600,
            color: palette.ink,
            textAlign: "center",
            maxWidth: 1400,
            lineHeight: 1.15,
          }}
        >
          Six primitives for rendering mathematics with editorial weight.
        </div>
        <div
          style={{
            marginTop: 24,
            fontFamily: fonts.body,
            fontSize: 20,
            color: palette.walnut,
            textAlign: "center",
            maxWidth: 1000,
            lineHeight: 1.5,
          }}
        >
          Reveal · step-by-step · term-highlight · annotation · inline · bounded
        </div>
      </AbsoluteFill>
    </Background>
  );
};

// ── 01 · Reveal ───────────────────────────────────────────────────────────

const RevealSection: React.FC = () => {
  const frame = useCurrentFrame();
  // 1.4s reveal sweep, then hold.
  const reveal = interpolate(
    frame,
    [sec(0.6), sec(0.6 + 1.4)],
    [0, 1],
    CLAMP_CUBIC,
  );
  return (
    <Background variant="light">
      <AbsoluteFill>
        <HeaderStrip mode="light" />
        <FooterStrip mode="light" />
        <SectionLabel
          ordinal="01"
          name="Reveal"
          claim={"Here is the formal statement — left-to-right clip-path sweep."}
        />
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MathExpression
            formula="\\mathbb{E}[U_i] = p \\cdot a + (1-p) \\cdot b"
            reveal={reveal}
            fontSize={88}
            display
            color={palette.ink}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    </Background>
  );
};

// ── 02 · Step-by-step (Bayes worked example) ─────────────────────────────

// Re-use the Phase 2 sample — Bayes update with gold/rust substitutes.
const stepData: MathDerivationData = {
  episode: "catalog",
  title: "",
  steps: [
    {
      formula: "P(H \\mid E) = \\frac{P(E \\mid H) \\cdot P(H)}{P(E)}",
      annotation: "Bayes' rule",
      holdSec: 3.0,
    },
    {
      formula:
        "P(H \\mid E) = \\frac{P(E \\mid H) \\cdot P(H)}" +
        "{P(E \\mid H) \\cdot P(H) + P(E \\mid \\neg H) \\cdot P(\\neg H)}",
      annotation: "Expand the denominator (law of total probability)",
      holdSec: 3.5,
    },
    {
      formula:
        "P(H \\mid E) = \\frac{\\textcolor{#C4A747}{0.95} \\cdot \\textcolor{#A64D46}{0.01}}" +
        "{0.95 \\cdot 0.01 + 0.05 \\cdot 0.99}",
      annotation: "Substitute: test sensitivity (gold), prior (rust)",
      holdSec: 3.5,
    },
    {
      formula: "P(H \\mid E) \\approx 0.16",
      annotation: "Low base rate dominates the posterior",
      holdSec: 4.0,
    },
  ],
  source: undefined,
  crossfadeSec: 0.5,
  fontSize: 52,
  display: true,
};

const StepByStepSection: React.FC = () => (
  <AbsoluteFill>
    <SectionLabel
      ordinal="02"
      name="Step-by-step"
      claim={"The derivation IS the argument — four-step Bayes update with substitutions."}
    />
    <MathDerivation data={stepData} />
  </AbsoluteFill>
);

// ── 03 · Term-highlight (single equation, color injection) ───────────────

const TermHighlightSection: React.FC = () => {
  const frame = useCurrentFrame();
  // Two states: plain (frames 0..2.5s), highlighted (2.5s..end).
  // Crossfade between them over 0.4s.
  const highlightProgress = interpolate(
    frame,
    [sec(2.5), sec(2.9)],
    [0, 1],
    CLAMP_CUBIC,
  );
  return (
    <Background variant="light">
      <AbsoluteFill>
        <HeaderStrip mode="light" />
        <FooterStrip mode="light" />
        <SectionLabel
          ordinal="03"
          name="Term-highlight"
          claim={"Look at THIS piece — gold/rust color via \\textcolor in TeX."}
        />
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", minHeight: 200 }}>
            <div style={{ position: "absolute", inset: 0, opacity: 1 - highlightProgress }}>
              <MathExpression
                formula="\\mathbb{E}[U_D] - \\mathbb{E}[U_C] = p(T - R) + (1-p)(P - S)"
                reveal={1}
                fontSize={64}
                display
                color={palette.ink}
              />
            </div>
            <div style={{ position: "absolute", inset: 0, opacity: highlightProgress }}>
              <MathExpression
                formula="\\mathbb{E}[U_D] - \\mathbb{E}[U_C] = p\\textcolor{#A64D46}{(T - R)} + (1-p)\\textcolor{#A64D46}{(P - S)}"
                reveal={1}
                fontSize={64}
                display
                color={palette.ink}
              />
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </Background>
  );
};

// ── 04 · Annotation (\underbrace / \overbrace) ───────────────────────────

const AnnotationSection: React.FC = () => (
  <AbsoluteFill>
    <SectionLabel
      ordinal="04"
      name="Annotation"
      claim={"Translating jargon to plain language — KaTeX \\underbrace / \\overbrace."}
    />
    <MathDerivation data={bayesAnnotatedData as unknown as MathDerivationData} />
  </AbsoluteFill>
);

// ── 05 · Inline (prose with embedded math) ───────────────────────────────

const InlineSection: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [sec(0.6), sec(1.0)], [0, 1], CLAMP_CUBIC);
  return (
    <Background variant="light">
      <AbsoluteFill>
        <HeaderStrip mode="light" />
        <FooterStrip mode="light" />
        <SectionLabel
          ordinal="05"
          name="Inline"
          claim={"The math glyph belongs inside the prose — $...$ markers parsed by MathInline."}
        />
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: `${layout.safeArea.top * 2}px ${layout.safeArea.right * 2}px`,
            gap: layout.spacing.xl,
            opacity,
          }}
        >
          <MathInline
            text={
              "In the iterated game, the expected payoff under tit-for-tat is " +
              "$\\mathbb{E}[U] = pR + (1-p)S$ — strictly greater than the " +
              "one-shot payoff $S$ whenever the discount factor " +
              "$\\delta > (T - R) / (T - P)$."
            }
            fontSize={32}
            color={palette.ink}
            block
            style={{ lineHeight: 1.6 }}
          />
          <MathInline
            text={
              "Example: with $R = 3$, $S = 0$, $T = 5$, $P = 1$, " +
              "cooperation is stable for any $\\delta > 0.5$."
            }
            fontSize={28}
            color={palette.walnut}
            block
            style={{ lineHeight: 1.6 }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    </Background>
  );
};

// ── 06 · Bounded (signature form) ────────────────────────────────────────

const BoundedSection: React.FC = () => (
  <AbsoluteFill>
    <SectionLabel
      ordinal="06"
      name="Bounded"
      claim={"This works here; this is where it stops working — Parallax's signature form, math edition."}
    />
    <MathDerivation data={newtonBoundedData as unknown as MathDerivationData} />
  </AbsoluteFill>
);

// ── Top-level showcase ────────────────────────────────────────────────────

export const MathRenderShowcase: React.FC = () => {
  const { fps } = useVideoConfig();
  useCompositionAnimation({ noDrift: true, noExit: true });

  // Per-section frame windows, computed from the SECTION_SECONDS array.
  let cursor = Math.round(SLATE_SEC * fps);
  const windows = SECTION_SECONDS.map((s) => {
    const from = cursor;
    const durationInFrames = Math.round(s * fps);
    cursor += durationInFrames;
    return { from, durationInFrames };
  });

  const sections = [
    RevealSection,
    StepByStepSection,
    TermHighlightSection,
    AnnotationSection,
    InlineSection,
    BoundedSection,
  ];

  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={Math.round(SLATE_SEC * fps)}>
        <Slate />
      </Sequence>
      {sections.map((Section, i) => (
        <Sequence
          key={i}
          from={windows[i].from}
          durationInFrames={windows[i].durationInFrames}
        >
          <Section />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const CatalogMathRenderShowcase = () => (
  <Composition
    id={catalogId("Showcase", "math-render")}
    component={MathRenderShowcase}
    durationInFrames={Math.round(TOTAL_SEC * layout.fps)}
    fps={layout.fps}
    width={layout.width}
    height={layout.height}
  />
);

/**
 * MathPrimitives — Catalog showcase compositions for the math-rendering
 * register's Phase 3 primitives: bounded, annotation, and inline.
 *
 * Three Compositions register here:
 *
 *   catalog-math-annotated-bayes
 *     MathDerivation loaded with the annotation fixture (uses KaTeX-native
 *     \underbrace / \overbrace for "posterior", "likelihood", "prior",
 *     "evidence" labels). Demonstrates the annotation primitive — the
 *     editorial gloss of formal notation into plain language without
 *     leaving the math typography.
 *
 *   catalog-math-newton-bounded
 *     MathDerivation loaded with the bounded fixture (Newton's law,
 *     followed by the assumption that breaks it, followed by the
 *     relativistic generalization). Demonstrates the bounded primitive —
 *     Parallax's signature form, math edition: "this equation works
 *     here, breaks here, dangerous when extended past here."
 *
 *   catalog-math-inline-demo
 *     A small composition showing <MathInline> rendering math
 *     embedded in flowing prose. Demonstrates the inline primitive —
 *     captions / labels / body text can carry inline math via $...$
 *     markers without dropping out of the brand typography.
 *
 * Together with `catalog-math-expected-utility` (MathReveal) and the
 * default MathDerivation (Bayes update worked example), these cover
 * the Phase 1–3 surface of the math-rendering register.
 *
 * Phase 4 will land MATH_RENDER_REGISTER.md doctrine + a unified
 * `catalog-showcase-math-render` reference card alongside the existing
 * text-animation and drift-register showcases.
 */

import React from "react";
import { AbsoluteFill, Composition } from "remotion";
import { fonts, fontSizes, layout, palette, sec } from "../design/theme";
import { useCompositionAnimation } from "../hooks/useCompositionAnimation";
import { Background } from "../components/Background";
import { HeaderStrip } from "../components/HeaderStrip";
import { FooterStrip } from "../components/FooterStrip";
import { MathDerivation } from "../templates/MathDerivation/MathDerivation";
import { MathDerivationSchema } from "../templates/MathDerivation/schema";
import { crossfadeDurationFrames } from "../components/MathCrossfade";
import { MathInline } from "../components/MathInline";
import type { MathDerivationData } from "../templates/MathDerivation/types";
import { catalogId } from "./helpers";

// ── Fixture imports (loaded at build time, baked into bundle) ─────────────

import bayesAnnotatedData from "../../data/episodes/catalog/math-annotated-bayes.json";
import newtonBoundedData from "../../data/episodes/catalog/math-newton-bounded.json";

// ── Annotated Bayes (annotation primitive) ────────────────────────────────

export const CatalogMathAnnotatedBayes: React.FC = () => (
  <Composition
    id={catalogId("MathDerivation", "annotated-bayes")}
    component={MathDerivation}
    schema={MathDerivationSchema}
    calculateMetadata={async ({ props }) => {
      const data = (props as { data: MathDerivationData }).data;
      const stepFrames = crossfadeDurationFrames(data.steps);
      const entranceFrames = sec(1.5);
      return { durationInFrames: stepFrames + entranceFrames, fps: 30 };
    }}
    durationInFrames={1}
    fps={30}
    width={layout.width}
    height={layout.height}
    defaultProps={{ data: bayesAnnotatedData as unknown as MathDerivationData }}
  />
);

// ── Newton bounded (bounded primitive) ────────────────────────────────────

export const CatalogMathNewtonBounded: React.FC = () => (
  <Composition
    id={catalogId("MathDerivation", "newton-bounded")}
    component={MathDerivation}
    schema={MathDerivationSchema}
    calculateMetadata={async ({ props }) => {
      const data = (props as { data: MathDerivationData }).data;
      const stepFrames = crossfadeDurationFrames(data.steps);
      const entranceFrames = sec(1.5);
      return { durationInFrames: stepFrames + entranceFrames, fps: 30 };
    }}
    durationInFrames={1}
    fps={30}
    width={layout.width}
    height={layout.height}
    defaultProps={{ data: newtonBoundedData as unknown as MathDerivationData }}
  />
);

// ── Inline math demo ──────────────────────────────────────────────────────

// Small standalone composition demonstrating MathInline working in body
// prose. Two paragraphs — one explanatory, one a numbered example —
// each carrying math glyphs interleaved with text.
const MathInlineDemo: React.FC = () => {
  const { style: compStyle } = useCompositionAnimation();
  return (
    <Background variant="light">
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode="light" />
        <FooterStrip mode="light" />

        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: `${layout.safeArea.top * 2}px ${layout.safeArea.right * 2}px`,
            gap: layout.spacing.xl,
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
            Math-rendering register · inline primitive
          </div>

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
              "cooperation is stable for any " +
              "$\\delta > 0.5$ — even modestly forward-looking players " +
              "can sustain it indefinitely."
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

export const CatalogMathInlineDemo: React.FC = () => (
  <Composition
    id={catalogId("MathInline", "demo")}
    component={MathInlineDemo}
    durationInFrames={sec(8)}
    fps={30}
    width={layout.width}
    height={layout.height}
  />
);

import { Composition } from "remotion";
import { MathReveal } from "./MathReveal";
import { standardMetadata } from "../../utils/composition";
import { MathRevealSchema } from "./schema";
import type { MathRevealData } from "./types";

const sampleData: MathRevealData = {
  episode: "prisoners-dilemma",
  title: "Expected utility under cooperation probability",
  // No subtitle — caption below the math carries the gloss.
  formula: "\\mathbb{E}[U_i] = p \\cdot a + (1-p) \\cdot b",
  caption: "Player i's expected payoff when the other cooperates with probability p.",
  source: "Axelrod (1984), iterated tournament",
  durationSec: 10,
  revealSec: 1.4,
  holdAfterRevealSec: 2.0,
  fontSize: 72,
  display: true,
};

export const MathRevealComposition = () => (
  <Composition
    id="MathReveal"
    component={MathReveal}
    schema={MathRevealSchema}
    calculateMetadata={standardMetadata<MathRevealData>(10)}
    defaultProps={{ data: sampleData }}
  />
);

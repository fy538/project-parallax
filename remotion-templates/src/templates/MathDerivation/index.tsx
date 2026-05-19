import { Composition } from "remotion";
import { MathDerivation } from "./MathDerivation";
import { MathDerivationSchema } from "./schema";
import { crossfadeDurationFrames } from "../../components/MathCrossfade";
import { sec } from "../../design/theme";
import type { MathDerivationData } from "./types";

// Sample data — classic Bayesian update worked example. Shows why a 95%
// accurate test on a 1% base rate yields only ~16% posterior, a result
// that's counterintuitive without seeing the derivation step by step.
// Pulled from the standard medical-screening framing (Kahneman, Thinking
// Fast and Slow, ch. 16; also Kahneman & Tversky 1973).
const sampleData: MathDerivationData = {
  episode: "prisoners-dilemma",
  title: "Bayesian update under a noisy test",
  steps: [
    {
      formula: "P(H \\mid E) = \\frac{P(E \\mid H) \\cdot P(H)}{P(E)}",
      annotation: "Bayes' rule: the posterior in terms of likelihood, prior, and evidence",
      holdSec: 3.0,
    },
    {
      formula:
        "P(H \\mid E) = \\frac{P(E \\mid H) \\cdot P(H)}" +
        "{P(E \\mid H) \\cdot P(H) + P(E \\mid \\neg H) \\cdot P(\\neg H)}",
      annotation: "Expand the denominator via the law of total probability",
      holdSec: 3.5,
    },
    {
      formula:
        "P(H \\mid E) = \\frac{\\textcolor{#C4A747}{0.95} \\cdot \\textcolor{#A64D46}{0.01}}" +
        "{0.95 \\cdot 0.01 + 0.05 \\cdot 0.99}",
      annotation: "Substitute: test sensitivity 0.95 (gold), base rate 0.01 (rust)",
      holdSec: 3.5,
    },
    {
      formula: "P(H \\mid E) \\approx 0.16",
      annotation: "Even with a 95% accurate test, low base rate dominates the posterior",
      holdSec: 4.0,
    },
  ],
  source: "Standard worked example · Kahneman, Thinking Fast and Slow, ch. 16",
  crossfadeSec: 0.5,
  fontSize: 56,
  display: true,
};

export const MathDerivationComposition = () => (
  <Composition
    id="MathDerivation"
    component={MathDerivation}
    schema={MathDerivationSchema}
    // Duration = sum(holdSec) + entrance buffer + exit fade buffer.
    // 1.5s entrance + sum(holdSec) + the in-step holdSec already
    // covers exit-fade overlap; no extra padding needed.
    calculateMetadata={async ({ props }) => {
      const data = (props as { data: MathDerivationData }).data;
      const stepFrames = crossfadeDurationFrames(data.steps);
      const entranceFrames = sec(1.5);
      return {
        durationInFrames: stepFrames + entranceFrames,
        // fps + width + height come from the composition defaults below.
        fps: 30,
      };
    }}
    durationInFrames={1}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ data: sampleData }}
  />
);

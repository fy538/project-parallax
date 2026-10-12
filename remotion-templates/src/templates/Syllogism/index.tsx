import { Composition } from "remotion";
import { Syllogism } from "./Syllogism";
import { standardMetadata } from "../../utils/composition";
import { SyllogismSchema } from "./schema";
import type { SyllogismData } from "./types";

// Default props — the Mearsheimer-style realist deduction about sovereign
// powers. Demonstrates the canonical Syllogism register: general premise,
// specific instance, ∴ conclusion. (Whether this argument is sound is a
// separate question — that's why `validity: "fallacy"` mode exists.)
export const syllogismSampleData: SyllogismData = {
  episode: "realist-deductions",
  title: "THE STRUCTURAL ARGUMENT",
  subtitle: "Why realists keep arriving at the same conclusion.",
  source: "Mearsheimer, J. (2014). Why the Ukraine Crisis Is the West's Fault.",
  majorPremise: "All great powers fear loss of regional dominance.",
  minorPremise: "Russia is a great power with a claimed regional sphere.",
  conclusion: "Russia will resist NATO expansion into its sphere.",
  validity: "valid",
  argumentAttribution: "Mearsheimer (2014)",
  durationSec: 10,
};

export const SyllogismComposition = () => (
  <Composition
    id="Syllogism"
    component={Syllogism}
    schema={SyllogismSchema}
    calculateMetadata={standardMetadata<SyllogismData>(10)}
    defaultProps={{ data: syllogismSampleData as SyllogismData }}
  />
);

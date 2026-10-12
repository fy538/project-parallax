import { Composition } from "remotion";
import { CounterfactualPath } from "./CounterfactualPath";
import { standardMetadata } from "../../utils/composition";
import { CounterfactualPathSchema } from "./schema";
import type { CounterfactualPathData } from "./types";

// Default props — Cuban Missile Crisis bifurcation. The canonical
// counterfactual case: Kennedy chose blockade (actual); ExComm considered
// airstrike (CF up — likely nuclear escalation) and invasion (CF down —
// almost certainly nuclear). The decision point is October 1962.
export const counterfactualPathSampleData: CounterfactualPathData = {
  episode: "missile-crisis-bifurcation",
  title: "THE ROADS NOT TAKEN",
  subtitle:
    "October 1962 — three options on the ExComm table; Kennedy picked the third.",
  source: "Allison & Zelikow, *Essence of Decision* (1999); Dobrynin memoirs",
  branchYear: "OCT 1962",
  branchEvent: "Cuban Missile Crisis",
  preBranchLabel: "Pre-crisis Cold War balance",
  actual: {
    label: "Naval blockade",
    outcome:
      "Khrushchev withdraws missiles; secret Jupiter trade in Turkey; Cold War de-escalates briefly into détente phase.",
  },
  counterfactuals: [
    {
      label: "Airstrike on missile sites",
      outcome:
        "Soviet tactical nukes (since revealed to have been deployed) likely fire on US forces; rapid escalation to general nuclear exchange.",
      direction: "up",
      plausibility: "Plausible — favoured by Joint Chiefs",
    },
    {
      label: "Full invasion of Cuba",
      outcome:
        "Worst case: Soviet tactical nuclear use + Castro's stand-and-fight order = near-certain nuclear war.",
      direction: "down",
      plausibility: "Marginal — would have required congressional cover",
    },
  ],
  caption:
    "Each counterfactual passes the Hawthorn plausibility test: based on documented ExComm deliberations and post-1991 Soviet archive disclosures, both alternatives were real possibilities, not idle speculation.",
  durationSec: 16,
};

export const CounterfactualPathComposition = () => (
  <Composition
    id="CounterfactualPath"
    component={CounterfactualPath}
    schema={CounterfactualPathSchema}
    calculateMetadata={standardMetadata<CounterfactualPathData>(14)}
    defaultProps={{ data: counterfactualPathSampleData as CounterfactualPathData }}
  />
);

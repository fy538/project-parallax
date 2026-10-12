import { Composition } from "remotion";
import { ConditionalArgument } from "./ConditionalArgument";
import { standardMetadata } from "../../utils/composition";
import { ConditionalArgumentSchema } from "./schema";
import type { ConditionalArgumentData } from "./types";

// Default props — Taiwan contingency. The canonical IF/THEN forecasting
// case for the Indo-Pacific. The "invasion" branch is high-severity (war
// risk); the "blockade" branch is medium-severity (deterrence test
// without crossing the kinetic-force line).
export const conditionalArgumentSampleData: ConditionalArgumentData = {
  episode: "taiwan-contingency",
  title: "THE BIFURCATION POINT",
  subtitle:
    "How China escalates determines what the US has to defend against.",
  source: "CSIS, RAND, Brookings scenario analyses (2023-2024)",
  condition: "China moves militarily against Taiwan within five years.",
  ifTrue: {
    label: "Invasion",
    consequence:
      "Direct US credibility test under the Taiwan Relations Act — likely conventional war in the first island chain.",
    severity: "critical",
    probabilityGloss: "~15% analyst consensus",
  },
  ifFalse: {
    label: "Blockade or quarantine",
    consequence:
      "Deterrence test without kinetic engagement — US response calibrated to avoid first-shot framing while preserving freedom-of-navigation.",
    severity: "high",
    probabilityGloss: "~30% analyst consensus",
  },
  determinant:
    "Domestic Chinese economic conditions in 2026–2029 likely determine which path the PLA recommends.",
  durationSec: 12,
};

export const ConditionalArgumentComposition = () => (
  <Composition
    id="ConditionalArgument"
    component={ConditionalArgument}
    schema={ConditionalArgumentSchema}
    calculateMetadata={standardMetadata<ConditionalArgumentData>(12)}
    defaultProps={{ data: conditionalArgumentSampleData as ConditionalArgumentData }}
  />
);

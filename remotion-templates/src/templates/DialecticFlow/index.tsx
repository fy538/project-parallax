import { Composition } from "remotion";
import { DialecticFlow } from "./DialecticFlow";
import { standardMetadata } from "../../utils/composition";
import { DialecticFlowSchema } from "./schema";
import type { DialecticFlowData } from "./types";

// Default props — the trade dialectic. Free trade benefits all (thesis,
// classical liberal); free trade harms domestic producers and workers
// (antithesis, populist/labor); managed trade with strategic protection
// of key sectors (synthesis, the actual policy regime most states adopt).
export const dialecticFlowSampleData: DialecticFlowData = {
  episode: "trade-dialectic",
  title: "THE TRADE DIALECTIC",
  subtitle: "How modern industrial policy emerged from a contradiction.",
  source: "Rodrik, D. (2017). Straight Talk on Trade.",
  thesis: {
    label: "Free Trade",
    body: "Comparative advantage makes everyone better off; protectionism is self-harm.",
    attribution: "Ricardo, 1817",
  },
  antithesis: {
    label: "Trade Harms",
    body: "Workers in displaced industries don't get compensated; aggregate gains mask localised devastation.",
    attribution: "Polanyi, 1944",
  },
  synthesis: {
    label: "Managed Trade",
    body: "Strategic protection of key sectors paired with adjustment assistance — the policy regime most industrial states actually adopt.",
    attribution: "Rodrik, 2017",
  },
  tensionLabel: "Contradiction",
  durationSec: 14,
};

export const DialecticFlowComposition = () => (
  <Composition
    id="DialecticFlow"
    component={DialecticFlow}
    schema={DialecticFlowSchema}
    calculateMetadata={standardMetadata<DialecticFlowData>(14)}
    defaultProps={{ data: dialecticFlowSampleData as DialecticFlowData }}
  />
);

import { Composition } from "remotion";
import { ToulminMap } from "./ToulminMap";
import { standardMetadata } from "../../utils/composition";
import { ToulminMapSchema } from "./schema";
import type { ToulminMapData } from "./types";

// Default props — the Taiwan semiconductor deterrence argument.
// All six Toulmin elements populated so the composition previews the full layout.
export const toulminMapSampleData: ToulminMapData = {
  episode: "silicon-trap",
  title: "THE ARGUMENT MAP",
  subtitle: "Toulmin structure: Taiwan's semiconductor deterrence.",
  source: "TSMC Annual Report 2024; Chipwar (Miller 2022); CSIS Taiwan Strait Analysis",
  data: [
    {
      text: "Taiwan's TSMC produces 92% of the world's most advanced chips.",
      attribution: "TSMC Annual Report 2024",
    },
  ],
  claim: {
    text: "Taiwan holds extraordinary strategic deterrence value.",
    emphasis: true,
  },
  warrant: {
    text: "Control over critical chokepoints grants strategic leverage.",
  },
  backing: {
    text: "Historical precedent — Suez Canal, Panama Canal, Strait of Hormuz.",
  },
  qualifier: {
    text: "As long as no fab alternative emerges.",
  },
  rebuttal: {
    text: "Semiconductor autarky succeeds in the US or EU.",
    prefix: "UNLESS",
  },
  revealMode: "sequential",
  durationSec: 14,
};

// Bound calculateMetadata for external use (e.g., Root.tsx when registered).
export const calculateMetadata = standardMetadata<ToulminMapData>(14);

export const ToulminMapComposition = () => (
  <Composition
    id="ToulminMap"
    component={ToulminMap}
    schema={ToulminMapSchema}
    calculateMetadata={calculateMetadata}
    defaultProps={{ data: toulminMapSampleData as ToulminMapData }}
  />
);

export { ToulminMap, ToulminMapSchema };
export type { ToulminMapData };

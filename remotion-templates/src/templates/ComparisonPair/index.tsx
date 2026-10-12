import { Composition } from "remotion";
import { ComparisonPair } from "./ComparisonPair";
import { standardMetadata } from "../../utils/composition";
import { ComparisonPairSchema } from "./schema";
import type { ComparisonPairData } from "./types";

// Default props — two StatReveals showing US military spending across
// the long 20th-century arc. The dramatic comparison ("$0.7B vs $886B")
// makes the cross-era structural-shift argument legible in 12 seconds.
//
// StatReveal is chosen for the default because (a) single dramatic
// numbers scale gracefully at 50% size, and (b) the comparison form
// reads viscerally at video resolution.
export const comparisonPairSampleData: ComparisonPairData = {
  episode: "military-budgets-century",
  title: "AN ORDER-OF-MAGNITUDE SHIFT",
  subtitle: "US military spending across a century of war and Cold War.",
  source: "SIPRI; Historical Statistics of the United States",
  divider: "rule",
  revealOrder: "sync",
  durationSec: 12,
  left: {
    template: "StatReveal",
    label: "1914",
    caption:
      "On the eve of the Great War — a fraction of GDP, a frontier army.",
    data: {
      episode: "military-budgets-century",
      title: "Defense Budget, 1914",
      subtitle: "(in 2024 dollars)",
      stat: {
        value: 17,
        prefix: "$",
        suffix: "B",
        label: "Total US defense outlay",
        decimals: 0,
        countUp: true,
      },
      comparisons: [
        { label: "Marshall Plan", value: 173, color: "#5DAA68" },
        { label: "Manhattan Project", value: 30, color: "#C23B22" },
      ],
      source: "",
      durationSec: 12,
    },
  },
  right: {
    template: "StatReveal",
    label: "2024",
    caption:
      "A standing global military with continuous overseas commitment.",
    data: {
      episode: "military-budgets-century",
      title: "Defense Budget, 2024",
      subtitle: "(in 2024 dollars)",
      stat: {
        value: 886,
        prefix: "$",
        suffix: "B",
        label: "Total US defense outlay",
        decimals: 0,
        countUp: true,
      },
      comparisons: [
        { label: "Apollo Program", value: 194, color: "#3266AD" },
        { label: "Marshall Plan", value: 173, color: "#5DAA68" },
      ],
      source: "",
      durationSec: 12,
    },
  },
};

export const ComparisonPairComposition = () => (
  <Composition
    id="ComparisonPair"
    component={ComparisonPair}
    schema={ComparisonPairSchema}
    calculateMetadata={standardMetadata<ComparisonPairData>(12)}
    defaultProps={{ data: comparisonPairSampleData as ComparisonPairData }}
  />
);

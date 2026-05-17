import { Composition } from "remotion";
import { ProbabilityGauge } from "./ProbabilityGauge";
import { standardMetadata } from "../../utils/composition";
import { ProbabilityGaugeSchema } from "./schema";
import type { ProbabilityGaugeData } from "./types";

const sampleData: ProbabilityGaugeData = {
  episode: "EP00",
  title: "Taiwan Strait Conflict Probability",
  subtitle: "Market consensus vs. analyst estimates",
  variant: "gauge",
  gauges: [
    { label: "Kalshi Market", value: 8, marketSource: "Kalshi" },
    { label: "Analyst Consensus", value: 22 },
    { label: "Our Estimate", value: 15, color: "#E5A544" },
  ],
  source: "Kalshi.com, CSIS survey, Parallax analysis — April 2026",
  durationSec: 8,
};

export const ProbabilityGaugeComposition = () => (
  <Composition
    id="ProbabilityGauge"
    component={ProbabilityGauge}
    schema={ProbabilityGaugeSchema}
    calculateMetadata={standardMetadata<ProbabilityGaugeData>(8)}
    defaultProps={{ data: sampleData }}
  />
);

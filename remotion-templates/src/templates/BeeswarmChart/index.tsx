import { Composition } from "remotion";
import { BeeswarmChart } from "./BeeswarmChart";
import { standardMetadata } from "../../utils/composition";
import { BeeswarmChartSchema } from "./schema";
import type { BeeswarmData } from "./types";

// Sample data: military spending as % of GDP, 2024.
// Most NATO members cluster below 2%; a handful run hot.
// Highlights the canonical editorial use case for a beeswarm —
// individual-entity legibility matters and a bar chart of 30 countries
// would compress illegibly.
const sampleData: BeeswarmData = {
  episode: "catalog",
  title: "Military Spending as % of GDP, 2024",
  subtitle:
    "Most NATO members fall under 2%; a handful run hot",
  items: [
    { label: "Iceland", value: 0.0 },
    { label: "Luxembourg", value: 1.3 },
    { label: "Spain", value: 1.3 },
    { label: "Belgium", value: 1.3 },
    { label: "Canada", value: 1.4 },
    { label: "Slovenia", value: 1.3 },
    { label: "Italy", value: 1.5 },
    { label: "Portugal", value: 1.5 },
    { label: "Türkiye", value: 1.5 },
    { label: "Croatia", value: 1.8 },
    { label: "Netherlands", value: 2.1 },
    { label: "Norway", value: 2.2 },
    { label: "Germany", value: 2.1 },
    { label: "France", value: 2.1 },
    { label: "Albania", value: 2.0 },
    { label: "Czechia", value: 2.1 },
    { label: "Slovakia", value: 2.0 },
    { label: "Bulgaria", value: 2.2 },
    { label: "Romania", value: 2.3 },
    { label: "Hungary", value: 2.1 },
    { label: "Denmark", value: 2.4 },
    { label: "Montenegro", value: 2.0 },
    { label: "UK", value: 2.3 },
    { label: "Finland", value: 2.4 },
    { label: "Lithuania", value: 2.9 },
    { label: "Estonia", value: 3.4 },
    { label: "Greece", value: 3.1 },
    { label: "Latvia", value: 3.2 },
    { label: "USA", value: 3.4, highlight: true },
    { label: "Poland", value: 4.1, highlight: true },
    { label: "Israel", value: 5.2, highlight: true },
    { label: "Russia", value: 5.9, highlight: true },
    { label: "Saudi Arabia", value: 7.1, highlight: true },
  ],
  axisLabel: "% of GDP",
  unit: "%",
  valueFormat: "percent",
  referenceLine: { value: 2.0, label: "NATO target: 2.0%" },
  source: "SIPRI Military Expenditure Database, 2024",
  durationSec: 12,
};

export const BeeswarmChartComposition = () => (
  <Composition
    id="BeeswarmChart"
    component={BeeswarmChart}
    schema={BeeswarmChartSchema}
    calculateMetadata={standardMetadata<BeeswarmData>(12)}
    defaultProps={{ data: sampleData as BeeswarmData }}
  />
);

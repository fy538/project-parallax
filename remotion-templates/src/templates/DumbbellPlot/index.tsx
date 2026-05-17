import { Composition } from "remotion";
import { DumbbellPlot } from "./DumbbellPlot";
import { standardMetadata } from "../../utils/composition";
import { DumbbellPlotSchema } from "./schema";
import type { DumbbellPlotData } from "./types";

const sampleData: DumbbellPlotData = {
  episode: "income-spread",
  title: "Income Inequality, by Country",
  subtitle:
    "From the 10th percentile to the 90th — the spread that policy lives in",
  xAxisLabel: "Annual income (USD PPP)",
  xUnit: "USD PPP",
  valueFormat: "currency",
  lowLegendLabel: "10th percentile",
  highLegendLabel: "90th percentile",
  sortBy: "range",
  source: "OECD Income Distribution Database 2023",
  durationSec: 14,
  items: [
    { label: "United States", low: 11000, high: 142000, highlight: true },
    { label: "Canada",        low: 17000, high: 96000 },
    { label: "United Kingdom", low: 13000, high: 95000 },
    { label: "Germany",       low: 17000, high: 89000 },
    { label: "South Korea",   low: 14000, high: 79000 },
    { label: "Japan",         low: 14000, high: 78000 },
    { label: "Denmark",       low: 22000, high: 76000, highlight: true },
    { label: "France",        low: 16000, high: 75000 },
    { label: "Sweden",        low: 21000, high: 72000, highlight: true },
    { label: "Italy",         low: 12000, high: 71000 },
    { label: "Mexico",        low: 5000,  high: 51000 },
    { label: "Brazil",        low: 4000,  high: 58000 },
  ],
};

export const DumbbellPlotComposition = () => (
  <Composition
    id="DumbbellPlot"
    component={DumbbellPlot}
    schema={DumbbellPlotSchema}
    calculateMetadata={standardMetadata<DumbbellPlotData>(12)}
    defaultProps={{ data: sampleData }}
  />
);

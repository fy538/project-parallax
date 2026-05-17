import { Composition } from "remotion";
import { HorizonChart } from "./HorizonChart";
import { standardMetadata } from "../../utils/composition";
import { HorizonChartSchema } from "./schema";
import type { HorizonChartData, HorizonDatum } from "./types";

// NOTE: illustrative — these are NOT real FX prints. The shapes are
// hand-tuned deterministic dummy values so the visual reads as plausible
// BRICS+ daily-change volatility, with RUB and IRR running wider swings
// than the rest. Use real central-bank or BIS data before any episode
// publishes against this composition.
const buildSeries = (
  amplitude: number,
  phase: number,
  spike: number,
  spikeAt: number,
): HorizonDatum[] => {
  const points: HorizonDatum[] = [];
  // 24 x-positions ≈ twice-monthly over a year.
  for (let i = 0; i < 24; i++) {
    const t = i;
    // Deterministic — no Math.random. Two sinusoids + an indexed
    // perturbation so adjacent points don't track a clean wave.
    const base =
      Math.sin((t / 24) * Math.PI * 2 + phase) * amplitude +
      Math.sin((t / 24) * Math.PI * 6 + phase * 1.3) * amplitude * 0.4 +
      ((i * 37) % 11 - 5) * 0.15;
    const v = i === spikeAt ? base + spike : base;
    points.push({ x: t, value: Number(v.toFixed(2)) });
  }
  return points;
};

const sampleData: HorizonChartData = {
  episode: "catalog",
  title: "BRICS+ Currency Volatility, 2024",
  subtitle:
    "Daily % change vs USD — sized to fit, layered to compare",
  series: [
    {
      id: "brl",
      label: "BRL",
      sublabel: "Brazil",
      values: buildSeries(2.2, 0.0, 3.5, 14),
    },
    {
      id: "rub",
      label: "RUB",
      sublabel: "Russia",
      values: buildSeries(5.0, 1.1, -7.0, 9),
    },
    {
      id: "inr",
      label: "INR",
      sublabel: "India",
      values: buildSeries(1.4, 0.6, 2.0, 18),
    },
    {
      id: "cny",
      label: "CNY",
      sublabel: "China",
      values: buildSeries(0.9, 0.3, 1.4, 5),
    },
    {
      id: "zar",
      label: "ZAR",
      sublabel: "South Africa",
      values: buildSeries(2.6, 2.2, -4.0, 16),
    },
    {
      id: "egp",
      label: "EGP",
      sublabel: "Egypt",
      values: buildSeries(2.0, 1.7, 5.5, 7),
    },
    {
      id: "irr",
      label: "IRR",
      sublabel: "Iran",
      values: buildSeries(4.8, 0.9, -6.5, 20),
    },
    {
      id: "aed",
      label: "AED",
      sublabel: "UAE",
      values: buildSeries(0.6, 2.0, 0.8, 11),
    },
  ],
  xAxisLabel: "2024 (twice-monthly)",
  valueFormat: "number",
  bands: 3,
  baseline: 0,
  source: "FX data illustrative; not a verified dataset",
  durationSec: 12,
};

export const HorizonChartComposition = () => (
  <Composition
    id="HorizonChart"
    component={HorizonChart}
    schema={HorizonChartSchema}
    calculateMetadata={standardMetadata<HorizonChartData>(12)}
    defaultProps={{ data: sampleData as HorizonChartData }}
  />
);

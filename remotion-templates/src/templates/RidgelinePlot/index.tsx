import { Composition } from "remotion";
import { RidgelinePlot } from "./RidgelinePlot";
import { standardMetadata } from "../../utils/composition";
import { RidgelinePlotSchema } from "./schema";
import type { RidgelinePlotData } from "./types";

// Sample data: life expectancy at birth by continent.
//
// The editorial point is the *distributional shape* gap, not the mean
// gap. Africa shows a broad, lower-centered distribution; Europe shows
// a narrow peak near 82; Asia and Americas sit in between with medium
// spread. Highlighting Africa + Europe foregrounds the contrast — the
// "developmental tail" the channel often returns to.
//
// Density samples are pre-computed normalized Gaussians at 12 x-points
// from 50 to 88 years. Peak y-values land between ~0.057 (Africa, wide)
// and ~0.119 (Europe, narrow) — the shared y-scale will visually flatten
// the wider distribution and crank up the narrow peak, which is exactly
// the editorial reading we want.
const sampleData: RidgelinePlotData = {
  episode: "catalog",
  title: "Life Expectancy at Birth, by Continent",
  subtitle: "The Africa-Europe gap, in distributional shape",
  groups: [
    {
      id: "africa",
      label: "Africa",
      color: "rust",
      density: [
        { x: 50, y: 0.0077 },
        { x: 53, y: 0.0166 },
        { x: 56, y: 0.0297 },
        { x: 60, y: 0.0484 },
        { x: 64, y: 0.057 },
        { x: 68, y: 0.0484 },
        { x: 72, y: 0.0297 },
        { x: 76, y: 0.0131 },
        { x: 80, y: 0.0042 },
        { x: 83, y: 0.0014 },
        { x: 86, y: 0.0004 },
        { x: 88, y: 0.0002 },
      ],
    },
    {
      id: "asia",
      label: "Asia",
      color: "amber",
      density: [
        { x: 50, y: 0.0001 },
        { x: 53, y: 0.0003 },
        { x: 56, y: 0.0009 },
        { x: 60, y: 0.0028 },
        { x: 64, y: 0.0098 },
        { x: 68, y: 0.0323 },
        { x: 72, y: 0.0625 },
        { x: 76, y: 0.0713 },
        { x: 80, y: 0.048 },
        { x: 83, y: 0.0252 },
        { x: 86, y: 0.0098 },
        { x: 88, y: 0.0044 },
      ],
    },
    {
      id: "americas",
      label: "Americas",
      color: "olive",
      density: [
        { x: 50, y: 0.0001 },
        { x: 53, y: 0.0002 },
        { x: 56, y: 0.0004 },
        { x: 60, y: 0.0012 },
        { x: 64, y: 0.0055 },
        { x: 68, y: 0.0183 },
        { x: 72, y: 0.0597 },
        { x: 76, y: 0.0887 },
        { x: 80, y: 0.0597 },
        { x: 83, y: 0.0264 },
        { x: 86, y: 0.0075 },
        { x: 88, y: 0.0025 },
      ],
    },
    {
      id: "europe",
      label: "Europe",
      color: "bronze",
      density: [
        { x: 50, y: 0.0001 },
        { x: 53, y: 0.0001 },
        { x: 56, y: 0.0001 },
        { x: 60, y: 0.0002 },
        { x: 64, y: 0.0005 },
        { x: 68, y: 0.0021 },
        { x: 72, y: 0.0089 },
        { x: 76, y: 0.0215 },
        { x: 80, y: 0.1026 },
        { x: 83, y: 0.1187 },
        { x: 86, y: 0.0571 },
        { x: 88, y: 0.0215 },
      ],
    },
    {
      id: "oceania",
      // "bone" was the agent's original choice but bone IS the paper
      // background — Oceania rendered as an invisible ridge. Swapped
      // to "taupe" for adequate contrast against the paper substrate.
      label: "Oceania",
      color: "taupe",
      density: [
        { x: 50, y: 0.0001 },
        { x: 53, y: 0.0001 },
        { x: 56, y: 0.0002 },
        { x: 60, y: 0.0004 },
        { x: 64, y: 0.0012 },
        { x: 68, y: 0.0041 },
        { x: 72, y: 0.0135 },
        { x: 76, y: 0.0605 },
        { x: 80, y: 0.0997 },
        { x: 83, y: 0.0753 },
        { x: 86, y: 0.0324 },
        { x: 88, y: 0.0135 },
      ],
    },
  ],
  xAxisLabel: "Life expectancy at birth (years)",
  highlightIds: ["africa", "europe"],
  overlap: 0.45,
  source: "UN DESA, World Population Prospects 2024",
  durationSec: 12,
};

export const RidgelinePlotComposition = () => (
  <Composition
    id="RidgelinePlot"
    component={RidgelinePlot}
    schema={RidgelinePlotSchema}
    calculateMetadata={standardMetadata<RidgelinePlotData>(12)}
    defaultProps={{ data: sampleData as RidgelinePlotData }}
  />
);

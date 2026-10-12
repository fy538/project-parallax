import { Composition } from "remotion";
import { MorphTransition } from "./MorphTransition";
import { MorphTransitionSchema } from "./schema";
import { layout, sec } from "../../design/theme";
import type { MorphTransitionData } from "./types";

// Default props — top-5 economies by GDP, 1990 → 2024. The bars rearrange
// (China rises from 11th to 2nd; Russia falls; India rises). Demonstrates
// the canonical "watch the rankings shift" use case — same chart type,
// two data states, animated rearrangement.
export const morphTransitionSampleData: MorphTransitionData = {
  episode: "great-power-rankings",
  title: "TOP FIVE ECONOMIES",
  subtitle: "GDP rankings shifted dramatically across a generation.",
  source: "World Bank, IMF (constant 2024 USD, trillions)",
  holdFromSec: 2,
  morphSec: 3.5,
  holdToSec: 3,
  morphEasing: "ease-in-out",
  from: {
    template: "DataChart",
    label: "1990",
    data: {
      episode: "great-power-rankings",
      title: "GDP — top economies, 1990",
      variant: "bar",
      dataPoints: [
        { label: "United States", value: 5.96 },
        { label: "Japan", value: 3.13 },
        { label: "Germany", value: 1.77 },
        { label: "France", value: 1.27 },
        { label: "United Kingdom", value: 1.09 },
      ],
      unit: "$ trillions",
      source: "",
      durationSec: 14,
    },
  },
  to: {
    template: "DataChart",
    label: "2024",
    data: {
      episode: "great-power-rankings",
      title: "GDP — top economies, 2024",
      variant: "bar",
      dataPoints: [
        { label: "United States", value: 28.78 },
        { label: "China", value: 18.53 },
        { label: "Germany", value: 4.59 },
        { label: "Japan", value: 4.11 },
        { label: "India", value: 3.94 },
      ],
      unit: "$ trillions",
      highlightIndex: 1, // China gets the accent
      source: "",
      durationSec: 14,
    },
  },
  durationSec: 14,
};

/**
 * Duration: explicit `durationSec` wins; otherwise derive from the three
 * timing fields so the composition is never shorter than what was authored.
 * Defaults mirror schema: holdFromSec=2, morphSec=3, holdToSec=3 → 8s
 * (the sample data sets all three explicitly → 14s total).
 */
function morphMetadata({ props }: { props: { data: MorphTransitionData } }) {
  const data = props.data;
  const durationSec =
    data.durationSec ??
    (data.holdFromSec ?? 2) + (data.morphSec ?? 3) + (data.holdToSec ?? 3);
  return {
    durationInFrames: Math.max(1, Math.round(sec(durationSec))),
    fps: layout.fps,
    width: layout.width,
    height: layout.height,
  };
}

export const MorphTransitionComposition = () => (
  <Composition
    id="MorphTransition"
    component={MorphTransition}
    schema={MorphTransitionSchema}
    calculateMetadata={morphMetadata}
    defaultProps={{ data: morphTransitionSampleData as MorphTransitionData }}
  />
);

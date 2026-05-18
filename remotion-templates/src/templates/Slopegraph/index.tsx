import { Composition } from "remotion";
import { Slopegraph } from "./Slopegraph";
import { layout, sec } from "../../design/theme";
import { SlopegraphSchema } from "./schema";
import type { SlopegraphData } from "./types";

/**
 * Sample: NATO defense spending as % of GDP, before and after Russia/Ukraine
 * full-scale invasion. The slopegraph form makes the "one outlier moves
 * against the trend" story unmistakable — most NATO members raised
 * spending; a few stayed flat.
 */
export const slopegraphSampleData: SlopegraphData = {
  episode: "_catalog",
  title: "Most NATO members raised defense spending after February 2022.",
  leftLabel: "2021",
  rightLabel: "2024",
  unit: "%",
  source: "NATO Public Diplomacy Division — Defence Expenditure of NATO Countries (2024).",
  entities: [
    { label: "POL", leftValue: 2.2, rightValue: 4.1, hero: true },
    { label: "USA", leftValue: 3.5, rightValue: 3.4 },
    { label: "GBR", leftValue: 2.2, rightValue: 2.3 },
    { label: "FRA", leftValue: 1.9, rightValue: 2.1 },
    { label: "DEU", leftValue: 1.3, rightValue: 2.1 },
    { label: "ESP", leftValue: 1.0, rightValue: 1.3 },
  ],
  durationSec: 8,
  frame: {
    kicker: "DEFENSE SPENDING",
    title: "Most NATO members raised defense spending after February 2022.",
    dek: "Each line is one member state. Slopes tell the policy story — Poland moved hardest.",
    heroStat: {
      value: "+86%",
      placement: "left-rail",
      weight: "h1",
    },
    layout: "hero-split",
    splitRatio: [34, 66],
    chrome: "publication",
    source: "NATO Public Diplomacy Division (2024).",
    modeTag: "defense economics · catalog",
    legend: "suppressed",
  },
};

export const SlopegraphComposition = () => (
  <Composition
    id="Slopegraph"
    component={Slopegraph}
    schema={SlopegraphSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as SlopegraphData).durationSec ?? 8),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: slopegraphSampleData as SlopegraphData }}
  />
);

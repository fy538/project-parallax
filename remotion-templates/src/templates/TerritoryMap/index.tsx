import { Composition } from "remotion";
import { TerritoryMap, calculateMetadata } from "./TerritoryMap";
import { TerritoryMapSchema } from "./schema";
import type { TerritoryMapData } from "./types";

export { TerritoryMap, calculateMetadata };
export { TerritoryMapSchema };
export type { TerritoryMapData };

/** Ottoman retreat — default Studio preview composition. */
const ottomanSampleData: TerritoryMapData = {
  episode: "catalog",
  title: "Ottoman Retreat, 1700–1920",
  source: "Encyclopaedia Britannica / Shepherd's Historical Atlas (1923)",
  center: [30, 38],
  zoom: 3.5,
  pitch: 0,
  bearing: 0,
  mode: "country",
  durationSec: 12,
  register: "dark",
  fogPreset: "atmospheric",
  backgroundVariant: "dark",
  showTimeline: true,
  showActorLabels: true,
  timesteps: [
    { id: "1700", label: "1700" },
    { id: "1800", label: "1800" },
    { id: "1850", label: "1850" },
    { id: "1878", label: "1878" },
    { id: "1920", label: "1920" },
  ],
  crossfadeSec: 0.5,
  actors: {
    ottoman: { fill: "#8B6B3D", label: "Ottoman" },
    british: { fill: "#A64D46", label: "British" },
    russian: { fill: "#4A6B8A", label: "Russian" },
    independent: { fill: "#888780", label: "Independent" },
    french: { fill: "#7A5A8A", label: "French" },
  },
  regions: [
    { id: "TUR", centroid: [35.2, 39.0] },
    { id: "EGY", centroid: [30.5, 26.8] },
    { id: "GRC", centroid: [21.8, 39.1] },
    { id: "BGR", centroid: [25.5, 42.7] },
    { id: "IRQ", centroid: [43.7, 33.2] },
    { id: "SYR", centroid: [38.5, 34.8] },
    { id: "ROU", centroid: [24.9, 45.9] },
    { id: "LBY", centroid: [17.2, 26.3] },
  ],
  control: {
    TUR: { "1700": "ottoman", "1800": "ottoman", "1850": "ottoman", "1878": "ottoman", "1920": "ottoman" },
    EGY: { "1700": "ottoman", "1800": "ottoman", "1850": "british", "1878": "british", "1920": "british" },
    GRC: { "1700": "ottoman", "1800": "independent", "1850": "independent", "1878": "independent", "1920": "independent" },
    BGR: { "1700": "ottoman", "1800": "ottoman", "1850": "ottoman", "1878": "independent", "1920": "independent" },
    IRQ: { "1700": "ottoman", "1800": "ottoman", "1850": "ottoman", "1878": "ottoman", "1920": "british" },
    SYR: { "1700": "ottoman", "1800": "ottoman", "1850": "ottoman", "1878": "ottoman", "1920": "french" },
    ROU: { "1700": "ottoman", "1800": "ottoman", "1850": "ottoman", "1878": "independent", "1920": "independent" },
    LBY: { "1700": "ottoman", "1800": "ottoman", "1850": "ottoman", "1878": "ottoman", "1920": "independent" },
  },
};

export const TerritoryMapComposition = () => (
  <Composition
    id="TerritoryMap"
    component={TerritoryMap}
    schema={TerritoryMapSchema}
    calculateMetadata={calculateMetadata}
    defaultProps={{ data: ottomanSampleData }}
  />
);

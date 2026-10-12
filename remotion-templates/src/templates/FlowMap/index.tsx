import { Composition } from "remotion";
import { FlowMap, calculateMetadata } from "./FlowMap";
import { FlowMapSchema } from "./schema";
import type { FlowMapData, FlowArc, FlowActor } from "./types";

export { FlowMap, calculateMetadata };
export { FlowMapSchema };
export type { FlowMapData, FlowArc, FlowActor };

/** Russia oil rerouting — default Studio preview composition. */
const russiaOilSampleData: FlowMapData = {
  episode: "catalog",
  title: "Russian Oil Rerouting 2022–2024",
  source: "IEA, 2024",
  flows: [
    { id: "ru-in", from: [60, 55], to: [72, 22], volume: 1800, label: "India",  actor: "primary",   revealAtSec: 0   },
    { id: "ru-cn", from: [60, 55], to: [104, 35], volume: 1200, label: "China", actor: "primary",   revealAtSec: 1.5 },
    { id: "ru-tr", from: [60, 55], to: [32, 39],  volume: 600,  label: "Turkey",actor: "secondary", revealAtSec: 3.0 },
    { id: "ru-ae", from: [60, 55], to: [54, 24],  volume: 300,  label: "UAE",   actor: "secondary", revealAtSec: 4.5 },
  ] as FlowArc[],
  actors: {
    primary:   { fill: "#C4A747", label: "Major Relay"     },
    secondary: { fill: "#7AA3C9", label: "Secondary Relay" },
  },
  mode: "stagger",
  showArrowheads: true,
  showParticles: true,
  center: [70, 35],
  zoom: 2.8,
  pitch: 30,
  register: "dark",
  fogPreset: "atmospheric",
  durationSec: 12,
  showLegend: true,
  backgroundVariant: "dark",
};

export const FlowMapComposition = () => (
  <Composition
    id="FlowMap"
    component={FlowMap}
    schema={FlowMapSchema}
    calculateMetadata={calculateMetadata}
    defaultProps={{ data: russiaOilSampleData }}
  />
);

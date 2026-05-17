import { Composition } from "remotion";
import { StrategicLandscape } from "./StrategicLandscape";
import { standardMetadata } from "../../utils/composition";
import { StrategicLandscapeSchema } from "./schema";
import type { StrategicLandscapeData } from "./types";

const sampleData: StrategicLandscapeData = {
  title: "Semiconductor Strategy Landscape",
  subtitle: "Major actors positioned by approach and time horizon",
  xAxisLabel: "Defensive",
  xAxisLabelEnd: "Offensive",
  yAxisLabel: "Short-term",
  yAxisLabelEnd: "Long-term",
  actors: [
    { name: "United States", icon: "US", x: 70, y: 65, color: "#3266AD" },
    { name: "China", icon: "CN", x: 75, y: 80, color: "#C23B22" },
    { name: "TSMC", icon: "TW", x: 40, y: 70 },
    { name: "EU", icon: "EU", x: 35, y: 45, color: "#5DAA68" },
    { name: "Japan", icon: "JP", x: 50, y: 55, color: "#E5A544" },
  ],
  quadrantLabels: ["Strategic patience", "Long-term offensive", "Reactive defense", "Tactical strike"],
  episode: "silicon-trap",
  source: "Parallax analysis",
  durationSec: 10,
};

export const StrategicLandscapeComposition = () => (
  <Composition
    id="StrategicLandscape"
    component={StrategicLandscape}
    schema={StrategicLandscapeSchema}
    calculateMetadata={standardMetadata<StrategicLandscapeData>(10)}
    defaultProps={{ data: sampleData }}
  />
);

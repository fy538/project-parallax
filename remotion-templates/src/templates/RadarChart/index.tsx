import { Composition } from "remotion";
import { RadarChart } from "./RadarChart";
import { layout, sec } from "../../design/theme";
import { RadarChartSchema } from "./schema";
import type { RadarChartData } from "./types";

const sampleData: RadarChartData = {
  episode: "EP02",
  title: "Strategic Capability Comparison",
  subtitle: "Six dimensions of national power, 2025 estimates",
  axes: [
    { label: "Military", short: "MIL" },
    { label: "Economic", short: "ECON" },
    { label: "Technological", short: "TECH" },
    { label: "Diplomatic", short: "DIPL" },
    { label: "Informational", short: "INFO" },
    { label: "Industrial", short: "IND" },
  ],
  subjects: [
    {
      name: "United States",
      values: [95, 85, 92, 80, 88, 60],
      color: "#3266AD",
      fillOpacity: 0.15,
    },
    {
      name: "China",
      values: [70, 78, 75, 55, 65, 90],
      color: "#C23B22",
      fillOpacity: 0.15,
    },
  ],
  source: "Parallax composite index",
  durationSec: 12,
};

export const RadarChartComposition = () => (
  <Composition
    id="RadarChart"
    component={RadarChart}
    schema={RadarChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec(
        (props.data as RadarChartData).durationSec || 12
      ),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData }}
  />
);

import { Composition } from "remotion";
import { DataChart } from "./DataChart";
import { layout, sec } from "../../design/theme";
import { DataChartSchema } from "./schema";
import type { DataChartData } from "./types";
import sampleData from "../../../data/episodes/silicon-trap/chart-lithography.json";

export const DataChartComposition = () => (
  <Composition
    id="DataChart"
    component={DataChart}
    schema={DataChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DataChartData).durationSec || 8),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as DataChartData }}
  />
);

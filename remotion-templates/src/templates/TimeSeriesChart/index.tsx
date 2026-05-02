import { Composition } from "remotion";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { layout, sec } from "../../design/theme";
import { TimeSeriesChartSchema } from "./schema";
import type { TimeSeriesChartData } from "./types";

// EP01 data — SMIC 7nm yield improvement curve
import sampleData from "../../../data/episodes/ep01/timeseries-smic-yield.json";

export const TimeSeriesChartComposition = () => (
  <Composition
    id="TimeSeriesChart"
    component={TimeSeriesChart}
    schema={TimeSeriesChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as TimeSeriesChartData).durationSec || 8),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as TimeSeriesChartData }}
  />
);

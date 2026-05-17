import { Composition } from "remotion";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { standardMetadata } from "../../utils/composition";
import { TimeSeriesChartSchema } from "./schema";
import type { TimeSeriesChartData } from "./types";

// silicon-trap data — SMIC 7nm yield improvement curve
import sampleData from "../../../data/episodes/silicon-trap/timeseries-smic-yield.json";

export const TimeSeriesChartComposition = () => (
  <Composition
    id="TimeSeriesChart"
    component={TimeSeriesChart}
    schema={TimeSeriesChartSchema}
    calculateMetadata={standardMetadata<TimeSeriesChartData>(8)}
    defaultProps={{ data: sampleData as TimeSeriesChartData }}
  />
);

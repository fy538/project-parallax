import { Composition } from "remotion";
import { DataChart } from "./DataChart";
import { standardMetadata } from "../../utils/composition";
import { DataChartSchema } from "./schema";
import type { DataChartData } from "./types";
import sampleData from "../../../data/episodes/silicon-trap/chart-lithography.json";

export const DataChartComposition = () => (
  <Composition
    id="DataChart"
    component={DataChart}
    schema={DataChartSchema}
    calculateMetadata={standardMetadata<DataChartData>(8)}
    defaultProps={{ data: sampleData as unknown as DataChartData }}
  />
);

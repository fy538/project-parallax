import { Composition } from "remotion";
import { BumpChart } from "./BumpChart";
import { standardMetadata } from "../../utils/composition";
import { BumpChartSchema } from "./schema";
import type { BumpChartData } from "./types";
import sampleData from "../../../data/episodes/catalog/bump-chart-gdp.json";

export const BumpChartComposition = () => (
  <Composition
    id="BumpChart"
    component={BumpChart}
    schema={BumpChartSchema}
    calculateMetadata={standardMetadata<BumpChartData>(14)}
    defaultProps={{ data: sampleData as BumpChartData }}
  />
);

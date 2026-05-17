import { Composition } from "remotion";
import { IsotypeChart } from "./IsotypeChart";
import { standardMetadata } from "../../utils/composition";
import { IsotypeChartSchema } from "./schema";
import type { IsotypeChartData } from "./types";
import sampleData from "../../../data/episodes/catalog/isotype-chips.json";

export const IsotypeChartComposition = () => (
  <Composition
    id="IsotypeChart"
    component={IsotypeChart}
    schema={IsotypeChartSchema}
    calculateMetadata={standardMetadata<IsotypeChartData>(10)}
    defaultProps={{ data: sampleData as IsotypeChartData }}
  />
);

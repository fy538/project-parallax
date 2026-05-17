import { Composition } from "remotion";
import { RankChangeDotPlot } from "./RankChangeDotPlot";
import { standardMetadata } from "../../utils/composition";
import { RankChangeDotPlotSchema } from "./schema";
import type { RankChangeDotPlotData } from "./types";
import sampleData from "../../../data/episodes/catalog/rank-change-semiconductors.json";

export const RankChangeDotPlotComposition = () => (
  <Composition
    id="RankChangeDotPlot"
    component={RankChangeDotPlot}
    schema={RankChangeDotPlotSchema}
    calculateMetadata={standardMetadata<RankChangeDotPlotData>(11)}
    defaultProps={{ data: sampleData as RankChangeDotPlotData }}
  />
);

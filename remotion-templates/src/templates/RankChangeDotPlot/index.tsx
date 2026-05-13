import { Composition } from "remotion";
import { RankChangeDotPlot } from "./RankChangeDotPlot";
import { layout, sec } from "../../design/theme";
import { RankChangeDotPlotSchema } from "./schema";
import type { RankChangeDotPlotData } from "./types";
import sampleData from "../../../data/episodes/catalog/rank-change-semiconductors.json";

export const RankChangeDotPlotComposition = () => (
  <Composition
    id="RankChangeDotPlot"
    component={RankChangeDotPlot}
    schema={RankChangeDotPlotSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec(
        (props.data as RankChangeDotPlotData).durationSec ?? 11
      ),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as RankChangeDotPlotData }}
  />
);

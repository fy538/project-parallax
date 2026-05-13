import { Composition } from "remotion";
import { BumpChart } from "./BumpChart";
import { layout, sec } from "../../design/theme";
import { BumpChartSchema } from "./schema";
import type { BumpChartData } from "./types";
import sampleData from "../../../data/episodes/catalog/bump-chart-gdp.json";

export const BumpChartComposition = () => (
  <Composition
    id="BumpChart"
    component={BumpChart}
    schema={BumpChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as BumpChartData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as BumpChartData }}
  />
);

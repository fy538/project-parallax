import { Composition } from "remotion";
import { IsotypeChart } from "./IsotypeChart";
import { layout, sec } from "../../design/theme";
import { IsotypeChartSchema } from "./schema";
import type { IsotypeChartData } from "./types";
import sampleData from "../../../data/episodes/catalog/isotype-chips.json";

export const IsotypeChartComposition = () => (
  <Composition
    id="IsotypeChart"
    component={IsotypeChart}
    schema={IsotypeChartSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as IsotypeChartData).durationSec ?? 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as IsotypeChartData }}
  />
);

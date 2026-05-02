import { Composition } from "remotion";
import { ChoroplethMap } from "./ChoroplethMap";
import { layout, sec } from "../../design/theme";
import { ChoroplethMapSchema } from "./schema";
import type { ChoroplethMapData } from "./types";
import sampleData from "../../../data/episodes/ep01/choropleth-cocom.json";

function totalDuration(data: ChoroplethMapData): number {
  return data.phases.reduce((sum, p) => sum + sec(p.durationSec), 0);
}

export const ChoroplethMapComposition = () => (
  <Composition
    id="ChoroplethMap"
    component={ChoroplethMap}
    schema={ChoroplethMapSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: totalDuration(props.data as ChoroplethMapData),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as ChoroplethMapData }}
  />
);

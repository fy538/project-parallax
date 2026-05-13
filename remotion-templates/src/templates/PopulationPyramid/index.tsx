import { Composition } from "remotion";
import { PopulationPyramid } from "./PopulationPyramid";
import { layout, sec } from "../../design/theme";
import { PopulationPyramidSchema } from "./schema";
import type { PopulationPyramidData } from "./types";
import sampleData from "../../../data/episodes/catalog/population-pyramid-china.json";

const DEFAULT_DURATIONS: Record<PopulationPyramidData["variant"], number> = {
  single: 10,
  morph: 14,
  comparison: 12,
};

export const PopulationPyramidComposition = () => (
  <Composition
    id="PopulationPyramid"
    component={PopulationPyramid}
    schema={PopulationPyramidSchema}
    calculateMetadata={({ props }) => {
      const d = props.data as PopulationPyramidData;
      const defaultDuration = DEFAULT_DURATIONS[d.variant] ?? 12;
      return {
        durationInFrames: sec(d.durationSec ?? defaultDuration),
        fps: layout.fps,
        width: layout.width,
        height: layout.height,
      };
    }}
    defaultProps={{ data: sampleData as PopulationPyramidData }}
  />
);

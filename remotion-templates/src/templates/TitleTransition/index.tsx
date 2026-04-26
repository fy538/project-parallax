import { Composition } from "remotion";
import { TitleTransition } from "./TitleTransition";
import { layout, sec } from "../../design/theme";
import { TitleTransitionSchema } from "./schema";
import type { TitleTransitionData } from "./types";
import sampleData from "../../../data/episodes/ep01/title-episode.json";

export const TitleTransitionComposition = () => (
  <Composition
    id="TitleTransition"
    component={TitleTransition}
    schema={TitleTransitionSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as TitleTransitionData).durationSec || 4),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData as TitleTransitionData }}
  />
);

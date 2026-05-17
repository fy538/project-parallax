import { Composition } from "remotion";
import { TitleTransition } from "./TitleTransition";
import { standardMetadata } from "../../utils/composition";
import { TitleTransitionSchema } from "./schema";
import type { TitleTransitionData } from "./types";
import sampleData from "../../../data/episodes/silicon-trap/title-episode.json";

export const TitleTransitionComposition = () => (
  <Composition
    id="TitleTransition"
    component={TitleTransition}
    schema={TitleTransitionSchema}
    calculateMetadata={standardMetadata<TitleTransitionData>(4)}
    defaultProps={{ data: sampleData as TitleTransitionData }}
  />
);

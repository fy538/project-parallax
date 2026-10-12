import { Composition } from "remotion";
import { GenerativeBackdrop } from "./GenerativeBackdrop";
import { standardMetadata } from "../../utils/composition";
import { GenerativeBackdropSchema } from "./schema";
import type { GenerativeBackdropData } from "./types";

/**
 * Sample data — "the idea permeates" hold beat. The generative field is the
 * argument: a structure diffusing across a population / trade network.
 */
export const generativeBackdropSampleData: GenerativeBackdropData = {
  episode: "prisoners-dilemma",
  durationSec: 6,
  density: "medium",
  driftSpeed: 0.25,
  kicker: "diffusion · the structure spreads",
  title: "CONTAGION",
};

export const GenerativeBackdropComposition = () => (
  <Composition
    id="GenerativeBackdrop"
    component={GenerativeBackdrop}
    schema={GenerativeBackdropSchema}
    calculateMetadata={standardMetadata<GenerativeBackdropData>(6)}
    defaultProps={{ data: generativeBackdropSampleData }}
  />
);

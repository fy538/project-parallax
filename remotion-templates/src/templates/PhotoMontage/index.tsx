import { Composition } from "remotion";
import { PhotoMontage } from "./PhotoMontage";
import { standardMetadata } from "../../utils/composition";
import { PhotoMontageSchema } from "./schema";
import type { PhotoMontageData } from "./types";

/**
 * Sample data: chip count montage from silicon-trap.
 * Four images showing chip counts in different devices, rapid-fire sequence.
 */
const sampleData: PhotoMontageData = {
  episode: "silicon-trap",
  images: [
    {
      src: "assets/sample-historical.png",
      durationSec: 3,
      treatment: "standard",
      compositeMode: "inset",
      compositeOpacity: 0.65,
      overlay: {
        text: "1,000–3,000 chips",
        position: "bottom-left",
        style: "stat",
      },
    },
    {
      src: "assets/sample-historical.png",
      durationSec: 2,
      treatment: "standard",
      compositeMode: "inset",
      compositeOpacity: 0.65,
      overlay: {
        text: "~160 chips",
        position: "bottom-left",
        style: "stat",
      },
    },
    {
      src: "assets/sample-historical.png",
      durationSec: 2,
      treatment: "standard",
      compositeMode: "inset",
      compositeOpacity: 0.65,
      overlay: {
        text: "~1,200 chips",
        position: "bottom-left",
        style: "stat",
      },
    },
    {
      src: "assets/sample-historical.png",
      durationSec: 2,
      treatment: "standard",
      compositeMode: "inset",
      compositeOpacity: 0.65,
      overlay: {
        text: "~10,000 chips per rack",
        position: "bottom-left",
        style: "stat",
      },
    },
  ],
  transition: "dissolve",
  transitionDurationSec: 0.3,
  source: "SIA, IHS Markit semiconductor data",
  durationSec: 10,
};

export const PhotoMontageComposition = () => (
  <Composition
    id="PhotoMontage"
    component={PhotoMontage}
    schema={PhotoMontageSchema}
    calculateMetadata={standardMetadata<PhotoMontageData>(10)}
    defaultProps={{ data: sampleData as PhotoMontageData }}
  />
);

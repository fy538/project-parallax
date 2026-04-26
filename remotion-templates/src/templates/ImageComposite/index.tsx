/**
 * ImageComposite composition registration.
 *
 * This file defines how the template appears in Remotion Studio
 * and provides the default/sample data for previewing.
 */

import { Composition } from "remotion";
import { ImageComposite } from "./ImageComposite";
import { layout, sec } from "../../design/theme";
import { ImageCompositeSchema } from "./schema";
import type { ImageCompositeData } from "./types";

const sampleData: ImageCompositeData = {
  episode: "EP00",
  title: "The Arsenal of Democracy",
  subtitle: "Detroit, 1943",
  imagePath: "assets/sample-historical.jpg",
  variant: "background",
  duotone: "standard",
  textPosition: "bottom-left",
  source: "National Archives",
  durationSec: 6,
  backgroundVariant: "dark",
};

export const ImageCompositeComposition = () => (
  <Composition
    id="ImageComposite"
    component={ImageComposite}
    schema={ImageCompositeSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as ImageCompositeData).durationSec || 6),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData }}
  />
);

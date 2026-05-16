import { Composition } from "remotion";
import { AnnotatedImage } from "./AnnotatedImage";
import { layout, sec } from "../../design/theme";
import { AnnotatedImageSchema } from "./schema";
import type { AnnotatedImageData } from "./types";

const sampleData: AnnotatedImageData = {
  episode: "silicon-trap",
  title: "Inside the ASML EUV Machine",
  subtitle: "The most complex device ever manufactured",
  imageSrc: "https://placehold.co/1920x1080/1C1814/E5A544?text=EUV+Lithography",
  imageAlt: "ASML EUV lithography machine cross-section",
  duotoneRamp: "standard",
  callouts: [
    {
      x: 30,
      y: 35,
      label: "Tin Droplet Generator",
      detail: "50,000 droplets/second",
      placement: "left",
      leaderLength: 80,
    },
    {
      x: 50,
      y: 50,
      label: "CO₂ Laser",
      detail: "20kW — vaporizes tin to plasma",
      placement: "right",
    },
    {
      x: 70,
      y: 40,
      label: "Mirror Assembly",
      detail: "Polished to 0.05nm — flattest surfaces on Earth",
      placement: "right",
    },
    {
      x: 55,
      y: 75,
      label: "Wafer Stage",
      detail: "Positions to 0.1nm accuracy",
      placement: "bottom",
    },
  ],
  source: "ASML technical documentation",
  durationSec: 12,
};

export const AnnotatedImageComposition = () => (
  <Composition
    id="AnnotatedImage"
    component={AnnotatedImage}
    schema={AnnotatedImageSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec(
        (props.data as AnnotatedImageData).durationSec || 12
      ),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData }}
  />
);

import { Composition } from "remotion";
import { AnnotatedZoom } from "./AnnotatedZoom";
import { standardMetadata } from "../../utils/composition";
import { AnnotatedZoomSchema } from "./schema";
import type { AnnotatedZoomData } from "./types";

// ── Sample data — Strait of Taiwan chokepoint zoom ───────────────────────────

export const annotatedZoomSampleData: AnnotatedZoomData = {
  episode: "silicon-trap",
  title: "THE STRAIT AS CHOKEPOINT",
  subtitle: "Geography of the 90-mile crossing",
  source: "CSIS China Power Project; US Navy 7th Fleet transit records",
  durationSec: 16,
  backgroundVariant: "dark",
  base: {
    src: "assets/sample-historical.png",
    alt: "Taiwan Strait satellite view",
    duotoneRamp: "editorial",
  },
  regions: [
    {
      revealAtSec: 1.5,
      centerX: 50,
      centerY: 50,
      scale: 1.0,
      label: "Full strait view — 180km north to south",
    },
    {
      revealAtSec: 5.0,
      centerX: 25,
      centerY: 35,
      scale: 2.0,
      transitionSec: 0.8,
      label: "TSMC Hsinchu campus — 4km from coast",
    },
    {
      revealAtSec: 9.0,
      centerX: 60,
      centerY: 60,
      scale: 2.2,
      transitionSec: 0.9,
      label: "Narrowest crossing — 130km at the Penghu Channel",
      showCrosshair: true,
    },
    {
      revealAtSec: 13.0,
      centerX: 50,
      centerY: 50,
      scale: 1.0,
      transitionSec: 1.2,
      label: "The full choke — both shores within MLRS range",
    },
  ],
  holdAtLastRegion: true,
};

export const AnnotatedZoomComposition = () => (
  <Composition
    id="AnnotatedZoom"
    component={AnnotatedZoom}
    schema={AnnotatedZoomSchema}
    calculateMetadata={standardMetadata<AnnotatedZoomData>(16)}
    defaultProps={{ data: annotatedZoomSampleData as AnnotatedZoomData }}
  />
);

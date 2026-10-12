import { Composition } from "remotion";
import { ArchivalReel } from "./ArchivalReel";
import { standardMetadata } from "../../utils/composition";
import { ArchivalReelSchema } from "./schema";
import type { ArchivalReelData } from "./types";

// Default props — 16mm preset on a placeholder image. Editors hot-swap
// imageUrl with real archive footage per episode. The default uses a
// public-domain Library of Congress placeholder when sourcing isn't done yet.
export const archivalReelSampleData: ArchivalReelData = {
  episode: "vietnam-credibility-gap",
  stock: "16mm",
  // Default uses the local sample image — editors hot-swap with real
  // archive footage URLs per episode. External URLs (Wikipedia,
  // Internet Archive) work in production renders but Studio + headless
  // Chromium previews are more reliable with local assets.
  imageUrl: "/assets/sample-historical.png",
  intensity: 0.55,
  nativeFootage: true, // it's real archive — Apollo 11 doctrine applies
  gateWeave: true,
  caption: {
    text: "Search-and-clear operation",
    dateline: "1968",
    source: "US National Archives",
  },
  title: "VIETNAM, 1968",
  subtitle: "The credibility gap widens.",
  source: "US National Archives (public domain)",
  durationSec: 8,
};

export const ArchivalReelComposition = () => (
  <Composition
    id="ArchivalReel"
    component={ArchivalReel}
    schema={ArchivalReelSchema}
    calculateMetadata={standardMetadata<ArchivalReelData>(8)}
    defaultProps={{ data: archivalReelSampleData as ArchivalReelData }}
  />
);

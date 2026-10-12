/**
 * AiCareMotivesFull — manifest-driven full episode composition.
 *
 * Wires assembly-manifest.json + all episode JSON data files into FullEpisode.
 * Duration is derived from the manifest's totalDurationSec via
 * calculateFullEpisodeMetadata — no hardcoded frame counts.
 *
 * Register in Root.tsx under the Episodes folder:
 *   <AiCareMotivesFullComposition />
 *
 * Render:
 *   npx remotion render ai-care-motives-full out/ai-care-motives-full.mp4
 */

import React from "react";
import { Composition } from "remotion";
import { FullEpisode, calculateFullEpisodeMetadata } from "./FullEpisode";
import type { AssemblyManifest } from "./FullEpisode";
import manifest from "../../../data/episodes/ai-care-motives/assembly-manifest.json";
import { TEMPLATE_DATA } from "./ai-care-motives-data";
import { ChromeLevelProvider } from "../../hooks/useChromeLevel";

// Chrome: wordmark only. The briefing strips (slug, REC timer, FILED date)
// were designed for the geopolitics episodes and are off-register here.
export const AiCareMotivesFull: React.FC = () => (
  <ChromeLevelProvider level="wordmark">
    <FullEpisode
      manifest={manifest as AssemblyManifest}
      templateData={TEMPLATE_DATA}
      assetBasePath="episodes/ai-care-motives"
    />
  </ChromeLevelProvider>
);

export const AiCareMotivesFullComposition = () => (
  <Composition
    id="ai-care-motives-full"
    component={AiCareMotivesFull}
    calculateMetadata={() =>
      calculateFullEpisodeMetadata({
        props: {
          manifest: manifest as AssemblyManifest,
          templateData: TEMPLATE_DATA,
          assetBasePath: "episodes/ai-care-motives",
        },
      })
    }
  />
);

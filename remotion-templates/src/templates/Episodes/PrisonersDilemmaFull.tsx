/**
 * PrisonersDilemmaFull — manifest-driven full episode composition.
 *
 * Wires assembly-manifest.json + all 41 JSON data files into FullEpisode.
 * Duration is derived from the manifest's totalDurationSec via
 * calculateFullEpisodeMetadata — no hardcoded frame counts.
 *
 * Register in Root.tsx under the Episodes folder:
 *   <PrisonersDilemmaFullComposition />
 *
 * Render:
 *   npx remotion render prisoners-dilemma-full out/prisoners-dilemma-full.mp4
 */

import React from "react";
import { Composition } from "remotion";
import { FullEpisode, calculateFullEpisodeMetadata } from "./FullEpisode";
import manifest from "../../../data/episodes/prisoners-dilemma/assembly-manifest.json";
import { TEMPLATE_DATA } from "./prisoners-dilemma-data";

export const PrisonersDilemmaFull: React.FC = () => (
  <FullEpisode
    manifest={manifest as any}
    templateData={TEMPLATE_DATA}
    assetBasePath="assets/prisoners-dilemma"
  />
);

export const PrisonersDilemmaFullComposition = () => (
  <Composition
    id="prisoners-dilemma-full"
    component={PrisonersDilemmaFull}
    calculateMetadata={() =>
      calculateFullEpisodeMetadata({
        props: {
          manifest: manifest as any,
          templateData: TEMPLATE_DATA,
          assetBasePath: "assets/prisoners-dilemma",
        },
      })
    }
  />
);

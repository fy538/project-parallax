/**
 * SiliconTrapFull — Full-episode composition for "The Silicon Trap."
 *
 * Wires the assembly manifest + all 29 JSON data files into FullEpisode.
 * This is the episode-specific glue: it imports all static data at build time
 * (because Remotion can't do dynamic imports during render) and passes them
 * as the templateData prop.
 *
 * Register alongside the existing SiliconTrap (motion-graphics-only) composition:
 *   silicon-trap      → 29-clip Series (motion graphics only, ~3 min)
 *   silicon-trap-full → Complete video (narration + footage + templates, ~18 min)
 *
 * Regenerated from script-v5-production.md.
 */

import React from "react";
import { Composition } from "remotion";
import {
  FullEpisode,
  calculateFullEpisodeMetadata,
} from "./FullEpisode";

// ── Import assembly manifest ────────────────────────────────────────────────

import manifest from "../../../data/episodes/silicon-trap/assembly-manifest.json";

// All 29 imports + the filename-keyed map come from the shared barrel.
// SiliconTrap.tsx (the motion-graphics-only Series) uses the named exports;
// this file uses the TEMPLATE_DATA map. Adding a clip = one edit there.
import { TEMPLATE_DATA } from "./silicon-trap-data";

// ── Silicon Trap Full Episode component ──────────────────────────────────────

export const SiliconTrapFull: React.FC = () => (
  <FullEpisode
    manifest={manifest as any} // no-as-any-ok: AssemblyManifest not yet exported from FullEpisode public surface
    templateData={TEMPLATE_DATA}
    assetBasePath="assets/silicon-trap"
  />
);

// ── Composition registration ────────────────────────────────────────────────

export const SiliconTrapFullComposition = () => (
  <Composition
    id="silicon-trap-full"
    component={SiliconTrapFull}
    calculateMetadata={() =>
      calculateFullEpisodeMetadata({
        props: {
          manifest: manifest as any, // no-as-any-ok: AssemblyManifest not yet exported from FullEpisode public surface
          templateData: TEMPLATE_DATA,
          assetBasePath: "assets/silicon-trap",
        },
      })
    }
  />
);

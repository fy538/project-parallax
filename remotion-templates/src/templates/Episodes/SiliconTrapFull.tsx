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

// ── Import all template data files ──────────────────────────────────────────
// These are the same 29 files used by SiliconTrap.tsx, now indexed by filename
// so FullEpisode can look them up from manifest segment references.

import titleEpisode from "../../../data/episodes/silicon-trap/title-episode.json";
import kinetic92Yield from "../../../data/episodes/silicon-trap/kinetic-92-yield.json";
import kinetic165b from "../../../data/episodes/silicon-trap/kinetic-165b.json";
import chart7pctDemand from "../../../data/episodes/silicon-trap/chart-7pct-demand.json";
import titleSectionDenial from "../../../data/episodes/silicon-trap/title-section-denial.json";
import dualTimelineOilChips from "../../../data/episodes/silicon-trap/dual-timeline-oil-chips.json";
import kineticRevenueDeal from "../../../data/episodes/silicon-trap/kinetic-revenue-deal.json";
import chartChipsAct from "../../../data/episodes/silicon-trap/chart-chips-act.json";
import choroplethCocom from "../../../data/episodes/silicon-trap/choropleth-cocom.json";
import frameworkCocomChina from "../../../data/episodes/silicon-trap/framework-cocom-china.json";
import titleSectionWall from "../../../data/episodes/silicon-trap/title-section-wall.json";
import kineticKabozi from "../../../data/episodes/silicon-trap/kinetic-kabozi.json";
import kineticJuguo from "../../../data/episodes/silicon-trap/kinetic-juguo.json";
import chartLithography from "../../../data/episodes/silicon-trap/chart-lithography.json";
import timeseriesSmicYield from "../../../data/episodes/silicon-trap/timeseries-smic-yield.json";
import frameworkKirinTeardown from "../../../data/episodes/silicon-trap/framework-kirin-teardown.json";
import kineticDeepseekZero from "../../../data/episodes/silicon-trap/kinetic-deepseek-zero.json";
import titleSectionTrap from "../../../data/episodes/silicon-trap/title-section-trap.json";
import gameboardChess from "../../../data/episodes/silicon-trap/gameboard-chess.json";
import gameboardGo from "../../../data/episodes/silicon-trap/gameboard-go.json";
import routeChipSupply from "../../../data/episodes/silicon-trap/route-chip-supply.json";
import kineticTrap from "../../../data/episodes/silicon-trap/kinetic-trap.json";
import choroplethCaughtBetween from "../../../data/episodes/silicon-trap/choropleth-caught-between.json";
import kineticMorrisChang from "../../../data/episodes/silicon-trap/kinetic-morris-chang.json";
import titleSectionChips from "../../../data/episodes/silicon-trap/title-section-chips.json";
import decisiontreeAiTimeline from "../../../data/episodes/silicon-trap/decisiontree-ai-timeline.json";
import routeBifurcation from "../../../data/episodes/silicon-trap/route-bifurcation.json";
import titleEndcard from "../../../data/episodes/silicon-trap/title-endcard.json";

// ── Template data map (filename → data) ─────────────────────────────────────

const TEMPLATE_DATA: Record<string, any> = {
  "title-episode.json": titleEpisode,
  "kinetic-92-yield.json": kinetic92Yield,
  "kinetic-165b.json": kinetic165b,
  "chart-7pct-demand.json": chart7pctDemand,
  "title-section-denial.json": titleSectionDenial,
  "dual-timeline-oil-chips.json": dualTimelineOilChips,
  "kinetic-revenue-deal.json": kineticRevenueDeal,
  "chart-chips-act.json": chartChipsAct,
  "choropleth-cocom.json": choroplethCocom,
  "framework-cocom-china.json": frameworkCocomChina,
  "title-section-wall.json": titleSectionWall,
  "kinetic-kabozi.json": kineticKabozi,
  "kinetic-juguo.json": kineticJuguo,
  "chart-lithography.json": chartLithography,
  "timeseries-smic-yield.json": timeseriesSmicYield,
  "framework-kirin-teardown.json": frameworkKirinTeardown,
  "kinetic-deepseek-zero.json": kineticDeepseekZero,
  "title-section-trap.json": titleSectionTrap,
  "gameboard-chess.json": gameboardChess,
  "gameboard-go.json": gameboardGo,
  "route-chip-supply.json": routeChipSupply,
  "kinetic-trap.json": kineticTrap,
  "choropleth-caught-between.json": choroplethCaughtBetween,
  "kinetic-morris-chang.json": kineticMorrisChang,
  "title-section-chips.json": titleSectionChips,
  "decisiontree-ai-timeline.json": decisiontreeAiTimeline,
  "route-bifurcation.json": routeBifurcation,
  "title-endcard.json": titleEndcard,
};

// ── Silicon Trap Full Episode component ──────────────────────────────────────

export const SiliconTrapFull: React.FC = () => (
  <FullEpisode
    manifest={manifest as any}
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
          manifest: manifest as any,
          templateData: TEMPLATE_DATA,
          assetBasePath: "assets/silicon-trap",
        },
      })
    }
  />
);

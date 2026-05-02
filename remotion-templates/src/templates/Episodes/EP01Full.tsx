/**
 * EP01Full — Full-episode composition for "The Silicon Trap."
 *
 * Wires the assembly manifest + all 29 JSON data files into FullEpisode.
 * This is the episode-specific glue: it imports all static data at build time
 * (because Remotion can't do dynamic imports during render) and passes them
 * as the templateData prop.
 *
 * Register alongside the existing EP01 (motion-graphics-only) composition:
 *   EP01      → 29-clip Series (motion graphics only, ~3 min)
 *   EP01-Full → Complete video (narration + footage + templates, ~18 min)
 *
 * Regenerated from script-v5-production.md.
 */

import React from "react";
import { Composition } from "remotion";
import { layout } from "../../design/theme";
import {
  FullEpisode,
  calculateFullEpisodeMetadata,
} from "./FullEpisode";

// ── Import assembly manifest ────────────────────────────────────────────────

import manifest from "../../../data/episodes/ep01/assembly-manifest.json";

// ── Import all template data files ──────────────────────────────────────────
// These are the same 29 files used by EP01.tsx, now indexed by filename
// so FullEpisode can look them up from manifest segment references.

import titleEpisode from "../../../data/episodes/ep01/title-episode.json";
import titleSectionParadox from "../../../data/episodes/ep01/title-section-paradox.json";
import kinetic92Yield from "../../../data/episodes/ep01/kinetic-92-yield.json";
import kinetic165b from "../../../data/episodes/ep01/kinetic-165b.json";
import chart7pctDemand from "../../../data/episodes/ep01/chart-7pct-demand.json";
import titleSectionDenial from "../../../data/episodes/ep01/title-section-denial.json";
import timelineOilChips from "../../../data/episodes/ep01/timeline-oil-chips.json";
import kineticRevenueDeal from "../../../data/episodes/ep01/kinetic-revenue-deal.json";
import chartChipsAct from "../../../data/episodes/ep01/chart-chips-act.json";
import choroplethCocom from "../../../data/episodes/ep01/choropleth-cocom.json";
import frameworkCocomChina from "../../../data/episodes/ep01/framework-cocom-china.json";
import titleSectionWall from "../../../data/episodes/ep01/title-section-wall.json";
import kineticKabozi from "../../../data/episodes/ep01/kinetic-kabozi.json";
import kineticJuguo from "../../../data/episodes/ep01/kinetic-juguo.json";
import chartLithography from "../../../data/episodes/ep01/chart-lithography.json";
import timeseriesSmicYield from "../../../data/episodes/ep01/timeseries-smic-yield.json";
import frameworkKirinTeardown from "../../../data/episodes/ep01/framework-kirin-teardown.json";
import kineticDeepseekZero from "../../../data/episodes/ep01/kinetic-deepseek-zero.json";
import titleSectionTrap from "../../../data/episodes/ep01/title-section-trap.json";
import gameboardChess from "../../../data/episodes/ep01/gameboard-chess.json";
import gameboardGo from "../../../data/episodes/ep01/gameboard-go.json";
import routeChipSupply from "../../../data/episodes/ep01/route-chip-supply.json";
import kineticTrap from "../../../data/episodes/ep01/kinetic-trap.json";
import choroplethCaughtBetween from "../../../data/episodes/ep01/choropleth-caught-between.json";
import kineticMorrisChang from "../../../data/episodes/ep01/kinetic-morris-chang.json";
import titleSectionChips from "../../../data/episodes/ep01/title-section-chips.json";
import decisiontreeAiTimeline from "../../../data/episodes/ep01/decisiontree-ai-timeline.json";
import routeBifurcation from "../../../data/episodes/ep01/route-bifurcation.json";
import titleEndcard from "../../../data/episodes/ep01/title-endcard.json";

// ── Template data map (filename → data) ─────────────────────────────────────

const TEMPLATE_DATA: Record<string, any> = {
  "title-episode.json": titleEpisode,
  "title-section-paradox.json": titleSectionParadox,
  "kinetic-92-yield.json": kinetic92Yield,
  "kinetic-165b.json": kinetic165b,
  "chart-7pct-demand.json": chart7pctDemand,
  "title-section-denial.json": titleSectionDenial,
  "timeline-oil-chips.json": timelineOilChips,
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

// ── EP01 Full Episode component ─────────────────────────────────────────────

export const EP01Full: React.FC = () => (
  <FullEpisode
    manifest={manifest as any}
    templateData={TEMPLATE_DATA}
    assetBasePath="assets/ep01"
  />
);

// ── Composition registration ────────────────────────────────────────────────

export const EP01FullComposition = () => (
  <Composition
    id="EP01-Full"
    component={EP01Full}
    calculateMetadata={() =>
      calculateFullEpisodeMetadata({
        props: {
          manifest: manifest as any,
          templateData: TEMPLATE_DATA,
          assetBasePath: "assets/ep01",
        },
      })
    }
  />
);

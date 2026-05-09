/**
 * silicon-trap-data — single import surface for the silicon-trap data files.
 *
 * Both SiliconTrap.tsx (29-clip Series, motion-graphics-only) and
 * SiliconTrapFull.tsx (manifest-driven full episode) need the same 29 JSON
 * data files. Before this barrel, both files independently `import` each
 * one — adding a clip required editing two files in lockstep, and any drift
 * silently broke either render path.
 *
 * Exports:
 *   - Named: `titleEpisode`, `kinetic92Yield`, ... — for typed positional use
 *     (defineEpisode in SiliconTrap.tsx)
 *   - `TEMPLATE_DATA`: filename → data map for the manifest-driven path
 *     (FullEpisode in SiliconTrapFull.tsx)
 *
 * To add a clip: add the import below + entries in both export forms in one
 * place. SiliconTrap and SiliconTrapFull pick up the change without edits.
 */

// Opening + Beat 1
import titleEpisode from "../../../data/episodes/silicon-trap/title-episode.json";
import kinetic92Yield from "../../../data/episodes/silicon-trap/kinetic-92-yield.json";
import kinetic165b from "../../../data/episodes/silicon-trap/kinetic-165b.json";
import chart7pctDemand from "../../../data/episodes/silicon-trap/chart-7pct-demand.json";

// Beat 2 — The Logic of Denial
import titleSectionDenial from "../../../data/episodes/silicon-trap/title-section-denial.json";
import horizontalTimelineOilChip from "../../../data/episodes/silicon-trap/horizontal-timeline-oil-chip.json";
import kineticRevenueDeal from "../../../data/episodes/silicon-trap/kinetic-revenue-deal.json";
import chartChipsAct from "../../../data/episodes/silicon-trap/chart-chips-act.json";
import choroplethCocom from "../../../data/episodes/silicon-trap/choropleth-cocom.json";
import frameworkCocomChina from "../../../data/episodes/silicon-trap/framework-cocom-china.json";

// Beat 3 — The Other Side of the Wall
import titleSectionWall from "../../../data/episodes/silicon-trap/title-section-wall.json";
import kineticKabozi from "../../../data/episodes/silicon-trap/kinetic-kabozi.json";
import kineticJuguo from "../../../data/episodes/silicon-trap/kinetic-juguo.json";
import chartLithography from "../../../data/episodes/silicon-trap/chart-lithography.json";
import timeseriesSmicYield from "../../../data/episodes/silicon-trap/timeseries-smic-yield.json";
import frameworkKirinTeardown from "../../../data/episodes/silicon-trap/framework-kirin-teardown.json";
import kineticDeepseekZero from "../../../data/episodes/silicon-trap/kinetic-deepseek-zero.json";

// Beat 4 — The Trap
import titleSectionTrap from "../../../data/episodes/silicon-trap/title-section-trap.json";
import gameboardChess from "../../../data/episodes/silicon-trap/gameboard-chess.json";
import gameboardGo from "../../../data/episodes/silicon-trap/gameboard-go.json";
import routeChipSupply from "../../../data/episodes/silicon-trap/route-chip-supply.json";
import kineticTrap from "../../../data/episodes/silicon-trap/kinetic-trap.json";
import choroplethCaughtBetween from "../../../data/episodes/silicon-trap/choropleth-caught-between.json";
import kineticMorrisChang from "../../../data/episodes/silicon-trap/kinetic-morris-chang.json";

// Beat 5 — Your Chips
import titleSectionChips from "../../../data/episodes/silicon-trap/title-section-chips.json";
import decisiontreeAiTimeline from "../../../data/episodes/silicon-trap/decisiontree-ai-timeline.json";
import routeBifurcation from "../../../data/episodes/silicon-trap/route-bifurcation.json";

// Closing
import titleEndcard from "../../../data/episodes/silicon-trap/title-endcard.json";

// ── Named exports — for SiliconTrap.tsx defineEpisode usage ────────────────

export {
  titleEpisode,
  kinetic92Yield,
  kinetic165b,
  chart7pctDemand,
  titleSectionDenial,
  horizontalTimelineOilChip,
  kineticRevenueDeal,
  chartChipsAct,
  choroplethCocom,
  frameworkCocomChina,
  titleSectionWall,
  kineticKabozi,
  kineticJuguo,
  chartLithography,
  timeseriesSmicYield,
  frameworkKirinTeardown,
  kineticDeepseekZero,
  titleSectionTrap,
  gameboardChess,
  gameboardGo,
  routeChipSupply,
  kineticTrap,
  choroplethCaughtBetween,
  kineticMorrisChang,
  titleSectionChips,
  decisiontreeAiTimeline,
  routeBifurcation,
  titleEndcard,
};

// ── Filename → data map — for SiliconTrapFull.tsx (FullEpisode lookup) ─────

export const TEMPLATE_DATA: Record<string, unknown> = {
  "title-episode.json": titleEpisode,
  "kinetic-92-yield.json": kinetic92Yield,
  "kinetic-165b.json": kinetic165b,
  "chart-7pct-demand.json": chart7pctDemand,
  "title-section-denial.json": titleSectionDenial,
  "horizontal-timeline-oil-chip.json": horizontalTimelineOilChip,
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

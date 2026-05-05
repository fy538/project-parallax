/**
 * SiliconTrap — "The Silicon Trap"
 * Master composition built via defineEpisode (per L52 + 2026-05 episode-builder sprint).
 *
 * 29 clips arranged via the EpisodeSeries cross-fade pattern. Duration auto-derives
 * from each data file's `durationSec`; phase-based templates (ChoroplethMap, GameBoard,
 * RouteAnimation) use shared duration helpers.
 *
 * Sequence sourced from script-v5-production.md (two-column format).
 *   v4 → v5 changes: +2 GameBoard (chess/go), +1 DecisionTree, +1 TimeSeriesChart,
 *     +1 RouteAnimation (bifurcation), −1 FrameworkDiagram (chess-go),
 *     −1 FrameworkDiagram (ai-timeline), −1 DataChart (smic-yield)
 */

import { defineEpisode, clip, sumPhases, sumPhasesPlus } from "../../utils/defineEpisode";

// Templates
import { TitleTransition } from "../TitleTransition/TitleTransition";
import { ChoroplethMap } from "../ChoroplethMap/ChoroplethMap";
import { KineticTypography } from "../KineticTypography/KineticTypography";
import { DataChart } from "../DataChart/DataChart";
import { FrameworkDiagram } from "../FrameworkDiagram/FrameworkDiagram";
import { RouteAnimation } from "../RouteAnimation/RouteAnimation";
import { GameBoard } from "../GameBoard/GameBoard";
import { DecisionTree } from "../DecisionTree/DecisionTree";
import { TimeSeriesChart } from "../TimeSeriesChart/TimeSeriesChart";
import { DualTimeline } from "../DualTimeline/DualTimeline";

// All 29 data files come from one source — see silicon-trap-data.ts. Adding a
// clip means editing that barrel only; this file picks it up automatically.
import {
  titleEpisode,
  kinetic92Yield,
  kinetic165b,
  chart7pctDemand,
  titleSectionDenial,
  dualTimelineOilChips,
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
} from "./silicon-trap-data";

// Phase-based templates with a 1-second intro delay (RouteAnimation/index.tsx convention).
const routeDuration = sumPhasesPlus(1);

export const SiliconTrap = defineEpisode({
  slug: "silicon-trap",
  clips: [
    // 01 — Opening
    clip({ component: TitleTransition, data: titleEpisode }),

    // 02-04 — Beat 1: Opening stats
    clip({ component: KineticTypography, data: kinetic92Yield }),
    clip({ component: KineticTypography, data: kinetic165b }),
    clip({ component: DataChart, data: chart7pctDemand }),

    // 05-10 — Beat 2: The Logic of Denial
    clip({ component: TitleTransition, data: titleSectionDenial }),
    clip({ component: DualTimeline, data: dualTimelineOilChips }),
    clip({ component: KineticTypography, data: kineticRevenueDeal }),
    clip({ component: DataChart, data: chartChipsAct }),
    clip({ component: ChoroplethMap, data: choroplethCocom, durationOf: sumPhases }),
    clip({ component: FrameworkDiagram, data: frameworkCocomChina }),

    // 11-17 — Beat 3: The Other Side of the Wall
    clip({ component: TitleTransition, data: titleSectionWall }),
    clip({ component: KineticTypography, data: kineticKabozi }),
    clip({ component: KineticTypography, data: kineticJuguo }),
    clip({ component: DataChart, data: chartLithography }),
    clip({ component: TimeSeriesChart, data: timeseriesSmicYield }),
    clip({ component: FrameworkDiagram, data: frameworkKirinTeardown }),
    clip({ component: KineticTypography, data: kineticDeepseekZero }),

    // 18-23 — Beat 4: The Trap
    clip({ component: TitleTransition, data: titleSectionTrap }),
    clip({ component: GameBoard, data: gameboardChess, durationOf: sumPhases }),
    clip({ component: GameBoard, data: gameboardGo, durationOf: sumPhases }),
    clip({ component: RouteAnimation, data: routeChipSupply, durationOf: routeDuration }),
    clip({ component: KineticTypography, data: kineticTrap }),
    clip({ component: ChoroplethMap, data: choroplethCaughtBetween, durationOf: sumPhases }),
    clip({ component: KineticTypography, data: kineticMorrisChang }),

    // 24-26 — Beat 5: Your Chips
    clip({ component: TitleTransition, data: titleSectionChips }),
    clip({ component: DecisionTree, data: decisiontreeAiTimeline }),
    clip({ component: RouteAnimation, data: routeBifurcation, durationOf: routeDuration }),

    // 27 — Closing
    clip({ component: TitleTransition, data: titleEndcard }),
  ],
});

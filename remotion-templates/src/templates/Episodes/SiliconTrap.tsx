/**
 * SiliconTrap — "The Silicon Trap"
 * Master sequence composition that stitches all 29 clips into one continuous video.
 *
 * Uses Remotion's <Series> component with 15-frame cross-fade overlaps between clips.
 * Each clip loads its JSON data file and renders the appropriate template component.
 *
 * Regenerated from script-v5-production.md (two-column format).
 * v4→v5 changes: +2 GameBoard (chess/go), +1 DecisionTree, +1 TimeSeriesChart,
 *   +1 RouteAnimation (bifurcation), −1 FrameworkDiagram (chess-go),
 *   −1 FrameworkDiagram (ai-timeline), −1 DataChart (smic-yield)
 * Total Remotion compositions: 29 (7 title, 8 kinetic, 3 chart, 1 timeseries,
 *   2 framework, 2 gameboard, 1 decisiontree, 2 choropleth, 1 timeline, 2 route)
 */

import React from "react";
import { Series, AbsoluteFill } from "remotion";
import { sec } from "../../design/theme";
import { TitleTransition } from "../TitleTransition/TitleTransition";
import { ChoroplethMap } from "../ChoroplethMap/ChoroplethMap";
import { KineticTypography } from "../KineticTypography/KineticTypography";
import { DataChart } from "../DataChart/DataChart";
import { FrameworkDiagram } from "../FrameworkDiagram/FrameworkDiagram";
import { RouteAnimation } from "../RouteAnimation/RouteAnimation";
import { GameBoard } from "../GameBoard/GameBoard";
import { DecisionTree } from "../DecisionTree/DecisionTree";
import { TimeSeriesChart } from "../TimeSeriesChart/TimeSeriesChart";

import type { TitleTransitionData } from "../TitleTransition/types";
import type { ChoroplethMapData } from "../ChoroplethMap/types";
import type { QuoteData } from "../KineticTypography/types";
import type { DataChartData } from "../DataChart/types";
import type { FrameworkDiagramData } from "../FrameworkDiagram/types";
import type { RouteAnimationData } from "../RouteAnimation/types";
import type { GameBoardData } from "../GameBoard/types";
import type { DecisionTreeData } from "../DecisionTree/types";
import type { TimeSeriesChartData } from "../TimeSeriesChart/types";
import type { DualTimelineData } from "../DualTimeline/types";
import { DualTimeline } from "../DualTimeline/DualTimeline";

// ── Import all 29 JSON data files in sequence order ─────────────────────────

// Opening + Beat 1
import titleEpisode from "../../../data/episodes/silicon-trap/title-episode.json";
import kinetic92Yield from "../../../data/episodes/silicon-trap/kinetic-92-yield.json";
import kinetic165b from "../../../data/episodes/silicon-trap/kinetic-165b.json";
import chart7pctDemand from "../../../data/episodes/silicon-trap/chart-7pct-demand.json";

// Beat 2 — The Logic of Denial
import titleSectionDenial from "../../../data/episodes/silicon-trap/title-section-denial.json";
import dualTimelineOilChips from "../../../data/episodes/silicon-trap/dual-timeline-oil-chips.json";
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

// ── Helper: Calculate duration for choropleth clips (phases-based) ──────────

function getChoroplethDuration(data: ChoroplethMapData): number {
  return data.phases.reduce((sum, p) => sum + sec(p.durationSec), 0);
}

// ── Helper: Calculate duration for route clips (phases-based) ───────────────

function getRouteDuration(data: RouteAnimationData): number {
  const phaseDuration = data.phases.reduce((sum, p) => sum + p.durationSec, 0);
  return sec(phaseDuration + 1); // +1s intro delay (matches RouteAnimation/index.tsx)
}

// ── Clip metadata ───────────────────────────────────────────────────────────

type ClipMetadata = {
  filename: string;
  component: React.ComponentType<any>;
  data: any;
  durationFrames: number;
};

const OVERLAP_FRAMES = 15; // 15-frame cross-fade between clips

// Helper: Calculate duration for DualTimeline clips
function getDualTimelineDuration(data: DualTimelineData): number {
  return sec(data.durationSec || 18);
}

// Helper: Calculate duration for GameBoard clips (phases-based)
function getGameBoardDuration(data: GameBoardData): number {
  const phaseDuration = data.phases.reduce((sum, p) => sum + p.durationSec, 0);
  return sec(phaseDuration);
}

// Build the 29-clip sequence from script-v5-production.md
const clips: ClipMetadata[] = [
  // 01 — Opening
  {
    filename: "title-episode.json",
    component: TitleTransition,
    data: titleEpisode,
    durationFrames: sec((titleEpisode as TitleTransitionData).durationSec ?? 0),
  },

  // 02-04 — Beat 1: Opening stats
  {
    filename: "kinetic-92-yield.json",
    component: KineticTypography,
    data: kinetic92Yield,
    durationFrames: sec((kinetic92Yield as QuoteData).durationSec ?? 0),
  },
  {
    filename: "kinetic-165b.json",
    component: KineticTypography,
    data: kinetic165b,
    durationFrames: sec((kinetic165b as QuoteData).durationSec ?? 0),
  },
  {
    filename: "chart-7pct-demand.json",
    component: DataChart,
    data: chart7pctDemand,
    durationFrames: sec((chart7pctDemand as DataChartData).durationSec ?? 0),
  },

  // 06-11 — Beat 2: The Logic of Denial
  {
    filename: "title-section-denial.json",
    component: TitleTransition,
    data: titleSectionDenial,
    durationFrames: sec((titleSectionDenial as TitleTransitionData).durationSec ?? 0),
  },
  {
    filename: "dual-timeline-oil-chips.json",
    component: DualTimeline,
    data: dualTimelineOilChips,
    durationFrames: getDualTimelineDuration(dualTimelineOilChips as DualTimelineData),
  },
  {
    filename: "kinetic-revenue-deal.json",
    component: KineticTypography,
    data: kineticRevenueDeal,
    durationFrames: sec((kineticRevenueDeal as QuoteData).durationSec ?? 0),
  },
  {
    filename: "chart-chips-act.json",
    component: DataChart,
    data: chartChipsAct,
    durationFrames: sec((chartChipsAct as DataChartData).durationSec ?? 0),
  },
  {
    filename: "choropleth-cocom.json",
    component: ChoroplethMap,
    data: choroplethCocom,
    durationFrames: getChoroplethDuration(choroplethCocom as unknown as ChoroplethMapData),
  },
  {
    filename: "framework-cocom-china.json",
    component: FrameworkDiagram,
    data: frameworkCocomChina,
    durationFrames: sec((frameworkCocomChina as FrameworkDiagramData).durationSec ?? 0),
  },

  // 12-18 — Beat 3: The Other Side of the Wall
  {
    filename: "title-section-wall.json",
    component: TitleTransition,
    data: titleSectionWall,
    durationFrames: sec((titleSectionWall as TitleTransitionData).durationSec ?? 0),
  },
  {
    filename: "kinetic-kabozi.json",
    component: KineticTypography,
    data: kineticKabozi,
    durationFrames: sec((kineticKabozi as QuoteData).durationSec ?? 0),
  },
  {
    filename: "kinetic-juguo.json",
    component: KineticTypography,
    data: kineticJuguo,
    durationFrames: sec((kineticJuguo as QuoteData).durationSec ?? 0),
  },
  {
    filename: "chart-lithography.json",
    component: DataChart,
    data: chartLithography,
    durationFrames: sec((chartLithography as DataChartData).durationSec ?? 0),
  },
  {
    filename: "timeseries-smic-yield.json",
    component: TimeSeriesChart,
    data: timeseriesSmicYield,
    durationFrames: sec((timeseriesSmicYield as TimeSeriesChartData).durationSec ?? 0),
  },
  {
    filename: "framework-kirin-teardown.json",
    component: FrameworkDiagram,
    data: frameworkKirinTeardown,
    durationFrames: sec((frameworkKirinTeardown as FrameworkDiagramData).durationSec ?? 0),
  },
  {
    filename: "kinetic-deepseek-zero.json",
    component: KineticTypography,
    data: kineticDeepseekZero,
    durationFrames: sec((kineticDeepseekZero as QuoteData).durationSec ?? 0),
  },

  // 19-24 — Beat 4: The Trap
  {
    filename: "title-section-trap.json",
    component: TitleTransition,
    data: titleSectionTrap,
    durationFrames: sec((titleSectionTrap as TitleTransitionData).durationSec ?? 0),
  },
  {
    filename: "gameboard-chess.json",
    component: GameBoard,
    data: gameboardChess,
    durationFrames: getGameBoardDuration(gameboardChess as unknown as GameBoardData),
  },
  {
    filename: "gameboard-go.json",
    component: GameBoard,
    data: gameboardGo,
    durationFrames: getGameBoardDuration(gameboardGo as unknown as GameBoardData),
  },
  {
    filename: "route-chip-supply.json",
    component: RouteAnimation,
    data: routeChipSupply,
    durationFrames: getRouteDuration(routeChipSupply as unknown as RouteAnimationData),
  },
  {
    filename: "kinetic-trap.json",
    component: KineticTypography,
    data: kineticTrap,
    durationFrames: sec((kineticTrap as QuoteData).durationSec ?? 0),
  },
  {
    filename: "choropleth-caught-between.json",
    component: ChoroplethMap,
    data: choroplethCaughtBetween,
    durationFrames: getChoroplethDuration(choroplethCaughtBetween as unknown as ChoroplethMapData),
  },
  {
    filename: "kinetic-morris-chang.json",
    component: KineticTypography,
    data: kineticMorrisChang,
    durationFrames: sec((kineticMorrisChang as QuoteData).durationSec ?? 0),
  },

  // 25-26 — Beat 5: Your Chips
  {
    filename: "title-section-chips.json",
    component: TitleTransition,
    data: titleSectionChips,
    durationFrames: sec((titleSectionChips as TitleTransitionData).durationSec ?? 0),
  },
  {
    filename: "decisiontree-ai-timeline.json",
    component: DecisionTree,
    data: decisiontreeAiTimeline,
    durationFrames: sec((decisiontreeAiTimeline as unknown as DecisionTreeData).durationSec ?? 0),
  },
  {
    filename: "route-bifurcation.json",
    component: RouteAnimation,
    data: routeBifurcation,
    durationFrames: getRouteDuration(routeBifurcation as unknown as RouteAnimationData),
  },

  // 29 — Closing
  {
    filename: "title-endcard.json",
    component: TitleTransition,
    data: titleEndcard,
    durationFrames: sec((titleEndcard as TitleTransitionData).durationSec ?? 0),
  },
];

// ── Silicon Trap Master Composition ─────────────────────────────────────────────────

export const SiliconTrap: React.FC = () => {
  return (
    <AbsoluteFill>
      <Series>
        {clips.map((clip, index) => {
          const Comp = clip.component;
          return (
            <Series.Sequence
              key={`${index}-${clip.filename}`}
              durationInFrames={clip.durationFrames}
              offset={index > 0 ? -OVERLAP_FRAMES : 0}
            >
              <Comp data={clip.data} />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};

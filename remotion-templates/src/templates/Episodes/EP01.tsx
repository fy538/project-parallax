/**
 * EP01 — The Silicon Trap
 * Master sequence composition that stitches all 24 clips into one continuous video.
 *
 * Uses Remotion's <Series> component with 15-frame cross-fade overlaps between clips.
 * Each clip loads its JSON data file and renders the appropriate template component.
 *
 * Total motion graphics runtime: ~203 seconds (~3:23)
 * Render timeline is NLE + narration audio + B-roll alongside these compositions.
 */

import React from "react";
import { Series, AbsoluteFill } from "remotion";
import { layout, sec } from "../../design/theme";
import { TitleTransition } from "../TitleTransition/TitleTransition";
import { ChoroplethMap } from "../ChoroplethMap/ChoroplethMap";
import { KineticTypography } from "../KineticTypography/KineticTypography";
import { TimelineComparison } from "../TimelineComparison/TimelineComparison";
import { DataChart } from "../DataChart/DataChart";
import { FrameworkDiagram } from "../FrameworkDiagram/FrameworkDiagram";
import { RouteAnimation } from "../RouteAnimation/RouteAnimation";

import type { TitleTransitionData } from "../TitleTransition/types";
import type { ChoroplethMapData } from "../ChoroplethMap/types";
import type { QuoteData } from "../KineticTypography/types";
import type { TimelineComparisonData } from "../TimelineComparison/types";
import type { DataChartData } from "../DataChart/types";
import type { FrameworkDiagramData } from "../FrameworkDiagram/types";
import type { RouteAnimationData } from "../RouteAnimation/types";

// Import all 24 JSON data files in sequence order
import titleEpisode from "../../../data/episodes/ep01/title-episode.json";
import titleSectionAct1 from "../../../data/episodes/ep01/title-section-act1.json";
import choroplethReshoring from "../../../data/episodes/ep01/choropleth-reshoring.json";
import kinetic7pct from "../../../data/episodes/ep01/kinetic-7pct.json";

import titleSectionDenial from "../../../data/episodes/ep01/title-section-denial.json";
import timelineOilChips from "../../../data/episodes/ep01/timeline-oil-chips.json";
import chartExportControls from "../../../data/episodes/ep01/chart-export-controls.json";
import frameworkCocomChina from "../../../data/episodes/ep01/framework-cocom-china.json";

import titleSectionWall from "../../../data/episodes/ep01/title-section-wall.json";
import kineticKabozi from "../../../data/episodes/ep01/kinetic-kabozi.json";
import chartPenContrast from "../../../data/episodes/ep01/chart-pen-contrast.json";
import kineticJuguo from "../../../data/episodes/ep01/kinetic-juguo.json";
import chartLithography from "../../../data/episodes/ep01/chart-lithography.json";
import chartKirinTeardown from "../../../data/episodes/ep01/chart-kirin-teardown.json";
import timelineDeepseek from "../../../data/episodes/ep01/timeline-deepseek.json";

import titleSectionTrap from "../../../data/episodes/ep01/title-section-trap.json";
import frameworkChessGo from "../../../data/episodes/ep01/framework-chess-go.json";
import routeChipSupply from "../../../data/episodes/ep01/route-chip-supply.json";
import choroplethSupplyChain from "../../../data/episodes/ep01/choropleth-supply-chain.json";
import kineticMorrisChang from "../../../data/episodes/ep01/kinetic-morris-chang.json";
import choroplethBifurcation from "../../../data/episodes/ep01/choropleth-bifurcation.json";

import titleSectionChips from "../../../data/episodes/ep01/title-section-chips.json";
import chartChipsEverywhere from "../../../data/episodes/ep01/chart-chips-everywhere.json";

import titleEndcard from "../../../data/episodes/ep01/title-endcard.json";

// ── Helper: Calculate duration for timeline clips (phases-based) ──────────────

function getTimelineDuration(data: TimelineComparisonData): number {
  const secsPerEvent = data.secondsPerEvent || 2;
  const totalEvents = Math.max(data.leftEvents.length, data.rightEvents.length);
  return sec(totalEvents * secsPerEvent + 3);
}

// ── Helper: Calculate duration for choropleth clips (phases-based) ────────────

function getChoroplethDuration(data: ChoroplethMapData): number {
  return data.phases.reduce((sum, p) => sum + sec(p.durationSec), 0);
}

// ── Helper: Calculate duration for route clips (phases-based) ────────────────

function getRouteDuration(data: RouteAnimationData): number {
  const phaseDuration = data.phases.reduce((sum, p) => sum + p.durationSec, 0);
  return sec(phaseDuration + 1); // +1s intro delay (matches RouteAnimation/index.tsx)
}

// ── Clip metadata: filename, component, duration in frames ──────────────────

type ClipMetadata = {
  filename: string;
  component: React.ComponentType<any>;
  data: any;
  durationFrames: number;
};

const OVERLAP_FRAMES = 15; // 15-frame cross-fade between clips

// Build the 24-clip sequence from SEQUENCE.md
const clips: ClipMetadata[] = [
  // 01 — Opening
  {
    filename: "title-episode.json",
    component: TitleTransition,
    data: titleEpisode,
    durationFrames: sec((titleEpisode as TitleTransitionData).durationSec),
  },

  // 02-04 — Beat 1: The Paradox
  {
    filename: "title-section-act1.json",
    component: TitleTransition,
    data: titleSectionAct1,
    durationFrames: sec((titleSectionAct1 as TitleTransitionData).durationSec),
  },
  {
    filename: "choropleth-reshoring.json",
    component: ChoroplethMap,
    data: choroplethReshoring,
    durationFrames: getChoroplethDuration(choroplethReshoring as ChoroplethMapData),
  },
  {
    filename: "kinetic-7pct.json",
    component: KineticTypography,
    data: kinetic7pct,
    durationFrames: sec((kinetic7pct as QuoteData).durationSec),
  },

  // 05-08 — Beat 2: The Logic of Denial
  {
    filename: "title-section-denial.json",
    component: TitleTransition,
    data: titleSectionDenial,
    durationFrames: sec((titleSectionDenial as TitleTransitionData).durationSec),
  },
  {
    filename: "timeline-oil-chips.json",
    component: TimelineComparison,
    data: timelineOilChips,
    durationFrames: getTimelineDuration(timelineOilChips as TimelineComparisonData),
  },
  {
    filename: "chart-export-controls.json",
    component: DataChart,
    data: chartExportControls,
    durationFrames: sec((chartExportControls as DataChartData).durationSec),
  },
  {
    filename: "framework-cocom-china.json",
    component: FrameworkDiagram,
    data: frameworkCocomChina,
    durationFrames: sec((frameworkCocomChina as FrameworkDiagramData).durationSec),
  },

  // 09-15 — Beat 3: The Other Side of the Wall
  {
    filename: "title-section-wall.json",
    component: TitleTransition,
    data: titleSectionWall,
    durationFrames: sec((titleSectionWall as TitleTransitionData).durationSec),
  },
  {
    filename: "kinetic-kabozi.json",
    component: KineticTypography,
    data: kineticKabozi,
    durationFrames: sec((kineticKabozi as QuoteData).durationSec),
  },
  {
    filename: "chart-pen-contrast.json",
    component: DataChart,
    data: chartPenContrast,
    durationFrames: sec((chartPenContrast as DataChartData).durationSec),
  },
  {
    filename: "kinetic-juguo.json",
    component: KineticTypography,
    data: kineticJuguo,
    durationFrames: sec((kineticJuguo as QuoteData).durationSec),
  },
  {
    filename: "chart-lithography.json",
    component: DataChart,
    data: chartLithography,
    durationFrames: sec((chartLithography as DataChartData).durationSec),
  },
  {
    filename: "chart-kirin-teardown.json",
    component: DataChart,
    data: chartKirinTeardown,
    durationFrames: sec((chartKirinTeardown as DataChartData).durationSec),
  },
  {
    filename: "timeline-deepseek.json",
    component: TimelineComparison,
    data: timelineDeepseek,
    durationFrames: getTimelineDuration(timelineDeepseek as TimelineComparisonData),
  },

  // 16-21 — Beat 4: The Trap
  {
    filename: "title-section-trap.json",
    component: TitleTransition,
    data: titleSectionTrap,
    durationFrames: sec((titleSectionTrap as TitleTransitionData).durationSec),
  },
  {
    filename: "framework-chess-go.json",
    component: FrameworkDiagram,
    data: frameworkChessGo,
    durationFrames: sec((frameworkChessGo as FrameworkDiagramData).durationSec),
  },
  {
    filename: "route-chip-supply.json",
    component: RouteAnimation,
    data: routeChipSupply,
    durationFrames: getRouteDuration(routeChipSupply as RouteAnimationData),
  },
  {
    filename: "choropleth-supply-chain.json",
    component: ChoroplethMap,
    data: choroplethSupplyChain,
    durationFrames: getChoroplethDuration(choroplethSupplyChain as ChoroplethMapData),
  },
  {
    filename: "kinetic-morris-chang.json",
    component: KineticTypography,
    data: kineticMorrisChang,
    durationFrames: sec((kineticMorrisChang as QuoteData).durationSec),
  },
  {
    filename: "choropleth-bifurcation.json",
    component: ChoroplethMap,
    data: choroplethBifurcation,
    durationFrames: getChoroplethDuration(choroplethBifurcation as ChoroplethMapData),
  },

  // 22-23 — Beat 5: Your Chips
  {
    filename: "title-section-chips.json",
    component: TitleTransition,
    data: titleSectionChips,
    durationFrames: sec((titleSectionChips as TitleTransitionData).durationSec),
  },
  {
    filename: "chart-chips-everywhere.json",
    component: DataChart,
    data: chartChipsEverywhere,
    durationFrames: sec((chartChipsEverywhere as DataChartData).durationSec),
  },

  // 24 — Closing
  {
    filename: "title-endcard.json",
    component: TitleTransition,
    data: titleEndcard,
    durationFrames: sec((titleEndcard as TitleTransitionData).durationSec),
  },
];

// ── EP01 Master Composition ──────────────────────────────────────────────────

export const EP01: React.FC = () => {
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

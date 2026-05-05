/**
 * PrisonersDilemmaShowcase — Preview composition for all prisoners-dilemma visuals.
 *
 * Renders each data file sequentially (5-15 seconds each) so you can scrub through
 * the entire visual layer in Remotion Studio. This is NOT the final episode composition
 * (that requires an assembly manifest from narration timing) — it's a preview tool.
 *
 * Register in Root.tsx under the Episodes folder.
 */

import React from "react";
import { Composition, Series } from "remotion";
import { layout, sec } from "../../design/theme";

// ── Template components ─────────────────────────────────────────────────────

import { GameBoard } from "../GameBoard/GameBoard";
import { KineticTypography } from "../KineticTypography/KineticTypography";
import { FrameworkDiagram } from "../FrameworkDiagram/FrameworkDiagram";
import { DataChart } from "../DataChart/DataChart";
// ChoroplethMap requires WebGL — use a placeholder for headless render.
// Preview in Studio (localhost) works fine; only `remotion render` fails.
import { AbsoluteFill } from "remotion";

const ChoroplethMapPlaceholder: React.FC<{ data: any }> = ({ data }) => (
  <AbsoluteFill
    style={{
      backgroundColor: "#1C1814",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Space Grotesk, sans-serif",
    }}
  >
    <div style={{ color: "#E5A544", fontSize: 48, marginBottom: 16 }}>🗺️</div>
    <div style={{ color: "#F0E6D0", fontSize: 32, marginBottom: 8 }}>
      {(data as any).title}
    </div>
    <div style={{ color: "#888780", fontSize: 20 }}>
      ChoroplethMap — preview in Remotion Studio (requires WebGL)
    </div>
  </AbsoluteFill>
);

// ── Import all prisoners-dilemma data files ─────────────────────────────────

import gameboardFloodDresher from "../../../data/episodes/prisoners-dilemma/gameboard-flood-dresher.json";
import kineticNashQuote from "../../../data/episodes/prisoners-dilemma/kinetic-nash-quote.json";
import kineticContradictedConquered from "../../../data/episodes/prisoners-dilemma/kinetic-contradicted-conquered.json";
import gameboardMotifBeat1 from "../../../data/episodes/prisoners-dilemma/gameboard-motif-beat1.json";
import chartDiffusion from "../../../data/episodes/prisoners-dilemma/chart-diffusion.json";
import gameboardNuclear from "../../../data/episodes/prisoners-dilemma/gameboard-nuclear.json";
import frameworkNarrowing from "../../../data/episodes/prisoners-dilemma/framework-narrowing.json";
import kinetic200014 from "../../../data/episodes/prisoners-dilemma/kinetic-2000-14.json";
import kineticCheckpointBeat2 from "../../../data/episodes/prisoners-dilemma/kinetic-checkpoint-beat2.json";
import gameboardTrapMechanism from "../../../data/episodes/prisoners-dilemma/gameboard-trap-mechanism.json";
import kineticPredictionBelieved from "../../../data/episodes/prisoners-dilemma/kinetic-prediction-believed.json";
import kineticWrongGameTitle from "../../../data/episodes/prisoners-dilemma/kinetic-wrong-game-title.json";
import chartVolSmile from "../../../data/episodes/prisoners-dilemma/chart-vol-smile.json";
import frameworkMotifBeat3 from "../../../data/episodes/prisoners-dilemma/framework-motif-beat3.json";
import frameworkPdCycle from "../../../data/episodes/prisoners-dilemma/framework-pd-cycle.json";
import kineticWrongGameReal from "../../../data/episodes/prisoners-dilemma/kinetic-wrong-game-real.json";
import kineticCheckpointBeat3 from "../../../data/episodes/prisoners-dilemma/kinetic-checkpoint-beat3.json";
import gameboardStaghunt from "../../../data/episodes/prisoners-dilemma/gameboard-staghunt.json";
import gameboardComparison from "../../../data/episodes/prisoners-dilemma/gameboard-comparison.json";
import kineticIteratedEquiv from "../../../data/episodes/prisoners-dilemma/kinetic-iterated-equiv.json";
import frameworkNewQuestion from "../../../data/episodes/prisoners-dilemma/framework-new-question.json";
import choroplethOstrom from "../../../data/episodes/prisoners-dilemma/choropleth-ostrom.json";
import frameworkOstromPrinciples from "../../../data/episodes/prisoners-dilemma/framework-ostrom-principles.json";
import frameworkOstromVsPd from "../../../data/episodes/prisoners-dilemma/framework-ostrom-vs-pd.json";
import kineticCooperationDesigned from "../../../data/episodes/prisoners-dilemma/kinetic-cooperation-designed.json";
import frameworkMotifBeat5 from "../../../data/episodes/prisoners-dilemma/framework-motif-beat5.json";
import frameworkMotifFinal from "../../../data/episodes/prisoners-dilemma/framework-motif-final.json";
import frameworkChangeMind from "../../../data/episodes/prisoners-dilemma/framework-change-mind.json";
import kineticPrediction2026 from "../../../data/episodes/prisoners-dilemma/kinetic-prediction-2026.json";
import kineticWatchSignals from "../../../data/episodes/prisoners-dilemma/kinetic-watch-signals.json";
import gameboardCallbackBeat1 from "../../../data/episodes/prisoners-dilemma/gameboard-callback-beat1.json";
import gameboardFinalChoice from "../../../data/episodes/prisoners-dilemma/gameboard-final-choice.json";
import frameworkStandardFrame from "../../../data/episodes/prisoners-dilemma/framework-standard-frame.json";

// ── Sequence definition ─────────────────────────────────────────────────────

interface Clip {
  component: React.FC<{ data: any }>;
  data: any;
  durationSec: number;
  label: string;
}

const clips: Clip[] = [
  // Beat 1
  { component: GameBoard, data: gameboardFloodDresher, durationSec: 10, label: "Flood-Dresher Scoreboard" },
  { component: KineticTypography, data: kineticNashQuote, durationSec: 5, label: "Nash Quote" },
  { component: KineticTypography, data: kineticContradictedConquered, durationSec: 4, label: "Contradicted/Conquered" },
  { component: FrameworkDiagram, data: frameworkStandardFrame, durationSec: 6, label: "Standard Frame" },
  { component: GameBoard, data: gameboardMotifBeat1, durationSec: 6, label: "Motif: Single Dot" },
  // Beat 2
  { component: DataChart, data: chartDiffusion, durationSec: 12, label: "PD Diffusion Chart" },
  { component: GameBoard, data: gameboardNuclear, durationSec: 8, label: "Nuclear PD Matrix" },
  { component: FrameworkDiagram, data: frameworkNarrowing, durationSec: 15, label: "Narrowing Assumptions" },
  { component: KineticTypography, data: kinetic200014, durationSec: 4, label: "2,000 / 14" },
  { component: KineticTypography, data: kineticCheckpointBeat2, durationSec: 8, label: "Beat 2 Checkpoint" },
  // Beat 3
  { component: GameBoard, data: gameboardTrapMechanism, durationSec: 8, label: "Trap Mechanism" },
  { component: KineticTypography, data: kineticPredictionBelieved, durationSec: 5, label: "Prediction Believed" },
  { component: KineticTypography, data: kineticWrongGameTitle, durationSec: 4, label: "THE WRONG GAME" },
  { component: DataChart, data: chartVolSmile, durationSec: 8, label: "Volatility Smile" },
  { component: FrameworkDiagram, data: frameworkMotifBeat3, durationSec: 10, label: "Motif: Four Cities" },
  { component: FrameworkDiagram, data: frameworkPdCycle, durationSec: 6, label: "PD Cycle vs Question" },
  { component: KineticTypography, data: kineticWrongGameReal, durationSec: 5, label: "Wrong Game Real" },
  { component: KineticTypography, data: kineticCheckpointBeat3, durationSec: 7, label: "Beat 3 Checkpoint" },
  // Beat 4
  { component: GameBoard, data: gameboardStaghunt, durationSec: 12, label: "Stag Hunt" },
  { component: GameBoard, data: gameboardComparison, durationSec: 10, label: "PD vs Stag Hunt" },
  { component: KineticTypography, data: kineticIteratedEquiv, durationSec: 6, label: "Iterated PD = Stag Hunt" },
  { component: FrameworkDiagram, data: frameworkNewQuestion, durationSec: 6, label: "New Question" },
  { component: ChoroplethMapPlaceholder, data: choroplethOstrom, durationSec: 12, label: "Ostrom World Map (WebGL)" },
  { component: FrameworkDiagram, data: frameworkOstromPrinciples, durationSec: 10, label: "Ostrom Principles" },
  { component: FrameworkDiagram, data: frameworkOstromVsPd, durationSec: 10, label: "Ostrom vs PD" },
  { component: KineticTypography, data: kineticCooperationDesigned, durationSec: 5, label: "Cooperation Designed" },
  // Beat 5
  { component: FrameworkDiagram, data: frameworkMotifBeat5, durationSec: 8, label: "Motif: Synchronized" },
  { component: FrameworkDiagram, data: frameworkMotifFinal, durationSec: 10, label: "Motif: FINAL" },
  { component: FrameworkDiagram, data: frameworkChangeMind, durationSec: 8, label: "Change My Mind" },
  { component: KineticTypography, data: kineticPrediction2026, durationSec: 8, label: "Prediction 2026" },
  { component: KineticTypography, data: kineticWatchSignals, durationSec: 8, label: "Watch Signals" },
  { component: GameBoard, data: gameboardCallbackBeat1, durationSec: 5, label: "Callback Beat 1" },
  { component: GameBoard, data: gameboardFinalChoice, durationSec: 5, label: "Final Choice" },
];

const TOTAL_DURATION_SEC = clips.reduce((sum, c) => sum + c.durationSec, 0);

// ── Showcase component ──────────────────────────────────────────────────────

export const PrisonersDilemmaShowcase: React.FC = () => {
  return (
    <Series>
      {clips.map((clip, i) => {
        const Component = clip.component;
        return (
          <Series.Sequence
            key={i}
            durationInFrames={sec(clip.durationSec)}
            name={`${String(i + 1).padStart(2, "0")} — ${clip.label}`}
          >
            <Component data={clip.data as any} />
          </Series.Sequence>
        );
      })}
    </Series>
  );
};

// ── Composition registration ────────────────────────────────────────────────

export const PrisonersDilemmaShowcaseComposition = () => (
  <Composition
    id="prisoners-dilemma-showcase"
    component={PrisonersDilemmaShowcase}
    calculateMetadata={() => ({
      durationInFrames: sec(TOTAL_DURATION_SEC),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
  />
);

/**
 * PrisonersDilemmaShowcase — Preview composition for the full visual layer.
 *
 * Renders all 41 Remotion data files + 17 AI-generated Hailuo clips in script
 * order so you can scrub through the entire visual layer in Remotion Studio or
 * render to MP4. Total: 58 segments.
 *
 * Archival stills (Nash portrait, RAND HQ, Reagan-Gorbachev) are placeholders
 * until sourced.
 *
 * NOT the final episode composition (that requires an assembly manifest with
 * narration timing) — this is a preview/review tool.
 *
 * SETUP: Copy AI-gen clips into public/episodes/prisoners-dilemma/clips/
 *   cp episodes/prisoners-dilemma/assets/clips/*.mp4 \
 *      remotion-templates/public/episodes/prisoners-dilemma/clips/
 *
 * Register in Root.tsx under the Episodes folder.
 */

import React from "react";
import {
  Composition,
  Series,
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
} from "remotion";
import { layout, sec } from "../../design/theme";

// ── Template components ─────────────────────────────────────────────────────

import { GameBoard } from "../GameBoard/GameBoard";
import { KineticTypography } from "../KineticTypography/KineticTypography";
import { FrameworkDiagram } from "../FrameworkDiagram/FrameworkDiagram";
import { DataChart } from "../DataChart/DataChart";
import { TimeSeriesChart } from "../TimeSeriesChart/TimeSeriesChart";
import { TitleTransition } from "../TitleTransition/TitleTransition";
import { SplitComposition } from "../SplitComposition/SplitComposition";
import { ProbabilityGauge } from "../ProbabilityGauge/ProbabilityGauge";

// ── Helpers ─────────────────────────────────────────────────────────────────

const CLIP_DIR = "episodes/prisoners-dilemma/clips";

/** Wrapper that plays an AI-gen clip from public/ with brand-consistent fallback */
const AiGenClip: React.FC<{ src: string; label: string }> = ({ src, label }) => (
  <AbsoluteFill style={{ backgroundColor: "#1C1814" }}>
    <OffthreadVideo
      src={staticFile(src)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </AbsoluteFill>
);

/** Placeholder for archival stills not yet sourced */
const ArchivalPlaceholder: React.FC<{ label: string }> = ({ label }) => (
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
    <div style={{ color: "#E5A544", fontSize: 48, marginBottom: 16 }}>🖼️</div>
    <div style={{ color: "#F0E6D0", fontSize: 28, marginBottom: 8 }}>
      {label}
    </div>
    <div style={{ color: "#888780", fontSize: 18 }}>
      Archival still — not yet sourced
    </div>
  </AbsoluteFill>
);

// ChoroplethMap requires WebGL — use a placeholder for headless render.
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

// Titles
import titleEpisode from "../../../data/episodes/prisoners-dilemma/title-episode.json";
import titleSectionBeat2 from "../../../data/episodes/prisoners-dilemma/title-section-beat2.json";
import titleSectionBeat3 from "../../../data/episodes/prisoners-dilemma/title-section-beat3.json";
import titleSectionBeat4 from "../../../data/episodes/prisoners-dilemma/title-section-beat4.json";
import titleSectionBeat5 from "../../../data/episodes/prisoners-dilemma/title-section-beat5.json";
import titleEndCard from "../../../data/episodes/prisoners-dilemma/title-end-card.json";

// Beat 1
import frameworkStandardFrame from "../../../data/episodes/prisoners-dilemma/framework-standard-frame.json";
import kineticCantExplain from "../../../data/episodes/prisoners-dilemma/kinetic-cant-explain.json";
import kineticEveryNegotiation from "../../../data/episodes/prisoners-dilemma/kinetic-every-negotiation.json";
import gameboardFloodDresher from "../../../data/episodes/prisoners-dilemma/gameboard-flood-dresher.json";
import kineticNashQuote from "../../../data/episodes/prisoners-dilemma/kinetic-nash-quote.json";
import kineticModelConquers from "../../../data/episodes/prisoners-dilemma/kinetic-model-conquers.json";
import gameboardMotifBeat1 from "../../../data/episodes/prisoners-dilemma/gameboard-motif-beat1.json";

// Beat 2
import chartDiffusion from "../../../data/episodes/prisoners-dilemma/chart-diffusion.json";
import gameboardNuclear from "../../../data/episodes/prisoners-dilemma/gameboard-nuclear.json";
import frameworkNarrowing from "../../../data/episodes/prisoners-dilemma/framework-narrowing.json";
import kinetic2000Articles from "../../../data/episodes/prisoners-dilemma/kinetic-2000-articles.json";
import kineticSomethingWorking from "../../../data/episodes/prisoners-dilemma/kinetic-something-working.json";
import kineticCheckpointBeat2 from "../../../data/episodes/prisoners-dilemma/kinetic-checkpoint-beat2.json";

// Beat 3
import gameboardTrapMechanism from "../../../data/episodes/prisoners-dilemma/gameboard-trap-mechanism.json";
import kineticPredictionBelieved from "../../../data/episodes/prisoners-dilemma/kinetic-prediction-believed.json";
import kineticWrongGameTitle from "../../../data/episodes/prisoners-dilemma/kinetic-wrong-game-title.json";
import chartVolSmile from "../../../data/episodes/prisoners-dilemma/chart-vol-smile.json";
import frameworkMotifBeat3 from "../../../data/episodes/prisoners-dilemma/framework-motif-beat3.json";
import frameworkCycleVsQuestion from "../../../data/episodes/prisoners-dilemma/framework-cycle-vs-question.json";
import kineticWrongGameReal from "../../../data/episodes/prisoners-dilemma/kinetic-wrong-game-real.json";
import kineticCheckpointBeat3 from "../../../data/episodes/prisoners-dilemma/kinetic-checkpoint-beat3.json";

// Beat 4
import gameboardStaghunt from "../../../data/episodes/prisoners-dilemma/gameboard-staghunt.json";
import splitPdVsStaghunt from "../../../data/episodes/prisoners-dilemma/split-pd-vs-staghunt.json";
import kineticIteratedEquiv from "../../../data/episodes/prisoners-dilemma/kinetic-iterated-equiv.json";
import frameworkReframe from "../../../data/episodes/prisoners-dilemma/framework-reframe.json";
import choroplethOstrom from "../../../data/episodes/prisoners-dilemma/choropleth-ostrom.json";
import frameworkOstromVsPd from "../../../data/episodes/prisoners-dilemma/framework-ostrom-vs-pd.json";
import kineticCooperationDesigned from "../../../data/episodes/prisoners-dilemma/kinetic-cooperation-designed.json";

// Beat 5
import frameworkMotifBeat5 from "../../../data/episodes/prisoners-dilemma/framework-motif-beat5.json";
import frameworkMotifFinal from "../../../data/episodes/prisoners-dilemma/framework-motif-final.json";
import frameworkFalsification from "../../../data/episodes/prisoners-dilemma/framework-falsification.json";
import forecastPdCooperation from "../../../data/episodes/prisoners-dilemma/forecast-pd-cooperation.json";
import kineticWatchSignals from "../../../data/episodes/prisoners-dilemma/kinetic-watch-signals.json";
import kineticEvidenceEstablishes from "../../../data/episodes/prisoners-dilemma/kinetic-evidence-establishes.json";
import gameboardFinalChoice from "../../../data/episodes/prisoners-dilemma/gameboard-final-choice.json";

// ── Sequence definition ─────────────────────────────────────────────────────
// Three clip types: template (data-driven MG), video (AI-gen/archival), placeholder

type TemplateClip = {
  type: "template";
  component: React.FC<{ data: any }>;
  data: any;
  durationSec: number;
  label: string;
};

type VideoClip = {
  type: "video";
  file: string;
  durationSec: number;
  label: string;
};

type PlaceholderClip = {
  type: "placeholder";
  durationSec: number;
  label: string;
};

type Clip = TemplateClip | VideoClip | PlaceholderClip;

const mg = (
  component: React.FC<{ data: any }>,
  data: any,
  durationSec: number,
  label: string,
): TemplateClip => ({ type: "template", component, data, durationSec, label });

const vid = (filename: string, label: string): VideoClip => ({
  type: "video",
  file: `${CLIP_DIR}/${filename}`,
  durationSec: 6,
  label,
});

const arch = (label: string, durationSec = 5): PlaceholderClip => ({
  type: "placeholder",
  durationSec,
  label,
});

const clips: Clip[] = [
  // ── Beat 1: THE FAILED EXPERIMENT ──────────────────────────────────────
  mg(TitleTransition, titleEpisode, 4, "Episode Title"),
  mg(FrameworkDiagram, frameworkStandardFrame, 12, "Standard Frame (PD Matrix)"),
  mg(KineticTypography, kineticCantExplain, 4, "Can't Explain"),
  mg(KineticTypography, kineticEveryNegotiation, 5, "Every Negotiation"),
  vid("aigen-01-rand-office.mp4", "AI-GEN: RAND Office"),
  mg(GameBoard, gameboardFloodDresher, 10, "Flood-Dresher Scoreboard (60%)"),
  arch("ARCHIVAL: Nash Portrait"),
  mg(KineticTypography, kineticNashQuote, 5, "Nash Quote"),
  vid("aigen-02-equation-poster.mp4", "AI-GEN: Equation Poster"),
  mg(KineticTypography, kineticModelConquers, 5, "Model Conquers"),
  vid("aigen-03-aerial-complex.mp4", "AI-GEN: Aerial Complex"),
  mg(GameBoard, gameboardMotifBeat1, 6, "Motif: Single Equilibrium Dot"),

  // ── Beat 2: HOW A FAILED MODEL CONQUERED THE WORLD ────────────────────
  mg(TitleTransition, titleSectionBeat2, 2, "Beat 2 Title"),
  mg(DataChart, chartDiffusion, 12, "PD Publication Diffusion"),
  arch("ARCHIVAL: RAND HQ"),
  vid("aigen-04-rand-corridor.mp4", "AI-GEN: RAND Corridor"),
  mg(GameBoard, gameboardNuclear, 8, "Nuclear PD Matrix"),
  vid("aigen-05-doorway-threshold.mp4", "AI-GEN: Doorway Threshold"),
  mg(FrameworkDiagram, frameworkNarrowing, 15, "Narrowing Assumptions"),
  mg(KineticTypography, kinetic2000Articles, 4, "2,000+ Articles"),
  mg(KineticTypography, kineticSomethingWorking, 6, "Something Is Working"),
  mg(KineticTypography, kineticCheckpointBeat2, 8, "Beat 2 Checkpoint"),

  // ── Beat 3: THE WRONG GAME ─────────────────────────────────────────────
  mg(TitleTransition, titleSectionBeat3, 2, "Beat 3 Title"),
  vid("aigen-06-grid-landscape.mp4", "AI-GEN: Grid Landscape"),
  vid("aigen-07-negotiation-room.mp4", "AI-GEN: Negotiation Room"),
  mg(GameBoard, gameboardTrapMechanism, 10, "Self-Confirming Trap"),
  mg(KineticTypography, kineticPredictionBelieved, 5, "Prediction Came True"),
  mg(KineticTypography, kineticWrongGameTitle, 4, "THE WRONG GAME"),
  vid("aigen-08-stock-exchange.mp4", "AI-GEN: Stock Exchange"),
  mg(TimeSeriesChart, chartVolSmile, 8, "Volatility Smile"),
  mg(FrameworkDiagram, frameworkMotifBeat3, 10, "Motif: Four Cities"),
  vid("aigen-09-oil-infrastructure.mp4", "AI-GEN: Oil Infrastructure"),
  mg(FrameworkDiagram, frameworkCycleVsQuestion, 12, "PD Cycle vs Question"),
  mg(KineticTypography, kineticWrongGameReal, 5, "Wrong Game Makes Wrong Game Real"),
  mg(KineticTypography, kineticCheckpointBeat3, 8, "Beat 3 Checkpoint"),

  // ── Beat 4: THERE WAS ALWAYS ANOTHER GAME ─────────────────────────────
  mg(TitleTransition, titleSectionBeat4, 2, "Beat 4 Title"),
  vid("aigen-10-sunrise-cooperative.mp4", "AI-GEN: Sunrise Cooperative"),
  vid("aigen-11-forest-stag-hunt.mp4", "AI-GEN: Forest Stag Hunt"),
  mg(GameBoard, gameboardStaghunt, 12, "Stag Hunt (Two Equilibria)"),
  mg(SplitComposition, splitPdVsStaghunt, 10, "PD vs Stag Hunt Split"),
  mg(KineticTypography, kineticIteratedEquiv, 6, "Iterated PD ≡ Stag Hunt"),
  mg(FrameworkDiagram, frameworkReframe, 6, "Old → New Question"),
  vid("aigen-12-terraced-farmland.mp4", "AI-GEN: Terraced Farmland"),
  mg(ChoroplethMapPlaceholder, choroplethOstrom, 14, "Ostrom 800+ Cases (WebGL)"),
  mg(FrameworkDiagram, frameworkOstromVsPd, 12, "Ostrom Principles vs PD"),
  mg(KineticTypography, kineticCooperationDesigned, 5, "Cooperation Is Designed"),
  vid("aigen-13-ocean-vastness.mp4", "AI-GEN: Ocean Vastness"),

  // ── Beat 5: YOUR GAME ──────────────────────────────────────────────────
  mg(TitleTransition, titleSectionBeat5, 2, "Beat 5 Title"),
  vid("aigen-14-city-street.mp4", "AI-GEN: City Street"),
  mg(FrameworkDiagram, frameworkMotifBeat5, 8, "Motif: Synchronized Defection"),
  mg(FrameworkDiagram, frameworkMotifFinal, 10, "MOTIF FINAL: Second Dots Appear"),
  vid("aigen-15-horizon-landmasses.mp4", "AI-GEN: Horizon Landmasses"),
  mg(FrameworkDiagram, frameworkFalsification, 12, "What Would Change My Mind"),
  mg(ProbabilityGauge, forecastPdCooperation, 14, "Forecast: 30% AI Communiqué"),
  mg(KineticTypography, kineticWatchSignals, 7, "Watch Signals"),
  vid("aigen-16-lecture-hall.mp4", "AI-GEN: Lecture Hall"),
  arch("ARCHIVAL: Reagan-Gorbachev", 6),
  mg(KineticTypography, kineticEvidenceEstablishes, 10, "Evidence Establishes / Can't Establish"),
  vid("aigen-17-panorama-cityscapes.mp4", "AI-GEN: Panorama Cityscapes"),
  mg(GameBoard, gameboardFinalChoice, 5, "Final Choice: Two Dots"),
  mg(TitleTransition, titleEndCard, 4, "End Card"),
];

const TOTAL_DURATION_SEC = clips.reduce((sum, c) => sum + c.durationSec, 0);

// ── Showcase component ──────────────────────────────────────────────────────

export const PrisonersDilemmaShowcase: React.FC = () => {
  return (
    <Series>
      {clips.map((clip, i) => {
        const name = `${String(i + 1).padStart(2, "0")} — ${clip.label}`;
        return (
          <Series.Sequence
            key={i}
            durationInFrames={sec(clip.durationSec)}
            name={name}
          >
            {clip.type === "template" ? (
              <clip.component data={clip.data as any} />
            ) : clip.type === "video" ? (
              <AiGenClip src={clip.file} label={clip.label} />
            ) : (
              <ArchivalPlaceholder label={clip.label} />
            )}
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

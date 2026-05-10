/**
 * PrisonersDilemmaShowcase — Preview composition for the full visual layer.
 *
 * Renders all 41 Remotion data files + 13 AI-generated Hailuo single-shot clips
 * + 5 Pika 2.5 morph clips (across 2 [SCENE:] blocks) in script order, so you
 * can scrub through the entire visual layer in Remotion Studio or render to MP4.
 *
 * Total segments updated for script v5.6 (May 9, 2026):
 *   - Beat 3 opening: 2 single-shot AI-GEN cells replaced by 3 morph clips
 *     ([SCENE: wrong-game-establish], 4 frames over ~24s).
 *   - Beat 4 close: aigen-12 + aigen-13 single-shot cells replaced by 2 morph
 *     clips ([SCENE: cooperation-arc], 3 frames over ~18s, with the alpine →
 *     ocean hero morph). KT "Cooperation is designed" extended from 5s to 8s.
 *
 * The 13 remaining single-shot Hailuo clips (Beats 1, 2, 3-mid, 4-opening,
 * 5) are unchanged from v5.4. See `episodes/prisoners-dilemma/scenes/` for the
 * scene-block specs and `project/CHAINED_STILL_LESSONS.md` for the discipline
 * rules behind the chained-still-morph workflow.
 *
 * Archival stills (Nash portrait, RAND HQ, Reagan-Gorbachev) are placeholders
 * until sourced.
 *
 * NOT the final episode composition (that requires an assembly manifest with
 * narration timing) — this is a preview/review tool. The production composition
 * is `PrisonersDilemmaFull.tsx`.
 *
 * SETUP: Copy AI-gen clips into public/episodes/prisoners-dilemma/clips/
 *   cp episodes/prisoners-dilemma/assets/clips/*.mp4 \
 *      remotion-templates/public/episodes/prisoners-dilemma/clips/
 *
 * The 5 morph clips (canonical filenames below) need to be generated and placed
 * in the same directory before this composition will render cleanly. Until then,
 * Remotion Studio will show "missing asset" warnings for those 5 segments.
 *
 *   aigen-wrong-game-establish-AB.mp4   (Beat 3, 8s, Pika 2.5)
 *   aigen-wrong-game-establish-BC.mp4   (Beat 3, 8s, Pika 2.5)
 *   aigen-wrong-game-establish-CD.mp4   (Beat 3, 8s, Pika 2.5)
 *   aigen-cooperation-arc-AB.mp4        (Beat 4, 8s, Pika 2.5 — terraces → alpine)
 *   aigen-cooperation-arc-BC.mp4        (Beat 4, 10s, Pika 2.5 — alpine → ocean HERO)
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
import { AiGenClip } from "../../components/AiGenClip";

// ── Helpers ─────────────────────────────────────────────────────────────────

const CLIP_DIR = "episodes/prisoners-dilemma/clips";

const CLIP_NATIVE_SEC = 6; // Hailuo free tier: all clips are 6s

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
  playbackRate: number;
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

/** Stretch a 6s Hailuo clip to fill targetSec by slowing playback */
const vid = (filename: string, label: string, targetSec = 8): VideoClip => ({
  type: "video",
  file: `${CLIP_DIR}/${filename}`,
  durationSec: targetSec,
  playbackRate: CLIP_NATIVE_SEC / targetSec,
  label,
});

/**
 * Play a Pika 2.5 morph clip at native rate (no stretching). Pika 2.5 morphs
 * inside a [SCENE:] block are generated at their target duration (8s or 10s),
 * so playbackRate is 1.0 — passing the native length as durationSec.
 */
const vidNative = (filename: string, label: string, durationSec: number): VideoClip => ({
  type: "video",
  file: `${CLIP_DIR}/${filename}`,
  durationSec,
  playbackRate: 1.0,
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
  // [SCENE: wrong-game-establish] — 4 frames over ~24s, hard cuts between morphs.
  // Replaces v5.4's 2 single-shot AI-GEN cells (grid landscape + negotiation room).
  // Validated by the May 9 prisoners-dilemma Scene C bakeoff. See scenes/wrong-game-establish.md.
  vidNative("aigen-wrong-game-establish-AB.mp4", "[SCENE wrong-game] A→B grid tightens", 8),
  vidNative("aigen-wrong-game-establish-BC.mp4", "[SCENE wrong-game] B→C table forms (smoke-fixed)", 8),
  vidNative("aigen-wrong-game-establish-CD.mp4", "[SCENE wrong-game] C→D figures arrive", 8),
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
  // aigen-12 terraced no longer plays standalone — its content migrates into the
  // [SCENE: cooperation-arc] block at end of beat as Frame A (per script v5.6).
  mg(ChoroplethMapPlaceholder, choroplethOstrom, 14, "Ostrom 800+ Cases (WebGL)"),
  mg(FrameworkDiagram, frameworkOstromVsPd, 12, "Ostrom Principles vs PD"),
  // Extended from 5s → 8s in v5.6 to land the thesis line under longer narration
  // before the [SCENE:] block opens.
  mg(KineticTypography, kineticCooperationDesigned, 8, "Cooperation Is Designed"),
  // [SCENE: cooperation-arc] — 3 frames over ~18s of morph runtime (terraced →
  // alpine commons → ocean), hard cuts between clips. The B→C alpine→ocean morph
  // is the HERO shot of the redesign — visualizes the "boundedness vanishing"
  // beat of the Ostrom caveat. Replaces v5.4's standalone aigen-12 + aigen-13.
  // See scenes/cooperation-arc.md.
  vidNative("aigen-cooperation-arc-AB.mp4", "[SCENE cooperation] A→B terraces → alpine", 8),
  vidNative("aigen-cooperation-arc-BC.mp4", "[SCENE cooperation] B→C alpine → ocean (HERO)", 10),

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
              <AiGenClip src={staticFile(clip.file)} playbackRate={clip.playbackRate} />
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

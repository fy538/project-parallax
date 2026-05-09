/**
 * prisoners-dilemma-data — single import surface for prisoners-dilemma data files.
 *
 * PrisonersDilemmaFull.tsx (manifest-driven full episode) uses TEMPLATE_DATA
 * to pass all 41 JSON files to FullEpisode as a filename-keyed map.
 *
 * To add a data file: add the import below + an entry in TEMPLATE_DATA.
 */

// Titles
import titleEpisode from "../../../data/episodes/prisoners-dilemma/title-episode.json";
import titleSectionBeat2 from "../../../data/episodes/prisoners-dilemma/title-section-beat2.json";
import titleSectionBeat3 from "../../../data/episodes/prisoners-dilemma/title-section-beat3.json";
import titleSectionBeat4 from "../../../data/episodes/prisoners-dilemma/title-section-beat4.json";
import titleSectionBeat5 from "../../../data/episodes/prisoners-dilemma/title-section-beat5.json";
import titleEndCard from "../../../data/episodes/prisoners-dilemma/title-end-card.json";

// Beat 1 — The Failed Experiment
import frameworkStandardFrame from "../../../data/episodes/prisoners-dilemma/framework-standard-frame.json";
import kineticCantExplain from "../../../data/episodes/prisoners-dilemma/kinetic-cant-explain.json";
import kineticEveryNegotiation from "../../../data/episodes/prisoners-dilemma/kinetic-every-negotiation.json";
import gameboardFloodDresher from "../../../data/episodes/prisoners-dilemma/gameboard-flood-dresher.json";
import kineticNashQuote from "../../../data/episodes/prisoners-dilemma/kinetic-nash-quote.json";
import kineticModelConquers from "../../../data/episodes/prisoners-dilemma/kinetic-model-conquers.json";
import gameboardMotifBeat1 from "../../../data/episodes/prisoners-dilemma/gameboard-motif-beat1.json";

// Beat 2 — How a Failed Model Conquered the World
import chartDiffusion from "../../../data/episodes/prisoners-dilemma/chart-diffusion.json";
import gameboardNuclear from "../../../data/episodes/prisoners-dilemma/gameboard-nuclear.json";
import frameworkNarrowing from "../../../data/episodes/prisoners-dilemma/framework-narrowing.json";
import kinetic2000Articles from "../../../data/episodes/prisoners-dilemma/kinetic-2000-articles.json";
import kineticSomethingWorking from "../../../data/episodes/prisoners-dilemma/kinetic-something-working.json";
import kineticCheckpointBeat2 from "../../../data/episodes/prisoners-dilemma/kinetic-checkpoint-beat2.json";

// Beat 3 — The Wrong Game
import gameboardTrapMechanism from "../../../data/episodes/prisoners-dilemma/gameboard-trap-mechanism.json";
import kineticPredictionBelieved from "../../../data/episodes/prisoners-dilemma/kinetic-prediction-believed.json";
import kineticWrongGameTitle from "../../../data/episodes/prisoners-dilemma/kinetic-wrong-game-title.json";
import chartVolSmile from "../../../data/episodes/prisoners-dilemma/chart-vol-smile.json";
import frameworkMotifBeat3 from "../../../data/episodes/prisoners-dilemma/framework-motif-beat3.json";
import frameworkCycleVsQuestion from "../../../data/episodes/prisoners-dilemma/framework-cycle-vs-question.json";
import kineticWrongGameReal from "../../../data/episodes/prisoners-dilemma/kinetic-wrong-game-real.json";
import kineticCheckpointBeat3 from "../../../data/episodes/prisoners-dilemma/kinetic-checkpoint-beat3.json";

// Beat 4 — There Was Always Another Game
import gameboardStaghunt from "../../../data/episodes/prisoners-dilemma/gameboard-staghunt.json";
import splitPdVsStaghunt from "../../../data/episodes/prisoners-dilemma/split-pd-vs-staghunt.json";
import kineticIteratedEquiv from "../../../data/episodes/prisoners-dilemma/kinetic-iterated-equiv.json";
import frameworkReframe from "../../../data/episodes/prisoners-dilemma/framework-reframe.json";
import choroplethOstrom from "../../../data/episodes/prisoners-dilemma/choropleth-ostrom.json";
import frameworkOstromVsPd from "../../../data/episodes/prisoners-dilemma/framework-ostrom-vs-pd.json";
import kineticCooperationDesigned from "../../../data/episodes/prisoners-dilemma/kinetic-cooperation-designed.json";

// Beat 5 — Your Game
import frameworkMotifBeat5 from "../../../data/episodes/prisoners-dilemma/framework-motif-beat5.json";
import frameworkMotifFinal from "../../../data/episodes/prisoners-dilemma/framework-motif-final.json";
import frameworkFalsification from "../../../data/episodes/prisoners-dilemma/framework-falsification.json";
import forecastPdCooperation from "../../../data/episodes/prisoners-dilemma/forecast-pd-cooperation.json";
import kineticWatchSignals from "../../../data/episodes/prisoners-dilemma/kinetic-watch-signals.json";
import kineticEvidenceEstablishes from "../../../data/episodes/prisoners-dilemma/kinetic-evidence-establishes.json";
import gameboardFinalChoice from "../../../data/episodes/prisoners-dilemma/gameboard-final-choice.json";

/**
 * Filename-keyed map consumed by FullEpisode's templateData prop.
 * Keys must exactly match the dataFile values in assembly-manifest.json.
 */
export const TEMPLATE_DATA: Record<string, unknown> = {
  "title-episode.json": titleEpisode,
  "title-section-beat2.json": titleSectionBeat2,
  "title-section-beat3.json": titleSectionBeat3,
  "title-section-beat4.json": titleSectionBeat4,
  "title-section-beat5.json": titleSectionBeat5,
  "title-end-card.json": titleEndCard,

  "framework-standard-frame.json": frameworkStandardFrame,
  "kinetic-cant-explain.json": kineticCantExplain,
  "kinetic-every-negotiation.json": kineticEveryNegotiation,
  "gameboard-flood-dresher.json": gameboardFloodDresher,
  "kinetic-nash-quote.json": kineticNashQuote,
  "kinetic-model-conquers.json": kineticModelConquers,
  "gameboard-motif-beat1.json": gameboardMotifBeat1,

  "chart-diffusion.json": chartDiffusion,
  "gameboard-nuclear.json": gameboardNuclear,
  "framework-narrowing.json": frameworkNarrowing,
  "kinetic-2000-articles.json": kinetic2000Articles,
  "kinetic-something-working.json": kineticSomethingWorking,
  "kinetic-checkpoint-beat2.json": kineticCheckpointBeat2,

  "gameboard-trap-mechanism.json": gameboardTrapMechanism,
  "kinetic-prediction-believed.json": kineticPredictionBelieved,
  "kinetic-wrong-game-title.json": kineticWrongGameTitle,
  "chart-vol-smile.json": chartVolSmile,
  "framework-motif-beat3.json": frameworkMotifBeat3,
  "framework-cycle-vs-question.json": frameworkCycleVsQuestion,
  "kinetic-wrong-game-real.json": kineticWrongGameReal,
  "kinetic-checkpoint-beat3.json": kineticCheckpointBeat3,

  "gameboard-staghunt.json": gameboardStaghunt,
  "split-pd-vs-staghunt.json": splitPdVsStaghunt,
  "kinetic-iterated-equiv.json": kineticIteratedEquiv,
  "framework-reframe.json": frameworkReframe,
  "choropleth-ostrom.json": choroplethOstrom,
  "framework-ostrom-vs-pd.json": frameworkOstromVsPd,
  "kinetic-cooperation-designed.json": kineticCooperationDesigned,

  "framework-motif-beat5.json": frameworkMotifBeat5,
  "framework-motif-final.json": frameworkMotifFinal,
  "framework-falsification.json": frameworkFalsification,
  "forecast-pd-cooperation.json": forecastPdCooperation,
  "kinetic-watch-signals.json": kineticWatchSignals,
  "kinetic-evidence-establishes.json": kineticEvidenceEstablishes,
  "gameboard-final-choice.json": gameboardFinalChoice,
};

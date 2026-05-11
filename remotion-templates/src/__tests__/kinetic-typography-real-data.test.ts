/**
 * KineticTypography Real-Data QA — targeted render review for active episode shots.
 *
 * KineticTypography is the highest-surface template in both launch episodes:
 * 8 shots in silicon-trap, 12 in prisoners-dilemma. This suite renders
 * representative quote and statistic variants using real episode JSON files
 * to catch the failure modes that matter most in review:
 *   - text overflow (long attribution lines, dense stat context)
 *   - centering drift (variant switching changes layout anchor)
 *   - animation timing at mid-render vs settled state
 *
 * Pattern mirrors chart-real-data.test.ts: render frame → compare against
 * baseline PNG. Baselines are created on first run and must be committed.
 * To regenerate a baseline: delete the PNG and re-run.
 *
 * CASES — see `KINETIC_CASES` for the authoritative list:
 *   - silicon-trap: all manifest kinetic `dataFile`s (quotes, stats, definitions).
 *   - prisoners-dilemma: **manifest-complete** — every kinetic `dataFile` in PD
 *     assembly-manifest (quotes/stats/title kinetic; dark + mixed layouts).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  comparePNGs,
  initBundler,
  renderCompositionFrame,
  saveBaseline,
} from "./render-helper";
import { closeBrowser, ensureBaselineDir, initBrowser, regenBaselinesIfRequested } from "./setup";
import type { KineticTypographyData } from "../templates/KineticTypography/types";

import kineticTrap          from "../../data/episodes/silicon-trap/kinetic-trap.json";
import kineticMorrisChang   from "../../data/episodes/silicon-trap/kinetic-morris-chang.json";
import kinetic165B          from "../../data/episodes/silicon-trap/kinetic-165b.json";
import kinetic92Yield       from "../../data/episodes/silicon-trap/kinetic-92-yield.json";
import kineticDeepseekZero  from "../../data/episodes/silicon-trap/kinetic-deepseek-zero.json";
import kineticRevenueDeal   from "../../data/episodes/silicon-trap/kinetic-revenue-deal.json";
import kineticJuguo         from "../../data/episodes/silicon-trap/kinetic-juguo.json";
import kineticKabozi        from "../../data/episodes/silicon-trap/kinetic-kabozi.json";
import kineticNashQuote     from "../../data/episodes/prisoners-dilemma/kinetic-nash-quote.json";
import kinetic2000Articles  from "../../data/episodes/prisoners-dilemma/kinetic-2000-articles.json";
import kineticWrongGame     from "../../data/episodes/prisoners-dilemma/kinetic-wrong-game-real.json";
import kineticCantExplain           from "../../data/episodes/prisoners-dilemma/kinetic-cant-explain.json";
import kineticCheckpointBeat2       from "../../data/episodes/prisoners-dilemma/kinetic-checkpoint-beat2.json";
import kineticCheckpointBeat3       from "../../data/episodes/prisoners-dilemma/kinetic-checkpoint-beat3.json";
import kineticCooperationDesigned   from "../../data/episodes/prisoners-dilemma/kinetic-cooperation-designed.json";
import kineticEveryNegotiation      from "../../data/episodes/prisoners-dilemma/kinetic-every-negotiation.json";
import kineticEvidenceEstablishes   from "../../data/episodes/prisoners-dilemma/kinetic-evidence-establishes.json";
import kineticIteratedEquiv         from "../../data/episodes/prisoners-dilemma/kinetic-iterated-equiv.json";
import kineticModelConquers         from "../../data/episodes/prisoners-dilemma/kinetic-model-conquers.json";
import kineticPredictionBelieved    from "../../data/episodes/prisoners-dilemma/kinetic-prediction-believed.json";
import kineticSomethingWorking      from "../../data/episodes/prisoners-dilemma/kinetic-something-working.json";
import kineticWatchSignals          from "../../data/episodes/prisoners-dilemma/kinetic-watch-signals.json";
import kineticWrongGameTitle        from "../../data/episodes/prisoners-dilemma/kinetic-wrong-game-title.json";

const TEST_TIMEOUT = 60000;
const KINETIC_REVIEW_FRAMES = [30, 60];
const BASELINE_DIR = path.resolve(__dirname, "baselines", "kinetic-review");
const TEMP_DIR     = path.resolve(__dirname, ".temp-renders", "kinetic-review");

interface KineticCase {
  reviewId: string;
  inputProps: { data: KineticTypographyData };
  why: string;
}

const KINETIC_CASES: KineticCase[] = [
  {
    reviewId: "silicon-trap-kinetic-trap",
    inputProps: { data: kineticTrap as KineticTypographyData },
    why: "short quote, dark bg — simplest live shot (baseline reference)",
  },
  {
    reviewId: "silicon-trap-kinetic-morris-chang",
    inputProps: { data: kineticMorrisChang as KineticTypographyData },
    why: "long attribution quote — text overflow and wrapping pressure",
  },
  {
    reviewId: "silicon-trap-kinetic-165b",
    inputProps: { data: kinetic165B as KineticTypographyData },
    why: "statistic variant, light bg, $ prefix — layout anchor switch from quote",
  },
  {
    reviewId: "silicon-trap-kinetic-92-yield",
    inputProps: { data: kinetic92Yield as KineticTypographyData },
    why: "statistic, light bg — yield % (manifest)",
  },
  {
    reviewId: "silicon-trap-kinetic-deepseek-zero",
    inputProps: { data: kineticDeepseekZero as KineticTypographyData },
    why: "statistic, dark bg — zero-cost framing (manifest)",
  },
  {
    reviewId: "silicon-trap-kinetic-revenue-deal",
    inputProps: { data: kineticRevenueDeal as KineticTypographyData },
    why: "statistic, dark bg — revenue share (manifest)",
  },
  {
    reviewId: "silicon-trap-kinetic-juguo",
    inputProps: { data: kineticJuguo as KineticTypographyData },
    why: "definition variant, dark bg — 举国 (manifest)",
  },
  {
    reviewId: "silicon-trap-kinetic-kabozi",
    inputProps: { data: kineticKabozi as KineticTypographyData },
    why: "definition variant, dark bg — 卡脖子 (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-nash-quote",
    inputProps: { data: kineticNashQuote as KineticTypographyData },
    why: "full attribution + source line — maximum density for quote variant",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-2000-articles",
    inputProps: { data: kinetic2000Articles as KineticTypographyData },
    why: "statistic with long multi-word context across economics and biology",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-wrong-game",
    inputProps: { data: kineticWrongGame as KineticTypographyData },
    why: "short quote, no attribution — tests centered layout without attribution row",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-cant-explain",
    inputProps: { data: kineticCantExplain as KineticTypographyData },
    why: "quote, dark bg — explanatory beat (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-checkpoint-beat2",
    inputProps: { data: kineticCheckpointBeat2 as KineticTypographyData },
    why: "quote, dark bg — checkpoint beat 2 (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-checkpoint-beat3",
    inputProps: { data: kineticCheckpointBeat3 as KineticTypographyData },
    why: "quote, dark bg — checkpoint beat 3 (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-cooperation-designed",
    inputProps: { data: kineticCooperationDesigned as KineticTypographyData },
    why: "quote, dark bg — cooperation designed (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-every-negotiation",
    inputProps: { data: kineticEveryNegotiation as KineticTypographyData },
    why: "quote, dark bg — negotiation framing (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-evidence-establishes",
    inputProps: { data: kineticEvidenceEstablishes as KineticTypographyData },
    why: "quote, dark bg — evidence establishes (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-iterated-equiv",
    inputProps: { data: kineticIteratedEquiv as KineticTypographyData },
    why: "quote, dark bg — iterated game equivalence (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-model-conquers",
    inputProps: { data: kineticModelConquers as KineticTypographyData },
    why: "quote, dark bg — model conquers intuition (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-prediction-believed",
    inputProps: { data: kineticPredictionBelieved as KineticTypographyData },
    why: "quote, dark bg — prediction believed (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-something-working",
    inputProps: { data: kineticSomethingWorking as KineticTypographyData },
    why: "quote, dark bg — something working beat (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-watch-signals",
    inputProps: { data: kineticWatchSignals as KineticTypographyData },
    why: "quote, dark bg — watch signals (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-kinetic-wrong-game-title",
    inputProps: { data: kineticWrongGameTitle as KineticTypographyData },
    why: "title kinetic / wrong-game section header (manifest)",
  },
];

describe("KineticTypography Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== KineticTypography Real-Data QA ===\n");
    await initBrowser();
    await initBundler();
    regenBaselinesIfRequested(BASELINE_DIR, { kind: "subdir" });
    ensureBaselineDir(BASELINE_DIR);
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await closeBrowser();
  }, TEST_TIMEOUT);

  KINETIC_CASES.forEach((kineticCase) => {
    KINETIC_REVIEW_FRAMES.forEach((frame) => {
      it(
        `${kineticCase.reviewId}: frame ${frame} matches baseline (${kineticCase.why})`,
        async () => {
          const fileName    = `${kineticCase.reviewId}-frame-${frame}.png`;
          const currentFile = path.join(TEMP_DIR, fileName);
          const baselineFile = path.join(BASELINE_DIR, fileName);

          await renderCompositionFrame(
            "KineticTypography",
            frame,
            currentFile,
            kineticCase.inputProps
          );

          expect(fs.existsSync(currentFile)).toBe(true);
          expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

          if (!fs.existsSync(baselineFile)) {
            console.log(
              `[Baseline] Creating kinetic baseline for ${kineticCase.reviewId} f${frame}...`
            );
            saveBaseline(currentFile, baselineFile);
            return;
          }

          const result = comparePNGs(baselineFile, currentFile);
          if (!result.match) {
            console.warn(
              `[Kinetic QA] ${kineticCase.reviewId} f${frame}: visual regression ` +
              `(${result.diffPixels}/${result.totalPixels} px differ, ` +
              `${result.diffPct.toFixed(3)}% > 0.5%). Diff: ${result.diffPath ?? "(not written)"}`
            );
          }
          expect(result.match).toBe(true);
        },
        TEST_TIMEOUT
      );
    });
  });
});

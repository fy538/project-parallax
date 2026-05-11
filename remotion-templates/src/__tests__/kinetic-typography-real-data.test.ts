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
 * CASES:
 *   1. silicon-trap/kinetic-trap         — short quote, dark bg (simplest live shot)
 *   2. silicon-trap/kinetic-morris-chang — long attribution quote, dark bg (text overflow risk)
 *   3. silicon-trap/kinetic-165b         — statistic with $ prefix + context, light bg
 *   4. prisoners-dilemma/kinetic-nash-quote — long quote with full attribution + source
 *   5. prisoners-dilemma/kinetic-2000-articles — statistic with long context, dark bg
 *   6. prisoners-dilemma/kinetic-wrong-game-real — short quote, no attribution (stress: centered layout)
 *   7–9. silicon-trap/kinetic-92-yield, deepseek-zero, revenue-deal — statistic / yield (manifest)
 *   10–11. silicon-trap/kinetic-juguo, kinetic-kabozi — definition variant (manifest)
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
import { closeBrowser, ensureBaselineDir, initBrowser } from "./setup";
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
];

describe("KineticTypography Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== KineticTypography Real-Data QA ===\n");
    await initBrowser();
    await initBundler();
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

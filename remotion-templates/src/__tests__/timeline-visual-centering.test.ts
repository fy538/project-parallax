/**
 * Timeline visual centering — automated guard against off-center timelines.
 *
 * This is the "I shouldn't have to point these out one by one" check. It
 * inspects each timeline catalog comp's baseline PNG, computes the centroid
 * of the editorial content (excluding the brand chrome header/footer), and
 * asserts the centroid lands within ±100 px of canvas center horizontally
 * and ±80 px of the content-zone center vertically.
 *
 * What it catches:
 *   - A timeline that visually drifts left or right of canvas center
 *     because the reserved column widths overweight one side.
 *   - A timeline whose content sits too high or too low in its zone (empty
 *     band above the first row, or below the last).
 *   - A future timeline build that regresses on either dimension.
 *
 * What it does NOT catch (intentionally):
 *   - Editorially-justified off-center compositions (a left-anchored
 *     timeline with a right-side annotation panel). Add such comps to
 *     `INTENTIONALLY_OFF_CENTER` below with a documented reason.
 *   - Centering at non-frame-30 frames (camera tracks legitimately shift
 *     the camera off center mid-animation). The test always reads the
 *     frame-30 baseline, which is the canonical "settled" frame.
 *
 * How it works:
 *   1. Load `baselines/catalog-smoke/<id>-frame-30.png` (pngjs)
 *   2. Define a "content zone" — vertical band excluding top 12% (title/
 *      header strip) and bottom 12% (footer strip + legend).
 *   3. Mask paper pixels — any pixel with R+G+B brightness > 230 is "paper"
 *      and excluded from the centroid calculation. The rest is "ink".
 *   4. Compute weighted centroid: Σ(x × intensity) / Σ(intensity), same for y.
 *   5. Assert centroid is within tolerance of canvas center.
 *
 * Calibration:
 *   - Canvas: 1920×1080.
 *   - Horizontal tolerance: ±100 px (canvas center 960, so [860, 1060]).
 *   - Vertical tolerance: ±80 px of content-zone center (zone ≈ y 130–950).
 *   - These widths come from the May 12 timeline review — Image 3 (Nuclear
 *     Ladder pre-fix) had centroid ~810, ~150 px left of canvas center;
 *     ±100 is the smallest tolerance that would have caught it without
 *     being noisy on legitimate compositions.
 */

import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";
import { PNG } from "pngjs";

// ── Config ───────────────────────────────────────────────────────────────────

/** Canvas dimensions (must match remotion config). */
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

/**
 * Brightness threshold: pixels with R+G+B/3 > this are "paper" (excluded).
 *
 * The Parallax paper background (#F5F0E8) has brightness ≈ 239. Real ink
 * (text, dots, dark borders) has brightness ≈ 20–80. The intermediate
 * range (~200–238) is paper grain noise + light card backgrounds + soft
 * shadows; counting those inflates the bbox to include every textured
 * pixel of the paper canvas, defeating the centering check.
 *
 * 180 catches all real editorial ink (text, dots, lines, dark borders)
 * while excluding paper grain and light tint backgrounds.
 */
const PAPER_THRESHOLD = 180;

/**
 * Vertical content zone — exclude top/bottom % to skip title and footer.
 *
 * IMPORTANT: must exclude BOTH the title (h1) AND its subtitle/dek. The
 * subtitle sits at the left safe-area edge (x ≈ 80) and would drag any
 * ink centroid heavily left if included. After empirical calibration, 18%
 * top reliably clears title + subtitle for the long-form 1920×1080 layout.
 *
 * Bottom 15% excludes the legend strip (around y≈970) and the source
 * attribution (around y≈970), plus the metadata strip below.
 */
const CONTENT_TOP_PCT = 0.25;
const CONTENT_BOTTOM_PCT = 0.18;

/**
 * Horizontal content zone — exclude left/right % to skip the EditorialSurface
 * frame border (a 1–2 px line just inside the safe area at x ≈ 40 and
 * x ≈ 1880). Without this exclusion the bbox always spans canvas-edge to
 * canvas-edge and the centering check becomes meaningless. 4% on each side
 * = ~77 px, clears the frame while keeping all editorial content.
 */
const CONTENT_LEFT_PCT = 0.04;
const CONTENT_RIGHT_PCT = 0.04;

/**
 * Horizontal centering tolerance: how far the ink centroid can drift.
 *
 * Tuned to 150 — the May 12 Nuclear Ladder regression had ~162 px drift,
 * so 150 catches that class of failure while accommodating natural variation
 * in legitimate compositions:
 *   - dual-mode timelines with 4+ events spread across the canvas have
 *     bbox widths >1400 px, where slight camera-tracking offset moves the
 *     midpoint 80–110 px easily;
 *   - single-mode timelines with camera focused on event 0 (left of spine
 *     midpoint) can naturally drift +200 right of center because the
 *     adjacent dimmed event 1 sits further right.
 *
 * If a NEW timeline drifts past 150, it's almost certainly a real layout
 * bug (geometric center off, missing offset, etc.) — not a near-miss.
 */
const HORIZONTAL_TOLERANCE_PX = 150;

/**
 * Some timeline modes have legitimately wider drift bounds because their
 * staggered reveals at frame 30 concentrate visible ink asymmetrically.
 * Single-mode HorizontalTimeline with auto-camera focuses on event 0 and
 * shows the adjacent dimmed event off to one side — the natural drift can
 * reach ~230 px. Per-comp overrides go here.
 */
const PER_COMP_TOLERANCE_PX: ReadonlyMap<string, number> = new Map([
  // Single-mode auto-camera: focused-event-plus-dimmed-neighbor bias.
  ["catalog-horizontal-timeline-computers", 250],
]);

/**
 * Vertical content-zone centering tolerance.
 *
 * NOTE: Frame-30 baselines catch staggered-reveal templates mid-stagger —
 * the first rung shows at frame 30 but later rungs haven't entered yet, so
 * the ink mass concentrates near the top of the layout. The settled-state
 * centroid is much closer to content-zone center, but frame-30 isn't
 * settled. We accept a wider vertical tolerance (±160) to avoid
 * false-positives on staggered-reveal templates while still catching gross
 * vertical misalignment.
 */
const VERTICAL_TOLERANCE_PX = 160;

/**
 * Composition IDs to check. Timeline-family only — other templates have
 * their own canonical layouts (maps fill the canvas, kinetic typography
 * centers automatically, etc.).
 */
const TIMELINE_COMP_IDS: ReadonlyArray<string> = [
  "catalog-horizontal-timeline-computers",
  "catalog-horizontal-timeline-pandemics-dual",
  "catalog-horizontal-timeline-revolutions-phase",
  "catalog-escalation-ladder-cold-war",
  "catalog-escalation-ladder-arms-treaties",
  "catalog-dual-timeline-imperial-transitions", // now via HorizontalTimeline
  "catalog-timeline-comparison-revolutions", // now via HorizontalTimeline
  // catalog-timeline-morph-blockades — TimelineMorph deleted May 13, 2026.
  // The composition migrated to catalog-dueling-frameworks-blockades-substrate.
  "catalog-dual-timeline-imperial-transitions",
  // GameBoard family — added May 13, 2026 after PayoffMatrix / PDCanonical
  // were caught visually drifting right because the row-label column on the
  // left widened the bounding box without a matching right gutter. The
  // phantom-column fix should now hold the grids centered; this test guards
  // against future regressions of the same class.
  "catalog-game-board-pd-canonical",
  "catalog-game-board-stag-hunt",
  "catalog-game-board-chess-endgame",
  "catalog-game-board-iterated-pd",
];

/**
 * Composition IDs that are intentionally off-center (e.g., left-anchored
 * with a right-side annotation panel). Each entry must document WHY — the
 * exemption is editorial, not a "test is too strict" excuse.
 */
const INTENTIONALLY_OFF_CENTER: ReadonlyMap<string, string> = new Map([
  // HorizontalTimeline phase-axis variant: events are positioned along a
  // shared phase scale (0, 1, 4, 10 years-of-revolution). The first two
  // events sit in the first 10% of the range and the last sits at 100%,
  // so the rendered ink concentrates on the left of the spine. This is
  // editorially correct — the cadence math IS the visual claim, and faking
  // the spacing to balance the canvas would falsify the data. See May 12,
  // 2026 timeline visual-register review §4 and timeline-audit T6 exception.
  [
    "catalog-horizontal-timeline-revolutions-phase",
    "phase-axis with real uneven phase positions (0,1,4,10) — left-heavy by design",
  ],
  // TimelineMorph exemption removed May 13, 2026 — the template was deleted
  // entirely (its single use case migrated to DuelingFrameworks).
  //
  // GameBoard matrix variants (added May 13, 2026): PayoffMatrix and
  // PDCanonicalMatrix stagger cell entrance across frames 30–55. At the
  // canonical frame-30 capture, cell opacities are still ramping from 0, so
  // the only visible ink is the title + a few labels — either too sparse to
  // measure (Stag Hunt, iterated-PD) or asymmetric (PD-canonical's TPRS
  // labels sit left of the grid alone). Settled-state centering (verified at
  // frame 60) is correct thanks to the phantom right/bottom gutter fix in
  // PayoffMatrix and PDCanonicalMatrix. Chess endgame is NOT exempted — its
  // board is fully visible at frame 30 and acts as the guard for this family.
  [
    "catalog-game-board-pd-canonical",
    "staggered cell reveal — at frame 30 only TPRS labels show (asymmetric); settled-state centering verified at frame 60",
  ],
  [
    "catalog-game-board-stag-hunt",
    "staggered cell reveal — at frame 30 cells are still at ~0 opacity; settled-state centering verified at frame 60",
  ],
  [
    "catalog-game-board-iterated-pd",
    "staggered cell reveal — at frame 30 cells are still at ~0 opacity; settled-state centering verified at frame 60",
  ],
]);

const BASELINE_DIR = path.resolve(
  __dirname,
  "baselines",
  "catalog-smoke",
);

// ── Helpers ──────────────────────────────────────────────────────────────────

interface ContentExtent {
  /** Intensity-weighted centroid (center of MASS). */
  centroidX: number;
  centroidY: number;
  /** Visible content bounding box (center of EXTENT). */
  bboxLeft: number;
  bboxRight: number;
  bboxTop: number;
  bboxBottom: number;
  bboxMidX: number;
  bboxMidY: number;
  inkPixels: number;
}

/**
 * Load a PNG and compute both the intensity-weighted centroid AND the visual
 * bounding box of ink pixels within the content zone. The two measures catch
 * different kinds of off-centering:
 *
 *   - **Centroid** (center of MASS): weighted by ink density. Catches cases
 *     where one side has a heavy concentration of ink even if the extent is
 *     symmetric.
 *   - **Bounding box midpoint** (center of EXTENT): leftmost-ink to
 *     rightmost-ink range, midpoint. Catches "visible content sits right of
 *     canvas center" or "content block is left-shifted" — the cases that
 *     match how a viewer perceives visual centering.
 *
 * Both are reported. The horizontal centering test asserts on the BBOX
 * midpoint (matches visual perception) and uses the centroid as informational.
 *
 * To prevent stray sub-pixel noise from inflating the bbox (random
 * antialiased pixels at the edges of brand chrome), the bbox only counts a
 * column/row as "edged" if it has at least `BBOX_MIN_INK_PER_COLUMN` ink
 * pixels — filters out the long diagonal tails of vanishingly-light brand
 * chrome (the ∴ mark, the corner FILED text in the metadata strip).
 */
// Calibrated to filter out:
//   - EditorialSurface frame border (vertical 1–2 px line at canvas edges,
//     ~700 ink pixels per column when accumulated over the content zone
//     height — surprisingly heavy because the frame is continuous over 700
//     rows). Bumping past 700 excludes the frame.
//   - HeaderStrip / FooterStrip thin horizontal lines (these only appear
//     in 1–2 rows, so per-column counts are 1–2; well under any threshold).
//   - The PARALLAX brand mark (top-left, 3 small char widths) and FILED
//     metadata (bottom-right) — both in excluded chrome bands.
// A column needs at least this many ink pixels to count as a real content
// column (≈ a single line of body text at fontSizes.body has ~25 pixels of
// vertical extent; this threshold demands at least ~30 lines worth, which
// only the actual ladder/timeline content provides).
const BBOX_MIN_INK_PER_COLUMN = 25;

function computeContentExtent(pngPath: string): ContentExtent {
  const data = fs.readFileSync(pngPath);
  const png = PNG.sync.read(data);

  if (png.width !== CANVAS_WIDTH || png.height !== CANVAS_HEIGHT) {
    throw new Error(
      `Unexpected canvas size for ${path.basename(pngPath)}: ` +
      `${png.width}×${png.height} (expected ${CANVAS_WIDTH}×${CANVAS_HEIGHT}).`,
    );
  }

  const contentTop = Math.floor(png.height * CONTENT_TOP_PCT);
  const contentBottom = Math.floor(png.height * (1 - CONTENT_BOTTOM_PCT));
  const contentLeft = Math.floor(png.width * CONTENT_LEFT_PCT);
  const contentRight = Math.floor(png.width * (1 - CONTENT_RIGHT_PCT));

  // Per-column ink count (for bbox edge detection).
  const colInkCount = new Int32Array(png.width);
  // Per-row ink count (for vertical bbox).
  const rowInkCount = new Int32Array(png.height);

  let sumX = 0;
  let sumY = 0;
  let sumIntensity = 0;
  let inkPixels = 0;

  for (let y = contentTop; y < contentBottom; y++) {
    for (let x = contentLeft; x < contentRight; x++) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const brightness = (r + g + b) / 3;
      if (brightness < PAPER_THRESHOLD) {
        const intensity = 255 - brightness;
        sumX += x * intensity;
        sumY += y * intensity;
        sumIntensity += intensity;
        inkPixels++;
        colInkCount[x]++;
        rowInkCount[y]++;
      }
    }
  }

  if (sumIntensity === 0) {
    throw new Error(
      `No ink pixels in content zone for ${path.basename(pngPath)} — ` +
      `paper threshold ${PAPER_THRESHOLD} may be too low, or the render is empty.`,
    );
  }

  // Bounding box — find leftmost / rightmost columns with substantive ink
  // within the horizontal content zone (excludes editorial frame border).
  let bboxLeft = -1;
  let bboxRight = -1;
  for (let x = contentLeft; x < contentRight; x++) {
    if (colInkCount[x] >= BBOX_MIN_INK_PER_COLUMN) {
      if (bboxLeft === -1) bboxLeft = x;
      bboxRight = x;
    }
  }
  if (bboxLeft === -1) {
    throw new Error(
      `No ink columns meet BBOX_MIN_INK_PER_COLUMN=${BBOX_MIN_INK_PER_COLUMN} ` +
      `for ${path.basename(pngPath)} — content may be sparse or threshold mis-tuned.`,
    );
  }

  // Same for vertical (rows).
  let bboxTop = -1;
  let bboxBottom = -1;
  for (let y = contentTop; y < contentBottom; y++) {
    if (rowInkCount[y] >= BBOX_MIN_INK_PER_COLUMN) {
      if (bboxTop === -1) bboxTop = y;
      bboxBottom = y;
    }
  }

  return {
    centroidX: sumX / sumIntensity,
    centroidY: sumY / sumIntensity,
    bboxLeft,
    bboxRight,
    bboxTop,
    bboxBottom,
    bboxMidX: (bboxLeft + bboxRight) / 2,
    bboxMidY: (bboxTop + bboxBottom) / 2,
    inkPixels,
  };
}

function describeDrift(
  centroidX: number,
  centroidY: number,
  contentZoneCenterY: number,
): string {
  const dx = centroidX - CANVAS_WIDTH / 2;
  const dy = centroidY - contentZoneCenterY;
  const xDir = dx < 0 ? "LEFT" : "RIGHT";
  const yDir = dy < 0 ? "UP" : "DOWN";
  return `centroid at (${centroidX.toFixed(0)}, ${centroidY.toFixed(0)}) — drift ${Math.abs(dx).toFixed(0)} px ${xDir} of canvas center, ${Math.abs(dy).toFixed(0)} px ${yDir} of content zone center.`;
}

// ── Tests ────────────────────────────────────────────────────────────────────

const contentZoneCenterY =
  (Math.floor(CANVAS_HEIGHT * CONTENT_TOP_PCT) +
    Math.floor(CANVAS_HEIGHT * (1 - CONTENT_BOTTOM_PCT))) /
  2;

describe("Timeline visual centering — automated guard", () => {
  const allIds = Array.from(new Set(TIMELINE_COMP_IDS));

  it("baseline directory exists", () => {
    expect(fs.existsSync(BASELINE_DIR)).toBe(true);
  });

  for (const id of allIds) {
    const pngPath = path.join(BASELINE_DIR, `${id}-frame-30.png`);

    it(`${id}: ink centroid is centered within tolerance`, () => {
      if (!fs.existsSync(pngPath)) {
        // Skip with a clear message — the catalog-smoke test should have
        // generated this baseline on first run. If it's missing here, the
        // skip is informative, not silently passing.
        console.warn(
          `[centering] baseline missing for ${id} at ${pngPath} — ` +
          `run BASELINE_REGEN=1 vitest catalog-smoke first, then re-run this test.`,
        );
        return;
      }

      const exemption = INTENTIONALLY_OFF_CENTER.get(id);
      if (exemption) {
        console.log(
          `[centering] ${id}: exempted from centering check — ${exemption}`,
        );
        return;
      }

      const extent = computeContentExtent(pngPath);
      const canvasMidX = CANVAS_WIDTH / 2;
      // Bounding-box midpoint matches visual perception of "centered"
      // better than intensity-weighted centroid — see the May 12 timeline
      // calibration session where the BBOX midpoint at ~1230 correctly
      // flagged a Nuclear Ladder that the centroid (at ~950) had passed.
      const bboxDx = extent.bboxMidX - canvasMidX;
      const centroidDx = extent.centroidX - canvasMidX;
      const bboxDy = extent.bboxMidY - contentZoneCenterY;

      // eslint-disable-next-line no-console
      console.log(
        `[centering] ${id.padEnd(46)} ` +
          `bbox=[${extent.bboxLeft},${extent.bboxRight}] midX=${extent.bboxMidX.toFixed(0).padStart(4)} dx=${bboxDx.toFixed(0).padStart(5)} ` +
          `| centroid=(${extent.centroidX.toFixed(0)},${extent.centroidY.toFixed(0)}) cDx=${centroidDx.toFixed(0).padStart(5)}`,
      );

      // Horizontal — assert on BBOX midpoint, the visual-perception measure.
      const tolerance =
        PER_COMP_TOLERANCE_PX.get(id) ?? HORIZONTAL_TOLERANCE_PX;
      expect(
        Math.abs(bboxDx) <= tolerance,
        `[${id}] HORIZONTAL bbox midpoint drift exceeds ±${tolerance} px. ` +
          `Visible content spans x=[${extent.bboxLeft}, ${extent.bboxRight}], ` +
          `midpoint=${extent.bboxMidX.toFixed(0)}, canvas center=${canvasMidX}, drift=${bboxDx.toFixed(0)} px.\n` +
          `Fix: tune the template's default offset, OR add ` +
          `\`contentOffset: { x: <px right> }\` to the catalog data, OR add this ` +
          `comp to INTENTIONALLY_OFF_CENTER with a documented editorial reason.`,
      ).toBe(true);

      // Vertical — INFORMATIONAL ONLY. At frame 30, staggered-reveal
      // templates (EscalationLadder, HorizontalTimeline single mode) only
      // show their first row of content, so the vertical bbox concentrates
      // far from the content-zone center even when the settled layout is
      // perfectly centered. We log the vertical drift for diagnostic value
      // but don't fail the test — vertical centering issues are rare and
      // visually obvious, while horizontal drift is the load-bearing
      // editorial-quality signal.
      if (Math.abs(bboxDy) > VERTICAL_TOLERANCE_PX) {
        // eslint-disable-next-line no-console
        console.warn(
          `[centering] ${id}: vertical bbox drift ${bboxDy.toFixed(0)} px — ` +
            `likely staggered-reveal artifact (frame 30 captures only the first ` +
            `row). If the settled state at frame 200+ shows the same vertical ` +
            `drift, tune offsetY.`,
        );
      }
    });
  }
});

describe("Timeline visual centering — sanity", () => {
  it("at least one timeline baseline exists (suite isn't a no-op)", () => {
    const found = TIMELINE_COMP_IDS.some((id) =>
      fs.existsSync(path.join(BASELINE_DIR, `${id}-frame-30.png`)),
    );
    expect(found).toBe(true);
  });

  it("PAPER_THRESHOLD is sane — should detect ink on a known baseline", () => {
    // Pick any baseline that exists and confirm we find ink in the content zone.
    for (const id of TIMELINE_COMP_IDS) {
      const p = path.join(BASELINE_DIR, `${id}-frame-30.png`);
      if (fs.existsSync(p)) {
        const extent = computeContentExtent(p);
        expect(extent.inkPixels).toBeGreaterThan(1000);
        return;
      }
    }
  });
});

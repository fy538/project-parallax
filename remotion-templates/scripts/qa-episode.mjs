#!/usr/bin/env node
/**
 * qa-episode.mjs — measured polish QA for a manifest-driven episode.
 *
 * Two layers, one report:
 *
 *   1. Episode-level (from the manifest + data files + script; no render):
 *      text-card share, static holds, still reuse, template runs, dark/light
 *      switching, on-screen words vs hold time, on-screen text that repeats
 *      the narration, unresolved placeholders.
 *
 *   2. Frame-level (renders one settled frame per segment in QA mode):
 *      <QaProbe> logs every visible text node (box, effective px, colour,
 *      opacity, role); this script checks safe area, minimum size, overlap,
 *      clipping, and WCAG contrast measured against the rendered pixels.
 *
 * The checks are deterministic. Taste calls (hierarchy, template fit,
 * whether a still beats a card) are left to the reviewer, who reads the
 * report and the contact sheets. Thresholds and sources: QA_RULES below and
 * project/VISUAL_QA.md.
 *
 * Usage:
 *   npm run qa:episode -- --episode=ai-care-motives
 *   npm run qa:episode -- --episode=ai-care-motives --no-render     # episode-level only
 *   npm run qa:episode -- --episode=ai-care-motives --only=beat7-seg38,beat8-seg47
 *
 * Output: out/qa/<slug>/report.md, report.json, frames/*.png, sheet-*.png
 */

import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { PNG } from "pngjs";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REPO = path.join(ROOT, "..");

// ── Rules (numbers + where they come from) ──────────────────────────────────
export const QA_RULES = {
  frame: { w: 1920, h: 1080 },
  // EBU R95 graphics-safe: 5% inset per edge.
  safe: { x0: 96, y0: 54, x1: 1824, y1: 1026 },
  // Phone legibility (house rule; no published standard for 1080p on phones).
  minContentPx: 18, // hard floor for text meant to be read
  warnContentPx: 28, // below this, flag as "small on phone" (was 22; see project/VISUAL_QA.md)
  minSourcePx: 12, // source / attribution lines
  // WCAG 1.4.3 contrast; large = >=24px, or >=18.66px bold.
  contrastNormal: 4.5,
  contrastLarge: 3.0,
  overlapFraction: 0.15, // of the smaller box
  // Clearcast supers: 0.25 s/word + 3 s recognition.
  holdPerWord: 0.25,
  holdBase: 3.0,
  maxStaticTextHoldSec: 15,
  maxTemplateHoldSec: 25,
  maxStillUses: 2,
  redundancyRatio: 0.8,
  redundancyMinTokens: 4,
};

// ── Args ────────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const slug = args.episode;
if (!slug) {
  console.error("usage: qa-episode.mjs --episode=<slug> [--comp=<id>] [--only=a,b] [--no-render] [--floor=<px>] [--tag=<name>] [--at=<sec>]");
  process.exit(1);
}
const compId = args.comp ?? `${slug}-full`;
const only = args.only ? String(args.only).split(",") : null;
const doRender = !args["no-render"];
// --floor=<px>: also list every piece of content text below this size, without
// failing it. Used to size a change to the minimum before making it.
const floorPx = args.floor ? Number(args.floor) : null;
// --at=<sec>: measure each segment this long after it starts instead of at its
// settled frame, e.g. --at=0.07 to see what a cut lands on.
const atSec = args.at !== undefined ? Number(args.at) : null;
const dataDir = path.join(ROOT, "data/episodes", slug);
// --tag=<name> writes to out/qa/<slug>-<name>/ so a side run does not replace the main report.
const outDir = path.join(ROOT, "out/qa", args.tag ? `${slug}-${args.tag}` : slug);
const framesDir = path.join(outDir, "frames");
fs.mkdirSync(framesDir, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, "assembly-manifest.json"), "utf8"));
const segments = [...manifest.segments].sort((a, b) => a.startSec - b.startSec);

// ── Episode-level helpers ───────────────────────────────────────────────────
const TEXT_KEYS = new Set([
  "text", "title", "subtitle", "term", "termTranslation", "definitionText", "caption",
  "label", "consequence", "condition", "stat", "items", "annotation", "definition",
  "description", "heading", "name", "question", "ctaText", "headline", "quote", "note",
  "breakNote", "kicker", "content", "event", "statValue", "statLabel", "tag",
]);
const SOURCE_KEYS = new Set(["source", "attribution", "attributionContext"]);
const STOP = new Set(
  "the and for with that this from what when your you are was were has have had not but its it's into than then them they their there here about which would could should does did can will just also only very more most some such each other".split(
    " ",
  ),
);

function collectText(obj, key = "", out = { main: [], source: [] }) {
  if (obj == null) return out;
  if (typeof obj === "string") {
    if (SOURCE_KEYS.has(key)) out.source.push(obj);
    else if (TEXT_KEYS.has(key)) out.main.push(obj);
    return out;
  }
  if (Array.isArray(obj)) {
    for (const v of obj) collectText(v, key, out);
    return out;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (k === "_direction" || k === "episode") continue;
      collectText(v, k, out);
    }
  }
  return out;
}

const words = (s) => (s.match(/[\p{L}\p{N}%≈.']+/gu) ?? []).filter((w) => /[\p{L}\p{N}]/u.test(w));
const tokens = (s) =>
  words(s.toLowerCase().replace(/[’']/g, ""))
    .map((w) => w.replace(/[^\p{L}\p{N}%]/gu, ""))
    .filter((w) => w.length >= 3 && !STOP.has(w));

// Full narration per segment: match narrationRef (first 80 chars) to the
// two-column script's narration cell.
function loadNarrationCells() {
  const p = path.join(REPO, "episodes", slug, "script.md");
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, "utf8")
    .split("\n")
    .filter((l) => l.startsWith("|"))
    .map((l) => l.split("|")[1]?.replace(/\{[^}]*\}/g, "").trim() ?? "")
    .filter((c) => c.length > 20);
}
const narrationCells = loadNarrationCells();
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function narrationFor(seg) {
  const ref = norm(seg.narrationRef ?? "").slice(0, 40);
  if (!ref) return "";
  const hit = narrationCells.find((c) => norm(c).startsWith(ref));
  return hit ?? seg.narrationRef ?? "";
}

function stillKey(file) {
  const m = /(aigen-\d+)/.exec(file ?? "");
  return m ? m[1] : null;
}

function segmentMode(seg, data) {
  if (seg.type === "FOOTAGE" || seg.type === "IMAGE") {
    return seg.asset?.status === "resolved" ? "image" : "placeholder";
  }
  if (!data) return "unknown";
  return data.backgroundVariant ?? "light";
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// ── Component kinds: what each segment is made of ───────────────────────────
// Two questions per segment: where does the picture come from, and what moves
// it. A local clip's origin is read from where its source sits under
// episodes/<slug>/assets/: clips-i2v/<name>.json (a video-model sidecar) means
// the still was animated by a video model; clips-kenburns/<name>.mp4 means a
// camera move over the still and nothing else.
const assetsDir = path.join(REPO, "episodes", slug, "assets");
const STOCK_SOURCES = new Set(["pexels", "pixabay", "unsplash", "wikimedia", "archive", "openverse"]);
const KIND = {
  aiKenBurns: { group: "AI illustration", label: "Camera move only (Ken Burns)" },
  aiVideo: { group: "AI illustration", label: "Animated by a video model" },
  aiStill: { group: "AI illustration", label: "Static still" },
  aiInCard: { group: "AI illustration", label: "Inside a Remotion layout" },
  typeOverPicture: { group: "AI illustration", label: "Held under Remotion type" },
  stockVideo: { group: "Real-world imagery", label: "Stock footage" },
  photoCard: { group: "Real-world imagery", label: "Photograph or document in a Remotion card" },
  photoQuote: { group: "Real-world imagery", label: "Portrait with typed quotation" },
  mgType: { group: "Motion graphics (Remotion only)", label: "Type card" },
  mgList: { group: "Motion graphics (Remotion only)", label: "List" },
  mgDiagram: { group: "Motion graphics (Remotion only)", label: "Argument or diagram" },
  mgData: { group: "Motion graphics (Remotion only)", label: "Chart or statistic" },
  mgTimeline: { group: "Motion graphics (Remotion only)", label: "Timeline" },
  mgMath: { group: "Motion graphics (Remotion only)", label: "Equation" },
  mgMap: { group: "Motion graphics (Remotion only)", label: "Map" },
  mgOther: { group: "Motion graphics (Remotion only)", label: "Other" },
  footageOther: { group: "Real-world imagery", label: "Other footage" },
  placeholder: { group: "Not made yet", label: "Placeholder" },
};
const MG_FAMILY = {
  KineticTypography: "mgType", TitleTransition: "mgType",
  AxiomList: "mgList",
  Syllogism: "mgDiagram", DialecticFlow: "mgDiagram", ConditionalArgument: "mgDiagram",
  CounterfactualPath: "mgDiagram", AnalogyCrossmap: "mgDiagram", ToulminMap: "mgDiagram",
  FrameworkDiagram: "mgDiagram", NetworkDiagram: "mgDiagram", DecisionTree: "mgDiagram",
  OutcomePartition: "mgDiagram", SankeyFlow: "mgDiagram", GameBoard: "mgDiagram",
  EscalationLadder: "mgDiagram", StrategicLandscape: "mgDiagram", DuelingFrameworks: "mgDiagram",
  CausalLoopDiagram: "mgDiagram", OrgChart: "mgDiagram", SanctionsNetwork: "mgDiagram",
  SplitComposition: "mgDiagram", VennDiagram: "mgDiagram", ChordDiagram: "mgDiagram",
  StatReveal: "mgData", DotPlot: "mgData", DataChart: "mgData", TimeSeriesChart: "mgData",
  KPICard: "mgData", BulletChart: "mgData", Slopegraph: "mgData", StepLine: "mgData",
  BayesianUpdate: "mgData", ProbabilityGauge: "mgData", RadarChart: "mgData",
  PricingWaterfall: "mgData", SmallMultiples: "mgData", DivergingBar: "mgData",
  BubbleMatrix: "mgData", BarChartRace: "mgData", Treemap: "mgData", MatrixHeatmap: "mgData",
  HorizontalTimeline: "mgTimeline", HorizontalTimelineSingle: "mgTimeline",
  SpiralTimeline: "mgTimeline", ConceptEvolutionTimeline: "mgTimeline",
  PhilosophicalFamilyTree: "mgTimeline",
  MathReveal: "mgMath", MathDerivation: "mgMath",
  ChoroplethMap: "mgMap", RouteAnimation: "mgMap", AtlasPlate: "mgMap",
  ProportionalSymbolMap: "mgMap", CartogramMap: "mgMap", DensityMap: "mgMap",
  CinematicMap: "mgMap", TerritoryMap: "mgMap", FlowMap: "mgMap",
};
/** Image files a template's data points at, however deeply nested (panes, base, image). */
function imagePaths(obj, out = []) {
  if (!obj || typeof obj !== "object") return out;
  for (const v of Object.values(obj)) {
    if (typeof v === "string" && /\.(png|jpe?g|webp)$/i.test(v)) out.push(v);
    else if (v && typeof v === "object") imagePaths(v, out);
  }
  return out;
}
function hasQuotes(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (Array.isArray(obj.quotes) && obj.quotes.length > 0) return true;
  return Object.values(obj).some((v) => v && typeof v === "object" && hasQuotes(v));
}
function clipOrigin(file) {
  const base = path.basename(file ?? "", path.extname(file ?? ""));
  if (!base) return null;
  if (fs.existsSync(path.join(assetsDir, "clips-i2v", `${base}.json`))) return "aiVideo";
  if (fs.existsSync(path.join(assetsDir, "clips-kenburns", `${base}.mp4`))) return "aiKenBurns";
  return null;
}
function segmentKind(seg, data) {
  if (seg.type === "FOOTAGE" || seg.type === "IMAGE") {
    const a = seg.asset ?? {};
    if (a.status !== "resolved" || !a.file) return "placeholder";
    if (STOCK_SOURCES.has(a.source) || /^(clips|stills)\/stock-/.test(a.file)) return "stockVideo";
    const origin = clipOrigin(a.file);
    if (origin) return origin;
    if (/aigen-/.test(a.file)) return seg.type === "IMAGE" || !/\.(mp4|mov|webm)$/i.test(a.file) ? "aiStill" : "aiKenBurns";
    return "footageOther";
  }
  if (seg.layered?.backgroundSegmentId) return "typeOverPicture";
  const imgs = imagePaths(data);
  if (imgs.length > 0) {
    if (imgs.some((f) => /aigen-/.test(f))) return "aiInCard";
    return hasQuotes(data) ? "photoQuote" : "photoCard";
  }
  return MG_FAMILY[seg.template?.component] ?? "mgOther";
}
// ── Episode-level analysis ──────────────────────────────────────────────────
const TEXT_TEMPLATES = new Set(["KineticTypography", "TitleTransition"]);
const rows = [];
const episodeIssues = [];
const stillUses = new Map();
let textCardSec = 0;
let templateSec = 0;
const total = manifest.totalDurationSec;

for (const seg of segments) {
  const dur = +(seg.endSec - seg.startSec).toFixed(1);
  const comp = seg.template?.component ?? seg.type;
  const dataFile = seg.template?.dataFile;
  let data = null;
  if (dataFile && fs.existsSync(path.join(dataDir, dataFile))) {
    data = JSON.parse(fs.readFileSync(path.join(dataDir, dataFile), "utf8"));
  }
  const mode = segmentMode(seg, data);
  const kind = segmentKind(seg, data);
  const row = { id: seg.id, start: seg.startSec, dur, comp, dataFile, mode, kind, flags: [] };

  if (seg.type === "TEMPLATE") {
    templateSec += dur;
    if (TEXT_TEMPLATES.has(comp)) textCardSec += dur;
    const txt = collectText(data ?? {});
    const mainText = txt.main.join(" ");
    const nWords = words(mainText).length;
    row.words = nWords;
    const need = QA_RULES.holdBase + QA_RULES.holdPerWord * nWords;
    if (nWords > 0 && dur < need) row.flags.push(`hold ${dur}s < ${need.toFixed(1)}s needed for ${nWords} words`);
    if (TEXT_TEMPLATES.has(comp) && dur > QA_RULES.maxStaticTextHoldSec)
      row.flags.push(`static text card held ${dur}s (>${QA_RULES.maxStaticTextHoldSec}s)`);
    else if (dur > QA_RULES.maxTemplateHoldSec) row.flags.push(`template held ${dur}s (>${QA_RULES.maxTemplateHoldSec}s)`);

    const screen = tokens(mainText);
    const narr = new Set(tokens(narrationFor(seg)));
    if (screen.length >= QA_RULES.redundancyMinTokens && narr.size) {
      const ratio = screen.filter((t) => narr.has(t)).length / screen.length;
      row.redundancy = +ratio.toFixed(2);
      const isQuote = data?._direction?.textAnimation === "quote-attribution" || !!data?.attribution;
      if (ratio >= QA_RULES.redundancyRatio) {
        if (isQuote) row.notes = "repeats narration (quotation: exempt)";
        else if (comp === "TitleTransition") row.notes = "repeats narration (title: exempt)";
        // Labels on diagrams/charts that name what the narrator says are key
        // terms (signaling), not redundancy; only text cards are flagged.
        else if (!TEXT_TEMPLATES.has(comp)) row.notes = `labels echo narration (${Math.round(ratio * 100)}%; key terms, not flagged)`;
        else row.flags.push(`on-screen text repeats narration (${Math.round(ratio * 100)}% of key words)`);
      }
    }
  } else {
    if (mode === "placeholder") row.flags.push("placeholder: asset not sourced");
    const k = stillKey(seg.asset?.file);
    if (k) stillUses.set(k, [...(stillUses.get(k) ?? []), seg.id]);
  }
  rows.push(row);
}

for (const [k, ids] of stillUses) {
  if (ids.length > QA_RULES.maxStillUses)
    episodeIssues.push(`Still ${k} used ${ids.length}× (${ids.join(", ")})`);
}
// Gaps: stretches where no segment is scheduled render as blank paper.
for (let i = 1; i < segments.length; i++) {
  const gap = segments[i].startSec - Math.max(...segments.slice(0, i).map((x) => x.endSec));
  if (gap > 0.05)
    episodeIssues.push(`Nothing on screen for ${gap.toFixed(1)}s before ${segments[i].id} (${fmt(segments[i].startSec)})`);
}
// Template runs
for (let i = 0; i < rows.length; ) {
  let j = i;
  while (j + 1 < rows.length && rows[j + 1].comp === rows[i].comp && rows[i].comp !== "FOOTAGE") j++;
  if (j - i + 1 >= 3) episodeIssues.push(`${j - i + 1} ${rows[i].comp} segments in a row (${rows[i].id} → ${rows[j].id})`);
  i = j + 1;
}
// Dark/light switching between consecutive text/diagram cards
const cardModes = rows.filter((r) => r.mode === "dark" || r.mode === "light");
let switches = 0;
const switchList = [];
for (let i = 1; i < cardModes.length; i++) {
  if (cardModes[i].mode !== cardModes[i - 1].mode) {
    switches++;
    switchList.push(`${cardModes[i - 1].id} (${cardModes[i - 1].mode}) → ${cardModes[i].id} (${cardModes[i].mode})`);
  }
}
const textShare = textCardSec / total;
const placeholders = rows.filter((r) => r.mode === "placeholder");

// ── Frame-level analysis ────────────────────────────────────────────────────
function parseColor(c) {
  const m = /rgba?\(([^)]+)\)/.exec(c ?? "");
  if (!m) return null;
  const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}
const lin = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const dist = (a, b) => (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;

function backgroundBehind(png, item, textRGB) {
  const px = [];
  const x0 = Math.max(0, item.x), y0 = Math.max(0, item.y);
  const x1 = Math.min(png.width, item.x + item.w), y1 = Math.min(png.height, item.y + item.h);
  const step = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / 4000)));
  for (let y = y0; y < y1; y += step)
    for (let x = x0; x < x1; x += step) {
      const i = (png.width * y + x) << 2;
      px.push({ r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] });
    }
  if (!px.length) return null;
  // Background = the 40% of pixels least like the text colour (glyph strokes
  // are the rest); median of those.
  px.sort((a, b) => dist(b, textRGB) - dist(a, textRGB));
  const bg = px.slice(0, Math.max(1, Math.floor(px.length * 0.4)));
  const med = (k) => bg.map((p) => p[k]).sort((a, b) => a - b)[Math.floor(bg.length / 2)];
  return { r: med("r"), g: med("g"), b: med("b") };
}

function checkFrame(rawItems, png) {
  const issues = [];
  // Lone separators / brand glyphs (·, —, ∴) carry no reading load.
  const items = rawItems.filter((it) => /[\p{L}\p{N}]/u.test(it.text));
  const R = QA_RULES;
  const content = items.filter((it) => it.role === "content");
  for (const it of items) {
    const label = `"${it.text.slice(0, 40)}"`;
    // Size
    if (it.role === "content") {
      if (it.fontPx < R.minContentPx) issues.push({ kind: "SIZE", sev: "fail", msg: `${label} ${it.fontPx}px (< ${R.minContentPx}px)` });
      else if (it.fontPx < R.warnContentPx - 0.5) issues.push({ kind: "SIZE", sev: "warn", msg: `${label} ${it.fontPx}px (< ${R.warnContentPx}px, small on phone)` });
    } else if (it.role === "source" && it.fontPx < R.minSourcePx) {
      issues.push({ kind: "SIZE", sev: "warn", msg: `source ${label} ${it.fontPx}px` });
    }
    // Safe area (content + source only; chrome is placed by the brand system)
    if (it.role !== "chrome") {
      const s = R.safe;
      if (it.x < s.x0 - 1 || it.y < s.y0 - 1 || it.x + it.w > s.x1 + 1 || it.y + it.h > s.y1 + 1)
        issues.push({ kind: "SAFE", sev: "warn", msg: `${label} outside graphics-safe area (${it.x},${it.y} ${it.w}×${it.h})` });
    }
    // Clipping
    const off = it.x < 0 || it.y < 0 || it.x + it.w > R.frame.w || it.y + it.h > R.frame.h;
    let clipped = off;
    if (!off && it.clip) {
      const [l, t, r, b] = it.clip;
      clipped = it.x < l - 2 || it.y < t - 2 || it.x + it.w > r + 2 || it.y + it.h > b + 2;
    }
    if (clipped) issues.push({ kind: "CLIP", sev: "fail", msg: `${label} cut off` });
    // Contrast
    const c = parseColor(it.color);
    if (png && c && it.role !== "chrome" && it.h >= 8) {
      const bg = backgroundBehind(png, it, c);
      if (bg) {
        const a = c.a * it.opacity;
        const eff = { r: c.r * a + bg.r * (1 - a), g: c.g * a + bg.g * (1 - a), b: c.b * a + bg.b * (1 - a) };
        const cr = ratio(eff, bg);
        const large = it.fontPx >= 24 || (it.fontPx >= 18.66 && it.weight >= 700);
        const need = large ? R.contrastLarge : R.contrastNormal;
        if (cr < need)
          issues.push({ kind: "CONTRAST", sev: cr < need * 0.66 ? "fail" : "warn", msg: `${label} ${cr.toFixed(1)}:1 (needs ${need}:1)` });
      }
    }
  }
  // Overlap: any two non-math boxes from different text nodes
  const boxes = items.filter((it) => it.role !== "math");
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.node === b.node) continue; // lines of one wrapped run: normal leading
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox <= 0 || oy <= 0) continue;
      const frac = (ox * oy) / Math.min(a.w * a.h, b.w * b.h);
      if (frac > QA_RULES.overlapFraction)
        issues.push({ kind: "OVERLAP", sev: "fail", msg: `"${a.text.slice(0, 30)}" overlaps "${b.text.slice(0, 30)}" (${Math.round(frac * 100)}%)` });
    }
  // Chrome summary (reported once per frame as info)
  const chromeMin = Math.min(...items.filter((it) => it.role === "chrome").map((it) => it.fontPx), Infinity);
  const small = floorPx
    ? content.filter((it) => it.fontPx < floorPx - 0.5).map((it) => ({ text: it.text.slice(0, 60), fontPx: it.fontPx }))
    : undefined;
  return { issues, contentCount: content.length, chromeMinPx: Number.isFinite(chromeMin) ? chromeMin : null, small };
}

// Settled frame: late in the segment, before the exit fade.
const settleSec = (s) => {
  const d = s.endSec - s.startSec;
  return Math.max(s.startSec + Math.min(0.5, d / 2), s.endSec - Math.min(1.5, d * 0.25));
};

const frameResults = {};
if (doRender) {
  console.log("Bundling…");
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts") });
  const inputProps = { qa: true };
  const composition = await selectComposition({ serveUrl, id: compId, inputProps });
  // Frame files are numbered by segment order, which shifts when segments are
  // added or removed. Clear everything on a full run; on a partial run, drop
  // the old file for each segment being re-rendered.
  const staleFor = (id) => fs.readdirSync(framesDir).filter((f) => f.endsWith(`-${id}.png`));
  if (!only) for (const f of fs.readdirSync(framesDir)) if (f.endsWith(".png")) fs.unlinkSync(path.join(framesDir, f));
  let n = 0;
  for (const seg of segments) {
    n++;
    if (only && !only.includes(seg.id)) continue;
    for (const f of staleFor(seg.id)) fs.unlinkSync(path.join(framesDir, f));
    const segRow = rows.find((r) => r.id === seg.id);
    if (segRow?.mode === "placeholder") continue; // nothing real to measure yet
    const frame = Math.min(
      composition.durationInFrames - 1,
      Math.round((atSec !== null ? seg.startSec + atSec : settleSec(seg)) * composition.fps),
    );
    const out = path.join(framesDir, `${String(n).padStart(2, "0")}-${seg.id}.png`);
    let probe = null;
    try {
      await renderStill({
        composition,
        serveUrl,
        inputProps,
        frame,
        output: out,
        timeoutInMilliseconds: 90000,
        logLevel: "error",
        onBrowserLog: (log) => {
          if (log.text.startsWith("QA_PROBE ")) {
            const parsed = JSON.parse(log.text.slice(9));
            if (parsed.frame === frame) probe = parsed;
          }
        },
      });
      const png = PNG.sync.read(fs.readFileSync(out));
      frameResults[seg.id] = probe
        ? { frame, file: path.relative(outDir, out), ...checkFrame(probe.items, png), fontFaces: probe.fontFaces }
        : { frame, file: path.relative(outDir, out), issues: [{ kind: "PROBE", sev: "warn", msg: "no probe output for this frame" }] };
      const f = frameResults[seg.id].issues.filter((i) => i.sev === "fail").length;
      console.log(`${seg.id.padEnd(16)} frame ${frame}  ${f ? `${f} fail` : "ok"}`);
    } catch (e) {
      frameResults[seg.id] = { frame, issues: [{ kind: "RENDER", sev: "fail", msg: String(e.message).slice(0, 200) }] };
      console.log(`${seg.id.padEnd(16)} RENDER FAILED`);
    }
  }
  // Contact sheets (3×4) via ffmpeg, if available
  try {
    const pngs = fs.readdirSync(framesDir).filter((f) => f.endsWith(".png")).sort();
    for (let p = 0; p * 12 < pngs.length; p++) {
      const list = path.join(outDir, `.sheet-${p + 1}.txt`);
      fs.writeFileSync(list, pngs.slice(p * 12, p * 12 + 12).map((f) => `file '${path.join(framesDir, f)}'`).join("\n"));
      execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-r", "1", "-i", list,
        "-vf", "scale=640:-1,tile=3x4", "-frames:v", "1", path.join(outDir, `sheet-${p + 1}.png`)]);
      fs.unlinkSync(list);
    }
  } catch {
    console.log("(ffmpeg not available — contact sheets skipped)");
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
const lines = [];
lines.push(`# Visual QA — ${manifest.title ?? slug}`, "");
lines.push(`Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} by \`scripts/qa-episode.mjs\`. Measured checks only; taste calls are for the reviewer. Rules: \`project/VISUAL_QA.md\`.`, "");
const allFrameIssues = Object.values(frameResults).flatMap((r) => r.issues);
const fails = allFrameIssues.filter((i) => i.sev === "fail").length;
const warns = allFrameIssues.filter((i) => i.sev === "warn").length;
const segFlags = rows.reduce((n, r) => n + r.flags.length, 0);
lines.push("## Summary", "");
lines.push(`- ${segments.length} segments, ${fmt(total)} runtime. Text cards ${Math.round(textShare * 100)}% of runtime; all Remotion templates ${Math.round((templateSec / total) * 100)}%.`);
lines.push(`- Episode-level: ${episodeIssues.length} sequence issue(s), ${segFlags} segment flag(s), ${placeholders.length} placeholder(s), ${switches} dark↔light switch(es) between cards.`);
if (doRender) lines.push(`- Frames: ${Object.keys(frameResults).length} rendered; ${fails} fail, ${warns} warn.`);
lines.push("");
if (episodeIssues.length || switches) {
  lines.push("## Sequence", "");
  for (const i of episodeIssues) lines.push(`- ${i}`);
  if (switches) lines.push(`- Dark↔light card switches: ${switches}`, ...switchList.map((s) => `  - ${s}`));
  lines.push("");
}
// Components: runtime by what each segment is made of.
{
  const pct = (sec) => `${((sec / total) * 100).toFixed(1)}%`;
  const byKind = new Map();
  for (const r of rows) {
    const k = byKind.get(r.kind) ?? { n: 0, sec: 0 };
    k.n++;
    k.sec += r.dur;
    byKind.set(r.kind, k);
  }
  const groups = [...new Set(Object.values(KIND).map((k) => k.group))];
  lines.push("## Components", "");
  lines.push("What each second of the episode is made of. \"AI illustration\" counts every segment whose picture is a generated still, whatever moves it.", "");
  lines.push("| Group | Kind | Segments | Time | Share |", "|---|---|---:|---:|---:|");
  for (const g of groups) {
    const kinds = Object.entries(KIND).filter(([id, k]) => k.group === g && byKind.has(id));
    if (kinds.length === 0) continue;
    const gSec = kinds.reduce((n, [id]) => n + byKind.get(id).sec, 0);
    const gN = kinds.reduce((n, [id]) => n + byKind.get(id).n, 0);
    lines.push(`| **${g}** |  | **${gN}** | **${fmt(gSec)}** | **${pct(gSec)}** |`);
    for (const [id, k] of kinds) {
      const v = byKind.get(id);
      lines.push(`|  | ${k.label} | ${v.n} | ${fmt(v.sec)} | ${pct(v.sec)} |`);
    }
  }
  lines.push("");
  // Who animates the frame.
  const sumOf = (...ids) => ids.reduce((n, id) => n + (byKind.get(id)?.sec ?? 0), 0);
  const remotionSec = rows.filter((r) => segments.find((x) => x.id === r.id).type === "TEMPLATE").reduce((n, r) => n + r.dur, 0);
  lines.push("What moves the picture:", "");
  lines.push(`- A camera move over a still, nothing else: ${fmt(sumOf("aiKenBurns"))} (${pct(sumOf("aiKenBurns"))})`);
  lines.push(`- A video model animating a still: ${fmt(sumOf("aiVideo"))} (${pct(sumOf("aiVideo"))})`);
  lines.push(`- Filmed motion (stock footage): ${fmt(sumOf("stockVideo"))} (${pct(sumOf("stockVideo"))})`);
  lines.push(`- Remotion animation (type, diagrams, charts, and cards that carry a photo or still): ${fmt(remotionSec)} (${pct(remotionSec)})`);
  if (byKind.has("placeholder")) lines.push(`- Not made yet: ${fmt(sumOf("placeholder"))} (${pct(sumOf("placeholder"))})`);
  lines.push("");
  // Stills behind the illustration time.
  if (stillUses.size > 0) {
    const perStill = [...stillUses.entries()]
      .map(([k, ids]) => ({ k, n: ids.length, sec: ids.reduce((t, id) => t + (rows.find((r) => r.id === id)?.dur ?? 0), 0) }))
      .sort((a, b) => b.sec - a.sec);
    const stillSec = perStill.reduce((n, x) => n + x.sec, 0);
    lines.push(`Stills behind the full-frame illustration time: ${perStill.length} stills carry ${fmt(stillSec)}, ${(stillSec / perStill.length).toFixed(0)}s each on average.`, "");
    lines.push("| Still | Uses | Time on screen |", "|---|---:|---:|");
    for (const x of perStill) lines.push(`| ${x.k} | ${x.n} | ${fmt(x.sec)} |`);
    lines.push("");
  }
}
lines.push("## Segments", "");
lines.push("| # | Segment | Start | Dur | Component | Kind | Mode | Words | Flags |", "|---|---|---|---|---|---|---|---|---|");
rows.forEach((r, i) => {
  const fr = frameResults[r.id];
  const fFlags = fr ? fr.issues.filter((x) => x.sev === "fail").map((x) => `**${x.kind}** ${x.msg}`) : [];
  const allFlags = [...r.flags, ...fFlags, ...(r.notes ? [`_${r.notes}_`] : [])];
  lines.push(`| ${i + 1} | ${r.id} | ${fmt(r.start)} | ${r.dur}s | ${r.comp}${r.dataFile ? ` (${r.dataFile.replace(".json", "")})` : ""} | ${KIND[r.kind]?.label ?? r.kind} | ${r.mode} | ${r.words ?? ""} | ${allFlags.join("<br>").replace(/\|/g, "\\|")} |`);
});
lines.push("");
if (doRender) {
  lines.push("## Frame warnings", "");
  for (const [id, fr] of Object.entries(frameResults)) {
    const w = fr.issues.filter((x) => x.sev === "warn");
    if (w.length) lines.push(`- **${id}** (frame ${fr.frame}): ${w.map((x) => `${x.kind} ${x.msg}`).join("; ")}`);
  }
  const fontCounts = Object.values(frameResults).map((r) => r.fontFaces).filter((x) => x != null);
  if (fontCounts.length) lines.push("", `Font files registered by the page: ${Math.max(...fontCounts)} (each is fetched before a frame can render).`);
  const chromeMins = Object.values(frameResults).map((r) => r.chromeMinPx).filter((x) => x != null);
  if (chromeMins.length) lines.push("", `Chrome text (header/footer/section label) smallest size: ${Math.min(...chromeMins)}px.`);
  lines.push("");
}
if (doRender && floorPx) {
  const hit = Object.entries(frameResults).filter(([, fr]) => fr.small?.length);
  const measured = Object.values(frameResults).filter((fr) => fr.small).length;
  const items = hit.reduce((n, [, fr]) => n + fr.small.length, 0);
  lines.push(`## Text under ${floorPx}px`, "");
  lines.push(`${hit.length} of ${measured} measured segments show content text below ${floorPx}px (${items} text runs). One frame per segment, so text that has left the screen by then is not counted.`, "");
  lines.push("| Segment | Component | Runs | Sizes | Examples |", "|---|---|---|---|---|");
  for (const [id, fr] of hit) {
    const r = rows.find((x) => x.id === id);
    const sizes = [...new Set(fr.small.map((x) => x.fontPx))].sort((a, b) => a - b);
    const ex = fr.small.slice(0, 3).map((x) => `"${x.text.slice(0, 28).replace(/\|/g, "/")}" ${x.fontPx}`).join("; ");
    lines.push(`| ${id} | ${r?.comp ?? ""}${r?.dataFile ? ` (${r.dataFile.replace(".json", "")})` : ""} | ${fr.small.length} | ${sizes.join(", ")} | ${ex} |`);
  }
  lines.push("");
}
fs.writeFileSync(path.join(outDir, "report.md"), lines.join("\n"));
fs.writeFileSync(
  path.join(outDir, "report.json"),
  JSON.stringify({ rules: QA_RULES, summary: { textShare, switches, episodeIssues, placeholders: placeholders.map((p) => p.id) }, rows, frames: frameResults }, null, 2),
);
console.log(`\nReport: ${path.relative(process.cwd(), path.join(outDir, "report.md"))}`);

/**
 * Catalog — Diagrams category.
 *
 * FrameworkDiagram × 3 (comparison, flow, matrix),
 * NetworkDiagram × 2 (hub-spoke, horizontal-chain),
 * SplitComposition × 2.
 */

import { Composition } from "remotion";
import { FrameworkDiagram } from "../templates/FrameworkDiagram/FrameworkDiagram";
import { FrameworkDiagramSchema } from "../templates/FrameworkDiagram/schema";
import type { FrameworkDiagramData } from "../templates/FrameworkDiagram/types";
import { NetworkDiagram } from "../templates/NetworkDiagram/NetworkDiagram";
import { NetworkDiagramSchema } from "../templates/NetworkDiagram/schema";
import type { NetworkDiagramData } from "../templates/NetworkDiagram/types";
import { SplitComposition } from "../templates/SplitComposition/SplitComposition";
import { SplitCompositionSchema } from "../templates/SplitComposition/schema";
import type { SplitCompositionData } from "../templates/SplitComposition/types";
import { DuelingFrameworks } from "../templates/DuelingFrameworks/DuelingFrameworks";
import type { DuelingFrameworksData } from "../templates/DuelingFrameworks/types";
import { ArcDiagram } from "../templates/ArcDiagram/ArcDiagram";
import { ArcDiagramSchema } from "../templates/ArcDiagram/schema";
import type { ArcDiagramData } from "../templates/ArcDiagram/types";
import { StrategicLandscape } from "../templates/StrategicLandscape/StrategicLandscape";
import { StrategicLandscapeSchema } from "../templates/StrategicLandscape/schema";
import type { StrategicLandscapeData } from "../templates/StrategicLandscape/types";
import { TernaryPlot } from "../templates/TernaryPlot/TernaryPlot";
import { TernaryPlotSchema } from "../templates/TernaryPlot/schema";
import type { TernaryPlotData } from "../templates/TernaryPlot/types";
import { layout, sec } from "../design/theme";
import { CATALOG_EPISODE, catalogId } from "./helpers";

// ─── FrameworkDiagram × 3 ─────────────────────────────────────────────────

const fwComparison: FrameworkDiagramData = {
  episode: CATALOG_EPISODE,
  title: "Two Strategic Game Logics",
  subtitle: "How worldview shapes the moves you can imagine",
  variant: "comparison",
  // Both column headers carry a CJK parenthetical so their text line-boxes
  // are the same height and the underlines/items align row-to-row.
  columns: [
    {
      title: "Chess (西洋棋)",
      icon: "♔",
      color: "#3266AD",
      items: [
        "Capture the king",
        "Open information",
        "Pieces have fixed values",
        "End in mate or stalemate",
        "Battles cluster in the center",
      ],
    },
    {
      title: "Go (圍棋)",
      icon: "⚫",
      color: "#C23B22",
      items: [
        "Control more territory",
        "Locally bounded vision",
        "All stones have equal value",
        "End by counting points",
        "The whole board matters",
      ],
    },
  ],
  durationSec: 11,
};

const fwFlow: FrameworkDiagramData = {
  episode: CATALOG_EPISODE,
  title: "How a Question Becomes a Discipline",
  subtitle: "The rough lifecycle of an academic field",
  variant: "flow",
  nodes: [
    { label: "Curiosity", sublabel: "An unexplained phenomenon", color: "#E5A544" },
    { label: "Observation", sublabel: "Patterns recorded", color: "#3266AD" },
    { label: "Hypothesis", sublabel: "A causal story is told", color: "#5DAA68" },
    { label: "Method", sublabel: "Tests are agreed upon", color: "#C23B22" },
    { label: "Discipline", sublabel: "A community converges", color: "#6B1D1D" },
  ],
  arrowLabels: ["asks", "explains", "tests", "institutionalizes"],
  durationSec: 10,
};

const fwMatrix: FrameworkDiagramData = {
  episode: CATALOG_EPISODE,
  title: "The Eisenhower Matrix",
  subtitle: "A four-quadrant prioritization framework",
  variant: "matrix",
  rowHeaders: ["Important", "Not Important"],
  colHeaders: ["Urgent", "Not Urgent"],
  cells: [
    { row: 0, col: 0, label: "Do First — crises, deadlines", color: "#C23B22", highlight: true },
    { row: 0, col: 1, label: "Schedule — planning, growth", color: "#5DAA68" },
    { row: 1, col: 0, label: "Delegate — interruptions" },
    { row: 1, col: 1, label: "Eliminate — distractions", color: "#888780" },
  ],
  durationSec: 10,
};

// ─── NetworkDiagram × 2 ───────────────────────────────────────────────────

// NetworkDiagram demos must show RELATIONSHIP structure where geography is
// editorially irrelevant — otherwise a map template carries more meaning.
// Roman-roads-style data (named places, real geographic positions, routes
// that hug actual coastlines) belongs in ChoroplethMap or RouteAnimation.
// This catalog entry deliberately picks a chokepoint relationship: TSMC's
// position is structural ("everyone goes through us"), not spatial. The
// chart would lose its editorial point on a Taiwan map; on the network
// diagram the dependency structure IS the point.
const nwHubSpoke: NetworkDiagramData = {
  episode: CATALOG_EPISODE,
  title: "TSMC: The Chip-Supply Chokepoint",
  subtitle: "One foundry sits between every advanced chip designer and a finished product",
  layout: "hub-spoke",
  nodes: [
    { id: "tsmc", label: "TSMC", type: "nation", color: "#6B1D1D", importance: "primary",
      stat: { value: "92%", label: "of advanced-node chips" } },
    { id: "apple", label: "Apple", sublabel: "M & A-series", type: "institution", color: "#888780" },
    { id: "nvidia", label: "Nvidia", sublabel: "AI accelerators", type: "institution", color: "#E5A544" },
    { id: "amd", label: "AMD", sublabel: "CPU · GPU", type: "institution", color: "#888780" },
    { id: "qualcomm", label: "Qualcomm", sublabel: "Mobile SoC", type: "institution", color: "#3266AD" },
    { id: "broadcom", label: "Broadcom", sublabel: "Networking", type: "institution", color: "#888780" },
  ],
  edges: [
    { from: "tsmc", to: "apple", style: "solid" },
    { from: "tsmc", to: "nvidia", style: "solid" },
    { from: "tsmc", to: "amd", style: "solid" },
    { from: "tsmc", to: "qualcomm", style: "solid" },
    { from: "tsmc", to: "broadcom", style: "solid" },
  ],
  callouts: [
    { value: "1 supplier", label: "for every leading-edge chip outside Samsung's foundry", position: "bottom-right" },
  ],
  durationSec: 12,
};

// Bipartite variant of the chokepoint argument. Same data substance —
// five designers depend on one foundry — but rendered as two columns
// with straight connectors instead of a radial hub-spoke. Reads cleaner
// at video-scrubbing speed: "five things on the left, one thing on the
// right, every line converges." No bubble/curve idiom, no glossy
// circles competing with the editorial number. Use when the story is
// dependency direction (A's depend on B), not concentric concentration.
const nwBipartite: NetworkDiagramData = {
  episode: CATALOG_EPISODE,
  title: "TSMC: The Chip-Supply Chokepoint",
  subtitle: "Five leading-edge designers, one foundry on the receiving end",
  layout: "bipartite",
  nodes: [
    { id: "apple", label: "Apple", sublabel: "M & A-series", type: "institution", color: "#888780", side: "left" },
    { id: "nvidia", label: "Nvidia", sublabel: "AI accelerators", type: "institution", color: "#E5A544", side: "left" },
    { id: "amd", label: "AMD", sublabel: "CPU · GPU", type: "institution", color: "#888780", side: "left" },
    { id: "qualcomm", label: "Qualcomm", sublabel: "Mobile SoC", type: "institution", color: "#3266AD", side: "left" },
    { id: "broadcom", label: "Broadcom", sublabel: "Networking", type: "institution", color: "#888780", side: "left" },
    { id: "tsmc", label: "TSMC", type: "nation", color: "#6B1D1D", importance: "primary", side: "right",
      stat: { value: "92%", label: "of advanced-node chips" } },
  ],
  edges: [
    { from: "apple", to: "tsmc", style: "solid" },
    { from: "nvidia", to: "tsmc", style: "solid" },
    { from: "amd", to: "tsmc", style: "solid" },
    { from: "qualcomm", to: "tsmc", style: "solid" },
    { from: "broadcom", to: "tsmc", style: "solid" },
  ],
  callouts: [
    { value: "1 supplier", label: "for every leading-edge chip outside Samsung's foundry", position: "bottom-right" },
  ],
  durationSec: 12,
};

// horizontal-chain catalog demo deprecated May 10, 2026 — sequential
// progressions belong in FrameworkDiagram flow (which carries spine,
// chevrons, ordinals, hero terminal); value-capture stories belong in
// PricingWaterfall (see PricingWaterfall/index.tsx). The horizontal-chain
// layout enum value remains in NetworkDiagram for back-compat but should
// not be the recommended path for new content. See CLAUDE.md "Known gaps".

// ─── SplitComposition × 2 ─────────────────────────────────────────────────

const splitMaps: SplitCompositionData = {
  episode: CATALOG_EPISODE,
  title: "Two Ways to Draw the World",
  left: {
    tag: "MERCATOR",
    title: "Preserves Angles",
    subtitle: "Designed for navigators, not for geographers",
    items: [
      "Greenland looks bigger than Africa",
      "Antarctica wraps the entire bottom",
      "Routes plot as straight lines",
      "Pole-ward distortion explodes to infinity",
    ],
    accentColor: "#3266AD",
  },
  right: {
    tag: "EQUAL-AREA",
    title: "Preserves Size",
    subtitle: "Honest about land mass, dishonest about shape",
    items: [
      "Africa, India, South America regain size",
      "The Earth looks subtly stretched",
      "Compass headings curve oddly",
      "Useful for showing population, biome, GDP",
    ],
    accentColor: "#E5A544",
  },
  dividerLabel: "vs",
  durationSec: 11,
};

const splitTime: SplitCompositionData = {
  episode: CATALOG_EPISODE,
  title: "Two Conceptions of Time",
  left: {
    tag: "LINEAR",
    title: "Time as Arrow",
    items: [
      "Beginning, middle, end",
      "Progress, decay, finitude",
      "Western, Abrahamic default",
      "History as a line that doesn't return",
    ],
    accentColor: "#C23B22",
  },
  right: {
    tag: "CYCLICAL",
    title: "Time as Wheel",
    items: [
      "Seasons, dynasties, ages",
      "Recurrence, return, resonance",
      "Hindu, Buddhist, agrarian default",
      "History as a song with verses",
    ],
    accentColor: "#5DAA68",
  },
  dividerLabel: "or",
  durationSec: 11,
};

// ─── DuelingFrameworks × 1 ────────────────────────────────────────────────

const duelingEmpireFall: DuelingFrameworksData = {
  episode: CATALOG_EPISODE,
  title: "Why Empires Fall",
  subtitle: "Two diagnostic lenses on the same end-state",
  phenomenon: "the late-stage decline of imperial systems",
  verdictLabel: "Which lens fits the late stage?",
  // cinematicMode disabled May 10, 2026 — the wide-canvas + camera-pan
  // architecture has unresolved layout collisions (title vs framework
  // headers during pan; scoring bars wider than the overview viewport).
  // Static variant is cleaner and reads as editorial. Re-enable when
  // cinematic mode has been refactored for proper viewport containment.
  cinematicMode: false,
  ambientParticles: true,
  durationSec: 22,
  frameworkA: {
    name: "Imperial Overstretch",
    color: "#C23B22",
    score: 76,
    verdict: "Explains the tempo and timing",
    tenets: [
      { text: "Military commitments outrun the economic base" },
      { text: "Defense spending crowds out productive investment" },
      { text: "Relative decline becomes absolute" },
      { text: "The fiscal ceiling forces a strategic retreat" },
    ],
  },
  frameworkB: {
    name: "Legitimacy Crisis",
    color: "#3266AD",
    score: 71,
    verdict: "Explains how the end actually arrives",
    tenets: [
      { text: "The ruling order loses its sacred authority" },
      { text: "Succession turns contested and violent" },
      { text: "Elite consensus fractures under pressure" },
      { text: "The periphery stops believing in the center" },
    ],
  },
};

// Migrated from TimelineMorph (May 13, 2026). The blockades story is a
// structural comparison — same 4 dimensions (Object / Mechanism / Evasion
// / Counter-bloc) persist across 200 years with different content. Showing
// both eras side-by-side simultaneously (the DuelingFrameworks form) makes
// the structural-persistence claim visible at every frame. Row labels are
// prepended to each tenet text since DuelingFrameworks renders flat tenet
// lists. Equal scores (84/84) signal that the editorial point is parallel
// persistence, not "which framework wins."
const duelingBlockadesSubstrate: DuelingFrameworksData = {
  episode: CATALOG_EPISODE,
  title: "Blockade, Reinvented",
  subtitle: "Same instrument, different substrate",
  phenomenon: "Economic isolation as coercive instrument",
  verdictLabel: "Same structural pattern, 200 years apart",
  cinematicMode: false,
  ambientParticles: true,
  durationSec: 20,
  frameworkA: {
    name: "1806 · Continental System",
    color: "#7B5E3A",
    score: 84,
    verdict: "Same scaffold — different mechanism",
    tenets: [
      { text: "Object — British goods kept off European ports" },
      { text: "Mechanism — Customs cordons enforced by armies on land" },
      { text: "Evasion — Smuggling fleets through the Baltic and Iberian peninsula" },
      { text: "Counter-bloc — Russia leaves the system in 1810; Spain rebels" },
    ],
  },
  frameworkB: {
    name: "2022 · Financial Sanctions",
    color: "#3266AD",
    score: 84,
    verdict: "Same scaffold — different mechanism",
    tenets: [
      { text: "Object — Russian state assets frozen across SWIFT and the dollar system" },
      { text: "Mechanism — Compliance by foreign banks under threat of secondary sanctions" },
      { text: "Evasion — Shadow tanker fleets, ruble-yuan swap lines, crypto rails" },
      { text: "Counter-bloc — BRICS nations build settlement infrastructure outside the dollar" },
    ],
  },
};

// ─── Composition registrations ────────────────────────────────────────────

const fwComp = (id: string, data: FrameworkDiagramData) => (
  <Composition
    id={id}
    component={FrameworkDiagram}
    schema={FrameworkDiagramSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as FrameworkDiagramData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogFwComparison = () => fwComp(catalogId("FrameworkDiagram", "comparison"), fwComparison);
export const CatalogFwFlow = () => fwComp(catalogId("FrameworkDiagram", "flow"), fwFlow);
export const CatalogFwMatrix = () => fwComp(catalogId("FrameworkDiagram", "matrix"), fwMatrix);

const nwComp = (id: string, data: NetworkDiagramData) => (
  <Composition
    id={id}
    component={NetworkDiagram}
    schema={NetworkDiagramSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as NetworkDiagramData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogNwHubSpoke = () => nwComp(catalogId("NetworkDiagram", "hub-spoke"), nwHubSpoke);
export const CatalogNwBipartite = () => nwComp(catalogId("NetworkDiagram", "bipartite"), nwBipartite);

const splitComp = (id: string, data: SplitCompositionData) => (
  <Composition
    id={id}
    component={SplitComposition}
    schema={SplitCompositionSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as SplitCompositionData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogSplitMaps = () => splitComp(catalogId("SplitComposition", "maps"), splitMaps);
export const CatalogSplitTime = () => splitComp(catalogId("SplitComposition", "time"), splitTime);

const duelingComp = (id: string, data: DuelingFrameworksData) => (
  <Composition
    id={id}
    component={DuelingFrameworks}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DuelingFrameworksData).durationSec || 18),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogDuelingEmpireFall = () => duelingComp(catalogId("DuelingFrameworks", "empire-fall"), duelingEmpireFall);
export const CatalogDuelingBlockadesSubstrate = () =>
  duelingComp(catalogId("DuelingFrameworks", "blockades-substrate"), duelingBlockadesSubstrate);

// ─── ArcDiagram × 1 — intellectual lineage of grand strategy ──────────────

const arcDiagramGrandStrategy: ArcDiagramData = {
  episode: CATALOG_EPISODE,
  title: "The Lineage of American Grand Strategy",
  subtitle:
    "Five strategic thinkers, eighty years — each generation extending, rebutting, or recovering the last",
  nodes: [
    { id: "mahan", label: "Mahan", sublabel: "Sea Power", axisStamp: "1890", importance: "primary" },
    { id: "mackinder", label: "Mackinder", sublabel: "Heartland", axisStamp: "1904" },
    { id: "spykman", label: "Spykman", sublabel: "Rimland", axisStamp: "1942" },
    { id: "kennan", label: "Kennan", sublabel: "Containment", axisStamp: "1947", importance: "primary", color: "accent" },
    { id: "brzezinski", label: "Brzezinski", sublabel: "Grand Chessboard", axisStamp: "1997" },
  ],
  connections: [
    { from: "mahan", to: "mackinder", label: "inverted", strength: 0.7 },
    { from: "mackinder", to: "spykman", label: "rebutted", strength: 0.8, style: "dashed" },
    { from: "mahan", to: "spykman", label: "recovered", strength: 0.9 },
    { from: "spykman", to: "kennan", label: "operationalized", strength: 1.0, color: "accent" },
    { from: "kennan", to: "brzezinski", label: "extended", strength: 0.8 },
    { from: "mackinder", to: "brzezinski", label: "rehabilitated", strength: 0.6, style: "dashed" },
  ],
  axisTitle: "Century",
  source: "Standard surveys of strategic-studies historiography",
  durationSec: 14,
};

export const CatalogArcDiagram = () => (
  <Composition
    id={catalogId("ArcDiagram", "grand-strategy")}
    component={ArcDiagram}
    schema={ArcDiagramSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as ArcDiagramData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: arcDiagramGrandStrategy as ArcDiagramData }}
  />
);

// ─── StrategicLandscape × 1 — semiconductor strategy 2D matrix ────────────
//
// NOTE (May 14, 2026): The actor positions below are an illustrative
// PLACEHOLDER generated for the catalog showcase — they demonstrate the
// template form, not a canonical Parallax framework. Before any episode
// reaches for `<StrategicLandscape>`, the visual-spec stage should replace
// this with a defended editorial framework (real actor positions on a
// named 2D model). The `source` field labels it "illustrative" downstream
// but this upstream comment is the gate.

const strategicLandscapeDemo: StrategicLandscapeData = {
  episode: CATALOG_EPISODE,
  title: "Semiconductor Strategy Landscape",
  subtitle: "Major actors positioned by approach and time horizon",
  xAxisLabel: "Defensive",
  xAxisLabelEnd: "Offensive",
  yAxisLabel: "Short-term",
  yAxisLabelEnd: "Long-term",
  actors: [
    { name: "United States", icon: "US", x: 70, y: 65, color: "#3266AD" },
    { name: "China", icon: "CN", x: 75, y: 80, color: "#C23B22" },
    { name: "TSMC", icon: "TW", x: 40, y: 70 },
    { name: "EU", icon: "EU", x: 35, y: 45, color: "#5DAA68" },
    { name: "Japan", icon: "JP", x: 50, y: 55, color: "#E5A544" },
    { name: "South Korea", icon: "KR", x: 55, y: 60 },
  ],
  quadrantLabels: ["Strategic patience", "Long-term offensive", "Reactive defense", "Tactical strike"],
  source: "Parallax analysis (illustrative)",
  durationSec: 10,
};

export const CatalogStrategicLandscape = () => (
  <Composition
    id={catalogId("StrategicLandscape", "semiconductor-strategy")}
    component={StrategicLandscape}
    schema={StrategicLandscapeSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as StrategicLandscapeData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: strategicLandscapeDemo }}
  />
);

// ─── TernaryPlot × 1 — first-ternary reference (Brexit voter clusters) ────
//
// The Brexit-era YouGov-style three-camp voter ternary is THE canonical
// "first-ternary" reference in editorial newsroom dataviz — it's the
// diagram newsroom dataviz teams reach for when introducing the form to
// general readers (cited in `references/template-research/ternary-plot.md`).
// This catalog entry exists alongside `un-votes` for two distinct
// teaching moments:
//
//   - `un-votes` shows the form at maturity: 30 resolutions, three
//     committed corner clusters, a centroid mean — the lens at full
//     editorial weight.
//   - `uk-voter-brexit` shows the form on first contact: a `readingCue`
//     spelling out what corners and centroids mean, three named
//     demographic clusters anchored to their corner of the triangle,
//     and one centrist cluster sitting near the centroid.
//
// Numbers are illustrative reconstructions, not survey output. The
// Fransham et al. (2019) paper on the Brexit electorate is the
// inspiration, not the source of these specific points. The point of
// the catalog entry is to teach the FORM, not to argue about Brexit.
const ternaryUKVoter: TernaryPlotData = {
  episode: CATALOG_EPISODE,
  title: "How the 2016 Brexit Electorate Split",
  subtitle: "Modeled voter clusters by Leave / Remain / Undecided share",
  axisLabels: { a: "Leave", b: "Remain", c: "Undecided" },
  readingCue:
    "Each point is a voter cluster; corners are 100% commitment to that camp",
  points: [
    // ── Committed-Leave cluster (corner A) ──────────────────────────
    {
      id: "northern-working-class",
      label: "Northern working class",
      a: 78,
      b: 12,
      c: 10,
      highlight: true,
    },
    {
      id: "conservative-heartlands",
      label: "Conservative heartlands",
      a: 72,
      b: 18,
      c: 10,
      highlight: true,
    },
    { id: "leave-c1", a: 80, b: 10, c: 10 },
    { id: "leave-c2", a: 76, b: 14, c: 10 },
    { id: "leave-c3", a: 74, b: 16, c: 10 },
    { id: "leave-c4", a: 82, b: 8, c: 10 },
    { id: "leave-c5", a: 70, b: 20, c: 10 },
    { id: "leave-c6", a: 68, b: 22, c: 10 },
    { id: "leave-c7", a: 75, b: 13, c: 12 },
    { id: "leave-c8", a: 71, b: 17, c: 12 },
    { id: "leave-c9", a: 65, b: 23, c: 12 },
    { id: "leave-c10", a: 67, b: 21, c: 12 },
    // ── Committed-Remain cluster (corner B) ─────────────────────────
    {
      id: "london-graduates",
      label: "London graduates",
      a: 12,
      b: 78,
      c: 10,
      highlight: true,
    },
    {
      id: "scottish-urban",
      label: "Scottish urban",
      a: 18,
      b: 72,
      c: 10,
      highlight: true,
    },
    { id: "remain-c1", a: 10, b: 80, c: 10 },
    { id: "remain-c2", a: 14, b: 76, c: 10 },
    { id: "remain-c3", a: 16, b: 74, c: 10 },
    { id: "remain-c4", a: 8, b: 82, c: 10 },
    { id: "remain-c5", a: 20, b: 70, c: 10 },
    { id: "remain-c6", a: 22, b: 68, c: 10 },
    { id: "remain-c7", a: 13, b: 75, c: 12 },
    { id: "remain-c8", a: 17, b: 71, c: 12 },
    { id: "remain-c9", a: 23, b: 65, c: 12 },
    { id: "remain-c10", a: 21, b: 67, c: 12 },
    // ── Centrist / undecided cluster (centroid) ────────────────────
    {
      id: "midlands-swing",
      label: "Midlands swing seats",
      a: 36,
      b: 34,
      c: 30,
      highlight: true,
    },
    { id: "center-c1", a: 35, b: 35, c: 30 },
    { id: "center-c2", a: 32, b: 38, c: 30 },
    { id: "center-c3", a: 38, b: 32, c: 30 },
    { id: "center-c4", a: 40, b: 30, c: 30 },
    { id: "center-c5", a: 30, b: 40, c: 30 },
    { id: "center-c6", a: 34, b: 34, c: 32 },
    { id: "center-c7", a: 36, b: 36, c: 28 },
    { id: "center-c8", a: 33, b: 33, c: 34 },
  ],
  gridlines: true,
  centroid: true,
  source:
    "Modeled after YouGov / Fransham et al. (2019) Brexit electorate ternary; illustrative reconstruction",
  durationSec: 14,
};

export const CatalogTernaryUKVoter = () => (
  <Composition
    id={catalogId("TernaryPlot", "uk-voter-brexit")}
    component={TernaryPlot}
    schema={TernaryPlotSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as TernaryPlotData).durationSec ?? 14),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: ternaryUKVoter }}
  />
);

export const catalogDiagramsData = {
  fwComparison, fwFlow, fwMatrix,
  nwHubSpoke,
  nwBipartite,
  splitMaps, splitTime,
  duelingEmpireFall,
  duelingBlockadesSubstrate,
  arcDiagramGrandStrategy,
  strategicLandscapeDemo,
  ternaryUKVoter,
};

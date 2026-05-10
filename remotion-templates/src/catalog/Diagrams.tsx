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

export const catalogDiagramsData = {
  fwComparison, fwFlow, fwMatrix,
  nwHubSpoke,
  splitMaps, splitTime,
  duelingEmpireFall,
};

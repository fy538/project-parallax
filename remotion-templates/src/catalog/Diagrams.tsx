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
import { layout, sec } from "../design/theme";
import { CATALOG_EPISODE, catalogId } from "./helpers";

// ─── FrameworkDiagram × 3 ─────────────────────────────────────────────────

const fwComparison: FrameworkDiagramData = {
  episode: CATALOG_EPISODE,
  title: "Two Strategic Game Logics",
  subtitle: "How worldview shapes the moves you can imagine",
  variant: "comparison",
  columns: [
    {
      title: "Chess",
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

const nwHubSpoke: NetworkDiagramData = {
  episode: CATALOG_EPISODE,
  title: "The Roman Road Network",
  subtitle: "All roads led to Rome — for an extractable reason",
  layout: "hub-spoke",
  nodes: [
    { id: "rome", label: "Rome", type: "nation", color: "#6B1D1D", importance: "primary",
      stat: { value: "85k km", label: "of paved road" } },
    { id: "lugdunum", label: "Lugdunum", sublabel: "Lyon", type: "institution", color: "#E5A544" },
    { id: "alexandria", label: "Alexandria", sublabel: "grain", type: "institution", color: "#E5A544" },
    { id: "constantinople", label: "Byzantium", sublabel: "later capital", type: "institution", color: "#3266AD" },
    { id: "carthago", label: "Carthago", sublabel: "Africa", type: "institution", color: "#888780" },
    { id: "londinium", label: "Londinium", type: "institution", color: "#888780" },
  ],
  edges: [
    { from: "rome", to: "lugdunum", style: "solid", label: "Via Aurelia" },
    { from: "rome", to: "alexandria", style: "solid", label: "grain ships" },
    { from: "rome", to: "constantinople", style: "solid", label: "Via Egnatia" },
    { from: "rome", to: "carthago", style: "solid" },
    { from: "rome", to: "londinium", style: "solid" },
  ],
  callouts: [
    { value: "60 mi/day", label: "Roman courier speed via the Cursus Publicus", position: "bottom-right" },
  ],
  durationSec: 12,
};

const nwChain: NetworkDiagramData = {
  episode: CATALOG_EPISODE,
  title: "The Coffee Bean's Journey",
  subtitle: "From Ethiopian highlands to a Brooklyn café",
  layout: "horizontal-chain",
  nodes: [
    { id: "farm", label: "Farm", sublabel: "Yirgacheffe, Ethiopia", type: "actor", color: "#5DAA68", importance: "primary" },
    { id: "coop", label: "Cooperative", sublabel: "Wash & dry", type: "institution", color: "#E5A544" },
    { id: "exporter", label: "Exporter", sublabel: "Addis Ababa", type: "institution", color: "#888780" },
    { id: "importer", label: "Importer", sublabel: "Hamburg", type: "institution", color: "#3266AD" },
    { id: "roaster", label: "Roaster", sublabel: "Brooklyn", type: "actor", color: "#6B1D1D", importance: "primary" },
    { id: "shop", label: "Shop", sublabel: "Williamsburg", type: "actor", color: "#C23B22" },
  ],
  edges: [
    { from: "farm", to: "coop", style: "solid", label: "harvest" },
    { from: "coop", to: "exporter", style: "solid" },
    { from: "exporter", to: "importer", style: "solid", label: "shipping" },
    { from: "importer", to: "roaster", style: "solid" },
    { from: "roaster", to: "shop", style: "solid", label: "next-day" },
  ],
  callouts: [
    { value: "~3%", label: "Share of final retail price returned to the farmer", position: "bottom-right" },
  ],
  durationSec: 11,
};

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
export const CatalogNwChain = () => nwComp(catalogId("NetworkDiagram", "horizontal-chain"), nwChain);

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

export const catalogDiagramsData = {
  fwComparison, fwFlow, fwMatrix,
  nwHubSpoke, nwChain,
  splitMaps, splitTime,
};

/**
 * Catalog — Timelines category.
 *
 * HorizontalTimeline × 2 (single, dual)
 * EscalationLadder × 2 (escalation, de-escalation)
 *
 * Subjects are episode-neutral but channel-toned: history, science,
 * engineering, geopolitics through a long lens.
 */

import { Composition } from "remotion";
import { HorizontalTimeline } from "../templates/HorizontalTimeline/HorizontalTimeline";
import type { HorizontalTimelineData } from "../templates/HorizontalTimeline/types";
import { EscalationLadder } from "../templates/EscalationLadder/EscalationLadder";
import { EscalationLadderSchema } from "../templates/EscalationLadder/schema";
import type { EscalationLadderData } from "../templates/EscalationLadder/types";
import { TimelineComparison } from "../templates/TimelineComparison/TimelineComparison";
import type { TimelineComparisonData } from "../templates/TimelineComparison/types";
import { DualTimeline } from "../templates/DualTimeline/DualTimeline";
import type { DualTimelineData } from "../templates/DualTimeline/types";
import { TimelineMorph } from "../templates/TimelineMorph/TimelineMorph";
import type { TimelineMorphData } from "../templates/TimelineMorph/types";
import { layout, sec } from "../design/theme";
import { CATALOG_EPISODE, catalogId } from "./helpers";

// ─── HorizontalTimeline × 2 ───────────────────────────────────────────────

const timelineComputers: HorizontalTimelineData = {
  episode: CATALOG_EPISODE,
  title: "From Engine to Pocket",
  subtitle: "How the computer compressed across two centuries",
  mode: "single",
  events: [
    { year: "1837", title: "Babbage's Analytical Engine", description: "First Turing-complete design — never built in his lifetime", weight: 2 },
    { year: "1936", title: "Turing's Universal Machine", description: "Mathematical proof that one machine can compute anything", weight: 2 },
    { year: "1946", title: "ENIAC", description: "30 tons, 20,000 vacuum tubes, 5,000 ops/sec" },
    { year: "1958", title: "Integrated circuit", description: "Kilby and Noyce, independently", weight: 2 },
    { year: "1971", title: "Intel 4004", description: "First commercial microprocessor — 2,300 transistors" },
    { year: "1981", title: "IBM PC", description: "Personal computing reaches the desk" },
    { year: "2007", title: "iPhone", description: "Computer becomes a hand-held organ", weight: 3 },
    { year: "2024", title: "Frontier-class LLMs", description: "Computer becomes a general reasoner" },
  ],
  durationSec: 16,
};

const timelineDualPandemics: HorizontalTimelineData = {
  episode: CATALOG_EPISODE,
  title: "Two Pandemics, One Pattern",
  subtitle: "1918 Spanish Flu and 2020 COVID-19, paired by phase",
  mode: "dual",
  eraATitle: "Spanish Flu, 1918–1920",
  eraBTitle: "COVID-19, 2019–2022",
  pairs: [
    {
      eraA: { year: "Mar 1918", title: "First wave reported", description: "Kansas Army base, mild" },
      eraB: { year: "Dec 2019", title: "Wuhan cluster reported", description: "Pneumonia of unknown cause" },
      connection: "Onset",
    },
    {
      eraA: { year: "Sep 1918", title: "Lethal second wave", description: "Mortality 25× peak", weight: 2 },
      eraB: { year: "Nov 2020", title: "Northern hemisphere wave", description: "Hospitals overwhelmed", weight: 2 },
      connection: "Second wave",
    },
    {
      eraA: { year: "Oct 1918", title: "Mask mandates spread", description: "San Francisco, Seattle, Denver" },
      eraB: { year: "Apr 2020", title: "Mask mandates spread", description: "Most major cities" },
      connection: "Mandates",
    },
    {
      eraA: { year: "1920", title: "Endemic stage", description: "H1N1 becomes seasonal" },
      eraB: { year: "2022", title: "Endemic stage", description: "Omicron becomes seasonal" },
      connection: "Endemic",
    },
  ],
  durationSec: 18,
};

// Demonstrates `phaseAxis`: shared x-scale is "Year of revolution" — both
// eras' events align by phase position, not calendar date. This is the
// Parallax canonical historical-parallel form. See:
// references/template-research/timeline-comparison.md
const timelineDualRevolutionsPhase: HorizontalTimelineData = {
  episode: CATALOG_EPISODE,
  title: "Two Revolutions, One Cadence",
  subtitle: "Aligned by phase, not by calendar",
  mode: "dual",
  eraATitle: "French Revolution, 1789–1799",
  eraBTitle: "Russian Revolution, 1917–1927",
  phaseAxis: {
    label: "Year of revolution",
    unit: "yr",
    min: 0,
    max: 10,
    ticks: [0, 1, 4, 10],
  },
  pairs: [
    {
      phasePosition: 0,
      eraA: { year: "1789", title: "Bastille falls", description: "Old order's monopoly on force breaks", weight: 2 },
      eraB: { year: "1917", title: "October Revolution", description: "Bolsheviks seize the Winter Palace", weight: 2 },
      connection: "Outbreak",
    },
    {
      phasePosition: 1,
      eraA: { year: "1790", title: "Radicalization begins", description: "Civil Constitution of the Clergy" },
      eraB: { year: "1918", title: "Cheka founded", description: "Apparatus of revolutionary terror" },
      connection: "Radicalization",
    },
    {
      phasePosition: 4,
      eraA: { year: "1793", title: "The Terror", description: "Robespierre, mass executions", weight: 3 },
      eraB: { year: "1921", title: "Kronstadt suppressed", description: "Internal dissent crushed", weight: 3 },
      connection: "Internal purge",
    },
    {
      phasePosition: 10,
      eraA: { year: "1799", title: "Napoleon's coup", description: "Strongman consolidates the revolution" },
      eraB: { year: "1927", title: "Stalin consolidates", description: "Trotsky expelled; one-man rule" },
      connection: "Consolidation",
    },
  ],
  durationSec: 18,
};

// ─── EscalationLadder × 2 ─────────────────────────────────────────────────

const ladderColdWar: EscalationLadderData = {
  episode: CATALOG_EPISODE,
  title: "The Nuclear Ladder, 1945–1962",
  subtitle: "Seventeen years from Hiroshima to the brink",
  direction: "escalation",
  rungs: [
    { label: "Hiroshima and Nagasaki", date: "Aug 1945", severity: "high",
      detail: "First and only wartime use of nuclear weapons" },
    { label: "Soviet Joe-1 test", date: "Aug 1949", severity: "elevated",
      detail: "US monopoly ends after four years" },
    { label: "US Ivy Mike (H-bomb)", date: "Nov 1952", severity: "high",
      detail: "First fusion device — 500× Hiroshima" },
    { label: "Soviet RDS-37 (H-bomb)", date: "Nov 1955", severity: "high",
      detail: "Strategic parity" },
    { label: "Sputnik launches", date: "Oct 1957", severity: "elevated",
      detail: "ICBM delivery now plausible" },
    { label: "Cuban Missile Crisis", date: "Oct 1962", severity: "critical",
      detail: "Thirteen days at the edge", current: true },
  ],
  source: "Federation of American Scientists archive",
  durationSec: 14,
};

const ladderArms: EscalationLadderData = {
  episode: CATALOG_EPISODE,
  title: "Walking Back the Stockpile",
  subtitle: "Major arms treaties, 1972–2010",
  direction: "de-escalation",
  rungs: [
    { label: "SALT I signed", date: "May 1972", severity: "high",
      detail: "First binding cap on strategic launchers" },
    { label: "ABM Treaty signed", date: "May 1972", severity: "elevated",
      detail: "Defense limits stabilize MAD" },
    { label: "INF Treaty signed", date: "Dec 1987", severity: "moderate",
      detail: "Eliminated entire class of intermediate-range missiles" },
    { label: "START I signed", date: "Jul 1991", severity: "moderate",
      detail: "Strategic warheads cut by ~30%" },
    { label: "New START", date: "Apr 2010", severity: "low",
      detail: "Deployed warheads capped at 1,550", current: true },
  ],
  source: "Arms Control Association",
  durationSec: 12,
};

// ─── TimelineComparison × 1 ───────────────────────────────────────────────

const comparisonRevolutions: TimelineComparisonData = {
  episode: CATALOG_EPISODE,
  leftLabel: "First Industrial Revolution",
  rightLabel: "Information Revolution",
  leftColor: "#7B5E3A",
  rightColor: "#3266AD",
  leftEvents: [
    { year: "1760", title: "Watt's separate condenser", description: "Steam becomes economically viable" },
    { year: "1779", title: "Crompton's mule", description: "Cotton spinning at 100× hand-loom speed" },
    { year: "1825", title: "Stockton–Darlington Railway", description: "First public steam line" },
    { year: "1840", title: "Telegraph commercialized", description: "Information and goods decouple" },
  ],
  rightEvents: [
    { year: "1947", title: "Transistor at Bell Labs", description: "Solid-state computing becomes viable" },
    { year: "1971", title: "Intel 4004 microprocessor", description: "Computation at 100× minicomputer density" },
    { year: "1989", title: "Web at CERN", description: "First public hypertext network" },
    { year: "2007", title: "Smartphone era", description: "Information and bodies recouple" },
  ],
  connections: [
    { leftIndex: 0, rightIndex: 0, label: "Enabling primitive" },
    { leftIndex: 1, rightIndex: 1, label: "Density leap" },
    { leftIndex: 2, rightIndex: 2, label: "Public network" },
    { leftIndex: 3, rightIndex: 3, label: "Information layer" },
  ],
  secondsPerEvent: 3,
};

// ─── DualTimeline × 1 ─────────────────────────────────────────────────────

const dualImperialTransitions: DualTimelineData = {
  title: "How Empires Hand Off",
  subtitle: "Two transitions, four centuries apart",
  eraATitle: "Rome → Byzantium, c. 284–410",
  eraBTitle: "Britain → America, c. 1898–1956",
  eraAColor: "#C23B22",
  eraBColor: "#3266AD",
  episode: CATALOG_EPISODE,
  durationSec: 16,
  pairs: [
    {
      eraA: { label: "284 CE", text: "Diocletian's Tetrarchy splits administration east and west" },
      eraB: { label: "1898", text: "Spanish-American War — US enters imperial bookkeeping" },
      connection: "Center divides",
    },
    {
      eraA: { label: "330", text: "Constantinople founded as the new strategic capital" },
      eraB: { label: "1944", text: "Bretton Woods anchors the dollar as reserve currency" },
      connection: "New center named",
    },
    {
      eraA: { label: "395", text: "Theodosius dies — division becomes permanent" },
      eraB: { label: "1947", text: "British India partitioned, sterling area cracking" },
      connection: "Old guarantor collapses",
    },
    {
      eraA: { label: "410", text: "Sack of Rome — eastern half outlives the western" },
      eraB: { label: "1956", text: "Suez crisis — Britain pulls back, US underwrites the order" },
      connection: "Handoff complete",
    },
  ],
};

// ─── TimelineMorph × 1 ────────────────────────────────────────────────────

const morphBlockades: TimelineMorphData = {
  episode: CATALOG_EPISODE,
  title: "Blockade, Reinvented",
  subtitle: "A tactic that persists by changing its substrate",
  eraATitle: "1806 · Continental System",
  eraBTitle: "2022 · Financial Sanctions",
  eraAColor: "#7B5E3A",
  eraBColor: "#3266AD",
  durationSec: 16,
  events: [
    {
      eraALabel: "Object",
      eraAText: "British goods kept off European ports",
      eraBLabel: "Object",
      eraBText: "Russian state assets frozen across SWIFT and the dollar system",
    },
    {
      eraALabel: "Mechanism",
      eraAText: "Customs cordons enforced by armies on land",
      eraBLabel: "Mechanism",
      eraBText: "Compliance by foreign banks under threat of secondary sanctions",
    },
    {
      eraALabel: "Evasion",
      eraAText: "Smuggling fleets through the Baltic and the Iberian peninsula",
      eraBLabel: "Evasion",
      eraBText: "Shadow tanker fleets, ruble-yuan swap lines, crypto rails",
    },
    {
      eraALabel: "Counter-bloc",
      eraAText: "Russia leaves the system in 1810; Spain rebels",
      eraBLabel: "Counter-bloc",
      eraBText: "BRICS nations build settlement infrastructure outside the dollar",
    },
  ],
  source: "Hilger; Drezner; ECB working papers",
};

// ─── Composition registrations ────────────────────────────────────────────

const timelineComp = (id: string, data: HorizontalTimelineData) => (
  <Composition
    id={id}
    component={HorizontalTimeline}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as HorizontalTimelineData).durationSec || 15),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogTimelineComputers = () => timelineComp(catalogId("HorizontalTimeline", "computers"), timelineComputers);
export const CatalogTimelineDualPandemics = () => timelineComp(catalogId("HorizontalTimeline", "pandemics-dual"), timelineDualPandemics);
export const CatalogTimelineDualRevolutionsPhase = () => timelineComp(catalogId("HorizontalTimeline", "revolutions-phase"), timelineDualRevolutionsPhase);

const ladderComp = (id: string, data: EscalationLadderData) => (
  <Composition
    id={id}
    component={EscalationLadder}
    schema={EscalationLadderSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as EscalationLadderData).durationSec || 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogLadderColdWar = () => ladderComp(catalogId("EscalationLadder", "cold-war"), ladderColdWar);
export const CatalogLadderArms = () => ladderComp(catalogId("EscalationLadder", "arms-treaties"), ladderArms);

const comparisonComp = (id: string, data: TimelineComparisonData) => (
  <Composition
    id={id}
    component={TimelineComparison}
    calculateMetadata={({ props }) => {
      const d = props.data as TimelineComparisonData;
      const events = Math.max(d.leftEvents.length, d.rightEvents.length);
      const fallback = Math.max(events, 1) * (d.secondsPerEvent ?? 3) + 4;
      return {
        durationInFrames: sec(fallback),
        fps: layout.fps,
        width: layout.width,
        height: layout.height,
      };
    }}
    defaultProps={{ data }}
  />
);

export const CatalogTimelineComparisonRevolutions = () =>
  comparisonComp(catalogId("TimelineComparison", "revolutions"), comparisonRevolutions);

const dualComp = (id: string, data: DualTimelineData) => (
  <Composition
    id={id}
    component={DualTimeline}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as DualTimelineData).durationSec || 16),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogDualImperialTransitions = () =>
  dualComp(catalogId("DualTimeline", "imperial-transitions"), dualImperialTransitions);

const morphComp = (id: string, data: TimelineMorphData) => (
  <Composition
    id={id}
    component={TimelineMorph}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as TimelineMorphData).durationSec || 16),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data }}
  />
);

export const CatalogMorphBlockades = () =>
  morphComp(catalogId("TimelineMorph", "blockades"), morphBlockades);

export const catalogTimelinesData = {
  timelineComputers, timelineDualPandemics, timelineDualRevolutionsPhase,
  ladderColdWar, ladderArms,
  comparisonRevolutions, dualImperialTransitions, morphBlockades,
};

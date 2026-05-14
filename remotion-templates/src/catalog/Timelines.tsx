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
// TimelineComparison + DualTimeline are deprecated (use HorizontalTimeline).
// Kept as type-only import for nothing — catalog uses HorizontalTimeline for
// what used to be TimelineComparison + DualTimeline demos. See May 12, 2026
// timeline visual-register migration.
// TimelineMorph template deleted May 13, 2026 — its single use case
// ("Blockade, Reinvented") was migrated to DuelingFrameworks because
// the editorial form was structural comparison, not chronological morph.
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
  // Explicit camera path: start with a 2.5s settled pullback (so frame 30 /
  // any cold thumbnail renders the whole comparison legibly), then track
  // through each phase pair, dwelling longer on the Terror/Kronstadt purge
  // (climax), and end on a pullback that reveals the full cadence. Without
  // this, the auto-generated camera path starts mid-track at frame 30 and
  // catches the layout in a transient overlap state. See POLISH.md T1.
  cameraPath: [
    { focus: "pullback", zoom: 0.7, duration: 2.5, behavior: "hold", dimOthers: false },
    { focus: 0, zoom: 1.4, duration: 3, behavior: "track" },
    { focus: 1, zoom: 1.4, duration: 3, behavior: "track" },
    { focus: 2, zoom: 1.4, duration: 4, behavior: "track" },
    { focus: 3, zoom: 1.4, duration: 3, behavior: "track" },
    { focus: "pullback", zoom: 0.65, duration: 2.5, behavior: "track", dimOthers: false },
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
  // Default centering handled by EscalationLadder's DEFAULT_OFFSET_X/Y.
  // Add `contentOffset: { x, y }` here only for episode-specific tuning.
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

// Migrated to HorizontalTimeline dual mode (May 12, 2026). TimelineComparison
// is deprecated; HorizontalTimeline replaces it. The four `connection` labels
// per pair become the editorial spine of the parallel — they're what tells
// the viewer "we're not just showing two lists, we're claiming a structural
// rhyme." See the May 12 timeline visual-register pass + timeline-audit
// SKILL.md → Visual Discipline.
const timelineDualIndustrialInfo: HorizontalTimelineData = {
  episode: CATALOG_EPISODE,
  title: "Two Revolutions, One Substrate-Shift",
  subtitle: "First Industrial vs. Information — paired by editorial role",
  mode: "dual",
  eraATitle: "First Industrial Revolution, 1760–1840",
  eraBTitle: "Information Revolution, 1947–2007",
  eraAColor: "#7B5E3A",
  eraBColor: "#3266AD",
  pairs: [
    {
      eraA: { year: "1760", title: "Watt's separate condenser", description: "Steam becomes economically viable", weight: 2 },
      eraB: { year: "1947", title: "Transistor at Bell Labs", description: "Solid-state computing becomes viable", weight: 2 },
      connection: "Enabling primitive",
    },
    {
      eraA: { year: "1779", title: "Crompton's mule", description: "Cotton spinning at 100× hand-loom speed" },
      eraB: { year: "1971", title: "Intel 4004 microprocessor", description: "Computation at 100× minicomputer density" },
      connection: "Density leap",
    },
    {
      eraA: { year: "1825", title: "Stockton–Darlington Railway", description: "First public steam line" },
      eraB: { year: "1989", title: "Web at CERN", description: "First public hypertext network" },
      connection: "Public network",
    },
    {
      eraA: { year: "1840", title: "Telegraph commercialized", description: "Information and goods decouple", weight: 2 },
      eraB: { year: "2007", title: "Smartphone era", description: "Information and bodies recouple", weight: 3 },
      connection: "Information layer",
    },
  ],
  // TODO: HorizontalTimelineData doesn't expose `source` yet — when it does,
  // restore: "Author's synthesis from standard histories of technology".
  durationSec: 16,
};

// ─── DualTimeline × 1 ─────────────────────────────────────────────────────

// Migrated to HorizontalTimeline dual mode (May 12, 2026). DualTimeline is
// deprecated; HorizontalTimeline's connection-per-pair surfaces the four
// beat markers ("Center divides → Handoff complete") that ARE the editorial
// claim of this composition. Note: date labels normalized to bare years (was
// "284 CE" + bare numerals — inconsistent). See timeline-audit SKILL.md
// → Visual Discipline § 4 (date typography).
const timelineDualImperialTransitions: HorizontalTimelineData = {
  episode: CATALOG_EPISODE,
  title: "How Empires Hand Off",
  subtitle: "Two transitions, four centuries apart",
  mode: "dual",
  eraATitle: "Rome → Byzantium, c. 284–410 CE",
  eraBTitle: "Britain → America, c. 1898–1956",
  // Muted brand colors — rust is read by default as historical, navy as
  // contemporary (per timeline-comparison.md § 4). Pre-migration values were
  // brand-saturated, which made the parallel feel hot rather than analytical.
  eraAColor: "#A64D46",
  eraBColor: "#3266AD",
  pairs: [
    {
      eraA: { year: "284", title: "Tetrarchy splits administration", description: "Diocletian divides east and west", weight: 2 },
      eraB: { year: "1898", title: "Spanish-American War", description: "US enters imperial bookkeeping", weight: 2 },
      connection: "Center divides",
    },
    {
      eraA: { year: "330", title: "Constantinople founded", description: "New strategic capital named" },
      eraB: { year: "1944", title: "Bretton Woods", description: "Dollar anchored as reserve currency" },
      connection: "New center named",
    },
    {
      eraA: { year: "395", title: "Theodosius dies", description: "Division becomes permanent" },
      eraB: { year: "1947", title: "British India partitioned", description: "Sterling area cracking" },
      connection: "Old guarantor collapses",
    },
    {
      eraA: { year: "410", title: "Sack of Rome", description: "Eastern half outlives the western", weight: 3 },
      eraB: { year: "1956", title: "Suez crisis", description: "Britain pulls back, US underwrites the order", weight: 3 },
      connection: "Handoff complete",
    },
  ],
  // TODO: HorizontalTimelineData doesn't expose `source` yet — when it does,
  // restore: "Author's synthesis from Heather (2006) + Brendon (2007)".
  durationSec: 16,
};

// Blockade comparison moved to DuelingFrameworks (May 13, 2026) — see
// `duelingBlockadesSubstrate` in `src/catalog/Diagrams.tsx`. The TimelineMorph
// template was the wrong fit ("Blockade, Reinvented" is a structural
// comparison, not a chronological timeline). Template deleted in the same
// pass — see commit log.

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

// CatalogTimelineComparisonRevolutions migrated to HorizontalTimeline dual
// mode (May 12, 2026). The catalogId namespace ("TimelineComparison",
// "revolutions") is kept so existing baselines + showreel slates resolve;
// the underlying template is now HorizontalTimeline. See timelineDualIndustrialInfo.
export const CatalogTimelineComparisonRevolutions = () =>
  timelineComp(catalogId("TimelineComparison", "revolutions"), timelineDualIndustrialInfo);

// CatalogDualImperialTransitions migrated to HorizontalTimeline dual mode
// (May 12, 2026). DualTimeline is deprecated; HorizontalTimeline replaces it.
// The catalogId namespace ("DualTimeline", "imperial-transitions") is kept
// so existing baselines + showreel slates resolve.
export const CatalogDualImperialTransitions = () =>
  timelineComp(catalogId("DualTimeline", "imperial-transitions"), timelineDualImperialTransitions);

// CatalogMorphBlockades export retired (May 13, 2026). The TimelineMorph
// template was deleted; the blockades comparison now lives at
// `CatalogDuelingBlockadesSubstrate` in `src/catalog/Diagrams.tsx`.

export const catalogTimelinesData = {
  timelineComputers, timelineDualPandemics, timelineDualRevolutionsPhase,
  timelineDualImperialTransitions, timelineDualIndustrialInfo,
  ladderColdWar, ladderArms,
};

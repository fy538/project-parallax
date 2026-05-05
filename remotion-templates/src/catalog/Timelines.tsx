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

export const catalogTimelinesData = {
  timelineComputers, timelineDualPandemics, ladderColdWar, ladderArms,
};

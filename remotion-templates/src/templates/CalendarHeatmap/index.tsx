import { Composition } from "remotion";
import { CalendarHeatmap } from "./CalendarHeatmap";
import { standardMetadata } from "../../utils/composition";
import { CalendarHeatmapSchema } from "./schema";
import type { CalendarHeatmapData, CalendarDay } from "./types";

// ── Sample data ────────────────────────────────────────────────────────
//
// "A year of tit-for-tat" — clusters of escalation days across 2024
// around four canonical flashpoints in the Israel-Iran proxy conflict.
// Intensity values are deterministic dummy numbers (1–5) reflecting how
// many notable events occurred on each day.
//
// NOTE: illustrative; for template demo only, not a verified incident
// dataset. Real production data files should be sourced from
// ACLED / Crisis Group / open-source tracking and reviewed by a human
// before publication.
const buildSampleDays = (): CalendarDay[] => {
  // helper: emit a day entry
  const day = (date: string, value: number, label?: string): CalendarDay => ({
    date,
    value,
    label,
  });

  // Each cluster is a list of (day-of-month, intensity 1-5) for the given month.
  type Cluster = { month: number; entries: [number, number][] };
  const clusters: Cluster[] = [
    // January — Hezbollah opening strikes
    {
      month: 1,
      entries: [
        [2, 3],
        [3, 2],
        [8, 2],
        [14, 1],
        [22, 3],
        [25, 2],
      ],
    },
    // February — quiet but persistent
    {
      month: 2,
      entries: [
        [4, 1],
        [9, 2],
        [14, 1],
        [26, 2],
      ],
    },
    // March — pre-consulate buildup
    {
      month: 3,
      entries: [
        [5, 1],
        [11, 2],
        [18, 2],
        [27, 3],
        [29, 2],
      ],
    },
    // April — consulate strike (Apr 1) + Iran retaliation (Apr 13)
    {
      month: 4,
      entries: [
        [1, 5],
        [2, 3],
        [3, 2],
        [9, 2],
        [12, 3],
        [13, 5],
        [14, 4],
        [19, 3],
      ],
    },
    // May — aftermath cooldown
    {
      month: 5,
      entries: [
        [6, 1],
        [10, 2],
        [17, 1],
        [24, 2],
      ],
    },
    // June — Lebanon front warming
    {
      month: 6,
      entries: [
        [3, 2],
        [11, 3],
        [18, 2],
        [25, 2],
      ],
    },
    // July — Haniyeh assassinated (Jul 31)
    {
      month: 7,
      entries: [
        [2, 2],
        [9, 1],
        [13, 2],
        [16, 2],
        [22, 3],
        [27, 3],
        [30, 4],
        [31, 5],
      ],
    },
    // August — response phase, broad activity
    {
      month: 8,
      entries: [
        [1, 4],
        [2, 3],
        [4, 2],
        [11, 2],
        [16, 3],
        [21, 2],
        [25, 4],
        [27, 2],
        [30, 2],
      ],
    },
    // September — Beirut pager attacks ramp
    {
      month: 9,
      entries: [
        [4, 2],
        [10, 2],
        [17, 4],
        [18, 4],
        [20, 3],
        [23, 3],
        [27, 4],
      ],
    },
    // October — Iran missile barrage (Oct 1) + Beirut/Tehran exchanges
    {
      month: 10,
      entries: [
        [1, 5],
        [2, 4],
        [3, 3],
        [6, 2],
        [10, 3],
        [16, 4],
        [17, 2],
        [22, 3],
        [26, 4],
        [27, 3],
        [29, 2],
        [31, 2],
      ],
    },
    // November — winding down but persistent
    {
      month: 11,
      entries: [
        [5, 2],
        [11, 2],
        [18, 1],
        [25, 2],
      ],
    },
    // December — ceasefire holds, occasional flares
    {
      month: 12,
      entries: [
        [3, 1],
        [9, 1],
        [16, 2],
        [24, 1],
      ],
    },
  ];

  const days: CalendarDay[] = [];
  for (const c of clusters) {
    for (const [d, v] of c.entries) {
      const iso = `2024-${String(c.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push(day(iso, v));
    }
  }
  return days;
};

const sampleData: CalendarHeatmapData = {
  episode: "catalog",
  title: "Israel–Iran Proxy Escalation, 2024",
  subtitle:
    "A year of tit-for-tat — the days when something happened",
  year: 2024,
  days: buildSampleDays(),
  colorScale: "intensity",
  maxValue: 5,
  valueLabel: "Daily escalation events",
  legendLabels: { low: "Quiet", high: "Peak" },
  weekStart: "sunday",
  highlights: [
    { date: "2024-04-13", label: "Iran's first direct strike" },
    { date: "2024-07-31", label: "Haniyeh assassinated" },
    { date: "2024-10-01", label: "Iran's missile barrage" },
  ],
  source: "Open-source incident tracking; illustrative only",
  durationSec: 14,
};

export const CalendarHeatmapComposition = () => (
  <Composition
    id="CalendarHeatmap"
    component={CalendarHeatmap}
    schema={CalendarHeatmapSchema}
    calculateMetadata={standardMetadata<CalendarHeatmapData>(12)}
    defaultProps={{ data: sampleData as CalendarHeatmapData }}
  />
);

import { Composition } from "remotion";
import { SpiralTimeline } from "./SpiralTimeline";
import { standardMetadata } from "../../utils/composition";
import { SpiralTimelineSchema } from "./schema";
import type { SpiralTimelineData } from "./types";

// Default props — major-power transitions on a 50-year cycle.
// Two centuries of hegemonic-handoff moments: 1815 Vienna, 1865 Civil War
// end, 1918 Versailles, 1945 Yalta, 1991 Soviet collapse, 2022 Ukraine
// inflection. Spaced ~50 years apart → they cluster at the same angular
// position, making the "every 50 years" claim visually self-evident.
export const spiralTimelineSampleData: SpiralTimelineData = {
  episode: "hegemonic-cycles",
  title: "FIFTY-YEAR RHYMES",
  subtitle: "Major-power inflection points cluster on a half-century cycle.",
  cycleYears: 50,
  startYear: 1800,
  endYear: 2025,
  categories: [
    { id: "war-end", label: "Settlement", color: "#C4A747", glyph: "circle" },
    { id: "crisis", label: "Crisis", color: "#A64D46", glyph: "diamond" },
    { id: "thaw", label: "Reset", color: "#7AA3C9", glyph: "square" },
  ],
  events: [
    { year: 1815, label: "Congress of Vienna", category: "war-end", emphasis: "primary" },
    { year: 1848, label: "Spring of Nations", category: "crisis" },
    { year: 1865, label: "US Civil War end", category: "war-end" },
    { year: 1871, label: "German unification", category: "war-end" },
    { year: 1918, label: "Versailles", category: "war-end", emphasis: "primary" },
    { year: 1929, label: "Crash", category: "crisis" },
    { year: 1945, label: "Yalta / Potsdam", category: "war-end", emphasis: "primary" },
    { year: 1968, label: "'68 unrest", category: "crisis" },
    { year: 1989, label: "Berlin Wall", category: "thaw" },
    { year: 1991, label: "Soviet collapse", category: "thaw", emphasis: "primary" },
    { year: 2008, label: "Financial crisis", category: "crisis" },
    { year: 2022, label: "Ukraine invasion", category: "crisis", emphasis: "primary" },
  ],
  source: "Author selection; see episode notes",
  durationSec: 16,
};

export const SpiralTimelineComposition = () => (
  <Composition
    id="SpiralTimeline"
    component={SpiralTimeline}
    schema={SpiralTimelineSchema}
    calculateMetadata={standardMetadata<SpiralTimelineData>(14)}
    defaultProps={{ data: spiralTimelineSampleData as SpiralTimelineData }}
  />
);

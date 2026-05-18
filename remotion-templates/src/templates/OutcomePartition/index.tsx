import { Composition } from "remotion";
import { OutcomePartition } from "./OutcomePartition";
import { OutcomePartitionSchema } from "./schema";
import type { OutcomePartitionData } from "./types";
import { layout, sec } from "../../design/theme";

// Sample: Taiwan-strait crisis decision space, partitioned by two
// editorially-named axes (US Resolve × PRC Escalation). Each split is
// a single editorial decision that narrows the outcome space.
export const outcomePartitionSampleData: OutcomePartitionData = {
  episode: "_catalog",
  title: "The Decision Space Narrows",
  subtitle: "Taiwan-strait outcomes under two structural pressures",
  xAxisLabel: "US RESOLVE  →",
  yAxisLabel: "PRC ESCALATION  →",
  root: {
    kind: "split",
    axis: "horizontal",
    at: 0.5,
    label: "US holds resolve?",
    revealStep: 0,
    children: [
      // Left half — US resolve weak
      {
        kind: "split",
        axis: "vertical",
        at: 0.5,
        label: "PRC presses?",
        revealStep: 1,
        children: [
          { kind: "leaf", label: "Brinkmanship freeze", sublabel: "Status quo holds", severity: 0.15, revealStep: 4 },
          { kind: "leaf", label: "Fait accompli", sublabel: "Coercive integration", severity: 0.75, revealStep: 5 },
        ],
      },
      // Right half — US resolve firm
      {
        kind: "split",
        axis: "vertical",
        at: 0.55,
        label: "PRC escalates?",
        revealStep: 2,
        children: [
          { kind: "leaf", label: "Deterrence holds", sublabel: "Costly but stable", severity: 0.25, highlighted: true, revealStep: 3 },
          {
            kind: "split",
            axis: "horizontal",
            at: 0.4,
            label: "Kinetic?",
            revealStep: 6,
            children: [
              { kind: "leaf", label: "Limited blockade", sublabel: "Naval quarantine + WTO action", severity: 0.55, revealStep: 7 },
              { kind: "leaf", label: "Open hostilities", sublabel: "Strait war", severity: 0.95, revealStep: 8 },
            ],
          },
        ],
      },
    ],
  },
  source: "Scenario sketch after RAND TR-392 contingency framework.",
  durationSec: 12,
};

export const OutcomePartitionComposition = () => (
  <Composition
    id="OutcomePartition"
    component={OutcomePartition}
    schema={OutcomePartitionSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as OutcomePartitionData).durationSec ?? 12),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: outcomePartitionSampleData as OutcomePartitionData }}
  />
);

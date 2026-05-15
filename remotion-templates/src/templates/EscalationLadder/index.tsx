import { Composition } from "remotion";
import { EscalationLadder } from "./EscalationLadder";
import { layout, sec } from "../../design/theme";
import { EscalationLadderSchema } from "./schema";
import type { EscalationLadderData } from "./types";

const sampleData: EscalationLadderData = {
  episode: "silicon-trap",
  title: "Semiconductor Sanctions Escalation",
  subtitle: "US-China technology denial — step by step",
  direction: "escalation",
  rungs: [
    {
      label: "Entity List additions — Huawei, SMIC",
      date: "May 2019",
      severity: "moderate",
      detail: "Targeted restrictions on specific companies",
    },
    {
      label: "Foreign Direct Product Rule expanded",
      date: "Aug 2020",
      severity: "elevated",
      detail: "Any chip made with US tools requires license",
    },
    {
      label: "October 7 export controls — full spectrum",
      date: "Oct 2022",
      severity: "high",
      detail: "Advanced chips, equipment, and talent restricted",
    },
    {
      label: "Japan & Netherlands join controls",
      date: "Jan 2023",
      severity: "high",
      detail: "Multilateral alignment — ASML restricted",
    },
    {
      label: "SMIC achieves 7nm without EUV",
      date: "Sep 2023",
      severity: "elevated",
      detail: "Unexpected breakthrough via multi-patterning",
    },
    {
      label: "Controls updated — closing loopholes",
      date: "Oct 2023",
      severity: "high",
      detail: "HBM restrictions, cloud compute rules tightened",
    },
    {
      label: "Revenue-sharing deal replaces denial",
      date: "Aug 2025",
      severity: "moderate",
      detail: "Strategic pivot: controlled access over blockade",
      current: true,
    },
  ],
  thresholds: [
    {
      afterRungIndex: 1,
      label: "COMPREHENSIVE CONTROLS THRESHOLD",
    },
    {
      afterRungIndex: 3,
      label: "ADVERSARY ADAPTATION THRESHOLD",
    },
  ],
  source: "Bureau of Industry and Security, compiled",
  durationSec: 14,
};

export const EscalationLadderComposition = () => (
  <Composition
    id="EscalationLadder"
    component={EscalationLadder}
    schema={EscalationLadderSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec(
        (props.data as EscalationLadderData).durationSec || 12
      ),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData }}
  />
);

/**
 * OrgChart composition registration.
 *
 * Sample data: US Nuclear Command Authority chain.
 * Source: Doctrine for Joint Nuclear Operations (JP 3-72); DoD Nuclear Posture Review 2022.
 *
 * The NCA → SecDef → STRATCOM → delivery vehicles chain is the canonical
 * authority hierarchy example for this template. The JCS dashed advisory edge
 * (not in chain of command per Goldwater-Nichols 1986) and the Navy admin
 * chain demonstrate the "dashed = advisory/bypassed" convention.
 */

import { Composition } from "remotion";
import { OrgChart } from "./OrgChart";
import { OrgChartSchema } from "./schema";
import { standardMetadata } from "../../utils/composition";
import type { OrgChartData } from "./types";

export const orgChartSampleData: OrgChartData = {
  episode: "nuclear-command",
  title: "US NUCLEAR COMMAND AUTHORITY",
  subtitle: "Formal chain of command, strategic nuclear forces",
  source: "Doctrine for Joint Nuclear Operations (JP 3-72); DoD Nuclear Posture Review 2022",
  durationSec: 16,
  backgroundVariant: "light",
  rootId: "president",
  revealMode: "top-down",
  nodes: [
    {
      id: "president",
      label: "PRESIDENT",
      sublabel: "National Command Authority",
      type: "role",
      emphasis: "primary",
    },
    {
      id: "secdef",
      label: "SEC. OF DEFENSE",
      sublabel: "NCA co-authority",
      type: "role",
      emphasis: "primary",
    },
    {
      id: "jcs",
      label: "JOINT CHIEFS",
      sublabel: "Advisory (not in chain)",
      type: "committee",
      emphasis: "secondary",
    },
    {
      id: "stratcom",
      label: "US STRATCOM",
      sublabel: "CDRUSSTRATCOM",
      type: "role",
    },
    {
      id: "navsub",
      label: "SSBN FORCE",
      sublabel: "Sub-launched ballistic",
      type: "role",
    },
    {
      id: "afgsc",
      label: "AIR FORCE GSC",
      sublabel: "ICBM + bomber",
      type: "role",
    },
    {
      id: "navy",
      label: "SECRETARY OF NAVY",
      sublabel: "Administrative chain",
      type: "role",
      emphasis: "muted",
    },
  ],
  edges: [
    { from: "president", to: "secdef", style: "solid" },
    { from: "president", to: "jcs", style: "dashed", label: "advises" },
    { from: "secdef", to: "stratcom", style: "solid" },
    { from: "stratcom", to: "navsub", style: "solid" },
    { from: "stratcom", to: "afgsc", style: "solid" },
    { from: "navy", to: "navsub", style: "dashed", label: "admin." },
  ],
  highlightChain: ["president", "secdef", "stratcom"],
};

export const OrgChartComposition = () => (
  <Composition
    id="OrgChart"
    component={OrgChart}
    schema={OrgChartSchema}
    calculateMetadata={standardMetadata<OrgChartData>(16)}
    defaultProps={{ data: orgChartSampleData as OrgChartData }}
  />
);

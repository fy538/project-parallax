/**
 * SanctionsNetwork composition registration.
 *
 * Sample data: Russia sanctions architecture (2022–2024).
 *   - Sanctioners: USA, EU, UK, G7+
 *   - Target: Russia (energy + finance sectors)
 *   - Relay nodes: India, Turkey, UAE, China (third-country conduits)
 *   - Evasion paths: Russia → India/Turkey/UAE (shadow fleet, gas bypass, finance)
 *   - Institutions: SWIFT
 *   - Sectors: energy, finance, arms/dual-use, technology
 */

import { Composition } from "remotion";
import { SanctionsNetwork } from "./SanctionsNetwork";
import { standardMetadata } from "../../utils/composition";
import { SanctionsNetworkSchema } from "./schema";
import type { SanctionsNetworkData } from "./types";

export const sanctionsNetworkSampleData: SanctionsNetworkData = {
  episode: "silicon-trap",
  title: "THE RUSSIA SANCTIONS ARCHITECTURE",
  subtitle: "G7 primary sanctions + third-country relay conduits, 2022–2024",
  source:
    "US Treasury OFAC; EU Official Journal; Kiel Institute Ukraine Support Tracker; Reuters investigative reports",
  durationSec: 20,
  backgroundVariant: "dark",
  revealMode: "sequential",
  layout: "auto",
  sectors: [
    { id: "energy", label: "Energy", color: "#7AA3C9" },
    { id: "finance", label: "Finance", color: "#C4A747" },
    { id: "arms", label: "Arms / Dual-use", color: "#A64D46" },
    { id: "tech", label: "Technology", color: "#8B7355" },
  ],
  nodes: [
    {
      id: "usa",
      label: "USA",
      sublabel: "OFAC / Treasury",
      type: "sanctioner",
      importance: "primary",
      revealAtSec: 1.0,
    },
    {
      id: "eu",
      label: "EU",
      sublabel: "11 packages",
      type: "sanctioner",
      revealAtSec: 1.5,
    },
    {
      id: "uk",
      label: "UK",
      sublabel: "OFSI",
      type: "sanctioner",
      revealAtSec: 2.0,
    },
    {
      id: "g7-others",
      label: "G7+",
      sublabel: "Japan / Canada / Australia",
      type: "sanctioner",
      revealAtSec: 2.5,
    },
    {
      id: "russia",
      label: "RUSSIA",
      sublabel: "Target state",
      type: "target",
      importance: "primary",
      revealAtSec: 3.5,
    },
    {
      id: "swift",
      label: "SWIFT",
      sublabel: "Belgian interbank",
      type: "institution",
      revealAtSec: 4.0,
    },
    {
      id: "india",
      label: "India",
      sublabel: "Oil purchases ↑320%",
      type: "relay",
      importance: "primary",
      revealAtSec: 8.0,
    },
    {
      id: "turkey",
      label: "Turkey",
      sublabel: "Trans-Caspian route",
      type: "relay",
      revealAtSec: 9.0,
    },
    {
      id: "uae",
      label: "UAE",
      sublabel: "Re-export hub",
      type: "relay",
      revealAtSec: 10.0,
    },
    {
      id: "china",
      label: "China",
      sublabel: "Dual-use components",
      type: "relay",
      importance: "primary",
      revealAtSec: 11.0,
    },
    {
      id: "energy-sector",
      label: "Energy",
      type: "sector",
      sector: "energy",
      revealAtSec: 5.0,
    },
    {
      id: "finance-sector",
      label: "Finance / SWIFT",
      type: "sector",
      sector: "finance",
      revealAtSec: 5.5,
    },
  ],
  edges: [
    {
      from: "usa",
      to: "russia",
      type: "primary-sanction",
      label: "OFAC SDN list",
      sector: "finance",
      revealAtSec: 4.0,
    },
    {
      from: "eu",
      to: "russia",
      type: "primary-sanction",
      label: "Oil price cap",
      sector: "energy",
      revealAtSec: 4.5,
    },
    {
      from: "uk",
      to: "russia",
      type: "primary-sanction",
      sector: "finance",
      revealAtSec: 4.8,
    },
    {
      from: "usa",
      to: "swift",
      type: "primary-sanction",
      label: "SWIFT exclusion",
      sector: "finance",
      revealAtSec: 5.5,
    },
    {
      from: "usa",
      to: "india",
      type: "secondary-threat",
      label: "CAATSA exposure",
      revealAtSec: 7.5,
    },
    {
      from: "usa",
      to: "china",
      type: "secondary-threat",
      label: "Dual-use controls",
      revealAtSec: 7.8,
    },
    {
      from: "russia",
      to: "india",
      type: "evasion-path",
      label: "Shadow fleet oil ~3Mbbl/d",
      sector: "energy",
      animated: true,
      revealAtSec: 8.5,
    },
    {
      from: "russia",
      to: "turkey",
      type: "evasion-path",
      label: "Gas + commodity bypass",
      sector: "energy",
      animated: true,
      revealAtSec: 9.5,
    },
    {
      from: "russia",
      to: "uae",
      type: "evasion-path",
      label: "Financial intermediation",
      sector: "finance",
      animated: true,
      revealAtSec: 10.5,
    },
    {
      from: "china",
      to: "russia",
      type: "intermediary",
      label: "Dual-use components",
      sector: "tech",
      revealAtSec: 12.0,
    },
  ],
};

// Bound calculateMetadata for external use (e.g., Root.tsx when registered).
export const calculateMetadata = standardMetadata<SanctionsNetworkData>(20);

export const SanctionsNetworkComposition = () => (
  <Composition
    id="SanctionsNetwork"
    component={SanctionsNetwork}
    schema={SanctionsNetworkSchema}
    calculateMetadata={calculateMetadata}
    defaultProps={{ data: sanctionsNetworkSampleData as SanctionsNetworkData }}
  />
);

export { SanctionsNetwork, SanctionsNetworkSchema };
export type { SanctionsNetworkData };

/**
 * SplitComposition — Registration and sample composition.
 *
 * Exports the composition for registration in Root.tsx
 * and provides a sample data structure for quick reference.
 */

import { Composition } from "remotion";
import { SplitComposition } from "./SplitComposition";
import { layout, sec, semantic } from "../../design/theme";
import { SplitCompositionSchema } from "./schema";
import type { SplitCompositionData } from "./types";

const sampleData: SplitCompositionData = {
  episode: "EP00",
  title: "Two Readings of the Same Handshake",
  left: {
    tag: "WESTERN LENS",
    title: "Contractual Commitment",
    subtitle: "Binding agreement with enforcement mechanisms",
    items: [
      "Written terms define obligations",
      "Violation triggers legal consequences",
      "Trust is institutional, not personal",
      "The deal is the relationship",
    ],
    accentColor: semantic.us,
  },
  right: {
    tag: "CHINESE LENS",
    title: "关系 · Relational Web",
    subtitle: "The handshake begins a relationship, not a contract",
    items: [
      "面子 (face) governs compliance",
      "Obligations evolve with context",
      "Trust is relational and earned over time",
      "The relationship is the deal",
    ],
    accentColor: semantic.china,
  },
  dividerLabel: "vs",
  source: "Comparative diplomatic analysis",
  durationSec: 10,
};

export const SplitCompositionComposition = () => (
  <Composition
    id="SplitComposition"
    component={SplitComposition}
    schema={SplitCompositionSchema}
    calculateMetadata={({ props }) => ({
      durationInFrames: sec((props.data as SplitCompositionData).durationSec || 10),
      fps: layout.fps,
      width: layout.width,
      height: layout.height,
    })}
    defaultProps={{ data: sampleData }}
  />
);

import { Composition } from "remotion";
import { AnalogyCrossmap } from "./AnalogyCrossmap";
import { standardMetadata } from "../../utils/composition";
import { AnalogyCrossmapSchema } from "./schema";
import type { AnalogyCrossmapData } from "./types";

// Default props — Prisoner's Dilemma ↔ Nuclear Deterrence.
// The canonical Parallax bounded analogy: game-theory structure maps cleanly
// onto Cold War strategic doctrine in three places, then breaks at repeated-
// game dynamics (the PD is one-shot; deterrence is indefinitely iterated).
// Naming where it breaks is the editorial point — not killing the analogy,
// but bounding it. See project/PROJECT_VISION.md → "Bounded Analogy".
export const analogyCrossmapSampleData: AnalogyCrossmapData = {
  episode: "prisoners-dilemma",
  title: "THE STRUCTURAL MAPPING",
  subtitle:
    "Where game theory illuminates nuclear strategy — and where it misleads.",
  source:
    "Schelling, T. (1960). The Strategy of Conflict; Axelrod, R. (1984). The Evolution of Cooperation.",
  durationSec: 12,

  sourceDomain: {
    label: "Prisoner's Dilemma",
    subtitle: "Formal game theory",
  },
  targetDomain: {
    label: "Nuclear Deterrence",
    subtitle: "Cold War doctrine",
  },

  sourceElements: [
    {
      id: "mutual-defection",
      label: "Mutual Defection",
      description: "Both betray → both receive maximum sentence.",
    },
    {
      id: "cooperation",
      label: "Cooperation",
      description: "Both stay silent → shared gain, lowest joint cost.",
    },
    {
      id: "dominant-strategy",
      label: "Dominant Strategy",
      description: "Defect regardless of what the other player does.",
    },
    {
      id: "one-shot",
      label: "One-Shot Game",
      description: "Played once; no shadow of the future.",
    },
  ],

  targetElements: [
    {
      id: "mutual-strike",
      label: "Mutual Strike",
      description: "Both launch → both destroyed; no winner.",
    },
    {
      id: "detente",
      label: "Détente",
      description: "Mutual restraint → shared stability, arms-reduction gains.",
    },
    {
      id: "first-strike-logic",
      label: "First-Strike Logic",
      description: "Strike first before the adversary can retaliate.",
    },
    {
      id: "repeated-game",
      label: "Indefinitely Repeated",
      description: "Nations interact across decades; reputation compounds.",
    },
  ],

  mappings: [
    {
      sourceId: "mutual-defection",
      targetId: "mutual-strike",
      strength: "strong",
      label: "Maps to",
    },
    {
      sourceId: "cooperation",
      targetId: "detente",
      strength: "strong",
      label: "Maps to",
    },
    {
      sourceId: "dominant-strategy",
      targetId: "first-strike-logic",
      strength: "weak",
      label: "Partial",
    },
    {
      sourceId: "one-shot",
      targetId: "repeated-game",
      strength: "break",
      label: "Breaks here",
    },
  ],

  breakNote:
    "The analogy breaks at repeated-game dynamics. Nuclear deterrence is indefinitely iterated — reputations compound, reciprocity is possible, and cooperation can emerge from repeated interaction (Axelrod 1984). The classical PD is one-shot: no shadow of the future, no reputation, no Tit-for-Tat equilibrium. Applying PD to deterrence without this correction understates the stability of nuclear peace.",
};

// Named export of calculateMetadata for consumers that import it directly.
export const calculateMetadata = standardMetadata<AnalogyCrossmapData>(12);

export { AnalogyCrossmap } from "./AnalogyCrossmap";
export { AnalogyCrossmapSchema } from "./schema";
export type { AnalogyCrossmapData } from "./types";

export const AnalogyCrossmapComposition = () => (
  <Composition
    id="AnalogyCrossmap"
    component={AnalogyCrossmap}
    schema={AnalogyCrossmapSchema}
    calculateMetadata={calculateMetadata}
    defaultProps={{ data: analogyCrossmapSampleData as AnalogyCrossmapData }}
  />
);

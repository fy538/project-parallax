import { Composition } from "remotion";
import { PhilosophicalFamilyTree } from "./PhilosophicalFamilyTree";
import { standardMetadata } from "../../utils/composition";
import { PhilosophicalFamilyTreeSchema } from "./schema";
import type { PhilosophicalFamilyTreeData } from "./types";

/**
 * Default props — Game Theory Genealogy.
 *
 * Traces the five minds that built game theory from von Neumann's zero-sum
 * minimax (1944) through Ostrom's commons governance (1990). The 46-year span
 * encodes itself visually: Nash clusters near von Neumann; Axelrod and Ostrom
 * sit at the far right with meaningful distance from Schelling.
 */
export const philosophicalFamilyTreeSampleData: PhilosophicalFamilyTreeData = {
  episode: "game-theory-genealogy",
  title: "THE GAME THEORY GENEALOGY",
  subtitle:
    "Five minds, fifty years, one recursive insight: that cooperation is possible even among rivals.",
  source:
    "Poundstone, *Prisoner's Dilemma* (1992); Axelrod, *The Evolution of Cooperation* (1984)",
  durationSec: 16,
  backgroundVariant: "light",
  thinkers: [
    {
      id: "von-neumann",
      name: "VON NEUMANN",
      doctrine: "Minimax & zero-sum",
      year: 1944,
      importance: "primary",
    },
    {
      id: "nash",
      name: "NASH",
      doctrine: "Equilibrium",
      year: 1950,
      importance: "primary",
    },
    {
      id: "schelling",
      name: "SCHELLING",
      doctrine: "Focal points",
      year: 1960,
      importance: "primary",
    },
    {
      id: "axelrod",
      name: "AXELROD",
      doctrine: "Tit-for-tat",
      year: 1980,
      importance: "primary",
    },
    {
      id: "ostrom",
      name: "OSTROM",
      doctrine: "Commons governance",
      year: 1990,
      importance: "primary",
    },
  ],
  influences: [
    { from: "von-neumann", to: "nash", type: "borrowed", label: "formalism" },
    { from: "nash", to: "schelling", type: "transformed", label: "coordination" },
    { from: "nash", to: "axelrod", type: "borrowed", label: "equilibrium" },
    { from: "schelling", to: "axelrod", type: "borrowed", label: "repeated play" },
    { from: "axelrod", to: "ostrom", type: "transformed", label: "cooperation logic" },
    { from: "nash", to: "ostrom", type: "critique", label: "self-interest limit" },
  ],
};

export const PhilosophicalFamilyTreeComposition = () => (
  <Composition
    id="PhilosophicalFamilyTree"
    component={PhilosophicalFamilyTree}
    schema={PhilosophicalFamilyTreeSchema}
    calculateMetadata={standardMetadata<PhilosophicalFamilyTreeData>(16)}
    defaultProps={{
      data: philosophicalFamilyTreeSampleData as PhilosophicalFamilyTreeData,
    }}
  />
);

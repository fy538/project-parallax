import { Composition } from "remotion";
import { AxiomList } from "./AxiomList";
import { standardMetadata } from "../../utils/composition";
import { AxiomListSchema } from "./schema";
import type { AxiomListData } from "./types";

// Default props — the four assumptions of structural realism (Waltz 1979).
// The canonical "axiom list" of the realist IR school. Including one as
// "key" emphasis (the anarchy assumption — the foundational one) and one
// as "disputed" (the rationality assumption — what behavioralists reject).
export const axiomListSampleData: AxiomListData = {
  episode: "realist-foundations",
  title: "THE AXIOMS OF STRUCTURAL REALISM",
  subtitle: "The foundational assumptions Kenneth Waltz placed beneath the system.",
  source: "Waltz, K. (1979). Theory of International Politics.",
  framing:
    "Realist analysis presupposes four claims about the international system. Each is contestable; none is obvious.",
  axioms: [
    {
      text:
        "The international system is anarchic — no authority stands above states.",
      gloss: "The foundational assumption; everything else follows.",
      emphasis: "key",
    },
    {
      text:
        "States are the principal units; non-state actors operate within state-permitted bounds.",
    },
    {
      text:
        "States are rational unitary actors maximising security and survival.",
      gloss: "Disputed by behavioralists, bureaucratic-politics scholars, and constructivists.",
      emphasis: "disputed",
    },
    {
      text:
        "States cannot be certain of others' intentions, so capabilities matter more than declared aims.",
    },
  ],
  numbering: "arabic",
  durationSec: 16,
};

export const AxiomListComposition = () => (
  <Composition
    id="AxiomList"
    component={AxiomList}
    schema={AxiomListSchema}
    calculateMetadata={standardMetadata<AxiomListData>(14)}
    defaultProps={{ data: axiomListSampleData as AxiomListData }}
  />
);

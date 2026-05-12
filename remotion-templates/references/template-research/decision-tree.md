# Template Research Dossier — DecisionTree

> **Status: stub.** Full canonical-idioms research (NYT/FT/Economist references, perceptual rationale) is TODO. See `_FORMAT.md` for the target structure. The editorial purpose and failure modes below are derived from the SELECTOR doc and stress-testing notes.

## Editorial purpose

DecisionTree is the right answer when the editorial point is **sequential choice under uncertainty** — one actor moves, the opponent (or fate) responds, and the drama is in the *branching*. The form encodes "what if X chose Y" at every node. It is distinct from GameBoard (simultaneous moves, Nash equilibrium) and from FrameworkDiagram flow (deterministic A→B→C without choice). Canonical use cases: forecasting under contingency, Allison-style ExComm deliberation, chess-opening trees, escalation paths where each rung has a counterfactual.

## Canonical idioms

- **Extensive-form horizontal tree** — root on the left, time/choices flow right. The implicit time axis privileges branching drama. (TODO: NYT/FT references.)
- **Allison nested rectangles ("ladder" variant)** — top-level options render as stacked panels; child nodes nest indented inside their parent's panel. Right when the editorial point is "decision-maker X weighed these options" (ExComm 1962, Politburo deliberation). Privileges the actor's deliberative frame rather than abstract probability space. (TODO: real-world reference.)
- **Qualitative-label branches** — "Mainline / Sharp / Likely" rather than invented percentages. The dossier failure mode is "invented probabilities are worse than no probabilities."

## Parallax defaults

- Use `variant: "extensive"` (default) for contingency / scenario branching; use `variant: "ladder"` when the editorial frame is a specific actor's deliberation.
- Keep `probabilityWeights: false` (the default) unless every numeric `%` in `nodes[].probability` traces to a named source in `data.source`. The schema automatically suppresses numeric strings matching `/\d+\s*%/` when this gate is off; qualitative labels always render.
- Mark the protagonist branch with `highlightedPath: [...]` and a `highlightColor` so the focal narrative is unambiguous. Mark the current "you are here" node with `active: true`.
- Author an explicit `cameraPath` for any tree wider than ~4 leaves. The auto-generated default (root close-up → branch reveal → leaf paths → pullback) is fine for small trees but reads as inventory when the tree is dense.
- Cap depth at ~3 levels × 2 branches (≈12 terminals) per the SELECTOR. Beyond that, split into staged compositions or demote the deep tail to a tabular DataChart.

## Failure mode flags

- **Numeric `%` probabilities with `probabilityWeights: false` AND no `data.source`** — the schema currently strips these; if the script depends on the percentage landing, either cite a source and flip the gate, or rewrite to a qualitative label.
- **Numeric `%` probabilities with `probabilityWeights: true` but no `data.source`** — "invented probabilities are worse than no probabilities." Reject in audit.
- **Simultaneous-move scenarios rendered as DecisionTree** — wrong template. The math is Nash equilibrium, not expected value. Route to GameBoard.
- **Tree with no `highlightedPath` and no `active` node** — reads as inventory of possibilities rather than an argument with a protagonist branch.
- **Depth exceeding ~12 terminals** — visual collapses; viewer can't track. Split or demote.
- **Missing `cameraPath` on dense trees** — auto-path won't earn the branching drama; the eye doesn't know where to land.

## Current template alignment

The `probabilityWeights` editorial gate (added per dossier guidance) matches canon: numeric percentages are suppressed by default unless explicitly opted-in. No runtime `warnIf` exists yet for the failure modes above — they must be caught by the `diagram-audit` skill. TODO: full canonical-idioms research (NYT contingency-tree references, perceptual rationale for horizontal vs. ladder).

## References

- `DIAGRAM_TEMPLATE_SELECTOR.md` — selection wall-table
- `src/templates/DecisionTree/types.ts` — schema reference
- `diagram-audit` skill — runtime audit lens
- `references/template-research/game-theory.md` § A2 (Allison nested rectangles), § A4 (probability discipline)

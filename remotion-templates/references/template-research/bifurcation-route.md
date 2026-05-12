# Template Research Dossier — BifurcationRoute

> **Status: stub.** Full canonical-idioms research (NYT/FT/Economist references, perceptual rationale) is TODO. See `_FORMAT.md` for the target structure. The editorial purpose and failure modes below are derived from the SELECTOR doc and stress-testing notes.

## Editorial purpose

BifurcationRoute is the right answer when the editorial point is **a unified system splitting into two incompatible paths** — decoupling, schism, fork, scenario divergence. The form encodes a *before-and-after of integration*: nodes that were once connected end up in mutually-exclusive networks. Canonical Parallax use: semiconductor decoupling (one TSMC supply chain → US-aligned vs. China-aligned), monetary-system fork (one dollar-clearing system → SWIFT-aligned vs. CIPS-aligned), alliance schism. Distinct from DecisionTree (which branches recursively at every node) and DuelingFrameworks (head-to-head conceptual comparison, not a temporal split).

## Canonical idioms

- **Unified-phase → fork → two networks** — the visual argument is the *break point*. The fork node carries the analytical weight; the two terminal networks read as consequences. (TODO: NYT/FT decoupling-diagram references.)
- **Color-coded networks** (US-blue / China-red, or equivalent semantic palette) so the eye distinguishes the two post-split sides at a glance. (TODO: references.)
- **Cinematic split animation** — when the post-fork separation is the editorial peak, a camera move toward the fork point + spatial separation animation earns the moment. Reserved for genuinely consequential decoupling beats.

## Parallax defaults

- Always set `forkNodeId` to the node where the split actually happens. Without it the bifurcation reads as two unrelated networks rather than a divergence from a common origin.
- Use `network: "unified"` for pre-fork nodes and `"networkA"` / `"networkB"` for post-fork nodes. Same on `links[].phase` — `"unified"` for pre-fork links, `"split"` for post-fork.
- Provide `networkALabel` / `networkBLabel` that name the *consequence*, not the *direction* ("US-aligned semiconductor stack" beats "Network A"). Set `networkAColor` / `networkBColor` to semantic palette tokens when the sides have political/geographic identity.
- Reserve `cinematicMode: true` for one or two moments per episode where the split is the editorial peak. Default cinematic-off composition reads as analytical; cinematic-on reads as dramatic — overuse flattens both.
- Use `ambientParticles: true` sparingly — atmosphere, not decoration. If every BifurcationRoute in the episode has particles, none of them feel particular.

## Failure mode flags

- **More than two post-fork networks** — the form is *bifurcation*, not trifurcation. Three sides should route to FrameworkDiagram (comparison) or a sequence of staged BifurcationRoutes.
- **Missing `forkNodeId`** — the structural argument evaporates; renders as two parallel networks with no shared origin.
- **Pre-fork links marked `phase: "split"` (or vice versa)** — timeline animation collapses; the before/after legibility is the whole point.
- **Generic "Network A / Network B" labels** — viewer can't recall what side they're looking at 5 seconds later. Name the consequences.
- **`cinematicMode` on every BifurcationRoute in the episode** — register inflation; the dramatic split is no longer particular.
- **Decorative `ambientParticles`** — atmosphere without editorial reason reads as filler.

## Current template alignment

No runtime `warnIf` exists yet for these failure modes — caught by `diagram-audit` skill or visual review. The schema correctly distinguishes phase + network on nodes and links, and supports a `unifiedDurationSec` to control the hold before split animation. TODO: full canonical-idioms research and references for the decoupling-diagram genre.

## References

- `DIAGRAM_TEMPLATE_SELECTOR.md` — selection wall-table
- `src/templates/BifurcationRoute/types.ts` — schema reference
- `diagram-audit` skill — runtime audit lens

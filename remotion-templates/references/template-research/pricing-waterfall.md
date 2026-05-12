# Template Research Dossier — PricingWaterfall

> **Status: stub.** Full canonical-idioms research (NYT/FT/Economist references, perceptual rationale) is TODO. See `_FORMAT.md` for the target structure. The editorial purpose and failure modes below are derived from the SELECTOR doc and stress-testing notes.

## Editorial purpose

PricingWaterfall is the right answer when the editorial point is **a fixed total decomposed into stage segments, where the punchline is the disproportion** — "3% to the farmer, 47% to the retailer." The form encodes value-capture extraction: a single anchor the viewer already understands ($1, $5, $100) split across a value chain, with the smallest sliver rendered in accent color so the editorial argument lands visually before the viewer reads the number. Distinct from SankeyFlow (which encodes flow between many nodes; reads as infographic rather than argument at video scrubbing speed) and from FrameworkDiagram flow (which has no value-math, just sequence).

## Canonical idioms

- **Single-anchor decomposition** ($1 cup of coffee, $5 latte, $100 iPhone) with stages bottom-up so the bar visually "builds" through the value chain. The fixed total is the perceptual anchor — Cleveland's position-along-a-common-scale on a denominator the viewer holds in their head. (TODO: FT iPhone-breakdown, Bloomberg Opinion oil/cocoa, Reuters cocoa-pricing, SCA farmgate-share references.)
- **Hero sliver in accent color** — the smallest (or most editorially-loaded) segment marked `hero: true` renders in accent with a glow + label emphasis. The form's argument *is* the contrast between the hero sliver and the rest of the bar. (TODO: Fair Trade USA penny-breakdown references.)
- **Descriptor row** — each stage carries an optional `descriptor` (location, role, or detail like "Yirgacheffe, Ethiopia") that grounds the abstraction in real-world specificity. (TODO: references.)

## Parallax defaults

- Always set exactly one stage as `hero: true` — the editorial protagonist. The whole template depends on the hero-vs-rest contrast; without it the visual reads as inventory.
- Stages should sum to ~100. A bar that doesn't close the loop reads as broken; if rounding creates a residual, fold it into the largest non-hero stage or add a "Other" terminal.
- Cap at 5–7 stages. Above that, slivers become unreadable and the hero sliver loses its visual distinctiveness.
- Use the `total.value` / `total.label` pair to anchor the viewer in the denominator they already understand ("$5", "of every $5 cup of coffee"). Generic totals ("100 units") destroy the perceptual anchor.
- Reserve `color` overrides on non-hero stages for cases where one mid-chain stage carries secondary analytical weight (e.g., the customs/tax slice in a tariff decomposition). Otherwise let the muted-bone default carry the rest of the bar.
- Always provide `source` when the breakdown cites real data (FT, SCA, Reuters). PricingWaterfall is a quantitative-claim form; uncited it reads as guesswork.

## Failure mode flags

- **No stage marked `hero: true`** — the editorial punch is missing; viewer sees a stacked bar without an argument.
- **Multiple `hero: true` stages** — focal hierarchy destroyed; both highlights compete and neither lands.
- **Stages not summing to ~100** — bar reads broken; viewer notices the missing slice and loses trust in the math.
- **More than ~7 stages** — slivers unreadable; hero sliver no longer distinctive.
- **Generic `total.label`** ("100 units of value") — perceptual anchor evaporates; the form depends on the viewer holding the denominator in their head.
- **Missing `source` when the breakdown cites real data** — quantitative claim without attribution; reject in audit.
- **Decorative color overrides** on multiple stages — destroys the muted-bone-plus-hero-accent hierarchy.

## Current template alignment

No runtime `warnIf` exists yet (the template was built May 2026; runtime warnings are a follow-up). The schema correctly enforces the single-anchor pattern via the `total` object and the hero-sliver convention via `stages[].hero`. The SELECTOR mode-flags table currently references an `accentSliver` flag — that's stale; the actual field is `stages[].hero: boolean`. TODO: full canonical-idioms research (FT/Bloomberg/Reuters/SCA references already identified in `CLAUDE.md`'s template description), perceptual-rationale paragraph on Cleveland's position-along-a-common-scale.

## References

- `DIAGRAM_TEMPLATE_SELECTOR.md` — selection wall-table
- `src/templates/PricingWaterfall/types.ts` — schema reference
- `diagram-audit` skill — runtime audit lens
- `remotion-templates/CLAUDE.md` § Known gaps — captures the editorial-outlet convergence on this idiom

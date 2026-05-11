# Template Research Dossier — Format

Each dossier captures how state-of-the-art editorial outlets (NYT Upshot, FT, Economist, Bloomberg, Reuters Graphics, NYT Magazine, Pudding) handle the visualization form a single Parallax template addresses. The dossier serves as the canonical reference for that template's design decisions — read before polish work, cited in audit findings, updated when a new convention is observed.

## Required sections per dossier

1. **The form's editorial purpose** — one paragraph naming what the viz is *for* (not what it looks like). Should answer: "When the editorial point is X, this is the form you reach for."

2. **Canonical idioms (3–5)** — the established visual variants outlets converge on. For each:
   - Name (specific, e.g. "horizontal lollipop with terminal value")
   - 1–2 specific real-world references with outlet + year + topic
   - Why it works for the use case (1–2 sentences)
   - Failure modes / when it's wrong (1 sentence)

3. **General principles** — short paragraph on the design-theory backing (Cleveland / Tufte / Healy / Munzner where relevant). What's the perceptual rationale?

4. **Recommendation for Parallax** — opinionated pick. Which idiom should be the default given the channel voice (narration-first, paper-on-desk, muted earth-tone palette, ~10s scrubbing speed)?

5. **Current template alignment** — how the existing Parallax template renders compared to the canon. Where does it match? Where does it diverge? Diverge intentionally or accidentally?

6. **Specific upgrades proposed** — 3–5 actionable changes to the existing template, ranked by effort/impact.

7. **Failure mode flags** — patterns to ALWAYS catch in audit (e.g., "ChoroplethMap with categorical-not-quantitative data" → use a different form).

## Naming convention

`references/template-research/<template-name-kebab>.md`

Examples: `data-chart.md`, `time-series-chart.md`, `framework-diagram.md`, `sankey-flow.md`, `choropleth-map.md`, `route-animation.md`.

## When to update

- New outlet convention spotted in the wild → update the relevant dossier
- New variant added to a template → update before shipping
- Audit run reveals a pattern the dossier didn't cover → add it
- Doctrine (`POLISH.md`) updated with a rule that derived from a dossier → cross-reference

These are living docs. Date major revisions inline.

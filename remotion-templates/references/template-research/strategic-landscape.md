# Template Research Dossier — StrategicLandscape

> **Status: stub.** Full canonical-idioms research (NYT/FT/Economist references, perceptual rationale) is TODO. See `_FORMAT.md` for the target structure. The editorial purpose and failure modes below are derived from the SELECTOR doc and stress-testing notes.

## Editorial purpose

StrategicLandscape is the right answer when the editorial point is **where actors sit on two independent continuous axes** — capability × intent, short-term × long-term, openness × stability. The form encodes a *positional argument*: "these actors cluster here, that one is the outlier." Distinct from FrameworkDiagram (matrix) — which uses two axes to define four discrete typological cells, not continuous positions — and from NetworkDiagram, which encodes peer-to-peer connection rather than 2D position.

## Canonical idioms

- **Two-axis bubble plot with quadrant labels** — actors as labeled bubbles positioned in continuous (x, y) space, with optional quadrant captions (TL/TR/BL/BR) to name the regions. The bubble *position* carries the argument; size is secondary. (TODO: Economist/FT references for the strategic-position genre.)
- **Bilingual actor labels (US / 美国)** for episodes engaging Chinese-language sources. Supported via `nameCn`. (TODO: outlet references.)
- **Quadrant-named landscape** — when each quadrant has an analytical name ("Hawks", "Realists", "Doves", "Idealists"), the labels become first-class editorial content. (TODO: references.)

## Parallax defaults

- Cap actors at ≤ 8 bubbles. Above that, labels collide and the clustering argument fades into "many things in a plane."
- Use `quadrantLabels` whenever the four regions carry analytical meaning. A landscape without quadrant labels is just a scatterplot and probably belongs in the Charts family.
- Reserve `color` overrides for protagonists vs. context actors — the focal entity should read at a glance. Avoid using `color` decoratively (one bubble per color erodes the focal-point convention).
- Keep `xAxisLabel` / `xAxisLabelEnd` and `yAxisLabel` / `yAxisLabelEnd` parallel in grammar ("Aggressive ↔ Cooperative", not "Aggressive ↔ Wants Peace") — viewers parse opposed pairs faster than mismatched ones.
- Use `icon` (≤ 3-char abbreviation like "US", "CN", "EU") sparingly — it competes with `name` for legibility inside the bubble; pick one or the other per composition.

## Failure mode flags

- **More than ~8 actors** — bubble-label collisions; the clustering argument is lost. Cap or split.
- **Axes that aren't truly independent** — if "capability" and "intent" co-vary in the data, the matrix collapses to a line. Use a DataChart with regression instead, or pick genuinely orthogonal axes.
- **No quadrant labels when the quadrants carry meaning** — viewer has to mentally name the regions; do it for them.
- **Decorative color assignment** — one color per bubble destroys focal hierarchy. Use color to encode group or to single out the protagonist.
- **Asymmetric axis-label pairs** — "Authoritarian ↔ Prosperous" doesn't parse as opposed. Re-frame to a clean opposition.
- **Categorical data on a continuous axis** — "Strong / Medium / Weak" should be Likert-scaled or moved to a different form (StrategicLandscape implies continuous position).

## Current template alignment

No runtime `warnIf` exists yet for these failure modes — they must be caught by the `diagram-audit` skill or visual review. The schema supports the bilingual `nameCn` field and quadrant labels matching canon; the rest is editorial discipline. TODO: full canonical-idioms research and a perceptual-rationale paragraph on why 2D position is high-bandwidth for "who clusters with whom."

## References

- `DIAGRAM_TEMPLATE_SELECTOR.md` — selection wall-table
- `src/templates/StrategicLandscape/types.ts` — schema reference
- `diagram-audit` skill — runtime audit lens

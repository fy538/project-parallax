# Template Research Dossier — SplitComposition

> **Status: stub.** Full canonical-idioms research (NYT/FT/Economist references, perceptual rationale) is TODO. See `_FORMAT.md` for the target structure. The editorial purpose and failure modes below are derived from the SELECTOR doc and stress-testing notes.

## Editorial purpose

SplitComposition is the right answer when the editorial point is **two things in stark opposition** — Soviet vs. American factory floor, thesis vs. antithesis, Western lens vs. Chinese lens. The form encodes a *visual or conceptual opposition*, vertically split down the center with a divider. Distinct from FrameworkDiagram (comparison) — which compares attribute-by-attribute in parallel rows — and from DuelingFrameworks — which judges two theoretical models against a phenomenon. SplitComposition is the typography/layout cousin: the visual division itself is the argument.

## Canonical idioms

- **Two-side vertical split with center divider + "vs" label** — left and right each get title, optional subtitle, staggered items, optional tag ("WESTERN LENS", "THESIS"). The divider is the visual fulcrum. (TODO: NYT / Economist split-essay references.)
- **Tagged sides** (e.g., "THESIS" / "ANTITHESIS", "1950" / "2024") — the small mono tag at the top of each side establishes the register before the eye reads the items. (TODO: references.)
- **Color-tinted sides** — when the opposition is partisan or geographic (US-blue / China-red), per-side `accentColor` and `bgTint` shift the visual temperature without overpowering the type. Reserve for cases with genuine semantic color; avoid decorative tinting. (TODO: references.)

## Parallax defaults

- Exactly two sides — `left` and `right`. The form is *opposition*. Three or more requires FrameworkDiagram (comparison) or matrix.
- Use `tag` on both sides in parallel grammar ("WESTERN LENS" / "CHINESE LENS", not "WESTERN LENS" / "Beijing's view"). Asymmetric tags break the stark-opposition register.
- Keep `items` counts parallel between sides (3 vs. 3, not 5 vs. 2) — the runtime warns on item imbalance, and the SELECTOR flags this as a failure mode.
- Use `dividerLabel: "vs"` (the default) for true opposition; use a date or arrow for transformation ("1950 → 2024"); use `noDivider: true` only when the two sides are complementary rather than opposed.
- Reserve `cinematicMode: true` for the moment when the opposition is the editorial peak — progressive spotlight per side. Default-off for survey beats.
- Use `accentColor` per side with genuine semantic meaning. Decorative one-color-per-side flattens both into "decorated halves."

## Failure mode flags

- **3+ sides** — not possible in schema (left/right only) but if the script asks for three, route to FrameworkDiagram (comparison or matrix).
- **Item-count imbalance** — runtime `warnIf` already catches this. One side padded with filler reads as one side being given more shelf space.
- **Asymmetric tag grammar** (e.g., "THESIS" + "Beijing's perspective") — breaks register.
- **Identical visual weight on both sides when one is the protagonist** — viewer doesn't know where the focal argument lives. Use accent / cinematic per-side spotlight to mark the focal side.
- **Decorative color tints** (per-side `bgTint` without semantic justification) — register inflation.
- **Generic divider label** ("vs") on transformations or complementary pairs — the form implies opposition; mislabel breaks the argument.
- **`noDivider: true` on true oppositions** — kills the visual fulcrum that makes the form work.

## Current template alignment

Runtime `warnIf` already catches item-count imbalance between left and right sides (per the typography-family review in the SELECTOR). No runtime warning yet for the asymmetric-tag-grammar or generic-divider-label patterns — caught by `typography-audit` skill. The Typography SELECTOR's mode-flags table currently references a `protagonistMode` field — that field does not exist in `types.ts`; the protagonist signaling is currently done via `accentColor` / `cinematicMode`. TODO: full canonical-idioms research and references for the split-essay genre.

## References

- `TYPOGRAPHY_TEMPLATE_SELECTOR.md` — selection wall-table
- `src/templates/SplitComposition/types.ts` — schema reference
- `typography-audit` skill — runtime audit lens

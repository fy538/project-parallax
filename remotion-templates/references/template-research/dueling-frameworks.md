# Template Research Dossier — DuelingFrameworks

> **Status: stub.** Full canonical-idioms research (NYT/FT/Economist references, perceptual rationale) is TODO. See `_FORMAT.md` for the target structure. The editorial purpose and failure modes below are derived from the SELECTOR doc and stress-testing notes.

## Editorial purpose

DuelingFrameworks is the right answer when the editorial point is **two competing theoretical models analyzed head-to-head**, with the episode arriving at a verdict on which one fits the phenomenon better. Canonical use: Realism vs. Liberalism on the South China Sea, Tributary System vs. Westphalian Sovereignty on Sino-foreign relations, Modernization Theory vs. Dependency Theory on development. Distinct from SplitComposition (visual / image opposition, no scoring), from FrameworkDiagram comparison (attribute-by-attribute table without a verdict), and from BifurcationRoute (temporal split of one system, not two independent models).

## Canonical idioms

- **Two frameworks with tenets + score + verdict** — each framework gets a name, a list of tenets, an explanatory-power score (0–100), and an optional verdict line. The composition resolves into a *judgment*, not a neutral comparison. (TODO: real-world references for the head-to-head theory-essay genre.)
- **Bilingual framework names and tenets** (`nameCn`, `tenets[].textCn`) when the episode engages Chinese-language scholarship. The bilingual capacity matters editorially — naming a framework only in English when Chinese theorists named it first is a register break. (TODO: outlet references.)
- **Cinematic horizontal camera** — when the verdict is the editorial peak, `cinematicMode: true` enables a camera that tracks between frameworks before landing on the verdict. Reserved for argument-essay moments, not survey beats.

## Parallax defaults

- Use the `phenomenon` field to anchor what the two lenses are explaining ("Why China didn't escalate over the 1996 Taiwan Strait crisis"). Without it, the comparison floats — viewer doesn't know what either framework is being judged against.
- Keep `frameworkA.tenets` and `frameworkB.tenets` to 3–5 each and parallel in grammar. Asymmetric tenet counts read as one framework being given more shelf space.
- Use `score` honestly — both frameworks should not score 90+. The form's analytical credibility depends on the scores actually discriminating. Two near-equal scores work when the verdict is "both partial."
- Set `verdict` and `verdictLabel` ("Which lens fits better?") when the episode reaches a judgment. Skip them when the analytical point is "both have purchase here."
- Reserve `cinematicMode: true` for the verdict-essay format; in survey or 101-explainer beats, leave it off — the cinematic camera implies high stakes.
- Use distinct `color` per framework (semantic where possible — IR-realism rust, IR-liberalism amber). Avoid letting both frameworks share an accent color; the visual opposition disappears.

## Failure mode flags

- **Missing `phenomenon`** — the two frameworks float; viewer can't tell what they're competing to explain.
- **Non-parallel tenet lists** (e.g., 6 tenets vs. 2) — implies editorial bias even when none is intended.
- **Both `score` values in the 90s with no actual differentiation** — the score loses meaning; remove or use score = 50/50 for "both partial."
- **Verdict without supporting tenet contrast** — judgment arrives without evidence; viewer can't see *why* one framework wins.
- **`cinematicMode: true` on every DuelingFrameworks beat** — dramatic camera loses its weight.
- **Color collision** (both frameworks in similar hues) — the head-to-head visual opposition collapses.
- **English-only framework names when the originating theorists wrote in Chinese** (or vice versa) — register break; set `nameCn` / `nameEn` accordingly.

## Current template alignment

No runtime `warnIf` exists yet for these failure modes — caught by `diagram-audit` skill or visual review. Schema supports bilingual fields throughout (`titleCn`, `subtitleCn`, `phenomenonCn`, `verdictLabelCn`, per-tenet `textCn`, per-framework `nameCn`, per-framework `verdictCn`) which matches the channel's Translator / Dialectician format requirements. TODO: full canonical-idioms research and references for the head-to-head theory-essay genre.

## References

- `DIAGRAM_TEMPLATE_SELECTOR.md` — selection wall-table
- `src/templates/DuelingFrameworks/types.ts` — schema reference
- `diagram-audit` skill — runtime audit lens

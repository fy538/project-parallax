# Template Research Dossier — KineticTypography

> **Status: stub.** Full canonical-idioms research (NYT/FT/Economist references, perceptual rationale) is TODO. See `_FORMAT.md` for the target structure. The editorial purpose and failure modes below are derived from the SELECTOR doc and stress-testing notes.

## Editorial purpose

KineticTypography is the right answer when the editorial point is **a piece of text that IS the visual** — a pull quote, a foreign-term definition with pronunciation, a bilingual citation, a single hero statistic with no comparison context. The form treats words as the artifact rather than as caption to an image. Distinct from TitleTransition (structural moments — episode opens, chapter breaks, end cards) and from StatReveal (when the statistic's *magnitude vs. comparison context* is the editorial point; StatReveal renders comparison bars, KineticTypography does not).

**Scope guardrail:** KineticTypography is NOT a title-card stand-in. The kinetic motion breaks structural register. Use TitleTransition for episode / chapter / end-card moments.

## Canonical idioms

- **Pull quote with attribution** (`variant: "quote"`) — text + attribution + optional attribution-context line. "Two prisoners, four outcomes" — Tucker, RAND, 1950. Quote without attribution is forbidden (context evaporates). (TODO: NYT Magazine / Atlantic pull-quote references.)
- **Bilingual definition** (`variant: "bilingual"` or `"definition"`) — Chinese term + pinyin + English translation + definition text, staggered so the eye knows where to land. "卡脖子 / kǎ bózi / Stranglehold technology." The bilingual capacity is editorially core to the channel's Translator format. (TODO: references.)
- **Hero statistic without context** (`variant: "statistic"`) — single number + label + optional context line. "7% / of US chip demand / Despite $165B investment." Right when the number stands alone; wrong when the magnitude requires comparison bars (route to StatReveal). (TODO: references.)

## Parallax defaults

- Always set `variant` explicitly — the four variants render different layouts and validation differs.
- For `variant: "quote"`: `text` + `attribution` are mandatory in practice; the `attributionContext` line ("Founder of TSMC, 2024") is optional but earns the moment.
- For `variant: "bilingual"` / `"definition"`: never animate Chinese + English simultaneously. Stagger so the eye lands first on one, then the other. The schema fields (`term`, `termPinyin`, `termTranslation`, `definitionText` for definitions; `chineseText`, `englishText` for bilingual) imply the order.
- For `variant: "statistic"`: if the editorial point requires comparison bars, switch to StatReveal (Charts family). KineticTypography statistic is for the standalone-number case.
- Use `accentColor` sparingly — one accent moment per composition, not every line. The default ink-on-paper is the register; accent is a punctuation mark.
- Use `backgroundTint` for emotional temperature (US-blue, China-red) only when the geopolitical register demands it. Default tint-less for analytical-essay register.

## Failure mode flags

- **Quote variant without `attribution`** — P0 reject. Quote evaporates without context.
- **Statistic variant when the editorial point needs comparison bars** — wrong template; use StatReveal.
- **Used as a section title** — wrong register; the kinetic motion breaks structural moments. Use TitleTransition.
- **Bilingual variant animating Chinese + English simultaneously** — the eye doesn't know where to land. Stagger.
- **Accent color on every line** — accent loses meaning. Reserve for one moment per composition.
- **`backgroundTint` used decoratively** (not tied to geopolitical or emotional register) — register inflation.
- **Mismatched fields for variant** (e.g., setting `text` + `attribution` on `variant: "statistic"`) — schema accepts it but the template ignores the fields; reject in audit.

## Current template alignment

The template carries a scope-guardrail docstring in `KineticTypography.tsx` flagging it as NOT FOR TITLE CARDS with a cross-reference to `TitleTransition.editorial-title` (added May 11, 2026). No runtime `warnIf` exists yet for the failure modes above — caught by the `typography-audit` skill. The Typography SELECTOR's mode-flags table currently lists an `emphasis` flag for KineticTypography — that field does not exist in `types.ts`. TODO: full canonical-idioms research, perceptual rationale for kinetic emphasis vs. structural-moment registers.

## References

- `TYPOGRAPHY_TEMPLATE_SELECTOR.md` — selection wall-table
- `src/templates/KineticTypography/types.ts` — schema reference
- `typography-audit` skill — runtime audit lens
- `references/template-research/title-card.md` — the structural-moment companion dossier

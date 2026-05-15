# Template Research Dossier — KineticTypography

> Last updated: May 15, 2026

## 1. Editorial purpose

KineticTypography is the form to reach for when **the text itself is the visual argument** — not caption to an image, not structural signpost, but words as artifact. The four variants map to four editorial moments: a pull quote whose phrasing carries the argument's emotional weight (quote); a foreign term whose untranslatability is itself the point (definition/bilingual); a single number so large or so small it needs room to breathe (statistic). What distinguishes this form from TitleTransition (structural register) or StatReveal (comparative register) is the kinetic emphasis — spring physics, parallax depth layers, character-by-character or word-by-word reveal — which signals to the viewer that this is the essay pausing on something worth re-reading, not a chapter break or a chart. Use it when you want the viewer to hold a phrase in memory, not merely note it.

## 2. Canonical idioms

### 2a. Pull quote — centered, white-on-black (NYT T Magazine / The Atlantic register)

NYT T Magazine (2019–2024, fashion/culture profiles) and The Atlantic's interactive essays routinely present a pull quote as a full-screen or half-screen moment: large serif body text, white or cream on black, centered, with the attribution in a lighter-weight italic below. The form creates a momentary pause from the flow of argument — editorial punctuation. The Atlantic's "The Coddling of the American Mind" interactive (2017) exemplified this: a 3-second full-bleed quote interrupting a scroll-driven narrative, attribution in small caps below. Why it works: maximum contrast, no competing visual noise, the phrase lands clean.

Failure mode: quote without attribution. The phrasing loses its authority; the viewer can't evaluate credibility. P0 reject.

### 2b. Definition callout — term + pronunciation + gloss (The Economist register)

The Economist has long used in-article definition boxes for economic jargon: the term in bold, a one-clause gloss in roman text, often with etymology or region of use. In video contexts (e.g., The Economist's "The World in Brief" animated shorts, 2022–2024), this translated into a two-beat reveal: term first (large, held), then gloss below (fades in). Foreign Affairs adapts this for bilingual terms in its China coverage — a Chinese-character term with pinyin romanization beside it, English translation below, definition paragraph in body weight. Why it works: the staged reveal mirrors how a dictionary entry scans — term, pronunciation, meaning — and respects the viewer's cognitive load by not serving all information simultaneously.

Failure mode: animating term and definition simultaneously. The eye doesn't know where to land. The staging IS the clarity.

### 2c. Bilingual citation — Chinese → English stagger (Foreign Affairs / The Wire China register)

Foreign Affairs and The Wire China, covering Chinese political economy, regularly present Chinese-character terms followed by their romanization and English gloss as a distinct typographic moment — not inline in body text but as a set piece. The visual hierarchy is clear: Chinese character(s) large and bold (the foreign signifier); pinyin in italic mono below (the phonetic key); English translation in a lighter weight (the decoded meaning). The stagger — Chinese holds for ~2 seconds before English arrives — mirrors the cognitive experience of encountering an untranslatable term: first the shape, then the sound, then the meaning. Why it works: the visual hierarchy encodes the epistemics. Parallax's 卡脖子 definition beat uses exactly this register.

Failure mode: Chinese and English appearing simultaneously. The stagger is not decorative; it's the argument.

### 2d. Hero statistic — oversized number, minimal context (Bloomberg Opinion / Reuters Graphics register)

Bloomberg Opinion's "big number" essays (e.g., "$2 Trillion: The True Cost of US Chip Policy," 2023) and Reuters Graphics' infographic shorts isolate a single figure at headline scale with one subordinate line of context in a smaller weight. The number arrives first via a count-up, then the label beneath. Why it works: the count-up creates anticipation; the overshoot-and-settle gives the number physical weight. The form works because one number, given that much visual space, earns the viewer's attention before the argument resumes. At scrubbing speed (~10s), a viewer who misses the narration still catches the number.

Failure mode: using this form when the editorial point is magnitude relative to comparison (e.g., "5× the previous record"). That requires StatReveal with comparison bars. KineticTypography statistic is only for the standalone case — the number that stands alone because its absolute scale IS the point.

## 3. General principles

The perceptual case for kinetic typography in video rests on attention and memory encoding. Animated text outperforms static text in short-term recall at video scrubbing speed (Mayer, 2001; Zacks, 2014 event-segmentation work) — the motion flags the moment as a segment boundary worth encoding. The kinetic reveal (letter-by-letter, word-by-word, or count-up) exploits the Zeigarnik effect: viewers attend to incomplete sequences. The key constraint is duration: the kinetic entrance must complete before the viewer loses patience, typically within 2–3 seconds, leaving hold time for the phrase to register. Parallax's parallax depth layers (quote mark at 1.5× drift, text at 1.0×, attribution at 0.6×) add a spatial register that increases perceived production quality without adding cognitive load — the depth hierarchy reinforces the typographic hierarchy (hero quote mark, body quote, citation), so the viewer doesn't have to work to find the reading order.

## 4. Recommendation for Parallax

The default should be the quote variant with `backgroundVariant: "dark"` for dramatic moments (Morris Chang quote, Cold War statesman citation) and `backgroundVariant: "light"` for analytical ones (definition reveals, moderate statistics). IBM Plex Serif for the quote body signals long-form essay register, not a social-media caption. The attribution in IBM Plex Mono maintains the intelligence-briefing texture consistent with HeaderStrip / FooterStrip brand chrome. Amber `#E5A544` as default accent — one quote mark, one attribution underline — is the right restraint level. `backgroundTint` should be reserved for explicit geopolitical register moments (US-blue for American policy quotes, China-red for CCP citations) and omitted for general analytical text.

## 5. Current template alignment

| Canonical idiom | Template status |
|---|---|
| Pull quote, centered, white-on-black, serif body | Implemented. Quote variant uses IBM Plex Sans Bold at fontSizes.h1. Body is heading-weight sans, not Plex Serif — slight divergence from the Plex Serif recommendation (see upgrade §6). |
| Quote mark in accent color, large display size | Implemented. 160px Georgia quote mark with amber accent and bloom glow. |
| Attribution with signature underline | Implemented. ScaleX-from-left underline draw-in at sec(3.0). |
| Bilingual stagger — Chinese first, English after ~2s | Implemented. Chinese at sec(0.3), English at sec(2.0) + sec(0.15) delay. |
| Definition: term + pinyin + translation + gloss | Implemented. Four elements with staged fadeIn times. |
| Count-up with overshoot-settle for statistics | Implemented. 3% overshoot, Cubic ease. Chromatic-aberration kick on lock-in. |
| Parallax depth layers (foreground/midground/background drift) | Implemented. 1.5× / 1.0× / 0.6× rate multipliers. |
| Anticipatory-reveal (narration sync via syncPoints) | Implemented per POLISH.md D17 across all variants. |
| No separate `emphasis` field | Correct — the SELECTOR's mode-flags table describes `accentColor for emphasis`, meaning `accentColor` IS the emphasis lever. There is no separate `emphasis` field in `QuoteData`; the SELECTOR note was a description of purpose, not a field name. |

## 6. Specific upgrades proposed

1. **Quote body font: switch to IBM Plex Serif** (P1, medium effort). The quote variant currently uses `fonts.heading` (IBM Plex Sans Bold) for the body. Editorial outlets consistently use a serif for pull-quote body text (NYT T Magazine, Atlantic, Foreign Affairs) because the serif register signals "thing worth re-reading," while sans signals "caption." Switch to `fonts.body` (IBM Plex Serif) at a slightly larger size than body — fontSizes.h2 at fontWeight 400 — and reserve `fonts.heading` for the attribution-context line. Rationale: the Plex superfamily was chosen for its Burtin/Bayer mid-century lineage; Plex Serif earns the quote weight.

2. **Attribution font: enforce IBM Plex Mono** (P0, low effort). Attribution currently uses the implicit theme font. Explicit `fontFamily: fonts.mono` locks in the intelligence-briefing texture that distinguishes Parallax's quotation register from a generic editorial template.

3. **`warnIf` guards for runtime failure modes** (P1, low effort). Add runtime warnings for: (a) `variant: "quote"` without `attribution` — already in place; (b) `variant: "statistic"` without `statValue` — currently emits the literal string "0"; (c) `variant: "definition"` without `term` — renders empty. Guards belong in the main component after the existing A6 section.

4. **Statistic variant: render `statLabel` in IBM Plex Mono** (P2, low effort). The statistic variant currently uses the default theme font for `statLabel`. IBM Plex Mono for the label/context lines reinforces the data-briefing register — the number in IBM Plex Sans Black (display), the label in mono, matches Bloomberg's "big number" format precisely.

5. **Definition variant: add `fontFamily: fonts.body` (Plex Serif) for `definitionText`** (P2, low effort). The definition paragraph text currently uses the theme default. A serif for the gloss text mimics the dictionary-entry register (The Economist's definition box, Foreign Affairs glossary footnote), making the definition feel authoritative rather than casual.

## 7. Failure mode flags

- **Quote variant without `attribution`** — P0 reject. Quote evaporates without authorial context; the viewer cannot evaluate the claim. Already enforced by `warnIf` in the component.
- **Statistic variant when the editorial point requires comparison bars** — wrong template; use StatReveal. KineticTypography statistic is only for the standalone case.
- **Used as a section title / chapter break** — wrong register. The kinetic motion (spring physics, parallax depth, letter-by-letter reveal) breaks structural moments. Use TitleTransition variant `"editorial-title"`.
- **Bilingual / definition variant animating Chinese and English simultaneously** — the eye doesn't know where to land. The stagger is the argument; remove it and the form fails.
- **`accentColor` on every line** — accent loses its meaning. One accent moment per composition. The default ink-on-paper is the register; amber is the punctuation.
- **`backgroundTint` without editorial reason** — register inflation. Tint is for explicit geopolitical color (US-blue, China-red) not decorative warmth. Omit for analytical register.
- **Mismatched fields for variant** (e.g., setting `text` + `attribution` on `variant: "statistic"`) — schema accepts it but the template ignores those fields silently; catch in audit, not silently.
- **`attribution` without `attributionContext` on significant quotes** — not a P0, but a missed opportunity. The context line ("Founder of TSMC, 2024") earns the attribution; without it the source floats without temporal or institutional anchor.

## References

- `TYPOGRAPHY_TEMPLATE_SELECTOR.md` — selection wall-table with KineticTypography vs. TitleTransition disambiguation
- `src/templates/KineticTypography/types.ts` — `QuoteData` interface (four variants, no separate `emphasis` field; `accentColor` is the emphasis lever)
- `src/templates/KineticTypography/KineticTypography.tsx` — variant rendering, parallax depth layers, cinematic overhaul v2 notes
- `references/template-research/title-card.md` — the structural-moment companion dossier (TitleTransition)
- `BRAND.md` → Typography — IBM Plex superfamily rationale (Burtin/Bayer/Fortune mid-century modernist lineage)
- `POLISH.md` D17 — anticipatory-reveal (narration sync) doctrine

# FrameworkDiagram (Comparison / Flow / Matrix) — Research Dossier

> Created: May 10, 2026. Research delegated to web-research agent; integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

This dossier covers three sub-forms of FrameworkDiagram. Each has its own canon; rules don't fully transfer.

---

## A. Comparison Columns

### A1. Editorial purpose
Use when two (or N) frameworks share a question but answer it differently and the reader's job is to hold both in mind simultaneously.

**Fails when:**
- The items aren't really parallel — one column ends up padded
- The contrast is sequential or causal — that's a flow
- More than ~3 columns — becomes a table, lose the rhetorical punch

### A2. Canonical idioms

**a. The Economist "Two views" spread.** "Two visions of China's future" (2023); "Hawks vs doves on inflation" (2022). Two columns, same row-headers down the gutter, no card chrome — just a vertical rule and consistent leading. *Works because:* the eye scans rows, not columns; the comparison is row-local. *Fails when:* row-headers get abstract ("approach," "view") instead of concrete questions.

**b. Stratechery's "Old world / New world" typography pairs.** Ben Thompson's Aggregation Theory posts (2015 onward); the "Compaq vs Dell vs Apple" supply-chain breakdowns. Pure type, often just bold/regular weight contrast, no boxes. *Works because:* Thompson's audience reads carefully — typographic restraint signals seriousness. *Fails for:* scrub-readers who need stronger visual anchors.

**c. NYT Upshot side-by-side policy panels.** "Biden's plan vs Trump's plan" tax explainers (2020, 2024); "How the two parties see the economy" (2022). Thin accent rule per column in party color, ordinal-numbered tenets (1, 2, 3), tight measure (~30 chars). *Works because:* numbering forces parallelism — if you can't write tenet #4 for both sides, the comparison isn't ready. *Fails when:* one side's tenets get diluted to maintain the count.

### A3. Treatment conventions
- **Card chrome:** avoid. Cards say "slide deck." Editorial uses a thin vertical rule or pure whitespace.
- **Ordinal numbering:** strongly recommended (01–05). Enforces parity, gives the reader a scrubbing index.
- **Hero treatment:** only if one side is the protagonist (Parallax's analytical position). Otherwise mirror weight precisely — asymmetry reads as bias.
- **Pair-aligned rows:** mandatory. Tenet 3 on the left must address the same question as tenet 3 on the right.
- **Accent rules:** one accent color per side maximum. Never the same accent to both — kills the contrast.

### A4. Recommendation for Parallax
Drop card chrome (already done). Keep ordinal 01–05. Use the palette's amber/rust split when the contrast is loaded; ink/ink with a single accent rule when both sides are presented neutrally. Bilingual hierarchy (English primary, Chinese kicker) is editorially distinctive — keep it but lock the weight ratio.

---

## B. Flow / Process Diagrams

### B1. Editorial purpose
Use when sequence and causation matter — stages where each presupposes the prior.

**Fails when:**
- Stages are actually independent (use small multiples)
- The "flow" is really a feedback loop (needs a cycle, not a line)
- Branching at every node (becomes a decision tree, different form)

### B2. Canonical idioms

**a. FT Visual Storytelling horizontal spine flows.** "How a container ship gets from Shanghai to Rotterdam" (FT, 2021); "The lifecycle of a sanctioned oil barrel" (FT, 2023). A literal horizontal line with chevrons or dots, stages as small numbered cards or just type along the spine, terminal node visually heavier (the payoff). *Works because:* the spine encodes direction without arrows-at-every-step clutter. *Fails when:* stages have wildly different durations — the equal spacing lies.

**b. NYT Upshot vertical "How X happens" stacks.** "How a bill becomes a law" (recurring); "How a Supreme Court case gets heard" (2022). Vertical, ordinal-numbered, connector lines or a continuous left rule. *Works on:* mobile (vertical scroll). *Fails on:* desktop spread — wastes horizontal real estate.

**c. McKinsey/HBR process arrows (cautionary canon).** McKinsey's "5-stage transformation journey" — the chevron-arrow chain where each stage is a right-pointing pentagon. *Works as:* rhetorical device (forward momentum). *Fails editorially because:* every consulting deck since 1995 uses it; reads as corporate, not journalistic. **Avoid unless deliberately invoking the register ironically.**

### B3. Treatment conventions
- **Spine line:** yes. A continuous rule (horizontal or vertical) carries the eye, removes the need for arrows per node.
- **Chevrons or dots on the spine:** chevrons for strong directional read; dots for "stages" without forced momentum. Pick one.
- **Ordinal numbering:** mandatory.
- **Hero terminal node:** strongly recommended — the payoff stage gets weight.
- **Card chrome on stage nodes:** optional but lean against. Type on the spine with a small numeral feels more editorial than boxed cards.
- **Equal vs proportional spacing:** if stages have meaningfully different durations, encode it.

### B4. Recommendation for Parallax
Editorial spine with chevrons (already done) is the right call — splits the difference between FT's spine and the McKinsey chevron-chain without inheriting the consultancy smell. Hero terminal node: keep. **Consider proportional spacing when the flow encodes real durations** (e.g., "100 years of imperial decline" — stage spacing should reflect decades).

---

## C. 2×2 Matrices

### C1. Editorial purpose
Use when two binary (or roughly binary) dimensions partition a space and the four resulting cells are each meaningfully different.

**Fails when:**
- Dimensions aren't independent — collapses to a line
- Only one or two cells have real instances — should be a list
- Cells need more than ~6 words to label — should be prose with callouts

### C2. Canonical idioms

**a. HBR's BCG growth-share matrix (the ur-form).** BCG 1970, popularized through HBR. Market growth (y) × relative market share (x), four cells: stars, cash cows, dogs, question marks. *Works because:* axis labels are concrete (numeric), quadrant names are sticky, protagonist quadrant (stars) is top-right where the eye lands. *Fails when:* imitated with vague axes ("high/low strategic value") — quadrants become Rorschach.

**b. Eisenhower urgent × important matrix.** Popularized through Covey's "7 Habits" (1989) and HBR repeats. Quadrant II ("important, not urgent") is hero — visually weighted, often the only one with extended text. *Works because:* the rhetorical point is *which cell you should live in*. *Fails when:* treated as neutral typology — without hero treatment, reader doesn't know what to do with it.

**c. Economist / Bloomberg threat-vulnerability and risk matrices.** "Which economies are most exposed to X" pieces (recurring); Bloomberg Opinion's strategic-competition 2×2s. Axes are real metrics, countries plotted as dots, quadrants implied not boxed. *Works because:* it's a scatter plot wearing matrix clothing — empirical, not typological. *Fails when:* dots are evenly distributed — no story.

### C3. Treatment conventions
- **Card chrome on quadrants:** avoid. Quadrants are defined by the axes, not by boxes around them.
- **Axis labels as actual axes with arrows:** mandatory. Axes must read as axes — labeled at the ends, with a "low → high" direction arrow.
- **Hero quadrant treatment:** yes if rhetorical point. No if neutral typology. Parallax almost always has a rhetorical point — use hero.
- **Centering on canvas:** matrix must be visually centered. Off-center reads as broken, not editorial.
- **Quadrant labels:** short (1–3 words) names + optional 1-sentence gloss.
- **Origin marker:** optional small tick at the axis crossing for empirical matrices (countries-as-dots); skip for pure typologies.

### C4. Recommendation for Parallax
Drop card chrome (done). Hero quadrant treatment (done) — keep. Axes-as-axes with arrows (done) — this is the single biggest tell separating editorial matrices from slideware. **Add a small origin tick for empirical matrices and skip it for pure typologies.**

---

## 4. Common mistakes to flag in audit (all three sub-forms)

1. **Bootstrap / deck card chrome.** Drop shadows, rounded rectangles, uniform fills. Editorial uses type hierarchy and rules, not boxes.
2. **Mirrored alignment failure in comparison columns.** Row 3 left says "decentralized authority"; row 3 right says "fast." Different categories of claim, not parallel.
3. **No directional cues in flow diagrams.** Stages as floating cards with no spine, no arrows, no numbering — sequence unclear from layout.
4. **Matrix off-center on canvas.** Anchored top-left with empty space bottom-right reads as cropped, not composed.
5. **Axis labels floating in margins instead of on the axes.** Reads as legend, not as space.
6. **Uniform ordinal numbering when items aren't parallel.** Forcing "01–05" on flow stages that are really 3 stages padded with 2 fillers.
7. **More than one accent color per side / per cell / per stage.**
8. **Type that requires zoom at scrub distance.** Min body size should survive thumbnail-grid review.
9. **Cycle masquerading as flow.** If stage N feeds back into stage 1, it's a loop, not a line.
10. **Quadrant labels that need a paragraph.** If the cell label is a sentence, it's prose with a callout, not a matrix.

## 5. Current template alignment

The existing `FrameworkDiagram` template, after our session's polish work:

**Comparison variant:**
- ✅ Card chrome dropped
- ✅ Ordinal 01-05 numbering
- ✅ Pair-aligned rows
- ✅ Bilingual hierarchy (parses "Title (中文)" pattern)
- ✅ Single accent rule per column

**Flow variant:**
- ✅ Editorial spine with chevrons
- ✅ Hero terminal node ("ENDPOINT" tag)
- ✅ Ordinal numbering
- Diverges: equal spacing, not proportional — could enhance for duration-encoded flows

**Matrix variant** (cell chrome lightened May 16, 2026 — commit `e02f076`, applying D1):
- ✅ Card chrome fully dropped. Non-hero cells now render as **transparent fills** (was 5% tint); hero cell renders as a barely-perceptible **6% amber** warm tint (was 10%). Cell borders thinned from 2–4px solid to **1px hairline**. Hero left-edge accent rule reduced from 4px to 2px. The matrix now reads as four quadrants defined by axes — not as four bordered tiles arranged in a grid. HBR / BCG / NYT Upshot empirical-matrix convention met more cleanly than before.
- ✅ Hero quadrant treatment (FOCUS tag + 2px left-edge accent + 6% amber wash) — still legible after the lightening pass because the wash is uniform across the cell and the FOCUS tag carries the brand mark.
- ✅ Axis labels as actual axes with arrows ("↑ MORE IMPORTANT", "← MORE URGENT") — unchanged.
- ✅ Matrix centered on canvas — unchanged.
- ✅ Quadrant ordinals (Q1–Q4) — unchanged.
- ✅ Flow + comparison variants are untouched by the May 16 pass (they had no card chrome to drop; their post-May 11 state is canonical).
- Diverges: no origin tick option for empirical matrices yet.

## 6. Specific upgrades proposed

1. ~~**Flow: proportional spacing option.** Add `stageSpacing: "equal" | "proportional"` with optional `durationField` for proportional. Useful for time-encoded flows.~~ **Done — May 11, 2026.** Shipped as `data.flowSpacing: "equal" | "proportional"` + `FlowNode.weight?`. When set to `proportional` AND every node has a weight, gaps between adjacent stages scale with mean-pair weight (so a flow with weights `[1,1,1,1,4]` shows the final stage 4× farther right). Spine markers, chevrons, arrow labels, and stage cards all use the proportional slot centers. Equal-spaced remains the default for legacy data.
2. ~~**Matrix: empirical mode.** Add `items?: { x: number, y: number, label: string }[]` for scatter-plot-style matrices (countries as dots in quadrants). Add origin tick rendering when items provided.~~ **Done — May 11, 2026.** Shipped as `data.items?: [{ x, y, label, color?, weight? }]`. Items render as scatter points over the 2×2 grid in normalized [0,1] space, with origin crosshair ticks at the midpoint. Hero items get `weight > 1` for larger markers with glow. Quadrant cells remain available as titles; items show *where actors actually sit*.
3. ~~**Comparison: protagonist mode.** When one side is the editorial protagonist, allow `protagonist: "left" | "right"` to weight that side with accent + heavier ordinals while keeping the other muted.~~ **Done — May 11, 2026.** Shipped as `data.protagonist?: number` (column index, opt-in). Protagonist column renders at full opacity with a heavier 3px accent rule; foil column(s) recede to 40% opacity. Equal-weight remains the default for true comparisons where neither side leads.
4. ~~**Slope flow option.** For flows where one stage is the inflection, allow a "hero stage" mid-flow (not just terminal). Currently only the last stage can be hero.~~ **Done — May 11, 2026.** Shipped as `data.heroStage?: number` (index, default = last stage). When set to a mid-flow index, the named stage gets the hero marker treatment (enlarged), the hero card gets accent color, and the chevron preceding it gets accented so the eye tracks toward the inflection rather than the terminus. Use for slope flows where the editorial point is "this is where it bent."
5. ~~**Document the three variants' decision rule.** Add to the FrameworkDiagram docstring: "comparison = parallel views; flow = sequential causation; matrix = 2D typology." Each has a different non-overlapping use case.~~ **Done — May 11, 2026.** Docstring at top of `FrameworkDiagram.tsx` codifies the three variants' editorial use cases with named "wrong for" failure modes. New rule: *"If you can't decide between two variants, your editorial frame is unclear — fix the framing before picking the form."*

## TL;DR (per sub-form defaults)

- **Comparison →** NYT Upshot side-by-side policy panels (ordinal-numbered, no chrome, row-parallel, single accent per side)
- **Flow →** FT horizontal spine with chevrons and hero terminal node (proportional spacing when durations are real)
- **Matrix →** HBR-lineage 2×2 with axes-as-axes, no card chrome, transparent cell fills, 1px hairline borders, hero quadrant at 6% amber wash

[Shipped May 16, 2026 — commit `e02f076`]: matrix-variant cell chrome lightened to canon — non-hero fills 5% → transparent, hero fill 10% → 6%, cell borders 2–4px → 1px hairline, hero left-edge accent 4px → 2px. Flow + comparison variants untouched.

Last revised: May 16, 2026 — matrix-variant cell chrome lightened per D1; flow + comparison variants unchanged.

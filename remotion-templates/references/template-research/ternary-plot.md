# TernaryPlot — Research Dossier

> Created: May 14, 2026. The ternary form is a long-established part-to-whole idiom from chemistry and geology that has been adopted, slowly and somewhat awkwardly, by political-graphics desks for stories about three-bloc alignment. This dossier captures the canon and pins down Parallax's defaults.

## 1. The form's editorial purpose

A ternary plot is the right answer when the editorial point is **"every observation is a three-way split that sums to one denominator, and the story is where each observation falls relative to the three corners."** Vote shares across three blocs, alignment between three powers, electorate composition by ideological tertile, soil/alloy/portfolio mixes — anywhere the analytical claim depends on the trade-off geometry that "more of A means less of B and C." The triangle makes that trade-off visually unavoidable in a way that three side-by-side bars or a stacked 100% bar cannot: the viewer reads not just magnitude but the *direction* of the trade-off (toward which corner, away from which edge). Distinct from RadarChart (same observation across N axes, often qualitative) and from PricingWaterfall (a single stacked total, no cross-observation comparison).

## 2. Canonical idioms

### a. Three-way election / referendum scatter
- **The Economist, Feb 22 2019** — "Plotting the Brexit conundrum": 2,500 modeled British voter profiles plotted across three Brexit options (No deal / May's deal / Remain), built from a 90,000-respondent YouGov survey. Built by James Fransham + Martín González + Evan Applegate. Print headline: *"A polarised electorate has little desire for the government's compromise."*
- **Information is Beautiful Awards (longlisted)** — "Build A British Voter" interactive ternary, same Brexit dataset, lets the viewer mouse over modeled profiles.
- **Nicolas Kruchten, 2014** — Montreal municipal election: 52 electoral districts as points across three mayoral candidates, widely cited as the canonical interactive-ternary case study.

*Works because:* the editorial claim ("the electorate is polarised, not centred") is literally the spatial distribution — clusters near corners, void near the centroid. The viewer reads polarisation as *geometry*, not as a number. *Fails when:* the third option is residual ("Other / Don't know"), in which case the triangle implies a structural three-way contest that doesn't exist.

### b. Cluster-by-corner with named exemplars
- **R-bloggers / Edwin Thoen, 2015** — Dutch municipal voting plotted across three party blocs, with named municipalities labeled near each corner cluster.
- **`isopleuros` (R package) reference plots** — archaeology assemblages (ceramic types) with site labels at corner-adjacent points.

The data cloud is intentionally dense; only 4–8 named points carry callout labels. The unlabeled cloud establishes the *distribution shape*; the labels nail the editorial argument to specific cases. *Fails when:* every point is labeled — the cloud becomes a soup of text and the corner-clustering pattern dissolves.

### c. Phase-diagram / domain-shaded ternary (the geology canon)
- **USDA soil-texture triangle** (in continuous use since the 1950s) — silt / sand / clay, with the triangle interior partitioned into named soil classes (loam, silty clay, sandy loam, etc.). Probably the single most-printed ternary diagram in any field.
- **Streckeisen QAPF diagram** (IUGS classification, 1976→) — igneous rock classification by quartz / alkali feldspar / plagioclase shares, with named rock-type fields.

*Works because:* the geometry isn't decorative — it carries a taxonomy. Each region of the triangle *means* something named. *Fails when:* used outside fields with an established taxonomy; arbitrary editorial "zones" on a political ternary read as opinion dressed as science.

### d. Part-to-whole reference in chart libraries
- **FT Visual Vocabulary (chart-doctor repo)** — ternary appears as a Part-to-Whole option, flagged as specialist. The FT itself rarely ships ternaries in print — the vocabulary acknowledges the form without leaning on it.
- **Plotly / Flourish / D3 (d3-ternary)** — ternary is a standard primitive in every major web-charting library, indicating reach without indicating editorial frequency.
- **Healy, *Data Visualization: A Practical Introduction* (2018)** — covers ternary as a specialist form for compositional data; notes the perceptual difficulty for untrained readers.

## 3. General principles

Ternary plots ride high on Cleveland's perceptual hierarchy on the **position** axis (position along a common scale, per each of three families of parallel reference lines) — but they tax the viewer with **three** simultaneous position decodes instead of one. Tufte-style minimalism helps: a thin outline, faint gridlines at 25/50/75%, and a single accent color on highlighted observations. The form's perceptual fragility is *reading the percentages off the gridlines* — most non-specialist viewers see corner-clustering immediately but cannot recover precise values from the triangle. The corollary: ternary works best when **clustering and trade-off direction are the argument**, not when precise percentages are. If the script narrates "70% / 20% / 10%," the form has been mis-selected; reach for a stacked bar or a small-multiples ranking.

The form also has a high training-cost edge: viewers must internalize that the corners are 100%-of-one, that the opposite edge is 0%-of-that-one, and that the three gridline families correspond to the three axes. Editorially, this means **the first ternary in any video needs explicit on-screen scaffolding** — "Each point's three shares sum to 100. Closer to a corner means more of that bloc." After that, subsequent ternaries can run lean.

## 4. Recommendation for Parallax

**Default form:** **cluster-by-corner with named exemplars** (idiom b). Dense data cloud in `theme.text.secondary` at modest opacity establishes the distribution shape; 3–6 highlighted points in **amber `#E5A544`** with backed-rect callout labels carry the editorial argument. Triangle outline in `theme.text.secondary` at 0.7 opacity, gridlines at 25/50/75% in `theme.text.muted` at 0.15 opacity, tick percentages in Plex Mono at 0.55 opacity. Corner labels in Plex Sans 700 uppercase — the three corners ARE the framework, so they get framework-label treatment.

**Centroid marker** is opt-in (`centroid: true`) and reads as **"+ Mean"** in `theme.text.secondary`. Use it only when the editorial point is that the mean is offset from where the viewer expects — otherwise it's chartjunk.

**Scrub tolerance at ~10s:** the viewer needs to grasp the three-corner framework and locate ~3 labeled exemplars in under 4 seconds. That means corner labels must be readable at glance, highlights must dominate the cloud, and the cloud must be dense enough to *be* a cloud (≥15 unlabeled points) without becoming a fog (≤60). Above 60 points the marker overlap kills individual highlight visibility — the runtime `warnIf` at 80 is the hard ceiling.

**Anti-pattern:** the geology-style phase-region shading. Parallax ternaries are scatter-of-observations, never named-region taxonomies. Editorial "zones" drawn on a political ternary cross into opinion-as-science.

## 5. Current template alignment

The existing `TernaryPlot.tsx`:
- Barycentric projection with corners A=top / B=bottom-right / C=bottom-left — ✓ matches the canon (Economist, USDA, Streckeisen all use this orientation; some chemistry diagrams flip B/C, but the canonical political orientation is top/right/left).
- Triangle outline drawn via single closed `<path>` with `strokeDashoffset` sweep — ✓ feels like one hand drawing the frame; matches the bounded-form animation grammar used in RadarChart and FrameworkDiagram.
- Gridlines at 25/50/75% with three families of parallel lines — ✓ exactly the canon.
- Tick percentage labels in Plex Mono at low opacity — ✓ matches the editorial-restraint default.
- Corner labels in Plex Sans 700 uppercase — ✓ framework-label treatment.
- Highlight halos (amber backing disc at 0.18 opacity) + backed-rect callout labels with connector ticks — ✓ matches the canonical "named exemplars" idiom.
- Centroid marker as opt-in `+ Mean` — ✓ correctly opt-in; aligns with the recommendation.
- Non-highlight dots use `theme.text.secondary` (fix from `theme.text.muted` which faded into the bone background) — ✓ correct after the recent contrast fix; do not regress.
- Runtime `warnIf` at >80 points and at points whose triple sums neither to ~1 nor ~100 — ✓ catches the two most common data-entry failures.

**Divergences from canon:** none material. The template intentionally omits geology-style phase-region shading (idiom c) because Parallax's editorial form is scatter-of-observations, not named-region taxonomy — that's a deliberate scope cut, not an oversight.

## 6. Specific upgrades proposed

1. **First-ternary scaffolding caption.** Add an optional `data.scaffolding?: string` field that, when set, renders a short Plex Mono caption near the bottom-right of the triangle: *"Each point's three shares sum to 100. Closer to a corner = more of that bloc."* Default off; turn on for the first ternary in an episode where the audience hasn't seen the form before. Low effort, high comprehension payoff. (See §3 — the form has a real training cost.)
2. **Edge-anchor label hints.** When a highlighted point has near-zero share of one axis (one of `a/b/c` < 0.05), the callout currently floats above-right and can drift off-canvas near corners B and C. Add direction-aware label placement (mirror the offset toward the triangle interior when the point is near the right or left edge).
3. **Catalog reference data file.** Build one production-grade ternary dataset in `data/episodes/<slug>/` mirroring the Economist Brexit precedent — three-bloc alignment on a real corpus, 25–40 unlabeled cloud points plus 4–6 named highlights. This is what `prisoners-dilemma` likely needs; pre-staging the data file avoids a from-scratch lift mid-episode.
4. **Ordinal corner emphasis (optional).** A `data.cornerEmphasis?: "a" | "b" | "c"` to mark which corner is the editorial protagonist — e.g., render that corner label one weight heavier and tint the matching corner-cluster gridline tick. Useful when the script's argument privileges one bloc; skip when the argument is about the trade-off itself.
5. **Documentary mode caption for `centroid: true`.** When the centroid is shown, add a one-line caption (Plex Mono, muted) summarizing the mean composition — e.g., "Mean: 42% A · 33% B · 25% C." Otherwise the `+ Mean` glyph reads as a geometric flourish whose meaning the viewer cannot recover.

## 7. Failure mode flags (always catch in audit)

- **Four-or-more categories squashed into three** ("US / China / Russia / Others") — the "Others" residual destroys the trade-off geometry; switch to a stacked bar or a small-multiples ranking.
- **Categories that don't naturally sum** (GDP / population / military spending — three numbers in different units) — ternary requires a shared denominator; without it the geometry is meaningless even if the values are normalized.
- **Single-cluster ternaries** (all points pile into one corner) — the form's value is the *distribution*; one cluster could have been a single annotated bullet. Use a callout card instead.
- **Every point labeled** — the cloud becomes text soup; the corner-clustering pattern dissolves. Cap at ~6 highlight labels.
- **Phase-region shading** with editorially-drawn zones — opinion dressed as taxonomy; reserved for fields with established classification (soil texture, igneous rock). Never on political/geopolitical data.
- **More than 80 points** — runtime warning fires; marker overlap dominates and individual highlights vanish into the cloud.
- **Triples that don't sum to ~1 or ~100** — runtime warning fires; almost always a data-entry error (mixed units, missing component). Normalize-and-render is graceful degradation, not a fix.
- **Missing scaffolding on the episode's first ternary** — the audience has not internalized the form; comprehension collapses for 5–10 seconds while they decode the triangle. Either pre-train via narration or set `scaffolding` (upgrade #1).
- **Missing source attribution** — non-negotiable for Parallax voice; ternaries cite real data or they are not shipped.

## TL;DR

**Dense cloud of three-way observations in `theme.text.secondary`, 3–6 amber-highlight exemplars with backed-rect callouts, 25/50/75% gridlines at 0.15 opacity, corner labels in Plex Sans 700 uppercase. The form's editorial value is corner-clustering and trade-off direction, not precise percentages. Train the form on first use; lean after. Brexit-electorate idiom by way of USDA soil texture, with Du Bois restraint.**

Last updated: May 14, 2026

# Historical-Parallel Visualization (Timeline Family) — Research Dossier

> Created: May 10, 2026. Research delegated to web-research agent; integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.
>
> **This dossier covers Parallax's signature visual form.** Four sub-templates fall under it: `HorizontalTimeline`, `TimelineComparison`, `DualTimeline`, `TimelineMorph`. The decision between them defines the channel.

## 1. The editorial purpose

Historical-parallel visualization asks the viewer to perform one specific cognitive move: **hold two eras in working memory simultaneously, then notice the structural rhyme between them.**

It is not chronology (that's a timeline). It is not causation (that's a flowchart). It is **analogical reasoning made visible** — the claim being rendered is *"the shape of this thing rhymes with the shape of that thing, and the rhyme is informative."*

Every successful idiom in this category does the same thing: it externalizes the comparison so the viewer's brain doesn't have to hold both eras in suspension. The visual carries the cognitive load that prose narration alone cannot. When done well, the viewer *sees* the parallel before the narrator names it; when done poorly, the viewer sees two things that happen to be next to each other.

**Why this matters more for Parallax than for most outlets:** the channel's *bounded analogy* doctrine — "this analogy is useful here, breaks down there" — requires a visual form that can show pairing AND show where pairing breaks. Most outlets use historical parallels rhetorically; Parallax uses them analytically.

## 2. Canonical idioms

### a. Stacked parallel timelines, phase-aligned
- **NYT** "How the 1918 Pandemic Echoes Today" (March 2020, recurring through 2021)
- **Pudding** "Pandemic Then and Now" (April 2020)

Two horizontal timelines stacked, events aligned not by calendar date but by **phase position** (week-of-outbreak, year-of-war). The vertical alignment IS the argument: "peak hospitalization happened at week 7 both times."

*Works because:* spatial proximity does the analogical work. *Fails when:* phases don't actually align and the designer fudges spacing to force the rhyme.

### b. Single timeline with annotated callbacks
- **Economist** "Then & Now" features (recurring)
- **Tufte's** reading of Minard's Napoleon march

One timeline of the contemporary moment, with small reference marks pointing to historical antecedents ("← 1873," "← 1929"). The historical era is foil, not subject.

*Works because:* keeps narrative momentum forward while gesturing at depth. *Fails when:* the historical references become decorative rather than load-bearing.

### c. Side-by-side with explicit connection lines
- **FT Weekend** "Sovereign defaults: a history" (recurring)
- **Atlantic** "The Last Time America Lost the Future" (Applebaum, 2023)

Two timelines, paired events explicitly joined by curved lines or color-matched markers.

*Works because:* makes the pairing claim unambiguous and auditable. *Fails when:* too many connection lines turns it into spaghetti; the editorial discipline of "pair only the four strongest rhymes" is what makes it readable.

### d. Morph / transform sequence
- **Wendover Productions** transitions between historical and contemporary maps
- **Hans Rosling** Gapminder "200 years that changed the world" (2010)

Era A's visual elements literally transform into era B's counterparts.

*Works when it works:* makes the structural identity visceral — "the same shape, dressed differently." *Fails when:* gimmicky when the morph implies causal continuity that doesn't exist; works best for *structural* rhymes (institutions, supply chains, escalation dynamics), badly for *coincidental* rhymes.

### e. Focus-shifting intercut (dual presentation)
- **PBS Frontline** documentary cuts between archival footage and contemporary
- **Polymatter** "How [empire] fell" essays

Two timelines visible but eye-attention shifts era-to-era as narration progresses.

*Works because:* preserves both eras as continuously present while letting one dominate at any given moment. *Fails when:* viewer loses track of which era is which; requires strong era-color discipline.

### f. Layered / Minard-style single timeline with rich annotation
- **Tufte's** canonical reading
- **NYT** expanded election-year retrospectives

One timeline carrying multiple data dimensions per moment (events, magnitude, sentiment, named actors). The "parallel" is encoded as recurring annotation patterns rather than two separate axes.

*Works because:* dense, rewards scrubbing. *Fails when:* requires more reading time than 8–12s scrub allows.

## 3. Treatment conventions

- **Era color-coding:** Two colors only, used consistently. The strongest convention pairs **warm = past, cool = present** (NYT, Atlantic, FT all converge here independently). Saturation, not hue alone, signals which era is in focus. Avoid color-coding by event *type* — that breaks the era reading.
- **Event markers:** Dot + year + 2–4 word label. Year always in mono, label in serif or display. Marker size encodes salience, not duration. Duration ranges get bars; point events get dots. Do not mix the two scales on the same axis without a legend.
- **Connection lines:** Curved, low-opacity, drawn *after* both timelines are visually established (never simultaneously). The line is the editorial claim — it should appear with narration that names the pairing, not before. Maximum 3–5 paired connections per scene; more reads as forced.
- **Spacing:** Proportional to elapsed time when the *duration between events* is part of the argument (compression of crisis cycles). Equal/categorical spacing when only the *sequence* matters (succession of regimes). Most historical-parallel features use proportional within each era and equal between eras (so the eye reads phase-position, not calendar-position).
- **Era labels:** Top-left of each timeline. Date range in mono, era name in display. Never trust the viewer to infer "1918" vs "2020" from event labels alone.
- **Focus shifting:** When intercutting, dim the non-focus era to ~40% opacity rather than removing it. Continuous presence of both eras is the whole point. The shift is attentional, not topological.
- **Weight ratio:** Old-as-foil-to-new is the dominant convention (~70% of NYT/Atlantic/FT features). Equal-weight is rarer and harder; it requires the historical case to be as researched as the contemporary one — **which is exactly Parallax's editorial commitment, so equal-weight is on the table here in a way it isn't for most outlets.**

## 4. Recommendation for Parallax

### Default: TimelineComparison (stacked parallel, phase-aligned)

This is the form that does the most editorial work per second of screen time. It externalizes the analogical claim, makes the pairing auditable, and reads cleanly at 8–12s scrub. It is also the form that aligns with the *bounded analogy* doctrine — when you can show pairing AND show where the pairing breaks (a connection line absent at one phase position), you've rendered the channel's signature move visually.

### Palette

- **Era A (historical)** = rust `#C23B22` at full saturation
- **Era B (contemporary)** = ink `#1C1814` (warm vs neutral, both already in the brand — avoids inventing a non-brand blue)
- **Connection lines / active-focus highlights** = amber `#E5A544`

### When to switch sub-form

| Use | When |
|---|---|
| `TimelineComparison` (default) | Two phased eras, paired events, structural rhyme is the argument |
| `HorizontalTimeline` | Single-chronology episode — parallel embedded in annotations, not structure (Babbage → ChatGPT as one continuous arc) |
| `DualTimeline` | Intercut narration where both eras must remain continuously present with attentional shifting (Pearl Harbor ↔ 9/11) |
| `TimelineMorph` | Institutional/structural rhyme where transformation itself is the argument (Continental Blockade → SWIFT sanctions). **Use sparingly — once per episode at most, at the analytical climax.** Morph is a punchline, not a structure. |

## 5. Current template alignment

We have all four templates built. Polish in our session was mostly cosmetic; this is the first deep research on whether the structural choices are right.

**TimelineComparison / HorizontalTimeline `dual` mode:**
- ✅ Stacked layout, paired events, connection lines
- ✅ Era color-coding (left/right colors per data)
- ✅ Phase-alignment now enforced via `phaseAxis` config (May 11, 2026) — schema rejects dual+phaseAxis without `phasePosition` on every pair. Reference: `catalog-horizontal-timeline-revolutions-phase`.

**HorizontalTimeline:**
- ✅ Single timeline, event markers, year + label
- Catalog variants: `computers` (single), `pandemics-dual` (dual mode within same template)

**DualTimeline:**
- ✅ Era A + Era B with focus-shifting crossfade
- ✅ Era color coding
- Diverges: focus shifts to opacity 0.2 (closer to canon 0.4)

**TimelineMorph:**
- ✅ Events from era A morph to era B counterparts
- Catalog variant: `blockades` (1806 Continental System → 2022 sanctions)
- Risk: gimmicky if used for non-structural parallels — needs editorial gate

## 6. Specific upgrades proposed

1. ~~**TimelineComparison: phase-alignment enforcement.** Add `phaseAxis: boolean` option that labels the X axis as "weeks since outbreak" or "year of war" rather than calendar dates. When set, both timelines share the phase axis literally.~~ **Done — May 11, 2026.** Shipped as `phaseAxis` config (`label`, `unit?`, `min?`, `max?`, `ticks?`) on `HorizontalTimeline` dual mode. Per-pair `phasePosition` declares the shared x-coordinate; the schema's `superRefine` rejects dual+phaseAxis without phasePositions ("falsifying phase alignment is the most common audit failure"). Reference implementation: `catalog-horizontal-timeline-revolutions-phase` (French 1789 + Russian 1917 aligned by year-of-revolution). The axis renders below era B with ticks, phase-value labels, and a centered uppercase axis title.
2. ~~**Connection-line staging.** Add `connectionRevealStart?: number` so connections appear after both eras are visually established, with narration sync timing.~~ **Done — May 11, 2026.** Shipped as `data.connectionRevealStart?: number` (seconds from start). Connection lines now reveal at the specified frame instead of immediately at sec(0.3), so the viewer sees the evidence (both eras' events) before the editorial claim (the connecting line).
3. ~~**Era weight ratio.** Add `eraWeight: "equal" | "foil-old" | "foil-new"` (default `equal` for Parallax, since the channel's editorial commitment is rare). Foil modes apply 30%/70% horizontal space allocation.~~ **Done — May 11, 2026.** Shipped as `data.eraWeight?: "equal" | "foil-old" | "foil-new"`. Default `equal` preserves both eras at full opacity (Parallax's bounded-analogy commitment). Foil modes drop the foil era to 0.5 opacity continuously, so the protagonist dominates the eye while the foil stays continuously legible. (Opacity weighting rather than horizontal-space reallocation, which would have broken phase-axis alignment.)
4. ~~**DualTimeline focus opacity to 0.4** (canon) instead of 0.2 — keep both eras continuously legible.~~ **Done — May 11, 2026.** Codified as `DIM_OPACITY = 0.4` constant in `DualTimeline.tsx` with the dossier rationale inline.
5. ~~**TimelineMorph editorial gate.** Document that this variant is for *institutional* rhymes only (same instrument, different technology). Add an inline comment / docstring warning against using for coincidental parallels.~~ **Done — May 11, 2026.** Editorial gate banner added to `TimelineMorph.tsx` header docstring and to `TimelineMorphEventData` JSDoc in `HorizontalTimeline/types.ts`. Both name the three earning examples (Continental System → SWIFT, satraps → governors, gold standard → reserve currency) and the wrong examples ("Pearl Harbor → 9/11" coincidence).
6. ~~**Cross-variant: rust + ink palette default** for era A vs era B (already brand-aligned). Override only when episode has specific bilateral coloring (US/China rust/blue, etc.).~~ **Done — May 11, 2026.** Swapped HorizontalTimeline dual-mode defaults from `gold/rust` to `rust/ink` per the dossier convention (warm = past, neutral = present, both already in the brand — no non-brand blue invented). Episode-specific bilateral coloring (US/China, etc.) still overrides via `data.eraAColor` / `data.eraBColor`.

## 7. Failure mode flags (always catch in audit)

- **Events not phase-aligned across two timelines** — calendar alignment when phase alignment is the argument
- **Color-coding by event type instead of era** — viewer can't track which era they're in
- **Single timeline used when the editorial point is the parallel** — narration claims rhyme; visual shows chronology
- **Connection lines drawn before both eras are established** — viewer sees the claim before the evidence
- **More than 5 paired connections** — spaghetti; editorial cull to the 3 strongest rhymes
- **Morph transition between eras with no structural identity** — implies false causation
- **Equal-weight presentation when one era is actually foil** — wastes screen real estate
- **Era labels missing or small** — viewer infers era from event labels, gets it wrong
- **Proportional spacing within era but mixed between eras** — eye reads calendar position when it should read phase

## TL;DR

**Default →** TimelineComparison (stacked parallel, phase-aligned).
**Switch to →** HorizontalTimeline for single-arc episodes where the parallel lives in annotations; DualTimeline for intercut narration where both eras must remain continuously present; TimelineMorph for the once-per-episode analytical punchline where institutional transformation IS the argument.

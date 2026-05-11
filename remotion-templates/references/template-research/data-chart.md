# DataChart (Bars / Lollipops / Comparison) — Research Dossier

> Created: May 10, 2026. Research delegated to web-research agent; integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## 1. The form's editorial purpose

The bar chart is the workhorse because **position along a common scale** sits at the top of Cleveland & McGill's (1984) perceptual hierarchy — humans decode it faster and more accurately than angle (pies), area (bubbles), or color saturation (heatmaps). Use it whenever the analytical claim is *"X is bigger/smaller than Y by roughly Z."*

### Decision tree

| Sub-form | When |
|---|---|
| **Vertical bars (columns)** | Time-ordered categories, ≤8 items, short labels (e.g., GDP by year) |
| **Horizontal bars** | Long category labels, ranked comparisons, >6 items (e.g., military spending by country) |
| **Lollipop** | Sparse data, when bar ink overwhelms signal (20+ categories where only dot position matters) |
| **Dot plot (Cleveland)** | Two values per category (e.g., 1990 vs 2024 GDP) |
| **Small multiples of bars** | Cross-category comparison, multiple trends per category |
| **Bullet chart** | Target vs. actual (niche, useful for forecast vs. realized) |

**Rule of thumb:** if the narrator says "look at how this one compares to the others," it's a bar. If they say "look at how this one *changed*," it's still a bar (paired) unless the trajectory matters, then it's a line.

## 2. Canonical idioms

### a. Vertical bar with hero highlight
- **NYT Upshot** approval ratings, election polling — one bar in editorial accent, rest in muted gray

*Works because:* the eye lands on the hero in <300ms, narrator's claim is pre-loaded visually.
*Fails when:* too many "almost heroes" — the highlight has to be genuinely singular.

### b. Horizontal bar, sorted descending
- **Economist** Big Mac index (since 1986), military spending rankings — recurring standard

Labels left-aligned outside bars, values right-aligned at bar terminus. *Works because:* reading order matches ranking order — top of the page is the leader. *Fails when:* unsorted (alphabetical kills the comparison) or when the longest bar is shorter than the longest label.

### c. Paired comparison (before/after)
- **FT** sanctions impact stories
- **Reuters** pre/post-COVID GDP comparisons, election swings

Two bars per category, one muted (before), one accent (after), with the delta either labeled or implied by a connecting line. *Works because:* the structural change is the story. *Fails when:* paired bars are color-coded by team rather than time (red/blue Democrat/Republican is fine; red/blue arbitrary is not).

### d. Small multiples grid
- **The Pudding**, **Bloomberg Graphics** — same chart, different country/sector/decade

3×3 or 4×4 grid, **shared y-axis range**, sparse labeling — only corners get axis ticks. *Works because:* the eye does the cross-comparison the prose can't. *Fails when:* y-axis ranges aren't shared (each panel auto-scaled is a lie) or when there are too few categories to justify the grid.

### e. Lollipop with terminal value label
- **FiveThirtyEight** polling spreads
- **Reuters** inflation comparisons across countries

Thin line, fat dot, value printed at the dot. *Works because:* minimal ink, ranking-preserving, label is exactly where the eye lands. *Fails when:* differences are small — the dots cluster and you've lost the bar chart's clarity advantage for no gain.

**Historical anchor:** W.E.B. Du Bois's 1900 Paris Exposition charts on Black Georgia — hand-drawn horizontal bars, sorted, single accent color, dense data labels, explicit source attribution. **The Parallax aesthetic *is* Du Bois plus a typeface budget.**

## 3. Treatment conventions

- **Baseline:** always zero. Truncating to dramatize is the cardinal sin.
- **Value labels:** right gutter for horizontal bars (after the terminus), above for short vertical bars, inside-top for tall vertical bars only if contrast is high. Never both.
- **Sort:** descending by value unless the x-axis is intrinsically ordered (time, age cohort).
- **Color:** one hero, rest muted gray or palette-neutral. Uniform color only when no single bar is the editorial point (rare).
- **Axis:** minimal ticks (3–5 max), no gridlines or one faint horizontal line at a round number, no axis line on the categorical side, baseline only.
- **Whitespace:** bar-to-gap ratio ~1.5:1. Tighter reads as a histogram.

## 4. Recommendation for Parallax

**Default form:** **horizontal bar, sorted descending**, 5–8 items, **one hero in amber `#E5A544`**, rest in **ink `#1C1814` at 30% opacity** on **paper `#F5F0E8`**.

**Typography:**
- **IBM Plex Mono** for value labels (right gutter)
- **IBM Plex Sans** for category labels (left-aligned)
- Title in Plex Sans 48pt upper-left
- Source attribution in Plex Mono 18pt lower-right ("SIPRI, 2024" — outlet + year, no URL)
- Hero bar's value label gets hero stat treatment (Plex Sans 36pt, not Mono)

**Chrome:**
- Single thin baseline in ink at 40%, no other axis chrome
- No gridlines

**Paired variant:** **rust `#C23B22`** as the second hero against amber for before/after.

**Scrub tolerance:** at 8–12s per frame, the viewer needs to grasp the ranking in <2s. That means hero color must be unambiguous, the top bar must be the editorial point.

## 5. Current template alignment

The existing `DataChart` template:
- Already does vertical and horizontal bars (`variant: "bar"`)
- Already supports paired comparison (`variant: "comparison"`)
- Has hero highlight via `highlightIndex` — ✓
- Catalog variants: `speeds-bar` (mountains heights), `space-race-comparison` (paired US/USSR)
- Already polished in our session: y-axis tighter fit, terminal labels, hero hierarchy, denser x-axis, cleaner tick format
- **Diverges from canon:** default is vertical not horizontal; some variants use saturated category colors not muted-rest hierarchy

## 6. Specific upgrades proposed

1. ~~**Default to horizontal sorted-descending for >5 items.** Auto-flip orientation based on item count + label length.~~ **Partial — May 11, 2026.** Added a `warnIf` that fires in Studio when `variant="bar"` is used with >6 items, recommending `variant="horizontal"` or `variant="lollipop"`. Stops short of silent auto-flipping because that would mutate the user's declared variant in ways data-writers couldn't predict. The warning gets the convention across at production time.
2. ~~**Reinforce hero/muted hierarchy.** When `highlightIndex` is set, ALL other bars render at ink 30% opacity, not their per-data-point color. Per-point color should only override when there's no hero.~~ **Done — May 11, 2026.** New `someHighlighted` prop on `AnimatedBar`: when set and `!isHighlighted`, bar fill renders at `ink @ 30%` and value label desaturates. Hero wins; rest recede.
3. ~~**Hero stat treatment for the highlighted bar's value.** Plex Sans 36pt, not the mono label size used for others.~~ **Done — May 11, 2026.** Hero bar's value swaps from `fonts.mono` → `fonts.display` (Plex Sans) at h2 (48px) with tight letter-spacing — reads as editorial pull-quote, not as a tabular number.
4. ~~**Lollipop sub-variant.** Add `variant: "lollipop"` for 10+ item rankings.~~ **Done — May 11, 2026.** Shipped as `variant: "lollipop"`. Sorts data descending; renders horizontal stem + terminal dot per row with left-anchored label and right-anchored value. Hero treatment swaps the highlighted row's value to Plex Sans display weight + amber. Catalog reference: `axelrod-lollipop` (12-strategy Axelrod tournament showing cooperation pays).
5. ~~**Small multiples sub-variant.** Add `variant: "small-multiples"` for cross-category panels with shared y-axis.~~ **Done — May 11, 2026.** Shipped as `variant: "small-multiples"` + `data.panels: Array<{ title, subtitle?, dataPoints }>`. Auto-grid layout (2/3/4 columns depending on panel count). Shared value scale computed across all panels' dataPoints. Each panel renders horizontal bars with label · bar · value rows. Catalog reference: `catalog-data-chart-olympics-small-multiples` (Cold War Olympics — Helsinki '52 / Tokyo '64 / Munich '72 / Moscow '80, five countries each, shared medal-count scale showing the US-boycott '80 distortion).

## 7. Failure mode flags (always catch in audit)

- **Truncated y-axis** — exaggerates 2% differences into apparent 10× gaps. Bar charts MUST start at zero; if you need a log scale, use a dot plot.
- **Rainbow bars** — every bar a different color destroys the perceptual hierarchy.
- **3D bars, shadow effects, gradient fills** — every one of these distorts position-along-scale.
- **Unsorted horizontal bars** when no intrinsic order exists (alphabetical by country name is the giveaway).
- **Label collisions** — overlapping value labels, or labels in the bar that fail contrast on the muted bars.
- **Missing source attribution** — non-negotiable for Parallax voice.
- **Stacked bars masquerading as comparison bars** — stacks compare totals well but components terribly; if components are the point, use small multiples.
- **Paired bars without a delta cue** — viewer has to do mental subtraction; add a connecting line or print the delta.

## TL;DR

**Horizontal bars, sorted descending, single amber hero against muted ink, value labels in the right gutter in Plex Mono, source attribution lower-right, no gridlines, baseline at zero, Du Bois with a typeface budget.**

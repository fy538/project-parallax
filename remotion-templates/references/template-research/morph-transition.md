# MorphTransition — Research Dossier

> Created May 19, 2026. Animated state-change between two data states of
> the same embedded template. The NYT/Bloomberg "watch the rankings shift"
> / "election-night updates" motion primitive.

## 1. The form's editorial purpose

MorphTransition shows the SAME chart type with TWO data states, animated through a continuous morph between them: bars rearrange, lines reroute, values count up/down. Reach for it when the editorial point is *change itself* — when the viewer should SEE the rankings shift, watch the values move, feel the structural reorganization in motion rather than reading it from two side-by-side stills. Distinct from `ComparisonPair` (both states visible simultaneously at rest); MorphTransition animates the transition between them.

Used most powerfully for:
- **Rankings shifts** ("Top-5 economies 1990 → 2024" — China rises, Japan slips)
- **Population pyramids over time** (the demographic transition made kinetic)
- **Election-night updates** (counties recolor as returns come in)
- **Policy before/after** (timeline extends with the new regime's data points)
- **Counterfactual playback** ("here's what would have changed")

## 2. Canonical idioms

**NYT election-night data updates.**
The New York Times Upshot election-night interactive updates state-level totals via animated morph — when a state flips, the bar shifts proportionally, the map repaints with eased interpolation. Reference: NYT Election Night live tracker (2020, 2024). The morph timing is fast (200-400ms per update — viewers are watching real-time).
Failure mode: morph too slow for live data (>2s) — viewers lose the urgency. For editorial video, slower morphs (3-4s) work because the viewer isn't waiting for fresh data.

**Bloomberg "population pyramid demographic transition" treatment.**
Bloomberg's analysis pieces on aging societies use morph animation on population pyramids — the pyramid shape inverts from young-bottom-heavy (1950) to old-top-heavy (2050) over a 5-second morph. The morph IS the editorial argument: you can SEE the demographic transition happen. Reference: Bloomberg Opinion charts (2022-2024).
Failure mode: morphing categorical data that doesn't have a continuous mapping (e.g., morphing one pie chart's slices into a different pie chart's slices). Use only when the data has natural cross-state correspondences.

**Pudding scrollytelling morph variant.**
The Pudding's interactive essays use slider-driven morph — readers scrub through years and watch the chart update continuously. In video form this becomes time-driven morph at a fixed pace. Reference: The Pudding's "How the News Changed" interactive.
Failure mode: in video, you can't let the viewer control the slider; the morph plays at your pace, not theirs. Build in adequate hold-from and hold-to so viewers can read both endpoints.

**Tableau / FlourishStudio "race chart" idiom.**
"Bar chart races" became viral in 2019 — countries' rankings change continuously over decades. Morphological similar but architecturally different (continuous timeline, not discrete A→B). Reference: Flourish "Country GDP race" templates.
Failure mode: race charts can run too long (60s+ for "100 years of data"). MorphTransition is a single A→B step; for races, build a sequence of MorphTransition shots.

## 3. General principles

The form makes three load-bearing claims:
- **The two states are comparable** — same template, same data shape, items match by stable key (label, x-value). If the items don't match, the morph reads as random churn.
- **The change is the editorial point** — if you can make the argument with two stills (ComparisonPair), use that. Morph is for moments where the MOTION carries weight.
- **The timing is read-able** — viewer needs time to read the FROM state, then watch the morph, then read the TO state. Sweet spot: hold-from 2-3s, morph 2-4s, hold-to 3-4s.

Interpolation rules per template:
- **DataChart (bars)**: match bars by `label`, lerp `value`. Removed bars (in FROM but not TO) collapse to 0 by t=0.5 then disappear. New bars (in TO but not FROM) appear from 0 starting at t=0.5.
- **TimeSeriesChart (lines)**: match points by `x` value, lerp `y`. New x-values (extensions) ease from previous y to new y. Annotations snap at midpoint.
- **StatReveal (number)**: lerp `stat.value`. `countUp` suppressed during morph (template's own count-up would compete). Comparisons snap at midpoint.

Easing: default `ease-in-out` (smoothstep cubic) — slow start, slow end, the canonical editorial pace. `linear` for constant-rate change. `spring` for moments where the slight overshoot signals "we landed there with some momentum."

## 4. Recommendation for Parallax

Default to:
- DataChart morphs for ranking shifts (most editorial value per second of video)
- `holdFromSec: 2-3`, `morphSec: 3-4`, `holdToSec: 3-4` — total clip ~10-12 seconds
- `morphEasing: "ease-in-out"` for almost all cases
- Crossfaded state label top-right (FROM → TO) in display font, accent colour, h2 size
- Source citation must include date range AND units ("World Bank, 2024 constant USD")

Use rarely (1-2 per episode max). Morph is high-impact / kinetic — overuse fatigues the viewer.

## 5. Current template alignment

`MorphTransition` ships with 3 morphable templates supported via discriminated union:
- **DataChart** — bar values lerp by label match, bars reorder if rankings change, removed bars collapse + disappear, new bars emerge after t=0.5
- **TimeSeriesChart** — append-style morph (timeline extends, new points and annotations appear)
- **StatReveal** — single number lerps from FROM.stat.value to TO.stat.value; `countUp` suppressed during morph

Schema's `superRefine` enforces `from.template === to.template` (parser rejects mismatched templates with a clear error message).

Default props: Top-5 economies by GDP, 1990 → 2024. The visible morph: bars rearrange (China rises to #2, Japan slips from #2 to #4, France and UK drop out of top-5, India enters); China's bar gets the gold accent post-morph (highlightIndex: 1 in TO). Demonstrates rank changes + insertions + deletions in one shot.

## 6. Specific upgrades proposed

1. **BumpChart support** (medium effort, medium impact) — currently excluded because BumpChart has its own internal animation, but a "morph between two BumpChart datasets" would be the canonical race-chart form. Requires harmonising BumpChart's internal animation with the morph progress.
2. **Map template morph** (high effort, high impact) — temporal-choropleth, where counties/countries recolor over a morph window. Requires geographic interpolation logic + Mapbox runtime cooperation. Significant engineering.
3. **Sequence of morphs** (low effort, high frequency) — schema for `states: MorphState[]` with sequential morphs between each adjacent pair. The "race chart" pattern (1980 → 1990 → 2000 → 2010 → 2020 → 2024). Currently this requires 4 separate MorphTransitions stitched in the timeline.
4. **Per-element morph timing** (medium effort, low impact) — currently all bars/lines morph in parallel. Schema additions for staggered per-item morph timing so bars rearrange one at a time. Useful for slow-burn rankings shifts.
5. **Morph progress indicator** (low effort, medium impact) — a small horizontal progress bar at the bottom of the screen showing where we are in the morph window. Helps viewers calibrate "we're halfway through the change."

## 7. Failure mode flags

- **Items that don't match across FROM and TO** — the morph reads as random churn rather than meaningful change. Either rename items to match OR use ComparisonPair (which doesn't require matching).
- **Morph too slow** (>5s) — viewer attention drops mid-morph. Cap at 4s; if you need more granularity, build a sequence of shorter morphs.
- **Morph too fast** (<1.5s) — viewer can't process the change. The whole editorial point is watching the motion; rushing it defeats the form.
- **No hold-from / hold-to time** — viewer doesn't get to read the endpoints. Always hold both states for at least 2s.
- **Tiny value differences** — morphing $880B → $886B is invisible. Reserve morph for changes large enough to read at video resolution.
- **Mismatched template types** — schema rejects `from.template !== to.template` at parse time. If you want different templates side-by-side, use ComparisonPair.
- **Faked countUp competing with morph** — when StatReveal is the embedded template, `countUp` is auto-suppressed during morph; if it weren't, the count-up's own animation would fight the morph's interpolation. (Handled by interpolator; documented here for understanding.)
- **TimeSeriesChart morph that's actually just two unrelated charts** — TimeSeriesChart morph is for EXTENSION (adding years to the same series) or REVISION (updating estimates for the same years). For genuinely different series, use ComparisonPair.

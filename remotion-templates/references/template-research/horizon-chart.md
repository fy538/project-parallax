# HorizonChart (Compressed Multi-Series Time Series) — Research Dossier

> Created: May 14, 2026. Sibling to `time-series-chart.md` — when in doubt about ≤4 series, send the editor there.

## 1. The form's editorial purpose

A horizon chart's job is to make *many* parallel trajectories legible *at once*. It trades per-point precision for an N-times denser comparison: each series is compressed into a thin strip, its value range sliced into bands, and color intensity (plus a folded contrast hue for negatives) carries the magnitude the y-axis would normally carry. Reach for it when the editorial question is *"which of these N things spiked when, and which moved in lockstep?"* — not *"what was the exact value?"*. The form's sweet spot is **5–15 parallel series** whose *shapes* matter more than their *levels* — FX baskets, volatility indices, yield-curve residuals, polling deltas across states, commodity returns, regional inflation prints.

If you have ≤ 4 series, use `TimeSeriesChart` (hero+supporting). If the absolute values are the argument, use small-multiples. Horizon is for the panel of *dozens-but-not-hundreds* where the eye needs to spot *coincident motion*.

## 2. Canonical idioms

### a. Bloomberg / FT volatility panel (the canonical Few/Heer form)
- **Stephen Few & Jeffrey Heer**, "Time on the Horizon" / "Sizing the Horizon" (InfoVis, 2009) — the formal perceptual study that established 3-band, ±-folded, intensity-stacked as the default
- **Bloomberg Terminal** FX-volatility and yield-curve dashboards (ongoing, 2010s–) — horizon strips for G10/EM currency baskets, on-screen alongside news
- **FT Markets** rate-tracker layouts (2022–2023 inflation coverage) — central-bank policy-rate horizon panels across ~20 economies

3 bands per side, amber-warm above baseline, rust/blue-cool below, single shared x-axis at the bottom. *Works because:* with 10+ rows the eye scans for *coincident dark patches* across strips — a market-wide event is literally a vertical column of intensity. *Fails when:* per-strip auto-scaling hides the fact that one series swings 10× another — looks calm when it's catastrophic in absolute terms.

### b. d3 / Bostock canonical example (the teachable form)
- **Mike Bostock**, "Horizon Chart" (d3 example block, 2012, re-published in Observable 2018) — the reference implementation that most engineering teams reverse-engineer from
- **Jason Davies**, "Horizon Charts" (2011) — the early d3 port that introduced most practitioners to the form

Uniform palette across strips (no per-series color), 3 bands, hard transitions between bands rather than smooth gradients. *Works because:* the visual grammar is *learnable in one glance* — show a reader one strip with a legend, they can read all of them. *Fails when:* designers smooth the band transitions into gradients and lose the stepwise intensity cue.

### c. Per-strip emphasis (one row colored, rest in neutral)
- **NYT Upshot** approval-tracker variants (2023, 2024) — horizon-like multi-row panels with the *focal* row in accent and the comparison rows in gray-on-gray
- **Reuters Graphics** election-night state-by-state swing strips (2020, 2024)

Hero strip in accent hue, comparison strips in a muted single hue (no positive/negative distinction for them). *Works because:* it collapses the 10-vs-1 spaghetti problem horizon would otherwise also suffer at scale. *Fails when:* the hero strip's baseline isn't the same as the comparison strips' — you've made an apples-to-oranges chart that looks like apples-to-apples.

### d. Calendar-grid horizon (Pudding / academic VIS)
- **The Pudding** "Tampons" / "Birth Months" pieces (2019, 2020) — multi-row calendar treatments where each row is a year
- **IEEE VIS** literature on horizon-chart density limits (Heer, Kong & Agrawala 2009 follow-up)

Each row is an explicit time-unit (year, season) rather than a series; the x-axis is within-unit (months, days). *Works for:* periodic signals (seasonality, recurring events). *Fails when:* the underlying signal isn't periodic — looks like noise.

## 3. General principles

Horizon charts encode the same data twice: vertically *and* via color intensity. Few & Heer (2009) showed empirically that this redundant encoding lets the eye resolve **3–4× as many parallel series** as standard line charts at equivalent panel height — the perceptual win comes from compressing y-space without losing the magnitude cue, because intensity substitutes for height. Cleveland's hierarchy ranks color saturation low for *precise* judgments but high for *categorical* and *relative-magnitude* judgments — exactly the trade horizon makes. Tufte's "small multiples" principle is the structural cousin: same encoding, repeated, varying only the data. Horizon is small-multiples taken to its compression limit. Munzner frames it as a "dense series-aligned visualization" — the strongest editorial use is *coincidence detection*, not value lookup.

The folded-negative convention (negatives mirror back upward in a contrasting hue) is non-obvious and must be either learned by the viewer or explained — a 3–4 second on-screen legend the first time the form appears in an episode is mandatory at video pace.

## 4. Recommendation for Parallax

**Default: 3 bands per side, amber positive / rust negative, 6–12 series, shared x-axis at the bottom, mono-weight series labels in the left gutter, per-strip auto-scaling — but flag the magnitude trade-off in narration when it bites.**

- **Bands:** 3 (Tufte / Few canonical). 2 reads as cartoon, 4+ as noise at scrub speed.
- **Positive color:** `palette.gold` (amber) — channel's warm "above-baseline" cue.
- **Negative color:** `semantic.china` (rust) — channel's contrast hue. The amber/rust pairing is colorblind-distinguishable and matches the rest of the data system.
- **Series count:** 6–12 ideal; 16 is the absolute ceiling (strip height drops below 24px and color discrimination breaks down).
- **Labels:** IBM Plex Sans, weight 600, in the left gutter; sublabel in mono small caps below.
- **X-axis:** single shared axis at the bottom of the stack, 6 evenly-spaced ticks, mono uppercase.
- **Animation:** strip-by-strip left-to-right sweep with stagger (~120ms per strip), baseline drawn first. The sweep is the legend — the viewer learns "stripe = series, intensity = magnitude" by watching it build.
- **First-appearance legend:** if this is the episode's first horizon chart, hold a 2-band reference strip on screen with the bands labeled ("1×", "2×", "3× baseline") for 3 seconds before the data sweeps in. The form is not self-explanatory.

## 5. Current template alignment

The existing `HorizonChart` template:

- Matches canon: 3-band default (clamped 1–5), ±-folded with amber/rust pairing, shared bottom x-axis, left-gutter labels, deterministic ordering top→bottom, left-to-right sweep with stagger, soft data warnings at >16 series and <6 obs per series.
- Matches canon: opacity-stacked bands (each band's polygon is positional, not additive — relies on overdraw for the stepped intensity).
- Matches canon: per-series `color` override exists but is documented as "sparingly" — uniform palette is the default.
- **Diverges (intentional):** per-strip auto-scaling. Each series normalizes to its own `max(|value − baseline|)`. This is the d3/Bostock convention and the right default *for shape comparison*, but it silently hides absolute magnitude differences across strips — a series swinging ±10% looks identical to one swinging ±0.5%. Documented in the JSDoc; not currently surfaced as a config switch.
- **Diverges (worth examining):** no on-screen legend or band-scale reference. The folded-negative grammar is unfamiliar to most viewers and needs a 2–3s tutorial frame the first time the form appears in an episode.
- **Diverges (minor):** uses a single `valueFormat` for axis ticks only; no per-strip terminal value display. Canon (Bloomberg) sometimes shows a tiny "current value" pill at the right edge of each strip — useful for the "what's this actually at right now" question.

## 6. Specific upgrades proposed

1. **Shared-scale mode** (`scaleMode?: "per-strip" | "shared"`). Per-strip stays the default; `"shared"` uses `max(|value − baseline|)` across *all* series for the band height, so strips with smaller swings show smaller intensity. Essential for stories where absolute magnitude *is* the comparison ("RUB swings 10× CNY"). Effort: low. Impact: high — closes the documented soft-failure mode.
2. **Inline first-appearance legend.** Optional `legend?: { show: true, bandValues?: [v1, v2, v3] }` that renders a labeled reference strip (with the actual band thresholds, e.g., "±2%", "±4%", "±6%") above the first strip, held for 3s before the sweep. Once the viewer learns the grammar, subsequent horizon charts can suppress it. Effort: medium. Impact: high — the form is not self-teaching.
3. **Terminal value pill.** Optional `showTerminalValue?: boolean` to render the final observation as a small mono pill at the right edge of each strip in the appropriate hue. Bloomberg-style "where it sits right now." Effort: low. Impact: medium.
4. **Coincidence-column highlight.** Optional `highlightX?: number | { from, to, label? }` to draw a faint vertical band across all strips at a specific x — for "this is the day everything moved together" moments. Effort: low. Impact: medium for editorial use.
5. **Band-count surfaced in the legend.** When `bands !== 3`, mention it inline (subtitle suffix: "3 intensity bands per side") — otherwise the viewer can't calibrate the encoding. Effort: trivial. Impact: small but doctrinally correct.

## 7. Failure mode flags (always catch in audit)

- ≤ 4 series — should be `TimeSeriesChart`, not horizon. The compression buys nothing at low N.
- > 16 series — strip height below 24px, color discrimination breaks down; split into two segments or move to a heatmap.
- Series with < 6 observations — the contour is too coarse for banding to read; use a bar chart.
- Per-strip auto-scaling used where absolute magnitude is the argument — silently hides the story.
- No legend / no orientation moment the first time the form appears in an episode — viewers won't decode folded negatives unaided.
- Bands = 1 (cartoon) or bands ≥ 5 (noise at scrub speed).
- Negative hue is too close to positive in luminance — the fold becomes invisible; amber/rust pairing tested OK, blue/red is also fine, amber/yellow is not.
- Strips ordered alphabetically when an editorial ordering exists (volatility rank, geographic clustering, "hero on top"). Top→bottom is reading order; use it.
- Mixing different value-format strips in one chart (one in %, one in $) without normalizing or labeling — looks like one comparable chart, isn't.
- Calling a horizon chart a "heatmap" in narration — it isn't; the y-axis within each strip is meaningful.

## TL;DR

**6–12 series, 3 bands per side, amber-up / rust-down, shared bottom axis, per-strip auto-scaled by default but with a `shared` mode for absolute-magnitude stories.** The current template matches canon; add a shared-scale mode and an on-screen legend before the form's first appearance in any episode.

Last updated: May 14, 2026

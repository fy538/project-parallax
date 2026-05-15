# PopulationPyramid — Research Dossier

> Created: May 15, 2026. Research compiled from primary sources (UN Population Division, Population Reference Bureau, NYT Graphics, FT, The Economist, Our World in Data); integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## TL;DR

**Bilateral horizontal bar chart by age cohort — male grows left from center axis, female grows right. Three variants: `single` (one pyramid, entrance + hold), `morph` (pyramid A builds in, then bars morph to pyramid B values with year cross-fade), `comparison` (two pyramids side-by-side with shared scale and center divider). Use `highlightAgeGroups` for the editorial accent cohort (e.g., working-age bulge). The pyramid shape itself is the argument: broad base = youth dividend, narrow base = aging cliff.**

---

## 1. The form's editorial purpose

The population pyramid earns its rectangle when **the demographic structure of a population is itself the geopolitical argument**. The viewer's takeaway should not be "China has X million people" — that's a StatReveal. The takeaway should be: *"China's age structure means the dependency ratio will invert within 15 years — and that structure is visible in the shape of this pyramid."* The form works when the shape communicates before the viewer reads any numbers.

Three distinct arguments map to three distinct pyramid shapes:

| Shape | Argument | Template variant |
|---|---|---|
| **Wide base, narrow top** | Youth dividend — large working-age cohort incoming; demographic pressure on education, employment | `single` with `highlightAgeGroups` on youth cohorts |
| **Column / barrel** | Aging plateau — near-equal cohorts; impending dependency ratio inversion | `morph` showing the transition from historical pyramid to current column |
| **Narrow base, wide middle** | Demographic cliff — shrinking youth cohort; structural labor shortage in 10–15 years | `morph` showing the transition, or `comparison` against a younger population |

### When not to reach for it

| Alternative | When it wins over PopulationPyramid |
|---|---|
| **DataChart** | The argument is about total population or a single aggregate figure, not age structure. |
| **StatReveal** | The argument is one number (median age, dependency ratio) rather than the full age distribution. |
| **TimeSeriesChart** | The argument is about how total population changed over time, not about current age structure. |
| **ChoroplethMap** | The argument is about geographic distribution of a demographic, not age-sex distribution. |

**PopulationPyramid's superpower fires when:** the age-sex distribution IS the geopolitical claim — "China is aging faster than its economy can adapt," "India's youth bulge creates a window," "Russia's demographic trough limits military replenishment."

---

## 2. Canonical idioms

### a. UN Population Division standard pyramid

The authoritative form: bilateral horizontal bar chart; age cohorts on the Y axis in 5-year groups from "0–4" at bottom to "75+" at top; male left, female right; bars in two muted colors (typically blue and pink, though editorially neutral alternatives exist); median age marked with a horizontal rule; dependency ratio annotated in the margin.

The UN's projection pyramids (medium-fertility variant) are the standard reference for geopolitical demographic arguments. The 5-year cohort structure (17–18 rows for "0–4" through "80+") is the canonical data format. The template's `PyramidCohort` type exactly matches this: `ageGroup: string, male: number, female: number`.

*Works because:* the bilateral symmetry encodes biological sex-distribution at a glance; the cohort staircase shape encodes fertility history (each cohort is the result of fertility rates 5–10–15 years earlier). *Fails when:* used for non-human populations, cohort intervals other than 5 years (irregular intervals break the staircase logic), or more than 22 cohorts (too many rows compress below readability — the template `warnIf`s this).

### b. PRB (Population Reference Bureau) animated pyramid

The Population Reference Bureau's editorial animations use a growing-bar entrance: bars grow from the center axis outward, revealing the staircase shape from youngest cohort upward. This is the entrance animation convention the template implements (stagger from cohort index 0 = youngest, growing outward). The growing-bar entrance makes the bilateral symmetry legible before any individual bar is read.

*Works because:* the animation reveals the shape progressively — the viewer's eye first registers "is this balanced or unbalanced?" before reading individual cohort sizes. *Fails when:* entrance animation is too fast (all bars arrive simultaneously), the shape is lost.

### c. NYT "aging population" area approach

NYT Graphics occasionally uses filled areas rather than bars for smoother pyramid shapes, particularly for the "Baby Boomer bulge" argument where the editorial point is the peak of the distribution, not the cohort-by-cohort structure. The area approach highlights the cohort with the largest population (the accented "bulge" cohort) without requiring the viewer to count bars.

The template's `highlightAgeGroups` field implements a version of this: highlighted cohorts get amber/gold bars and accent glow, while non-highlighted cohorts are in the standard male/female colors. This serves the editorial function without switching to filled areas (which would require an SVG path and lose the bilateral symmetry).

### d. The Economist "demographic dividend" overlay pyramid

The Economist's demographic time-bomb graphics show two pyramids overlaid: projection (outline, lighter weight) on top of current (filled). The "current vs. projected" argument is the editorial point — "look at how the shape will change."

The template's `morph` variant implements the temporal argument differently: a single pyramid that transitions from cohorts A (year 1990) to cohorts B (year 2025), with a year label cross-fading from A to B during the morph. This is editorially stronger for video: the viewer sees the transformation happen rather than comparing two static states.

*Works because:* morph makes the demographic shift kinetic — the bars physically grow or shrink as the year changes. *Fails when:* the morph is too fast (< 0.8s) — the bars jump rather than shift.

### e. Side-by-side comparison (China vs. India, China vs. US)

The standard editorial form for geopolitical demographic arguments. FT and Reuters frequently publish China-vs-India or Russia-vs-Ukraine side-by-side pyramids to argue that "China's aging undercuts its strategic advantage over India's youth bulge." The template's `comparison` variant directly implements this: two `SinglePyramid` instances on a shared `maxValue` scale, separated by a hairline divider.

*Works because:* shared scale means bars are directly comparable — a bar of the same length = the same absolute population. *Fails when:* the two populations have very different scales (e.g., India 1.4B vs. Taiwan 23M) — one pyramid's bars are barely visible at the shared scale. The template's `maxValue` override addresses this: set a manually chosen `maxValue` that makes both pyramids legible.

---

## 3. General principles

The population pyramid is one of the oldest statistical graphics (William Playfair's 18th-century work already encoded demographic data bilaterally). Its survival reflects a genuine perceptual advantage: bilateral symmetry about a center axis is one of the brain's most automatic detection mechanisms. The viewer's eye reads "balanced" vs. "unbalanced" before processing any numbers.

Tufte's data-ink principle: the bars are the data; the axis, center line, and cohort labels are the minimum structure. No gridlines inside the bars, no fill patterns, no 3D effects. The template achieves this: alternating-row background stripes at 6% ink opacity are below the threshold of visual noise but above the threshold of zero.

Cleveland & McGill: bilateral bars encode "length from a common baseline" — the #2 perceptual encoding. The center axis is the common baseline. Both male and female bars use this encoding, which is why the form is more accurate than pie charts or area charts for demographic comparisons.

**Highlighted cohorts (POLISH D5):** the editorial argument usually focuses on one age range — the working-age bulge (20–49), the senior dependency cohort (65+), or the youth cohort (0–14). `highlightAgeGroups` gives those cohorts amber bars and glow treatment. Everything else reads as supporting context. This is the "protagonist" discipline applied to demographic data.

---

## 4. Recommendation for Parallax

**Variant selection:**
- `single`: default. One pyramid, entrance animation, `holdAfterRevealSec` for the argument to land. Use when the current age structure is the argument.
- `morph`: for "how the shape changed" arguments — China 1990 → China 2025. The year label cross-fades; bars shift. Use when the transformation is the argument.
- `comparison`: for "X vs. Y" arguments — China vs. India, Russia vs. US, Japan vs. Nigeria. Use when the contrast between two current structures is the argument.

**Data sourcing:** always source from UN Population Division (*World Population Prospects 2024*) or national statistics agencies. The `source` field is mandatory. PRB maintains a free data browser at prb.org; Our World in Data provides downloadable CSVs from the same UN source.

**Age groupings:** the standard 5-year groups from "0–4" to "80+" (17 cohorts) are the canonical form. The template handles up to 22 cohorts; below 5 cohorts the pyramid loses its staircase logic and should be simplified to a DataChart. For arguments about specific age ranges (youth vs. working-age vs. senior), the 5-year group structure lets `highlightAgeGroups` target exactly the editorial-relevant cohort.

**Color assignments (light-mode defaults):**
- Male: `semantic.us` (blue) — cool, recessed.
- Female: `semantic.china` (rust) — warm, prominent.
- Highlighted cohort: `palette.gold` — editorial accent.

The male/female color convention is consistent with UN/PRB editorial practice (blue for male, warm for female) even if the specific hues differ. The rust-for-female is a Parallax palette constraint — in the standard editorial context, rust equals conflict/China, which creates a potential semantic collision for episodes where China's demographics are the argument. In those cases, override `comparison.left.color` and `comparison.right.color` explicitly.

**`backgroundVariant`:** hardcoded to `"light"` in the template. Demographic data is analytical register — the light-mode paper background is correct. Dark mode would be appropriate for a high-drama argument ("Russia's population collapse threatens its military capacity") but requires a template upgrade (see §6).

**Duration:**
- `single` with 17 cohorts: `durationSec: 8–10`. Entrance finishes at ~2.2s (last cohort at stagger 16 × 40ms + 500ms grow = 1.14s); holds for 6–8s.
- `morph`: add `holdAfterRevealSec: 1` (pause on initial pyramid before morphing) + 0.8s morph + 2–3s hold on final = `durationSec: 10–12`.
- `comparison`: same as single; two pyramids entrance-stagger offset by `sec(0.2)`.

---

## 5. Current template alignment

- ✅ Three variants (`single`, `morph`, `comparison`) with `warnIf` guards for missing required fields
- ✅ Bar entrance stagger from cohort 0 (youngest) upward — matches PRB animated pyramid convention
- ✅ Bars grow from center axis outward (not from left edge) — bilateral symmetry legible at video scrubbing speed
- ✅ `highlightAgeGroups` → amber bars + accent glow — POLISH D5 protagonist cohort correct
- ✅ Alternating row stripe (6% ink opacity) — below visual-noise threshold, above zero (readability aid for dense cohort stacks)
- ✅ Gender legend (MALE / FEMALE) above pyramid in Plex Mono uppercase, era accent color — POLISH T4 (label typography) correct
- ✅ Scale tick at pyramid edges ("← 50k" / "50k →") — gives quantitative anchor for the bar lengths
- ✅ `morph` variant: `YearLabel` cross-fades from `labelA` to `labelB` during morph — Economist overlay-pyramid convention adapted for animation
- ✅ `comparison` variant: shared `computedMax` scale across both pyramids — direct comparability
- ✅ Center divider hairline in comparison variant: gradient-fade rule, appears at `sec(0.5)–sec(0.9)` — not present during entrance phase
- ✅ `<SourceAttribution>` with `prefix: "Source: "` and `startSec: 2` — standard attribution
- ✅ `warnIf(data.cohorts.length > 22)` — template-level legibility guard
- ⚠️ Male/female color assignment (`semantic.us` blue / `semantic.china` rust) creates semantic collision for China-focused demographic arguments. The `comparison.left.color` / `comparison.right.color` overrides address this, but `single` and `morph` variants have no color override — they always use the default semantic colors.
- ⚠️ `backgroundVariant` hardcoded to `"light"` — dark mode not available.
- ⚠️ Morph animation is a simple linear interpolation between A and B cohort values. For demographic morph arguments (1990 → 2025), a more accurate morph would follow cohort aging: the "0–4" cohort in 1990 *becomes* the "35–39" cohort in 2025, not an in-place bar-value change. The current morph is editorially acceptable (it communicates "shape changed") but statistically imprecise (it doesn't track cohort trajectories).
- ❌ No median age indicator. The median age is the single most legible summary statistic for a population pyramid — a horizontal dashed line at the median cohort makes "aging" vs. "young" populations immediately legible. UN standard marks this.
- ❌ No dependency ratio annotation. Youth dependency ratio (cohorts 0–14 / cohorts 15–64) and senior dependency ratio (cohorts 65+ / cohorts 15–64) are the quantitative expressions of the pyramid's shape argument. These are standard in PRB and UN publications.
- ❌ No projected overlay mode (Economist dual-pyramid). The `morph` variant serves a similar function but does not allow the current pyramid and projected pyramid to be shown simultaneously for direct comparison.

---

## 6. Specific upgrades proposed

1. **Median age indicator.** Compute the median age from `cohorts` (or interpolate within the cohort that contains the 50th percentile) and render a horizontal dashed amber rule at that cohort's Y position, labeled "Median: X years" in Plex Mono caption size. This is the single highest-value addition — it converts the visual shape into a named statistic. Effort: medium (requires sorting cohorts and computing cumulative population); impact: high (adds the most cited demographic summary statistic). **(medium effort / high impact)**

2. **`backgroundVariant` support.** Pass `data.backgroundVariant` to `Background` and `useThemeMode` instead of hardcoding `"light"`. Required for crisis/conflict-register demographic arguments. Effort: small; impact: opens a register currently unavailable. **(low effort / medium impact)**

3. **Male/female color overrides for single/morph variants.** Add `data.maleColor?: string` and `data.femaleColor?: string` to `PopulationPyramidData`, passed through to `SinglePyramid`. Resolves the semantic collision for China-focused episodes where `semantic.china` (rust) as the female color is misleading. Effort: trivial; impact: removes a latent semantic error. **(trivial effort / medium safety impact)**

4. **Dependency ratio annotation.** Compute youth (0–14) and senior (65+) cohort totals vs. working-age (15–64) total, and render two small annotation rows below the pyramid: "Youth dependency: 0.45" and "Senior dependency: 0.22" in Plex Mono meta size, muted color. Fades in after `holdAfterRevealSec` ends. Effort: small; impact: adds the quantitative version of the pyramid's shape argument. **(low effort / medium impact)**

5. **Projected overlay mode.** Add `data.projected?: PyramidCohort[]` field. When present, renders a second pyramid in outline (1.5px stroke, no fill) on top of the primary pyramid for the Economist dual-pyramid effect. Requires the shared scale to accommodate both datasets. Effort: medium; impact: enables the "current + projected" argument without a morph animation. **(medium effort / medium impact)**

---

## 7. Failure mode flags (always catch in audit)

- **Too many cohorts (>22)** — the template warns; row height drops below readability (< 28px). Standard 5-year groups up to "80+" gives 17 cohorts — the optimal density. Above 17, consider aggregating into 10-year groups for 9 cohorts.
- **Morph without `cohortsB`** — the template warns; the morph phase has no target. Morph variant requires both `cohorts` (year A) and `cohortsB` (year B) and `labelA`/`labelB`.
- **Comparison without `left`/`right`** — the template warns. Comparison variant requires both objects.
- **Mismatched cohort counts in morph** — `cohorts` and `cohortsB` must have the same number of age groups at the same age group labels. A mismatch means some cohorts have no morph target and bars jump to zero.
- **Shared scale too compressed in comparison** — when two populations differ by 10× or more in absolute size (e.g., India vs. Singapore), the shared scale makes the smaller population's bars barely visible. Use `data.maxValue` to manually cap the scale at a value that makes both legible, and document the decision in the data file comment.
- **No `highlightAgeGroups` for episodes with a specific demographic argument** — if the episode narration says "the working-age cohort is the decisive factor," the bars for working-age cohorts (20–49) must be highlighted. Without it, the viewer sees undifferentiated bars and must find the editorial point themselves.
- **Missing `source`** — population data always comes from a named agency (UN Population Division, national statistics bureau, PRB). No exceptions.
- **Cohort labels not in standard format** — the standard is "0–4", "5–9", ..., "75+" (with "+" for the open-ended oldest cohort). Non-standard labels ("under 5", "20-24 years", "75 and over") break the visual cadence of the staircase.

Last updated: May 15, 2026

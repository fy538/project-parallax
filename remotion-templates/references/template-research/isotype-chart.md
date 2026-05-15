# IsotypeChart — Research Dossier

> Created: May 15, 2026. Research compiled from primary sources (Neurath 1936, Hartshorn/Mead 2019 Neurath retrospectives, FT pictogram unit chart conventions, The Economist unit chart, Reuters infographics, NYT vaccine coverage unit charts); integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## TL;DR

**Quantities expressed as N repeated icons instead of bars — "92 of 100 advanced chips come from one company" rendered as 92 amber chip icons and 8 muted ink icons. Two variants: `proportion` (single grid with "X of Y — Label" annotation) and `comparison` (multiple labeled rows). Icons pop in sequentially with stagger. The form's claim: abstract billions feel human-scale as counted icons. Neurath's rules are the authority.**

---

## 1. The form's editorial purpose

The IsotypeChart earns its rectangle when **a quantity's human significance is better communicated by counting visible units than by reading a number**. The viewer's takeaway should be: *"I can see — almost literally count — how concentrated/dominant/rare that is."* Use it when the narration uses "out of" language: "92 of every 100 advanced logic chips," "8 of 10 NATO members," "3 of 5 largest ports." The counted icon is the form's payload; the number below it is the label, not the argument.

This is not a bar chart with icons instead of bars. In a bar chart, bar length encodes quantity. In an ISOTYPE chart, icon count encodes quantity — and crucially, each icon is identical in size. **Scaling an icon to represent a larger quantity is the ISOTYPE chart's cardinal sin** (see §3).

### When not to reach for it

| Alternative | When it wins over IsotypeChart |
|---|---|
| **DataChart** | Quantities span multiple orders of magnitude (icons at different counts become unreadable). |
| **StatReveal** | The argument is a single hero number with comparisons, not a proportion argument. |
| **PopulationPyramid** | The quantity is a population by age group — the bilateral bar form is the standard. |
| **BayesianUpdate** | The argument is a probability that updates over time, not a fixed proportion. |

**IsotypeChart's superpower fires when:** the proportion argument is the editorial core, the total is ≤ 100 (or scaled to 100), and the icon type has inherent meaning that calibrates scale ("each figure = 1 aircraft carrier" makes 12 carriers visceral; "each chip = 10 billion wafers" does not — scale calibration requires the icon to have a legible unit).

---

## 2. Canonical idioms

### a. Otto Neurath ISOTYPE system (1920s–1940s)

Otto Neurath (Vienna Social and Economic Museum, 1925–1934; later Isotype Institute, Oxford, 1942–1945) developed the International System of Typographic Picture Education as a visual language for communicating social statistics to non-literate audiences. The key publications: *Society and Economy* (1930), *Modern Man in the Making* (1939), *International Picture Language* (1936).

**Neurath's three foundational rules:**
1. **Quantity by number of symbols, never by size.** Each icon represents the same fixed quantity. To show 2× as much, use 2 icons, not 1 icon at 2× size. Scaling an icon conflates two different perceptual channels (size and count) and creates perceptual distortion.
2. **Symbols are identical.** Only the count varies. Color may distinguish categories, but shape must be constant within a category.
3. **Color for category, not quantity.** Two colors = two categories (highlighted vs. non-highlighted). Color ramps, gradients, or color-quantity mappings are incompatible with the ISOTYPE system.

Gerd Arntz designed the canonical ISOTYPE pictograms (200+ symbols for occupations, populations, resources, industries). The template's `IsotypeIconType` enum (`"person"`, `"soldier"`, `"ship"`, `"plane"`, `"chip"`, `"dollar"`, `"house"`, `"circle"`) is a Parallax subset of this vocabulary.

### b. FT "pictogram chart"

The Financial Times's data team (John Burn-Murdoch, Steven Bernard) uses the pictogram chart for casualty counts, displaced persons, and voting breakdowns. FT house style: SVG icons at fixed size (typically 12–16px); partial icon shown at the last unit position for fractional counts (67% = 67 full icons + two-thirds of a 68th icon); legend reads "Each figure represents X." FT omits the count-up animation (static charts); the sequential pop-in animation in the template is the Parallax adaptation for video.

*Works because:* partial icons are editorially honest (67.3% of 100 ≠ 67 icons; the 0.7-icon partial is correct). *Not yet in template:* partial icons are not implemented — the template uses only integer counts. This is an upgrade opportunity (see §6).

### c. The Economist "unit chart"

The Economist uses dots or circles rather than pictograms to preserve the ISOTYPE counting principle without the connotation baggage of human-figure icons (a human-figure icon for displaced persons carries different weight than for voter counts). The `"circle"` icon type in the template serves this function — it preserves the counting argument without the pictogram's associative weight.

*Works because:* dots are visually neutral and universally legible. *Fails when:* scale calibration matters — "each circle = 1 aircraft carrier" needs the carrier icon to be legible; a circle cannot carry that semantic load.

### d. Reuters infographics "people charts"

Reuters uses human silhouettes for casualty and displacement stories. Key Reuters convention: never use red for casualty figures (uses muted terracotta or grey); always includes an explicit count legend ("Each figure = 1,000 persons"); icon density (total N displayed) is kept ≤100 for legibility. Reuters' designers avoid the natural temptation to represent large numbers by scaling icons — "1 large icon = 1 million" violates Neurath rule #1.

*Works because:* human-scale calibration ("each figure = 1,000 persons") makes millions comprehensible. The viewer can scan the grid and say "there are about 40 figures, so 40,000 displaced" — the estimation task is what makes the form communicative. *Fails when:* N > 100 (legibility collapses) or the count-unit is too large (each figure = 100 million is no longer human-scale).

### e. NYT vaccine coverage unit chart

NYT Graphics uses the proportion variant heavily for vaccine coverage stories: "87 of 100 people in the US are vaccinated" — 87 amber figures, 13 muted grey figures. The annotation below reads "87 of 100 — Vaccinated" in a specific typographic hierarchy. The template's `proportion` variant and its annotation ("87 of 100 — LABEL") directly implement this idiom.

*Works because:* vaccine coverage is a proportion argument that maps perfectly to the N-of-100 ISOTYPE form. The 100-icon grid is scannable; the viewer's eye estimates the proportion before reading the number. *Fails when:* the proportion is not normalized to 100 — "246 of 349 countries have Y" requires a 349-icon grid, which is illegible.

---

## 3. General principles

Neurath's foundational insight is that **the counted icon engages the viewer's enumeration faculty rather than their numerical-reading faculty**. Humans can estimate "about 80 of 100" icons more accurately and more viscerally than they can process "80.4%" from a number — even though both communicate the same datum. The form works because it converts a numerical argument into a spatial density argument.

**The three rules again, with editorial consequences:**

1. **No scaling.** "1 big icon = 100 small icons" is a common and editorially catastrophic violation. The viewer's eye cannot resist interpreting size as magnitude — a 2× scaled icon reads as twice the value even when labeled otherwise. The template enforces this: `iconSize` is a single constant that applies uniformly.

2. **No partial icons for emphasis.** The only valid partial icon is the fractional remainder of the counted total (FT style). Never use a partial icon to draw attention to a subset — use color instead.

3. **Color for category only.** Amber for highlighted, muted ink for non-highlighted. No gradient within a category. The template's `accentColor` (amber/gold) + `mutedColor` (ink at 25% opacity) implements this correctly.

**Acceptable departures from strict ISOTYPE:**
- *Sequential pop-in animation:* Neurath's system was designed for static print. Sequential icon pop-in is a video adaptation that communicates the counting argument kinetically without violating the spatial density argument.
- *Per-row icon variation in comparison variant:* `IsotypeRow.icon` allows different icon types per row. This violates Neurath's "symbols are identical" rule but is editorially valid when rows represent different entity types (e.g., ships vs. planes in a military comparison). Name the violation in the data file comment.
- *Integer rounding:* representing 67.3 of 100 as 67 icons (dropping the fractional remainder) is a minor accuracy concession for the sake of legibility. The FT partial-icon approach is more accurate but more complex.

**Video-specific constraint:** maximum 100 icons at `iconSize: 36` (the default) fills approximately 4 rows of 20 icons at standard 1080p layout. Above 100 icons, the grid becomes illegible at scrub speed. The template `warnIf`s above 200 icons. The practical limit for editorial legibility is ≤100 at 36px or ≤200 at 24px.

---

## 4. Recommendation for Parallax

**Default icon:** `"circle"` for abstract quantities (percentages, proportions, shares). `"person"` for human populations, casualties, displaced persons. `"chip"` for semiconductor market share arguments. `"soldier"` for military strength. `"ship"` for naval/trade arguments. `"dollar"` for financial concentration.

**Proportion variant:** the primary use case. 100-icon grid (`total: 100`) normalized to represent the actual proportion. `highlighted` = proportion × 100 (rounded). `highlightLabel` = the entity name ("TSMC," "NATO members," "advanced nodes"). `totalLabel` = the reference universe ("global output," "all members," "production").

**Comparison variant:** use for 2–5 entity comparison where each row has the same `total` and different `highlighted` values. E.g., "US: 65 of 100 advanced fabs" + "Taiwan: 92 of 100" + "China: 15 of 100." Rows must share the same `total` for comparability (Neurath rule #2: same icon = same quantity across rows).

**Typography of the annotation (proportion variant):**
- Highlighted count: JetBrains Mono 700 at `h2` size (48px), `accentColor` — the number that matters
- "of" connector: IBM Plex Sans 400 at `body` size (22px), `text.secondary`
- Total: JetBrains Mono 500 at `h3` size (36px), `text.secondary`
- `highlightLabel`: IBM Plex Mono 600 at `label` size, uppercase — the entity name
- `totalLabel`: IBM Plex Sans at `label` size, muted — the universe

**Icon size guidance:**
- `total: 10`: `iconSize: 64` — 10 large icons communicate counting at a glance
- `total: 20`: `iconSize: 48`
- `total: 50`: `iconSize: 36` (default)
- `total: 100`: `iconSize: 28`
- `total: 200`: `iconSize: 18` — at this density, use `iconsPerRow: 20` explicitly

**Attribution:** `source` and `unitLabel` are both required. The `unitLabel` ("Each figure = 1 billion USD," "Each chip = 1,000 wafers") is the scale calibration without which the ISOTYPE argument fails. It fades in after all icons have appeared.

---

## 5. Current template alignment

- ✅ ISOTYPE rule #1 enforced: `iconSize` is uniform — no per-icon size variation
- ✅ ISOTYPE rule #2 enforced: icon shape is uniform within each variant (per-row icon type override in comparison is explicitly available but flagged as a Neurath violation in docs)
- ✅ ISOTYPE rule #3 enforced: `accentColor` for highlighted, `mutedColor` for non-highlighted — no color ramps
- ✅ Sequential icon pop-in with per-icon stagger (1 frame per icon, capped at 4s total) — video adaptation of the counting argument
- ✅ Proportion variant: "X of Y — Label" annotation with three-tier typography hierarchy (JetBrains Mono for numbers, Plex Sans for connector, Plex Mono for label)
- ✅ Count-up display (0→highlighted count) runs parallel to the icon pop-in — number arrives as icons appear
- ✅ `unitLabel` fades in after all icons have appeared — avoids the label competing with the grid during entrance
- ✅ `warnIf` for >200 icons, >total highlighted, empty comparison rows
- ✅ `iconsPerRow` override for dense grids — `computeIconsPerRow()` auto-calculates a square-ish grid by default
- ✅ `<SourceAttribution>` with standard attribution
- ✅ Content area centered vertically and horizontally — POLISH D3 (center content when not filling canvas)
- ⚠️ Accent color hardcoded to `palette.gold` — does not consume episode emphasis (`useEpisodeColorEmphasis`). For Soviet-emphasis episodes, the primary accent should be rust+bronze, not gold. The mismatch would be visually jarring against the episode's color emphasis in surrounding compositions.
- ⚠️ Comparison variant comparison rows pop in by row index stagger (`rowStartFrame = sec(0.3) + rowIndex × sec(0.3)`). For rows with large `total` (50+ icons), the last row's icons may still be popping in after `durationSec` expires. No auto-calculated `durationSec` guard.
- ⚠️ No partial icon support — 67.3 of 100 is rounded to 67, dropping the 0.3 remainder. FT-style partial icons (two-thirds of an icon at position 68) would be more accurate.
- ❌ Per-icon glow is absent — the accent icons (amber/gold) could benefit from a subtle glow on the highlighted portion of the grid to create a visual gradient from "highlighted" to "muted" without violating rule #3. Not a color ramp — just shadow.
- ❌ No `backgroundVariant` support — hardcoded to `"light"` mode.

---

## 6. Specific upgrades proposed

1. **Episode emphasis for accent color.** Replace `const accentColor = palette.gold` with `const { primaryAccent: accentColor } = useEpisodeColorEmphasis()`. This aligns the IsotypeChart's highlighted icon color with the episode's color emphasis (amber for neutral, rust+bronze for Soviet episodes, etc.). Effort: trivial; impact: consistency with the 5 high-impact templates that already consume emphasis. **(trivial effort / medium impact)**

2. **Partial icon for fractional remainders.** When `highlighted` is not an integer (or when `total` and the proportion don't divide evenly), render the last icon as a fractionally filled SVG using `clipPath`. E.g., `highlighted: 67.3, total: 100` → 67 full amber icons + 1 icon that is 30% amber. Implements the FT standard. Effort: medium (requires SVG clipPath per fractional icon); impact: removes rounding error that is visible when N is small (10-icon grid, 3.3 highlighted = shows as 3, not 3.3). **(medium effort / medium accuracy impact)**

3. **`backgroundVariant` support.** Pass `data.backgroundVariant` through to `Background` and `useThemeMode`. Dark mode IsotypeCharts have editorial precedent for crisis-context casualty counts. Effort: small; impact: opens a register currently unavailable. **(low effort / medium impact)**

4. **Auto `durationSec` guard for comparison variant.** Compute the minimum `durationSec` needed for all rows to complete their icon pop-in: `sec(0.3) + (rows.length - 1) × sec(0.3) + maxRowTotal × sec(0.04) + sec(1)`. Emit a `warnIf` if `data.durationSec` is shorter than this. Effort: small; impact: prevents compositions where the last row's icons never finish animating. **(low effort / high correctness impact)**

5. **Icon glow on highlighted icons.** Add `filter: drop-shadow(0 0 3px ${accentColor}60)` to highlighted `IsotypeIcon` instances (not to muted ones). This creates a warm halo on the highlighted portion of the grid that makes the density boundary legible without a color ramp. Neurath rule #3 is not violated because the glow is within-category (all highlighted icons glow equally), not a color ramp. Effort: small; impact: improves visual hierarchy of the highlighted proportion. **(low effort / medium impact)**

---

## 7. Failure mode flags (always catch in audit)

- **Scaled icons** — any use of `iconSize` to encode quantity magnitude rather than using icon count is a Neurath rule #1 violation. If one row in the comparison variant has `iconSize: 72` and another has `iconSize: 36` to "show twice as much," the form is lying. Use count, not size.
- **Color ramps or gradients within a category** — Neurath rule #3. Color is for category (highlighted vs. muted), not for quantity. If a data author sets `row.color` to a gradient or tries to use three colors to show three levels of a quantity, redirect to DataChart.
- **Missing `unitLabel`** — without the scale calibration ("Each figure = 1 billion USD"), the ISOTYPE argument fails: the viewer knows 92 icons are highlighted but not what each icon means. Always include `unitLabel`.
- **Total > 100** — proportions not normalized to 100 produce grids of 246 or 349 icons that are illegible at video scrubbing speed. Normalize: 246 of 349 → "71 of 100 (normalized)" with a note in `totalLabel: "(scaled to 100)"`.
- **Proportion > total** — `highlighted > total` — the template `warnIf`s this; audit must verify that the underlying numbers are correct, not just the JSON.
- **Per-row icon type variation without labeling it** — using `"ship"` in one comparison row and `"plane"` in another implies that ships = planes at the same count. This is only valid if the editorial argument treats them as comparable units. If not, use the same icon for all rows and distinguish by label.
- **More than 5 comparison rows** — the comparison variant's row stagger and icon density compound; 6+ rows at 50+ icons each exceeds 300 icons on canvas, all simultaneously entering at different stagger offsets. The animation is unintelligible. Cap at 5 rows, or reduce `total` to 20 per row for dense comparisons.
- **Count-up run time exceeds composition duration** — the count-up runs for `sec(2)` starting at `sec(0.3)`. For very short compositions (`durationSec: 4`), the count-up finishes at frame ~69 and the full number is visible for only ~51 frames before exit. Ensure `durationSec ≥ 6` for any proportion variant.

Last updated: May 15, 2026

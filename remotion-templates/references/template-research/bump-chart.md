# BumpChart — Research Dossier

> Created: May 15, 2026. The canonical Parallax template for rank-over-time arguments — power transitions, league table shifts, soft-power surveys. Update when new outlet conventions are observed.

## TL;DR

The BumpChart is the form for "who rose, who fell, who held" arguments over time. It shows N named entities tracing their ordinal rank position across M discrete periods — not absolute values, rank — so a crossing line is a transfer of status, not just a numeric change. Use it when the editorial point is comparative position over time: a rising power displacing an incumbent, a once-dominant actor sliding to irrelevance, a field of competitors reshuffling over decades. The natural companion to TimeSeriesChart (which shows magnitude) and the DumbbellPlot (which shows a single before/after snapshot). Reach for BumpChart when there are three or more periods and the story lives in the trajectory of rank positions, not in the size of any one number.

---

## 1. The form's editorial purpose

The bump chart earns its frame when **rank is the argument and the movement between ranks is the story**. Nodes are named entities (countries, companies, weapons systems, cultural exports); the x-axis is a sequence of discrete time periods; the y-axis is ordinal rank position with rank 1 at the top. Crossing lines are the visual sentences: *"China surpassed Japan between 2000 and 2010," "the US and the USSR were locked in a deadheat for three decades before the Soviet collapse."*

The form deliberately strips absolute value — two entities that are 50 points apart in value are drawn at adjacent ranks if nothing separates them ordinally. This is a feature for geopolitics: power transitions are almost always about *relative standing*, not absolute capability. The argument is never "China has this many dollars of GDP"; it's "China overtook Japan for second place."

### When *not* to reach for it

| Alternative | When it wins over BumpChart |
|---|---|
| **TimeSeriesChart** | The story is about the *magnitude* of a variable over time, not the rank. Use TimeSeriesChart for "US GDP grew from X to Y"; use BumpChart for "the US fell from 1st to 3rd in patent applications." |
| **DumbbellPlot** | Only two time points (before/after). BumpChart's crossing-line geometry requires at least three periods to pay its cost. |
| **DataChart** | Cross-sectional comparison at a single moment — who has the most right now. No temporal trajectory. |
| **FrameworkDiagram matrix** | The argument is about *position in a two-variable space* (capability × will), not ordinal rank. |

**BumpChart's superpower fires when:** there are 3–8 named actors, 3–12 discrete time periods, and the editorial point is a rank crossing or a sustained hold — the crossing line IS the visual argument.

---

## 2. Canonical idioms

### a. The Economist "annual power rankings" form

The Economist uses bump charts for recurring power rankings — economic size, military spending, soft-power indices (EIU, Lowy, Portland), technology leadership. Key conventions in their style:

- **Rank 1 at top** (always, without exception) — highest rank at top reflects the natural language of "rising" and "falling"
- **Clean dots at every column** — the dot is mandatory, it marks each period as a discrete measurement, not an interpolation
- **End-labels on the right only** — entity names live at the right edge after the last period; no legend, no inline labels mid-line
- **Minimal gridlines** — only horizontal rules at each rank position, extremely faint (often <15% opacity, dashed), serving as a reading rail for the y-axis rather than a grid
- **No fill between lines** — the line is the entity; fill creates phantom shapes between crossing lines that have no meaning
- **Muted palette for most entities, single accent for the protagonist** — all lines start grey; the country or actor the story is about gets the amber accent

*Works because:* the form is maximally stripped — every pixel is either a line (an entity's trajectory) or a dot (a measurement). The eye reads crossings as events, not as visual clutter. *Fails when:* used for more than 8–10 entities; the crossing-line density creates a "hairball" and the eye can't thread any single path.

### b. FT "league-table bump" — the highlighted-one form

The Financial Times uses bump charts for GDP rankings and trade-partner share shifts. Their canonical form is the **"highlight one"** idiom: one line (the story's subject) rendered in the accent color at full opacity and full stroke weight; all other lines rendered in a single muted grey at reduced opacity. Caption sits at the right-edge label of the hero entity.

This is the form's most editorially potent variant. The muted grey lines supply context ("the US wasn't alone in this; here's where everyone else was"), but the story is the amber line cutting through. *Works because:* it focuses a multi-entity chart onto a single narrative. *Fails when:* two entities share the editorial protagonist role — then you need two accent colors (amber + rust) with strict visual separation.

### c. Guardian sports-season trajectory form

The Guardian uses bump charts for Premier League and Formula 1 season standings, tracking teams or drivers across race/match weeks. Key conventions that differ from the geopolitical form:

- **Fractional ranks for ties** — in sports, a two-way tie at position 1 is shown as rank 1.5 (both entities drawn at the midpoint between row 1 and row 2). This is the sports convention: it makes "both teams on 45 points" visually legible as a tie.
- **High time resolution** — 20–38 game weeks per season, producing dense crossings. Fonts are smaller; dots may be omitted between weeks.
- **Relegation / promotion zones** — band fills below a threshold line indicating the zone boundary.

Note: this is **not** the convention used in the BumpChart template, which implements the **1224 competition ranking** (tied entities share the same integer rank, next rank skips). The 1224 convention is the analytical standard for indices, league tables, and policy datasets; the fractional-rank convention is the sports broadcast standard. Use the template's default (1224) for geopolitics; do not import the sports fractional convention without explicitly setting a tie-breaking policy.

### d. Our World in Data / Gapminder animated ranking form

OWID uses animated bump charts (and animated bar-races) for development indicators: infant mortality rankings, HDI league tables, literacy-rate rankings. Key OWID conventions:

- **Smooth interpolation between periods** — the animated form sweeps smoothly through intermediate positions between two annual data points, giving a film-like sense of entities racing
- **Opacity fade for entities with missing data** — if a country didn't report data for a year, its line fades to near-transparent for that segment rather than drawing a false connection
- **Color by region** — entities colored by continental/regional group, not by which one is the protagonist
- **Large entity counts (20–40)** — balanced by muting all non-labelled entities to 10–15% opacity

The template's sparse-gap handling (null rank produces a transparent segment) directly mirrors the OWID approach. The smooth interpolation is not yet implemented; step-transitions (the default) read correctly for annual geopolitical data where each column is a discrete measurement event.

### e. Bloomberg "trade-partner shift" form

Bloomberg uses bump charts for showing which countries rose and fell as trading partners over decades — who became China's top five partners between 2000 and 2020, how the US trade-partner composition shifted. Key Bloomberg conventions:

- **Column labels as events** — each period label doubles as a brief annotation ("2008: financial crisis", "2018: tariff war") embedded in the x-axis label or in a sub-caption beneath the period
- **Divergent color coding** — entities that rose overall in warm amber tones; entities that fell overall in cool slate/grey tones. Color encodes trajectory direction, not identity.
- **Thick terminal end-segment** — the last segment between the penultimate and final period is drawn slightly heavier, focusing attention on where entities landed

*Works because:* the color-direction encoding lets the eye immediately see "which group rose, which fell" before reading any labels. *Fails when:* the direction of a trajectory is ambiguous (an entity rises then falls then rises) — color is then incorrect and misleads.

---

## 3. General principles

The bump chart is a specialized form of line chart constrained to an ordinal y-axis. Because the y-axis is discrete (integer ranks), the form cannot use continuous-scale position, which means Cleveland & McGill's perceptual hierarchy — position along a common scale is the most accurate encoding — applies with a caveat: the positions are meaningful only relative to each other, not in absolute terms. The chart asks the viewer to read *relative position changes*, not levels.

Tufte's data-ink principle applies strictly: every ink element is either a trajectory (entity line + dots) or a positional scaffold (rank gridlines, period labels, entity labels). Nothing else belongs. Fills between lines, decorative backgrounds, gradient fills on lines — all add ink without adding data.

Munzner (*Visualization Analysis and Design*, 2014) classifies this form under "Arrange Tables → Express, Separated, Ordered + Quantitative keys." The key design tension: the number of ranks visible on screen determines the row spacing, which determines whether crossing lines produce a legible "crossing event" or just a visual tangle. With 8 entities and 5 rank rows, crossing-lines span multiple rows and read as dramatic position changes. With 15 entities and 15 rank rows, crossings between adjacent ranks are nearly invisible at the row-spacing used in video.

**Legibility arithmetic:** with N entities across M periods, you have up to N × (M−1) line segments. At N=8, M=5 you have 32 segments — borderline legible. At N=12, M=8 you have 88 segments — the template fires a `warnIf` for this reason. The form's constraint is real: more than 10 entities produces unreadable spaghetti at video scrubbing speed.

---

## 4. Recommendation for Parallax

**Default: 5–8 entities across 4–6 discrete periods, one amber-accent entity (the episode's protagonist), all others in muted categorical colors, rank 1 at top, dots at every column, end-labels only.**

### Palette

- Protagonist entity: `amber` (`#E5A544`) at full opacity, 3px stroke, 6px dots
- Supporting entities: categorical palette (`getCategoricalColor(i)` from theme) at 60% opacity, 1.5px stroke, 4px dots — or pass `highlightIds` to let the template mute non-listed entities automatically
- Rank gridlines: `theme.text.muted` at 12% opacity, dashed — reading rails, not content
- Period labels: IBM Plex Mono (`fonts.data`), muted, below the chart

### Typography

- End-of-line entity labels: IBM Plex Sans (`fonts.display`) 600 for highlighted entities, 500 for supporting — 22px
- Rank axis numbers (left gutter): IBM Plex Mono (`fonts.data`), muted, 14px
- Period labels (x-axis): IBM Plex Mono (`fonts.data`), muted, 14px — use four-digit years ("2000", "2010", "2020") not abbreviated forms

### Timing

- `durationSec: 8–12` for 3–4 period charts; `14–16` for 5–6 period animated reveal
- `holdAfterRevealSec: 2–3` minimum — the viewer needs time to read all end-labels after the last segment draws
- Lines draw column-by-column (0.3s per column, 0.05s entity stagger), dots pulse in as each segment lands
- `backgroundVariant: "dark"` for power-transition / great-power rivalry episodes; `"light"` for economic indices and development data

### Content discipline

- Period labels must be years (four-digit) for geopolitical data — never quarter codes ("Q1 2023") or month abbreviations ("Jan"). Geopolitical rankings shift over years.
- Use `rankDirection: "desc"` (default) for most cases — highest value is rank 1. Set `rankDirection: "asc"` only for "lower is better" metrics (cost rankings, corruption indices, ease-of-doing-business where rank 1 means least corrupt).
- Keep entities ≤ 8. More than 8 produce spaghetti. If the dataset has 15 countries, pick the 5–7 that carry the narrative and omit the rest.
- The protagonist entity — the country or actor the episode narration is about — should always be the accented entity. Mute all others.
- For genuine ties (two actors with the same underlying index value for a period), the template's 1224 competition ranking preserves them correctly: both entities draw at the same rank row. Do NOT break ties arbitrarily to make the chart look cleaner; show the tie.
- Use null/missing values for periods when an actor genuinely wasn't in the ranking or didn't report data. Do NOT impute a rank — the template will break the line segment and render a transparent gap, which is the correct editorial treatment.

---

## 5. Current template alignment

The existing `BumpChart` template (`src/templates/BumpChart/`):

- ✅ `rankDirection: "asc" | "desc"` controls whether rank 1 represents the highest or lowest value. Default `"desc"` is correct for GDP, military spending, population, trade volume.
- ✅ **1224 competition ranking** — tied entities share the same integer rank; the next rank is skipped. The tie is computed correctly: `firstIdx` in the sorted array determines the rank for all entities sharing a value.
- ✅ **Sparse gap handling** — null rank produces a transparent segment. When an entity has no value for a period, both the line segment and the dot for that period are omitted rather than drawing a false connection to rank 0 or rank 1.
- ✅ `holdAfterRevealSec` — holds the composition at full opacity after all segments finish drawing, then exit-fades. Mirrors the DataChart hold-after-reveal pattern.
- ✅ `backgroundVariant: "light" | "dark"` — dark mode wired correctly through `useThemeMode`.
- ✅ `anticipatoryStartFrame` from `syncPoints[0]` — lines begin drawing ~150ms before the narration names the first entity, matching the D17 anticipatory-reveal doctrine.
- ✅ **End-label anti-collision** — labels sorted by final rank position, pushed down with a 24px minimum gap. Prevents exact-overlap of labels for entities that finish at the same or adjacent ranks.
- ✅ **Cubic-bezier line segments** — each column-to-column segment uses a horizontal-control-point bezier (`C (x0+halfDx),y0 (x1-halfDx),y1`) producing an S-curve. Crossing lines read as smooth power transitions, not sharp diagonal jumps.
- ✅ `highlightIds` — entity IDs listed here draw at full weight (3px stroke, 6px dots, full opacity, `fonts.display` label); all others mute to 60% opacity (1.5px stroke, 4px dots).
- ✅ `warnIf` guards at >10 entities and >12 periods — enforces the legibility arithmetic.
- ✅ `getCategoricalColor(i)` — entity colors auto-assigned from the brand categorical palette if no per-entity `color` is supplied. Per-entity `color` overrides fully (no blending).

**Diverges from canon — known gaps:**

- ⚠️ **End-label deconfliction is single-pass only** — labels are pushed downward only (not upward), so if the bottom-most entity's label gets pushed too far it can exit the safe area. The 24px minimum gap is correct for 8 entities; with fewer entities and large row spacing the pushdown may not be needed and can produce unnecessary vertical displacement.
- ❌ **No `accentEntityId` field** — to highlight one entity as the editorial protagonist, the data author must either set `color` on that entity or list its id in `highlightIds`. There is no single-field shorthand for "this is the one entity the story is about; mute everyone else." Workaround: `highlightIds: ["protagonist-id"]` achieves the FT "highlight one" idiom — this is the recommended pattern until an explicit field is added.
- ❌ **Step-transitions only** — the line draws column-by-column in discrete jumps (one bezier segment per column pair). There is no continuous interpolated-position animation between periods. This is correct for annual geopolitical data (each column IS a discrete measurement event) but cannot produce the Gapminder/OWID "racing" animation effect.
- ❌ **No sports-mode tie convention** — 1224 competition ranking is the only mode. Fractional rank (1.5 for a two-way tie at 1) is not available as an opt-in variant. Not needed for geopolitics.
- ❌ **No per-entity label at start** — start-of-line labels (at the leftmost column) are not rendered. Only end-of-line labels appear. For charts where lines cross heavily at both ends, the viewer may lose the initial ordering. Workaround: use the subtitle to name the starting configuration ("2000: China 7th, India 10th") or add the `warnIf` for crossing-heavy data.

---

## 6. Specific upgrades proposed

1. **`accentEntityId` field — explicit protagonist highlight.** A single string field that sets one entity as the editorial protagonist: full amber stroke + full opacity + `fonts.display` 700 label + drop-shadow glow. All other entities automatically mute to 40% opacity / thin stroke / no label shadow. Today this requires either per-entity `color` (which forces the author to know the amber hex) or the `highlightIds` array (which only controls weight, not color). A dedicated field that resolves to amber + muting of others implements the FT "highlight one" idiom cleanly without data authors needing to know brand tokens. *(Low effort, high editorial impact)*

2. **Smooth animated interpolation mode (`animationMode: "sweep"` vs. `"step"`).**  Add an optional continuous-sweep mode where entities animate frame-by-frame between rank positions (the position is linearly interpolated between column values as the composition plays, rather than jumping at column boundaries). The step mode (current default) is correct for annual data with discrete measurement events; sweep mode is correct for animated ranking "races" à la Gapminder. A single `animationMode` field switches between the two rendering strategies. *(Medium effort, medium impact — defer until an episode needs the racing idiom)*

3. **Sports-mode fractional tie ranking as opt-in variant.** Add a `tieConvention: "1224" | "midpoint"` field. The default stays 1224 (geopolitical/analytical standard). The midpoint option renders tied entities at the average of the positions they would occupy if not tied (e.g., a two-way tie at position 1 draws both lines at rank 1.5). Needed if the template is ever used for sports or competition data. *(Low effort, low impact for geopolitics — defer)*

---

## 7. Failure mode flags (always catch in audit)

- **Too many entities (>8):** spaghetti chart. The crossing-line density becomes unreadable at video scrubbing speed. Pick 5–7 and omit the rest, or use a small-multiples composition if all entities matter equally.
- **Using rank 1 = worst without setting `rankDirection: "asc"`:** if the data encodes a "lower is better" metric (cost rankings, corruption index) but `rankDirection` is left at the default `"desc"`, rank 1 is the highest-value entity — the opposite of what's intended. Always set `rankDirection: "asc"` for "lower is better" datasets.
- **Breaking ties manually in data instead of using null:** if two actors genuinely tied in a period and the author assigns them different values to "break" the tie, the chart draws a false crossing that didn't happen in the underlying data. Let the 1224 ranking show the tie honestly.
- **Period labels longer than ~8 characters:** period labels sit in the x-axis gutter below each column. Labels longer than 8 characters ("2020 Q1", "Jan 2020", "FY2019-20") crowd the axis at video resolution. Use four-digit years.
- **Missing end-labels:** the viewer cannot identify which line is which entity without end-labels. Never omit them. If the anti-collision pass pushes labels outside the canvas, widen the `LABEL_GUTTER` constant or reduce the entity count.
- **Both `entity.color` and `highlightIds`:** per-entity `color` overrides fully; the highlight/mute logic in `isHighlighted` only affects stroke width and opacity. If an entity has its own `color`, it will draw in that color regardless of whether it's in `highlightIds`. Audit data files to ensure the two fields are not fighting.
- **Step-transitions across genuine gaps:** if every entity has a value every period, the sparse-gap code path is never triggered and the chart draws smooth connections even across data-absent stretches. Verify that the source data truly has values for every entity×period cell; if a value was imputed rather than measured, replace it with null.
- **`holdAfterRevealSec` too small:** at the default of 0, the exit fade begins immediately when the last segment finishes drawing. For a 6-entity, 5-period chart where end-labels appear in a cascade, the viewer hasn't finished reading the labels before the composition fades out. Set ≥ 2s.
- **`durationSec` too short for the segment count:** `(numPeriods - 1) × 0.3s + numEntities × 0.05s stagger + holdAfterRevealSec + 0.5s = minimum durationSec`. A 6-period, 8-entity chart with a 2s hold needs at least `5 × 0.3 + 8 × 0.05 + 2 + 0.5 = 4.5s` of content — set `durationSec` accordingly so the exit fade doesn't cut into reveals.
- **Accent color on multiple entities:** if three entities are all colored amber, the "highlight one" idiom is destroyed and the chart reads as an undifferentiated cluster. One protagonist, one accent color.
- **Used when story is about magnitude, not rank:** if the narration says "US GDP grew from $5T to $25T" rather than "the US held its first-place ranking for twenty years," the story is about magnitude — use TimeSeriesChart. The BumpChart strips the absolute values from the visualization entirely; if those values are the point, the wrong form is in use.

---

Last updated: May 15, 2026

# SpiralTimeline — Research Dossier

> Created May 19, 2026. The cyclical-timeline form for "history rhymes"
> arguments — events recurring at the same point in a cycle stack visually
> on the same angular position across different revolutions.

## 1. The form's editorial purpose

The Spiral Timeline maps time → radius (linear) and time-mod-cycle-years → angle (one revolution per cycle). When the editorial claim is that *recurring events happen at the same point in a cycle across centuries* — Kondratieff waves, hegemonic-power transitions, financial panics, succession crises — the spiral makes the rhyme visually self-evident: events at the same angular position cluster on different rings, and the eye reads the pattern faster than any prose description can argue it. This is the form for Parallax's signature thesis ("history rhymes") when the argument is specifically about recurrence-on-a-cycle rather than analogy-across-cases. Linear timelines hide the cycle by stretching time; a spiral makes the cycle the central organising metaphor.

## 2. Canonical idioms

**Polar event timeline (Edward Tufte / Minard heritage).**
Concentric rings with events plotted as glyphs at angular positions corresponding to their year-mod-cycle, with radial spokes marking cycle subdivisions (quarters of a Kondratieff, generations of a Strauss-Howe cycle). Examples: Pamela Pavliscak's *"Long Now Foundation"* time-cone diagrams; *Aeon* magazine's "What if history is a spiral?" (2019). Why it works: angle carries the cycle-phase argument; radius carries chronological time; both encodings stay perceptually distinct.
Failure mode: too many events at similar radii crowd into visual collisions — labels overlap badly at high event density.

**Economist / FT "five-decade rhyme" infographic.**
Spiral with discrete event markers (only 3–8 per cycle phase), heavy use of typography for event labels, no continuous data — just punctuation points. Used for editorial pieces with a strong thesis ("we're in 1971 again"). Reference: Economist *"The new age of stagflation"* (2022), FT *"50-year market cycles, mapped"* (2023). The minimalist event-mark variant works better than density-plot variants for argumentative writing.
Failure mode: arbitrary cycle length feels rigged ("why 50 years and not 47?") — must be tied to a named theoretical framework (Kondratieff, Strauss-Howe, etc.).

**Strauss-Howe generational chart.**
A spiral OR concentric-rings layout where each ring is a generation (~22 years) and angular sections are life stages (childhood / young adult / midlife / elderhood). Specifically associated with William Strauss and Neil Howe's *The Fourth Turning* (1997) and the entire generational-cycles literature. Used in many policy think-tank reports. Same geometric trick, different theoretical scaffolding.
Failure mode: the framework itself is contested (academic historians dispute the model); the visualisation can imply more rigour than the underlying theory supports.

**NASA / cosmologist "deep time" spiral.**
Used for geological / cosmological timescales where linear timelines fail because of orders-of-magnitude differences. Each ring is a logarithmic decade. Different intent from Parallax's recurrence argument but the same form. Reference: NASA *"Deep Time of the Universe"* outreach posters.
Failure mode: logarithmic spirals confuse readers expecting linear time mapping; mention scale type explicitly.

## 3. General principles

The spiral makes a single visual claim: *position-on-the-spiral encodes time, and position-on-the-cycle (angle) encodes phase*. This is a Cleveland Tier-2 encoding (angle is harder to perceive precisely than position-along-an-axis, but easier than colour or volume). For categorical claims ("THIS year was a settlement year, THAT one was a crisis"), it works. For magnitude claims ("the 1929 panic was bigger than 1873"), pair with markers sized/coloured by a second variable.

Tufte's principle of "data ink" applies: the spiral path itself is *medium* data-ink (it's structure, not data); event markers + labels are HIGH data-ink (they're the argument); year-guide rings are LOW data-ink (orientation only — should be faint).

The single most important design decision is **cycle length**: it must be theoretically motivated and named, not pulled to fit the data. If `cycleYears: 50` looks like a stretch for the data, change the data or pick a different form.

## 4. Recommendation for Parallax

Default to the **polar event timeline** variant with the **Economist five-decade-rhyme** typographic treatment:
- Spiral path drawn in walnut, opacity 0.7 (visible but recessive)
- 12 angular ticks (clock-face metaphor — readers recognise it without explanation)
- Year-guide rings at major round years (every 10/25/50/100 depending on span)
- Categorical event markers via `glyph` (circle/square/diamond/triangle) and `color`
- Three emphasis tiers (primary/secondary/context) — primary events get larger glyphs + bold labels; context events are small dots without labels
- Dashed gold "rhyme" lines auto-drawn between events at the same angular position on different revolutions — this IS the editorial argument made visible

**Cycle length defaults:** 50y (Kondratieff economic / hegemonic), 80y (Strauss-Howe civic crisis), 100y (long political), 20y (Tytler democratic / generation gap), 70y (financial panic — based on Reinhart-Rogoff). Always name the framework in the title or subtitle.

## 5. Current template alignment

`SpiralTimeline` ships with the recommended idiom. Spiral geometry: outward (default) or inward direction, clockwise (default) or counter-clockwise rotation, configurable `cycleYears`. Year guides + cycle ticks both opt-in (default both true). Events support 4 glyph types, 3 emphasis tiers, and category-driven colours via a separate `categories[]` array. Auto-detection of "rhymes" (events at same angle, separated by ≥0.5×cycle) draws dashed connectors.

Diverges from the canon by avoiding logarithmic scale entirely (deep-time spirals not supported) — this is intentional: Parallax content is historical / political, not geological.

## 6. Specific upgrades proposed

1. **Anti-collision label placement** (medium effort, high impact) — when two events land within ~15° of each other on the same ring, labels currently overlap. Implement greedy label-offset placement (push collided labels radially outward or angularly aside).
2. **Per-event line annotation** (low effort, medium impact) — let an event optionally draw a short tangent line from the marker to its label, for cases where the auto-placement still collides.
3. **Cycle phase legend** (low effort, medium impact) — render an optional outer ring labelled with cycle phases ("Spring / Summer / Autumn / Winter" for Strauss-Howe, "Q1 / Q2 / Q3 / Q4" for Kondratieff). Currently authors have to put this in the title/subtitle.
4. **Camera-path zoom into a single cycle** (high effort, high impact) — narrated reveal that starts with the full spiral, then zooms to a single revolution to walk the reader through one cycle's phases before pulling back to show all cycles overlaid. Would need a `cameraPath[]` schema field similar to NetworkDiagram.
5. **Magnitude encoding via glyph size** (low effort, low impact) — currently `emphasis: "primary" | "secondary" | "context"` controls size discretely. Add an optional `weight: number` for continuous size mapping (for events with intensity, e.g., crisis severity scores).

## 7. Failure mode flags

- **Arbitrary cycle length** ("we used 47-year cycles because the data fit") → spiral becomes data-driven rather than theory-driven; the editorial argument collapses to "we picked numbers to make this look cyclical." Always name the cycle framework.
- **Too few revolutions** (only 1–2) → the rhyme argument needs ≥3 revolutions for the pattern to be visually convincing. Single-cycle spiral is just a circular timeline; use HorizontalTimeline instead.
- **Too many events** (>40) → eye loses the structure; consider filtering to primary events only, or splitting into multiple spirals by category.
- **Events crowd one angular sector** (e.g., all in "Q4" of the cycle) → the spiral form is wrong; use a HorizontalTimeline grouped by century or decade.
- **Continuous data (line / trend)** → spiral isn't the form for continuous time-series; use TimeSeriesChart or HorizonChart. Spiral is for discrete events at specific dates.
- **Cycle claim isn't actually made by the data** → cyclical visual form makes a strong claim of recurrence. If the underlying argument is "things happen, sometimes they're similar," use HorizontalTimeline. Reserve the spiral for cases where you genuinely believe the cycle is causal.

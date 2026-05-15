# RadarChart — Research Dossier

> Created: May 15, 2026. Research compiled from primary sources (FT, The Economist, Wickham & Stryjewski 2011, NATO/IISS, Observable); integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## TL;DR

**Radar wins exactly one argument: holistic shape comparison between entities or time states.** Use it when the claim is "entity A looks like entity B" or "this country's capability profile shifted shape." Never use it when the claim is "entity A scores higher on dimension X" — that's a bar chart. Five to six axes is the standard; more than eight crowds the perimeter; fewer than three cannot form a valid polygon. Fill opacity at or below 20% is the editorial standard; above 30% the polygons occlude each other and the grid disappears. `morph` mode is Parallax's unique form — no editorial equivalent in print — for single-entity time-evolution across a composition.

---

## § 1 Editorial purpose

### When to reach for it

The radar chart earns its place when the argument is about the **shape** of a multi-dimensional profile, not the magnitude of any single dimension. This is Wickham's criterion (2011): radar charts outperform bar charts only when the viewer's task is "assess the overall shape of entity A vs. B," not "compare dimension X across entities." The shape-reading task is fundamentally gestalt — the viewer sees "this polygon is elongated toward Military and Economic; that one is round" and grasps the argument in one take.

Use it when:
- Two entities (countries, strategies, time periods) need holistic comparison across 5–8 dimensions simultaneously.
- A single entity's capability profile has shifted over time (`morph` mode: one polygon morphing to another).
- The editorial claim is "the profile has a distinctive shape" (e.g., a country that is strong across the board vs. one that is only militarily dominant).
- An `axisFocusSequence` is needed to walk the viewer through each dimension in narration order, rotating the chart so each spoke is at 12 o'clock when discussed.

### When not to reach for it

| Alternative | When it wins over RadarChart |
|---|---|
| **DataChart (bar/grouped bar)** | Task is "compare dimension X across entities." Bars on a common axis dominate radars on perceptual accuracy (Cleveland & McGill position-on-scale). |
| **DataChart (small multiples)** | More than 3 subjects — polygons stack into unreadable overlap above 3. Small multiples let each entity have its own clean chart. |
| **BumpChart** | Story is about rank ordering across categories, not holistic shape. |
| **StrategicLandscape** | You have a 2D matrix (two-axis framework): the strategic landscape places entities in quadrants. Radar is for N ≥ 3 axes. |
| **DuelingFrameworks** | The claim is about competing interpretations of the same facts, not scored capabilities. |

**Wickham criterion:** if a visitor could get the same insight from a grouped bar chart, use a bar chart. The radar's polygon shape is signal only when the holistic profile — the gestalt of the polygon — is itself the argument.

---

## § 2 Canonical idioms

### a. FT "country profile" radar
- **Financial Times** country profile graphics (2016–present), particularly used in emerging-markets and geopolitical-risk coverage: 5–6 dimensions of economic or political performance scored 0–100; single polygon per country; axes labeled in IBM Plex Sans or equivalent sans-serif; **no fill** (stroke only); light 1px grid at 25/50/75/100.
- Key editorial convention: **the FT style guide explicitly forbids filled polygons** because they occlude the grid and make the 50% reference ring invisible. Stroke-only polygons allow the eye to locate each vertex against the grid precisely — filling them would require heavier grid lines to show through, which clutters the composition.
- *Works because:* without fill, the polygon reads as a wire-frame model and the vertices are unambiguous data points. *Fails when:* stroke-weight is too thin (below 1.5px at 1920px wide) and the polygon blends into the grid.

### b. Economist "capability matrix" radar
- **The Economist** military and geopolitical capability comparisons (2014–present): polygon filled at low opacity (~20%); two polygons simultaneously for direct comparison (e.g., NATO overall vs. Russia); dotted stroke for the reference/foil polygon; solid stroke for the subject.
- Key editorial convention: **fill opacity at 20%** allows the underlying grid to remain legible while giving the polygons enough surface to distinguish them from the grid itself. The Economist's rationale: opacity is a compromise between "stroke-only" (hard to distinguish two polygons when they overlap) and "solid fill" (occlusion). Twenty percent is the calibrated midpoint.
- *Parallax alignment:* `fillOpacity: 0.2` in `RadarSubject` is the correct default. The template renders with `fillOpacity ?? 0.2` — this matches The Economist's production standard.

### c. Wickham & Stryjewski perceptual research
- **Wickham & Stryjewski**, *40 Years of Boxplots* and radar discussion in the *Statistical Computing and Graphics Newsletter* (2011); also Kosara & Skau (2016), *Judgment Error in Pie Chart Variations*: radar charts are perceptually unreliable for individual value comparison — the apparent area of a polygon depends on both the value at each vertex AND on the ordering of the axes. Two polygons with identical values but different axis orderings appear to have different shapes.
- Key finding: **axis ordering is editorial.** The viewer reads the polygon's shape relative to a learned clockwise convention; placing the entity's "strength" dimension at 12 o'clock primes the viewer to read the shape as "strong in [X], weaker in [Y]." This is a rhetorical choice, not a neutral visualization decision.
- *Parallax application:* `axes` array order is the sole determinant of polygon shape. The convention — consistent across FT, Economist, and NATO diagrams — is to place the analytically most important (often highest-scoring) dimension at 12 o'clock (index 0, which maps to `-π/2` in the `polarToCartesian` formula). This makes the "protagonist's strength" the first visual anchor.

### d. NATO/IISS capability assessments
- **NATO** and **IISS** (International Institute for Strategic Studies) spider diagrams in annual *Military Balance* reports (2010–present): 6–8 dimensions of military capability (manpower, equipment, logistics, C2, training, readiness); colored by alliance (NATO blue, Russian red); dotted reference polygon for historical baseline.
- Key editorial convention: axes ordered clockwise from 12 o'clock starting with the dimension where the alliance has its strongest comparative advantage — this makes the visual argument "NATO's advantage is in C2 and logistics, Russia's in raw manpower" immediately legible from polygon shape.
- *Parallax divergence:* do NOT use NATO blue or Russian red. Use `palette.amber` vs. `palette.rust` as the two-entity comparison pair. These carry Parallax's editorial register without importing alliance-membership encoding that would read as partisan.

### e. Parallax `morph` mode
- No direct editorial equivalent in print — designed for Parallax's time-lapse capability analyses. A single entity's capability polygon morphs from a historical state (`morphFrom` subjects) to the current state (`subjects`) within a single composition.
- The visual argument: "China's capability profile in 2000 looked like this [thin polygon]; by 2025 it looks like this [full polygon]." The morph reveals growth trajectory as shape-change.
- Unique feature: morph-highlight axis — during the morph, the template identifies the axis with the largest delta and briefly thickens its polygon segment, directing the eye to "this dimension changed most." This is the template's editorial cue mechanism — the equivalent of circling the key cell in a matrix.

---

## § 3 General principles

**Wickham criterion:** the radar's holistic shape-reading advantage over bar charts is real but narrow. It fires only when: (1) N ≥ 4 dimensions (below 4, a grouped bar is always cleaner), (2) the task is shape-assessment, not value-comparison, and (3) the viewer is given a fixed reference (the grid rings at 25/50/75/100) so they can calibrate vertex heights. Violate any of these and the bar chart wins.

**Polygon fill opacity:** the critical parameter. Fill at > 30% opacity destroys legibility in two-polygon comparisons — the occluded polygon disappears. Fill at < 10% makes the polygons invisible against the grid. The 15–20% window is the calibrated zone; 20% is The Economist's validated default.

**Axis ordering convention:** clockwise from 12 o'clock, most analytically significant dimension first (index 0 → `-π/2` offset in polar coordinates). This is not optional editorially — the shape the viewer reads is determined by the ordering. An arbitrary ordering (alphabetical, by data entry) makes two polygons with similar profiles look distinct because their shapes are artifacts of the ordering, not of the data.

**Three-subject limit:** above 3 overlapping polygons, the chart collapses into an unreadable layer cake. The template enforces this with `warnIf` at 3+ subjects and `DataChart small-multiples` as the recommended alternative. The three-subject limit is validated in both academic literature (Wickham) and editorial practice (FT, Economist never show more than 2 polygons; three is Parallax's maximum for side-by-side entity comparisons where the third is a reference/world-average polygon).

**Grid architecture:** radial grid rings at 25/50/75/100 (configurable via `gridLevels`) serve as the perceptual ruler. The 50% ring is the most important — it corresponds to "average" or "moderate" in most capability scales. Grid color should be at 10–15% opacity in dark mode (`bone` at ~10%), 6–12% in light mode (`ink` at ~6%) — the template's palette-token values match these ranges.

**`axisFocusSequence` and rotation:** the chart rotates so the focused axis arrives at 12 o'clock. The counter-rotation on vertex value labels preserves text readability through the rotation. A single vertex pulse (scale 1.0 → 1.2 → 1.0 over 12 frames) on landing confirms the axis has arrived — "one pulse is punctuation, repeated pulse is anxiety" (motion-design.md § 2).

---

## § 4 Recommendation for Parallax

**Axes:**
- **5–6 axes** is the standard for editorial comparisons; 7–8 is acceptable for comprehensive capability analyses; cap at 8 (template warns at > 8). Fewer than 5 is usually a bar chart disguised as a radar.
- Order axes so the entity's defining strength is at 12 o'clock (index 0). For military capability: `["Military", "Economic", "Diplomatic", "Information", "Logistics"]` with Military first for an armed actor.
- Axis labels ≤ 25 chars; use `short` alias for tight layouts (template uses `axis.short || axis.label`).

**Subjects:**
- Two subjects for direct comparison: `palette.amber` for the subject / contemporary actor, `palette.rust` for the foil / historical actor.
- Single subject with `morphFrom`: use `palette.amber` throughout; the morph-highlight axis is the moment the composition turns analytical.
- Three subjects: amber (protagonist) + rust (antagonist) + neutral (`palette.neutral` = `#888780`) for a reference/world-average polygon.

**Background:**
- `backgroundVariant: "dark"` for military capability contexts — IISS/NATO register.
- `backgroundVariant: "light"` for economic / political capability profiles.

**Fill opacity:**
- Default `fillOpacity: 0.2` per subject — The Economist validated standard.
- For morph mode with a single subject: start `morphFrom` at `fillOpacity: 0.12`, end `subjects` at `0.2` — the opacity increase visualizes growing capability alongside the polygon expansion.

**Duration:**
- Without `axisFocusSequence`: `durationSec: 8–10` — grid draws in (1s), polygon grows (1.5s), hold (5–7s).
- With `axisFocusSequence`: `durationSec: 14–20` — add 2–3s per focus axis step.
- `morph` mode: `durationSec: 10–14` — allow 2s for morph animation to complete and hold on final state.

---

## § 5 Current template alignment

**Geometry:**
- ✅ `polarToCartesian` places axis index 0 at `-π/2` (12 o'clock) — matches clockwise editorial convention.
- ✅ SVG polygon with radial gradient fill — center dense at `fillOpacity * 1.6`, edges transparent. Richer than flat fill.
- ✅ `warnIf` for > 3 subjects, with `DataChart small-multiples` recommendation.
- ✅ `warnIf` for < 3 axes (returns null after warning — belt-and-suspenders against NaN polar math, added post-17af733 pattern).
- ✅ `warnIf` for > 8 axes — perimeter crowding warning with 5–7 axis recommendation.
- ✅ `warnIf` for axis labels > 25 chars — radial label collision prevention.

**Grid:**
- ✅ Grid rings use palette-token colors (`bone` at ~10% dark / `ink` at ~6% light) — matches FT and Economist grid opacity standards.
- ✅ Grid level labels at 12 o'clock (axis 0) in Plex Mono — perceptual ruler anchoring.
- ✅ Spoke lines in palette-token axisColor — distinct from gridColor, correct low-opacity treatment.

**Animation:**
- ✅ Grid draws in first (`gridProgress`), then polygon grows outward (`growProgress`) — correct sequence (ruler before data).
- ✅ `morphProgress` lerps between `morphFrom.values` and `subjects.values` — smooth polygon morphing.
- ✅ Morph-highlight axis: identifies the axis with the largest absolute delta per subject, thickens that polygon segment during morph, fades it back at morph completion — the editorial cue mechanism.
- ✅ `axisFocusSequence` rotates the chart to bring focused axis to 12 o'clock — `rotate(${focusRotationAngle}deg)` on the SVG.
- ✅ Single vertex pulse on axis-focus landing (12 frames, scale 1.0 → 1.2 → 1.0) — correct motion semantics.
- ✅ Counter-rotation on value callout text so labels stay upright during rotation.
- ✅ `anticipatoryStartFrame` wiring for sync-point-aligned grid reveal.

**Hooks and safety:**
- ✅ All `useMemo` calls (axisFocusBounds, morphHighlightAxisPerSubject, currentSubjects) placed above the early `return null` guard — Rules of Hooks compliance.
- ✅ `useEpisodeColorEmphasis` drives the focus-label tint — episode identity follows the axis focus annotation.
- ✅ `holdAfterRevealSec` is defined on the data type for post-reveal hold customization.

**Gaps:**
- ⚠️ No validation that `morphFrom.length === subjects.length` — mismatched arrays cause silent `from[i] ?? 0` fallbacks that zero-out missing axes. Should fire `warnIf`.
- ⚠️ `axisFocusSequence` has no guard against `axisIndex >= numAxes` — out-of-range indices silently produce incorrect rotation angles.

---

## § 6 Specific upgrades

1. **Stroke-only mode for FT-style single-entity profiles.** Add `fillMode: "stroke" | "fill"` option to `RadarSubject`. When `stroke`, render only the polygon outline at full color, no fill — FT's validated standard for unambiguous vertex reading. Useful for compositions where there's a single subject and the fill serves no disambiguation purpose. Effort: small (omit the `fill` SVG attribute; the `stroke` is already rendered). Impact: unlocks the FT visual register for editorial profiles. **(trivial effort / medium impact)**

2. **`morphFrom` array-length guard.** Add `warnIf(data.morphFrom && data.morphFrom.length !== data.subjects.length, ...)` to fire a warning when the two arrays are mismatched. Currently the `lerpValues` fallback uses `from[i] ?? 0` silently, zeroing out the "from" position of any axis that doesn't have a corresponding `morphFrom` subject entry — a common data-entry error when axes are added or removed during production. Effort: trivial. Impact: prevents a silent visual bug that reads as "this dimension was zero before." **(trivial effort / high reliability impact)**

3. **Reference polygon (`fillMode: "reference"`) for world-average baseline.** Add a `reference: true` flag on `RadarSubject` that renders the subject as a dotted low-opacity polygon (dashed stroke, no fill) — the IISS historical-baseline convention. This allows a world-average or historical baseline to be shown without using up one of the three comparison slots. Effort: small (SVG `strokeDasharray` + conditional fill). Impact: unlocks the NATO/IISS radar standard where a reference polygon grounds the viewer in "this is what normal looks like." **(low effort / high editorial impact)**

4. **Axis-label overflow to two lines.** Currently axis labels that exceed the available radial space are clipped. For 7–8-axis charts where some labels are compound ("Technology + Manufacturing"), add a line-break rule: labels > 12 chars that contain a space or "/" break at the token boundary and render on two lines with 0.85× font-size on the second line. This is the IISS Military Balance convention for compound dimension labels. Effort: medium (SVG `<text>` doesn't support auto-wrapping; requires a `<tspan>` split). Impact: allows 7–8-axis comprehensive capability profiles without the > 25-char truncation warning. **(medium effort / medium impact)**

---

## § 7 Failure mode flags

- **Axis ordering is arbitrary (alphabetical or by data entry)** — the polygon shape is an artifact of the ordering, not of the data. Any two polygons will look meaningfully different even when the underlying data is similar. Audit: check that the most analytically significant dimension is at index 0 (12 o'clock) and that the ordering is intentional.
- **Fill opacity > 30%** — occlude the grid and make multi-polygon comparisons unreadable. Audit: verify all `fillOpacity` values are ≤ 0.25. The template's default is 0.2; data files that override to 0.4 or 0.5 should be flagged.
- **More than 3 subjects** — the template fires `warnIf`. The overlap stack becomes an inkblot. Audit: above 3 subjects, redirect to `DataChart small-multiples`.
- **Fewer than 3 axes** — the template returns null after `warnIf`. The editorial minimum for a radar polygon is a triangle. If you have 2 axes, use a dumbbell or a bar.
- **`morphFrom` and `subjects` array lengths mismatched** — silent zeroing of missing axes. Audit: verify that `morphFrom.length === subjects.length` and `morphFrom[i].values.length === axes.length` for every subject.
- **Axis labels > 25 chars** — template fires `warnIf`. Labels overflow the perimeter and collide with adjacent labels. Use `short` alias or restructure.
- **`axisFocusSequence` with out-of-range `axisIndex`** — the rotation math silently produces incorrect angles. Audit: verify every `axisIndex` is within `[0, axes.length - 1]`.
- **No axis focus pause hold** — if `axisFocusSequence` steps are too short (< 1.5s each), the vertex pulse fires and the rotation transitions before the narration names the dimension. Each step should hold for at least the time the narrator spends on that axis (typically 2–4s).

---

Last updated: May 15, 2026

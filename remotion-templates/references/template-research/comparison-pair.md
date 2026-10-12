# ComparisonPair — Research Dossier

> Created May 19, 2026. Two registered templates rendered side-by-side at
> 50/50 with synchronized timing. The structural-comparison primitive that
> unlocks dozens of "A vs B" compositions without per-pair code.

## 1. The form's editorial purpose

ComparisonPair makes the same editorial argument as any "before/after," "this vs that," or "1914 vs 2024" comparison: *"these two things share a structural pattern (or don't)."* What makes it distinct from the existing `SplitComposition` template (text-pane lists) is that ComparisonPair embeds two REGISTERED TEMPLATES — DataChart on the left, DataChart on the right; AnnotatedImage on the left, AnnotatedImage on the right; KineticTypography quote left, KineticTypography quote right. The flexibility comes from the discriminated union over 10 splittable templates.

Reach for ComparisonPair when:
- The editorial point requires *simultaneous* visual comparison (not sequential)
- Both sides need their own visual register (a chart + a chart, an image + an image)
- The argument is structural ("the same pattern in both eras" or "the same pattern, different magnitudes")

Don't use it when:
- One template form serves the argument alone (use that template)
- The comparison is sequential ("first this, then this") — use `PhotoMontage` or transitions
- The argument is qualitative-against-quantitative ("here's the framework / here's the data") — use `EditorialFrame` to embed a chart in a framework instead

## 2. Canonical idioms

**Tufte small-multiples-of-two.**
Edward Tufte's foundational case for visual comparison: two identical charts side-by-side, axes shared, one annotation differing. The reader's eye parses similarity/difference perceptually faster than label-reading allows. Used by NYT Upshot for "X has changed: here's then, here's now" — e.g., election maps before/after, demographic shifts. Reference: *Envisioning Information* (Tufte 1990), chapter 4.
Failure mode: axes UNshared — destroys the structural-comparison argument by making magnitudes incomparable.

**FT "model versus reality" idiom.**
Financial Times pairs an analytical schematic (FrameworkDiagram on left) with an empirical chart (TimeSeriesChart on right) to argue the gap between theory and observation. The two visual registers are intentionally different — frameworks read as "what should happen"; data reads as "what did." Reference: FT *"Why monetary models keep missing inflation"* (2023).
Failure mode: both sides in the same visual register reads as small multiples, not theory-vs-reality. Vary the templates intentionally.

**Bloomberg historical-analogy comparison.**
Bloomberg's signature "X in 1973 / X in 2022" treatment with two charts of the same form using same scale. Often pairs with a top headline framing the analogy ("AN ECHO OF '73"). Reference: Bloomberg *"The Stagflation Playbook, Then and Now"* (2022).
Failure mode: chart magnitudes too different to compare meaningfully on shared axis — solution is per-pane index normalisation, not different axes.

**Pudding before-and-after walkthrough.**
The Pudding's interactive scroll-through pattern: same chart, two states, slider drives interpolation between them. In video form this is `MorphTransition` (different template — animates between states); ComparisonPair is the *static* form where both states stay visible.
Failure mode: trying to do MorphTransition's job — use ComparisonPair when the comparison is the editorial point AT REST, not the change between states.

## 3. General principles

The form's editorial leverage comes from **structural-parallelism**: both panes should use the same template so the reader's eye parses one once and reuses the parse for the other. Cross-template comparisons (e.g., FrameworkDiagram + DataChart) work for FT's "model vs reality" but require more cognitive setup from the viewer; reserve for moments where the visual contrast IS the argument.

Tufte's "small multiples" principle: shared axes are non-negotiable when comparing magnitudes. ComparisonPair doesn't enforce this — each side's data is independently authored — but it's the editor's responsibility. The schema documentation should flag this expectation.

Cleveland's perceptual hierarchy: position-along-a-shared-axis (rank 1) is preserved per-pane but NOT across panes. To force cross-pane comparison, both panes must use identical y-axis ranges in their respective data. (Future enhancement: a `syncAxes: true` flag that normalises both sides' axis ranges — but that requires inspecting and modifying the embedded template's data, which is intricate.)

## 4. Recommendation for Parallax

Default to **identical template + identical visual register on both sides** with editorial framing via the per-pane `label` (e.g., "1914" / "2024") and `caption` (e.g., "The Bismarckian alliance system" / "The post-Cold-War order"). Specifically:
- 50/50 horizontal split (the only orientation worth supporting initially)
- `divider: "rule"` (the canonical separator — thin vertical line in muted ink)
- `revealOrder: "sync"` (simultaneous comparison; "left-first" only when the argument is *temporal*)
- Template scaled uniformly to 50% (preserves aspect ratio — chart shapes don't distort)
- Pane label in small-caps mono ("1914") above the scaled template
- Pane caption in italic serif below the scaled template

The remaining vertical space within each pane (after scaling 1920×1080 → 960×540) carries the editorial framing. This forces restraint — you can't cram more chart into the pane; the breathing room IS the design.

Use rarely (1-2 per episode max). ComparisonPair is high-impact / low-frequency. Overuse makes every comparison feel mechanical.

## 5. Current template alignment

`ComparisonPair` ships with the recommended idiom. 10 splittable templates supported via Zod discriminated union (full compile-time type safety on each side's data). Default reveal order is `sync`; `revealOrder: "left-first" | "right-first"` available via Remotion `<Sequence>` offset.

The 10 splittable templates are: DataChart, TimeSeriesChart, StatReveal, KPICard, BumpChart, BulletChart, ProbabilityGauge, AnnotatedImage, FrameworkDiagram, KineticTypography.

Explicitly excluded:
- **Map templates** (ChoroplethMap, RouteAnimation, etc.) — Mapbox doubling is a perf + cost nightmare
- **EscalationLadder** — needs full vertical canvas
- **DecisionTree** — typography-heavy, scales poorly at 50%
- **NetworkDiagram** — has its own camera path, confusing in split
- **FullEpisode, ComparisonPair** — recursive
- **SplitComposition, DuelingFrameworks** — already comparison forms

## 6. Specific upgrades proposed

1. **`syncAxes: true` flag** (high effort, high impact) — normalise both sides' y-axis ranges to a shared min/max so cross-pane magnitude comparison reads correctly. Requires the embedded template to support an external axis-range override (currently they don't); would need template-side schema additions.
2. **Vertical orientation** (low effort, low frequency) — 50/50 horizontal is the canonical layout. A top/bottom split would be useful for "before/after time-flow" arguments where left/right reads as same-moment. Add `orientation: "horizontal" | "vertical"` field.
3. **Asymmetric split ratios** (low effort, low impact) — currently always 50/50. Add `splitRatio: number` (e.g., 0.65 = 65/35) for "focus + context" pairs where one side is the focal case.
4. **Per-pane title-block** (medium effort, medium impact) — currently labels are simple strings. A full TitleBlock per pane with kicker/title/subtitle hierarchy would support richer framing.
5. **Cross-pane callouts** (high effort, medium impact) — a leader line drawn from a feature on one pane to a feature on the other ("see — same inflection point"). Would require DOM measurement across both pane subtrees.
6. **Map-template support via pre-render** (high effort, low frequency) — render each map to a video in advance, then `<OffthreadVideo>` in the pane. Sidesteps the double-Mapbox cost. Useful when an episode genuinely needs to compare two maps.

## 7. Failure mode flags

- **Cross-template comparison without editorial reason** — e.g., DataChart on left + AnnotatedImage on right with no narrative connection. The form's authority depends on the two visualisations belonging together. If they don't, use two separate compositions.
- **Magnitudes incomparable across panes** — same chart type, but left's y-axis goes 0-10 and right's goes 0-1000. The visual comparison is meaningless. Either index-normalise the data or rethink the comparison.
- **Embedded template's title competes with ComparisonPair's framing** — the embedded template's own TitleBlock renders inside the scaled pane. If ComparisonPair has its own title AND each embedded template has its own title, the visual hierarchy collapses. Solution: when embedding, set the inner template's `title` to empty/short.
- **Too dense per pane** — embedded template + ComparisonPair label + ComparisonPair caption + framing title = 4 layers of editorial chrome per pane × 2 panes = 8 layers total. Catastrophic. Use restraint: a label OR a caption, not both, in most cases.
- **Recursive embedding** — schema forbids it (ComparisonPair not in splittable list), but worth flagging as a conceptual no-no. Don't nest comparisons.
- **Map template embedding** — schema forbids it (excluded by design). The double-Mapbox-instance cost is real; if an episode needs two-map comparison, build it as a single dedicated template (DuelingMaps) instead.
- **Mismatched durations** — if the embedded template has `durationSec: 14` but ComparisonPair has `durationSec: 8`, the embedded template's animations run too fast. Make sure both inner templates' `durationSec` matches the outer ComparisonPair `durationSec`.

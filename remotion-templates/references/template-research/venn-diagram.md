# Template Research Dossier — VennDiagram

> Last updated: May 19, 2026

## 1. The form's editorial purpose

The Venn diagram is the canonical form for revealing structural overlap — when the editorial point is that two or more categories are NOT mutually exclusive, and that the intersection itself carries the argument. In geopolitics this most often surfaces as overlapping sovereignty (a state that is simultaneously EU, NATO, and WTO member, with each membership imposing distinct legal obligations and loyalties), dual-commitment structures (where fulfilling one institution's demands strains another's), and contested jurisdictions (regions where two legal or political systems claim authority simultaneously). The Venn diagram works precisely because it visualizes BOTH what separates two categories AND what binds them — the lens region at the center IS the editorial payload, not a visual artifact.

## 2. Canonical idioms

### 2a. The two-circle overlapping sovereignty diagram

**Reference:** The Economist (2018, Brexit issue) — three-circle diagram showing EU, EEA, and Customs Union membership obligations. FT (2021) — two-circle NATO/EU overlap highlighting the 21-member dual commitment bloc.

**Why it works:** The bilateral form maps directly onto the most common geopolitical tension: two institutions, some members in both. The reader immediately grasps that the intersection represents a "both/and" condition — states that must satisfy dual masters.

**Failure mode:** When the intersection is trivially empty or universally full, the diagram reduces to two non-overlapping circles or a single circle — use a DataChart or single-stat reveal instead.

### 2b. The three-circle triangular form

**Reference:** Reuters Graphics (2023) — trade agreement overlaps (CPTPP / RCEP / USMCA). NYT Upshot (2020) — pandemic policy overlaps (mask mandates / business closures / travel restrictions by state).

**Why it works:** Three-set Venn diagrams add a "triple intersection" which often carries the strongest editorial claim — the subset that satisfies all three conditions simultaneously is typically small and surprising. The triangular layout distributes the three circles symmetrically so each exclusive region has equivalent visual weight.

**Failure mode:** Three circles already push the legibility limit. Four or more sets produce an Euler diagram that requires specialist reading — use MatrixHeatmap instead.

### 2c. The annotated-lens form (intersection-first)

**Reference:** Bloomberg Opinion (2022) — monetary/fiscal overlap during COVID stimulus, annotation callouts inside the lens pointing to specific countries. The Pudding (2021) — music genre overlaps with annotated intersection.

**Why it works:** When the intersection IS the story, treating it as the primary content zone (larger lens, bolder color, annotated callouts) and the exclusive zones as context reverses the typical Venn reading order — the viewer's eye lands on the argument first. Parallax should use this by design: the intersection label and items should carry the main claim, with exclusive items providing supporting context.

**Failure mode:** Over-annotating the intersection makes the diagram read as a list masquerading as a Venn diagram. Keep intersection items ≤ 4 and make them structurally significant (not just examples).

### 2d. The shaded-fill gradient form

**Reference:** NYT Magazine (2019) — overlapping identity categories in American political coalitions. Light-to-dark gradient fills showing degree of overlap intensity.

**Why it works:** When the editorial argument is about DEGREE of overlap (not just presence/absence), gradient fills encode intensity without requiring an additional legend. Works best for continuous variables.

**Failure mode:** Continuous fill gradients require a legend and slow down reading at video scrubbing speed. For binary membership (you either are or aren't in NATO), use the flat-fill approach instead.

## 3. General principles

Perceptual rationale: Venn diagrams use area overlap as the primary encoding — but unlike area charts, the "area" here is qualitative (it represents set membership, not quantity). This is precisely right for the use case: we're encoding categorical membership structure, not magnitude. Cleveland's hierarchy doesn't apply directly because we're not encoding quantitative values along a positional scale; instead the spatial arrangement encodes logical relationships. The key perceptual constraint is that exclusive regions must have enough white space for text legibility — which means limiting items to 5 per region.

The intersection fill opacity should be distinctly higher than the exclusive fill opacity (35% vs. 20% in the Parallax implementation) to make the lens region visually salient without requiring a separate color. This is the editorial equivalent of bolding a word: the higher opacity says "look here."

## 4. Recommendation for Parallax

**Default form:** The two-circle bilateral form (2-set Venn). The most common geopolitical overlap story is bilateral — two institutions, some states in both. The bilateral form reads cleanly at video scrubbing speed, labels never collide, and the intersection is always clearly centered.

**Use three circles only when:** the triple intersection carries the editorial claim. If a third set adds complexity without adding editorial payload (the triple intersection is empty or irrelevant), drop to the two-circle form.

**Intersection-first design:** In the Parallax context, the intersection `label` should name the structural condition, and the `items` should be the argument. Example: label="Strategic autonomy tension", items=["21 of 27 EU states are NATO members", "Art. 5 vs. EU solidarity clause conflict", "Defense budget dual-key", "No common command authority"].

**Palette:** Use `palette.dustblue` (set[0]) and `palette.gold` (set[1]) as defaults — these are the two primary Parallax analytical colors. For three sets, add `palette.umber`. Never use semantic `us`/`china` colors for the circles unless the diagram is explicitly a bilateral US-China story.

## 5. Current template alignment

The Parallax VennDiagram template ships with:
- Two-circle default layout (764, 540) and (1156, 540), radius 280 — identical to the canonical bilateral Economist/FT placement
- Exclusive fill at 20% opacity, intersection fill at 35% — matches the annotated-lens idiom convention
- Circle stroke at 2.5px full opacity — editorial weight without cartographic heaviness
- Intersection label in IBM Plex Mono, set labels in IBM Plex Sans bold — correct hierarchy
- Three-circle triangular layout (700,460), (1220,460), (960,700) — center-of-gravity correctly inside the canvas content zone
- noDrift: true — correct; Ken Burns drift would shift the optical midpoint of the bilateral balance

Diverges intentionally from mainstream media:
- No number callouts or percentage labels inside the circles — Parallax doesn't annotate with quantities in Venn diagrams; the items ARE the content
- No legend — the set labels above each exclusive region serve as the legend
- No continuous gradient — binary membership only

## 6. Specific upgrades proposed

1. **Intersection accent ring (POLISH pass):** Add a subtle ring (1px stroke, 50% opacity) tracing the lens boundary between the two circles to make the intersection region visually crisp at the edges — the SVG clip approach produces a sharp boundary, which is correct but can look harsh. A thin decorative ring would soften the edge in the Parallax "precision annotation" aesthetic.

2. **Count stamp:** Add an optional `count` field to `VennIntersectionSchema` that renders as a mono-font number stamp at the top of the intersection label ("21 states" rendered as a KPI-style number in fontSizes.h3). This is the Bloomberg Opinion "annotated-lens" idiom applied selectively.

3. **Exclusive region nudge for 3-set:** The current 3-set exclusive centers use a radial push from the intersection centroid. A per-set configurable `exclusiveOffset` field would let visual-spec fine-tune positions for irregular triangle arrangements.

4. **Dark-mode intersection fill:** In dark mode the 20%/35% fill opacities read as too faint against the dark background. Consider bumping to 28%/45% when `backgroundVariant === "dark"` — or expose `fillOpacity` as an override field in the schema.

5. **`warnIf` for empty intersection items:** Add a warning when `intersections[0].items.length === 0` — an empty intersection set means the editorial payload is missing; the diagram is then just two circles with labels, which is better served by a ComparisonPair.

## 7. Failure mode flags

- **More than 3 sets:** Use MatrixHeatmap. Four-circle Venn diagrams are unreadable at video scrubbing speed.
- **Non-overlapping categories:** If the sets genuinely don't overlap, the diagram is two separate circles with nothing in the lens — use DataChart (side-by-side bars) or ComparisonPair instead.
- **Overlap is the ONLY story:** If the intersection is 100% (every element of set A is also in set B), the Venn diagram collapses to a subset diagram — use a single-stat reveal with the count and a note ("Every NATO member is also...").
- **Quantitative area encoding:** Proportional Venn diagrams (where circle area encodes set size) are technically superior perceptually but extremely difficult to lay out correctly. Parallax uses the fixed-radius equal-circles convention — don't attempt proportional Venn.
- **More than 5 items per exclusive region:** Items overflow the circle bounds and collide with the intersection items. Ruthlessly cut to the 3–4 most structurally significant items.
- **More than 4 items in the intersection:** The intersection lens is the tightest region. Cut to the items that most directly state the structural tension.

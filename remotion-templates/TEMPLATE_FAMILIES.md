# Template Families — Wayfinding Index

> One page. Pin it. When a script beat needs a visual, find the family first, then the template.
>
> Last updated: May 20, 2026

The Remotion MG layer has **~69 templates** organized into 9 families plus 3 non-template asset types. Each family has its own "when to use which template" logic. This page is the *index* — it tells you which family you're in and where the canonical decision logic lives. The detailed editorial guidance is in:

- **Per-family SELECTOR docs** (wall-tables) when they exist
- **`references/template-picker.md`** — long-form prose covering every family
- **`references/template-research/<template>.md`** — per-template dossier with canonical idioms, failure modes, Parallax defaults

---

## Family index

| Family | Count | Selector doc | Audit skill | Status |
|---|---|---|---|---|
| **Maps** | 8 | ✅ [`MAP_TEMPLATE_SELECTOR.md`](MAP_TEMPLATE_SELECTOR.md) | ✅ `map-audit` | **Complete** |
| **Charts** | 20 | ✅ [`CHART_TEMPLATE_SELECTOR.md`](CHART_TEMPLATE_SELECTOR.md) | ✅ `chart-audit` | **Complete** |
| **Diagrams** | 11 | ✅ [`DIAGRAM_TEMPLATE_SELECTOR.md`](DIAGRAM_TEMPLATE_SELECTOR.md) | ✅ `diagram-audit` | **Complete** |
| **Timelines** | 4 | ✅ [`TIMELINE_TEMPLATE_SELECTOR.md`](TIMELINE_TEMPLATE_SELECTOR.md) | ✅ `timeline-audit` | **Complete** |
| **Typography / layout** | 7 | ✅ [`TYPOGRAPHY_TEMPLATE_SELECTOR.md`](TYPOGRAPHY_TEMPLATE_SELECTOR.md) | ✅ `typography-audit` | **Complete** |
| **Argument Primitives** | 5 | 🟡 [`PARALLAX_VISUAL_VOCABULARY.md`](PARALLAX_VISUAL_VOCABULARY.md) § Argument Primitives | ❌ no dedicated skill yet | **Complete (no audit skill yet)** |
| **Relationship & Composition** | 4 | 🟡 [`PARALLAX_VISUAL_VOCABULARY.md`](PARALLAX_VISUAL_VOCABULARY.md) § Relationship & Composition | ❌ no dedicated skill yet | **Complete (no audit skill yet)** |
| **Documentary archival** | 4 | 🟡 [`PARALLAX_VISUAL_VOCABULARY.md`](PARALLAX_VISUAL_VOCABULARY.md) § Documentary archival | ❌ no dedicated skill yet | **Complete (no audit skill yet)** |
| **Cross-frame / morph** | 3 | 🟡 [`PARALLAX_VISUAL_VOCABULARY.md`](PARALLAX_VISUAL_VOCABULARY.md) § Cross-frame / morph | ❌ no dedicated skill yet | **Complete (no audit skill yet)** |
| **Stock footage** | n/a | ✅ [`FOOTAGE_SOURCING.md`](../project/FOOTAGE_SOURCING.md) tier system | 🟡 visual-concept Lens 2 | Partial |
| **AI illustration** (ILLUST) | n/a | 🟡 [`VISUAL_LANGUAGE.md`](../project/VISUAL_LANGUAGE.md) Register 2 | 🟡 visual-concept Lens 6 | Partial |
| **AI video** (AI-GEN) | n/a | 🟡 [`VISUAL_LANGUAGE.md`](../project/VISUAL_LANGUAGE.md) Register 3 | 🟡 visual-concept Lenses 5+6 | Partial |

**Legend:** ✅ canonical wall-table or skill exists · 🟡 logic exists but spread across reference prose · ❌ no dedicated artifact yet

> **Math templates promoted (May 20, 2026):** `MathReveal` and `MathDerivation` are fully registered in `TEMPLATE_COMPONENTS` (episode manifest dispatch), `TEMPLATE_SCHEMAS`, `assembly-manifest.schema.json`, and `generate_manifest.py`. They are episode-level citizens, not catalogue-only. Doctrine: `project/MATH_RENDER_REGISTER.md`.

---

## Quick selection — by the script's editorial sentence

| If the beat is about… | Family | Probable template (open the family below for full table) |
|---|---|---|
| "X% per country / share / rate" | Maps | ChoroplethMap |
| "X count per country" | Maps | ProportionalSymbolMap (≤12) or CartogramMap (15+ dense) |
| "Where specific facilities cluster" | Maps | DensityMap |
| "Members of X" / categorical | Maps | AtlasPlate (modern) |
| "In 1962, the world looked like…" | Maps | AtlasPlate + vintage |
| "Spinning globe cold-open" | Maps | AtlasPlate + orthographic + rotation |
| "From A to B" / supply chain / flow | Maps | RouteAnimation |
| "Terrain fly-through / dramatic geography" | Maps | CinematicMap (max 1–3/episode) |
| "The number that mattered was X" | Charts | StatReveal |
| "Trend over time" | Charts | TimeSeriesChart |
| "Bar / lollipop comparison" | Charts | DataChart |
| "Forecast updating with evidence" | Charts | BayesianUpdate |
| "X% likely" | Charts | ProbabilityGauge |
| "Capability comparison across 4-6 axes" | Charts | RadarChart |
| "Same metric across many small panels" | Charts | SmallMultiples |
| "How X works / structural pattern" | Diagrams | FrameworkDiagram |
| "Alliance web / who's connected to whom" | Diagrams | NetworkDiagram |
| "Branching scenarios / decision points" | Diagrams | DecisionTree |
| "Decision space narrows along named axes" | Diagrams | OutcomePartition |
| "Resources flow A → B → C" | Diagrams | SankeyFlow |
| "Strategic game / payoff matrix" | Diagrams | GameBoard |
| "Escalation / severity ladder" | Diagrams | EscalationLadder |
| "Position-on-axes strategic frame" | Diagrams | StrategicLandscape |
| "Where each dollar goes" | Diagrams | PricingWaterfall |
| "Two frameworks compared" | Diagrams | DuelingFrameworks |
| "Fork-in-the-road moment" | Diagrams | DuelingFrameworks or DecisionTree ← was BifurcationRoute (DELETED May 13) |
| "Reinforcing / balancing feedback loops" | Diagrams | CausalLoopDiagram |
| "Single-axis chronology" | Timelines | HorizontalTimeline |
| "Spotlight on one pivotal moment" | Timelines | HorizontalTimelineSingle |
| "Long-period cyclical / geological time" | Timelines | SpiralTimeline |
| "Two parallel chronologies" | Timelines | DualTimeline ← was TimelineComparison (DELETED May 13) |
| "Timeline transforming into another" | Timelines | HorizontalTimeline (mode: "morph") ← was TimelineMorph (DELETED May 13) |
| "Quote / definition / bilingual text" | Typography | KineticTypography |
| "Section title / kicker reveal" | Typography | TitleTransition |
| "Side-by-side comparison" | Typography | SplitComposition |
| "Photo with caption" | Typography | ImageComposite |
| "Multiple photos with reveals" | Typography | PhotoMontage |
| "Photo with animated callouts" | Typography | AnnotatedImage |
| "Document / manuscript primary source" | Typography | PrimarySourceReveal |
| "Logical syllogism / formal argument" | Argument Primitives | Syllogism |
| "List of foundational axioms / premises" | Argument Primitives | AxiomList |
| "Thesis vs. antithesis → synthesis" | Argument Primitives | DialecticFlow |
| "If X then Y / conditional reasoning" | Argument Primitives | ConditionalArgument |
| "What if it had gone differently?" | Argument Primitives | CounterfactualPath |
| "Where two groups / ideas overlap" | Relationship & Composition | VennDiagram |
| "Bilateral flow / trade / migration volume" | Relationship & Composition | ChordDiagram |
| "Hierarchical part-to-whole structure" | Relationship & Composition | Treemap |
| "N×M comparison grid / cross-tabulation" | Relationship & Composition | MatrixHeatmap |
| "Handwritten letter / primary source" | Documentary archival | HandwrittenLetter |
| "Newspaper headline montage" | Documentary archival | NewspaperHeadlineRotator |
| "Archival film / reel aesthetic" | Documentary archival | ArchivalReel |
| "Telegram / cable communiqué" | Documentary archival | TelegramCable |
| "Side-by-side comparison of two visuals" | Cross-frame / morph | ComparisonPair |
| "Before → after / one thing becoming another" | Cross-frame / morph | MorphTransition |
| "Multi-pane juxtaposition" | Cross-frame / morph | SplitFrame |
| "Real-world footage" | Footage | (see FOOTAGE_SOURCING.md) |
| "Atmospheric mood image" | ILLUST | Recraft, Register 2 |
| "Photoreal scene that doesn't exist" | AI-GEN | Kling/Sora/Runway, Register 3 |

---

## Family detail — Maps (8 templates) ✅

**Status:** complete wayfinding stack (selector + audit + runtime heuristics + dossiers).

**Selector:** [`MAP_TEMPLATE_SELECTOR.md`](MAP_TEMPLATE_SELECTOR.md) — wall-table with data-shape decision tree.

**Audit:** `skills/map-audit/SKILL.md` — runs after script-draft, before visual-spec.

**Runtime heuristics:** Each map template fires dev-time `warnIf` when data shape suggests a different template is better fit (ChoroplethMap on categorical data, DensityMap on <10 points, etc.).

| Template | Purpose |
|---|---|
| AtlasPlate | Pure-SVG country/region highlight; editorial default; vintage or orthographic rotation variants |
| ChoroplethMap | Continuous rate / share / index per country |
| ProportionalSymbolMap | Count per location (≤12 locations) |
| CartogramMap | Dense count data (15+ locations); cartogram distortion |
| DensityMap | Geographic clustering of specific facilities or incidents |
| RouteAnimation | A-to-B or radial hub flows; supply chains; military campaigns |
| TilegamUsMap | US-only; equal-area tilemap for state-level data |
| CinematicMap | Pitched moving camera for terrain fly-throughs and GlobeReveal; max 1–3/episode (render cost) |

**Dossiers:** Eight dossiers under `references/template-research/`:
- [`choropleth-map.md`](references/template-research/choropleth-map.md)
- [`route-animation.md`](references/template-research/route-animation.md)
- [`atlas-plate.md`](references/template-research/atlas-plate.md)
- [`proportional-symbol-map.md`](references/template-research/proportional-symbol-map.md)
- [`cartogram-map.md`](references/template-research/cartogram-map.md)
- [`density-map.md`](references/template-research/density-map.md)
- [`tilegram-us-map.md`](references/template-research/tilegram-us-map.md)
- [`cinematic-map.md`](references/template-research/cinematic-map.md) — altitude table, pitch guidance, fog/light pairings, tile pre-warmer failure modes
- [`map-annotations.md`](references/template-research/map-annotations.md) — overlay-layer dossier shared by all 8

---

## Family detail — Charts (20 templates) ✅

**Status:** complete wayfinding stack.

**Selector:** [`CHART_TEMPLATE_SELECTOR.md`](CHART_TEMPLATE_SELECTOR.md) — wall-table with data-shape decision tree, sibling disambiguation, Cleveland-honest encoding rules.

**Audit:** `skills/chart-audit/SKILL.md` — 7-lens audit catching Tufte y-axis truncation, rainbow bars, StatReveal without comparison bars, RadarChart density caps, BayesianUpdate vs. ProbabilityGauge mis-routing.

**Runtime heuristics:** DataChart + TimeSeriesChart (existing), plus StatReveal (missing comparisons[]), RadarChart (>3 subjects / >25-char axis labels).

| Template | Purpose |
|---|---|
| DataChart | Bar / lollipop / horizontal bar comparison |
| TimeSeriesChart | Trend over time; supports counterfactual ghost series |
| StatReveal | Hero number with comparison anchors |
| BayesianUpdate | Forecast updating with evidence; prior → posterior animation |
| ProbabilityGauge | Single-probability display |
| RadarChart | Capability comparison across 4–6 axes (≤3 subjects) |
| BeeswarmChart | Distribution of individual data points |
| BumpChart | Rank-over-time with crossing lines |
| CalendarHeatmap | Day-of-week / month temporal pattern |
| ConnectedScatterplot | Two-variable path over time |
| DumbbellPlot | Before/after or gap comparison between two values |
| HorizonChart | Dense multi-series time data in compact vertical space |
| IsotypeChart | Count via repeated icons; audience-friendly |
| MarimekkoChart | Two-axis proportion (width × height = share) |
| PopulationPyramid | Age-sex demographic distribution |
| RankChangeDotPlot | Position change between two time points |
| RidgelinePlot | Distribution comparison across many groups |
| Streamgraph | Share-over-time compositional flow |
| TernaryPlot | Three-variable compositional data (sums to 100%) |
| SmallMultiples | Trellis / panel chart — same metric across many comparable units |

**Dossiers** (every chart template has one) under `references/template-research/`. (PricingWaterfall lives in the Diagrams family per CHART_TEMPLATE_SELECTOR.md.)

---

## Family detail — Diagrams (11 templates — incl. ArcDiagram) ✅

**Status:** complete wayfinding stack. Largest family, highest leverage.

**Selector:** [`DIAGRAM_TEMPLATE_SELECTOR.md`](DIAGRAM_TEMPLATE_SELECTOR.md) — wall-table with structural-shape decision tree, sibling disambiguation tables (DecisionTree variants vs. GameBoard, flow vs. Sankey, comparison vs. matrix vs. DuelingFrameworks, DT vs. OutcomePartition).

**Audit:** `skills/diagram-audit/SKILL.md` — 8-lens audit catching sibling mis-routing, density-cap violations (>7 spokes, >7 rungs, >10 Sankey nodes), missing focal hierarchy, missing source attribution, invented payoff numbers.

**Runtime heuristics:** NetworkDiagram (>8 nodes), SankeyFlow (>10 nodes / >15 links), EscalationLadder (>7 rungs).

| Template | Purpose |
|---|---|
| FrameworkDiagram | How X works; structural / conceptual pattern |
| NetworkDiagram | Alliance web; who's connected to whom |
| DecisionTree | Branching scenarios; 5 layout variants (extensive · ladder · indented · spine · schematic) |
| OutcomePartition | Decision space narrows along named axes; RAND-style partition map |
| ArcDiagram | Arc-based network for linear node ordering |
| SankeyFlow | Resource / money / people flows A → B → C |
| EscalationLadder | Severity / capability escalation rungs |
| GameBoard | Strategic game payoff matrix |
| StrategicLandscape | Two-axis position map |
| PricingWaterfall | Value-chain decomposition; where each dollar goes |
| DuelingFrameworks | Two frameworks or timelines compared side-by-side |
| CausalLoopDiagram | System-dynamics reinforcing / balancing feedback loops |

**Dossiers:** [`framework-diagram.md`](references/template-research/framework-diagram.md), [`network-diagram.md`](references/template-research/network-diagram.md), [`sankey-flow.md`](references/template-research/sankey-flow.md), [`escalation-ladder.md`](references/template-research/escalation-ladder.md), [`game-theory.md`](references/template-research/game-theory.md), [`decision-tree.md`](references/template-research/decision-tree.md), [`outcome-partition.md`](references/template-research/outcome-partition.md).

---

## Family detail — Timelines (4 live templates) ✅

**Status:** complete wayfinding stack. TimelineComparison / DualTimeline is Parallax's signature bounded-analogy form.

**Deleted May 13, 2026:** TimelineComparison, DualTimeline (replaced by current DualTimeline entry), ~~TimelineMorph~~ (absorbed into HorizontalTimeline mode "morph").

**Selector:** [`TIMELINE_TEMPLATE_SELECTOR.md`](TIMELINE_TEMPLATE_SELECTOR.md) — wall-table with time-structure decision tree, bounded-analogy doctrine ground, sibling disambiguation.

**Audit:** `skills/timeline-audit/SKILL.md` — 7-lens audit catching bounded-analogy mis-routing, phase-vs-calendar alignment errors, era-color discipline, connection-line choreography.

**Runtime heuristics:** HorizontalTimeline (>32 events), DualTimeline (>5 connections OR missing connections).

| Template | Purpose |
|---|---|
| HorizontalTimeline | Standard single-axis chronology; mode "morph" absorbs old ~~TimelineMorph~~ |
| HorizontalTimelineSingle | Spotlight on one pivotal moment in a chronology |
| SpiralTimeline | Long-period, cyclical, or geological time; cyclical recurrence |
| DualTimeline | Two parallel chronologies for bounded historical analogy |

**Dossier:** [`timeline-comparison.md`](references/template-research/timeline-comparison.md).

---

## Family detail — Typography / layout (7 templates) ✅

**Status:** complete wayfinding stack. Lowest cross-template overlap, highest register-confusion rate.

**Selector:** [`TYPOGRAPHY_TEMPLATE_SELECTOR.md`](TYPOGRAPHY_TEMPLATE_SELECTOR.md) — wall-table with text-moment-kind decision tree, KineticTypography vs. TitleTransition disambiguation (the canonical confusion), POLISH D1-D21 grounded rules.

**Audit:** `skills/typography-audit/SKILL.md` — 8-lens audit catching register confusion, TitleTransition motion/chrome violations, KineticTypography missing attribution, SplitComposition parallel-structure violations, image load-bearing failures, AnnotatedImage callout density and stagger.

**Runtime heuristics:** SplitComposition (item-count imbalance ≥2), AnnotatedImage (>6 callouts).

| Template | Purpose |
|---|---|
| KineticTypography | Quote / definition / bilingual text; archival quotes auto-detect; text-animation register dispatched automatically |
| TitleTransition | Section title / chapter kicker reveal |
| SplitComposition | Side-by-side text or data comparison |
| ImageComposite | Photo with caption or overlay text |
| PhotoMontage | Multiple photos with sequential reveals |
| AnnotatedImage | Photo with animated callouts (≤6 callouts) |
| PrimarySourceReveal | Document / manuscript primary-source reveal; scanned or typeset text |

**Dossier:** [`title-card.md`](references/template-research/title-card.md).

---

## Family detail — Argument Primitives (5 templates)

**Status:** complete template implementations; no dedicated audit skill yet. Editorial guidance in `PARALLAX_VISUAL_VOCABULARY.md` § Argument Primitives.

**Editorial purpose:** encode the logical skeleton of an argument — make the reasoning structure itself visible on screen. Use when the argument's logic is as important as its content.

| Template | Purpose |
|---|---|
| Syllogism | Display a formal deductive argument (major premise → minor premise → conclusion) |
| AxiomList | List foundational premises / assumptions the argument rests on |
| DialecticFlow | Thesis → antithesis → synthesis animated dialectical structure |
| ConditionalArgument | "If X then Y" conditional / hypothetical reasoning chain |
| CounterfactualPath | Counterfactual fork — what if it had gone differently; the fork is the entire argument (vs. in-chart ghost modifier) |

**Selector:** [`PARALLAX_VISUAL_VOCABULARY.md`](PARALLAX_VISUAL_VOCABULARY.md) § Argument Primitives — chooser table for routing between Syllogism / AxiomList / DialecticFlow / ConditionalArgument / CounterfactualPath.

**Decision rule for CounterfactualPath vs. in-chart counterfactual:** when the counterfactual is a modifier on existing data (a ghost series or dashed bar), use the `counterfactual: true` field on `TimeSeriesLine` or `DataPoint`. When the *fork is the entire editorial argument*, use CounterfactualPath. See `project/COUNTERFACTUAL_REGISTER.md` for the full Hawthorn-test decision matrix.

---

## Family detail — Relationship & Composition (4 templates)

**Status:** complete template implementations; no dedicated audit skill yet. Editorial guidance in `PARALLAX_VISUAL_VOCABULARY.md` § Relationship & Composition.

**Editorial purpose:** reveal how things relate — via overlap, bilateral exchange, hierarchical containment, or systematic cross-tabulation.

| Template | Purpose |
|---|---|
| VennDiagram | Set overlap; 2–3 sets with SVG clip-path intersection reveals |
| ChordDiagram | Bilateral flows (trade, migration, diplomatic ties); pure-trig arcs, no external lib |
| Treemap | Hierarchical part-to-whole; squarify algorithm; reveals by area |
| MatrixHeatmap | N×M cross-tabulation; diagonal ripple reveal; `interpolateColors` heatmap |

**Selector:** [`PARALLAX_VISUAL_VOCABULARY.md`](PARALLAX_VISUAL_VOCABULARY.md) § Relationship & Composition.

**Sibling disambiguation:**
- ChordDiagram vs. SankeyFlow: use Chord when the flow is bilateral and symmetric (A↔B volumes); use Sankey when the flow is directed A→B→C with value transformation.
- Treemap vs. DataChart: use Treemap when hierarchy matters; use DataChart when flat comparison is sufficient.
- MatrixHeatmap vs. RadarChart: use Matrix when both axes are meaningful categorical dimensions; use Radar when comparing one entity across performance attributes.

---

## Family detail — Documentary archival (4 templates)

**Status:** complete template implementations; no dedicated audit skill yet. Editorial guidance in `PARALLAX_VISUAL_VOCABULARY.md` § Documentary archival.

**Editorial purpose:** primary-source and archival-register beats — moments where the viewer needs to feel the historical weight of a document, headline, or transmission rather than read a data visualization.

| Template | Purpose |
|---|---|
| HandwrittenLetter | Letter-form primary source; handwriting aesthetic with envelope reveal |
| NewspaperHeadlineRotator | Montage of newspaper headlines across time or outlets |
| ArchivalReel | Archival film / newsreel aesthetic; grain, flicker, title-card typography |
| TelegramCable | Diplomatic telegram or intelligence cable; typewriter reveal; redaction aesthetic |

**Selector:** [`PARALLAX_VISUAL_VOCABULARY.md`](PARALLAX_VISUAL_VOCABULARY.md) § Documentary archival.

**Register rule:** these templates claim the documentary register (Register 1 in `VISUAL_LANGUAGE.md`). Use sparingly — 1–2 per episode maximum. Over-use flattens the contrast that makes archival moments land. Pair with FilmOverlay `"documentary"` preset for maximum register coherence.

---

## Family detail — Cross-frame / morph (3 templates)

**Status:** complete template implementations; no dedicated audit skill yet. Editorial guidance in `PARALLAX_VISUAL_VOCABULARY.md` § Cross-frame / morph.

**Editorial purpose:** side-by-side comparison, temporal morphing, and multi-pane juxtaposition — when the *relationship between two visuals* is the argument, not either visual alone.

| Template | Purpose |
|---|---|
| ComparisonPair | Side-by-side comparison of two images, maps, or text panels |
| MorphTransition | Before → after temporal morph; one thing becoming another |
| SplitFrame | Multi-pane juxtaposition (2–4 panes); simultaneous parallel views |

**Selector:** [`PARALLAX_VISUAL_VOCABULARY.md`](PARALLAX_VISUAL_VOCABULARY.md) § Cross-frame / morph.

**Sibling disambiguation:**
- ComparisonPair vs. SplitComposition (Typography): use ComparisonPair when both panes are visual (images, maps); use SplitComposition when both panes are text or data-driven.
- MorphTransition vs. CounterfactualPath: use Morph when the argument is *transformation* (the thing actually changed); use CounterfactualPath when the argument is *unrealized possibility* (the thing that didn't happen).
- SplitFrame vs. ComparisonPair: use SplitFrame for 3–4 panes or simultaneous dynamic views; use ComparisonPair for a clean two-item juxtaposition.

---

## Other asset types

Owned by visual-spec but rendered outside Remotion.

### Stock footage 🟡

**Selector:** [`project/FOOTAGE_SOURCING.md`](../project/FOOTAGE_SOURCING.md) sourcability tier system (high / uncertain / unlikely).

**Editorial guidance:** [`project/VISUAL_LANGUAGE.md`](../project/VISUAL_LANGUAGE.md) "Displacement Principle" (footage vs. MG vs. AI-GEN).

**Audit:** visual-concept Lens 2 (likelihood per shot); script-audit Lens 6 (mode balance + flag unsourceable).

### AI illustration (ILLUST) 🟡

**Role:** Register 2 — atmospheric / emotional / NOT data-carrying. Generated by Recraft (`tools/recraft/recraft.py`).

**Selector:** [`project/VISUAL_LANGUAGE.md`](../project/VISUAL_LANGUAGE.md) Register 2 spec. The decision rule: "If the viewer needs to *read* something → Remotion template. If the viewer needs to *feel* something → ILLUST."

**Audit:** visual-concept Lens 6 (register fit); script-audit Lens 6 (mode balance, ~5-15% target).

### AI video (AI-GEN) 🟡

**Role:** Register 3 — photoreal scenes in spaces cameras can't access. Generated by Kling/Sora/Runway. Constructivist-figurative aesthetic per the May 2026 pivot.

**Selector:** [`project/VISUAL_LANGUAGE.md`](../project/VISUAL_LANGUAGE.md) Register 3. The decision rule: "Only use AI-GEN for genuinely unsourceable spaces. If stock footage exists, use FOOTAGE."

**Audit:** visual-concept Lens 5 (tool-assignment); visual-concept Lens 6 (register proportion); script-audit Lens 6 (cost-awareness, "save AI-GEN for genuinely unsourceable spaces").

---

## Rollout history

**May 11–12, 2026 — initial wayfinding stack (5 families, 45 templates):** The Maps family wayfinding pattern (selector + audit + heuristics + dossiers) was fully systematized and rolled out to the remaining four Remotion families:

- **Diagrams** — 10 live templates incl. ArcDiagram (BifurcationRoute deleted May 13), highest leverage (NetworkDiagram + SankeyFlow + EscalationLadder runtime heuristics)
- **Timelines** — signature-form integrity (TimelineComparison bounded-analogy enforcement); TimelineMorph / TimelineComparison / DualTimeline deleted or absorbed May 13
- **Charts** — Cleveland-honesty enforcement (StatReveal + RadarChart heuristics added to existing DataChart + TimeSeriesChart)
- **Typography** — POLISH D-rule enforcement (SplitComposition + AnnotatedImage heuristics)

Each family received: SELECTOR wall-table + dedicated audit skill + at least one runtime `warnIf` on the most-misused templates. The visual-spec skill consumes all five SELECTOR docs as canonical template-selection references.

**May 2026 sprint — 4 new families, ~24 new templates (9 families, ~69 templates total):**

- **Maps** gained CinematicMap: pitched moving-camera terrain fly-throughs using `<CinematicCamera>` (FreeCamera API) + `warmTiles()` tile pre-warmer. GlobeReveal is the same template at high altitude, not a separate entry. Authoring tool: `tools/camera_path.py`. Dossier: `references/template-research/cinematic-map.md`. Editorial constraint: max 1–3/episode.
- **Charts** gained SmallMultiples (trellis panel chart — same metric across many comparable small panels).
- **Diagrams** gained CausalLoopDiagram (system-dynamics reinforcing / balancing feedback loops) and OutcomePartition (RAND-style decision-space partition map, sibling to DecisionTree). DecisionTree itself gained 5 layout variants (extensive · ladder · indented · spine · schematic). PrimarySourceReveal was assigned to Typography/layout.
- **Timelines** gained HorizontalTimelineSingle and SpiralTimeline (now 4 live templates).
- **Typography / layout** gained PrimarySourceReveal (now 7 templates).
- **Argument Primitives** (new family, 5 templates): Syllogism, AxiomList, DialecticFlow, ConditionalArgument, CounterfactualPath — encoding the logical skeleton of an argument on screen.
- **Relationship & Composition** (new family, 4 templates): VennDiagram, ChordDiagram, Treemap, MatrixHeatmap — set overlap, bilateral flows, hierarchical part-to-whole, N×M cross-tabulation.
- **Documentary archival** (new family, 4 templates): HandwrittenLetter, NewspaperHeadlineRotator, ArchivalReel, TelegramCable — primary-source / archival-register beats.
- **Cross-frame / morph** (new family, 3 templates): ComparisonPair, MorphTransition, SplitFrame — side-by-side comparison, temporal morph, multi-pane juxtaposition.
- **Math** (promoted to episode-level May 20, 2026): MathReveal and MathDerivation — KaTeX infrastructure, `M-MATH-VALID` lint, 56 unit tests. Wired into `TEMPLATE_COMPONENTS`, `TEMPLATE_SCHEMAS`, `assembly-manifest.schema.json`, and `generate_manifest.py`. Doctrine: `project/MATH_RENDER_REGISTER.md`.

---

## References

- [`MAP_TEMPLATE_SELECTOR.md`](MAP_TEMPLATE_SELECTOR.md) — Maps wall-table (the prototype)
- [`CHART_TEMPLATE_SELECTOR.md`](CHART_TEMPLATE_SELECTOR.md) — Charts wall-table
- [`DIAGRAM_TEMPLATE_SELECTOR.md`](DIAGRAM_TEMPLATE_SELECTOR.md) — Diagrams wall-table (incl. DT-variants table + DT-vs-OutcomePartition disambiguation)
- [`TIMELINE_TEMPLATE_SELECTOR.md`](TIMELINE_TEMPLATE_SELECTOR.md) — Timelines wall-table
- [`TYPOGRAPHY_TEMPLATE_SELECTOR.md`](TYPOGRAPHY_TEMPLATE_SELECTOR.md) — Typography wall-table
- [`PARALLAX_VISUAL_VOCABULARY.md`](PARALLAX_VISUAL_VOCABULARY.md) — chart chooser for all 9 families (editorial intent → template); § Argument Primitives, § Relationship & Composition, § Documentary archival, § Cross-frame / morph for the four new families
- [`references/template-picker.md`](references/template-picker.md) — long-form selection prose for every template (excellent reference)
- [`references/template-schemas.md`](references/template-schemas.md) — schema reference for every template
- [`references/template-research/`](references/template-research/) — per-template dossiers (canonical idioms, failure modes, defaults)
- [`BRAND.md`](BRAND.md) — design system; Cartography section for map register
- [`POLISH.md`](POLISH.md) — editorial doctrine D1–D21 (cross-template polish rules)
- [`project/VISUAL_LANGUAGE.md`](../project/VISUAL_LANGUAGE.md) — when to use footage / MG / ILLUST / AI-GEN
- [`project/FOOTAGE_SOURCING.md`](../project/FOOTAGE_SOURCING.md) — stock footage selection
- [`project/COUNTERFACTUAL_REGISTER.md`](../project/COUNTERFACTUAL_REGISTER.md) — Hawthorn-test decision matrix for counterfactual styling (in-chart vs. CounterfactualPath template)
- [`skills/visual-spec/SKILL.md`](../skills/visual-spec/SKILL.md) — the skill that consumes this index
- [`skills/map-audit/SKILL.md`](../skills/map-audit/SKILL.md) — map-specific audit (the prototype for per-family audits)

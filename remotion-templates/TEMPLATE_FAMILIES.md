# Template Families — Wayfinding Index

> One page. Pin it. When a script beat needs a visual, find the family first, then the template.
>
> Last updated: May 11, 2026

The Remotion MG layer has **45 templates** organized into 5 families plus 3 non-template asset types. Each family has its own "when to use which template" logic. This page is the *index* — it tells you which family you're in and where the canonical decision logic lives. The detailed editorial guidance is in:

- **Per-family SELECTOR docs** (wall-tables) when they exist
- **`references/template-picker.md`** — long-form prose covering every family
- **`references/template-research/<template>.md`** — per-template dossier with canonical idioms, failure modes, Parallax defaults

---

## Family index

| Family | Count | Selector doc | Audit skill | Status |
|---|---|---|---|---|
| **Maps** | 6 | ✅ [`MAP_TEMPLATE_SELECTOR.md`](MAP_TEMPLATE_SELECTOR.md) | ✅ `map-audit` | **Complete** |
| **Charts** | 6 | ✅ [`CHART_TEMPLATE_SELECTOR.md`](CHART_TEMPLATE_SELECTOR.md) | ✅ `chart-audit` | **Complete** |
| **Diagrams** | 10 | ✅ [`DIAGRAM_TEMPLATE_SELECTOR.md`](DIAGRAM_TEMPLATE_SELECTOR.md) | ✅ `diagram-audit` | **Complete** |
| **Timelines** | 4 | ✅ [`TIMELINE_TEMPLATE_SELECTOR.md`](TIMELINE_TEMPLATE_SELECTOR.md) | ✅ `timeline-audit` | **Complete** |
| **Typography / layout** | 6 | ✅ [`TYPOGRAPHY_TEMPLATE_SELECTOR.md`](TYPOGRAPHY_TEMPLATE_SELECTOR.md) | ✅ `typography-audit` | **Complete** |
| **Stock footage** | n/a | ✅ [`FOOTAGE_SOURCING.md`](../project/FOOTAGE_SOURCING.md) tier system | 🟡 visual-concept Lens 2 | Partial |
| **AI illustration** (ILLUST) | n/a | 🟡 [`VISUAL_LANGUAGE.md`](../project/VISUAL_LANGUAGE.md) Register 2 | 🟡 visual-concept Lens 6 | Partial |
| **AI video** (AI-GEN) | n/a | 🟡 [`VISUAL_LANGUAGE.md`](../project/VISUAL_LANGUAGE.md) Register 3 | 🟡 visual-concept Lenses 5+6 | Partial |

**Legend:** ✅ canonical wall-table or skill exists · 🟡 logic exists but spread across reference prose · ❌ no dedicated artifact yet

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
| "The number that mattered was X" | Charts | StatReveal |
| "Trend over time" | Charts | TimeSeriesChart |
| "Bar / lollipop comparison" | Charts | DataChart |
| "Forecast updating with evidence" | Charts | BayesianUpdate |
| "X% likely" | Charts | ProbabilityGauge |
| "Capability comparison across 4-6 axes" | Charts | RadarChart |
| "How X works / structural pattern" | Diagrams | FrameworkDiagram |
| "Alliance web / who's connected to whom" | Diagrams | NetworkDiagram |
| "Branching scenarios / decision points" | Diagrams | DecisionTree |
| "Resources flow A → B → C" | Diagrams | SankeyFlow |
| "Strategic game / payoff matrix" | Diagrams | GameBoard |
| "Escalation / severity ladder" | Diagrams | EscalationLadder |
| "Position-on-axes strategic frame" | Diagrams | StrategicLandscape |
| "Where each dollar goes" | Diagrams | PricingWaterfall |
| "Two frameworks compared" | Diagrams | DuelingFrameworks |
| "Fork-in-the-road moment" | Diagrams | DuelingFrameworks or DecisionTree ← was BifurcationRoute (DELETED May 13) |
| "Single-axis chronology" | Timelines | HorizontalTimeline |
| "Two parallel chronologies" | Timelines | DualTimeline |
| "Then-and-now comparison" | Timelines | TimelineComparison |
| "Timeline transforming into another" | Timelines | HorizontalTimeline (mode: "morph") ← was TimelineMorph (DELETED May 13) |
| "Quote / definition / bilingual text" | Typography | KineticTypography |
| "Section title / kicker reveal" | Typography | TitleTransition |
| "Side-by-side comparison" | Typography | SplitComposition |
| "Photo with caption" | Typography | ImageComposite |
| "Multiple photos with reveals" | Typography | PhotoMontage |
| "Photo with animated callouts" | Typography | AnnotatedImage |
| "Real-world footage" | Footage | (see FOOTAGE_SOURCING.md) |
| "Atmospheric mood image" | ILLUST | Recraft, Register 2 |
| "Photoreal scene that doesn't exist" | AI-GEN | Kling/Sora/Runway, Register 3 |

---

## Family detail — Maps (6 templates) ✅

**Status:** complete wayfinding stack (selector + audit + runtime heuristics + dossiers).

**Selector:** [`MAP_TEMPLATE_SELECTOR.md`](MAP_TEMPLATE_SELECTOR.md) — wall-table with data-shape decision tree.

**Audit:** `skills/map-audit/SKILL.md` — runs after script-draft, before visual-spec.

**Runtime heuristics:** Each map template fires dev-time `warnIf` when data shape suggests a different template is better fit (ChoroplethMap on categorical data, DensityMap on <10 points, etc.).

**Dossiers:** Seven dossiers under `references/template-research/`:
- [`choropleth-map.md`](references/template-research/choropleth-map.md)
- [`route-animation.md`](references/template-research/route-animation.md)
- [`atlas-plate.md`](references/template-research/atlas-plate.md)
- [`proportional-symbol-map.md`](references/template-research/proportional-symbol-map.md)
- [`cartogram-map.md`](references/template-research/cartogram-map.md)
- [`density-map.md`](references/template-research/density-map.md)
- [`map-annotations.md`](references/template-research/map-annotations.md) — overlay-layer dossier shared by all 6

---

## Family detail — Charts (6 templates) ✅

**Status:** complete wayfinding stack.

**Selector:** [`CHART_TEMPLATE_SELECTOR.md`](CHART_TEMPLATE_SELECTOR.md) — wall-table with data-shape decision tree, sibling disambiguation, Cleveland-honest encoding rules.

**Audit:** `skills/chart-audit/SKILL.md` — 7-lens audit catching Tufte y-axis truncation, rainbow bars, StatReveal without comparison bars, RadarChart density caps, BayesianUpdate vs. ProbabilityGauge mis-routing.

**Runtime heuristics:** DataChart + TimeSeriesChart (existing), plus StatReveal (missing comparisons[]), RadarChart (>3 subjects / >25-char axis labels).

**Dossiers:** [`data-chart.md`](references/template-research/data-chart.md), [`time-series-chart.md`](references/template-research/time-series-chart.md).

---

## Family detail — Diagrams (10 templates) ✅

**Status:** complete wayfinding stack. Largest family, highest leverage.

**Selector:** [`DIAGRAM_TEMPLATE_SELECTOR.md`](DIAGRAM_TEMPLATE_SELECTOR.md) — wall-table with structural-shape decision tree, sibling disambiguation tables (DecisionTree vs. GameBoard, flow vs. Sankey, comparison vs. matrix vs. DuelingFrameworks).

**Audit:** `skills/diagram-audit/SKILL.md` — 8-lens audit catching sibling mis-routing, density-cap violations (>7 spokes, >7 rungs, >10 Sankey nodes), missing focal hierarchy, missing source attribution, invented payoff numbers.

**Runtime heuristics:** NetworkDiagram (>8 nodes), SankeyFlow (>10 nodes / >15 links), EscalationLadder (>7 rungs).

**Dossiers:** [`framework-diagram.md`](references/template-research/framework-diagram.md), [`network-diagram.md`](references/template-research/network-diagram.md), [`sankey-flow.md`](references/template-research/sankey-flow.md), [`escalation-ladder.md`](references/template-research/escalation-ladder.md), [`game-theory.md`](references/template-research/game-theory.md).

---

## Family detail — Timelines (4 templates) ✅

**Status:** complete wayfinding stack. TimelineComparison is Parallax's signature form.

**Selector:** [`TIMELINE_TEMPLATE_SELECTOR.md`](TIMELINE_TEMPLATE_SELECTOR.md) — wall-table with time-structure decision tree, bounded-analogy doctrine ground, sibling disambiguation.

**Audit:** `skills/timeline-audit/SKILL.md` — 7-lens audit catching bounded-analogy mis-routing (HorizontalTimeline where TimelineComparison is correct), phase-vs-calendar alignment errors, era-color discipline (TimelineMorph guardrails now part of HorizontalTimeline mode "morph"), connection-line choreography.

**Runtime heuristics:** HorizontalTimeline (>32 events), TimelineComparison (>5 connections OR missing connections).

**Dossier:** [`timeline-comparison.md`](references/template-research/timeline-comparison.md).

---

## Family detail — Typography / layout (6 templates) ✅

**Status:** complete wayfinding stack. Lowest cross-template overlap, highest register-confusion rate.

**Selector:** [`TYPOGRAPHY_TEMPLATE_SELECTOR.md`](TYPOGRAPHY_TEMPLATE_SELECTOR.md) — wall-table with text-moment-kind decision tree, KineticTypography vs. TitleTransition disambiguation (the canonical confusion), POLISH D1-D18 grounded rules.

**Audit:** `skills/typography-audit/SKILL.md` — 8-lens audit catching register confusion, TitleTransition motion/chrome violations, KineticTypography missing attribution, SplitComposition parallel-structure violations, image load-bearing failures, AnnotatedImage callout density and stagger.

**Runtime heuristics:** SplitComposition (item-count imbalance ≥2), AnnotatedImage (>6 callouts).

**Dossier:** [`title-card.md`](references/template-research/title-card.md).

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

The Maps family was upgraded in May 2026 with a complete wayfinding stack (selector + audit + heuristics + dossiers). The pattern was rolled out to the remaining four Remotion families on May 11–12, 2026:

- **Diagrams** — 10 templates, highest leverage (NetworkDiagram + SankeyFlow + EscalationLadder runtime heuristics)
- **Timelines** — signature-form integrity (TimelineComparison bounded-analogy enforcement)
- **Charts** — Cleveland-honesty enforcement (StatReveal + RadarChart heuristics added to existing DataChart + TimeSeriesChart)
- **Typography** — POLISH D-rule enforcement (SplitComposition + AnnotatedImage heuristics)

Each family now has: SELECTOR wall-table + dedicated audit skill + at least one runtime warnIf on the most-misused templates. The visual-spec skill consumes all five SELECTOR docs as canonical template-selection references.

---

## References

- [`MAP_TEMPLATE_SELECTOR.md`](MAP_TEMPLATE_SELECTOR.md) — Maps wall-table (the prototype)
- [`references/template-picker.md`](references/template-picker.md) — long-form selection prose for every template (excellent reference)
- [`references/template-schemas.md`](references/template-schemas.md) — schema reference for every template
- [`references/template-research/`](references/template-research/) — per-template dossiers (canonical idioms, failure modes, defaults)
- [`BRAND.md`](BRAND.md) — design system; Cartography section for map register
- [`POLISH.md`](POLISH.md) — editorial doctrine D1–D18 (cross-template polish rules)
- [`project/VISUAL_LANGUAGE.md`](../project/VISUAL_LANGUAGE.md) — when to use footage / MG / ILLUST / AI-GEN
- [`project/FOOTAGE_SOURCING.md`](../project/FOOTAGE_SOURCING.md) — stock footage selection
- [`skills/visual-spec/SKILL.md`](../skills/visual-spec/SKILL.md) — the skill that consumes this index
- [`skills/map-audit/SKILL.md`](../skills/map-audit/SKILL.md) — map-specific audit (the prototype for future per-family audits)

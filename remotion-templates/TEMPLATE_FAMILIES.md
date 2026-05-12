# Template Families — Wayfinding Index

> One page. Pin it. When a script beat needs a visual, find the family first, then the template.
>
> Last updated: May 11, 2026

The Remotion MG layer has **32 templates** organized into 5 families plus 3 non-template asset types. Each family has its own "when to use which template" logic. This page is the *index* — it tells you which family you're in and where the canonical decision logic lives. The detailed editorial guidance is in:

- **Per-family SELECTOR docs** (wall-tables) when they exist
- **`references/template-picker.md`** — long-form prose covering every family
- **`references/template-research/<template>.md`** — per-template dossier with canonical idioms, failure modes, Parallax defaults

---

## Family index

| Family | Count | Selector doc | Audit skill | Status |
|---|---|---|---|---|
| **Maps** | 6 | ✅ [`MAP_TEMPLATE_SELECTOR.md`](MAP_TEMPLATE_SELECTOR.md) | ✅ `map-audit` | **Complete** |
| **Charts** | 6 | ❌ (use `references/template-picker.md` § Data) | ❌ (use script-audit Lens 6) | Partial |
| **Diagrams** | 10 | ❌ (use `references/template-picker.md` § Comparisons + Frameworks) | ❌ | Orphaned |
| **Timelines** | 4 | ❌ (use `references/template-picker.md` § Timelines) | ❌ | Orphaned |
| **Typography / layout** | 6 | ❌ (use `references/template-picker.md` § Typography + Images) | ❌ | Orphaned |
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
| "Fork-in-the-road moment" | Diagrams | BifurcationRoute |
| "Single-axis chronology" | Timelines | HorizontalTimeline |
| "Two parallel chronologies" | Timelines | DualTimeline |
| "Then-and-now comparison" | Timelines | TimelineComparison |
| "Timeline transforming into another" | Timelines | TimelineMorph |
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

## Family detail — Charts (6 templates) 🟡

**Status:** partial. DataChart + TimeSeriesChart have runtime warnIf checks; others don't. No dedicated audit skill or selector wall-table.

**Where to look for selection logic:**
- [`references/template-picker.md`](references/template-picker.md) § "DATA & STATISTICS" (lines 218-300)
- Per-template dossiers — `data-chart.md`, `time-series-chart.md` exist with canonical idioms

**Common failure modes (not yet auto-flagged):**
- Bar chart with truncated y-axis (forbidden by Tufte)
- DataChart with 8+ items in vertical mode (use horizontal lollipop)
- TimeSeriesChart with no reference band on a forecast story
- StatReveal used as the catch-all instead of KineticTypography for non-numeric "key word" moments

---

## Family detail — Diagrams (10 templates) ❌

**Status:** orphaned. Largest family, most templates with overlapping purposes. No dedicated audit skill or selector wall-table.

**Where to look for selection logic:**
- [`references/template-picker.md`](references/template-picker.md) § "COMPARISONS" (lines 54-72), § "FRAMEWORKS" (lines 170-192)
- Per-template dossiers — `framework-diagram.md`, `game-theory.md`, `sankey-flow.md`, `network-diagram.md` exist

**The most common decision question:** "I need to show a structure / relationship / framework — which?"
- Static structure with named relationships → **FrameworkDiagram** (matrix or flow variant)
- Web of connections, hub-spoke topology → **NetworkDiagram**
- Branching choices with outcomes → **DecisionTree**
- Flow / allocation (where things go) → **SankeyFlow**
- 2×2 or position-on-axes strategic frame → **StrategicLandscape**
- Game-theory matrix / payoff structure → **GameBoard**
- Severity / escalation ladder → **EscalationLadder**
- Two opposing frameworks compared → **DuelingFrameworks**
- Single fork point → **BifurcationRoute**
- Value chain decomposition → **PricingWaterfall**

---

## Family detail — Timelines (4 templates) ❌

**Status:** orphaned. Common authoring failure: trying to fit too many events into a single column (TimelineComparison caps around 8 events per column; HorizontalTimeline around 10).

**Where to look:**
- [`references/template-picker.md`](references/template-picker.md) § "TIMELINES" (lines 144-157)
- `references/template-research/timeline-comparison.md`

**Selection cheat:**
- Single chronology → **HorizontalTimeline**
- Two parallel chronologies (e.g., Western vs. Eastern Cold War events) → **DualTimeline**
- "Then" vs. "now" structural comparison (2-3 events each, paired) → **TimelineComparison**
- Animated transformation (one timeline morphing into another) → **TimelineMorph**

---

## Family detail — Typography / layout (6 templates) ❌

**Status:** orphaned. Most common decision: KineticTypography vs. StatReveal for "the one number" moments — answer: StatReveal when the number IS the visual headline; KineticTypography when the text *around* the number is the headline.

**Where to look:**
- [`references/template-picker.md`](references/template-picker.md) § "TYPOGRAPHY" (lines 354-369), § "IMAGES" (lines 385-424)
- `references/template-research/title-card.md`

**Selection cheat:**
- Quote / definition / bilingual text → **KineticTypography**
- Section / chapter / end-card title → **TitleTransition**
- Two-pane comparison (image + text, image + image, text + text) → **SplitComposition**
- Single photo with overlay text → **ImageComposite**
- Multiple photos with phased reveal → **PhotoMontage**
- Photo with positioned callout labels → **AnnotatedImage**

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

## Future rollout

The Maps family was upgraded in May 2026 with a complete wayfinding stack (selector + audit + heuristics + dossiers). The pattern is proven and replicable for the other 4 Remotion families.

Documented rollout cost (per family, post-episode-1):
- ~2 hr — Build SELECTOR doc (restructure the existing `template-picker.md` prose into a wall-table)
- ~3 hr — Add runtime `warnIf` heuristics on 3-5 templates per family for the obvious data-shape mismatches
- ~5 hr — Build dedicated audit skill following the `map-audit` pattern

**Recommended sequencing** (most-orphaned first):
1. Diagrams (10 templates, biggest leverage)
2. Timelines (event-density warnings are highest-value)
3. Charts (DataChart heuristics already exist; finish the others + add chart-audit)
4. Typography (lowest priority — least overlap between templates)

Defer until after episode 1 ships and real failure modes surface in the post-publish retrospective.

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

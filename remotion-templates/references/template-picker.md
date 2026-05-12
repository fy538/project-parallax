# Template Decision Registry — A Quick-Lookup Guide for Parallax

> "I need to show X narrative moment — which template should I use?"
> This guide maps narrative needs to Remotion templates. Use the Quick Lookup table to find your match in 30 seconds, then expand to detailed sections for more context.

**Last updated:** May 2, 2026  
**Related files:** `template-schemas.md` (JSON field specs), `VISUAL_LANGUAGE.md` (when to use each visual mode), `SCRIPT_FORMAT.md` (script column syntax)

> **Wayfinding note (May 11, 2026):** This doc is now the long-form encyclopedia. For day-to-day template selection, start with the family **SELECTOR wall-tables** — they have decision trees, sibling-disambiguation tables, mandatory rules, and quick-fail checklists:
> - Maps → [`MAP_TEMPLATE_SELECTOR.md`](../MAP_TEMPLATE_SELECTOR.md)
> - Charts → [`CHART_TEMPLATE_SELECTOR.md`](../CHART_TEMPLATE_SELECTOR.md)
> - Diagrams → [`DIAGRAM_TEMPLATE_SELECTOR.md`](../DIAGRAM_TEMPLATE_SELECTOR.md)
> - Timelines → [`TIMELINE_TEMPLATE_SELECTOR.md`](../TIMELINE_TEMPLATE_SELECTOR.md)
> - Typography → [`TYPOGRAPHY_TEMPLATE_SELECTOR.md`](../TYPOGRAPHY_TEMPLATE_SELECTOR.md)
>
> Family-aware index: [`TEMPLATE_FAMILIES.md`](../TEMPLATE_FAMILIES.md). Read the relevant SELECTOR first; come here when you need the deeper prose, real-world examples, or multi-template sequence patterns.

---

## Quick Lookup Table

Use this table to find the right template in seconds. Scan the "I need to show..." column for your narrative moment, then see the recommended template.

| I need to show... | Primary Template | Variant | Also Consider | Mode |
|---|---|---|---|---|
| **Two opposing concepts side by side** | SplitComposition | default | FrameworkDiagram (comparison) | [MG:] |
| **3+ options scored on multiple dimensions** | RadarChart | default | DataChart (simpler) or FrameworkDiagram (matrix) | [MG:] |
| **Before/after or transformation** | TimelineComparison | dual-track | BayesianUpdate (probability shift) | [MG:] |
| **Rating or scoring multiple scenarios** | ProbabilityGauge | scorecard | DataChart (bar, simpler) | [MG:] |
| **Events in chronological order (single timeline)** | EscalationLadder | escalation | TimeSeriesChart (with data) | [MG:] |
| **Two parallel historical tracks** | TimelineComparison | dual-track | DualTimeline | [MG:] |
| **Increasing severity or crisis escalation** | EscalationLadder | escalation | TimeSeriesChart (numeric escalation) | [MG:] |
| **Causal chain: A→B→C** | FrameworkDiagram | flow | NetworkDiagram (if relational) | [MG:] |
| **If/then branches or decision scenarios** | DecisionTree | default | GameBoard (payoff-matrix, strategic) | [MG:] |
| **Single powerful statistic** | StatReveal | default | KineticTypography (simpler) | [MG:] |
| **Bar chart comparison (discrete values)** | DataChart | bar | DataChart (horizontal, for long labels) | [MG:] |
| **Trend line over time** | TimeSeriesChart | multi-series | DataChart (bar, for discrete points) | [MG:] |
| **Probability estimate or prediction market** | BayesianUpdate | single | ProbabilityGauge (gauge, simpler) | [MG:] |
| **Competing hypotheses with probability shifts** | BayesianUpdate | compare | ProbabilityGauge (gauge) | [MG:] |
| **Where resources or money flow** | SankeyFlow | default | FrameworkDiagram (flow, conceptual) | [MG:] |
| **Capabilities on multiple axes** | RadarChart | default | FrameworkDiagram (matrix, grid) | [MG:] |
| **Countries or regions highlighted on a map** | ChoroplethMap | phase-animation | RouteAnimation (if showing routes) | [MG:] |
| **Supply chain, trade route, or resource path** | RouteAnimation | phased-segments | NetworkDiagram (relational view) | [MG:] |
| **Regional zoom with detail callouts** | AnnotatedImage | map-callouts | ChoroplethMap (zoomed-phase) | [MG:] |
| **Diverging path or two futures** | BifurcationRoute | default | RouteAnimation (branching) | [MG:] |
| **Key quote or statement** | KineticTypography | quote | ImageComposite (portrait, if face needed) | [MG:] |
| **Foreign (especially Chinese) term** | KineticTypography | bilingual | KineticTypography (definition, more space) | [MG:] |
| **Big number without comparison** | KineticTypography | statistic | StatReveal (with comparison bars) | [MG:] |
| **New section or beat title** | TitleTransition | section | KineticTypography (if needs defining) | [MG:] |
| **Episode opening with title and number** | TitleTransition | episode-title | ImageComposite (if layering over imagery) | [MG:] |
| **Episode closing or CTA** | TitleTransition | end-card | KineticTypography (reflective statement) | [MG:] |
| **Network of relationships or alliances** | NetworkDiagram | default | FrameworkDiagram (flow, if linear) | [MG:] |
| **2×2 matrix or grid framework** | FrameworkDiagram | matrix | GameBoard (payoff-matrix, strategic) | [MG:] |
| **Process, workflow, or sequence** | FrameworkDiagram | flow | SankeyFlow (if there's allocation) | [MG:] |
| **Strategic game theory payoff matrix** | GameBoard | payoff-matrix | FrameworkDiagram (matrix, simpler) | [MG:] |
| **Chess or Go board as strategy metaphor** | GameBoard | chess or go | FrameworkDiagram (comparison) | [MG:] |
| **Image with detail labels and callouts** | AnnotatedImage | default | LayeredComposition (simpler) | [MG:] / [LAYERED:] |
| **Grid of photos with reveal animation** | PhotoMontage | default | ImageComposite (single image) | [MG:] / [FOOTAGE:] |
| **Brand-treated photo with text overlay** | ImageComposite | background, inset, or portrait | PhotoMontage (multiple images) | [FOOTAGE:] / [LAYERED:] |

---

## Detailed Sections by Category

### COMPARISONS: When You're Contrasting or Evaluating

> Decision tree + sibling-disambiguation for comparison templates lives in [`DIAGRAM_TEMPLATE_SELECTOR.md`](../DIAGRAM_TEMPLATE_SELECTOR.md) (SplitComposition vs. FrameworkDiagram comparison vs. DuelingFrameworks) and [`TYPOGRAPHY_TEMPLATE_SELECTOR.md`](../TYPOGRAPHY_TEMPLATE_SELECTOR.md) (SplitComposition register). Use the SELECTORs to pick; come here for the deeper editorial rationale.

#### Two Opposing Concepts (A vs B)

**Templates:** SplitComposition (primary) · FrameworkDiagram (comparison) · DataChart (comparison)

Use when: The narration presents two opposing viewpoints, strategies, systems, or entities side by side.

**SplitComposition** creates a stark visual division (vertical ∴ divider, left vs right). Each side gets a tag, title, key points, and color accent.

Example use cases:
- "Western lens: technology denial" vs "Chinese lens: technology blockade"
- "Chess strategy: capture the king" vs "Go strategy: territorial encirclement"
- "Short-term containment" vs "Long-term decoupling"

**FrameworkDiagram (comparison variant)** is softer — columnar layout, icons, multiple items per column. Better for attribute comparisons.

Example: Comparing features of two competing standards (EUV vs deep UV, COCOM vs modern controls).

**DataChart (comparison variant)** when the comparison is quantitative (value pairs like R&D spending: US $100B vs China $80B).

---

#### 3+ Options Scored on Multiple Dimensions

**Templates:** RadarChart (primary) · DataChart (bar, for single axis) · FrameworkDiagram (matrix, for qualitative)

Use when: You're comparing multiple entities on multiple axes (3+ dimensions).

**RadarChart** shows a polygon for each subject, with axes radiating from center. Visually powerful for showing "profiles" or "capability gaps."

Example: US vs China on Military, Economic, Technology axes.

Data structure: `axes` array (label, short name) + `subjects` array (name, values array, color). Optional `morphFrom` for animation.

**FrameworkDiagram (matrix variant)** for qualitative scoring (High/Medium/Low) — simpler, more readable than radar for 2×2 or 3×3 grids.

---

#### Before/After or State Transformation

**Templates:** TimelineComparison (dual-track, primary) · BayesianUpdate (shift variant, if probability) · StrategicLandscape (for actor positions)

Use when: Showing how something changed, evolved, or bifurcated.

**TimelineComparison** is the standard dual-track. Left column (era 1), right column (era 2), with connecting lines showing parallels.

Example: "1941 Pearl Harbor path to war" (left) ↔ "2018-2022 chip war escalation" (right), with connection annotations like "trigger event," "economic squeeze," "asymmetric response."

Data structure: leftLabel, rightLabel, leftEvents, rightEvents (each with year, title, icon), connections (leftIndex ↔ rightIndex).

---

#### Rating or Scoring Scenarios

**Templates:** ProbabilityGauge (scorecard variant) · DataChart (bar, simpler) · BayesianUpdate (compare, for hypotheses)

Use when: Showing predictions or probability estimates for different outcomes.

**ProbabilityGauge (scorecard)** shows a matrix of predictions (your estimate, market price, actual outcome) with ✓ or ✗ result. Ideal for "Was I Right?" retrospectives or Kalshi market data.

Example: "P(export controls succeed)" → Your estimate: 55% · Market: 42% · Actual outcome: Failed (controls weakened by SMIC 7nm).

---

### PROGRESSIONS: When Events or Stakes Are Rising, Flowing, or Branching

> Decision tree + sibling-disambiguation for progression templates lives in [`TIMELINE_TEMPLATE_SELECTOR.md`](../TIMELINE_TEMPLATE_SELECTOR.md) (TimelineComparison vs. HorizontalTimeline vs. DualTimeline vs. TimelineMorph) and [`DIAGRAM_TEMPLATE_SELECTOR.md`](../DIAGRAM_TEMPLATE_SELECTOR.md) (FrameworkDiagram flow vs. SankeyFlow vs. EscalationLadder vs. DecisionTree). Start with the SELECTOR for the structural question; this section deepens the prose.


#### Single Timeline: Events in Chronological Order

**Templates:** EscalationLadder (escalation variant) · TimeSeriesChart (if numeric) · NetworkDiagram (horizontal-chain, if causal)

Use when: Showing a sequence of events over time, ideally with increasing severity or intensity.

**EscalationLadder** is purpose-built for this. Each rung is an event with date, title, detail, and severity level (low→moderate→elevated→high→critical).

Example:
```
2019-05-15: Entity List additions (moderate) — Initial targeted restrictions
2022-10-07: October 7 controls (high) — Full-spectrum restrictions, current
2024-Q2: SMIC breakthrough (elevated) — Containment strategy at risk
```

The visual shows a literal ladder climbing upward, with the "current" rung pulsing. Severity colors (green→amber→rust→red) reinforce escalation.

**TimeSeriesChart** when the escalation is quantified (restrictions tightening from 5 → 50 → 250 companies controlled, or capex costs rising year-over-year).

---

#### Two Parallel Historical Tracks

**Templates:** TimelineComparison (dual-track) · DualTimeline

Use when: Showing structural parallels — "this happened before, therefore watch for it to happen again."

**TimelineComparison** with leftLabel/rightLabel showing two eras side by side. Connecting lines highlight when similar events occur.

Example: "Oil embargo 1941" ↔ "Chip controls 2022" with connections: embargo trigger, economic squeeze response, asymmetric escalation, negotiation stalemate.

The dual-track reinforces the Parallax thesis: same structural pattern, different actors.

---

#### Escalation or Crisis Intensifying

**Templates:** EscalationLadder (escalation direction) · TimeSeriesChart (numeric escalation) · NetworkDiagram (showing who's being squeezed)

Use when: The narration emphasizes rising stakes, severity, or pressure.

**EscalationLadder** is ideal. Direction: "escalation" (default, shows ladder climbing) vs "de-escalation" (descending ladder for resolution scenarios).

Each rung can show: Who's affected, what changed, market impact, etc.

---

#### Causal Chain: A Leads to B Leads to C

**Templates:** FrameworkDiagram (flow variant) · NetworkDiagram (horizontal-chain) · DecisionTree (if branches)

Use when: Narration is explaining sequential causation.

**FrameworkDiagram (flow)** shows nodes connected by arrows with optional arrow labels.

Example:
```
Design (US) → Fab selection → Manufacturing (Taiwan) → Packaging (SE Asia) → Distribution → Customer
```

Labels on arrows explain each transition: "IP license," "Quality control," "Export approval," etc.

**NetworkDiagram (horizontal-chain layout)** when causation is more complex or relational (nodes can have stats attached).

---

#### If/Then Scenarios or Decision Branching

**Templates:** DecisionTree (primary) · GameBoard (payoff-matrix, for game theory) · FrameworkDiagram (matrix, for scenario grid)

Use when: Narration explores "if X happens, then Y; but if Z happens, then W."

**DecisionTree** uses a flat node structure with parent-child relationships. Ideal for showing branching paths with probabilities.

Example:
```
Root: Current Policy
├─ Controls Succeed (35%, green)
└─ Controls Backfire (45%, red, highlighted)
```

The `highlightedPath` prop emphasizes the most likely or narratively important branch.

Data structure: `nodes` array (id, label, children array, probability, color) + `rootId` + `highlightedPath`.

**GameBoard (payoff-matrix)** when the branches involve strategic choices with outcomes (e.g., prisoner's dilemma).

```
US \ China    Cooperate    Self-develop
Restrict      -2, -1       -3, -2 (highlighted)
Engage        +1, +1       0, +2
```

---

### DATA & STATISTICS: When Numbers Tell the Story

> Decision tree + Cleveland-honesty rules + sibling-disambiguation for chart templates live in [`CHART_TEMPLATE_SELECTOR.md`](../CHART_TEMPLATE_SELECTOR.md) (DataChart vs. TimeSeriesChart, StatReveal vs. KineticTypography, BayesianUpdate vs. ProbabilityGauge). Start there for the encoding-honesty rules; this section has the longer-form examples.


#### Single Hero Statistic

**Templates:** StatReveal (primary) · KineticTypography (statistic variant) · DataChart (bar, for comparison)

Use when: One number is the climactic reveal — the viewer needs to feel its weight.

**StatReveal** combines the hero stat (large, animated with spring physics) + comparison bars showing context.

Example:
```
Hero: 92%
Comparison: Apollo Program (adjusted): 194B, Marshall Plan: 173B, Manhattan: 30B
Context: "The scale of investment" with stat label
```

The hero stat is centered, animated in last. Comparison bars reveal first, establishing context. The hero lands in the middle, dwarfing history.

Duration: typically 5-8 seconds (3s for comparisons to appear, 2s hold on hero).

**KineticTypography (statistic)** if you want a simpler reveal without the comparison bars — just the big number with a label, 3-4 seconds.

---

#### Bar Chart Comparison

**Templates:** DataChart (bar variant) · DataChart (horizontal variant) · SankeyFlow (if there's allocation)

Use when: Comparing discrete categories on a single metric.

**DataChart (bar)** — vertical bars, most common. Each bar represents a category (nation, company, product).

Example:
```
Title: "Chip Manufacturing by Nation"
Subtitle: "% of global advanced chip production"
Unit: "%"
Bars: Taiwan 92, South Korea 5, US 2, Japan 1
Highlight: Taiwan bar glows (accent color)
Reference line: Global average at 50%
```

The `highlightIndex` prop makes one bar glow (hero bar). Reference lines add context (global average, breakeven, etc.). `contextNote` appears below for narrative annotation.

**DataChart (horizontal)** when labels are long (company names, government agencies, Chinese region names). Bars extend rightward, labels on left, easier to read.

---

#### Time Series / Trend Line

**Templates:** TimeSeriesChart (primary) · DataChart (bar, for discrete years) · BayesianUpdate (for probability trajectories)

Use when: Showing change over time, revealing trajectory or trend.

**TimeSeriesChart** handles continuous data. Multi-line supported (TSMC vs Samsung vs Intel capex trends). Features:

- **Lines:** Multi-series with color, areaFill (fills under line), stagger animation
- **Annotations:** Vertical markers with labels ("October 7 controls")
- **Eras:** Shaded background bands for time periods
- **Reference lines:** Horizontal (breakeven, threshold)
- **Hero stat:** Large callout in corner (e.g., "TSMC 2025 capex: $36B")

Example:
```
Title: "Semiconductor Capex Over Time"
Lines: TSMC (red, area fill), Samsung (blue), Intel (amber)
Annotations: October 7 2022 control announcement
Eras: 2018-2022 "Escalation period" (red band)
Reference line: $25B "Breakeven threshold" (dashed)
Hero stat: "$36B TSMC 2025 capex"
```

Duration: 8-15 seconds (slow draw of lines, stagger annotations, hero stat appears late).

---

#### Probability Estimates or Prediction Markets

**Templates:** BayesianUpdate (single variant, primary) · ProbabilityGauge (gauge variant, simpler) · DecisionTree (if branching)

Use when: Narration discusses a prediction, market estimate, or hypothesis with a probability attached.

**BayesianUpdate (single)** shows the analytical process: prior belief → evidence (pro and con) → posterior. Includes market price as reference.

Example:
```
Title: "Will Export Controls Succeed?"
Prior: 55%
Question: "P(US export controls achieve lasting tech advantage)"
Evidence:
  - "COCOM precedent: 45 years vs USSR" (up +3%) [Cold War data]
  - "China's economy 6× more integrated" (down -4%)
Posterior curve shift shown
Market price: 42% (Kalshi, shown as amber reference line)
```

Animation: curve enters → evidence panels appear (staggered) → posterior curve shifts → market price line locks in.

**ProbabilityGauge (gauge variant)** is faster, more visual — speedometer-style (0-100%, arc colored by value). Use when space is tight or audience is less analytical.

---

#### Competing Hypotheses and Probability Shifts

**Templates:** BayesianUpdate (compare variant) · ProbabilityGauge (gauge, side by side) · DecisionTree (if there are branches)

Use when: Showing two or more competing scenarios with probabilities that shift based on evidence.

**BayesianUpdate (compare)** shows two hypothesis curves (both starting at prior) and evidence that shifts one up, the other down.

Example:
```
Hypothesis 1: Controls Succeed (prior 55%, blue)
Hypothesis 2: Controls Backfire (prior 45%, red)
Evidence: "SMIC 7nm breakthrough" (shifts down 3%, up 3%)
Result: Succeed 52%, Backfire 48%
```

This is ideal for "as the data came in, opinions shifted" narratives.

---

#### Flow and Allocation (Where Money or Resources Go)

**Templates:** SankeyFlow (primary) · FrameworkDiagram (flow, conceptual) · NetworkDiagram (hub-spoke)

Use when: Showing how a pool of resources splits and flows through stages.

**SankeyFlow** shows nodes (sources/destinations) and links (flows). Width of links represents value (money, volume, capacity).

Example:
```
Node: CHIPS Act $280B (source)
Links:
  → Fabrication $200B
  → R&D $50B
  → Equipment $30B
Node: Fabrication $200B → sub-flows to TSMC, Samsung, Intel (destinations)
```

Data structure: `nodes` (id, label, value, color, column) + `links` (from, to, value, label). Shows hierarchy: source → distribution → sub-allocation.

Use `valuePrefix: "$"` and `valueSuffix: "B"` to format large numbers. `showValues: true` labels flows.

---

#### Multi-Axis Capability Comparison

**Templates:** RadarChart (primary) · FrameworkDiagram (matrix, for qualitative)

Use when: Comparing entities on 3+ dimensions simultaneously (military, economic, tech capabilities; strength, speed, resilience, etc.).

**RadarChart** shows spider-web polygons for each subject. Perfect for showing overall "profile" or capability gaps.

Example:
```
Axes: Military, Economic, Technological (radial from center)
Subject 1: US [95, 85, 92] (blue, slightly transparent fill)
Subject 2: China [70, 78, 75] (red, slightly transparent fill)
Grid levels: 25, 50, 75, 100 (concentric circles)
Optional morphFrom: prior state [US: 90, 90, 80] → animates to current
```

At a glance, viewers see: US leads in military/tech, China in economic; US has larger polygon.

---

### GEOGRAPHIC: When Location and Routes Matter

> Decision tree + register guidance (atmospheric vs. flat-editorial vs. vintage) for the 6 map templates lives in [`MAP_TEMPLATE_SELECTOR.md`](../MAP_TEMPLATE_SELECTOR.md). Start there for the data-shape → template mapping; this section has the longer-form prose on each map's editorial use cases.


#### Highlighting Countries or Regions on a Map

**Templates:** ChoroplethMap (phase-animation, primary) · RouteAnimation (if showing routes too) · AnnotatedImage (zoom detail)

Use when: Narration names specific countries or regions that should be visually identified on a world map.

**ChoroplethMap** fills country shapes with colors representing categories or values. Supports multi-phase animation (phase 1: show US, phase 2: add allies, phase 3: show blockade).

Example:
```
Phase 1: US (blue) highlighted
  Subtitle: "United States"
  Duration: 4 seconds
  Camera: centered on North America, zoom 150

Phase 2: US + allies (blue) + China + allies (red) + contested (amber)
  Duration: 5 seconds
  Camera: global view, zoom 100

Phase 3: Export control routes (amber lines overlaid)
  Duration: 6 seconds
  Camera: zoom on key choke points
```

Data structure: `phases` array, each with `countries` (name, iso3, fill or value), optional camera (center, scale), duration.

The color ramp (blue/red/amber) is semantic: US blue, China red, contested/neutral amber.

---

#### Supply Chain, Trade Route, or Resource Flow on Map

**Templates:** RouteAnimation (phased-segments, primary) · NetworkDiagram (if relational) · SankeyFlow (if allocation)

Use when: Tracing a supply chain path, shipping route, or flow of resources from origin to destination.

**RouteAnimation** shows `points` (coordinates) connected by `segments` (labeled flows).

Example:
```
Title: "Semiconductor Supply Chain"
Points:
  - TSMC, Hsinchu [120.99, 24.78]
  - ASML, Netherlands [5.46, 51.44]
  - US customer [−95, 40]
Segments:
  - TSMC → ASML: "EUV machines" (amber, 2s animation)
  - ASML → US: "Assembled chips" (blue, 2s animation)

Phases:
  Phase 1: Show TSMC + ASML points, duration 3s
  Phase 2: Animate segment TSMC → ASML, duration 4s, activeSegments: [0]
  Phase 3: Animate segment ASML → US, duration 4s, activeSegments: [1]
```

Segments animate as flowing arcs. Points have labels and sublabels (city names). Camera can pan/zoom during animation to focus on key regions.

Duration: typically 2s per segment for dramatic effect, 1s for rapid-fire routes.

---

#### Regional Zoom with Detail Annotations

**Templates:** AnnotatedImage (map-callouts variant) · ChoroplethMap (zoomed phase) · RouteAnimation (if showing paths in region)

Use when: Zooming into a region and calling out specific cities, facilities, or landmark locations.

**AnnotatedImage** takes a satellite/map image and overlays animated callouts pointing to specific coordinates.

Example:
```
Image: Taiwan satellite photo
Callouts:
  - [Hsinchu coords]: "TSMC HQ & Fab 12" (left placement)
  - [Tainan coords]: "Fab 18" (right placement)
  - [Kaohsiung coords]: "Advanced packaging hub" (left placement)
Detail: TSMC Fab 18 produces 92% of world's 5nm and below chips
```

Data structure: `imageSrc` (path to satellite image), `callouts` array (x%, y%, label, detail, placement, color).

Duration: 8-12 seconds (callouts stagger in, each holds 2s, final detail holds 3s).

---

#### Diverging Paths or Bifurcation (Two Possible Futures)

**Templates:** BifurcationRoute (primary) · RouteAnimation (branching variant) · DecisionTree (if adding decision context)

Use when: Showing a path that splits, representing two possible futures or outcomes.

**BifurcationRoute** is a geographic visualization showing an initial route that divides into two branches, each leading to a different destination.

Example:
```
Starting point: Current state of China's chip self-sufficiency
Path 1 (right): Success path — reaches advanced node parity by 2030
Path 2 (left): Stalled path — plateaus at 28nm due to persistent controls

The fork can be labeled: "If COCOM enforcement holds (65%)" vs "If workarounds emerge (35%)"
```

This is ideal for scenario visualization — not just "what if" in text, but shown as actual diverging routes.

---

### TYPOGRAPHY & EMPHASIS: When Words Matter Most

> Decision tree + register-confusion guidance (KineticTypography vs. TitleTransition is the canonical mistake) + POLISH D-rule grounded mandatory rules live in [`TYPOGRAPHY_TEMPLATE_SELECTOR.md`](../TYPOGRAPHY_TEMPLATE_SELECTOR.md). Start there for the editorial register decision; this section deepens the rationale.


#### Key Quote or Attribution

**Templates:** KineticTypography (quote variant, primary) · ImageComposite (portrait, if adding speaker face) · LayeredComposition (quote over footage)

Use when: A named person's statement is pivotal and deserves full-screen attention.

**KineticTypography (quote)** displays text large and animated, with speaker attribution and context.

Example:
```
Text: "We are in a chip war."
Attribution: Morris Chang
Context: Founder of TSMC, 2024
Accent color: amber (emphasis)
Animation: Text enters line-by-line, attribution staggered, then hold 3s
```

Duration: 4-6 seconds (1s text animation, 2s hold, 1s exit).

Use `accentColor` to tie the quote to thematic colors (amber for key insight, rust for conflict-oriented quotes).

---

#### Foreign or Bilingual Term (Especially Chinese)

**Templates:** KineticTypography (bilingual or definition variant, primary) · FrameworkDiagram (for context) · ImageComposite (for cultural imagery)

Use when: Introducing a term viewers won't know, especially Chinese concepts central to the episode.

**KineticTypography (bilingual)** shows the term in Chinese and English side-by-side with pronunciation aid.

Example:
```
Chinese: 卡脖子
Pinyin: kǎ bózi
English: Stranglehold
Definition: "Technologies where a foreign power has you by the throat"
Accent: amber (term color)
```

Animation: Chinese enters left, English enters right, they stagger reveal, definition appears last (3-5s total).

This is the moment viewers learn the vocabulary — make it count. The term should feel important, remembered.

**KineticTypography (definition)** is slightly longer form, used when you need more space for context:

```
Term: 举国体制
Definition: "The mobilization of an entire nation's resources toward a single strategic goal, common in China's approach to technology competition"
```

---

#### Big Number Callout (Without Comparison)

**Templates:** KineticTypography (statistic variant) · StatReveal (if comparison needed) · LayeredComposition (if over footage)

Use when: A single statistic is impressive on its own and doesn't need context bars.

**KineticTypography (statistic)** shows the number large and bold with a label.

Example:
```
Value: "7%"
Label: "of US chip demand met domestically"
Context: "Despite $165B in announced investment"
Duration: 4 seconds (number animates in spring physics, holds 2s, label staggered)
```

This is more punchy than StatReveal — better for quick reveals that don't need comparison.

---

#### Section or Beat Title

**Templates:** TitleTransition (section variant) · KineticTypography (definition or quote, if title is conceptual)

Use when: Opening a new major section of the episode.

**TitleTransition (section)** shows a section number (roman numeral) and title in a branded frame.

Example:
```
Section Number: "II"
Section Title: "THE STRANGLEHOLD"
Duration: 2-3 seconds
```

Appears as a clean graphic, full-screen. Often followed by a transition (fade, dissolve) to the next beat's opening footage.

---

#### Episode Title Card

**Templates:** TitleTransition (episode-title variant, primary) · ImageComposite (if layering over thematic image)

Use when: Opening the episode with the title, episode number, and subtitle.

**TitleTransition (episode-title)** is the cold open — full-screen, branded with the channel mark (∴ PARALLAX).

Example:
```
Episode label: "EPISODE 01"
Series name: "Parallax"
Title: "The Silicon Trap"
Subtitle: "When America Tried to Strangle China's AI"
Duration: 4-5 seconds (words enter staggered, hold for impact, transition to next beat)
```

This is the viewer's first impression — make it count. Use accent colors (amber on dark) to emphasize the title.

---

#### End Card / Call-to-Action

**Templates:** TitleTransition (end-card variant) · KineticTypography (for reflective closing statement)

Use when: Closing the episode, prompting subscription or teasing next episode.

**TitleTransition (end-card)** shows CTA text ("Subscribe for more") and optional teaser ("Next: The Rare Earth Gambit").

Example:
```
CTA: "Subscribe for more"
Next episode teaser: "The Rare Earth Gambit"
Duration: 3-4 seconds (CTA enters, teaser staggered, hold)
```

This is the last thing viewers see — a moment to prompt action. Subtle but clear.

---

### STRUCTURAL: When Relationships, Matrices, or Processes Define the Idea

> Decision tree + sibling-disambiguation for structural templates lives in [`DIAGRAM_TEMPLATE_SELECTOR.md`](../DIAGRAM_TEMPLATE_SELECTOR.md) (FrameworkDiagram variants, NetworkDiagram vs. SankeyFlow, DecisionTree vs. GameBoard, matrix vs. StrategicLandscape). The largest family — start with the SELECTOR's disambiguation tables, then come here for the prose.


#### Network of Relationships, Alliances, Dependencies

**Templates:** NetworkDiagram (default, primary) · FrameworkDiagram (flow, if more linear) · RouteAnimation (if geographic)

Use when: Showing a web of actors, relationships, or dependencies — not a simple chain but a complex ecosystem.

**NetworkDiagram** shows nodes (actors: US, China, TSMC, ASML, etc.) connected by edges (relationships: export controls, partnerships, dependency, etc.).

Features:
- **Layouts:** hub-spoke (one center, spokes radiating), horizontal-chain (left-to-right flow), grid, vertical-chain
- **Node types:** nation (rect), institution (rounded), actor (circle), concept (diamond) — different shapes encode meaning
- **Edge styles:** solid (active), dashed (potential), blocked (restricted)
- **Controls:** overlay label on edges showing restriction type (e.g., "FDPR," "export control")
- **Stats:** nodes can show "100% EUV monopoly" as attachment
- **Callouts:** free-floating annotations like "Cost of full self-sufficiency: $1T"

Example:
```
Nodes:
  - US (rect, nation, blue) — US policy maker
  - TSMC (circle, actor, red) — at center
  - ASML (rounded, institution, amber) — EUV monopoly
Edges:
  - US → ASML (solid, red): "Export controls"
  - ASML → TSMC (blocked, red): "COCOM restriction"
  - TSMC → US (dashed, amber): "Market dependency"
Layout: hub-spoke (TSMC at center)
```

Duration: 8-12 seconds (nodes appear, edges draw, labels stagger, callouts appear last).

---

#### 2×2 Matrix or Grid Framework

**Templates:** FrameworkDiagram (matrix variant) · GameBoard (payoff-matrix, if strategic) · DataChart (bar, if quantitative)

Use when: Organizing information into a grid by two or more dimensions.

**FrameworkDiagram (matrix)** shows a labeled grid with cells containing text, icons, or highlights.

Example:
```
Rows: Short-term | Long-term
Columns: Success | Failure

Cell [0,0] Short-term Success: "Tech advantage holds" (green highlight)
Cell [1,1] Long-term Failure: "Self-sufficiency fails" (red highlight)
```

This is ideal for organizing strategic options, time horizons, or outcome categories.

---

#### Process, Workflow, or Sequence Steps

**Templates:** FrameworkDiagram (flow variant) · SankeyFlow (if there's allocation) · NetworkDiagram (horizontal-chain)

Use when: Showing a step-by-step process: A → B → C → D.

**FrameworkDiagram (flow)** shows nodes (steps) with connecting arrows and optional arrow labels.

Example:
```
Design (US, blue) 
  → [arrow: IP license]
Fab selection (collaborative)
  → [arrow: capacity agreement]
Manufacturing (Taiwan, red)
  → [arrow: QC approval]
Packaging (SE Asia, amber)
```

Nodes can have sublabels (location, responsible actor). Arrows have labels explaining the transition.

This is the narrative structure made visual — viewers follow the path as the narration describes it.

---

#### Strategic Game Theory: Payoff Matrices

**Templates:** GameBoard (payoff-matrix variant) · FrameworkDiagram (matrix, simpler) · DecisionTree (if branches)

Use when: Narration discusses game theory, prisoner's dilemma, Nash equilibrium, or strategic decisions with payoffs.

**GameBoard (payoff-matrix)** displays a strategic game in matrix form: rows are one player's options, columns are the other's, cells show outcomes.

Example:
```
Players: US | China
US options: Restrict | Engage
China options: Self-develop | Cooperate

Payoff cells:
  [Restrict, Self-develop]: -3, -2 (both lose, highlighted as Nash equilibrium)
  [Restrict, Cooperate]: -1, 0
  [Engage, Self-develop]: 0, 2
  [Engage, Cooperate]: 1, 1 (both gain)
```

Highlight the Nash equilibrium or most likely outcome in red (conflict) or green (cooperation).

Duration: 4-6 seconds (grid appears, payoffs stagger in, highlight appears last).

---

#### Chess or Go Board as Strategic Metaphor

**Templates:** GameBoard (chess or go variant) · FrameworkDiagram (comparison, for chess vs go contrast)

Use when: Using chess or go as an explicit metaphor for strategic thinking.

**GameBoard (chess)** shows an 8×8 board with pieces. Supports phases (opening, mid-game, endgame) with pieces moving into position.

Example:
```
Title: "The Chip War Board"
Initial: Empty board
Phase 1 "Opening move": TSMC piece at d4
Phase 2 "Alliance forms": add ASML, Samsung pieces
Phase 3 "Endgame": show final positions with territory control
```

**GameBoard (go)** shows a 9×9 or 19×19 board with stones. Ideal for showing territorial encirclement or territory-control strategies.

Example:
```
US (black stones) creating encirclement around China (white stones)
Phases showing stone placements that tighten the noose
```

This metaphor is powerful — viewers understand chess/go enough to grasp the strategic analogy.

---

#### Image with Detail Labels and Callouts

**Templates:** AnnotatedImage (default, primary) · LayeredComposition (simpler, one or two labels) · PhotoMontage (multiple images)

Use when: A specific image (technical diagram, facility photo, equipment) needs labeled parts and explanations.

**AnnotatedImage** overlays animated callout labels on an image, pointing to coordinates with detail text.

Example (ASML EUV machine cross-section):
```
Image: euv-machine.jpg
Callouts:
  - [30%, 35%]: "Tin Droplet Generator" → detail "50,000 droplets/second" (left placement)
  - [50%, 50%]: "CO₂ Laser" → detail "20kW" (right placement, amber color)
  - [60%, 70%]: "Mirror Array" → detail "Cryogenically cooled, 11 layers" (right placement)
Duotone ramp: "standard" (amber/bronze treatment)
```

Animation: image appears with vignette → callouts stagger in (0.3s each) → detail text follows each → hold 8s → fade.

This is ideal for technical or architectural subjects where viewers need to understand components.

---

#### Photo Grid with Reveal Animation

**Templates:** PhotoMontage (default, primary) · ImageComposite (single image) · LayeredComposition (if overlaying data)

Use when: Showing multiple related images (era collage, facility montage, key figures) that reveal one after another.

**PhotoMontage** displays images in sequence with transition animations (dissolve, wipe, cut).

Example:
```
Transition: dissolve, 0.3s per image
Images:
  - TSMC fab construction (3s dwell)
  - Interior fab floor (3s dwell)
  - Morris Chang portrait (2s dwell, overlay: "Founder 1987")
  - Modern fab technology (3s dwell)
Treatment: "standard" (duotone amber/bronze)
```

The fast reveal (montage style) conveys scope and timeline. Overlays (dates, names) add narrative context.

Duration: 12-15 seconds total (0.3s transition + 3s dwell + 0.3s transition...).

---

#### Brand-Treated Photo with Text Overlay

**Templates:** ImageComposite (background, inset, or portrait variant) · PhotoMontage (if multiple) · LayeredComposition (if adding data)

Use when: A single photograph is the hero visual, with text overlaid.

**ImageComposite (background)** places an image full-bleed behind text, with the image treated (desaturated, duotone, grained, vignetted).

Example:
```
Variant: background
Image: Morris Chang portrait
Title: "Morris Chang"
Subtitle: "The Man Who Built TSMC"
TextPosition: bottom-left
Duotone: "standard"
```

The image (40% opacity) is texture; text (100% opacity, ink color) is primary. The face is visible but not dominant.

**ImageComposite (portrait)** shows a more prominent image (60-80% opacity), typically a headshot with name/title below.

Example:
```
Variant: portrait
Image: Morris Chang headshot
PersonName: "Morris Chang"
PersonTitle: "Founder of TSMC"
```

Use for introducing key figures or pivotal moments where the person's presence matters.

---

## Combinations: Multi-Template Sequences

When a single template can't convey the full narrative moment, combine two templates in sequence. The transition between them (dissolve, fade, wipe) bridges the intellectual shift.

### Reveal Then Explain

**Sequence:** StatReveal → FrameworkDiagram

Use when: A number lands, then the narration immediately unpacks what it means.

Example:
```
StatReveal (5s): 92% YIELD at TSMC Arizona
  [comparison bars: Apollo, Marshall, Manhattan programs]
  [hold 2s on hero stat]

Dissolve transition (1s)

FrameworkDiagram (8s): Why this concentration happened
  [columns: economies of scale, fab cost, fab size]
  [shows structural incentives for concentration]
```

---

### Show Then Zoom

**Sequence:** ChoroplethMap (global) → AnnotatedImage (regional detail)

Use when: Establishing global context, then drilling into specific location.

Example:
```
ChoroplethMap (6s): Global semiconductor supply network
  [US blue, China red, allies amber]
  [camera pans to Taiwan region]

Wipe transition (1s)

AnnotatedImage (8s): Taiwan detail
  [satellite image with Hsinchu, Tainan, Kaohsiung callouts]
  [fab details: Fab 12, Fab 18, advanced packaging]
```

---

### Claim Then Evidence

**Sequence:** KineticTypography → DataChart or TimeSeriesChart

Use when: Making an assertion, then backing it up with data.

Example:
```
KineticTypography (4s): "Taiwan is the world's bottleneck."
  [text large, bold, accent color amber]
  [hold 2s for impact]

Dissolve transition (1s)

DataChart (8s): Chip production concentration
  [Taiwan 92%, South Korea 5%, US 2%]
  [highlight Taiwan bar with glow]
```

---

### Timeline with Era Images

**Sequence:** EscalationLadder → PhotoMontage

Use when: Showing escalation over time, with period imagery attached.

Example:
```
EscalationLadder (10s): Sanctions escalation timeline
  [2019 Entity List additions, 2022 October controls, 2024 SMIC breakthrough]

As each rung highlights, PhotoMontage appears beside it:
  [2019 image of Entity List announcement]
  [2022 image of TSMC fab]
  [2024 image of SMIC facility]
```

---

### Network Then Detailed Route

**Sequence:** NetworkDiagram → RouteAnimation

Use when: Showing ecosystem, then following one specific path.

Example:
```
NetworkDiagram (8s): Semiconductor ecosystem
  [nodes: US policy, TSMC, ASML, Samsung, China]
  [edges showing all relationships]
  [hub-spoke layout]

Zoom transition (1s)

RouteAnimation (8s): TSMC's specific supply chain
  [points: TSMC Taiwan → ASML Netherlands → US customer]
  [segments animate the route]
  [camera follows the path]
```

---

### Prediction Then Update

**Sequence:** ProbabilityGauge (initial) → BayesianUpdate

Use when: Showing an initial estimate, then new evidence shifts it.

Example:
```
ProbabilityGauge (4s): Prior estimate
  [gauge showing 55% for "export controls succeed"]
  [market price 42%]

Dissolve transition (1s)

BayesianUpdate (8s): Evidence reveals and shifts
  [prior 55% shown]
  [evidence 1: COCOM precedent +3%]
  [evidence 2: China integration -4%]
  [posterior 54% shown]
```

---

## Template Capability Matrix

This matrix shows which templates excel at which narrative tasks. Use it as a reference when multiple templates could work — pick the one with the strongest checkmark.

| Capability | ChoroplethMap | RouteAnimation | TimelineComparison | DataChart | KineticTypography | FrameworkDiagram | TitleTransition | DecisionTree | SplitComposition | ProbabilityGauge | NetworkDiagram | TimeSeriesChart | SankeyFlow | GameBoard | BayesianUpdate | StatReveal | RadarChart | AnnotatedImage | EscalationLadder | BifurcationRoute | PhotoMontage | ImageComposite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Compare two things** | ✓ | ✓ | ✓✓ | ✓✓ | ✓ | ✓✓ | | | ✓✓ | ✓ | ✓ | | | | ✓ | | ✓ | | | | | ✓ |
| **Show geographic location** | ✓✓ | ✓✓ | ✓ | | | | | | | | ✓ | | | | | | | ✓ | | ✓ | | |
| **Show trend over time** | | | ✓ | ✓ | | | | | | | | ✓✓ | | | ✓ | | | | ✓ | | | |
| **Explain process/sequence** | | ✓ | | | | ✓✓ | | ✓ | | | ✓ | | ✓ | | | | | | | | | |
| **Show data with emotion** | | | | ✓ | ✓✓ | | | | | | | ✓ | | | | ✓ | | ✓ | | | ✓ | ✓ |
| **Show strategic choice** | | | | | | ✓ | | ✓✓ | | | | | | ✓✓ | | | | | | | | |
| **Show probability/uncertainty** | | | | ✓ | | | | ✓ | | ✓✓ | | | | | ✓✓ | | | | | | | |
| **Highlight key detail** | | | | | ✓✓ | | | | | | | | | | | | | ✓✓ | | | | ✓ |
| **Create emotional landing** | | | | | ✓ | | | | | | | | | | | | | | | | ✓ | ✓ |
| **Show multiple dimensions** | | | | | | | | | | | | | | | | | ✓✓ | | | | | |

Key: ✓✓ = Excellent fit | ✓ = Good option | blank = Not recommended

---

## Quick Decision Flowchart

When faced with a narrative moment and unsure which template to use, follow this flowchart:

```
Is the moment primarily about DATA or NUMBERS?
  ├─ YES → Is it a single hero stat?
  │         ├─ YES → StatReveal or KineticTypography (statistic)
  │         └─ NO → Is it comparing multiple values?
  │                   ├─ YES (bars/categories) → DataChart
  │                   ├─ YES (over time) → TimeSeriesChart
  │                   ├─ YES (multiple dimensions) → RadarChart
  │                   └─ YES (flow/allocation) → SankeyFlow
  │
  ├─ NO → Is it about GEOGRAPHY or LOCATION?
  │       ├─ YES → Is it highlighting countries/regions?
  │               ├─ YES → ChoroplethMap
  │               └─ NO → Is it showing a route/path?
  │                       ├─ YES → RouteAnimation
  │                       └─ NO → AnnotatedImage (zoom detail)
  │
  ├─ NO → Is it about COMPARISON or CONTRAST?
  │       ├─ YES → Two sides exactly? → SplitComposition
  │       ├─ NO → Multiple options? → RadarChart or FrameworkDiagram (matrix)
  │       └─ NO → Historical parallel? → TimelineComparison
  │
  ├─ NO → Is it about STRUCTURE, PROCESS, or RELATIONSHIPS?
  │       ├─ Linear sequence? → FrameworkDiagram (flow) or SankeyFlow
  │       ├─ Complex web? → NetworkDiagram
  │       ├─ Strategic choice? → GameBoard or DecisionTree
  │       └─ Step-by-step? → FrameworkDiagram (flow)
  │
  └─ NO → Is it primarily TEXT/TYPOGRAPHY?
          ├─ Quote? → KineticTypography (quote)
          ├─ Foreign term? → KineticTypography (bilingual)
          ├─ Big number? → KineticTypography (statistic)
          ├─ Section break? → TitleTransition (section)
          └─ Episode open/close? → TitleTransition (episode-title or end-card)
```

---

## Field Reference for Common Template Variants

When writing visual specs, these are the most commonly used template + variant combinations:

**DataChart variants:**
- `bar` — vertical bars, single axis comparison
- `comparison` — side-by-side pairs, US vs China
- `horizontal` — horizontal bars, long labels

**KineticTypography variants:**
- `quote` — attributed statement
- `bilingual` — Chinese term with English translation
- `definition` — longer form concept definition
- `statistic` — big number with label

**TitleTransition variants:**
- `episode-title` — opening title card with episode number
- `section` — section break within episode
- `end-card` — closing card with CTA

**FrameworkDiagram variants:**
- `comparison` — two columns of attributes
- `flow` — nodes connected by arrows, process steps
- `matrix` — 2×2 grid with labels and highlights

**GameBoard variants:**
- `chess` — chess board with pieces, tactical strategy
- `go` — go board with stones, territorial strategy
- `payoff-matrix` — strategic game payoff table

**BayesianUpdate variants:**
- `single` — one hypothesis with prior/evidence/posterior
- `compare` — two competing hypotheses, probability shift

**ProbabilityGauge variants:**
- `gauge` — speedometer-style probability meter
- `shift` — before/after probability with evidence
- `scorecard` — predictions vs outcomes (Kalshi-style)

**ChoroplethMap:**
- Multi-phase animation, each phase highlights different countries/regions

**ImageComposite variants:**
- `background` — image full-bleed behind text
- `inset` — image in a bordered frame
- `portrait` — prominent headshot with title

**EscalationLadder variants:**
- `escalation` — climbing ladder, severity increasing
- `de-escalation` — descending ladder, crisis abating

---

## Dark vs Light Mode Notes

Most templates work in both dark (primary in-video) and light (secondary title cards) modes. When specifying a template, note the expected mode in your visual spec:

```
TEMPLATE: ChoroplethMap
BACKGROUND_VARIANT: dark  # candlelit war room, warm umber tones
```

or

```
TEMPLATE: TitleTransition (episode-title)
BACKGROUND_VARIANT: light  # briefing folder, paper tones
```

See BRAND.md for palette details. Default is `dark` for in-video content, `light` for title cards and social graphics.

---

## Related Resources

**SELECTOR wall-tables** (the day-to-day operating docs):
- **[MAP_TEMPLATE_SELECTOR.md](../MAP_TEMPLATE_SELECTOR.md)** — 6 map templates, register guidance
- **[CHART_TEMPLATE_SELECTOR.md](../CHART_TEMPLATE_SELECTOR.md)** — 6 chart templates, Cleveland-honest encoding rules
- **[DIAGRAM_TEMPLATE_SELECTOR.md](../DIAGRAM_TEMPLATE_SELECTOR.md)** — 10 diagram templates, sibling-disambiguation
- **[TIMELINE_TEMPLATE_SELECTOR.md](../TIMELINE_TEMPLATE_SELECTOR.md)** — 4 timeline templates, bounded-analogy doctrine
- **[TYPOGRAPHY_TEMPLATE_SELECTOR.md](../TYPOGRAPHY_TEMPLATE_SELECTOR.md)** — 6 typography/image templates, register rules
- **[TEMPLATE_FAMILIES.md](../TEMPLATE_FAMILIES.md)** — Family-aware index across all five families

**Audit skills** (catch mistakes before render):
- `skills/map-audit`, `chart-audit`, `diagram-audit`, `timeline-audit`, `typography-audit` — each runs after script-draft, before visual-spec

**Other**:
- **template-schemas.md** — Field specifications for every template's JSON data format
- **VISUAL_LANGUAGE.md** — Editorial guidance on when to use footage vs MG vs layered vs AI-GEN
- **SCRIPT_FORMAT.md** — How to write visual specs in the script's right column
- **BRAND.md** — Design system, colors, typography, layout rules
- **template-research/** — Per-template dossiers (canonical idioms, failure modes, defaults)
- **remotion-templates/src/templates/** — Source code for all template components

---

## Questions? Check the Index

Scroll the Quick Lookup table or use Ctrl+F to search:
- Your narrative moment (what you're trying to show)
- A template name (what template does what)
- A capability (what template excels at this)

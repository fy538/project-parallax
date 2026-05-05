# Template Schemas Reference

> Canonical field definitions for every Remotion template's JSON data file.
> Visual-spec reads this before generating any JSON. Last updated: May 4, 2026.

## Universal conventions (apply to every cartesian chart)

These behaviors now apply automatically — you don't need to opt in:

- **Y-axis domain inference**: charts using `niceTicks` (TimeSeriesChart, DataChart bar variant) automatically clamp y-axis at 0 for non-negative data, snap min/max to round numbers (1k, 2k, 5k…), and generate ticks at integer multiples of nice spacing. Don't pass `yRange` unless you specifically need to override.
- **Auto-categorical colors**: SankeyFlow nodes, StatReveal bars, DecisionTree nodes, StrategicLandscape actors auto-assign distinct colors when `color` is omitted on individual items. Sequence: muted blue → rust → gold → umber → walnut → taupe (wraps).
- **Source attribution**: every chart that has a `source` field renders it consistently bottom-right via the shared `<SourceAttribution>` component. No need to hand-position.
- **Title overflow**: `<TitleBlock>` auto-shrinks long titles down to h3 size before they overflow. You can still split into title + subtitle for very long headings.
- **Dev warnings**: when a chart's data is suspect (title > 80 chars, empty series, missing source), Studio will emit a one-time `console.warn` per template per session. Watch the DevTools console.

## Common Fields

Every template data object includes these fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `episode` | string | yes | Episode ID, e.g. `"silicon-trap"` |
| `title` | string | yes | Composition title shown on screen |
| `subtitle` | string | no | Secondary text below title |
| `durationSec` | number | no | Total duration in seconds (default varies by template) |
| `backgroundVariant` | `"dark"` \| `"light"` | no | Theme mode. Default: `"light"` (primary). Use `"dark"` for dramatic moments only. |
| `backgroundTint` | string | no | Hex color for subtle emotional temperature tint |
| `source` | string | no | Source attribution shown at bottom-right |

### Color Reference

Use these values for any `color` field:

**Palette tokens:** `#1C1814` (ink), `#2A2520` (midnight), `#E5A544` (amber), `#C23B22` (rust), `#F0E6D0` (bone), `#F5F0E8` (paper), `#6B1D1D` (oxblood), `#4A5A24` (olive), `#8B5E2B` (bronze)

**Semantic tokens:** `#3266AD` (US/blue), `#C23B22` (China/red), `#888780` (neutral), `#F5A623` (highlight), `#5DAA68` (success), `#D64545` (danger)

**Ramps (5-stop, light→dark):**
- Blue: `#E6F1FB`, `#85B7EB`, `#378ADD`, `#185FA5`, `#042C53`
- Red: `#FCEBEB`, `#F09595`, `#E24B4A`, `#A32D2D`, `#501313`
- Amber: `#FFF3D6`, `#F5D78E`, `#E5A544`, `#B07A28`, `#5C3F12`
- Gray: `#F1EFE8`, `#B4B2A9`, `#888780`, `#5F5E5A`, `#2C2C2A`

---

## ChoroplethMap

Country highlighting, alliances, trade blocs. Multi-phase animation with map camera control.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Export Control Coalition",
  "projection": "geoMercator",        // or "geoNaturalEarth1", "geoEqualEarth"
  "center": [20, 25],                 // [longitude, latitude] — default map center
  "scale": 150,                       // zoom level
  "colorRamp": "blue",                // "blue"|"red"|"teal"|"gray" or custom hex array
  "phases": [
    {
      "title": "Phase 1: Initial Controls",
      "subtitle": "October 2022",
      "durationSec": 4,
      "countries": [
        { "name": "United States", "iso3": "USA", "fill": "#3266AD", "label": "US" },
        { "name": "China", "iso3": "CHN", "fill": "#C23B22" }
      ],
      "center": [100, 35],           // optional per-phase camera
      "scale": 300
    }
  ]
}
```

**Key fields:**
- `countries[].name` — must match TopoJSON feature name
- `countries[].iso3` — ISO 3166-1 alpha-3 code
- `countries[].value` — numeric for color-ramp scaling (alternative to `fill`)
- `countries[].fill` — direct hex color override

---

## RouteAnimation

Supply chains, trade routes, resource flows. Phased segment reveal with map camera.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Semiconductor Supply Chain",
  "points": [
    { "name": "TSMC", "coordinates": [120.99, 24.78], "label": "Hsinchu" },
    { "name": "ASML", "coordinates": [5.46, 51.44], "sublabel": "Netherlands" }
  ],
  "segments": [
    { "from": 0, "to": 1, "label": "EUV machines", "color": "#E5A544" }
  ],
  "phases": [
    {
      "title": "The Supply Line",
      "durationSec": 5,
      "activeSegments": [0],
      "activePoints": [0, 1],
      "camera": { "longitude": 60, "latitude": 35, "zoom": 2.5, "pitch": 25 }
    }
  ],
  "routeColor": "#E5A544"
}
```

**Key fields:**
- `points[].coordinates` — `[longitude, latitude]`
- `segments[].from/to` — indices into `points` array
- `phases[].camera` — preferred over legacy `center/scale`

---

## TimelineComparison

Historical parallels, before/after dual-track timelines.

```jsonc
{
  "episode": "silicon-trap",
  "leftLabel": "Oil Embargo 1941",
  "rightLabel": "Chip Controls 2022",
  "leftColor": "#3266AD",
  "rightColor": "#C23B22",
  "leftEvents": [
    { "year": "1939", "title": "US-Japan trade friction begins", "icon": "⚡" }
  ],
  "rightEvents": [
    { "year": "2018", "title": "Entity List: Huawei added" }
  ],
  "connections": [
    { "leftIndex": 0, "rightIndex": 0, "label": "Trigger event" }
  ],
  "secondsPerEvent": 2
}
```

**Key fields:**
- `connections[].leftIndex/rightIndex` — indices linking left/right events
- `secondsPerEvent` — pacing control (default: 2)

---

## DataChart

Bar charts, comparisons, horizontal bars. The workhorse data template.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Chip Manufacturing by Nation",
  "subtitle": "% of global advanced chip production",
  "variant": "bar",                    // "bar"|"comparison"|"horizontal"
  "unit": "%",
  "dataPoints": [
    { "label": "Taiwan", "value": 92, "color": "#C23B22" },
    { "label": "South Korea", "value": 5, "color": "#3266AD" },
    { "label": "US", "value": 2 }
  ],
  "highlightIndex": 0,                // hero bar with accent glow
  "referenceLine": { "value": 50, "label": "Global average", "color": "#888780" },
  "contextNote": "A single earthquake could halt 92% of advanced chip production.",
  "source": "SIA, 2024"
}
```

**Comparison variant:**
```jsonc
{
  "variant": "comparison",
  "comparisonPairs": [
    { "label": "R&D Spending", "leftValue": 45, "rightValue": 38 }
  ],
  "leftGroupLabel": "US", "leftGroupColor": "#3266AD",
  "rightGroupLabel": "China", "rightGroupColor": "#C23B22"
}
```

**Year-mode (no thousand-separators):**
```jsonc
{
  "variant": "comparison",
  "formatAsYear": true,                // skip thousand-separator commas
  "comparisonPairs": [
    { "label": "Satellite", "leftValue": 1958, "rightValue": 1957 }
  ]
}
```
Use `formatAsYear: true` when values are years, postal codes, or 4-digit IDs that should not be comma-separated. Affects both bar value labels and y-axis ticks.

**Y-axis behavior:** y-axis ticks are now real data values (e.g. 0 / 2,000 / 4,000 / 6,000 / 8,000) computed via `niceTicks`. Previously the axis was hardcoded 0–100% with the unit appended. Pass `yRange: [min, max]` only if you specifically need to override the inferred domain.

---

## KineticTypography

Quotes, definitions, bilingual text, key statistics. Full-screen typography moments.

```jsonc
// Quote variant
{
  "episode": "silicon-trap",
  "variant": "quote",
  "text": "We are in a chip war.",
  "attribution": "Morris Chang",
  "attributionContext": "Founder of TSMC, 2024",
  "accentColor": "#E5A544"
}

// Definition variant
{
  "variant": "definition",
  "term": "卡脖子",
  "termPinyin": "kǎ bózi",
  "termTranslation": "Stranglehold technology",
  "definitionText": "Technologies where a foreign power has you by the throat."
}

// Bilingual variant
{
  "variant": "bilingual",
  "chineseText": "举国体制",
  "englishText": "Whole-nation system"
}

// Statistic variant
{
  "variant": "statistic",
  "statValue": "7%",
  "statLabel": "of US chip demand met domestically",
  "statContext": "Despite $165B in announced investment"
}
```

---

## FrameworkDiagram

Conceptual models, comparisons, matrix layouts, process flows.

```jsonc
// Comparison variant
{
  "episode": "silicon-trap",
  "title": "Chess vs. Go",
  "variant": "comparison",
  "columns": [
    { "title": "Chess", "icon": "♔", "items": ["Capture the king", "Open information"], "color": "#3266AD" },
    { "title": "Go (围棋)", "icon": "⚫", "items": ["Control territory", "Encirclement"], "color": "#C23B22" }
  ]
}

// Flow variant
{
  "variant": "flow",
  "nodes": [
    { "label": "Design", "sublabel": "US", "color": "#3266AD" },
    { "label": "Fabrication", "sublabel": "Taiwan", "color": "#C23B22" }
  ],
  "arrowLabels": ["IP license"]
}

// Matrix variant
{
  "variant": "matrix",
  "rowHeaders": ["Short-term", "Long-term"],
  "colHeaders": ["Success", "Failure"],
  "cells": [
    { "row": 0, "col": 0, "label": "Tech advantage holds", "highlight": true }
  ]
}
```

---

## TitleTransition

Episode titles, section titles, end cards.

```jsonc
// Episode title
{
  "episode": "silicon-trap",
  "variant": "episode-title",
  "episodeLabel": "EPISODE 01",
  "seriesName": "Parallax",
  "title": "The Silicon Trap",
  "subtitle": "When America Tried to Strangle China's AI"
}

// Section title
{
  "variant": "section",
  "sectionNumber": "II",
  "sectionTitle": "The Stranglehold"
}

// End card
{
  "variant": "end-card",
  "ctaText": "Subscribe for more",
  "nextEpisodeTeaser": "Next: The Rare Earth Gambit"
}
```

---

## DecisionTree

Branching scenarios, decision points. Tree structure via flat array + ID references.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Export Control Scenarios",
  "nodes": [
    { "id": "root", "label": "Current Policy", "children": ["success", "backfire"] },
    { "id": "success", "label": "Controls Succeed", "probability": "35%", "color": "#5DAA68" },
    { "id": "backfire", "label": "Controls Backfire", "probability": "45%", "color": "#D64545", "highlighted": true }
  ],
  "rootId": "root",
  "highlightedPath": ["root", "backfire"],
  "highlightColor": "#C23B22"
}
```

**Key fields:**
- `nodes[].children` — array of node IDs (not nested objects)
- `rootId` — entry point for tree traversal
- `highlightedPath` — ordered IDs forming the emphasized decision path
- `nodes[].marketPrice` — optional Kalshi annotation

---

## SplitComposition

Side-by-side comparisons with divider.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Two Views of the Same Event",
  "left": {
    "tag": "WESTERN LENS",
    "title": "Technology Denial",
    "items": ["National security priority", "Protecting IP"],
    "accentColor": "#3266AD"
  },
  "right": {
    "tag": "CHINESE LENS",
    "title": "Technology Blockade",
    "items": ["Containment strategy", "卡脖子 — stranglehold"],
    "accentColor": "#C23B22"
  },
  "dividerLabel": "vs"
}
```

---

## ProbabilityGauge

Probability readouts, shifts, scorecard tracking.

```jsonc
// Gauge variant
{
  "episode": "silicon-trap",
  "title": "Will Export Controls Succeed?",
  "variant": "gauge",
  "gauges": [
    { "label": "P(lasting tech advantage)", "value": 42, "color": "#E5A544", "marketSource": "Kalshi" }
  ]
}

// Shift variant
{
  "variant": "shift",
  "shifts": [
    { "label": "Export controls effect", "before": 55, "after": 42, "trigger": "SMIC 7nm breakthrough" }
  ]
}

// Scorecard variant
{
  "variant": "scorecard",
  "scorecard": [
    { "prediction": "SMIC can't reach 7nm by 2025", "yourEstimate": 70, "marketPrice": 65, "outcome": "wrong" }
  ]
}
```

---

## NetworkDiagram

Relationship webs, alliance structures, supply chain networks.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Semiconductor Alliance Network",
  "layout": "hub-spoke",              // "horizontal-chain"|"hub-spoke"|"grid"|"vertical-chain"
  "nodes": [
    { "id": "us", "label": "United States", "type": "nation", "color": "#3266AD", "importance": "primary" },
    { "id": "asml", "label": "ASML", "type": "institution", "color": "#E5A544", "importance": "secondary",
      "stat": { "value": "100%", "label": "EUV monopoly" } }
  ],
  "edges": [
    { "from": "us", "to": "asml", "style": "solid", "label": "Export controls" }
  ],
  "controls": [
    { "edge": ["us", "asml"], "label": "FDPR", "color": "#C23B22" }
  ],
  "callouts": [
    { "value": "$1T", "label": "Estimated cost of full self-sufficiency", "position": "bottom-right" }
  ]
}
```

**Key fields:**
- `nodes[].type` — determines shape: `"nation"` (rect), `"institution"` (rounded), `"actor"` (circle), `"concept"` (diamond)
- `edges[].style` — `"solid"` (active), `"dashed"` (potential), `"blocked"` (restricted)
- `nodes[].position` — optional `{x, y}` in 0-1 normalized coords (overrides auto-layout)

---

## TimeSeriesChart

Multi-series line charts with annotations, eras, and reference lines.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Semiconductor Capex Over Time",
  "lines": [
    {
      "label": "TSMC",
      "color": "#C23B22",
      "points": [{ "x": 2015, "y": 10 }, { "x": 2020, "y": 17 }, { "x": 2025, "y": 36 }],
      "areaFill": true
    }
  ],
  "annotations": [
    { "x": 2022, "label": "October 7 controls", "sublabel": "Full-spectrum restrictions" }
  ],
  "eras": [
    { "from": 2018, "to": 2022, "label": "Escalation period", "color": "#C23B22" }
  ],
  "referenceLines": [
    { "y": 25, "label": "Breakeven threshold", "dashed": true }
  ],
  "xLabel": "Year",
  "yLabel": "Capex",
  "yUnit": "$B",
  "heroStat": { "value": "$36B", "label": "TSMC 2025 capex" }
}
```

**Key fields:**
- `lines[].points[].x` — can be number (year) or string (date)
- `lines[].width` — stroke width in px (default: 5 — was 3 before May 2026)
- `lines[].areaFill` — filled area under the line (default false)
- `eras[]` — shaded background bands for time periods
- `xLabel` — RENDERS now (rotated below x-axis ticks). Was a dead schema field before May 2026.
- `yLabel` — RENDERS now (rotated 90° on left side of chart).
- `heroStat` — large stat callout in corner

**Behaviors enabled by default:**
- **Auto-legend**: when `lines.length > 1`, a legend strip renders top-right of chart automatically (colored swatch + label per series). No opt-in needed.
- **Leading-edge marker**: a glowing dot tracks the tip of each line as it draws, then fades when the line completes. Adds NYT-style "recording instrument" feel without configuration.
- **Niced y-axis**: clamps at 0 for all-positive data, snaps min/max to round numbers, generates ticks at multiples of nice spacing. Pass `yRange` to override.

---

## SankeyFlow

Flow and allocation diagrams (trade, resources, budget).

```jsonc
{
  "episode": "silicon-trap",
  "title": "CHIPS Act Funding Flow",
  "nodes": [
    { "id": "chips", "label": "CHIPS Act", "value": 280, "color": "#3266AD", "column": 0 },
    { "id": "fab", "label": "Fabrication", "value": 200, "column": 1 },
    { "id": "rd", "label": "R&D", "value": 50, "column": 1 }
  ],
  "links": [
    { "from": "chips", "to": "fab", "value": 200, "label": "Manufacturing" },
    { "from": "chips", "to": "rd", "value": 50 }
  ],
  "valuePrefix": "$",
  "valueSuffix": "B",
  "showValues": true
}
```

**Key fields:**
- `nodes[].column` — 0-indexed column position (left to right)
- `nodes[].color` — colors the node's vertical bar. **If omitted, auto-assigns from the categorical sequence** (muted blue → rust → gold → umber → walnut → taupe). Always specify for nodes that need a specific semantic color (e.g. red for waste, green for useful).
- `links[].value` — determines ribbon thickness, proportional to source-node outflow share × source-node height. (Old behavior: capped at 16px stroke width — fixed May 2026.)

**Render behaviors (no opt-in):**
- **Thin colored bars**: nodes are 14px-wide colored vertical stripes, not wide translucent boxes. The bar's *height* carries the value; width is purely visual.
- **Filled bezier ribbons**: links are filled trapezoids stacked along node edges, not stroked lines through node centers. Source/dest endpoints stack proportionally so flows align with the node-edge they touch.
- **Smart label placement**: labels for first + middle columns sit outside-LEFT of the bar; last-column labels sit outside-RIGHT. Both stacked above the value text. Strong text-shadow halo for readability over crossing ribbons.
- **Vertical bias**: each column's stack centers vertically with a 35/65 top/bottom bias so the diagram feels anchored to the title rather than floating mid-frame.

---

## GameBoard

Strategic game theory: chess, go, payoff matrix.

```jsonc
// Chess variant
{
  "episode": "silicon-trap",
  "title": "The Chip War Board",
  "variant": "chess",
  "boardSize": 8,
  "initialPieces": [
    { "position": [4, 0], "label": "TSMC", "color": "#C23B22" }
  ],
  "phases": [
    { "label": "Opening Move", "durationSec": 3,
      "pieces": [{ "position": [3, 2], "label": "ASML", "color": "#E5A544" }] }
  ]
}

// Go variant
{
  "variant": "go",
  "boardSize": 9,
  "initialStones": [],
  "phases": [
    { "label": "Encirclement begins", "durationSec": 3,
      "stones": [{ "position": [4, 4], "stone": "black", "label": "US" }] }
  ]
}

// Payoff matrix variant
{
  "variant": "payoff-matrix",
  "rowPlayer": "US",
  "colPlayer": "China",
  "rowOptions": ["Restrict", "Engage"],
  "colOptions": ["Self-develop", "Cooperate"],
  "cells": [
    { "row": 0, "col": 0, "value": "-3, -2", "highlight": true }
  ],
  "phases": [
    { "label": "Nash Equilibrium", "durationSec": 4, "highlights": [0] }
  ]
}
```

---

## BayesianUpdate

Animated probability distribution curve shifting with sequential evidence.

```jsonc
// Single variant
{
  "episode": "silicon-trap",
  "title": "Will Export Controls Succeed?",
  "variant": "single",
  "prior": 55,
  "question": "P(US export controls achieve lasting tech advantage)",
  "evidence": [
    { "label": "COCOM precedent: 45 years vs USSR", "direction": "up", "magnitude": 3, "source": "Cold War data" },
    { "label": "China's economy 6× more integrated", "direction": "down", "magnitude": 4 }
  ],
  "marketPrice": 42,
  "marketSource": "Kalshi"
}

// Compare variant
{
  "variant": "compare",
  "hypotheses": [
    { "label": "Controls succeed", "prior": 55, "color": "#3266AD" },
    { "label": "Controls backfire", "prior": 45, "color": "#C23B22" }
  ],
  "evidence": [
    { "label": "SMIC 7nm breakthrough", "direction": "down", "magnitude": 3 }
  ]
}
```

**Key fields:**
- `evidence[].direction` — `"up"` increases probability, `"down"` decreases
- `evidence[].magnitude` — 1 (marginal nudge) to 5 (dramatic shift)
- `marketPrice` — shown as amber dashed vertical reference line

---

## StatReveal

Dramatic single-statistic reveal with comparison bars.

```jsonc
{
  "episode": "silicon-trap",
  "title": "The Scale of Investment",
  "subtitle": "CHIPS Act funding vs. comparable programs",
  "stat": {
    "value": 280,
    "prefix": "$",
    "suffix": "B",
    "label": "Total CHIPS Act + private commitments",
    "decimals": 0
  },
  "comparisons": [
    { "label": "Apollo Program (adj.)", "value": 194, "color": "#3266AD" },
    { "label": "Marshall Plan (adj.)", "value": 173, "color": "#5DAA68" },
    { "label": "Manhattan Project (adj.)", "value": 30, "color": "#C23B22" }
  ],
  "heroIsMax": true
}
```

**Key fields:**
- `stat.prefix/suffix` — formatting around the number (e.g., "$280B")
- `stat.decimals` — decimal places (default: 0)
- `heroIsMax` — if true (default), hero stat is the largest bar

---

## RadarChart

Multi-axis polygon capability comparison.

```jsonc
{
  "episode": "EP02",
  "title": "Strategic Capability Comparison",
  "axes": [
    { "label": "Military", "short": "MIL" },
    { "label": "Economic", "short": "ECON" },
    { "label": "Technological", "short": "TECH" }
  ],
  "subjects": [
    { "name": "United States", "values": [95, 85, 92], "color": "#3266AD", "fillOpacity": 0.15 },
    { "name": "China", "values": [70, 78, 75], "color": "#C23B22", "fillOpacity": 0.15 }
  ],
  "morphFrom": [
    { "name": "United States", "values": [90, 90, 80], "color": "#3266AD" },
    { "name": "China", "values": [50, 60, 45], "color": "#C23B22" }
  ],
  "gridLevels": [25, 50, 75, 100]
}
```

**Key fields:**
- `subjects[].values` — array of 0-100 numbers, same length and order as `axes`
- `morphFrom` — optional prior state; polygons morph from these values to current
- `gridLevels` — concentric gridline levels (default: [25, 50, 75, 100])

---

## AnnotatedImage

Image with animated callout labels.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Inside the ASML EUV Machine",
  "imageSrc": "episodes/silicon-trap/euv-machine.jpg",
  "imageAlt": "ASML EUV lithography machine cross-section",
  "duotoneRamp": "standard",          // "standard"|"conflict"|"editorial"
  "callouts": [
    { "x": 30, "y": 35, "label": "Tin Droplet Generator", "detail": "50,000 droplets/second", "placement": "left" },
    { "x": 50, "y": 50, "label": "CO₂ Laser", "detail": "20kW", "placement": "right", "color": "#E5A544" }
  ]
}
```

**Key fields:**
- `callouts[].x/y` — percentage position (0-100) relative to image dimensions
- `callouts[].placement` — `"top"` | `"bottom"` | `"left"` | `"right"` (default: `"right"`)
- `duotoneRamp` — brand treatment ramp applied to the image

---

## EscalationLadder

Vertical event sequence with severity indicators.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Semiconductor Sanctions Escalation",
  "direction": "escalation",          // "escalation"|"de-escalation"
  "rungs": [
    { "label": "Entity List additions", "date": "May 2019", "severity": "moderate",
      "detail": "Targeted restrictions on specific companies" },
    { "label": "October 7 export controls", "date": "Oct 2022", "severity": "high",
      "detail": "Full-spectrum restrictions", "current": true }
  ]
}
```

**Key fields:**
- `rungs[].severity` — `"low"` (green) | `"moderate"` (amber) | `"elevated"` (amber+) | `"high"` (rust) | `"critical"` (red)
- `rungs[].current` — shows pulsing indicator for latest/active step
- `direction` — affects visual tone (default: `"escalation"`)

---

## ImageComposite

Brand-treated photo with text overlay.

```jsonc
{
  "episode": "silicon-trap",
  "variant": "background",            // "background"|"inset"|"portrait"
  "title": "Morris Chang",
  "subtitle": "The man who built TSMC",
  "imagePath": "episodes/silicon-trap/morris-chang.jpg",
  "duotone": "standard",
  "textPosition": "bottom-left"       // "bottom-left"|"bottom-right"|"center"
}

// Portrait variant
{
  "variant": "portrait",
  "imagePath": "episodes/silicon-trap/morris-chang.jpg",
  "personName": "Morris Chang",
  "personTitle": "Founder of TSMC"
}
```

---

## PhotoMontage

Multi-photo grid with reveal animation.

```jsonc
{
  "episode": "silicon-trap",
  "title": "The Chip War",
  "transition": "dissolve",           // "cut"|"dissolve"|"wipe-left"
  "transitionDurationSec": 0.3,
  "images": [
    {
      "src": "episodes/silicon-trap/tsmc-fab.jpg",
      "durationSec": 3,
      "treatment": "standard",        // "standard"|"conflict"|"editorial"
      "compositeMode": "background",   // "background"|"inset"
      "overlay": { "text": "TSMC Fab 18", "position": "bottom-left", "style": "label" }
    }
  ]
}
```

**Key fields:**
- `images[].overlay.style` — `"stat"` (large number), `"label"` (medium text), `"caption"` (small text)
- `images[].secondaryOverlay` — optional date stamp at top corner

---

## File Naming Convention

```
data/episodes/epXX/<template-type>-<descriptive-slug>.json
```

Examples:
- `data/episodes/silicon-trap/datachart-chip-production-share.json`
- `data/episodes/silicon-trap/kinetic-ka-bozi-definition.json`
- `data/episodes/silicon-trap/choropleth-export-control-coalition.json`
- `data/episodes/silicon-trap/bayesian-export-controls.json`
- `data/episodes/silicon-trap/statreveal-chips-act-scale.json`
- `data/episodes/silicon-trap/radar-strategic-comparison.json`
- `data/episodes/silicon-trap/escalation-sanctions-timeline.json`
- `data/episodes/silicon-trap/annotated-euv-machine.json`

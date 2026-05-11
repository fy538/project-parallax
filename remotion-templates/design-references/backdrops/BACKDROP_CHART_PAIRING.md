# Backdrop ↔ Remotion foreground pairing

Segment backdrops sit **under** templates that use `transparentBackground` + `Background variant="transparent"`. If the PNG is too busy (grain, contrast edges, competing geometry in the chart safe zone), **detailed charts** — Sankey, network graphs, multi-series, micro-labels — lose separation and read as muddy.

## Two levers in `backdrop-manifest.json`

| Field | Meaning |
|--------|---------|
| **`density`** | Qualitative visual weight of the plate: `quiet` \| `medium` \| `busy`. |
| **`chartFit`** (optional) | Max **recommended** foreground complexity this plate tolerates: `high` \| `medium` \| `low`. |

If **`chartFit` is omitted**, it is **derived**:

- `density: quiet` → **`chartFit: high`** (dense charts generally OK if layout respects quiet zones)
- `density: medium` → **`chartFit: medium`**
- `density: busy` → **`chartFit: low`** (prefer typography, simple bars, kinetic quotes)

Overrides exist where **`density` lies about chart tolerance** — e.g. `strategy-grid` is `medium` visually but designed as a diagram substrate → **`chartFit: high`**.

## What each `chartFit` implies

- **`high`** — Safe for busy analytical templates (still use correct **anchor / hero** so the chart sits over the quiet band).
- **`medium`** — Normal charts; avoid stacking “max clutter” (huge node counts, tiny annotations everywhere).
- **`low`** — Treat like **reading-room**: sparse foreground, hero typography, simple comparisons.

## Operational workflow

1. Classify the segment template roughly: **dense** vs **typical** vs **sparse** (see examples below — not exhaustive).
2. Filter backdrops:

```bash
python3 tools/assembly/print_backdrop_catalog.py --chart-at-least high
python3 tools/assembly/print_backdrop_catalog.py --chart-at-least medium --dark-register
```

3. Pick metaphor from `selectionBrief`, then set **`[BACKDROP: id]`** in the script visual column.

## TypeScript

```typescript
import { BACKDROP_MANIFEST } from "./components/EditorialSurface";
import { backdropChartFit, backdropSupportsChartFit } from "./utils/backdropChartFit";

const row = BACKDROP_MANIFEST.find((b) => b.id === "reading-room")!;
backdropChartFit(row); // "low"
backdropSupportsChartFit(row, "high"); // false
```

## Dense template examples (prefer `chart-at-least high`)

SankeyFlow, NetworkDiagram, FrameworkDiagram (busy graphs), DualTimeline with heavy labels, ChoroplethMap with many regions — anything where **small geometry fights** the plate.

## Sparse examples (`low` backdrops still OK)

Title-adjacent kinetic type, StatReveal with one number, simple DataChart comparison pairs.

---

**Manifest generation:** `tools/assembly/generate_manifest.py` prints a **stderr WARNING** when `[BACKDROP: id]` resolves to **chartFit low** and the template component is in the shared **high-clutter allowlist** (`tools/shared/backdrop_manifest.py` → `HIGH_CLUTTER_TEMPLATE_COMPONENTS`). False positives/negatives are possible — tune the allowlist as templates evolve.

# Treemap — Template Research Dossier

_Added May 19, 2026._

## 1. The form's editorial purpose

A treemap is the canonical form for part-to-whole structure when the number of items exceeds five or six, making a bar chart too tall or cluttered to scan at video speed. Every rectangle's area encodes magnitude relative to the whole, so the viewer grasps "Navy is the biggest slice" in the first frame without reading numbers. The critical editorial distinction from a pie chart: treemaps scale to 8–20 items gracefully (the squarified layout keeps rectangles near-square and legible), whereas a pie chart with more than five slices collapses into unreadable wedges. Use when the argument is "look at the breakdown of the whole — the shape of the budget, market, or distribution reveals the story."

## 2. Canonical idioms

### 2a. Squarified treemap (default)

- **FT:** iPhone cost breakdown (2019), UK government budget (2022 Autumn Statement), global chip production by foundry (2023) — the squarified form appears whenever FT needs 8–20 part-to-whole items.
- **Bloomberg:** U.S. federal budget visualization (annual), equity market sector breakdown (S&P 500 heat map).

Area is proportional to value; cells are as close to square as the squarify algorithm allows. Labels sit inside cells — larger cells get larger labels. Cells too small to label are shown unlabeled or omitted from legend. Works because area perception, while not as accurate as position, is sufficient for "this one is about twice as large as that one" — the editorial argument budget stories require.

**Failure mode:** more than 30 items produces a wall of slivers, many unlabeled and illegible at video scrubbing speed.

### 2b. Highlighted accent cell

- **NYT Upshot:** semiconductor fab capacity (2022) — TSMC cell highlighted in blue, all others muted gray.
- **Economist:** defense spending breakdown (2024) — "procurement" cell accented in Economist red.

One cell receives a distinct border or fill intensity; the narrator names it. Dramatically improves readability at video scrubbing speed because the viewer's eye is directed. Parallax implements this via `highlightLabel` + gold border.

**Failure mode:** highlighting more than two cells collapses back into "which one should I look at?"

### 2c. Annotated sublabels

- **Reuters Graphics:** cocoa production by country (2024) — country name + "share: X%" in each cell.
- **Pudding:** streaming library size by genre (2023) — genre name + item count in cell.

Sublabels inside cells carry the supporting number — "$198B" or "22%" — so the narrator can reference it precisely without a separate legend. Parallax implements this via `sublabel` field (free-form string, e.g., "Land forces, readiness").

**Failure mode:** sublabel renders in cells that are too small — clip text with `overflow: hidden` and omit sublabel below a minimum width/height threshold.

### 2d. Value-labelled cells (show values)

- **Bloomberg terminal treemap:** equity sector heat maps always show the value (percentage change, market cap) inside each cell.
- **FT budget treemap:** "$XXbn" inside cells large enough to hold it; omitted from tiny sliver cells.

When `showValues: true`, the formatted value string appears below the sublabel. Adaptive sizing: show only when cell width > 60px and height > 44px. This lets the chart work as a standalone graphic if the narrator can't name every cell.

**Failure mode:** value string collides with label if the font size is too large for the cell — keep value font at `fontSizes.caption` (14px).

### 2e. Sequential stagger animation

- **NYT:** cells appear one by one with a ~50ms stagger, left-to-right / top-to-bottom (following reading order).
- **Bloomberg:** cells fade in simultaneously on the heat map because there are too many items (>50) to stagger legibly.

For Parallax (8–20 items), a 40ms stagger is perceptible without being slow. Squarify sorts by value descending, so the largest cell appears first — matching the editorial narrative convention "let's start with the biggest piece."

**Failure mode:** zero stagger (all cells appear at once) removes the "build" — the chart pops in like a graphic rather than reveals like an argument.

## 3. General principles

**Area encoding:** Cleveland's perceptual accuracy hierarchy puts area below position and length, but above angle (pie charts). For part-to-whole arguments where the viewer needs to compare magnitudes (not precise values), area encoding is sufficient — and it scales to far more items than a bar chart without vertical scrolling. The key perceptual constraint is that area comparison degrades sharply for extreme aspect ratios (slivers), which is why squarify's near-square optimization is the correct default.

**Label placement:** Inside placement (FT, Economist default) is unambiguous — the label belongs to the cell it sits in, without need for a separate legend. It requires minimum area thresholds (empirically: ~4800 px² for a short label at 14px; wider/taller cells can host larger labels). Parallax implements adaptive font sizing: h2 (48px) for large cells, body (22px) for medium, meta (11px) for small.

**Color assignment:** Categorical color by value rank (largest cell gets color[0]) keeps the dominant slice visually consistent across data updates. When a specific cell needs editorial accent (gold border for `highlightLabel`), the color cycle provides the fill and the accent overlay provides the emphasis layer.

## 4. Recommendation for Parallax

**Default:** squarified layout with staggered reveal (40ms per cell), bottom-left label placement inside cells, sublabel + value for cells large enough to host them. Dark background variant works better for budget / defense content (muted palette reads as authoritative, earth-tone cells are readable against dark substrate). Light variant for economic / market content where the editorial register is analytical rather than dramatic.

**Signature move:** `highlightLabel` + gold border pulls one cell to the foreground while the narrator names it. This is Parallax's "bounded analogy" move applied to area charts — "look at the Army allocation: it's the third largest, but it gets the most scrutiny." The gold border is loud enough to redirect attention without overwhelming the full-chart reading.

**Hierarchy absent from treemap:** if ranking or ordering is the argument (who grew fastest?), use BumpChart instead. If the breakdown has fewer than five items, use DataChart (horizontal bars read position, which is more accurate than area for direct comparison). If time evolution matters, use TimeSeriesChart or Streamgraph.

## 5. Current template alignment

The V1 Parallax Treemap (May 2026) ships with:

- Squarify algorithm in pure TypeScript — no library dependency. Input sorted by value descending before layout. Recursive split at aspect-ratio-optimal boundary.
- Adaptive label sizing: h2 / body / meta depending on cell dimensions.
- Sublabel and value conditional on cell area thresholds.
- Staggered fade-in at sec(0.04) per cell (40ms @ 30fps), starting after TitleBlock.
- Gold border accent for `highlightLabel` cell.
- Default color cycle: dustblue → gold → umber → walnut → taupe → midnight (muted, earth-tone, readable on both light/dark).
- `showValues` flag (default true) with `valuePrefix` / `valueSuffix` formatting.
- `backgroundVariant` light / dark (dark is default for catalog fixture).
- TitleBlock (title + subtitle), HeaderStrip, FooterStrip, SourceAttribution — full editorial chrome.
- `useDirection(data._direction, "none")` — no drift for data templates.

**Divergences from canonical outlet practice:**
- FT and Bloomberg use legend strips for color meaning; Parallax uses inline labels only (no legend) — intentional for video speed.
- NYT sometimes animates cells from left-to-right in DOM order; Parallax animates in squarify output order (largest first) — editorial advantage: biggest cell settles first, matching narration convention.

**V2 deferred:** hierarchical grouping (parent rectangles containing child items) — requires a two-level layout pass and grouped color assignment. Documented here as the planned extension; not blocking V1.

## 6. Specific upgrades proposed

1. **(High impact, medium effort) Value animation:** animate the value label counting up from 0 → final on first appearance — matches the `countUp` utility in `src/utils/countUp.ts` and reinforces the "reveal" feeling.
2. **(Medium impact, low effort) Legend optional:** if `showLegend: true`, render a compact horizontal legend below the chart for cases where color carries semantic meaning (e.g., branch color = service type). V1 omits it (labeled cells are self-annotating).
3. **(Medium impact, medium effort) Hierarchical V2:** two-level layout with parent grouping labels at the group level. Required for org-chart / sector-of-sector arguments.
4. **(Low impact, low effort) Cell gap:** expose `cellGap: number` (default 2px) for outlets that prefer tight vs. open grid.
5. **(Low impact, low effort) Label position:** expose `labelAlign: "bottom-left" | "center"` — center alignment reads better for large, near-square cells (Navy at $215B); bottom-left reads better for tall narrow cells.

## 7. Failure mode flags

- **Too many items (>30):** treemap becomes wall of unlabeled slivers. Recommend grouping. Emit warning via `warnIf` at >40 items (current threshold).
- **Fewer than 5 items:** a bar chart reads position more accurately than area. Use DataChart.
- **Ranking is the argument:** use BumpChart (ordinal position over time) or sorted bar chart. Treemap reveals *composition*, not *order*.
- **Time series:** use TimeSeriesChart or Streamgraph. Treemap is a single-moment snapshot.
- **Extreme value disparity:** one item is 10× the rest → all others become slivers. Recommend log-scaled values (document explicitly if used) or grouping small items into "Other."
- **Item color carries geopolitical meaning (US blue / China rust):** pass explicit `color` on each item; don't rely on the cycle. The cycle is not semantically meaningful for bilateral content.

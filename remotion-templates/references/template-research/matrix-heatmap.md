# MatrixHeatmap (N×M Analytical Comparison Grid) — Research Dossier

> Created: May 19, 2026. Parallax-aligned by claude. Update when new outlet conventions are observed.

## 1. The form's editorial purpose

The matrix heatmap exists to expose **structured multi-dimensional comparison** — how N entities score across M dimensions simultaneously. The cell fills do double duty: they expose both rank (dark = weak, bright = strong) and the pattern of clustering ("the top row is uniformly hot; column 3 is uniformly cold"). Use it when the editorial claim is *"look at the shape of advantage / disadvantage across this population"* — not "X outranks Y on a single measure" (use BumpChart or Slopegraph), not "how has X's score changed over time" (use TimeSeriesChart). The matrix is the right form when BOTH the row dimension AND the column dimension are analytically interesting simultaneously.

## 2. Canonical idioms from editorial outlets

### a. The Economist Intelligence Unit / Freedom House / V-Dem style scorecards

The canonical political-science comparison: countries × governance dimensions (electoral integrity, civil liberties, rule of law, institutional capacity). Every major index publication — Freedom in the World, V-Dem's LDI, Bertelsmann Transformation Index, Reporters Without Borders — uses some form of this grid. The Economist's Democracy Index publishes an annual matrix. *Works because:* the matrix simultaneously reveals which countries are uniformly weak (full-row dimness), which dimensions are systemically weak across a region (full-column dimness), and which cells are outliers (an unexpectedly bright cell in an otherwise dim row). *Fails when:* dimensions are not comparable in magnitude — mixing raw counts with ratios with percentages without normalization.

### b. Bloomberg / FT capability matrices

Bloomberg Opinion and FT have used N×M grids for technology supply-chain analysis: countries × semiconductor capability dimensions (design, fab, advanced packaging, materials, equipment). The Financial Times "US vs China tech competition" graphics (2022–2024) favored small-multiple bar charts over a heatmap but the data structure is identical. *Works at video speed because:* cell fills communicate rank instantly without axis-reading. Numbers inside cells anchor the ordinal to a specific value for the "backstage-verified, frontstage-confident" viewers who need anchoring. *Fails when:* the matrix exceeds ~8×8 cells — the FT's convention is to split matrices that dense into two side-by-side smaller matrices rather than shrink cells.

### c. NYT / Reuters defense scorecard

The alliance-capability matrix appeared prominently post-2022 in Western defense journalism: NATO members × defense readiness dimensions (spending/GDP, troops committed, air assets, cyber, C2 compatibility). Reuters Graphics (2023, 2024) used horizontal heatmap strips rather than a full grid, but the data model is the same. *Parallax editorial register:* prefer the full square grid — it exposes the structural pattern (Germany's column is cold, UK is hot) rather than flattening it to bars.

### d. The Pudding / Observable data explorations

For academic / data-journalism use, heatmaps have been used for correlation matrices (Pearson r values — a canonical diverging use case: positive correlations in one color, negative in another). The diverging color scale centered on zero is the editorial standard for signed values. *Parallax use case:* before/after policy change, positive vs. negative deviation from baseline.

## 3. Color scale selection

| Data type | Scale | Default tokens |
|---|---|---|
| Absolute values (0 to max, no meaningful zero) | sequential | `colorLow: palette.midnight`, `colorHigh: palette.dustblue` |
| Signed values (negative, zero, positive) | diverging | `colorLow: semantic.china`, `colorMid: palette.walnut`, `colorHigh: semantic.us` |
| Capability index (0–10, 0–100) | sequential | same as above |
| Change from baseline (before/after) | diverging | same as above |

Sequential reads as "how much" (more = brighter). Diverging reads as "which direction from neutral."

## 4. When to use MatrixHeatmap

**Use when:**
- Comparing N≥3 entities across M≥3 dimensions simultaneously
- The editorial claim is about the *pattern* across both axes (row clusters, column clusters, outlier cells)
- Cells can be meaningfully normalized to a common scale (0–10, 0–100, deviation from mean)
- You want to accent a single row or column ("highlight this actor among peers") via `highlightRow` / `highlightCol`
- Alliance matrices, capability scorecards, policy adoption grids, index breakdowns

**Do NOT use when:**
- Fewer than 3×3 cells — use DataChart (bars) or a simple labeled table instead
- The primary comparison is ranking on a single dimension — use BumpChart or Slopegraph; those carry rank transitions more legibly than a heatmap column
- The data is 3-dimensional (entities × dimensions × time) — split into two separate matrices (before/after with a MorphTransition) or use SmallMultiples
- Cell values vary by 3+ orders of magnitude (logarithmic compression needed — a heatmap's linear color ramp misleads)
- Entities or dimensions exceed 12 each — readability breaks at 1920×1080 below ~MIN_CELL_SIZE px

## 5. Parallax defaults

- **Grid geometry**: `ROW_LABEL_W = 200px`, `COL_HEADER_H = 80px`. Cell size fills remaining space; floor at 32px. At 1920×1080 with generous safe area, a 6×5 matrix renders cells ~155×130px (generous and readable).
- **Color defaults (sequential)**: `colorLow = palette.midnight (#2A2520)`, `colorHigh = palette.dustblue (#7AA3C9)`. The midnight-to-dustblue sequential ramp reads cleanly on both dark and light backgrounds without bleeding into the gold accent family.
- **Color defaults (diverging)**: `colorLow = semantic.china`, `colorMid = palette.walnut`, `colorHigh = semantic.us`. The rust-to-us-blue diverging ramp is the canonical Parallax geopolitical opposition idiom (China–Neutral–US register). Preserve this for bilateral advantage/disadvantage comparisons.
- **Show values**: true by default. Numbers inside cells anchor the ordinal rank to a concrete figure — Parallax's "backstage-verified, frontstage-confident" doctrine requires the viewer to be able to read actual values, not just relative shading.
- **Highlight row/col**: renders a 2px gold border on the row label and all cells in that row. Use to foreground the subject of the current narration ("the US dimension") without changing the rest of the matrix.

## 6. Animation doctrine

- **Diagonal ripple reveal** (top-left → bottom-right): each cell starts fading in at `sec(0.8) + (row + col) * sec(0.06)`. At 6×5 the maximum diagonal index is 9, so the last cell appears at ~`sec(0.8 + 9 × 0.06)` = `sec(1.34)`. The full grid is settled by ~sec(1.6). This matches the Economist-style "progressive reveal" convention — viewers track the wave and anticipate where the next cluster will land.
- **Structure first, then data**: column headers stagger at sec(0.3), row labels stagger at sec(0.5), cells start at sec(0.8). This matches the three-layer POLISH.md A4 convention (structure → data → labels).
- **No per-cell spring**: cells reveal via `fadeIn` only (no scale or translate). Scale motion at the cell level competes with the color-encoding gesture; the color itself is the data motion.

## 7. Known failure modes

- **Sparse cells (not all row×col pairs provided)**: empty cells render as faint placeholder rectangles (15% opacity background tint). Warn the viewer in `data.subtitle` if sparsity is intentional ("—" = not applicable). The warnIf guard fires in the Remotion console if `cells.length < rows.length * columns.length / 2`.
- **Value scale mismatch**: if `valueFormat: "currency"` is used with values in trillions (e.g., 1.2 for $1.2 trillion), the abbreviated display ("$1.2B") will be wrong. Author the values in the correct unit for the chosen format.
- **Color collision with background**: sequential `colorLow = palette.midnight` matches the `backgroundVariant: "dark"` background. Cells with min-value data become invisible. Mitigation: the background renders at `fillOpacity = 0.15` for empty cells and `1.0` for data cells — even minimum-value data cells render at full opacity with `colorLow` fill (which will contrast with the `palette.midnight` background only by the cell border). For a fully dark composition, prefer `colorLow` slightly lighter than `palette.midnight` (e.g., `palette.walnut`).

## 8. Sibling template disambiguation

| Template | Use when |
|---|---|
| **MatrixHeatmap** | N≥3 entities × M≥3 dimensions, color is the signal |
| **BumpChart** | Same entities, single rank dimension, change over time is the signal |
| **Slopegraph** | Two time points, rank change is the signal |
| **RadarChart** | Single entity, multi-dimensional profile (spider chart) |
| **DataChart** | Multiple entities, single dimension, magnitude comparison |
| **SmallMultiples** | Same chart type repeated across entities or time |
| **CalendarHeatmap** | Single entity, daily temporal rhythm is the signal |

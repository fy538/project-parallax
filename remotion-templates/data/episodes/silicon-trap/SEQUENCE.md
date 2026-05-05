# silicon-trap — THE SILICON TRAP
## Composition Sequence Map (v5)

> Regenerated from script-v5-production.md (two-column format).
> v4 → v5 changes: 3 template swaps (GameBoard, DecisionTree, TimeSeriesChart),
> 2 layered mode conversions, 1 treatment update, 1 file split (chess+go).
>
> Total motion graphics runtime: ~168 seconds (~2:48)
> Episode narration runtime: ~18 minutes
> The gap is intentional — motion graphics overlay narration alongside stock footage and archival images.

---

### Opening

| # | Filename | Template | Variant | Duration | Script Moment |
|---|----------|----------|---------|----------|---------------|
| 01 | title-episode.json | TitleTransition | episode-title | 5s | Episode open — "The Silicon Trap" |

---

### Beat 1 — The Paradox (0:00–3:00)

| # | Filename | Template | Variant | Duration | Script Moment | v5 Note |
|---|----------|----------|---------|----------|---------------|---------|
| 02 | title-section-paradox.json | TitleTransition | section | 3s | "I. The Paradox" section card | — |
| 03 | kinetic-92-yield.json | KineticTypography | statistic | 3s | "92% YIELD" — TSMC Arizona | ✏️ LAYERED over cleanroom footage (assembly-level) |
| 04 | kinetic-165b.json | KineticTypography | statistic | 4s | "$165B" — largest FDI in US history | ✏️ LAYERED over aerial footage (assembly-level) |
| 05 | chart-7pct-demand.json | DataChart | bar | 4s | 7% of US chip demand vs 93% remaining | — |

Beat 1 motion graphics: 14s (same as v4; layered mode is assembly-time compositing)

---

### Beat 2 — The Logic of Denial (3:00–7:00)

| # | Filename | Template | Variant | Duration | Script Moment | v5 Note |
|---|----------|----------|---------|----------|---------------|---------|
| 06 | title-section-denial.json | TitleTransition | section | 2s | "II. The Logic of Denial" | — |
| 07 | timeline-oil-chips.json | TimelineComparison | — | 13s* | 1941 oil embargo ↔ 2019–2026 chip controls | — |
| 08 | kinetic-revenue-deal.json | KineticTypography | statistic | 5s | "20% → 15%" revenue-sharing deal | ✏️ backgroundTint → rust (conflict treatment) |
| 09 | chart-chips-act.json | DataChart | bar | 6s | CHIPS Act: $52.7B → $6B disbursed | — |
| — | *(footage insert)* | — | — | 7s | Cold War archival footage — COCOM bridge | ✏️ NEW footage break (no JSON needed) |
| 10 | choropleth-cocom.json | ChoroplethMap | — | 10s* | COCOM 17 nations vs Soviet Bloc | — |
| 11 | framework-cocom-china.json | FrameworkDiagram | comparison | 8s | COCOM vs USSR / Export controls vs China | — |

Beat 2 motion graphics: 44s (same as v4; footage insert is non-MG)

---

### Beat 3 — The Other Side of the Wall (7:00–12:30)

| # | Filename | Template | Variant | Duration | Script Moment | v5 Note |
|---|----------|----------|---------|----------|---------------|---------|
| 12 | title-section-wall.json | TitleTransition | section | 2s | "III. The Other Side of the Wall" + 卡脖子 | — |
| — | *(footage first)* | — | — | 11s | Train + space + pen tip footage montage | ✏️ Moved BEFORE 卡脖子 card (illustrate-then-name) |
| 13 | kinetic-kabozi.json | KineticTypography | definition | 5s | 卡脖子 — "stranglehold technology" | ✏️ Now arrives AFTER pen tip story |
| 14 | kinetic-juguo.json | KineticTypography | definition | 4s | 举国体制 — "whole-nation system" | — |
| 15 | chart-lithography.json | DataChart | comparison | 8s | SMIC 34 passes vs EUV 9 passes | — |
| — | *(footage insert)* | — | — | 6s | Typewriter closeup footage — metaphor anchor | ✏️ NEW footage break (no JSON needed) |
| 16 | timeseries-smic-yield.json | TimeSeriesChart | — | 6s | SMIC yield: Q1'24 38% → Q2'25 68% | ✏️ NEW (was chart-smic-yield.json DataChart) |
| 17 | framework-kirin-teardown.json | FrameworkDiagram | comparison | 6s | Kirin X90: marketing vs TechInsights teardown | — |
| 18 | kinetic-deepseek-zero.json | KineticTypography | statistic | 5s | "0 successful training runs" | — |

Beat 3 motion graphics: 36s (+1s from TimeSeriesChart duration change)

---

### Beat 4 — The Trap (12:30–15:30)

| # | Filename | Template | Variant | Duration | Script Moment | v5 Note |
|---|----------|----------|---------|----------|---------------|---------|
| 19 | title-section-trap.json | TitleTransition | section | 2s | "IV. The Trap" | — |
| 20 | gameboard-chess.json | GameBoard | chess | 8s | US chess strategy — piece captures | ✏️ NEW (was framework-chess-go.json) |
| 21 | gameboard-go.json | GameBoard | go | 8s | China go strategy — territory surrounding | ✏️ NEW (was framework-chess-go.json) |
| 22 | route-chip-supply.json | RouteAnimation | — | 18s* | Supply chain: 6 countries, 4 phases | — |
| 23 | kinetic-trap.json | KineticTypography | quote | 3s | "A TRAP FOR EVERYONE" | — |
| 24 | choropleth-caught-between.json | ChoroplethMap | — | 11s* | ASML, South Korea, Japan caught between | — |
| 25 | kinetic-morris-chang.json | KineticTypography | quote | 5s | "Globalization is almost dead." | — |

Beat 4 motion graphics: 55s (same as v4 — GameBoard pair = FrameworkDiagram pair in duration)

---

### Beat 5 — Your Chips (15:30–17:30)

| # | Filename | Template | Variant | Duration | Script Moment | v5 Note |
|---|----------|----------|---------|----------|---------------|---------|
| 26 | title-section-chips.json | TitleTransition | section | 2s | "V. Your Chips" | — |
| 27 | decisiontree-ai-timeline.json | DecisionTree | — | 12s | Fast AI → controls work / Slow AI → controls backfire | ✏️ NEW (was framework-ai-timeline.json, +2s) |
| 28 | route-bifurcation.json | RouteAnimation | — | 12s* | Supply chain splits into US + China networks | — |

Beat 5 motion graphics: 26s (+2s from DecisionTree hold extension)

---

### Closing

| # | Filename | Template | Variant | Duration | Script Moment |
|---|----------|----------|---------|----------|---------------|
| 29 | title-endcard.json | TitleTransition | end-card | 6s | "THE SILICON TRAP / 硅陷阱" + CTA |

---

## Template Count (v5)

| Beat | Title | Kinetic | Chart | TimeSeries | Framework | GameBoard | DecisionTree | Choropleth | Route | Timeline | Total |
|------|-------|---------|-------|------------|-----------|-----------|-------------|------------|-------|----------|-------|
| Opening | 1 | — | — | — | — | — | — | — | — | — | 1 |
| 1. Paradox | 1 | 2 | 1 | — | — | — | — | — | — | — | 4 |
| 2. Denial | 1 | 1 | 1 | — | 1 | — | — | 1 | — | 1 | 6 |
| 3. Wall | 1 | 3 | 1 | 1 | 1 | — | — | — | — | — | 7 |
| 4. Trap | 1 | 2 | — | — | — | 2 | — | 1 | 1 | — | 7 |
| 5. Chips | 1 | — | — | — | — | — | 1 | — | 1 | — | 3 |
| Closing | 1 | — | — | — | — | — | — | — | — | — | 1 |
| **Total** | **7** | **8** | **3** | **1** | **2** | **2** | **1** | **2** | **2** | **1** | **29** |

v4→v5 template changes: −2 DataChart, −3 FrameworkDiagram, +1 TimeSeriesChart, +2 GameBoard, +1 DecisionTree = net +1 composition (chess/go split from 1 file to 2)

## v5 Change Summary

| Change | Old File | New File(s) | Impact |
|--------|----------|-------------|--------|
| Chess/Go → GameBoard | framework-chess-go.json | gameboard-chess.json + gameboard-go.json | Purpose-built game boards replace text comparison |
| AI timeline → DecisionTree | framework-ai-timeline.json | decisiontree-ai-timeline.json | Animated branching tree replaces flow diagram |
| SMIC yield → TimeSeriesChart | chart-smic-yield.json | timeseries-smic-yield.json | Trend line replaces bars for time-series data |
| Revenue deal → conflict | kinetic-revenue-deal.json | (updated in place) | backgroundTint #E5A544 → #C23B22 (symmetric treatment) |
| 92% YIELD → layered | kinetic-92-yield.json | (unchanged — assembly-level) | Composited over cleanroom footage |
| $165B → layered | kinetic-165b.json | (unchanged — assembly-level) | Composited over Arizona aerial |

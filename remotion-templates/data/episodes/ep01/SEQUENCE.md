# EP01 — THE SILICON TRAP
## Composition Sequence Map

> Defines the render order for all 24 Remotion compositions.
> Each clip is a standalone MP4 asset placed on the NLE timeline alongside narration audio and B-roll.
>
> Total motion graphics runtime: ~203 seconds (~3:23)
> Episode narration runtime: ~18 minutes
> The gap between these numbers is intentional — motion graphics overlay narration, they don't replace it.

---

### Opening

| # | Filename | Template | Variant | Duration | Composition ID | Script Moment |
|---|----------|----------|---------|----------|----------------|---------------|
| 01 | title-episode.json | TitleTransition | episode-title | 5s | TitleTransition | Episode open — "The Silicon Trap" |

---

### Beat 1 — The Paradox (0:00–3:00)

| # | Filename | Template | Variant | Duration | Composition ID | Script Moment |
|---|----------|----------|---------|----------|----------------|---------------|
| 02 | title-section-act1.json | TitleTransition | section | 3s | TitleTransition | "I. The Paradox" section card |
| 03 | choropleth-reshoring.json | ChoroplethMap | — | 14s* | ChoroplethMap | TSMC Arizona fab, US reshoring effort |
| 04 | kinetic-7pct.json | KineticTypography | statistic | 5s | KineticTypography | "7% of US chip demand" — $165B invested |

Beat 1 motion graphics: 22s

---

### Beat 2 — The Logic of Denial (3:00–7:00)

| # | Filename | Template | Variant | Duration | Composition ID | Script Moment |
|---|----------|----------|---------|----------|----------------|---------------|
| 05 | title-section-denial.json | TitleTransition | section | 3s | TitleTransition | "II. The Logic of Denial" section card |
| 06 | timeline-oil-chips.json | TimelineComparison | — | 13s* | TimelineComparison | 1941 oil embargo vs 2022 chip controls |
| 07 | chart-export-controls.json | DataChart | bar | 7s | DataChart | Export controls across 3 administrations |
| 08 | framework-cocom-china.json | FrameworkDiagram | comparison | 12s | FrameworkDiagram | COCOM vs China — why denial may not work |

Beat 2 motion graphics: 35s

---

### Beat 3 — The Other Side of the Wall (7:00–12:30)

| # | Filename | Template | Variant | Duration | Composition ID | Script Moment |
|---|----------|----------|---------|----------|----------------|---------------|
| 09 | title-section-wall.json | TitleTransition | section | 3s | TitleTransition | "III. The Other Side of the Wall" |
| 10 | kinetic-kabozi.json | KineticTypography | definition | 8s | KineticTypography | 卡脖子 — "stranglehold technology" |
| 11 | chart-pen-contrast.json | DataChart | bar | 7s | DataChart | The ballpoint pen paradox |
| 12 | kinetic-juguo.json | KineticTypography | definition | 8s | KineticTypography | 举国体制 — "whole-nation system" |
| 13 | chart-lithography.json | DataChart | comparison | 8s | DataChart | SMIC 34 passes vs EUV 9 passes |
| 14 | chart-kirin-teardown.json | DataChart | comparison | 6s | DataChart | Kirin X90 — marketing 5nm vs actual 7nm |
| 15 | timeline-deepseek.json | TimelineComparison | — | 9s* | TimelineComparison | DeepSeek R1 triumph vs R2 reality check |

Beat 3 motion graphics: 49s

---

### Beat 4 — The Trap (12:30–15:30)

| # | Filename | Template | Variant | Duration | Composition ID | Script Moment |
|---|----------|----------|---------|----------|----------------|---------------|
| 16 | title-section-trap.json | TitleTransition | section | 3s | TitleTransition | "IV. The Trap" |
| 17 | framework-chess-go.json | FrameworkDiagram | comparison | 12s | FrameworkDiagram | Chess vs Go — two strategic traditions |
| 18 | route-chip-supply.json | RouteAnimation | — | 18s* | RouteAnimation | A single chip touches 6 countries |
| 19 | choropleth-supply-chain.json | ChoroplethMap | — | 21s* | ChoroplethMap | Global chip supply chain — who controls what |
| 20 | kinetic-morris-chang.json | KineticTypography | quote | 7s | KineticTypography | "Globalization is almost dead" — Morris Chang |
| 21 | choropleth-bifurcation.json | ChoroplethMap | — | 15s* | ChoroplethMap | The bifurcation — two ecosystems forming |

Beat 4 motion graphics: 76s

---

### Beat 5 — Your Chips (15:30–17:30)

| # | Filename | Template | Variant | Duration | Composition ID | Script Moment |
|---|----------|----------|---------|----------|----------------|---------------|
| 22 | title-section-chips.json | TitleTransition | section | 3s | TitleTransition | "V. Your Chips" |
| 23 | chart-chips-everywhere.json | DataChart | bar | 7s | DataChart | Chips in everyday devices — car, phone, hospital |

Beat 5 motion graphics: 10s

---

### Closing

| # | Filename | Template | Variant | Duration | Composition ID | Script Moment |
|---|----------|----------|---------|----------|----------------|---------------|
| 24 | title-endcard.json | TitleTransition | end-card | 6s | TitleTransition | CTA + "Next: The Rare Earth Gambit" |

---

## Duration Notes

Durations marked with * are calculated from phase/event data, not a flat `durationSec`:

| File | Calculation | Result |
|------|-------------|--------|
| choropleth-reshoring | 3 phases: 4+4+5 = 13, +1s buffer | 14s |
| timeline-oil-chips | max(4,4) events × 2.5s/event + 3s | 13s |
| timeline-deepseek | max(2,2) events × 3s/event + 3s | 9s |
| route-chip-supply | 4 phases: 4+4+4+5 = 17, +1s buffer | 18s |
| choropleth-supply-chain | 4 phases: 5+5+5+5 = 20, +1s buffer | 21s |
| choropleth-bifurcation | 3 phases: 4+5+5 = 14, +1s buffer | 15s |

## Template Count by Beat

| Beat | Title | Choropleth | Route | Timeline | Chart | Kinetic | Framework | Total |
|------|-------|------------|-------|----------|-------|---------|-----------|-------|
| Opening | 1 | — | — | — | — | — | — | 1 |
| 1. Paradox | 1 | 1 | — | — | — | 1 | — | 3 |
| 2. Denial | 1 | — | — | 1 | 1 | — | 1 | 4 |
| 3. Wall | 1 | — | — | 1 | 3 | 2 | — | 7 |
| 4. Trap | 1 | 2 | 1 | — | — | 1 | 1 | 6 |
| 5. Chips | 1 | — | — | — | 1 | — | — | 2 |
| Closing | 1 | — | — | — | — | — | — | 1 |
| **Total** | **7** | **3** | **1** | **2** | **5** | **4** | **2** | **24** |

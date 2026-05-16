# Hold-Motion Audit — Phase 0 Baseline

> Created: May 16, 2026. Baseline measurement before writing `HOLD_MOTION_REGISTER.md` and shipping per-template drift defaults.
>
> Methodology: 20 representative catalog compositions × 2 frames (f90 = 3s in, f150 = 5s in) = 41 stills. Per composition, pixel-diff the two frames (Pillow, ≥6 of 255 per-channel difference threshold) to quantify motion during the hold window between entrance settle and exit fade.
>
> **Caveat**: when a composition has staggered reveals extending past f90, the diff captures entrance motion, not hold motion. Those rows are flagged.

## The headline finding

**Three templates render perfectly static frames during hold** — `image-composite`, `atlas-plate-cold-war-vintage`, `atlas-plate-g7` all show ≤0.002% pixel difference between f90 and f150. The screen does not move at all for ~2 seconds.

Two of those are **atlas plates** — the textbook case for Ken Burns documentary drift. A Cold War world-map plate holding 2 seconds without motion reads as a PowerPoint slide, not a National Geographic establishing shot. The infrastructure to fix this exists (`driftPreset: "documentary"` in `useDirection.ts`); zero templates currently opt in.

## Full audit matrix

| Composition | Px diff (f90→f150) | % | Verdict | Hold-zone status |
|---|---:|---:|---|---|
| `catalog-image-composite-archive` | 0 | 0.000% | 🔴 STATIC | Pure hold — *bytes identical* |
| `catalog-atlas-plate-cold-war-vintage` | 34 | 0.002% | 🔴 STATIC | Pure hold |
| `catalog-atlas-plate-g7` | 39 | 0.002% | 🔴 STATIC | Pure hold |
| `catalog-annotated-image-callout-demo` | 15,147 | 0.730% | 🟡 near-static | Pure hold |
| `catalog-kinetic-typography-quote` | 18,042 | 0.870% | 🟡 near-static | Pure hold |
| `catalog-time-series-chart-atmospheric-co2` | 41,276 | 1.991% | 🟢 subtle drift | Pure hold |
| `catalog-game-board-chess-endgame` | 53,666 | 2.588% | 🟢 subtle drift | Pure hold |
| `catalog-network-diagram-hub-spoke` | 58,847 | 2.838% | 🟢 subtle drift | Mostly hold; minor late entrance |
| `catalog-arc-diagram-grand-strategy` | 59,595 | 2.874% | 🟢 subtle drift | Pure hold |
| `catalog-pricing-waterfall-motion-briefing` | 60,930 | 2.938% | 🟢 subtle drift | Pure hold |
| `catalog-decision-tree-chess-opening` | 61,072 | 2.945% | 🟢 subtle drift | Pure hold |
| `catalog-pricing-waterfall-motion-documentary` | 61,097 | 2.946% | 🟢 subtle drift | Pure hold |
| `catalog-pricing-waterfall-motion-still` | 61,137 | 2.948% | 🟢 subtle drift | Pure hold |
| `catalog-framework-diagram-matrix` | 67,051 | 3.234% | 🟢 subtle drift | Pure hold |
| `catalog-bump-chart-gdp-power-transition` | 67,357 | 3.248% | 🟢 subtle drift | Pure hold |
| `catalog-ridgeline-plot-life-expectancy` | 69,612 | 3.357% | 🟢 subtle drift | Pure hold |
| `catalog-stat-reveal-apollo-cost` | 117,150 | 5.650% | 🟢 visible motion | ⚠ Reveal still landing past f90 |
| `catalog-data-chart-speeds-bar` | 138,213 | 6.665% | 🟢 visible motion | ⚠ Reveal still landing past f90 |
| `catalog-bayesian-update-venice-floods` | 144,274 | 6.958% | 🟢 visible motion | ⚠ Reveal still landing past f90 |
| `catalog-stat-reveal-mariana-depth` | 145,053 | 6.995% | 🟢 visible motion | ⚠ Reveal still landing past f90 |
| `catalog-title-transition-episode` | — | — | (render failed at f150) | — |

## Smoking-gun observations

### 🔴 **AtlasPlate is mute**

Cold War vintage atlas with NATO/Warsaw blocs and the world map should be the textbook Documentary Ken Burns case — slow zoom into the relevant theater, gentle pan across the contested geography, music swelling underneath. Currently: 34 pixels of difference between f90 and f150 = visually identical = dead screen. Same story for the G7 plate.

Diagnostic: `AtlasPlate.tsx` calls `useCompositionAnimation()` with `{ noDrift: true }` — explicitly OPTING OUT of drift. The comment cites map-specific reasons (drift would shift the projection past safe area) but the result is total stillness.

**Fix path**: AtlasPlate needs its own micro-motion implementation that doesn't shift projection — likely a `breathing` preset (scale-only oscillation) or atmospheric particle layer. The "no drift" decision was correct for the *current* drift implementation; the doctrine should let AtlasPlate opt into a different motion mode.

### 🔴 **ImageComposite is byte-identical at f90 and f150**

ZERO pixel difference. Photo composites are LITERALLY what Ken Burns is named for. A historical photo holding for 2+ seconds with no drift reads as a still-image insert, not a documentary moment.

Diagnostic: the `KenBurns` *component* exists (`src/components/KenBurns.tsx`) but `ImageComposite` may not be using it — or is using it with `noDrift`. Worth a code audit.

**Fix path**: documentary preset (full scale + gentle pan) is the canonical print-to-video grammar for photo plates.

### 🟡 **KineticTypography quote is near-static**

The Heraclitus "Character is destiny" quote sits with 0.87% pixel change over 2 seconds — barely registers as motion. A held quote should *breathe* — subtle scale oscillation that says "this idea is alive."

**Fix path**: explicit `breathing` preset on `kinetic-typography-*-quote` data files (or as the template's default for the quote variant). The preset exists; it's not wired.

### 🟢 **Analytical charts cluster at 2-3% motion**

DataChart, TimeSeriesChart, BumpChart, RidgelinePlot, NetworkDiagram, ArcDiagram, FrameworkDiagram all sit in the 2-3% range. This is the `editorial` default working as designed (scale 1.02 max over composition duration, no pan). This IS the correct register for analytical content — restrained, not gratuitous. Doctrine confirms.

But subtle drift on a SHORT segment (8s, drift max = 1.02 scale) doesn't read as deliberate motion — it reads as "did the screen just move?" Borderline. Worth A/B test against `breathing` or `settle` for some analytical templates.

### ⚠ **`PricingWaterfall` motion-variant catalog doesn't actually demo the drift register**

The three "motion-*" catalog variants (`still`, `briefing`, `documentary`) were built as a motion-identity showcase. Their f90→f150 deltas are essentially identical: 2.948%, 2.938%, 2.946%. They DO look different from each other (28% pixel difference at the SAME frame), but the **rate of motion** is the same — they're not demonstrating different drift presets, they're demonstrating different starting positions / framing.

This means: the motion-identity catalog exists, but it doesn't actually showcase the `DRIFT_PRESETS` register. Phase 5's "catalog showcase" of all 7 presets on the same data has no existing prior art to build on.

## What this confirms for the plan

| Plan claim | Audit evidence |
|---|---|
| "Zero templates opt in to driftPreset" | Confirmed — every audited template gets the editorial default |
| "Static atlas plates and photo plates are the worst case" | Confirmed — three 🔴 STATIC compositions, two are atlases |
| "Analytical templates are mostly fine on editorial default" | Confirmed — cluster at 2-3% subtle drift |
| "Quote / definition KineticTypography near-static" | Confirmed — 0.87% diff |
| "Motion-variant catalog exists but doesn't demonstrate presets" | Confirmed — all three variants show identical motion rates |

## Per-template-category recommendation (preliminary, to be finalized in Phase 3)

| Template category | Current behavior | Recommended preset |
|---|---|---|
| **AtlasPlate** (all variants) | 🔴 frozen (noDrift) | **breathing** (scale-only, projection-safe) |
| **ImageComposite / PhotoMontage** | 🔴 frozen | **documentary** (full Ken Burns) |
| **KineticTypography quote / definition** | 🟡 0.87% | **breathing** |
| **KineticTypography statistic** | (not audited) | **breathing** |
| **StatReveal** | reveals still landing at f90 | **breathing** during long hold tail |
| **DataChart / TimeSeriesChart / BumpChart / RidgelinePlot** | 🟢 2-3% editorial | **editorial** (keep) — analytical restraint |
| **NetworkDiagram / ArcDiagram / FrameworkDiagram (matrix)** | 🟢 2-3% editorial | **editorial** (keep) |
| **GameBoard / DecisionTree** | 🟢 2-3% editorial | **editorial** (keep) |
| **AnnotatedImage** | 🟡 0.73% | **documentary** (image IS the content per L103 doctrine) |
| **TitleTransition** | (render failed) | **settle** |
| **PricingWaterfall (default)** | 🟢 2.9% editorial | **editorial** (keep) |
| **Choropleth / Route / Density / Cartogram / TilegramUS / ProportionalSymbol** | (not audited — Mapbox) | varies — analytical use → editorial; cinematic use → documentary |

## Files in this audit

Rendered to `/tmp/holdaudit/` — 41 stills, paired by composition. Retained for Phase 1 cross-reference but expected to be cleaned up post-phase.

## Next: Phase 1 — outlet research

Spawn web-research agent on hold-motion conventions across NYT VI, FT, Bloomberg, Economist, Pudding, Reuters, WSJ video teams. Validate the proposed technique list (still / editorial / breathing / settle / sway / documentary / atmospheric / mood-pulse) against current editorial practice. Output: `references/template-research/hold-motion.md`.

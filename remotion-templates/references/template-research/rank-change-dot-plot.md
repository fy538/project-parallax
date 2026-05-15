# RankChangeDotPlot — Research Dossier

> Created: May 15, 2026. Research compiled from primary sources (Bloomberg Graphics, Financial Times, The Economist, Pew Research Center, Alberto Cairo); integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## TL;DR

**Two columns of dots (Before / After) connected by horizontal lines; sorted by magnitude of change (largest movers first); highlighted entities in full color + bold label, others muted to 45% opacity. Light-mode only. 3–20 items. Before-dot appears, line draws left-to-right, after-dot appears — sequential per entity with 80ms stagger. The story is always about who rose and who fell.**

---

## 1. The form's editorial purpose

RankChangeDotPlot earns its rectangle when **a policy, event, or shift has changed who's winning and who's falling in an ordered system, and the argument requires showing which specific entities moved and by how much**. The viewer's takeaway should be: *"before this event, X was here; after it, X is there — and the slope tells me whether to cheer or worry."* Use it when the narration uses the language of winners and losers, risers and fallers, displacement and consolidation.

Differentiated from DataChart (which shows magnitude values at a point in time, not movement between two points) and from TimeSeriesChart (which shows continuous change over many time points, not a before/after comparison). The dot plot's power is its visual encoding of *both* the before-state and the after-state and the *movement* between them in one compact row per entity.

### When not to reach for it

| Alternative | When it wins over RankChangeDotPlot |
|---|---|
| **DataChart** | The argument is "who is largest right now," not "who moved." You have one time point, not two. |
| **BumpChart** | You have four or more time points and the trajectory matters, not just the two endpoints. |
| **StatReveal** | The argument is one number (the hero mover) and a few comparisons; fewer than 4 entities. |
| **ChoroplethMap** | The ranked entities are geographic and their spatial relationships matter. |

**RankChangeDotPlot's superpower fires when:** a policy change, election outcome, or structural shift has a clear "before" (pre-policy baseline) and "after" (post-policy state), and the argument is about which entities were the beneficiaries vs. the casualties.

---

## 2. Canonical idioms

### a. Bloomberg "slope chart"

Two labeled columns (before / after) with a dot at each rank and a line connecting them; the slope's direction and steepness encode rank change. Bloomberg Graphics uses this consistently for "winners and losers" policy stories: trade war tariff impacts on export rankings, tech regulation effects on company valuations, post-pandemic labor market displacement. Bloomberg's house style: entity names at both ends of the line (before-end left-aligned, after-end right-aligned), color encoding the direction of movement (blue for improvement, red for decline).

*Works because:* the eye reads slope direction and steepness almost pre-attentively — steep upward slope = dramatic rise, steep downward slope = dramatic fall. *Fails when:* many entities move in the same direction at similar magnitudes — the slopes cluster into a parallel sheaf and direction/magnitude become indistinguishable. The `sortBy: "change"` default in the template mitigates this by surfacing the largest movers first.

### b. FT "league table change"

Same slope-chart form but with flags or icons at each dot for country identification; used for international rankings (trade competitiveness, innovation indexes, semiconductor supply chain dependencies). FT's house style adds a thin center column between the two dot-columns where a small numerical delta is annotated ("↑ 12 places") for entities that are the editorial focus.

*Works because:* country flags solve the disambiguation problem when entities have similar names. *Fails at video speed:* small flags and delta annotations in the center column are illegible at scrub speed. The template's `highlightIds` approach (bolder label + larger dot + full color) is the correct video adaptation.

### c. The Economist "Up/Down" sidebar

Compact 5–8 entity slope chart; labeled at both ends; no connecting line (the gap itself is the story); used for quarterly rankings of competitiveness, business-climate, or corruption indexes. The Economist's version omits the line when the before/after values are close — the dot pair implies the connection. For Parallax, the animated line draw (strokeDashoffset animation) is the editorial beat that says "the connection was not given — it was earned by the policy."

*Works because:* extreme compression — 8 entities, 2 columns, no connecting lines. *Fails when:* entities have large rank gaps (10+ places) — without the connecting line, the reader can't track which before-dot pairs with which after-dot.

### d. Pew Research "Before/After" dot plot

Dots at both time points on a single shared axis; change shown as a horizontal segment between the two dot positions. Used by Pew for survey data where the absolute position along the scale matters more than the rank. Pew's version uses the horizontal axis as a continuous scale (not two discrete columns), so the segment's position on the axis carries absolute meaning.

The template's two-column design (before at 30% of chart width, after at 70%) follows this Pew idiom more than the FT/Bloomberg idiom: the dots are at fixed x-positions rather than at rank-sorted y-positions. This means the template encodes absolute value (position along the common horizontal scale of ranks or values), not just direction.

*Works because:* position along a common scale is the #1 perceptual encoding in Cleveland & McGill's hierarchy. *Fails when:* the scale is logarithmic — Pew and the template both use linear positioning, which compresses small-value entities.

### e. Parallax use case: power-transition arguments

Geopolitical use case: semiconductor market share rankings pre- and post-export controls; SIPRI military expenditure rankings before/after a conflict; container shipping rank by port before/after trade route disruption. The before/after framing maps cleanly to the geopolitical "pivot event" narrative: "before the Chips Act, Taiwan and South Korea dominated; after, the US position improved while China's fell."

The `isRankData: true` default (lower = better, rank 1 is best) is correct for ranking use cases. `isRankData: false` (higher = better) covers value use cases like market share percentages or export volumes where the "before" and "after" values are measured quantities rather than ordinal ranks.

---

## 3. General principles

The slope chart's perceptual power comes from the eye's automatic tracking of line direction and slope steepness — a pre-attentive feature that fires before conscious reading. This means the chart's argument registers in 300ms or less if the slopes are legible, which makes it well-suited to video where the viewer cannot control pace.

But the form has a critical failure mode when all entities move in the same direction: the slopes form a visual broom (parallel lines sweeping in the same direction) and individual identity is lost. The `highlightIds` mechanism is the editorial solution: choose 1–3 entities that are the narration's protagonists and mute the rest.

Tufte's note on the slope chart (*The Visual Display of Quantitative Information*, 1983): "The relative slopes of the connected pairs are the main visual structure. The slopes should be the dominant visual element, not the dots." This means dots should be small enough that the lines are the primary reader, not the other way around. The template's dots (6px default, 8px highlighted) achieve this correctly.

**POLISH D5 (hero hierarchy) applies:** the protagonist entity (the one the narration names) must be visually dominant. `highlightIds` gives it: full color, 600–700 weight label, 8px dot radius, glow filter, after-value annotation with delta "(+12)". Everything else dims to 45% — present as context, invisible as noise.

---

## 4. Recommendation for Parallax

**Default:** sort by `"change"` (largest absolute delta first), 5–15 entities, 1–3 highlighted via `highlightIds`, remainder at 45% opacity.

**Layout:** the template's fixed geometry (before at 30% of chart width, after at 70%) puts the "action zone" (the gap between columns) in the visual center of the chart. This is correct — the eye should land on the slopes, not the column headers. The label column (0–chartLeft range) gives entity names in right-aligned text; the after-column gives values and delta annotations for highlighted entities.

**Column headers:** `beforeLabel` and `afterLabel` (e.g., "2018" and "2025") are mandatory for temporal comparisons. For policy-event comparisons, use descriptive labels: "Pre-Chips Act" and "Post-Chips Act." These appear at the top of their respective dot-columns in Plex Mono uppercase 600 weight.

**Color encoding:**
- `isRankData: true` (default): improvement = rank number goes down. Color: `palette.gold` for improvement, `semantic.china` (rust) for decline, `palette.walnut` for no change. This matches the template's `resolveColor()` logic.
- `isRankData: false`: improvement = value goes up. Same color logic, direction flipped.
- Named geopolitical actors should override auto-coloring via `item.color`: US positions in `semantic.us` (blue), China positions in `semantic.china` (rust).

**Duration:**
- 5–8 entities: `durationSec: 6–8`. Animation finishes at `sec(0.6) + N × sec(0.08) + sec(0.5) + sec(0.35)` ≈ 2–3s; rest of duration is the hold.
- 10–15 entities: `durationSec: 10–12`.
- Use `holdAfterRevealSec` to add a deliberate pause after the last entity animates.

**Attribution:** `source` is always required for ranking data, which invariably comes from a named index (SIPRI, World Bank, TSMC market share reports, etc.). The template renders source via `<SourceAttribution>`.

**`unit` field:** include when the values are not ranks but measured quantities — "billions USD," "percent share," "annual shipments." Appears in `FooterStrip` scale annotation.

---

## 5. Current template alignment

- ✅ Animation sequence: label fade → before-dot scale-in → line draws left-to-right via strokeDashoffset → after-dot scale-in — matches the "earned connection" editorial convention
- ✅ 80ms item stagger (`sec(0.08)`) — dense but legible per POLISH A3
- ✅ `highlightIds` mechanism: larger dot (8px), 700-weight label, accent glow filter, after-value with delta "(+N)" — POLISH D5 hero hierarchy correct
- ✅ Muted items at 45% opacity (`isMuted` branch) — supporting context without noise
- ✅ `sortBy` options: `"change"` (default), `"after"`, `"before"`, `"label"` — editorial flexibility
- ✅ `isRankData` flag: correct color direction for rank vs. value data
- ✅ `resolveColor()` handles semantic aliases ("up"/"down"/"neutral") and literal hex/palette strings
- ✅ `warnIf` fires for >20 items (too dense) and <3 items (too sparse, use StatReveal)
- ✅ `<SourceAttribution>` with `prefix: "Source: "` and `startSec: 2` — standard attribution pattern
- ✅ `<TitleBlock>` with `safeAreaTier: "generous"` — POLISH L13 compliant
- ✅ `unit` rendered in FooterStrip `scale` prop
- ⚠️ Light-mode only — `useThemeMode("light")` is hardcoded, ignoring `data.backgroundVariant`. Dark-mode slope charts have editorial precedent (Bloomberg's "dark canvas" style) and some Parallax use cases (power rankings in a crisis context) call for the dark register.
- ⚠️ After-value annotation positioned below the after-dot (`rowY + dotRadius + 14`) — this may collide with the next row's before-dot at small row heights (when N > 12).
- ⚠️ Before-value annotation always visible for all items including muted ones (at 50% opacity). At 15+ entities, the canvas becomes numerically noisy with 15 before-values and 15 after-values visible simultaneously.
- ❌ No horizontal grid lines or background Y-axis marks — this is correct per the "slopes are the story" principle, but POLISH A4 (structure → data → labels) is partially violated: there is no "structure" phase before items animate in. A brief axis-line entrance (thin rules at before-X and after-X) would give the viewer the coordinate system before entities populate it.
- ❌ No per-item tooltip or hover state — not relevant for Remotion's frame-based render, but a "callout annotation" option (like ArcDiagram's apex labels) for 1–2 highlighted entities would let the narration call out a specific delta explicitly without relying on the after-value annotation's small text.

---

## 6. Specific upgrades proposed

1. **`backgroundVariant` support.** Remove the hardcoded `useThemeMode("light")` and pass `data.backgroundVariant` to enable dark-mode rendering. Bloomberg's dark-canvas slope charts are editorially valid for crisis/conflict contexts. Effort: small; impact: opens a register currently unavailable. **(low effort / medium impact)**

2. **Column-line structure entrance.** Add a brief entrance animation for two thin vertical rules at `beforeX` and `afterX` (e.g., lines grow from top to bottom over 300ms at frame 0, before any items enter). This implements POLISH A4 (structure first) and gives the viewer the coordinate system before the data populates it. Effort: small; impact: eliminates the current "dots appear on a blank canvas" start. **(low effort / medium impact)**

3. **After-value annotation collision guard.** When `rowHeight < 32`, suppress the after-value annotation for non-highlighted items (it's redundant for muted items anyway). When `rowHeight < 20`, suppress all value annotations and show only dot + line. Effort: small; impact: prevents numeric noise at high entity counts. **(low effort / medium impact)**

4. **`calloutAnnotation` for highlighted entities.** Optional per-item `annotation?: string` field that renders a small text callout (in Plex Mono, 12px, muted color) adjacent to the after-dot for highlighted entities. Complements the delta annotation ("(+12)") with editorial commentary ("first time in G7 top 3"). Effort: small; impact: makes the political interpretation explicit without requiring a separate KineticTypography composition. **(low effort / medium impact)**

5. **`isRankData` auto-detection from data.** If all `before` and `after` values are integers between 1 and N (where N = `data.items.length`), auto-set `isRankData: true`. If any value is non-integer or exceeds N, default to `false`. Removes a common authoring error where `isRankData` is omitted and the color encoding reads backwards. Effort: small; impact: removes a latent correctness bug. **(low effort / medium safety impact)**

---

## 7. Failure mode flags (always catch in audit)

- **No `highlightIds`** — every entity at equal visual weight reads as a co-occurrence map, not as an argument. Choose 1–3 protagonist entities and set `highlightIds`. The narration names them; the chart should highlight them.
- **`sortBy: "label"` for power-ranking arguments** — alphabetical ordering destroys the "largest movers first" editorial logic. Sort by `"change"` unless the narration explicitly discusses the alphabetical sequence.
- **Wrong `isRankData` setting** — with `isRankData: true` (rank mode), a delta of +5 means the entity fell 5 positions. With `isRankData: false` (value mode), +5 means the entity improved by 5 units. Mismatched settings make all color coding read backwards. Always verify against the data's actual semantics.
- **>20 entities** — the template warns; audit must enforce. At 20 entities with 8ms stagger, the entrance animation runs 1.6s and the canvas is numerically dense. Filter to top-N movers.
- **<3 entities** — the template warns; redirect to StatReveal for single comparisons.
- **Before-value and after-value at similar positions** — entities that barely moved produce near-vertical lines (or flat horizontal lines at the same Y). These are noise; they communicate "no story here." Filter them out or mute them explicitly unless their stasis IS the story ("China held its position despite sanctions").
- **Missing `source`** — ranking data always comes from a named source. SIPRI, World Bank, IDC, TrendForce, Bloomberg supply chain data. No exceptions.
- **Geopolitical actors without semantic colors** — US positions should use `semantic.us` blue; China positions should use `semantic.china` rust. Using auto-categorical colors for named geopolitical actors loses the semantic layer that the whole color system is built on.

Last updated: May 15, 2026

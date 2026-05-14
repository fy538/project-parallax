# TilegramUSMap — Research Dossier

> Equal-size hex tiles for US-state data. The form for "every state weighs the same."
>
> Last updated: May 14, 2026

## 1. The form's editorial purpose

Reach for a tilegram when **the unit of analysis is the state (or province, or constituency) and every unit should carry equal visual weight**. The choropleth's structural lie — that Wyoming's 580,000 residents matter ~70× more than Brooklyn's 2.6M because Wyoming is bigger on the page — is exactly what an electoral, legislative, or per-state-policy story needs to escape. Tilegrams answer *"how is this distributed across the states, treating each state as one unit?"*

Decision rules:
- **Per-state rate or share, geography matters** → ChoroplethMap (Albers projection)
- **Per-state count where states should weigh equally** → TilegramUSMap ✓
- **Per-state count where bigger-states-mattering-more is the point** (e.g., GDP totals) → ProportionalSymbolMap or Dorling cartogram
- **Sub-state geography (congressional districts, counties)** → not this template; tilegrams can't resolve below state
- **Non-US country with state/province-level data** → no canonical hex tilegram for most countries; fall back to ChoroplethMap

The tilegram's editorial superpower is *democratizing the visual budget* — each state gets exactly one hex, and the only thing that varies is the fill. Its failure modes: viewers who don't know US geography get disoriented, and any story that depends on adjacency (border crossings, regional waves, spillover effects) is broken because the hex layout is only loosely topological.

## 2. Canonical idioms

### a. NPR-style hex tilegram, postal-abbreviation labels
The convention everyone else descended from.
- **NPR Visuals 2015** — Tyler Fisher's "Let's Tesselate: Hexagons For Tile Grid Maps" (blog.apps.npr.org) and the open-source hex-grid SVG that shipped with their 2014 midterm coverage. The 8×12 layout used by every US tilegram since traces to this file.
- **FiveThirtyEight (recurring, 2016–)** — election forecasts, state-level polling deltas, Senate maps. Reusable hex layout, postal codes inside.
- **The Washington Post 2020 / 2024** — election-night state-call hex maps in the live results dashboard.

*Works because:* viewers learn the layout in two seconds (the L-shape of New England in the top-right, Texas + Florida at the bottom corners), and once learned it's a calmer read than the geographic map under the same conditions.
*Fails when:* designers redraw the layout per-project — the form's legibility depends on it being the *same* hex layout the reader has seen a hundred times.

### b. Tilegrams (Pitch Interactive / Google News Lab, 2016)
Generated tilegrams where the hex count per state is proportional to a chosen variable (population, electoral votes, GDP). California becomes a 55-hex blob; Wyoming becomes 3 hexes.
- **Pitch Interactive / Google News Lab 2016** — pitchinteractive.com/tilegrams, open-sourced tool + gallery; the canonical reference for "tilegrams" as a named technique.
- **Bloomberg Graphics 2016** — used the Pitch tool's electoral-vote variant for 2016 election explainers.

*Works because:* it splits the difference between cartogram (data-sized) and tilegram (equal-sized) — every hex weighs the same, and the *number* of hexes per state encodes the variable.
*Fails when:* used for any story that's not population / electoral-vote / GDP-shaped. The hex count is fixed by the layout, so you can't re-encode for a new variable without regenerating the geometry.

### c. UK hex constituency map (650-cell version)
- **The Guardian 2015 / 2017 / 2019** — UK general-election hex maps, one hex per of 650 constituencies, swing colored.
- **Bloomberg / The Economist 2015** — UK election coverage using the ODI / Open Data Institute hex layout.
- **BBC Visual Journalism 2019** — same hex grid, used for live results.

*Works because:* the geographic UK map is dominated by rural Scottish and Welsh constituencies; the hex grid restores one-constituency-one-cell democracy. Adopted by every major UK outlet within four years of the first NPR-style US version — strong cross-cultural validation of the form.
*Fails when:* viewers conflate hex-grid adjacency with real adjacency. Annotators must label cities and regions, or readers lose the map entirely.

### d. Square tile / "waffle" grid variants
- **The New York Times 2016** — used a square-tile US state map for the live election-night dashboard (the famous needle page).
- **Reuters Graphics (recurring)** — square-tile US state maps for "all 50 states show…" rate stories.

*Works because:* squares pack into rectangular layouts more cleanly than hexes — fits a sidebar or 16:9 frame without negative-space waste. Reads slightly more like a table than a map, which can be a feature for legislative stories.
*Fails when:* the editorial register is geographic at all — square tiles read as "spreadsheet," hex tiles read as "map." Pick by tone, not just packing efficiency.

### e. Multi-hex split-state (district resolution)
- **NPR / Tilegrams.org community variants (2018–)** — congressional-district tilegrams where ME, NE, and the larger states fracture into one hex per district (435 + DC for the House; or 538 for full electoral split).

*Works when:* the story is district-level — gerrymandering, House races, electoral-college splits (ME-02, NE-02). *Fails when:* used for whole-state stories — the visual noise of 435 hexes drowns out the state-level pattern.

## 3. General principles

- **The form's argument is the equality.** A tilegram is not a "small-multiples-friendly map" or a "low-fidelity choropleth." It's a *visual rebuke* to area-as-importance. Don't betray it by adding state-name labels sized by population, or by tinting the background with terrain.
- **Topology matters; geography doesn't.** New England should stay clustered. The Mountain West should stay clustered. But Wyoming-next-to-Colorado is enough; you don't need Wyoming's centroid in the right hemisphere of its hex.
- **Pointy-top vs. flat-top is a typography decision.** Pointy-top hexagons stack into wider-than-tall rows, which suits a 16:9 frame; flat-top hexagons stack taller. Postal abbreviations (2 characters) read better inside pointy-top tiles because the horizontal flat sides give the text room.
- **The label inside the tile is non-negotiable.** Even readers who know the US perfectly read postal codes faster than they recognize state shapes at thumbnail size. The label is what makes the form scannable.
- **Diverging palette for partisan / above-vs-below stories, sequential for intensity stories.** Same rule as choropleth. A diverging tilegram with no meaningful midpoint is a categorical map in disguise — use distinct colors instead.
- **Sub-state and district-level data can't be represented honestly.** ME-02 and NE-02 split electoral votes in real elections; a state-resolution tilegram aggregates them into the statewide majority. If the split matters to the story, you need a district-resolution variant — or a footnote.

## 4. Recommendation for Parallax

**Default form:** NPR-style 8×12 hex grid, pointy-top hexagons, postal abbreviation in IBM Plex Mono inside each tile, optional 3-4 char numeric sub-label (electoral votes, rank, count), horizontal gradient legend strip beneath the grid.

**Palette:** diverging variant uses `semantic.china` (muted rust) ↔ `palette.bone` (midpoint) ↔ `semantic.us` (muted blue) — the channel's standard partisan/comparison colorway. Sequential variant uses `palette.bone` → `palette.gold`. Tiles for states omitted from the data render in the mode-appropriate neutral (`palette.sand` light, `palette.midnight` dark) — distinguishable from the lowest active bin.

**Defaults beyond color:**
- Always render all 50 states + DC, even when data is partial. The form's promise is the full outline.
- Postal-code labels always on; secondary numeric labels opt-in via `label?` per state.
- Source attribution + value-label caption above the gradient swatch.
- Top-to-bottom row stagger entrance (`rowStagger ≈ sec(0.12)`) — the editorial point is "the country reveals itself"; column jitter is texture, not narrative.
- No terrain, no coastline, no state borders behind the tiles. The form is abstract; geographic chrome dilutes it.

## 5. Current template alignment

`TilegramUSMap.tsx` (initial, May 2026):

| Canon | Implemented? | Notes |
|---|---|---|
| NPR 8×12 layout, postal labels | ✓ | Hand-encoded `HEX_GRID` matches the canonical NPR/538 arrangement; AK + ME at the top corners, TX + FL at the bottom. |
| Pointy-top hexagons | ✓ | Odd-row horizontal stagger via `pos.row % 2 === 1`; vertical pitch = `1.5 * s`. |
| Diverging color scale | ✓ | `colorScale: "diverging"` auto-derives symmetric `±absMax` and routes through `semantic.china` ↔ `palette.bone` ↔ `semantic.us`. |
| Sequential color scale | ✓ | `colorScale: "sequential"` bone→gold ramp. Default. |
| Object-form color scale | ✓ | `{ min, max, low, mid?, high }` for full editorial control. |
| Per-state color override | ✓ | `state.color` bypasses the scale (used for "highlight this one" treatments). |
| Numeric sub-label | ✓ | `state.label` — 3–4 char ceiling enforced editorially, not in the type. |
| Full outline always rendered | ✓ | Iterates `ALL_STATE_CODES`, not `data.states`. Missing states get the neutral. |
| Top-to-bottom row stagger entrance | ✓ | `rowStagger = sec(0.12)`, column jitter `sec(0.02)`. |
| Horizontal gradient legend strip | ✓ | SVG `linearGradient` with 2 or 3 stops; min/mid/max tick labels in Plex Data. |
| Auto-contrast tile text | ✓ | `hexToLuminance` threshold at 0.55 → bone vs. ink. |
| Source attribution + value-label caption | ✓ | `SourceAttribution` + `valueLabel` above the swatch. |
| District-resolution split (ME-02 / NE-02) | ✗ | Sample data aggregates split states to statewide majority; documented in `index.tsx`. Out of scope v1. |
| Square-tile variant | ✗ | Not implemented. Out of scope unless an episode needs the "spreadsheet" register. |
| Classed (binned) legend | ✗ | Currently a continuous gradient. Editorial canon prefers 5 discrete bins for sequential variables — see upgrade #1. |

## 6. Specific upgrades proposed

Ranked by effort/impact:

1. **Classed legend option** (~1 hr). Reuse `quantileBreaks` from `src/utils/quantileBins.ts`. Add `legendStyle?: "gradient" | "classed"` with 5-bin quantile default for sequential data. Brings the tilegram into alignment with the choropleth dossier's classed-beats-unclassed rule (`choropleth-map.md` §3).
2. **Per-state annotation callouts** (~half day). Optional pin-and-label callout for 2-3 narrated states (e.g., "Pennsylvania flipped — 19 EV"). Should hook into `map-annotations.md` conventions so all map templates share annotation vocabulary.
3. **District-resolution variant** (~1-2 days). Optional `resolution: "state" | "district"` with a 538-cell layout (state-EVs as hex clusters) for genuine electoral-college stories — captures ME-02 / NE-02 honestly. Tilegrams.org has a published 538-hex layout in the public domain.
4. **Two-phase comparison** (~half day). `phases?: TilegramPhase[]` so the same grid can morph between two snapshots (e.g., 2020 vs. 2024 result, pre-policy vs. post). Tile colors cross-fade; postal labels stay.
5. **Square-tile mode** (~1 hr). `tileShape?: "hex" | "square"`. Tonal pivot to "legislative spreadsheet" — useful for the rare Parallax episode that's more table than map. Reuse the same `HEX_GRID` coordinates; just swap the polygon renderer.

## 7. Failure mode flags (always catch in audit)

- TilegramUSMap used for a story where geographic adjacency matters (border crossings, regional epidemic waves, fugitive interstate routes). Use ChoroplethMap with Albers.
- TilegramUSMap used for a single-region story ("the South," "the Rust Belt"). Use a real-geography map.
- Diverging color scale on data with no meaningful midpoint (e.g., "states by sanction count"). Use sequential.
- Sequential scale on diverging data (election margin, change-since-baseline). Use diverging.
- Empty-state fill indistinguishable from the lowest active bin — viewer can't tell "no data" from "low value."
- District-level claim ("ME-02 flipped") rendered on state-resolution layout without a footnote that the split is aggregated.
- Postal-code labels missing or styled in display font — drops the form's "scannable at thumbnail" promise. Always Plex Mono, uppercase.
- Custom hex-grid layout that diverges from the NPR canon for no editorial reason — burns the viewer's learned-layout reflex for nothing.
- Terrain, coastline, or state-border decoration behind the tiles — the form is abstract by argument; geographic chrome contradicts it.

## TL;DR

**NPR 8×12 pointy-top hex grid, postal labels in Plex Mono, diverging rust-bone-blue for partisan stories and bone-to-gold for intensity, full 50+DC outline always rendered, top-to-bottom row stagger entrance.**

## References

- Fisher, T. (2015). "Let's Tesselate: Hexagons For Tile Grid Maps." NPR Visuals blog. The canonical write-up of the US hex layout.
- Pitch Interactive / Google News Lab (2016). Tilegrams (pitchinteractive.com/tilegrams). Tool + gallery; named the form.
- The Guardian / Bloomberg / Economist UK election coverage (2015, 2017, 2019). 650-hex constituency maps.
- The Washington Post / FiveThirtyEight (recurring, 2016–). US state hex maps for election and polling coverage.
- Tilegrams.org. Community gallery of hex / square / Dorling tilegrams for US, world, EU, congressional district.
- US Census Bureau (recurring). State-population cartograms and hex-style data products.

Last updated: May 14, 2026

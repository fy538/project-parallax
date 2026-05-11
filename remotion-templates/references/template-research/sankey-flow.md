# SankeyFlow — Research Dossier

> Created: May 10, 2026. Research delegated to web-research agent; integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## 1. The form's editorial purpose

A Sankey earns its rectangle on screen when **conservation is the argument**. The viewer's takeaway should be: *"this total had to go somewhere, and look where it went."* Width-encoded ribbons let the eye compare proportions at a glance, and the closed system (Σ inputs = Σ outputs) is the rhetorical move — it forecloses the audience's instinct that "well, maybe the rest is somewhere else."

### When *not* to reach for it

| Alternative | When it wins over Sankey |
|---|---|
| **PricingWaterfall** | Decomposing a single fixed denominator the viewer already owns ($1, $100, one iPhone). PricingWaterfall reads as "argument," Sankey reads as "infographic." |
| **Stacked bar** | Comparison across time of the same decomposition (energy mix 1990 vs 2024). Sankey is one snapshot. |
| **Simple flow chart / FrameworkDiagram flow** | No quantity — only sequence or causation. Sankey with equal-width ribbons is a tell. |
| **NetworkDiagram** | Flows loop back, branch chaotically, or structure is the point. Sankey demands a left-to-right DAG. |

**Sankey's superpower fires when:** multiple destinations of unequal size from a conserved source, AND the editorial point depends on the viewer feeling the *ratio*. "70% of all plastic ever made is still in landfill or environment" only lands because the ribbon to "discarded" dwarfs the ribbons to "recycled" and "incinerated."

## 2. Canonical idioms

### a. Conservation Sankey — Lawrence Livermore style
- **LLNL** annual US Energy Flow Chart (1970s–present; the genre-defining reference)

Sources stacked left (petroleum, natural gas, coal, nuclear, renewables), end-uses stacked right (residential, commercial, industrial, transportation), with **rejected energy** as a giant grey terminal sink — the rhetorical kill shot, because rejected ≈ 2/3 of total. *Works because:* one accent for the embarrassing fact (waste), muted earth tones for everything else, no extra chrome. *Failure mode:* LLNL's chart has 40+ nodes — readable as a poster, illegible at 1080p video scale. Always reduce.

### b. Where-the-money-goes
- **USAFacts** / **NYT** federal budget Sankeys

Total revenue (left) splits into spending categories (right), often with a thin "deficit" ribbon flowing in from off-canvas to make inputs balance. *Works because:* total is a number the audience already half-knows; the surprise is the ratio. *Failure mode:* >12 destinations becomes a directory, not an argument.

### c. Supply-chain / material-flow
- **Bloomberg** lithium supply chain (2023)
- **Geyer et al. 2017** global plastics (reproduced by Bloomberg / Our World in Data — the source of Parallax's existing "plastic fate" demo)

Left-anchor single source, intermediate processing stages, terminal fates. Multi-column. *Works because:* the *intermediate convergence* (multiple ore sources collapsing to a few refineries) is itself the geopolitical point. *Failure mode:* if you don't have real conserved tonnage, it's a process diagram in costume.

### d. Left-anchor decay / cohort funnel
- **Minard's 1869 Napoleon march** — the form's ancestor

One ribbon starts thick, loses mass to attrition at each stage. *Works because:* every drop in thickness is a fact. *Failure mode:* without geographic or temporal anchoring, this is just a tapered triangle.

### e. Many-to-one convergence (reverse Sankey)
N sources → 1 sink. Used for "where China's rare-earth refining capacity comes from." Visually inverts the standard but uses the same machinery. *Failure mode:* viewers expect L→R divergence; signal the reversal with the title.

## 3. Treatment conventions

- **Nodes:** thin colored bars (12–24px wide), not boxes. Width is non-informational — height carries the value. Sort within column by value descending.
- **Ribbons:** filled S-curves between source's right edge and target's left edge, control points at horizontal midline. Use a **gradient** from source-color to target-color when both ends carry meaning. For Parallax's accent-driven palette: only the editorially loaded ribbon takes accent rust; all others stay in walnut/umber/taupe.
- **Labels:** name + value on the node, never on the ribbon (ribbons curve, ribbons cross, ribbon labels fail). Reserve a single in-frame callout for the load-bearing ribbon.
- **Small flows:** aggregate anything <3% into "Other," explicitly. Never render unreadable hairlines.
- **Conservation cue:** show the source total once (top-left), let column totals visibly equal it. If there's leakage (rounding, "unaccounted"), label it — don't hide it.

## 4. Recommendation for Parallax

**Default:** **3-column conservation Sankey** — one source on the left, 2–4 intermediate stages, 3–6 terminal fates. Hard cap at ~10 visible nodes.

**Palette:**
- Earth-tone palette across non-emphasized ribbons (umber / taupe / sand)
- **Single accent rust** on the load-bearing flow only (the ribbon the narration names)
- Source attribution bottom-right via existing `SourceAttribution`

**Style:**
- Gradients OFF by default — at 8–12s scrub speed and muted palette, solid ribbons with one accent reads cleaner than rainbow gradients
- Reserve `flowParticles` for cinematic mode only (≥6s hold, atmospheric register)

## 5. Current template alignment

The existing `SankeyFlow` template, after our session's polish work:
- ✅ Chart pulled up (removed redundant offset)
- ✅ Duplicate source attribution removed
- ✅ Node bars 14→18px (correct per canon)
- ✅ Exit-fade overlay bug fixed
- ✅ Catalog variant: `plastic-fate` (Geyer et al. 2017 source)
- Currently uses per-node `color` from data — could allow per-link emphasis
- No explicit "Other" aggregation

## 6. Specific upgrades proposed

1. ~~**`Other` aggregation flag.** Schema option to auto-roll-up flows <3% of total into "Other" terminal. Prevents unreadable hairlines.~~ **Done — May 11, 2026.** Shipped as `data.aggregateOther: { threshold, label, color }`. Default threshold 0.03 (3%). Identifies terminal-column nodes whose total incoming flow is below threshold × grandTotal, merges them into a single "Other" terminal, and aggregates the inbound links per source. Runs as a pre-layout preprocessing step.
2. ~~**Per-link emphasis field.** Add `emphasis: "accent" | "muted"` per link so visual-spec can promote one ribbon without hardcoding colors. Default: muted for all, accent on the load-bearing flow.~~ **Done — May 11, 2026.** Shipped as `link.emphasis?: "accent" | "muted"`. When ANY link declares `"accent"`, others recede to 0.35 opacity unless they're also accents. Lets visual-spec promote the load-bearing flow without per-frame color overrides.
3. ~~**Column header labels.** Optional `columnHeaders?: string[]` ("Production / Fate") to make conservation framing explicit at the top of each column.~~ **Done — May 11, 2026.** Shipped as `data.columnHeaders?: string[]`. Catalog sample `plastic-fate` now uses `["Produced", "Use vs. Discarded", "Fate"]` — the eye reads the three-stage budget at a glance.
4. ~~**Source-total kicker.** Display the source total ("8.3K Mt produced 1950–2017") as a prominent kicker top-left so the conservation total is named, not implied.~~ **Done — May 11, 2026.** Shipped as `data.sourceTotal?: { value: string; context?: string }`. Renders in Plex Sans display weight + amber, top-left of chart area. Catalog `plastic-fate` reads "8.3K Mt — global plastic produced, 1950–2017."
5. ~~**`flowParticles` deprecation note.** Decorative animation along ribbons — only enable in cinematic mode (sustained holds). Lint or document this.~~ **Done — May 11, 2026.** Documented inline on `flowParticles` field in `types.ts` as **CINEMATIC-MODE ONLY**. Rationale: "particles are decorative animation that makes a held composition feel alive; they are NOT analytical signal." Cross-references POLISH.md A1 (elements should hold after revealing) — particles violate that rule on purpose to add atmosphere; use only when atmosphere is what the moment needs.

## 7. Failure mode flags (always catch in audit)

- **Decorative use, no conservation point** — if narration doesn't invoke a total, it's the wrong template
- **Spaghetti** — >10 nodes or >15 ribbons at video resolution; >2 visible crossings per column gap
- **Unreadable hairlines** — any ribbon under ~6px on a 1080p frame
- **Mixed units** — flows measuring different things (dollars + headcount) make width meaningless
- **No source attribution on a conservation claim** — every Sankey is a quantitative assertion; needs a citation
- **Equal-width ribbons** — data isn't actually flowing; use FrameworkDiagram
- **Rainbow palette / one-color-per-node** — defeats editorial hierarchy; Parallax should never have >2 ribbon colors active
- **Cycles or back-flows** — Sankey is a DAG; if data loops, switch to NetworkDiagram
- **Tiny ribbon to "other" that's actually >20% of total** — sorted-by-value rule violated

## TL;DR

**3-column left-anchor conservation Sankey, thin 18px ink node bars, solid earth-tone ribbons, single accent-rust emphasis on the editorially load-bearing flow, named values on nodes only, visible source line — the LLNL skeleton wearing the Parallax palette.**

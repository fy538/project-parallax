# PricingWaterfall — Research Dossier

> Expanded from stub: May 15, 2026. Template built May 10, 2026. Companion dossiers: [`sankey-flow.md`](./sankey-flow.md), [`framework-diagram.md`](./framework-diagram.md). Update when new outlet conventions are observed.

## 1. The form's editorial purpose

PricingWaterfall earns its frame when **the editorial argument is about where value is captured in a chain, not merely how a price is composed**. The key word is *capture*: the form exists to make visible the disproportion between who does the work and who takes the margin. "3% to the farmer, 47% to the retailer" is an argument about power and extraction, not just accounting. The fixed total ($1, $5, $100) is the perceptual anchor — the amount the consumer pays, which the viewer already accepts as real. Against that anchor, each stage's share encodes the editorial argument: the sliver for the primary producer is the form's entire point.

Distinct from **SankeyFlow** (which encodes flows between multiple sources and multiple sinks — the topology of exchange, not the decomposition of a fixed total; reads as "infographic" rather than "argument" at video scrubbing speed) and from **FrameworkDiagram flow** (which has no value math, just sequence logic). Also distinct from a stacked bar chart: the waterfall is built around a *single* fixed denominator, not a comparison of two or more totals. The form does not work when the stages are not parts of the same whole — if stage shares don't sum to ~100, the visual silently misrepresents.

### When *not* to reach for it

| Alternative | When it wins over PricingWaterfall |
|---|---|
| **SankeyFlow** | Value flows between many sources and many sinks (trade networks, migration, energy flows). No fixed total; the proportions between different paths are the point. |
| **FrameworkDiagram (flow)** | Stages are sequential actors in a process, but there is no value-math — no shares that sum to 100. |
| **DataChart (grouped bar)** | Comparing decompositions across multiple products, years, or countries — more than one "total." |
| **TimeSeriesChart** | Showing how stage shares have changed over time — a time dimension the waterfall can't encode. |

**The waterfall's superpower fires when:** the viewer already holds the denominator in their head, there is one editorially loaded stage (the hero sliver), and the argument is about *who captures* value in a chain — not just how a price breaks down.

## 2. Canonical idioms

### a. FT "iPhone cost breakdown" — fixed denominator, horizontal orientation, hero on retailer margin

**Financial Times** "Where your iPhone money goes" (2012, 2016, 2022 editions) — the canonical Western editorial form for consumer-goods decomposition. Fixed denominator ($999 retail), stages from left (raw materials) to right (Apple margin and retail). The accent color lands on the editorially loaded stage — in the FT's argument about Apple's margin power, that is the Apple profit slice, not the TSMC manufacturing cost. Above the bar, a reference rule shows the full retail price; each stage is labeled with the actor's name and share percentage.

*Works because:* the fixed $999 denominator is the viewer's existing mental anchor — they already know what an iPhone costs. Every stage is measured against the denominator they hold, not against the adjacent stage. Horizontal orientation reads left-to-right as "journey from raw material to you." *Fails when:* more than ~7 stages are shown — slivers become unreadable; the hero sliver disappears among adjacent details.

Note: the FT uses **horizontal** orientation. The Parallax template uses **vertical** orientation by default (bottom-up, building through the chain). Vertical is more legible in 16:9 video at portrait-text scrubbing speed; horizontal is better for print / web where width is not constrained.

### b. Bloomberg Opinion "oil / cocoa decompositions" — vertical waterfall, % annotation on every segment

**Bloomberg Opinion** commodity breakdowns (oil price decomposition, 2019 and 2022; cocoa pricing, 2023) and **Bloomberg Businessweek** supply-chain margin analysis. Vertical waterfall variant: each stage is a bar segment growing downward, with the total at top as a starting reference. Bloomberg adds a `% of total` annotation on **every** segment (not just the hero), giving viewers the full accounting before the hero is highlighted. The hero segment renders in accent color with a callout box; Bloomberg often adds an editorial annotation: "The cocoa farmer received only 6.6% of the retail price."

*Works because:* showing percentages on every segment lets the viewer verify that the chart accounts for 100% of the total before accepting the hero sliver as the editorial argument. Bloomberg's annotation convention builds analytical credibility. *Fails when:* every segment has a callout of equal visual weight — the hierarchy flattens and no segment reads as the editorial argument.

### c. Reuters cocoa pricing (2023 series) — farmgate vs. retail differential, sector callout

**Reuters Graphics** "The price of chocolate" (2023) — the canonical form for supply-chain inequality stories. Farmgate price (what the Ghanaian or Ivorian farmer receives) vs. retail price (what the European or American consumer pays) across the cocoa-to-chocolate chain. Reuters uses a vertical waterfall with an explicit "farmgate share" callout isolated in a separate annotation box, stated as both percentage and absolute value. The hero is always the farmgate sliver — the form's argument is the gap between producer share and retail price.

*Works because:* the Reuters framing is explicitly a justice argument, not merely a decomposition. The form supports this by making the farmgate sliver the visual protagonist — even if it is not the smallest segment, it is marked `hero` because it carries the editorial argument about value capture at the source. *Fails when:* the callout language is passive ("cocoa farmers receive...") rather than relational ("cocoa farmers receive [X]% while retail takes [Y]%") — the relational framing makes the disproportion visible.

### d. Specialty Coffee Association / Fair Trade USA penny-breakdown — horizontal "penny bar"

**Specialty Coffee Association** "Unpacking Coffee Prices" reports (2014–2023) and **Fair Trade USA** visual communications: a single 100-cent (or "$1") bar divided into labeled segments. The SCA form is often rendered as a single wide horizontal bar — the "penny bar" — with segment widths proportional to share and actor names printed inside or below each segment. The Fair Trade variant adds a bold orange highlight on the farmgate segment, often with the annotation "$0.09 of your $5 latte."

*Works because:* the 100-cent or "$1" denominator is maximally relatable — everyone can calculate "9 cents of a dollar." The horizontal orientation works for the SCA's print / web materials; the "of every $5 cup" kicker in the Parallax template adapts this idiom to video's vertical layout. *Fails when:* the bar has too many segments — the penny bar at 8+ segments becomes a stained-glass window, not an argument.

### e. Perceptual rationale — Cleveland's position-along-a-common-scale

**William Cleveland & Robert McGill** ("Graphical Perception," *Journal of the American Statistical Association*, 1984) established position along a common scale as the most accurately perceived encoding for ordered quantities. The PricingWaterfall uses this correctly: all segments share the same vertical scale anchored to the `total` reference bar, so each segment's share can be read against the same scale as all others. **Sankey is the runner-up** but has no common scale — link widths are read as proportion of their local throughput, not of a fixed total, so viewers must mentally rebase. For a value-capture argument ("what fraction of $5 goes to the farmer"), the Sankey introduces a calculation step the waterfall eliminates.

This is why the template's vertical orientation with a fixed reference bar is not merely an aesthetic choice — it is the perceptually optimal encoding for the "what fraction" argument. The FT's horizontal orientation is the same encoding rotated; choose based on the canvas constraint, not aesthetics.

## 3. General principles

The PricingWaterfall makes its editorial argument through **two simultaneous readings**: (i) the numerical share printed next to each segment, and (ii) the visual height of each segment against the fixed reference bar. Both readings must agree — if the segments don't sum to ~100%, the visual height encoding gives a different answer than the numerical labels, and the viewer loses trust in the chart. This is the form's primary data-integrity constraint.

The hero segment's editorial function is to serve as the argument's protagonist: the stage the narration stakes its claim on. Bloomberg and Reuters converge on one hero per chart. When all segments receive equal visual treatment (same muted color, same label size, same leader line weight), the form becomes pure accounting — it describes the chain without making an argument about it. The form's rhetorical power depends entirely on the viewer being able to identify the hero within 2 seconds of the chart appearing on screen.

Actor labels (who captures the stage) are more legible and more editorially powerful than category labels (what cost type the stage represents). "TSMC (fabrication)" names an agent with choices and power; "Manufacturing cost" names a category that implies inevitability. The Parallax register — geopolitical analysis that names agents and their decisions — requires actor labels.

## 4. Recommendation for Parallax

**Default orientation:** Vertical (bottom-up), the template default. The bar builds upward from origin (farm, mine, factory) to destination (consumer, government, margin), matching the editorial reading "value accumulates as the product travels." Horizontal orientation would require a template variant; use the vertical default for all supply-chain arguments.

**Stage label convention:** The `label` field should name the *actor*, not the *cost category*:
- "TSMC (fabrication)" not "Manufacturing cost"
- "Ghanaian cocoa farmer" not "Farmgate cost"
- "Apple (design + IP)" not "Corporate overhead"
- "UK Treasury (VAT)" not "Tax"

The viewer needs to know *who captures* each stage. The actor framing turns a decomposition into an argument about power and agency — the Parallax register exactly.

**Hero selection:** Always exactly one `hero: true` stage. The hero should be the stage the narration makes the claim about — not necessarily the smallest, but the editorially loaded one. For supply-chain inequality stories, the hero is usually the farmgate/factory stage (the smallest sliver). For margin-extraction stories, the hero is the platform/retailer stage (the largest sliver). The editorial argument determines the hero, not the segment size.

**Hero color:** The hero renders in the episode-wide `primaryAccent` color (resolved by `useEpisodeColorEmphasis`, which defaults to `palette.amber`). Do not use `palette.rust` as the hero color unless the episode's argument is explicitly about exploitation, conflict, or harm — rust reads as a warning/conflict signal in the Parallax palette. For inequality stories, amber is the correct accent.

**Stage count:** Target **4–6 stages** for geopolitical supply-chain arguments. Fewer than 4 loses analytical nuance (the chain becomes a binary). More than 6 loses legibility (the hero sliver becomes invisible among adjacent segments). The template warns at >7 stages.

**Total label:** The `total.value` / `total.label` pair is mandatory. The denominator the viewer holds in their head IS the form's perceptual anchor. Generic totals ("100 units," "total value") destroy the anchor. Use real quantities the viewer already knows: "$999 iPhone," "$5 cup of coffee," "$1 of cocoa retail price," "every tax dollar." The kicker renders as "of every · [value] · [label]" in the composition.

**Source citation:** Always provide `source` when the breakdown cites real data. PricingWaterfall is a quantitative-claim form; uncited, it reads as invented numbers. Even for illustrative breakdowns ("approximate shares"), a source citation signals that the proportions are grounded in research.

**Duration:** `durationSec: 8–12` for most uses. The bar builds over ~1.5 seconds (staggered from bottom); labels and leaders appear in the following 1 second. Hold time should be long enough for the viewer to read the hero share and two adjacent shares.

## 5. Current template alignment

The existing `PricingWaterfall` template (`src/templates/PricingWaterfall/`):

- Vertical orientation, bottom-up — matches the recommended default. Stages render from origin (index 0, at bar bottom) to destination (last index, at bar top).
- `warnIf` fires for: multiple hero stages, shares not summing to ~100% (tolerance ±5%), and >7 stages. These cover the three primary data-integrity failures.
- Hero glow halo — a subtle amber glow rect behind the hero segment, slightly wider and taller than the segment itself. This is the accent-segment's visual protagonist treatment; it reads cleanly in both light and dark backgrounds.
- Leader lines with kinked paths — when a label must be stacked away from its segment center (to avoid label collision on small segments), the leader bends at the bar edge, creating a kinked path from segment centroid to label. This is the correct behavior — straight leaders from offset labels look detached.
- Label stacking with `minLabelGap: 56px` — the stacking algorithm enforces a minimum 56px gap between label centers, then checks overflow and shifts the entire stack upward if needed. This is the correct approach for handling the 3% farmgate sliver whose visual segment is only ~16px tall.
- `total` object renders as a horizontal kicker above the bar: "of every · [value] · [label]." The value renders in `fontSizes.display` (large, the anchor) with the label in italic body text. This matches the Bloomberg/SCA convention of making the denominator prominent.
- `useEpisodeColorEmphasis()` for accent color — the hero segment color resolves through the episode-wide color emphasis hook rather than being hardcoded. This is the correct pattern; it lets episodes where `primaryAccent` is `palette.rust` (conflict episodes) use rust for the hero without a data-file override.
- **Diverges from canon (minor):** no `% of total` annotation on every segment (Bloomberg convention). The template shows `share%` and the `label` next to each segment but does not separately display "of the total" framing. For most Parallax use cases this is acceptable; for decompositions where the share math needs to be verifiable, consider adding a subtitle annotation: "Shares of [$total.value]."
- **No explicit horizontal orientation mode.** The FT and SCA horizontal "penny bar" idiom cannot be rendered without a template variant. Document as a gap; build when an episode needs it.
- `motionIdentity` field is supported — allows substrate-motion preset (grain + atmosphere + wobble) to be configured per composition. The default is the channel-wide "briefing" preset; cinematic supply-chain sequences can specify a more atmospheric preset.

## 6. Specific upgrades proposed

1. **`% of total` label mode — `showPercentOfTotal?: boolean`.** An opt-in annotation on every segment displaying `[share]% of [total.value]` as a sub-label (e.g., "9% of $5"). Implements the Bloomberg "full accounting" convention and lets viewers verify the decomposition without doing mental arithmetic. Effort: small; impact: medium for complex decompositions with many small segments. **(small effort / medium impact)**

2. **Horizontal orientation variant — `orientation: "horizontal" | "vertical"` (default `"vertical"`).** The FT iPhone breakdown and SCA penny bar use horizontal. Useful for shorter compositions (less vertical space needed), for data stories where left-to-right reading reinforces the "journey" framing, and for Shorts (9:16) where a horizontal bar fills the frame more efficiently than a vertical one. Effort: medium (requires layout re-derivation for the horizontal case); impact: medium — adds the canonical FT form. **(medium effort / medium impact)**

3. **Actor-label format validation in `warnIf`.** Soft warning when any `stage.label` matches common category-label patterns (ends in "cost," "costs," "overhead," "fee," "expenses," "margin" without parenthetical actor). Encourages the actor-label convention without enforcing it. Effort: trivial; impact: small but catches the most common editorial register failure. **(trivial effort / small impact)**

4. **`total.reference` annotation on bar.** Optional reference line at the top of the bar labeled with `total.value`, matching the FT convention of showing the full price as a reference rule above the decomposition. Currently the kicker label floats above the bar without a visual anchor connecting it to the bar's top edge. Effort: small; impact: small but tightens the perceptual connection between the kicker and the bar. **(small effort / small impact)**

5. **`palette.rust` for exploitation stories — `heroEmphasis: "conflict" | "standard"`.** Currently the hero color resolves through `useEpisodeColorEmphasis`, which may be `palette.amber` or `palette.rust` depending on episode configuration. Add explicit `heroEmphasis` to the data schema so visual-spec writers can control the semantic register: `"conflict"` forces `palette.rust` (for tariff-extraction, forced-labor supply chain, or sanctions arguments); `"standard"` forces `palette.amber` (for fair-trade or inequality arguments). Effort: small; impact: medium — makes the color semantic explicit rather than delegated to an episode-level hook. **(small effort / medium impact)**

## 7. Failure mode flags (always catch in audit)

- **No stage marked `hero: true`** — the editorial argument is missing. The waterfall becomes a neutral accounting chart: description without argument. Every PricingWaterfall composition must have exactly one hero stage. The template does not currently warn for ZERO heroes (only for multiple) — catch manually.

- **Multiple `hero: true` stages** — the template warns. Focal hierarchy destroyed; both highlighted segments compete and neither reads as the argument. Only the editorially loaded stage gets hero treatment.

- **Shares not summing to ~100%** — the template warns at deviation >5%. If stages sum to 95% or 110%, the visual height encoding is internally inconsistent: the bar's physical height represents a different total than the segment labels claim. Fold rounding residuals into the largest non-hero stage or add a labeled "Other / residual" terminal stage.

- **Category labels instead of actor labels** — "Manufacturing cost" instead of "TSMC (fabrication)." Describing cost types rather than actors removes the agency and power-capture dimension that makes the form an *argument* rather than an accounting chart. Catch in script review before data files are written.

- **Generic `total.label`** — "100 units of value," "total price," "full cost." The form depends on the viewer holding the denominator in their head; abstract denominators destroy the anchor. Require real quantities: "$5," "$999," "$1 of cocoa retail."

- **Too many stages (>7)** — the template warns. Slivers become visually indistinguishable from each other; the hero sliver loses its distinctiveness against adjacent equally-thin neighbors. Merge small adjacent stages: "Shipping + customs" rather than "Shipping" and "Customs" separately.

- **Decorative color overrides on multiple stages** — using `stage.color` on 3+ non-hero stages to color-code by actor region or cost type. This destroys the muted-bone + hero-accent hierarchy. Reserve `stage.color` for at most one non-hero stage that carries secondary analytical weight (e.g., a "customs/tariff" slice in a trade-barrier argument). Everything else defaults to muted bone.

- **Missing `source`** — PricingWaterfall is a quantitative claim form. Uncited breakdowns read as invented numbers. Cite the primary source (FT, SCA, Reuters, USDA). Even for illustrative decompositions, name the basis: "Approximate shares based on SCA 2022 cost survey."

- **`palette.rust` hero on an inequality story** — rust signals conflict and harm in the Parallax palette. For fair-trade / farmgate-share arguments (the cocoa farmer, the coffee smallholder), use `palette.amber`. Rust is appropriate when the argument is explicitly about exploitation, forced labor, sanctions, or tariff extraction.

## TL;DR

**One hero stage, 4–6 stages total, actor labels (not category labels), shares summing to ~100%, `total` with a real-world denominator the viewer already knows. Vertical (bottom-up), bottom is origin, top is destination. Amber for inequality-argument heroes; rust only for conflict/exploitation. Cleveland's fixed-denominator scale makes this more legible than Sankey at scrub speed. The form's only point is the sliver — without a hero, there's no argument.**

Last updated: May 15, 2026

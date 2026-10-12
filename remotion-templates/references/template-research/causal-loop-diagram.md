# CausalLoopDiagram — Research Dossier

> Created May 19, 2026. The systems-thinking primitive for showing
> *that a sequence is actually a loop*.

## 1. The form's editorial purpose

The Causal Loop Diagram (CLD) is the canonical systems-thinking visualisation: nodes are variables in a system, polarised arrows show whether one variable's increase causes another's increase (+) or decrease (−), and closed cycles are labelled **R** (Reinforcing — self-amplifying) or **B** (Balancing — self-correcting). Reach for it when the editorial argument is *"this isn't a linear sequence — it's a feedback loop"*. The classic Parallax case is the security dilemma: arming for defence triggers the other side's defensive arming, which triggers ours, and the loop has no natural stop. Showing this as four sequential bullet points loses the argument entirely; showing it as R1 with a polarised cycle IS the argument.

## 2. Canonical idioms

**Polarised cycle (Senge / Sterman idiom).**
Nodes in roughly cyclic geometric arrangement (square / triangle / pentagon), curved arrows between them with `+` or `−` polarity badges near each arrowhead, an `R`/`B` badge with a rotating-arrow glyph at the loop centroid. Used by Donella Meadows's *Thinking in Systems* (2008), Peter Senge's *The Fifth Discipline* (1990), and most operations-research and policy-analysis publications since. Why it works: polarity-on-arrow keeps the influence direction visually local; loop-badge-at-centroid lets the reader count loops at a glance.
Failure mode: too many crossing arrows when nodes are crammed into a tight layout — the editorial reading degrades to "tangle of lines."

**FT "supply-chain feedback" variant.**
The Financial Times applies CLD geometry to supply-chain stories: rectangle nodes (firms / stages) with directional arrows annotated by `+` (volume increase) / `−` (shortage) and delay markers (`||`) on edges where the effect takes weeks/months. The FT consistently avoids the rotating-arrow glyph — they use static-arc-with-arrow for cleaner print. Recent reference: FT *"How sanctions feed back into US inflation"* (March 2024).
Failure mode: rectangular nodes read as "process step" not "variable" — readers want to interpret the arrow as "next step" rather than "influences." Circular nodes are clearer.

**Bloomberg / Economist "doom loop" headline panel.**
Single emphasised cycle, often only 3–4 nodes, no secondary edges, large bold loop badge with text label ("DOOM LOOP" / "DEATH SPIRAL"). Used in monetary-crisis explainers (Bloomberg, *"The European doom loop, explained"* 2011; Economist, *"China's property doom loop"* 2024). Why it works: the badge IS the headline; the editorial argument is "this is a self-amplifying mechanism" and the badge name carries it.
Failure mode: oversimplification — a real system usually has balancing loops too; the doom-loop framing can mislead by hiding equilibrating forces.

**Academic "stock-and-flow" hybrid.**
Adds rectangle (stock) and valve (flow) primitives alongside circles (auxiliary variables). Common in operations-research and ecology papers. Visually denser but more rigorous. Reference: *System Dynamics Review* journal articles, MIT Sloan teaching materials.
Failure mode: too much grammar for a 10-second editorial reveal. Reserve for academic/educational contexts.

## 3. General principles

The polarity sign on an arrow encodes a *directional* claim about causation, which Cleveland's perceptual hierarchy puts in the "categorical encoding" bucket — discrete, hard to ordinal-rank. The R/B classification is also categorical (two classes). So the form is fundamentally about *type* and *direction*, not magnitude — don't try to encode strength via line thickness or node size; that fights the form. Magnitude beliefs belong elsewhere (TimeSeriesChart, BumpChart, StatReveal).

Tufte's "data-ink ratio" applies: the loop badge is high data-ink (it IS the editorial argument) so it should dominate; the polarity badge is high data-ink (encoding direction) so it should be prominent; edge labels are low data-ink (descriptive, not argumentative) so they should recede or be omitted.

## 4. Recommendation for Parallax

Default to the **polarised cycle (Senge/Sterman idiom)** with the Bloomberg-style emphasised loop badge. Specifically:
- Circular nodes (variable-coded, not process-coded)
- Curved bezier arrows with `+`/`−` filled-disc polarity badges (gold for `+`, china-red for `−`)
- Filled-disc loop badge in the centroid, china-red for R loops, dustblue for B loops, with `R1`/`B2` text and a rotating arc indicating loop direction
- Delay marker (`||`) on edges for time-lag relationships (sanctions effects, military procurement, policy implementation)

The rotating-arc-on-badge IS the editorial argument that it's a loop, not a sequence — this is the single most important visual element of the form.

## 5. Current template alignment

`CausalLoopDiagram` ships with the recommended idiom: circular nodes, curved bezier arrows, polarity badges (filled disc with `+`/`−`), filled loop badge with rotating arc + ordinal id + narrative label. Delay-slash (`||`) markers supported via `edge.delay: true`. Authors place nodes manually in 0–100 percentage coords; no auto-layout (editorial composition IS part of the argument).

Diverges from the canon only by avoiding rectangular nodes entirely (the FT supply-chain variant is unsupported) — this is intentional: rectangular nodes read as "step", which is the misreading we want to prevent.

## 6. Specific upgrades proposed

1. **Loop centroid auto-rotation** (low effort, medium impact) — currently uses the signed-area of the polygon to pick `cw`/`ccw`. Add a flag for the rare case where the cycle order is counter-geometric (e.g., R1 = `[A,B,C,D]` but B comes before A clockwise). Manual `rotation: "cw"/"ccw"` override exists; just document it.
2. **Multi-loop visual disambiguation** (medium effort, high impact) — when two loops share a node, the polarity badges on shared edges currently belong to one or the other ambiguously. Add `loop.color` override so each loop's edges + badges can be tinted by membership.
3. **Auto-classify R/B by polarity count** (medium effort, low impact) — schema currently requires `type: "R" | "B"` declared explicitly. Could derive from edge polarities (even `−` count = R, odd = B). Editorial intent still wins (author can override), but the derivation catches authoring errors.
4. **Auxiliary variable nodes** (small text labels, not boxed) (low effort, low impact) — for intermediate explanatory variables that aren't part of the loop but inform it. Currently authors put a circle node and accept the visual weight. A `node.style: "auxiliary"` variant would render text-only.
5. **Stock-and-flow primitives** (high effort, low impact) — adds rectangle (stock) + double-arrow (flow) for academic register. Probably out of scope unless an episode specifically needs SD-style modelling.

## 7. Failure mode flags

- **Linear chain with no closed loop** → use `FrameworkDiagram` or `NetworkDiagram` instead. CLD without a loop is just a polarised graph; the loop badge is the form's entire purpose.
- **More than 2 loops in a single diagram** → split into multiple shots OR use camera-path zooms (future feature) to highlight one loop at a time. Two loops is comfortable; three crowds the eye.
- **Polarity ambiguity** ("this affects that, but the direction depends on context") → CLD has no native way to express this. Either pick the dominant polarity and footnote the exception, or use `DuelingFrameworks` to show both regimes.
- **Editorial argument is magnitude, not direction** → ("the loop is faster now than in 1990") — CLD encodes direction only. Pair with a TimeSeriesChart for the magnitude argument.
- **Static diagram with no narration / reveal sequence** → CLD's editorial power comes from sequential reveal (nodes → edges → loop badge). A still CLD reads as an academic figure. Always pair with narration that walks the loop.

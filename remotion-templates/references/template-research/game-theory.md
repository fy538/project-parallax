# Game-Theory Visualizations (DecisionTree + GameBoard) — Research Dossier

> Created: May 10, 2026. Research delegated to web-research agent; integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.
>
> This dossier covers two sub-forms used together in strategic-choice content. The prisoners-dilemma episode (launch candidate) is the first heavy consumer.

---

## A. DecisionTree

### A1. Editorial purpose

Use when the story is **sequential choice under uncertainty** — actor A moves, actor B responds, consequences cascade. Strong when the drama is *the branching itself* (Kennedy's ExComm weighing blockade vs. airstrike) or when probability weights matter (medical triage, escalation ladders).

**Wrong when:**
- Actors move *simultaneously* without observing each other → that's a payoff matrix
- Tree exceeds ~3 levels of depth with >2 branches each — cognitive load collapses past ~12 terminal nodes

### A2. Canonical idioms

**a. Horizontal extensive-form tree.** Root left, terminals right; nodes are circles (chance) or squares (decision); edges labeled with action + probability.
- **NYT Upshot** "Should You Get the Vaccine?" 2021 — COVID risk branching
- **FT** "The path Putin chose" Feb 2022 — escalation branches

*Works because:* reading direction maps to time. *Failure:* crowds at depth, branches become spaghetti.

**b. Allison-style nested rectangles** *(Essence of Decision, 1971; updated 1999)*. Each option (do nothing / diplomacy / secret approach / blockade / surgical strike / invasion) gets a panel with sub-consequences nested inside. **RAND** uses variants for nuclear-escalation ladders.

*Works because:* privileges the decision-maker's frame, not abstract probability. *Failure:* loses comparability across branches; harder to scrub.

> **Safe-count range (LadderVariant, May 2026 stress-test):** 4–7 options at typical label length (≤ 50 chars per option, one sentence per consequence). Above 7 options OR with long labels (60+ chars wrapping to 2 lines), the `overflow: hidden` content container in `DecisionTree.tsx` silently clips trailing options — they do not scroll, paginate, or shrink. Verified with a 10-option / 60-char stress build: only options 01–06 rendered fully; 07–10 were swallowed below the safe-area bottom with no visual indication.
>
> Allison's own ExComm framing is six options, which fits comfortably; if an episode needs ≥ 8 options, route to a different form (horizontal extensive-form tree with collapsed terminals, or split across two ladder slides on a `SplitComposition`) rather than fighting the layout. Don't try to scale option titles down below `fontSizes.body` — readability at scrubbing speed is the editorial constraint that defines the cap.

**c. Game-tree-with-payoffs (extensive form proper).** Terminal nodes show payoff pairs `(A, B)`. Used by **Stratechery** in platform-competition pieces and **Axelrod** for tit-for-tat illustrations.

*Works because:* unifies sequential and strategic logic — can foreshadow the matrix here. *Failure:* payoff pairs read as math, not narrative; needs hand-holding.

### A3. Treatment conventions

- **Node sizing:** uniform unless one branch is editorially loaded (the "actually chosen" path); then 1.3–1.5× and accent-colored
- **Branch styling:** chosen path in accent color and 2px weight; unchosen paths in ink at 30–40% opacity, 1px
- **Probabilities:** include only when (i) they come from a named source, (ii) the story is *about* uncertainty (Tetlock, Kelly betting). For Cuban Missile Crisis or chess openings, **show paths without numbers** — false precision is worse than no precision
- **Terminal payoffs:** small caption block beneath, not floating numbers. Plex Mono, 60% opacity unless hero
- **Hero terminal:** rust/oxblood underline or a paper-on-desk "circled in pen" treatment

### A4. Recommendation for Parallax

**Default:** horizontal extensive-form tree.
**Alternative:** Allison nested-rectangle when the episode is *about* a specific decision-maker's deliberation (ExComm, Politburo, boardroom).

Keep `chess-opening` variant for the literal chess case; add a `decision-ladder` variant (Allison-style) for ExComm-class moments. PD episode will use extensive form briefly to motivate the iterated game — single play → repeated play → Axelrod tournament.

---

## B. GameBoard / Payoff Matrix

### B1. Editorial purpose

Use when actors choose **simultaneously** (or as-if simultaneously — moves hidden until revealed) and the story is the *structure of mutual outcomes*. Right form for PD, Stag Hunt, Chicken, Battle of the Sexes, trade-war tariff games, climate-pledge games, nuclear MAD.

**Wrong when:**
- Sequence matters (use tree)
- >3 strategies per side make the grid unreadable (use heatmap or strategy-space plot)

### B2. Canonical idioms

**a. Classic 2×2 with payoff pairs.** Row player on left, column player on top, each cell shows `(row payoff, column payoff)`.
- **Economist** "The prisoners' dilemma of climate change" Nov 2021 (and recurring trade-war pieces)
- **Schelling** and **Axelrod** throughout their work

*Works because:* universal grammar; readers who've seen one have seen them all. *Failure:* numbers feel arbitrary unless anchored (years in prison, dollars, tons CO₂).

**b. Outcome-labeled 2×2 (no numbers).** Cells contain *named outcomes* — "Mutual cooperation," "Sucker's payoff," "Temptation," "Punishment."
- **Nicky Case** "Evolution of Trust" 2017
- **HBR** for managerial 2×2s

*Works because:* narrative-first, scrubs at 8 seconds. *Failure:* loses the *quantitative* asymmetry that makes PD specifically PD (T > R > P > S).

**c. Hybrid: outcome label + payoff pair + Nash glyph.** Cell shows name on top, payoffs bottom-right in mono, Nash equilibrium marked with a small therefore-symbol (∴) or accent border.
- **FT Visual Storytelling** sanctions-as-PD pieces 2022–23

*Works because:* all three registers (narrative / quantitative / analytical) in one cell. *Failure:* dense; needs hero-cell treatment to guide the eye.

### B3. Treatment conventions

- **Cell sizing:** uniform grid; never distort to "emphasize" — distortion reads as data manipulation
- **Nash equilibrium highlighting** — three editorial conventions:
  1. **Bold border** in accent color around the equilibrium cell
  2. **Small marker glyph** in corner (asterisk, ∴, or best-response arrowheads)
  3. **Best-response arrows** drawn from off-equilibrium cells pointing toward the deviation each player would make — the cell with arrows pointing *in from all directions* is the Nash

  The Economist favors (1) + (3). **Parallax's ∴ brand mark is perfect for (2).**

- **"This is the dilemma" callout:** the editorially loaded cell (mutual defection in PD) gets a second treatment layer — oxblood tint at 15–20% fill, hand-annotated label ("The trap") in the margin, paper-on-desk circled treatment.

- **Hero quadrant logic:**
  - Mutual cooperation in PD is often the *moral* hero (what they should have done) → bone fill + amber underline
  - Mutual defection is the *analytical* hero (what they will do) → oxblood border + ∴ glyph
  - Both get treatment, but distinct

- **Iterated / repeated play:** outlets handle this by:
  - **Showing the matrix twice** — "one shot" vs "shadow of the future" — with the equilibrium shifting visibly
  - **Small-multiples timeline** of matrix outcomes across rounds (Axelrod-tournament style)
  - **Nicky Case** animates state transitions

  For Parallax: small-multiples in the matrix register, then cut to a line chart for long-run cooperation rates.

### B4. Recommendation for Parallax

**Hybrid (outcome label + payoffs + Nash glyph)** as the PD hero.

Keep `stag-hunt` variant. Rename `chess-endgame` mentally as "asymmetric-outcome 2×2" and use it for Chicken / Battle of Sexes. **Add a `pd-canonical` variant** with:
- T/R/P/S labels visible in a legend strip
- Years-in-prison payoffs (the original Tucker framing)
- **Oxblood border on (D,D)**
- **Bone fill on (C,C)**
- **Best-response arrows in rust**

**The matrix should appear three times in the PD episode:**
1. Abstract introduction
2. Anchored to a specific historical case
3. Repeated-play version showing how the equilibrium softens

---

## 4. Common mistakes to flag in audit (both sub-forms)

1. **Payoff matrix without Nash highlighted** — viewers can't find the analytical punchline
2. **Numbers without units** — `(3, 3)` is meaningless; `(3 years, 3 years)` or `(-$3B, -$3B)` lands
3. **Abstract game theory without named scenario** — every matrix needs a real referent in the same frame (Khrushchev/Kennedy, US/China, Exxon/Shell)
4. **Decision tree with equal-weight branches when probabilities are known** — implies false symmetry
5. **Decision tree with invented probabilities** — worse than no probabilities; cite or omit
6. **Iterated game shown as single matrix** — collapses the entire point about cooperation emerging from repetition
7. **Best-response arrows omitted on N×N grids** — Nash is no longer visually obvious past 2×2
8. **Hero cell and Nash cell conflated** — in PD they're different; treatment must distinguish "what happens" from "what should happen"
9. **Tree depth >3 or matrix >3×3** — switch forms
10. **No legend for T/R/P/S** when using PD-specific labels — half the audience doesn't know the convention

## 5. Current template alignment

The existing `DecisionTree` template:
- Catalog variant: `chess-opening` — extensive-form horizontal tree
- Recently polished in session (node label maxWidth, etc.)
- **Diverges:** no probability-weighted branches; no Allison-style nested-rectangle variant for ExComm-class moments

The existing `GameBoard` template:
- Catalog variants: `chess-endgame`, `stag-hunt`
- Renders cells with labels but **no explicit Nash highlighting convention** (no border-on-equilibrium, no ∴ glyph in corner, no best-response arrows)
- **Critical gap for PD launch episode:** no `pd-canonical` variant with the conventional T/R/P/S labels + Nash treatment

## 6. Specific upgrades proposed

**DecisionTree:**
1. ~~`probabilityWeights?: boolean` option — when source-cited, show probability percentages on branches; suppress by default~~ **Done — May 11, 2026.** Shipped on DecisionTreeData. Default `false` suppresses any `node.probability` matching `/\d+\s*%/` while qualitative labels ("Mainline", "Sharp") always render. Set `true` only when probabilities come from a named source and pair with `data.source` for attribution. The dossier failure mode "invented probabilities — worse than no probabilities" is now schema-gated.
2. ~~New variant `decision-ladder` — Allison-style nested rectangles for ExComm/Politburo deliberation scenes~~ **Done — May 11, 2026.** Shipped as `data.variant: "extensive" | "ladder"` (default `extensive`). When set to `ladder`, the template renders the tree as Allison-style nested rectangles: top-level options stack vertically as bordered panels with inline "NN / TOTAL" ordinal kickers, sub-consequences indent inside with a left-rule accent. Highlighted nodes get heavier border + accent fill. Reference: `catalog-decision-tree-excomm-ladder` (ExComm October 1962, six options with Naval quarantine as the chosen path). Privileges the decision-maker's deliberative frame over abstract probability space.
3. ~~"Chosen path" hero treatment — accent color + 2px stroke on the actually-chosen branch, others at 30% opacity 1px~~ **Done — May 11, 2026.** When `data.highlightedPath` is set, off-path edges recede to 1.5px @ 30% opacity and off-path nodes dim to 50%. Chosen path keeps the existing 3px highlight stroke + glow. Verified visually on `chess-opening` catalog: Italian → Modern d3 path reads as protagonist while Evans Gambit / Two Knights / Classical recede.

**GameBoard (highest priority — PD episode forcing function):**
1. **New `pd-canonical` variant** for the PD episode — T/R/P/S labels in legend strip, years-in-prison payoffs, oxblood border on (D,D), bone fill on (C,C), best-response arrows in rust
2. **Nash glyph in cell corner** — use Parallax's ∴ brand mark; pure ∴ inside the equilibrium cell's top-right corner
3. **Best-response arrows** — small arrowheads drawn from off-equilibrium cells, pointing toward the deviation each player would make. The Nash is the cell with all arrows pointing IN.
4. **Hero-cell separation** — distinct treatment for "the moral hero" (mutual cooperation, bone+amber) vs "the analytical hero / equilibrium" (mutual defection in PD, oxblood border + ∴)
5. ~~**Iterated-play sub-form** — small-multiples of the matrix across rounds (round 1, round 5, round 20…) for the Axelrod-tournament reveal~~ **Done — May 11, 2026.** Shipped as `variant: "iterated-play"` + `data.rounds: Array<{ label, highlights, annotation? }>`. Renders a grid of mini 2×2 matrices labeled by round; each panel shares the cell structure, only the highlighted cells differ. The Axelrod reveal compressed into N panels. Catalog reference: `catalog-game-board-iterated-pd` (rounds 1 / 10 / 50 / 200 showing the equilibrium shift from defection to cooperation under shadow of the future).

## TL;DR

- **DecisionTree default →** horizontal extensive-form tree
- **GameBoard default →** hybrid 2×2 (outcome label + payoffs + ∴-glyph Nash marker)

**PD-specific need:** Build `pd-canonical` GameBoard variant with T/R/P/S labels, Nash-marked equilibrium, best-response arrows. The matrix is the visual anchor of the launch episode; it needs to be the most-polished thing in the catalog.

# OutcomePartition — research dossier

Editorial form: a 2D scenario field, recursively partitioned by thin rules. Each successive partition is one editorial decision; each terminal region is a labeled outcome. Severity = walnut fill density; probability is read as area.

**Companion to DecisionTree, not a replacement.** The form argues "the decision space narrows" rather than "the world forked." When the script's editorial move is *"these two structural pressures carve outcomes into N regions,"* this is the right template. When the script's move is *"sequence of choices led here,"* use DecisionTree (spine or extensive variant).

Shipped May 17, 2026 as part of the research-driven decision-tree aesthetic exploration (commit `e04ebde`). Aesthetic C of the research report — broken out as a separate template because the form does not read as a tree.

## Canonical idioms

### 1. RAND Robust Decision Making (RDM) partition plots — the canonical scenario-region register

RAND's Lempert et al. work on "Robust Decision Making for Planning Under Deep Uncertainty" (RB-9701, TR-392, and the *Shaping the Next One Hundred Years* monograph) uses rectangular partitions of a 2D feature space rather than node-link diagrams. The visual logic is Mondrian: outcome regions, not branches. Each region is labeled with one editorial outcome name; severity / failure / success modes are encoded by fill saturation. The partition itself is *given* — read as a decomposition of the outcome space, not as a sequence of choices.

This is the closest editorial parent for Parallax's OutcomePartition. Use it when the editorial point is *"the decision space looks like THIS,"* not *"the decision-maker chose THIS path through THIS sequence."*

### 2. De Stijl / Mondrian compositional grammar — the visual lineage

Mondrian's *Composition* series partitioned a 2D plane via thin black rules into asymmetric rectangular regions, with primary-color fills carrying weight. The compositional grammar is identical to a partition plot:

- Thin rules carry the partition itself (low optical weight; geometry is the argument)
- Fill saturation encodes the editorial weight of each region
- Asymmetric rule positions (not symmetric grids) read as *editorial decisions about where the divisions matter*, not as a neutral coordinate system

The De Stijl lineage is what makes the form mid-century-modernist-adjacent — the right visual register for the Parallax editorial system (Burtin/Bayer/Fortune-1955 inheritance).

### 3. Decision-theory partition diagrams (Pearl / Jaynes / textbook canon)

Bayesian-network and decision-theory textbooks use 2D partition plots to show *outcome space decomposition* — given two named uncertainty axes, the joint outcome space partitions into regions. Each region has a probability (area) and a label. Useful as a reference register but tends to be more technical than editorial; Parallax's version is the editorial sibling.

### 4. Edward Tufte small-multiples grids — relative-area reasoning

Tufte's *Envisioning Information* small-multiples technique relies on area-as-magnitude reasoning. OutcomePartition uses the same perceptual primitive: the area of a region IS its editorial weight, without numeric labels. Cleveland's perceptual hierarchy places "position along a common scale" above "area," but area inside an enclosed rectangle is much stronger than free-floating area — the rectangle gives the viewer a frame for comparison.

## Parallax defaults

- **Two axes, named editorially, not technically.** Not "X" and "Y" — "US RESOLVE →" / "PRC ESCALATION →". The axis labels do real editorial work; they tell the viewer what structural pressure each dimension represents.
- **Splits encode editorial decisions, not coordinates.** Each `at: 0.55` value is an editorial weight (this side of the split holds 55% of the outcome space); it's not a continuous data value. The viewer reads relative areas, not absolute positions.
- **Severity tints in walnut (0 → 0.25 opacity).** Mutually exclusive with `color`. Use `severity` for the canonical narrowing-toward-bad-outcomes argument (lighter regions = stable, darker = catastrophic). Use `color` for semantic accents (a leaf using `semantic.china` for the escalation outcome, `semantic.us` for a containment outcome).
- **One highlighted leaf per composition.** `highlighted: true` adds a 3px accent rule on the leading edge. More than one and the eye loses the protagonist outcome.
- **revealStep ordering is the argument.** Each `revealStep` integer determines when the rule draws + the leaf label fades in. Explicit values are honored; implicit values use an auto-cursor that advances past any explicit step it consumes. Animate the partition in the same order the script narrates the editorial decisions.
- **Static frame, no camera pan.** Unlike DecisionTree's `extensive` / `schematic` variants, OutcomePartition does not use a virtual camera. The whole partition is visible from the start; the reveal animation is the only motion.

## Failure mode flags

- **Using OutcomePartition when narrative ordering matters.** If the script reads "first they did X, then Y, then Z," that's sequential — use DecisionTree (`spine` for ≤3 levels with discarded alternatives, `extensive` or `schematic` for deeper branching). OutcomePartition reads the partition as *given*, not as a sequence.
- **Generic axis labels.** "Outcome A" / "Outcome B" axes destroy the editorial work. The axes must name two real structural pressures.
- **More than 5 terminal regions.** Beyond 5, the partition reads as a low-resolution heatmap and the editorial-decisions-as-rules grammar collapses. Either split into staged compositions or demote to a heatmap chart.
- **Symmetric grid partitions (all splits at 0.5).** Symmetry reads as a coordinate system, not an editorial choice. At least one split should be asymmetric to signal "the analyst is making a call about where the meaningful divisions sit."
- **Color + severity stacking.** The fields are mutually exclusive — when both are set, `color` wins and `severity` is silently dropped. Don't set both.

## Current template alignment

- Recursive `Region` type (`split | leaf`) compiles cleanly under TypeScript strict mode; Zod schema uses `z.lazy()` for the self-reference.
- `revealStep` auto-cursor advances past explicit values (`Math.max(cursor, explicit + 1)`) so mixing explicit and implicit ordering is safe.
- Severity tint maps to `palette.walnut` at `severity * 0.25` opacity; `color` override renders at 15% opacity flat.
- Split-label rendering: paper-haloed mono caption mid-rule; rotated -90° for horizontal-axis (vertical-cut) splits.

## References

- `PARALLAX_VISUAL_VOCABULARY.md` § 10 — chart-chooser entry
- `src/templates/OutcomePartition/types.ts` — Region type definition
- `src/templates/OutcomePartition/OutcomePartition.tsx` — recursive resolver + rendering
- `references/template-research/decision-tree.md` — sibling template; pick between them via the "narrows vs forks" test

### Canonical pieces (external)

- RAND TR-392 — *Massive Scenario Generation* (2007)
- RAND RB-9701 — *Robust Decision Making* (2014)
- Lempert, Popper & Bankes — *Shaping the Next One Hundred Years* (2003)
- Piet Mondrian — *Composition with Red, Blue and Yellow* (1930) and subsequent partitions
- Tufte — *Envisioning Information* (1990), small-multiples chapter

---

Last revised: May 18, 2026 — template shipped; dossier created. Sample composition: `OutcomePartition` (catalog), Taiwan-strait decision space.

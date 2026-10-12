# CounterfactualPath — Research Dossier

> Created May 19, 2026. The "road not taken" form — actual historical
> path + 1-2 dashed counterfactual branches diverging at a named decision
> point. Disciplined counterfactual reasoning made visual.

## 1. The form's editorial purpose

CounterfactualPath renders a horizontal timeline that branches at a named historical decision point: the actual path forward (solid gold) and 1-2 dashed counterfactual alternatives. Reach for it when the editorial argument is *"this didn't have to happen — at this specific moment, these alternatives were on the table."* The form makes counterfactual reasoning structurally legible: it forces the analyst to name (a) the branching point, (b) the specific decision, (c) the alternative paths considered, and (d) their plausibility. Distinct from `ConditionalArgument` (forward-looking IF/THEN); CounterfactualPath is backward-looking ("what if it had gone differently?").

The form is high-impact, low-frequency. Counterfactual reasoning is one of Parallax's signature analytical moves (the "structural resonance" register often relies on it), but every shot of it dilutes the register. 1-2 per episode max.

## 2. Canonical idioms

**Ferguson's Virtual History.**
Niall Ferguson's 1997 book established disciplined counterfactual history as a legitimate methodology. Each chapter takes a specific decision point (Munich 1938, Lenin's sealed train, the Kennedy assassination) and traces what plausibly could have followed differently. Visual treatments in the book + its descendants use horizontal timelines with branching arrows. Reference: Ferguson, *Virtual History* (1997).
Failure mode: counterfactuals that fail Hawthorn's plausibility test (see below) — wishful or implausible alternatives undermine the form's authority.

**Hawthorn's Plausible Worlds.**
Geoffrey Hawthorn's 1991 work established the plausibility test for counterfactuals: a counterfactual is admissible only if (1) the change at the branching point was historically possible (i.e., real actors actually considered it), (2) the downstream consequences follow from known causal relationships, and (3) the alternative doesn't require multiple unlikely things to happen in sequence. The visual register supports this with explicit `plausibility` annotations per branch ("Plausible — favoured by Joint Chiefs"; "Marginal — required congressional cover").
Failure mode: counterfactuals as wishful thinking ("if only the Romans had invented the steam engine") — fails the plausibility test, destroys the form's editorial authority.

**Allison's ExComm reconstruction (Essence of Decision).**
Graham Allison's classic 1971 (revised 1999) reconstruction of the Cuban Missile Crisis explicitly walks through the three options on the ExComm table — blockade, airstrike, invasion — and reasons about what each would have produced. The book IS a CounterfactualPath presented in prose form. Reference: Allison & Zelikow, *Essence of Decision* (1999).
Failure mode: collapsing the counterfactuals to a single "what if it had been different" — the form's editorial value comes from showing SPECIFIC alternatives, not abstract change.

**Strategic-analysis branching diagrams (RAND / Brookings).**
Modern think-tank "what if" papers use horizontal branching diagrams. Visual register: timeline runs left-to-right; branching point is a vertical bar + dot at the decision date; actual path continues solid; counterfactuals branch up/down dashed. End-of-path labels describe each outcome. Reference: RAND ColdWar-counterfactual reports.
Failure mode: 4+ counterfactuals — the diagram becomes a tangle. Cap at 2; if the historical decision had more options, pick the two most consequential.

## 3. General principles

The form's leverage comes from three disciplines:

1. **Specificity of the branching point** — a named date, a named event ("OCT 1962 / Cuban Missile Crisis"). Not "the early Cold War" — the form requires a moment.
2. **Plausibility of each counterfactual** — Hawthorn test. Each branch gets an optional `plausibility` annotation (Plausible / Marginal / Unlikely given known facts). The form respects these labels.
3. **Falsifiability of consequences** — each counterfactual outcome must be defensible from known causal relationships. "Soviet tactical nukes (since revealed to have been deployed) likely fire on US forces" is defensible because we now know the nukes were there. "World peace would have followed" is not defensible.

Visual register:
- **Pre-branch trunk** — solid muted line, the established trajectory
- **Branching point** — vertical bar + accent dot, the editorial pivot
- **Actual path** — solid GOLD (or episode accent), continues forward — visually dominant
- **Counterfactual paths** — DASHED (canonical "this didn't happen" signal), muted colour, arc up/down from branching point
- **End-of-path markers** — actual gets filled circle, counterfactuals get hollow circle
- **Labels at path endpoints** — "ACTUAL · <label>" + outcome / "COUNTERFACTUAL · <label>" + outcome + plausibility

## 4. Recommendation for Parallax

Default to the disciplined two-counterfactual form:
- Horizontal timeline at canvas mid-height
- Pre-branch label ("Pre-crisis Cold War balance") in mono small caps above trunk
- Branching point with year + event ("OCT 1962 / Cuban Missile Crisis")
- Actual path continues right in solid gold
- Counterfactual 1 arcs UPWARD (dashed, muted), counterfactual 2 arcs DOWNWARD
- End-of-path labels: "ACTUAL · " in mono small caps + outcome in serif body / "COUNTERFACTUAL · " in italic mono + outcome in italic serif + plausibility in mono meta
- Centred caption beneath the diagram framing the methodological discipline ("Each counterfactual passes the Hawthorn plausibility test...")

Authoring rules (enforced via documentation, not schema):
- Maximum 2 counterfactuals per shot
- Each counterfactual outcome ≤ 16 words
- Each counterfactual MUST have a `plausibility` annotation when the analyst's claim is contested
- Caption (Hawthorn / Ferguson discipline line) is strongly recommended

## 5. Current template alignment

`CounterfactualPath` ships with the recommended idiom. `actual` + `counterfactuals[]` (min 1, max 2). Each counterfactual specifies `direction: "up" | "down"` and optional `plausibility`. Branching point renders as accent-coloured dot + vertical marker at named year/event. Caption renders centred below for methodological framing.

Default props: Cuban Missile Crisis bifurcation. Actual = blockade. Counterfactual 1 (up) = airstrike (likely nuclear escalation, "Plausible — favoured by Joint Chiefs"). Counterfactual 2 (down) = full invasion ("Marginal — would have required congressional cover"). Caption explicitly invokes the Hawthorn plausibility test.

Known design constraint: with two counterfactuals + actual + their bodies, the right-side label column gets crowded. The schema's "≤ 16 words" rule on `outcome` exists to prevent text wrapping that pushes labels into each other. cfRiseHeight is 200px (provides ~70px between adjacent label tops); shorter outcome text + the rise height should give comfortable spacing.

## 6. Specific upgrades proposed

1. **Audio-driven path-reveal sync** (medium effort, high impact) — sync actual + counterfactual reveal timing to narration sync points so the actual path draws as the narrator says "they chose blockade," counterfactuals draw as the narrator names them.
2. **Probability-weighted branch widths** (high effort, low impact) — when `plausibility: "Plausible"` vs "Marginal", render dashed line at different opacities (plausible = 0.7, marginal = 0.4). Subtle visual hierarchy that matches the analytical discipline.
3. **Multi-stage branching** (high effort, low frequency) — counterfactual that itself branches at a second decision point. Probably belongs in `DecisionTree`; not duplicating.
4. **Counterfactual ground-truth annotation** (low effort, medium impact) — when subsequent historical knowledge confirms a counterfactual would have produced X (e.g., "we now know Soviet tactical nukes WERE deployed"), schema field `groundTruth: string` rendered as a footnote next to the relevant branch in china-red italic.
5. **Pre-branch context expansion** (low effort, low impact) — currently `preBranchLabel` is a one-line mono small-caps strip. Could expand to support multi-line context block when needed.

## 7. Failure mode flags

- **Implausible counterfactuals (Hawthorn test fails)** — "what if Hitler had a change of heart?" Wishful, undisciplined. Reject.
- **More than 2 counterfactuals** — the diagram becomes a tangle of arrows; the eye loses track. Cap at 2.
- **Counterfactuals that disagree about HOW they would have unfolded** — the outcome text must be specific enough to be evaluated. "Things would have been different" is not an outcome.
- **No plausibility annotations** — without them, the form reads as speculation. Hawthorn discipline requires the analyst to commit to a plausibility judgment per branch.
- **Branching point too vague** — "the early 60s" isn't a branching point; "OCT 1962 / Cuban Missile Crisis" is. The form requires a specific moment.
- **Long outcome text (> 16 words)** — wraps to multiple lines, crowds adjacent counterfactual labels, degrades the visual hierarchy.
- **Counterfactual outcomes that match the actual outcome** — defeats the form's editorial point. If the alternatives lead to the same place, the branching point didn't matter.
- **Confused with EscalationLadder** — Escalation Ladder is a sequential rung-by-rung escalation along ONE path. CounterfactualPath shows multiple paths branching from one point. Different forms.

# ConditionalArgument — Research Dossier

> Created May 19, 2026. IF / THEN binary branching with two consequences
> shown side-by-side. The scenario-forecasting primitive.

## 1. The form's editorial purpose

ConditionalArgument renders a binary IF/THEN branching: a single uncertain condition and the two consequences that follow depending on which way it resolves. Reach for it when the editorial argument is *"the future bifurcates on this one variable; here's what happens either way."* The form forces analytical discipline — naming the condition precisely, articulating both branches' consequences, and (optionally) acknowledging what determines which way it goes. Distinct from `DecisionTree` (hierarchical N-way with probabilities) and from `ComparisonPair` (general comparison of two visualisations); this is specifically for binary IF/THEN reasoning.

## 2. Canonical idioms

**Formal-logic conditional (textbook propositional logic).**
"If P, then Q. If not-P, then R." Stacked formal notation. Used in logic textbooks and analytical philosophy. Visual register: monospace, no decoration, premises in formal notation. Reference: any introductory logic textbook (Hurley, Copi).
Failure mode: monospace-on-white for editorial content reads as "code listing" not "argument." Use richer typography for video.

**RAND-style scenario-forecasting (binary branching).**
RAND Corporation strategic-planning documents from the 1950s onwards use binary branching for contingency analysis. "If Soviet first strike, then... If Soviet conventional war, then..." Format: condition centred at top, two branches diverging below with explicit severity markers (✓ / ✗ / red / green). Reference: RAND papers on Cuban Missile Crisis contingency planning.
Failure mode: too many nested branches — RAND would chain them (binary → quaternary → octenary). For editorial video, cap at one binary; if you need more, use `DecisionTree`.

**Foreign Affairs / Brookings scenario essays.**
Modern foreign-policy think tanks publish scenario essays following the "if X happens, the consequences are Y; if not, they're Z" structure. The Council on Foreign Relations' "Contingency Planning Memorandums" use this register explicitly. Reference: CFR CPM series, Brookings "Order from Chaos" pieces.
Failure mode: pretending the binary captures the actual space of outcomes. Real futures are continuous, not binary. The form's editorial honesty depends on flagging in the `determinant` field what would shift the analysis from binary to continuous.

**War-gaming branching scenarios (Pentagon).**
Department of Defense war-gaming uses if/then branching with severity tiers (low / medium / high / critical). Visual treatment: branch colour intensifies with consequence severity; critical-tier consequences get underline + bold. Reference: DoD JPME war-gaming materials.
Failure mode: every branch tagged "critical" loses the severity hierarchy. Critical should mean "existential / catastrophic" — reserved for genuine cases.

## 3. General principles

The form's leverage comes from forcing the analyst to commit to:
- **A specific condition** (not "if things get worse" — "if China imposes a naval quarantine")
- **A specific timeframe** ("within five years")
- **Both branches' consequences** (the form rejects "if A, then bad; if not-A, no comment")
- **Honesty about the determinant** — what would tip the balance? If we don't know, say so

Severity tiers carry editorial colour:
- **low** → dustblue (cool, manageable)
- **medium** → gold (default — significant but containable)
- **high** → china-red (warning — major consequence)
- **critical** → china-red + bold + underline (existential / catastrophic)

The pivot point (∴) is the brand mark — the editorial signature that this is a structured deduction, not idle speculation.

The `determinant` field is non-decorative. It's the analytical-discipline check: "What would tip the balance?" If the analyst doesn't know, the form forces them to say "domestic Chinese economic conditions" or "the next US administration's posture" or whatever. Without it, the binary feels like idle "what-if."

## 4. Recommendation for Parallax

Default to the RAND-style scenario form with editorial polish:
- "IF" prefix in mono small-caps at body size
- Condition statement in italic serif at h3 — the uncertain variable, stated precisely
- Brand mark ∴ centred between condition and branches (the editorial pivot)
- Two diverging arrows in branch colour (left = ifTrue, right = ifFalse)
- Each branch panel: ✓ or ✗ marker in coloured disc + branch label + consequence text + optional probability gloss
- Critical-severity consequences get underline accent in branch colour
- Determinant footnote centred beneath both branches in italic serif with "DETERMINANT:" mono prefix

Title block frames the scenario ("THE BIFURCATION POINT" / "How China escalates determines what the US has to defend against"). Source attribution bottom-right.

## 5. Current template alignment

`ConditionalArgument` ships with the recommended idiom. Condition + ifTrue + ifFalse branches with severity tiers + probability glosses + optional determinant. Brand mark ∴ scales in dramatically at the pivot point. Both branches reveal simultaneously after the condition + pivot settle.

Default props: Taiwan contingency. Condition = "China moves militarily against Taiwan within five years." ifTrue (invasion) = critical severity (war risk). ifFalse (blockade) = high severity (deterrence test). Determinant = domestic Chinese economic conditions. Demonstrates the canonical scenario-forecasting register with realistic severity differentiation.

## 6. Specific upgrades proposed

1. **Probabilistic continuous variant** (high effort, medium impact) — schema additions for `condition.probability: number` (0-1) where the branches render with proportional width (e.g., 30% left branch, 70% right). The editorial argument shifts from "binary" to "weighted bifurcation." Probably belongs in a separate template (`ProbabilityFork`).
2. **Multi-branch variant** (medium effort, low frequency) — N branches instead of binary. Currently this maps to `DecisionTree` (which has its own template); not duplicating.
3. **Cascading severity** (low effort, medium impact) — when a "critical" branch is hovered/focused, dim the other branch to 40% opacity. The editorial signal "this is the one that matters" without obscuring the other.
4. **Audio-driven branch reveal** (medium effort, medium impact) — sync `appearAtSec` of each branch to narration sync points so the branches land as the narrator names them.

## 7. Failure mode flags

- **Branches that aren't actually binary** — "if China invades / if China invades hard" isn't binary; it's a magnitude question. Reframe as continuous or use multiple ConditionalArguments.
- **No determinant named** — the form's analytical discipline depends on the `determinant` field. Without it, the binary feels arbitrary.
- **Both branches "critical"** — destroys the severity hierarchy. At most ONE branch is critical; the other should be high or below.
- **Probability glosses with false precision** — "67.3% chance" reads as fake quant. Use ranges ("~30% analyst consensus") or remove.
- **Asymmetric branch length** — one branch's consequence is 8 words, the other is 28 words. Reads as biased analysis. Trim to similar length.
- **Determinant that's actually the condition** — "what determines if China invades? Whether China decides to invade." Circular. The determinant should name an UNDERLYING variable.
- **Confused with DialecticFlow** — DialecticFlow has thesis/antithesis/synthesis (three panels, productive contradiction). ConditionalArgument has condition / two branches (binary fork). Different forms entirely.

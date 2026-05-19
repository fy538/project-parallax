# Parallax — Math Render Register

## Purpose

This is the canonical guide to **rendering mathematics in Parallax episodes**. It defines six editorial primitives (each carrying an implicit claim about the math you're showing), per-primitive use/avoid rules with concrete Parallax examples, and a decision matrix for the `visual-spec` skill to pick the right primitive from script context.

Read first when a beat involves an equation, a derivation, a payoff matrix, a Bayesian update, an expected-value calculation, or any other moment where words have started to feel hand-wavy and a glyph would land harder.

Sibling docs:
- [`TEXT_ANIMATION_REGISTER.md`](./TEXT_ANIMATION_REGISTER.md) — eight atomic text-animation techniques
- [`HOLD_MOTION_REGISTER.md`](./HOLD_MOTION_REGISTER.md) — eight hold-beat motion treatments
- [`VISUAL_LANGUAGE.md`](./VISUAL_LANGUAGE.md) — three-register system (Analytical / Atmospheric / Grounding)

---

## North star

Math on Parallax should feel like **a smart friend deriving something on a napkin in front of you** — not a textbook page, not a math channel. Every equation that appears earns its place by carrying editorial weight the words can't carry alone. The bounded-analogy doctrine extends naturally: *"this equation captures the structure here, breaks when assumption X fails, dangerous if extended past Y."*

That's the editorial frame. The mechanics live below.

---

## When to use math

Reach for math when:

- The argument is **quantifiable** and the quantity is the load-bearing piece (expected value, probability, payoff dominance, decay rate, ratio).
- The relationship between variables is the editorial **insight** (Bayes flipping causality, the discount factor δ deciding cooperation, the Lorentz factor exploding near c).
- A **derivation IS the argument** — showing the step-by-step transformation lands a claim that bullet points can't.
- The **bounded form** is the editorial move — showing where the equation works and naming where it breaks.
- A short formula stands in for a **lot of words** (`P(H|E)` carries more weight than "the probability of the hypothesis given the evidence").

## When NOT to use math

Avoid math when:

- The argument is **qualitative** (cultural shifts, narrative arcs, civilizational mood). Math would intimidate without illuminating.
- The audience moment is **emotional** (memorial beats, atmospheric scene-setters, closing exhales). Equations break the register.
- The equation is **decorative** — looks intellectual but adds no argumentative weight. Default to words.
- The equation is **too dense to read at video speed**. If the formula needs three reads to parse, either split into steps (use `MathDerivation`) or paraphrase in prose.
- **Authority-by-equation** would be misleading — wrapping a contested claim in formalism doesn't make it true. Parallax's "backstage maximum" doctrine applies: the math has to be *correct* and the *editorial claim it makes* has to be defensible.

---

## The six primitives (quick reference)

| # | Primitive | Editorial claim | Implementation |
|---|---|---|---|
| 01 | **Reveal (single equation, write-on)** | "Here is the formal statement." | `MathReveal` template; left-to-right clip-path sweep |
| 02 | **Step-by-step derivation** | "The derivation IS the argument." | `MathDerivation` template; opacity crossfade between steps |
| 03 | **Term-highlight** | "This is the load-bearing piece." | `\textcolor{HEX}{TERM}` inside any step's TeX |
| 04 | **Substitution** | "The formula meets reality." | Sibling step with the variable replaced by its value |
| 05 | **Annotation** | "Translating jargon to plain language without leaving the formal frame." | `\underbrace{TERM}_{\text{label}}` / `\overbrace{TERM}^{\text{label}}` (KaTeX-native) |
| 06 | **Inline** | "The math glyph belongs inside the prose." | `<MathInline>` with `$...$` markers in text |
| ✦ | **Bounded** (composite) | "This works here; this is where it stops working." | Authored as a sequence of steps in `MathDerivation` — Parallax's signature form, math edition |

---

## 01 · Reveal (single equation, write-on)

Component: `<MathExpression>` + `MathReveal` template. The equation reveals from left to right via a clip-path mask. After it settles, an optional caption translates the notation into prose.

### Use for
- The single-equation **statement of formal structure** — Bayes' rule on its own line; the Nash equilibrium condition; the expected-utility form.
- Moments where the equation is the **landing**, not the path. One image, held for the eye to read.
- Channel-voice equations the audience may already half-know — the reveal is recognition, not derivation.

### Avoid for
- Multi-step derivations (use `MathDerivation` step-by-step).
- Body-prose moments where the equation should sit *inside* a sentence (use `<MathInline>`).
- Equations longer than ~60 chars of TeX — the write-on takes too long to read; split into steps.

### Parallax examples
- *prisoners-dilemma*, expected-utility beat — `𝔼[U_i] = pa + (1-p)b` lands as a hero formula before the narrator walks through what p, a, b mean.
- *silicon-trap*, Moore's law moment — `N(t) = N_0 \cdot 2^{t/2}` shown as a formal statement before the narrator names what the doubling implies.

### Technical brief
```
component: MathReveal
data shape: { formula, display?, revealSec?, fontSize?, caption? }
default reveal duration: 1.4s (cubic ease)
default hold: 2.0s after settle
exit fade: 1.5s
hold motion: breathing (HOLD_MOTION_REGISTER Register B)
```

---

## 02 · Step-by-step derivation

Component: `MathDerivation` template + `<MathCrossfade>` engine. Multi-step chain; each step crossfades opacity to the next. Step counter ("Step 2 of 4") + per-step annotation in Plex Mono.

### Use for
- **Worked examples** — Bayes update with concrete numbers, expected-value with named parameters, dominance proofs in game theory.
- Moments where the audience needs to **follow the work** (not just see the answer).
- Editorial beats that depend on **why the transformation happens** — "factor out b" is more illuminating than the algebra alone.

### Avoid for
- Single equations (use `MathReveal`).
- Chains so long the audience loses the thread — keep to 3–5 steps per derivation. Longer chains should be split into two `MathDerivation` segments separated by a narrative beat.
- Symbolic algebra for its own sake. Each step must say something the audience couldn't get from the previous step alone.

### Parallax examples
- *prisoners-dilemma*, Bayesian rationality beat — `P(H|E) = P(E|H)P(H)/P(E)` → expand denominator → substitute (0.95 and 0.01) → arrive at the counterintuitive ~0.16 posterior.
- *prisoners-dilemma*, dominance proof — `𝔼[U_D] - 𝔼[U_C]` derived to show why defection wins for every p when both PD inequalities hold.

### Technical brief
```
component: MathDerivation
data shape: { steps: [{ formula, holdSec, annotation? }], crossfadeSec?, fontSize?, display?, showStepCounter? }
default crossfade duration: 0.5s
default hold per step: 2.5–3.5s (sayability — see below)
total duration: sum(holdSec) + 1.5s entrance buffer
hold motion: breathing
```

---

## 03 · Term-highlight

Authored as `\textcolor{HEX}{TERM}` inside any step's TeX. Crossfade engine handles the transition — the highlighted version is a different step, with the same surrounding terms.

### Use for
- **Drawing the eye** to the term the narrator is naming. Substitutes (the 0.95, the 0.01) carry the editorial weight.
- **Marking the assumption** — color the assumption clause (`when v ≪ c`) in rust so the eye knows it's the boundary, not the equation proper.
- **Two-color comparison** — gold for the cooperative outcome, rust for the defection outcome.

### Avoid for
- More than 2–3 colors per equation. Rainbow notation defeats the highlight.
- Rainbow-by-default — every term colored = no term colored.
- Using non-brand colors. The palette below is the only allowed set.

### Brand color hexes (for `\textcolor{}` in TeX)
| Color | Hex | Use |
|---|---|---|
| gold | `#C4A747` | primary accent, "look here" |
| rust | `#A64D46` | china / danger / boundary clause |
| dustblue | `#7AA3C9` | us / cool semantic |
| walnut | `#5C4A3D` | secondary emphasis, faded weight |
| ink | `#1C1814` | body color (default; rarely needed explicitly) |

### Parallax examples
- Bayes update — substitute step colors the sensitivity (0.95, gold) and the prior (0.01, rust) so the eye sees the *editorial pairing* before the narrator names it.
- PD dominance — the `T > R ∧ P > S` inequalities highlighted in rust as "this is the structural condition that forces defection."

### Technical brief
```
authoring: write \textcolor{HEX}{TERM} in the step's `formula` field
            inside math mode — works in MathReveal, MathDerivation,
            and MathInline
mechanics: the crossfade engine handles the color change as a step
            transition. To "add" the highlight mid-equation, write the
            unhighlighted step first, then the highlighted step.
```

---

## 04 · Substitution

A step in the sequence replaces a variable with its numeric value in the TeX source. The crossfade reads as "the formula meets reality." Often paired with term-highlight on the substituted values.

### Use for
- **Plugging in real numbers** — the editorial "what does this actually mean" beat after the formal derivation.
- Showing how a **small change in inputs cascades** through the formula (Bayes with prior 0.01 vs 0.10 — same formula, different posteriors).

### Avoid for
- More than one substitution per step — split into separate steps so the eye can track each replacement.
- Substituting *all* variables at once into a complex formula. The eye loses the connection to the derivation.

### Parallax examples
- Bayes update — substitute step replaces `P(E|H)` with `0.95` and `P(H)` with `0.01` simultaneously (paired with gold/rust highlights so the eye tracks each).
- Discount factor δ in iterated PD — `δ > 0.5` step substitutes the threshold value derived from concrete payoffs.

### Technical brief
```
authoring: write a sibling step in MathDerivation.steps[] where
           the previous step's variable is replaced by its numeric
           value in the TeX source. Combine with \textcolor{}{}
           for visual emphasis.
mechanics: no new component — the crossfade engine handles the
           value-for-variable swap as any other step transition.
```

---

## 05 · Annotation

KaTeX-native `\underbrace{TERM}_{\text{label}}` and `\overbrace{TERM}^{\text{label}}`. The brace and label render as part of the equation, in math typography. Stays inside the formal frame.

### Use for
- **Glossing notation** — labeling the posterior, likelihood, prior, evidence in Bayes' rule.
- **Naming intermediate quantities** in derivation chains (`\underbrace{p(T-R) + (1-p)(P-S)}_{\text{defection's advantage}}`).
- **Pointing to the assumption** in a bounded form (`F = ma \quad \underbrace{\text{when } v \ll c}_{\text{Newtonian regime}}`).

### Avoid for
- Long labels — annotations should be 2–4 words. Long labels stack visually with the math and read as cramped.
- Multiple annotations on the same term (pick one — annotation isn't a citation list).
- Annotation as a substitute for the narrator. The narrator carries the gloss; annotation reinforces, not replaces.

### External annotations (Plex-Mono pointers from below the equation) are Phase 4+ work — they require DOM measurement to position. For now, in-equation `\underbrace`/`\overbrace` covers the high-frequency use case.

### Parallax examples
- Bayes' rule annotated — `\underbrace{P(H|E)}_{\text{posterior}} = \frac{\overbrace{P(E|H)}^{\text{likelihood}} \cdot \overbrace{P(H)}^{\text{prior}}}{\underbrace{P(E)}_{\text{evidence}}}`. All four parts labeled simultaneously; the narrator names them in the same beat.
- PD derivation — `\underbrace{p \cdot R + (1-p) \cdot S}_{\text{cooperation's expected payoff}}` glosses what the algebra is computing.

### Technical brief
```
authoring: write \underbrace{TERM}_{\text{LABEL}} or
           \overbrace{TERM}^{\text{LABEL}} inside any TeX formula.
           Use \text{...} to keep the label in upright (non-italic)
           type — math italics on a prose label reads wrong.
mechanics: KaTeX renders these natively; no new component needed.
```

---

## 06 · Inline (math inside prose)

Component: `<MathInline>`. Parses `$...$` markers in a text prop; renders text as flowing prose and math as inline-mode KaTeX. The math glyphs sit on the baseline of the surrounding text.

### Use for
- **Body text mentioning a formula** — "the expected payoff is $\mathbb{E}[U]$ which dominates."
- **Captions referencing a quantity** — `$\delta > 0.5$ keeps cooperation stable.`
- **Labels** in templates that want symbolic notation (`$2 \times 10^{12}$ FLOPS`).
- **Worked-example prose** — "with $R = 3$, $S = 0$, $T = 5$, $P = 1$, cooperation is stable for $\delta > 0.5$."

### Avoid for
- Display-style math (multi-line, large operators) — those belong in `MathReveal` or `MathDerivation`, not inline.
- Equations longer than ~3–4 symbols inline. Long inline math disrupts the reading rhythm of prose.
- Anywhere the math should be a separate visual beat. If the equation deserves to be heard, give it its own segment.

### Authoring patterns
```
"the expected payoff is $\\mathbb{E}[U]$ which dominates"
"with discount factor $\\delta > 0.5$"
"Cost: \\$10 for $n$ units → \\$10n"   // \\$ for literal dollar
```

### Parallax examples
- *prisoners-dilemma*, caption — "Player i's expected payoff is $\mathbb{E}[U_i] = pa + (1-p)b$ under cooperation probability p."
- *silicon-trap*, body text — "doubling every $\sim$2 years yields a $2^{n/2}$ multiplier over n years."

### Technical brief
```
component: <MathInline text="..." fontSize? color? block? />
parser:    $...$ for inline math; \$ for literal dollar; unmatched
           trailing $ treated as literal; empty $$ dropped + adjacent
           text merged
rendering: text as React children; math as MathExpression display=false
           with vertical-align middle + inline-block for baseline flow
newlines:  source \n preserved via white-space: pre-line (no manual <br/>)
```

---

## ✦ Bounded (composite — Parallax signature form)

Not a new primitive — a curated sequence of step + annotation + step that lands the editorial "this works here, breaks there, dangerous when extended" form. The audience reads "I see the equation, I see the assumption named, I see the regime where it fails."

### The shape (typical 4-step authoring)
1. **State the equation.** `F = ma`
2. **Name the assumption** (rust-highlighted). `F = ma \quad \text{when } v \ll c`
3. **Show the generalization.** `p = γm_0 v, γ = 1/\sqrt{1 - v^2/c^2}`
4. **Name the failure domain.** `v → c ⇒ γ → ∞ ⇒ F = ma \text{ fails}`

### Use for
- Any equation famous enough that the audience either knows it or thinks they do. Bounded form earns the right to introduce a refinement.
- Moments where Parallax's analytical move is *"this is true here, but..."* — the math version of the channel's signature analogical move.
- Bridging between regimes (Newtonian / relativistic; classical / Bayesian; one-shot / iterated games).

### Avoid for
- Equations whose domain isn't disputed. If everyone agrees on when it applies, bounded form is editorial overhead.
- Stepping through every textbook caveat. Pick the load-bearing boundary; one bound per derivation.

### Parallax examples (the editorial register)
- *future-physics episode* — `F = ma` bounded by `v ≪ c`, generalized to relativistic momentum.
- *prisoners-dilemma* — `defection always dominates` bounded by `one-shot, perfect information`, generalized by the shadow-of-the-future inequality `δ > (T-R)/(T-P)`.
- *future-stats episode* — `p < 0.05 ⇒ significant` bounded by `large enough n, no multiple comparisons`, generalized by Bayesian posterior odds.

### Technical brief
```
authoring: composite of step-by-step + term-highlight + annotation.
           No new component — author the 4-step sequence in
           MathDerivation.steps[] following the shape above.
mechanics: relies on the existing MathCrossfade engine.
fixture:   data/episodes/catalog/math-newton-bounded.json
```

---

## Decision matrix — which primitive for which moment

Read left-to-right; the first match wins. The visual-spec skill consumes this table.

| If the beat involves... | And the editorial intent is... | Use |
|---|---|---|
| A single formal equation | "Here is the formal statement" | **Reveal** (`MathReveal`) |
| A worked derivation (3–5 steps) | "The derivation IS the argument" | **Step-by-step** (`MathDerivation`) |
| Plugging in real numbers | "The formula meets reality" | **Substitution** step in `MathDerivation` |
| Naming a load-bearing term | "Look at THIS piece" | **Term-highlight** (`\textcolor{HEX}{}` in TeX) |
| Glossing notation | "Posterior = belief after evidence" | **Annotation** (`\underbrace{}_{}` in TeX) |
| Math inside flowing prose | "The glyph belongs in this sentence" | **Inline** (`<MathInline>` + `$...$`) |
| A famous equation + its boundary | "This works here; here's where it breaks" | **Bounded** composite in `MathDerivation` |
| A payoff matrix | "Two players, four outcomes" | `GameBoard` template (NOT math primitives — payoff matrices are diagrams, not equations) |
| A qualitative argument | Any | **NOT math** — use words, charts, frameworks |
| A memorial beat | Any | **NOT math** — wrong register |

---

## Sayability — how long to hold each step

Analog of `sayability_lint.py` for narration. A step that's too dense to read in its hold time produces a "wait, what?" beat.

| Equation type | Recommended `holdSec` |
|---|---|
| Single short equation, no new symbols | 2.0–2.5 |
| Single equation introducing a new symbol | 2.5–3.0 |
| Derivation step, no algebraic change | 2.5–3.0 |
| Derivation step with substantial algebraic step (factoring, expanding) | 3.0–3.5 |
| Step introducing a new operator (`\mathbb{E}`, `\gamma`, `\Rightarrow`) | 3.5–4.0 |
| Final / punchline step (the audience needs to absorb the result) | 3.5–4.5 |

Add 0.5s to all values if the equation contains 4+ symbols the audience hasn't seen earlier in the episode.

If a step would need > 5s to read, **split it**.

---

## Anti-patterns to watch for

- **Equation as decoration** — math glyphs that look intellectual but add no argumentative weight. Default to words; reach for math only when words start to feel hand-wavy.
- **Authority-by-equation** — wrapping a contested claim in formalism doesn't make it true. The math has to be correct AND the editorial claim it makes has to be defensible.
- **Rainbow notation** — coloring every term defeats highlight. Two colors per equation is the working max.
- **Stale assumptions** — citing an equation without naming its domain. If the equation is famous enough to invoke, the bounded form is usually the editorial move.
- **Inline math in display contexts** — `<MathInline>` is for prose embedding; full-screen hero equations use `MathReveal`.
- **Wall of LaTeX** — TeX source longer than ~80 chars per step is hard to author, hard to lint, and usually means the step is doing too much. Refactor into smaller steps.
- **Mathjax-style alignment** — Parallax doesn't ship `\begin{align}` multi-line alignment yet (Phase 5+ if a real episode needs it). Multi-line work goes in `MathDerivation` steps.
- **Computer Modern fonts everywhere** — the math uses KaTeX's bundled fonts (CM-derived); surrounding chrome (captions, step counters, source) uses Plex. Don't override KaTeX's font without going through the brand path (`brandMark`-style centralization, Phase 5).

---

## Lint rules

The doctrine above is enforced where possible by automated checks. Live as of Phase 4:

| Rule | What it catches | Where |
|---|---|---|
| **M-MATH-VALID** | TeX formulas in `data/episodes/**/*.json` that don't parse through KaTeX | `scripts/lint-math-formulas.mjs`, wired into `scripts/lint.sh` |

Phase 5+ lints (queued, not yet shipped):
- **M-MATH-FONT** — inline CSS overrides of `.katex` `fontFamily` that bypass the brand path
- **M-MATH-LENGTH** — TeX source > 80 chars per step (heuristic for "split this")
- **M-MATH-COLOR** — `\textcolor{HEX}` calls in TeX with a hex not in the brand palette

---

## Implementation status (May 18, 2026)

All four phases shipped.

**Phase 1 — Core component + write-on reveal** ([commit](../remotion-templates/src/components/MathExpression.tsx))
- `<MathExpression>` (KaTeX wrapper + reveal-mask clip-path)
- `MathReveal` template
- 13 unit tests

**Phase 2 — Multi-step engine** ([commit](../remotion-templates/src/components/MathCrossfade.tsx))
- `<MathCrossfade>` engine (time-driven step sequencing + opacity crossfade)
- `MathDerivation` template
- 22 unit tests (timing math + render correctness)
- 2 real fixtures (Bayes update, PD dominance)

**Phase 3 — Bounded + annotation + inline** ([commit](../remotion-templates/src/components/MathInline.tsx))
- `<MathInline>` component (parses `$...$` in prose)
- Bounded primitive (doctrine + Newton fixture)
- Annotation primitive (doctrine — uses KaTeX `\underbrace`/`\overbrace` natives)
- 21 unit tests (parser + render)
- 2 real fixtures (annotated Bayes, Newton bounded)

**Phase 4 — Doctrine + lint + showcase** (this document)
- This doctrine doc (`project/MATH_RENDER_REGISTER.md`)
- `M-MATH-VALID` lint (`scripts/lint-math-formulas.mjs`)
- `catalog-showcase-math-render` visual reference card
- `visual-spec` skill updated with math chooser table

---

## Skill integration

The following skills consume this doctrine:

- **`visual-spec`** — decides which math primitive (or no math) for each beat. Reads the Decision matrix above.
- **`script-draft`** — writes `[MATH:]` directives in two-column scripts when a beat warrants math. (`[MATH:]` directive parsing is queued for Phase 5; until then, math segments are authored directly in the assembly manifest.)
- **`script-audit`** — verifies every math beat is editorially earned (not decorative), the bounded form names where it breaks, sayability budgets per step are respected.
- **`audio-spec`** — pairs math step holds with narration phrasing so each step lands ~150ms before the narrator names it (per POLISH.md D17 anticipatory-reveal doctrine).

# Syllogism — Research Dossier

> Created May 19, 2026. Formal deductive argument structure — major premise,
> minor premise, ∴ conclusion. Uniquely Parallax because the channel's
> brand mark (∴) IS the logical operator.

## 1. The form's editorial purpose

Syllogism renders a three-line deductive argument in classical form. Reach for it when the editorial point is the argument's structural validity — when you want the audience to see that a particular conclusion follows from particular premises, and to be able to examine the premises themselves. The form makes assumption-checking possible: "do you accept the major premise? if so, the conclusion is hard to escape." Reach for it MORE when exposing flaws — `validity: "fallacy"` mode with a struck-through ∴ + named fallacy ("Affirming the consequent") is a visceral way to show someone else's reasoning failing.

This is the most distinctively Parallax of the argument primitives. No other geopolitics channel has a visual treatment for deduction. The brand glyph isn't decoration — it's the editorial pivot of the form.

## 2. Canonical idioms

**Classical three-line form (Aristotle / textbook logic).**
"All men are mortal. Socrates is a man. ∴ Socrates is mortal." Stacked, centred, each line gets equal weight; the ∴ symbol distinguishes the conclusion. Used in every formal logic textbook from Aristotle's *Prior Analytics* onwards. The high-trust academic register; reads as "I'm laying out my reasoning, please audit it."
Failure mode: ALL THREE LINES SET IN MONOSPACE makes it look like a code listing, not an argument. Use serif for premises.

**Editorial syllogism (Tetlock / Mearsheimer / Walzer).**
Used by analytical foreign-policy writers when the argument's deductive structure IS the point. Mearsheimer's "Why the Ukraine Crisis Is the West's Fault" explicitly lays out major + minor + conclusion. Walzer's *Just and Unjust Wars* uses syllogism repeatedly to test moral principles. Reference: Foreign Affairs essays from 2010s onwards.
Failure mode: paraphrasing the premises instead of stating them precisely — the form's editorial value depends on the premises being exactly what they claim.

**Fallacy-exposure variant (with struck-through ∴).**
When the editorial point is that someone ELSE's syllogism is invalid. Render the premises faithfully, the conclusion they wanted, then strike through the ∴ and name the fallacy. Used by critics of motivated reasoning: "All democracies are at peace with each other (P1, debated). The US and the USSR are democracies (P2, false). ∴ The US and USSR will be at peace (C, doesn't follow)." Reference: Adam Curtis often uses this rhetorical move audio-only; the visual treatment makes it explicit.
Failure mode: using fallacy mode for an argument that's merely DISLIKED rather than formally invalid. Reserve for genuine logical flaws.

**Implicit syllogism (the premise that's hiding).**
A rhetorical variant where one premise is omitted from the speaker's argument and the visualisation makes it explicit. Aristotle called this an "enthymeme." Editorial use: showing what's being assumed silently. "[All trade is mutually beneficial] / Tariffs reduce trade / ∴ Tariffs reduce mutual benefit." Bracketed premises render in muted color with "[ASSUMED]" annotation.
Failure mode: caricaturing the implicit premise. The audit value depends on naming it fairly.

## 3. General principles

The form's leverage comes from formal precision. Each premise should be:
- **Universal or particular** (clear quantification)
- **Falsifiable** (the reader can imagine evidence that would disprove it)
- **Independent** (P2 doesn't smuggle in P1's conclusion)

The ∴ symbol carries enormous typographic weight as the editorial pivot. It should be large (h1-h2 sized), accent-coloured, and centre-positioned between premises and conclusion. The brand mark IS the visual hinge.

Conclusion should be set in slightly heavier weight than premises — visual signal that "this is the assertion being made." Premises in italic serif (the contemplative-claim register); conclusion in regular weight (the assertion register).

Cleveland / Tufte don't apply directly (this isn't data viz). The relevant aesthetic frame is academic typography — Wittgenstein's *Tractatus* numbered propositions, Euclid's stacked-proof layout, *Principia Mathematica* notation.

## 4. Recommendation for Parallax

Default to the classical three-line form with editorial polish:
- Ordinal labels at left ("1. MAJOR PREMISE", "2. MINOR PREMISE", "C. CONCLUSION") in mono small caps
- Premises in IBM Plex Serif italic at h3 (~36px)
- Conclusion in IBM Plex Serif regular at h2 (~48px) — visibly larger + non-italic to signal assertion
- ∴ symbol in display font at h1 (~64px) in episode accent color, centred
- Fallacy mode: struck-through ∴ + struck-through conclusion + small-caps "FALLACY · <name>" annotation in china-red below

Title block frames the argument ("THE STRUCTURAL ARGUMENT" / "Why realists keep arriving at the same conclusion"). Argument attribution ("— as articulated by Mearsheimer 2014") appears bottom-right in italic serif — the editorial signal that the argument has a named source.

## 5. Current template alignment

`Syllogism` ships with the recommended idiom. `validity: "valid" | "fallacy"` toggle drives the strike-through. `fallacyType: "Affirming the consequent"` etc. surfaces as a labelled annotation. `argumentAttribution` renders the source-of-argument credit.

Default props: Mearsheimer's structural-realist deduction about Russia / NATO expansion. Chosen because it's a real published syllogism with a named attributor, demonstrating the canonical use case.

## 6. Specific upgrades proposed

1. **Implicit-premise / enthymeme variant** (medium effort, medium impact) — schema additions to support `enthymeme: true` + bracketed premises rendered with "[ASSUMED]" annotation. The most pedagogically powerful use of the form.
2. **Multi-step syllogism / polysyllogism** (medium effort, low frequency) — chained syllogisms where one conclusion becomes the premise of the next. Currently single-step only.
3. **Premise validity annotations** (low effort, medium impact) — per-premise tags ("debated", "stipulated", "false") rendered as small annotations next to each premise. Distinguishes provisional vs. accepted premises.
4. **Decision-tree-style branching** (high effort, low frequency) — "if you accept P1 → conclusion follows; if not → here's the consequence." Probably belongs in `ConditionalArgument` template, not here.

## 7. Failure mode flags

- **Three statements that aren't actually syllogistic** — a list of three claims is not a syllogism. The form requires P1+P2 → C where C follows from the conjunction of P1 and P2.
- **All three lines paraphrased, not quoted** — when the source is a real author's argument, the value depends on the premises being verbatim or near-verbatim. Otherwise it's editorial fiction.
- **Fallacy mode for arguments that aren't actually fallacies** — saying "this is wrong" via the strike-through is dishonest if the argument is merely disputed. Reserve `fallacy` mode for formal logical errors.
- **Premises too long** — the form's editorial value is precision. Premises > 22 words read as paragraphs, not propositions.
- **No conclusion-weight differentiation** — if the conclusion renders at the same visual weight as the premises, the assertion register is lost. The conclusion MUST be heavier than the premises.
- **Missing ∴** — the brand mark is the form's editorial pivot. Don't omit.

# AxiomList — Research Dossier

> Created May 19, 2026. Numbered foundational claims — the "here are
> the N assumptions this analysis rests on" form. Euclidean register.

## 1. The form's editorial purpose

AxiomList renders a numbered list of foundational claims — the assumptions a worldview, school of thought, or analytical framework presupposes. Reach for it at the start of long analyses to lay groundwork ("Realist analysis presupposes four claims"), or as a structural recap of a worldview's pillars. The form makes the assumptions explicit and audit-able: the reader/viewer can see which axioms they accept, which they don't, and what changes if any are dropped. Distinct from a generic bulleted list — axioms are *foundational*; they ground further argument.

The form is high-trust and slow-paced. Use rarely (1-2 per episode max) — overuse degrades the "here are the load-bearing assumptions" weight to "here's another list."

## 2. Canonical idioms

**Euclid's *Elements* (the original numbered-proposition form).**
Greek mathematician's geometry text (c. 300 BCE) opens with 5 axioms ("postulates") + 5 common notions, numbered 1-5, each one sentence. Centuries of mathematical writing followed this convention. The visual register: large ornamental numerals, premise text in regular weight, no decoration. The point is that EACH axiom stands as a self-evident claim that the rest of the system rests on.
Failure mode: too many axioms (>7) — the form's editorial value depends on the claim that the assumptions are FEW. Sixteen axioms reads as a list of opinions.

**Wittgenstein's *Tractatus* (decimal-indent variant).**
1922 philosophical work organised as 7 numbered propositions, each elaborated with sub-numbering (1.1, 1.11, 1.12...). Visual hierarchy via numbering depth. Used by analytic-philosophy outlets when the editorial argument is "here's the formal structure of my position."
Failure mode: decimal nesting > 2 levels deep — readers lose the hierarchy. Cap at depth 2 (axiom → sub-axiom).

**Spinoza's *Ethics* (axioms + propositions + scholia).**
17th-century rationalist philosophy book structured as axioms (definitional claims) → propositions (consequences) → scholia (commentary). Visual treatment: axioms get bold ornamental numerals, propositions get plain numerals, scholia in smaller italic. The "geometric method" applied to ethics.
Failure mode: mixing the three categories visually — readers lose the axioms/propositions/scholia distinction. Reserve AxiomList specifically for the axiom tier.

**Modern academic IR (Waltz / Mearsheimer four-assumptions form).**
*Theory of International Politics* (Waltz 1979) opens by listing the four assumptions of structural realism. Mearsheimer's *Tragedy of Great Power Politics* (2001) opens with five "bedrock assumptions." This is the contemporary social-science equivalent — small numbered claims that the rest of the book rests on. Reference: any IR textbook's first chapter.
Failure mode: assumptions buried in prose. The form's editorial value comes from extracting them and listing them visibly.

## 3. General principles

The form's leverage comes from foundationality + explicitness. Each axiom should be:
- **Foundational** — the analysis doesn't work without it
- **Stipulated, not argued** — the form presents axioms as claims the audience can choose to accept or reject, not as conclusions of further argument
- **Contestable** — if an axiom is uncontroversial ("the sky is blue"), it's not worth listing. The audit value depends on the axiom being DISPUTABLE
- **Short** — ≤ 22 words. These are headlined claims, not paragraphs

Numbering carries the editorial register:
- **Arabic (1. 2. 3.)** — neutral, contemporary
- **Roman (I. II. III.)** — formal, weighty, classical (use for centuries-old systems: Euclid, Aquinas, Hobbes)
- **Lower Roman (i. ii. iii.)** — academic, footnote-like
- **Decimal (1.1, 1.2)** — Wittgensteinian, technical-philosophy register

Emphasis tiers (key / normal / disputed) ARE the editorial argument. A "key" axiom (max 1 per list) is the load-bearing one — the one that, if removed, collapses the system. A "disputed" axiom (struck through) names what a rival school rejects.

## 4. Recommendation for Parallax

Default to arabic numbering with:
- Ornamental large display-face numerals (h2 size, accent-coloured for "key", muted for "normal", china-red for "disputed")
- Axiom text in IBM Plex Serif at h3 (body+4) — readable but not headline-sized
- Optional italic gloss in body size, muted color
- "Key" axiom gets accent left-rail (3px gold border) + heavier weight
- "Disputed" axiom gets strike-through in china-red + struck gloss

Framing line (top, italic serif body) introduces the list: "Realist analysis presupposes four claims about the international system. Each is contestable; none is obvious."

3-5 axioms is the sweet spot. 2 reads as "a list" not an axiom system; 7+ reads as a survey of claims rather than foundational structure.

## 5. Current template alignment

`AxiomList` ships with the recommended idiom. `axioms[]` array (min 2, max 7), per-axiom `emphasis: "key" | "disputed" | "normal"`, optional `gloss` for each. `numbering: "arabic" | "roman" | "lower-roman" | "decimal"` with `decimalRoot` for Wittgensteinian style. `framing` for the introductory line. Reveal timing: rows fade and rise in on an even `staggerSec` cadence (default 0.55s); give a row its own `atSec` to land it on the sentence that speaks it (added Oct 10, 2026). The list is laid out as one centred block; lists of four or fewer rows use a larger type scale.

Default props: Waltz's four assumptions of structural realism. Axiom 1 ("anarchy") is `emphasis: "key"`; axiom 3 ("rationality") is `emphasis: "disputed"` (the one behavioralists reject). Demonstrates the canonical use of both emphasis tiers.

## 6. Specific upgrades proposed

1. **Decimal sub-axioms** (medium effort, low frequency) — currently `decimal` numbering is flat (1.1, 1.2). Wittgenstein's *Tractatus* has nested decimal (1.1, 1.11, 1.12, 1.2, 1.21...). Adding nested support would unlock the full Tractarian register.
2. **Audio-driven axiom reveal** (medium effort, high impact) — currently axioms reveal at a fixed stagger. Sync to narration sync points so each axiom lands ~150ms before the narrator names it (matches the D17 anticipatory-reveal doctrine).
3. **Side-by-side rival axiom lists** (high effort, medium impact) — comparing two schools' axioms ("realist axioms ↔ liberal axioms ↔ constructivist axioms"). Probably belongs in `ComparisonPair` with two AxiomLists, not a new variant.
4. **Cited-axiom attribution** (low effort, medium impact) — schema additions for `axiom.attribution: "Waltz 1979"` rendered as small attribution next to each axiom. Useful when listing axioms from different sources.

## 7. Failure mode flags

- **Too many axioms (>7)** — the form's editorial leverage requires FEW assumptions. List of 12 reads as a survey, not an axiom system.
- **Non-foundational claims listed as axioms** — if a "axiom" is actually a conclusion of further argument, it's not foundational; it's just a list item. Reserve AxiomList for true foundations.
- **All axioms in same emphasis tier** — using `emphasis: "key"` on all of them defeats the hierarchy. Max 1 "key" per list.
- **"Disputed" emphasis on something merely disliked** — like fallacy mode in Syllogism, "disputed" should mean "rejected by a named rival school." Not "we don't like this assumption."
- **Numbering style mismatched to era** — using Wittgensteinian decimal for a classical-Greek argument is anachronism (and pedantic). Use roman for pre-modern, arabic for contemporary.
- **No framing line** — without "Here are the N axioms of X" intro, the list reads as floating claims. The framing is what makes them axioms-of-something.

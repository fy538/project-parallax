# DialecticFlow — Research Dossier

> Created May 19, 2026. Hegelian thesis → antithesis → synthesis.
> Three-panel triangle layout showing contradictory claims resolving
> into a higher-order position.

## 1. The form's editorial purpose

DialecticFlow renders the classical Hegelian structure: a thesis is asserted, an antithesis contradicts it, and a synthesis emerges that incorporates both. Reach for it when the editorial argument is *"the apparent contradiction between A and B is resolved at a higher level by C"* — and specifically when C isn't a compromise (which would be ConditionalArgument) but a transcendence of the apparent contradiction. The form is the visual signature of Hegelian / Marxian / Adorno-style philosophy and shows up wherever an analyst wants to argue that an unstable opposition has produced a new stable position.

Use rarely (1-2 per episode max). The form makes a strong philosophical claim — that history / argument / ideas progress through dialectical resolution — and overuse trivialises it.

## 2. Canonical idioms

**Hegel's triangle (Phenomenology of Spirit).**
The original. Thesis (Being / Sein) ← contradicts → Antithesis (Nothing / Nichts) → Synthesis (Becoming / Werden). Visual treatments since the 1800s have used a triangle: T top-left, A top-right, S bottom-centre, with arrows converging from T and A into S. Reference: Hegel's *Encyclopedia of the Philosophical Sciences* (1817).
Failure mode: representing the synthesis as a midpoint AVERAGE of T and A — Hegel's point was that S TRANSCENDS T and A, doesn't compromise between them.

**Marx's commodity dialectic (Capital).**
Use-value (T) ← labor-power as commodity (A) → Surplus value (S). The dialectic exposes the contradiction inside capitalism: that workers SELL their labour-power as a commodity, the same labour-power that creates the value. Reference: *Capital* Volume I, chapter 1.
Failure mode: applying the form to non-dialectical pairs. Capitalism / socialism is NOT a dialectical pair — they're two systems. A dialectic requires the antithesis to emerge from within the thesis.

**Adorno's negative dialectics (no synthesis).**
1966 work argued that genuine dialectical thinking doesn't reach synthesis — the contradiction is the truth. Visual treatment: T and A panels with no S panel, just an "APORIA" tension marker between them. Editorial use: when the analyst wants to argue the contradiction is REAL and unresolvable. Reference: Adorno's *Negative Dialektik*.
Failure mode: showing aporia mode when the analyst actually DOES have a synthesis in mind. Reserve for genuine "this isn't resolved" arguments.

**Modern policy-analysis dialectic (Rodrik / Mearsheimer).**
Used by analysts to show how a policy regime emerged from resolving an apparent contradiction. Rodrik's trade work: "free trade benefits all (T) ↔ free trade harms displaced workers (A) → managed trade with adjustment assistance (S)." Mearsheimer's offensive realism: "states want security (T) ↔ states want power (A) → states maximise power as the surest path to security (S)." Reference: Rodrik, *Straight Talk on Trade* (2017).
Failure mode: synthesis that's actually just a third option, not a transcendence of T and A. The synthesis must explain WHY T and A appear to contradict.

## 3. General principles

The form makes three load-bearing claims:
- **The contradiction is real** — T and A aren't merely different opinions; they're substantively incompatible at the level they're stated
- **The contradiction is productive** — it generates pressure for resolution; it's not a permanent stalemate
- **The synthesis transcends** — S isn't a compromise; S explains WHY T and A appeared to contradict and resolves the contradiction at a higher level

Visually, the triangle layout (T top-left, A top-right, S bottom-centre) carries the editorial meaning:
- T and A are visually equal (same panel size, opposing colours) — they're real options
- The tension marker between them encodes the contradiction
- Converging arrows down into S show the resolution
- S has visual weight (shadow, accent border) — the editorial argument is that this is where the analysis arrives

Hegel's "Aufhebung" (sublation) is the technical concept: S preserves what's true in both T and A while overcoming what's contradictory.

Colour register: thesis in dustblue (cool, established), antithesis in china-red (warm, contesting), synthesis in episode accent (gold by default — the editorial conclusion).

## 4. Recommendation for Parallax

Default to the Hegelian triangle with:
- Thesis (top-left): dustblue top border, displays in IBM Plex Sans, body in italic serif
- Antithesis (top-right): china-red top border, same typography
- Tension marker centred between them: "CONTRADICTION" in china-red mono small caps + horizontal opposition arrows (← →)
- Convergence arrows: thin lines from thesis-bottom and antithesis-bottom down into synthesis-top
- Synthesis (bottom-centre): gold top border, slight drop shadow (the emergent register)
- Each panel has optional attribution ("Ricardo, 1817") rendered bottom-right of panel in mono small caps

Title block frames the dialectic ("THE TRADE DIALECTIC" / "How modern industrial policy emerged from a contradiction").

For the `Adorno aporia variant`, render only T and A (no S panel) with the tension marker enlarged and an editorial caption beneath: "The contradiction is the truth."

## 5. Current template alignment

`DialecticFlow` ships the Hegelian triangle. `thesis`, `antithesis`, `synthesis` panels each with `label` + `body` + optional `attribution`. `tensionLabel` defaults to "Contradiction" (overridable: "Aporia", "Paradox", "Antinomy"). Both convergence arrows draw simultaneously into the synthesis position.

Default props: Rodrik's trade dialectic (free trade T / trade harms A / managed trade S). Demonstrates the modern policy-analysis use of the form with attributions from three different eras (Ricardo 1817, Polanyi 1944, Rodrik 2017).

## 6. Specific upgrades proposed

1. **Aporia variant** (low effort, medium impact) — schema field `mode: "synthesis" | "aporia"`. Aporia mode hides synthesis panel + arrows; enlarges tension marker; shifts colour register to muted (no resolution = no warm closure). Adorno's negative-dialectics register.
2. **Chained dialectic** (high effort, low frequency) — synthesis becomes the new thesis for the next round (S₁ → T₂ → A₂ → S₂). Hegel's actual *Phenomenology* unfolds as 8 of these. Probably overkill for video.
3. **Per-panel attribution as full citation** (low effort, medium impact) — currently `attribution` is a short string. Expand to support `attribution: { name, year, source }` rendered as `Ricardo, 1817 — *Principles of Political Economy*`.
4. **Trichotomy variant** (medium effort, low frequency) — three positions in tension with no obvious synthesis. Triangle layout with NO arrows, just three panels and centre-marker. Useful when the editorial argument is "these are the three competing positions; we'll explore each." Probably belongs in `FrameworkDiagram` matrix variant, not here.

## 7. Failure mode flags

- **Synthesis as compromise** — S that's just the midpoint of T and A misses the editorial point of the form. The synthesis must TRANSCEND, not merely AVERAGE.
- **Non-dialectical pair** — T and A that are simply different opinions (not substantively contradictory) doesn't fit the form. Use `ComparisonPair` for general two-position comparisons.
- **Synthesis that doesn't explain the contradiction** — the synthesis must do interpretive work: "T and A appeared to contradict because of X; the synthesis resolves X." Otherwise it's a third option, not a Hegelian resolution.
- **Triangle layout with synthesis at the top** — convention is bottom-centre (the dialectic moves downward / forward into the resolution). Top-centre synthesis confuses the temporal/logical flow.
- **Permanent aporia framed as resolution** — using full DialecticFlow when the analyst's argument is actually "this isn't resolvable." Use the Adorno aporia variant instead.
- **Hegel-by-name without Hegel-in-substance** — invoking the form for any old contradiction. The form is specifically about productive contradictions that DO resolve at a higher level. Don't trivialise.

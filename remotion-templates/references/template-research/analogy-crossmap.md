# AnalogyCrossmap — Template Dossier

**Template:** `AnalogyCrossmap`  
**Family:** Argument Primitives  
**Schema:** `src/templates/AnalogyCrossmap/schema.ts`  
**Component:** `src/templates/AnalogyCrossmap/AnalogyCrossmap.tsx`  
**Shipped:** May 20, 2026

---

## Editorial argument

**Structural mapping between two domains — and where the analogy breaks.**

The bounded analogy is Parallax's signature editorial move: "this analogy is useful *here*, misleading *there*, dangerous if overextended." AnalogyCrossmap makes that move visual. Two columns of named elements, connected by SVG paths that encode mapping strength. The editorial revelation moment is when break connections appear — making explicit *where the analogy fails*.

This is the difference between Parallax's content and civilizational-prophecy channels that use analogies without naming their limits. The form disciplines the author to:
1. Identify structural elements in both domains
2. Draw the correspondences explicitly
3. Name the breaks — the places where the analogy misleads

**Canonical example:** Prisoner's Dilemma ↔ Nuclear Deterrence
- Mutual Defection → Mutual Strike (strong — holds)
- Cooperation → Détente (strong — holds)
- Dominant Strategy → First-Strike Logic (weak — partial, game theory doesn't fully explain deterrence stability)
- One-Shot Game → Indefinitely Repeated (break — PD assumes one round; deterrence runs across decades with reputation compounding)

---

## State-of-the-art editorial reference

No single canonical outlet for this form — it's more philosophy seminar than data visualization. The closest references:

- **Conceptual bridging diagrams** in academic philosophy papers (two-column node-arc diagrams showing structural homomorphism between domains)
- **NYT / FT structural analogy callouts** — prose form, never visual; AnalogyCrossmap makes the same argument in a diagram
- **Decision-tree research literature** on bounded analogy (Gentner 1983, Holyoak & Thagard 1989 on structure mapping) — academic convention is two-column with arc connection

Key conventions from the literature:
- Source domain always LEFT, target domain always RIGHT (by analytic convention — the "known" frames the "unknown")
- Arc type encodes mapping quality — solid/dashed visual distinction matches logic textbook conventions
- Break arcs deserve a text label (the break IS the editorial point, not a visual afterthought)

---

## Parallax defaults

| Field | Default | Rationale |
|-------|---------|-----------|
| `durationSec` | `12` | Enough time to read all elements before paths draw |
| `backgroundVariant` | `"light"` | Analytical register — editorial work on light background |
| `sourceDomain.subtitle` | optional | Gloss helps when domains have competing definitions (e.g., "Formal game theory") |
| `breakNote` | strongly recommended | The form's editorial payoff — always include when break mappings exist |

---

## Connection strength register

| `strength` | Visual | Semantic | Opacity |
|---|---|---|---|
| `"strong"` | 2.5px solid `palette.gold` | Analogy holds — structural homomorphism | 100% |
| `"weak"` | 1.5px dashed `palette.umber` 8/4 | Partial mapping — holds in some respects | 65% |
| `"break"` | 1.5px dashed `palette.taupe` 12/6 | Analogy fails — COUNTERFACTUAL REGISTER | 45% |

The break register follows `project/COUNTERFACTUAL_REGISTER.md` exactly: `strokeDasharray="12 6"`, `opacity=0.45`. This means break connections read as "ghost" paths — present but visually subordinate until the narrator names them.

---

## Reveal sequence

```
t=0.4s   Domain headers (left + right) fade in simultaneously
t=1.0s   Source elements stagger in (150ms each)
t=1.8s   Target elements stagger in (150ms each)
t=2.8s   Strong + weak paths draw on (auto-stagger 300ms, or explicit revealAtSec)
t=4.5s   Break paths draw on — the editorial revelation moment
t=6.0s   breakNote fades in (the named limit — anchors the viewer's takeaway)
```

The 4.5s delay before break paths is intentional: the viewer should first see the analogy working (strong paths), then understand why it matters (the intellectual satisfaction of recognition), then have the limits named (the Parallax discipline).

---

## Layout geometry

- Canvas: 1920×1080
- Source column center: x≈430, card width 300px
- Target column center: x≈1490, card width 300px
- SVG bridge: full-canvas overlay, cubic Bezier control points at ±200px inset from column edges
- Maximum elements per column: 6 (recommended ≤5 for readability at video scrub speed)

---

## Path midpoint labels

Each mapping can have an optional `label` rendered as a small mono-caps badge at the Bezier midpoint:
- "Maps to" — for strong connections (default)
- "Partial" — for weak connections
- "Breaks here" — for break connections (recommended)
- Custom text — any string ≤ 15 chars

Labels at path midpoints add visual anchoring but compete for attention; use sparingly on break connections (most impactful) and omit on routine strong connections in dense diagrams.

---

## Catalog fixtures

- `data/episodes/catalog/analogy-crossmap-prisoners-nuclear.json` — Prisoner's Dilemma ↔ Nuclear Deterrence, 4 elements each, 3 strong/weak + 1 break, full `breakNote`, `durationSec: 12`
- `data/episodes/catalog/analogy-crossmap-franchise-empire.json` — Franchise ↔ Imperial patron-client, 5 elements each, 3 strong + 1 weak + 1 break, `breakNote` on voluntariness/exit asymmetry, `durationSec: 14`

---

## When NOT to use

- Non-analogical comparisons ("USA has X, China has Y") → **ComparisonPair**
- Dialectical pairs (thesis/antithesis needing synthesis) → **DialecticFlow**
- Historical path + counterfactual branches → **CounterfactualPath**
- More than 6 elements per domain (diagram becomes unreadable at 1080p) → split into two separate AnalogyCrossmap segments
- No break mappings exist (every element maps cleanly) → the bounded analogy form is still valid; omit `breakNote` when the analogy is genuinely without significant limits. But question whether the analogy actually needs bounding — most don't hold universally.

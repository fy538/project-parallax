# ToulminMap — Template Dossier

**Template:** `ToulminMap`  
**Family:** Argument Primitives  
**Schema:** `src/templates/ToulminMap/schema.ts`  
**Component:** `src/templates/ToulminMap/ToulminMap.tsx`  
**Shipped:** May 20, 2026

---

## Editorial argument

**Making the warrant explicit.** Toulmin's 1958 model disaggregates an argument into six functional roles. ToulminMap renders that anatomy visually. The editorial contribution isn't showing data or claim — it's surfacing the WARRANT: the unstated logical bridge that lets the claim follow from the data.

Most arguments in public discourse hide their warrants. Making the warrant visible is an act of intellectual transparency — and an act of critique. When the warrant is shaky, the whole argument collapses. ToulminMap forces the author to name it and forces the viewer to evaluate it.

**Canonical use cases:**
- "Taiwan's chips → strategic deterrence" — the warrant is "control over critical chokepoints grants leverage" (implied, never stated in most geopolitical analyses)
- "Sanctions against Russia → policy effectiveness" — the warrant is "economic pain translates to political concession" (historically contested)
- "Democracy → stable alliances" — the warrant is "shared institutions create durable coordination" (valid but qualified)

---

## Toulmin's six elements

| Element | Role | Visual position |
|---|---|---|
| **Data** | Grounds / evidence — the factual starting point | Left column |
| **Claim** | Conclusion — what is being asserted | Right column |
| **Warrant** | Logical bridge — WHY the data entails the claim | Center, top row (focal point) |
| **Backing** | Support for the warrant itself — authority, precedent, theory | Below warrant (dashed umber border) |
| **Qualifier** | Modal strength — "probably," "in most cases," "as long as" | Below claim (dashed umber border) |
| **Rebuttal** | Conditions under which the warrant fails — "UNLESS…" | Below claim, branching right (COUNTERFACTUAL REGISTER) |

Reference: Toulmin, S. (1958). *The Uses of Argument*. Cambridge University Press.

---

## State-of-the-art editorial reference

This form has no canonical data-visualization outlet — it's a philosophy-of-science tool adapted for editorial use. References:

- **Academic argument mapping tools** (Rationale, Argumentor, Argument Web) all render the Toulmin model visually — typically with colored boxes for each element
- **Wigmore charts** (legal reasoning) share the node-arc structure but encode evidential weight rather than logical role
- **Philosophy coursework diagrams** — the convention is D-W-C horizontal with B below W and Q below C

Parallax adaptation decisions:
- **Dark border on Warrant box** — gold `1.5px solid` + subtle glow; breaks the visual symmetry to signal "this is what to interrogate"
- **COUNTERFACTUAL REGISTER for Rebuttal** — dashed china-red at 45% opacity signals "this is the condition that breaks the argument" (matching `project/COUNTERFACTUAL_REGISTER.md`)
- **Dashed umber borders on Backing and Qualifier** — visually subordinate to the main D-W-C horizontal; supporting elements, not load-bearing

---

## Parallax defaults

| Field | Default | Rationale |
|-------|---------|-----------|
| `durationSec` | `14` | Sequential reveal needs time to breathe — viewer must process each element before the next appears |
| `revealMode` | `"sequential"` | Argument construction order — Data first, Warrant second (the revelation), Claim third (payoff), subordinates after |
| `claim.emphasis` | optional `true` | Renders claim in gold accent background — use when this is the episode's editorial thesis |
| `rebuttal.prefix` | `"UNLESS"` | Toulmin's canonical form; can override to "EXCEPT WHEN," "BUT IF" |
| `warrant.label` | `"WARRANT"` | Can override to "WHY?" or "BRIDGE" for less philosophical register |

---

## Reveal sequence (sequential mode)

```
t=0.5s   DATA fades in (grounds established)
t=1.8s   WARRANT fades in + DATA→WARRANT arrow draws (logical bridge revealed — key moment)
t=3.2s   CLAIM fades in + WARRANT→CLAIM arrow draws (conclusion follows)
t=4.5s   BACKING fades in + vertical dashed connection (if present)
t=5.5s   QUALIFIER fades in + vertical dashed connection (if present)
t=6.5s   REBUTTAL fades in + dashed branching arrow (if present)
```

The 1.3s gap before Warrant is intentional: the viewer reads the data, wonders "so what?", and then the warrant appears and names the logical move. This is the editorial beat the template is built around.

In `simultaneous` mode all six elements appear at once — use when the argument is a reference diagram rather than a reveal.

---

## The warrant as editorial focal point

The Warrant box is the most visually prominent element:
- **Full 1.5px gold border** (other boxes use 1px umber or dashed umber)
- **Subtle gold glow shadow** — box-shadow at low intensity
- **Larger font-size** than Backing/Qualifier

This visual hierarchy encodes an editorial claim: "examine this bridge." The argument lives or dies here. When evaluating a geopolitical argument — sanctions, deterrence, alliance stability — ask: "What is the warrant? Is it historically supported? Is it contested?"

---

## Rebuttal as COUNTERFACTUAL REGISTER

The Rebuttal element uses the same visual register as CounterfactualPath's dashed branches:
- `stroke: palette.china` (the china-red semantic color for opposition/rebuttal)
- `strokeDasharray: "12 6"`
- `opacity: 0.45`

This is consistent with `project/COUNTERFACTUAL_REGISTER.md` — the rebuttal is the condition under which the argument's conclusion would NOT follow. Visual consistency across the Argument Primitives family means viewers learn the register once and apply it across templates.

---

## Catalog fixtures

- `data/episodes/catalog/toulmin-taiwan-semiconductor.json` — Taiwan TSMC deterrence argument, all 6 elements, sequential reveal, `durationSec: 14`
- `data/episodes/catalog/toulmin-sanctions-effectiveness.json` — Russia sanctions effectiveness argument, 2 data items, all 6 elements, explicit qualifier + rebuttal

---

## When NOT to use

- Evidence-only segments with no logical inference → **StatReveal** or **KPICard**
- Argument where the warrant is genuinely self-evident (the form's power requires a *hidden* warrant to surface)
- Chains of more than 2 inferences (Toulmin is one argument move; for multi-step proofs use **MathDerivation** or **AxiomList**)
- General argument breakdown without logical structure → **FrameworkDiagram** or **DialecticFlow**

---

## Relationship to other Argument Primitives

- **Syllogism** — formal deductive structure (major/minor premise/conclusion); Syllogism is more rigid (both premises must be stated) and targets logical *validity*; ToulminMap is more flexible and targets logical *warrant anatomy*
- **AxiomList** — foundational claims; AxiomList is for grounding (listing what is assumed); ToulminMap is for inferential *connection* (how data entails claim)
- **CounterfactualPath** — ToulminMap's Rebuttal is a single condition; CounterfactualPath is a branching *history*. Use CounterfactualPath when the "what if" branch is the entire editorial argument, not a qualifier
- **AnalogyCrossmap** — ToulminMap can be used AFTER AnalogyCrossmap: first map the analogy (AnalogyCrossmap), then make the argument that rests on it (ToulminMap with the analogy as the warrant)

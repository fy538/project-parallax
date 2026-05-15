# BayesianUpdate — Research Dossier

> Created: May 15, 2026. Research compiled from primary sources (Spiegelhalter, Gigerenzen, FiveThirtyEight, RAND Corporation, The Economist); integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## TL;DR

**Prior shown first and held — then evidence cards arrive one by one, each shifting the distribution curve leftward or rightward — posterior reads at top of frame throughout. Three variants: `single` (one bell curve), `compare` (two competing curves, US-blue vs. China-rust), `multi` (horizontal probability bars for 3–6 hypotheses). Never start at the posterior. Always show the prior → evidence chain explicitly. `durationSec: 10–14`.**

---

## 1. The form's editorial purpose

BayesianUpdate earns its rectangle when **the episode's argument is itself a probability argument — when the narration explicitly walks through prior belief, new evidence, and updated belief.** The viewer's takeaway should be: *"I can see my initial estimate being revised by each piece of evidence — I understand why the posterior is different from the prior."* Use it when the script contains the phrase structure "before X, we might have believed Y; after X, the evidence pushes us toward Z."

This template is NOT a general probability display. ProbabilityGauge is the form for "what are the odds of X at this moment." BayesianUpdate is the form for "why did the odds change," and it requires the prior → evidence → posterior arc to be narrated explicitly.

### When not to reach for it

| Alternative | When it wins over BayesianUpdate |
|---|---|
| **ProbabilityGauge** | You have a point-in-time probability without the prior-update arc. |
| **StatReveal** | The figure is a fact, not a probability estimate. |
| **DataChart** | The episode has multiple probability scenarios that don't share the same prior. |
| **DecisionTree** | The argument is about conditional choices, not about updating a belief. |

**BayesianUpdate's superpower fires when:** the episode explicitly narrates that new information is changing an assessment — geopolitical probability arguments, intelligence-style "revised estimate" framings, prediction market updates.

---

## 2. Canonical idioms

### a. Spiegelhalter "natural frequencies" visualization

David Spiegelhalter (*The Art of Statistics*, 2019; co-developer of the Winton Centre at Cambridge) advocates replacing probabilities with concrete natural frequencies: instead of "12% probability," show "12 of 100 dots in this grid are red." Natural frequencies were shown by Gigerenzen & Hoffrage (1995, *Psychological Review*) to dramatically improve Bayesian reasoning comprehension in general populations. The ISOTYPE chart (see `isotype-chart.md`) is the visual ancestor.

Not directly implemented in the template but represents the epistemically superior form for non-technical audiences. For Parallax's "smart friend over drinks" register, the bell curve idiom is more contextually legible (the prior/posterior relationship reads as a shape), but the natural-frequency framing should be kept in mind when writing evidence label copy: "In 9 of 10 historical precedents, X occurred" is stronger than "historical base rate of X is 89%."

### b. FiveThirtyEight election model update

The canonical modern editorial form. A flowing bar or gauge that visibly shifts from a prior probability to a posterior as new evidence (poll results, economic indicators) arrives. Nate Silver's model updates in real time; the editorial presentation shows "current estimate vs. yesterday's" as the delta. FiveThirtyEight's house style: probability as a number (not a curve), the change shown as an arrow with a +/- figure.

*Works because:* the probability number is the argument; the change is the news. *Fails when:* the change is sub-1% — the update is invisible without the distribution width as context. This is exactly what the bell curve idiom solves: narrow distribution = confident estimate; wide distribution = uncertainty still large.

### c. The Economist "Bayes' theorem explained"

Step-by-step panel strip: prior → likelihood → posterior; each step gets its own labeled panel. Used in data journalism sidebars and Economist Films explainers. The template's `phases`-like structure (intro → prior displayed → first evidence → second evidence → ... → posterior) maps to this structure. The key editorial discipline: **show the prior first and hold it before the first evidence arrives.** Viewers who don't see the prior established can't experience the update.

*Works because:* the sequential step-by-step structure is pedagogically correct for Bayesian reasoning. *Fails when:* too many steps (>5 evidence items) — the composition runs too long and the viewer loses the thread from prior to posterior.

### d. RAND scenario probability updates

Used in crisis-game analysis and intelligence-community probability assessments (the Analytic Standards codified in the IC's *Intelligence Community Directive 203*). Prior from historical base rates; update from new intelligence; posterior shown as a range (credible interval), not a point estimate. Key RAND convention: the posterior is always shown as a range to communicate remaining uncertainty. This contrasts with FiveThirtyEight's point estimate.

*Works because:* ranges communicate epistemic honesty. *Fails when:* the range is too wide to be actionable ("30–70% probability") — which is the IC's actual experience. Parallax's analytical register leans toward naming the range but making the point estimate the editorial claim: "we assess 60%, with high uncertainty."

### e. Nate Silver / 538 "odds ratio" framing

Presents probability as odds (3:1 favorite) rather than percentages for audiences more familiar with betting language. The market-price reference line in the template (`marketPrice` field + dashed amber vertical line) serves this function — it places a real-money prediction market estimate on the probability axis, giving the curve an empirical anchor from aggregate opinion.

*Works because:* betting odds are more cognitively legible than probabilities for audiences that know sports betting. *Fails when:* the prediction market price is itself contested (as Polymarket/Kalshi prices often are during low-volume moments) — the amber reference line may be more misleading than grounding.

---

## 3. General principles

Bayesian updating is cognitively demanding. The editorial discipline of this form is to *slow down the evidence arrival* so the viewer can track each update. The template's per-evidence timing (`perEvidenceFrames = sec(1.8)`) is the minimum — rushed, it looks like a blinking probability number; at the right pace, each evidence card's direction arrow + magnitude dots tell a story.

The distribution curve format (Gaussian bell) makes one claim visible that a bare probability number cannot: **the width of the distribution encodes uncertainty.** A prior at 50% with std=18 is a shrug; a posterior at 65% with std=8 is a conviction. This is the form's editorial superpower over ProbabilityGauge.

The ghost curve (previous distribution at 30% opacity, dashed, during the transition) follows the Economist convention for overlaid confidence intervals: the past belief doesn't disappear — it lingers as a benchmark so the viewer can track the magnitude of the shift. This is crucial for episodes where the shift itself is small; without the ghost, a 5% update is invisible.

**Overshoot convention:** the template's mean overshoots 3% past the posterior target then settles back. This follows the Spiegelhalter presentation convention of showing "revision happened" rather than "revision snapped." The 3% overshoot communicates that real evidence exerts real force on the distribution.

---

## 4. Recommendation for Parallax

**Use `BayesianUpdate` only when the episode script explicitly narrates a prior-updating argument.** The clearest trigger: the script uses "before/after" probability framing or an intelligence-estimate structure ("revised assessment," "given new evidence"). Do not use it as a general probability display.

**Variant selection:**
- `single`: default for episodes with one focal question ("will export controls succeed?"). Curve color from `emphasis.primaryAccent`.
- `compare`: when the episode contrasts two hypotheses ("US decoupling succeeds vs. backfires"). Uses `semantic.us` (blue) vs. `semantic.china` (rust) — the geopolitical semantic colors, not stylistic accents.
- `multi`: for episodes with 3–6 scenario pathways (e.g., "which of four diplomatic outcomes is most likely?"). Horizontal probability bars, not curves; cleaner for dense scenario sets.

**Evidence construction discipline:**
- Always label the prior first, explicitly. The question label (`data.question`) should state the focal probability claim: "P(export controls succeed)" or "Will Taiwan remain de facto independent?"
- Evidence items should be named real events with verifiable sources: "DeepSeek R1 release — challenges US AI lead" rather than "technology shock."
- Magnitude (1–5) should be editorially reasoned: cite the historical base rate shift that justifies a magnitude-4 vs. magnitude-2 update.
- Each evidence item's `source` field should name the information origin: "Reuters, Jan 2024" or "RAND assessment, Nov 2023."

**Timing:**
- `durationSec: 10–14` — the update needs time. At 10s with 3 evidence items and `paceTimingScale: 1.0`, each evidence gets 1.8s and the intro/outro each get 1.5s.
- Show the prior first, hold ~1.5s, then trigger the first evidence. This is enforced by `introFrames = sec(1.5)` in the template.
- For episodes where the posterior is the punchline (the narration says the final probability), pair BayesianUpdate with `anticipatoryStartFrame()` for the final evidence card — it should be settled before the narrator names the posterior.

**Market price benchmark:** use `marketPrice` sparingly — only when a named prediction market (Kalshi, Polymarket, Good Judgment) has published a price for the exact question. Always label the source (`marketSource`). The dashed amber reference line says "real money believes X%; here's our updated analytical estimate."

**`backgroundVariant`:** `"light"` is the default for analytical register. `"dark"` for episodes where the probability assessment is itself a high-stakes judgment (crisis scenarios, war risk). The dark mode's `AmbientParticles` component adds subtle background motion that signals "live situation."

---

## 5. Current template alignment

- ✅ Three variants (`single`, `compare`, `multi`) cover the full range of Parallax use cases
- ✅ Gaussian curve with gradient fill (top transparent → bottom solid) — the NYT/538 standard gradient that communicates "filled area = belief mass"
- ✅ Ghost curve (previous distribution at 30% opacity, dashed) during morph — enables visible shift tracking
- ✅ Overshoot 3% past posterior target then settles — communicates evidence force
- ✅ `marketPrice` reference line (dashed amber vertical) — prediction market anchor
- ✅ Per-evidence `magnitude` shown as 5-dot indicator row — visual shorthand for "how much did this move the needle"
- ✅ Evidence cards: spring entrance (slide in from right + scale 0.85→1.0) + direction arrow (↑/↓) with `semantic.success`/`semantic.danger` color
- ✅ "PRIOR → POSTERIOR" summary label in the evidence panel — makes the full arc explicit
- ✅ Anticipatory reveal (POLISH D17) on `data.question` — question settles 5 frames before `syncPoints[0]`
- ✅ Beat sync via `useBeatSync` — Whisper cues compound the settle pulse at each evidence transition
- ✅ `paceTimingScale` applied to `introFrames` and `perEvidenceFrames` — PACE: annotations work
- ✅ `emphasis.primaryAccent` for single-variant curve — episode color emphasis consumed
- ✅ Compare variant uses `semantic.us` / `semantic.china` (not episode emphasis) — correct; these represent specific geopolitical entities
- ✅ Multi variant: leading hypothesis highlighted (bolder, accent glow) — POLISH D5 hero hierarchy
- ⚠️ Multi variant's `computeMultiHypothesisStates` always shifts hypothesis[0] up/down regardless of evidence direction — evidence labeled `"down"` decreases hypothesis[0] even when the data may mean a different hypothesis should shift. The redistribution logic is symmetrical but doesn't let evidence target a specific hypothesis. Data authors working around this must reorder hypotheses.
- ⚠️ `DISTRIBUTION SHIFT` summary in multi variant only shows hypothesis[0]'s shift. A multi-hypothesis setup may have the largest narrative shift in hypothesis[2] or [3]; the summary label doesn't reflect this.
- ❌ No credible interval (width of distribution) displayed as a numeric range. The curve shape communicates this visually, but for RAND-style analysis, a "65% (45–80% credible interval)" label would match intelligence community conventions.
- ❌ No "base rate" annotation — the historical base rate that justifies the prior is editorially important but has no display field.

---

## 6. Specific upgrades proposed

1. **`credibleInterval: [low, high]` display field.** When provided, renders a bracketed range below the main probability display: "65% [45–80%]". This matches RAND/IC conventions for communicating uncertainty around a probability estimate. Effort: small; impact: adds epistemic precision for episodes making intelligence-style assessments. **(low effort / medium impact)**

2. **`baseRate: number` annotation.** Optional field that places a second dashed vertical line on the probability axis labeled "Historical base rate: X%." Grounds the prior visually — shows the viewer "this prior isn't invented, it comes from base rates." Effort: small; impact: adds credibility anchor. **(low effort / medium impact)**

3. **Evidence-target direction for multi variant.** Add `targetHypothesisIndex?: number` to `EvidenceItem` so evidence can explicitly target a specific hypothesis rather than always shifting hypothesis[0]. This makes the redistribution logic editorially intentional rather than always benefiting the first hypothesis. Effort: small; impact: removes a significant authoring constraint in multi-hypothesis scenarios. **(low effort / high impact)**

4. **`countDisplay: "percent" | "odds"` variant.** When `"odds"`, display the posterior as "3:2" rather than "60%." Implements the Silver/538 odds-ratio idiom for audiences more familiar with betting framing. Would render "3 : 2" in the large display area alongside the curve. Effort: small; impact: niche but directly useful for episodes touching prediction markets or sports-analogy framings. **(low effort / low-medium impact)**

5. **Natural-frequency callout sub-component.** Optional `data.naturalFrequency?: { outOf: number }` that, when set, renders a small ISOTYPE grid alongside the probability display: if `outOf: 100` and posterior is 65%, shows 65 filled dots + 35 empty dots. Bridges the Spiegelhalter idiom into the bell-curve format. Effort: medium; impact: improves lay audience comprehension for high-stakes probability arguments. **(medium effort / medium-high impact)**

---

## 7. Failure mode flags (always catch in audit)

- **Starting at the posterior** — the template enforces `introFrames` before the first evidence, but if `data.evidence` is empty, the composition shows only the prior/posterior without any update arc. Use StatReveal or KineticTypography for a bare probability display.
- **Unlabeled prior** — if `data.question` is omitted, the viewer doesn't know what the probability is measuring. The question field is essential; never omit it.
- **Evidence without sources** — each evidence item that references a real event must have a `source` annotation. Un-sourced evidence reads as invented.
- **Too many evidence items (>5)** — the composition exceeds 14s and the prior-to-posterior arc becomes confusing. Reduce to the three or four most impactful items.
- **Wrong variant for the argument** — `single` for a story where two competing hypotheses are equally valid is missing editorial precision. The `compare` variant (US-blue vs. China-rust) communicates the bilateral tension that many geopolitical arguments require.
- **`magnitude` set to 5 for every item** — this makes every update look equally dramatic and destroys the hierarchy between major and minor evidence. Magnitude should reflect the actual shift in historical base rates; items with magnitude 1–2 exist to show "small nudge" and give the large-magnitude items their contrast.
- **Market price line without source** — the dashed amber reference line is persuasive visual authority; using it without naming the market and price date implies false precision. Always fill `marketSource`.
- **Using BayesianUpdate as ProbabilityGauge** — if the narration only says "there's a 65% chance of X" without a prior-update argument, this template is the wrong form. Use ProbabilityGauge; BayesianUpdate requires the arc.

Last updated: May 15, 2026

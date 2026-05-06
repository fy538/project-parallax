# Parallax — Calibration Language Reference

> Companion to `project/SCRIPT_FORMAT.md` (Psychological Architecture section) and
> `project/psychology/SYNTHESIS.md` (Sections 6, 8, 9).
>
> Purpose: make assertive calibration the default voice register — not a style choice,
> but a repeatable technical vocabulary. Grounded in NFC research (Kruglanski),
> calibration/superforecasting research (Tetlock), and uncertainty communication
> research (van der Bles et al.).
>
> Last updated: May 5, 2026

---

## The Core Principle

**Process certainty + outcome humility.**

Be firm about the analytical procedure — the variables that matter, the frameworks being applied, the conditions under which the analysis would fail. Be softer about specific predicted outcomes. Confidence attaches to the *method*, not to specific forecasts.

This is not hedging. It is a more rigorous analytical posture, and it can be performed with full confidence. Audiences penalize diffuse self-doubt. They do not penalize well-structured uncertainty. The research is unambiguous: vague uncertainty ("it's complicated, who knows") reduces trust. Quantified or bounded uncertainty, when embedded in a confident interpretive frame, preserves or increases it.

---

## The Three-Level Hierarchy

Ranked from most to least credible, supported by multiple independent research programs (Tetlock; van der Bles et al.; Gaertig & Simmons; Wallsten, Budescu & Zwick):

### Level 1 — Quantified uncertainty (best)

Numeric probabilities with explicit rationale. Scoreable. Revisable. Forces precision.

> "My estimate is 65%. The key driver is X. The main disconfirmer is Y."

> "The structural incentives point toward this with roughly 60–70% confidence — the wide range reflects genuine model uncertainty, not analytical hedging."

> "If forced to a number: 55%. I hold it loosely — here's what would push it to 75%."

**Why this works:** Confidence intervals *increase* uptake rather than reducing it. In 11 of 12 incentivized studies (Gaertig & Simmons), participants were more likely to follow interval-bearing advice than point estimates. Audiences read intervals as evidence the communicator is incorporating uncertainty intelligently, not as weakness. Numeric formats also eliminate the interpretation ambiguity of verbal qualifiers — "likely" means 60% to some people, 85% to others.

### Level 2 — Verbal calibration with explicit boundaries (acceptable)

Precise verbal qualifiers anchored to a structural claim, not floating as vague impressions.

> "The most defensible reading is..."

> "What the evidence supports strongly is..."

> "What remains open is X. Three developments would change this assessment."

> "The highest-uncertainty variable here is..."

> "The outside view suggests [base rate]. The case-specific factors push that [up/down] because..."

> "This is the strongest interpretation the evidence supports. It fails if [specific condition]."

**Why this works:** These phrasings offer closure at the level of model boundaries — satisfying the audience's need for structure without claiming more than the evidence supports. They perform confident judgment because they're specific about what the uncertainty is *in*, rather than gesturing at uncertainty in general.

### Level 3 — Vague uncertainty (avoid)

Phrases that signal neither care nor confidence. The fastest route to the leader-uncertainty penalty.

| Avoid | Why |
|-------|-----|
| "Maybe..." / "Perhaps..." | Unanchored — gives no structural information |
| "It's complicated" | Analytical abdication masquerading as humility |
| "Who knows" / "Only time will tell" | Exit state — destroys forward pull |
| "There are arguments on both sides" | Both-sides framing with no analytical content |
| "This could go either way" | Same as "who knows" |
| "I'm not sure but..." | Self-doubt as preamble, not calibrated bound |
| "Possibly..." without a structural claim | Adds hedging weight without information |

The penalty for these is not that audiences dislike uncertainty — it's that these phrases read as *diffuse self-doubt or analytical fragility*, not honest calibration. The same uncertainty, expressed as "The highest-uncertainty variable here is X, because..." is credible. Expressed as "It's complicated, who knows" is not.

---

## Method Certainty vs. Outcome Humility

The defining split of the Parallax voice. Always be assertive about the method and honest about the outcome.

**Be certain about (method):**
- Which variables matter most in this class of problem
- Which frameworks apply and why they apply
- The analytical procedure being used
- The conditions that would force a revision
- What the evidence establishes vs. what it cannot establish
- Which analogies hold and where they break

**Be humble about (outcome):**
- Specific predicted outcomes
- Exact timing of predicted events
- The probability of tail/black-swan events
- Claims that go beyond the evidence base

**Phrasing that executes this split:**

> "Here is what the structural analysis establishes firmly. Here is where prediction
> gets harder — [variable] has too much variance. If I had to name the most likely
> branch: [X]. What would make me wrong: [Y]."

> "The framework is clear. The outcome is not — and I want to be specific about why:
> the [variable] is the load-bearing unknown. If [event], the analysis changes."

---

## The Forecast Format (On-Screen)

For on-screen predictions tagged `[FORECAST:]` in the script — always the 6-layer layered format.
The `ProbabilityGauge` Remotion template implements all six layers.

```
[FORECAST:]
PROBABILITY:      65%           ← whole number, displayed largest
VERBAL TAG:       above even odds  ← anchored to the number, not replacing it
BASE RATE:        Historical precedent for this class: ~50%  ← outside view first
KEY DRIVER:       [single main case-specific factor pushing estimate up/down]
KEY DISCONFIRMER: [evidence that would push the estimate in the opposite direction]
BENCHMARK:        Kalshi: 58% / Metaculus: 61%  ← disciplined rival, not authority
RESOLUTION:       [clairvoyance-test question with specific date and binary/binned criteria]
```

**Rules:**
- Probability goes first, in the largest text on screen. Verbal tag is a caption, not a replacement.
- Always state the base rate (outside view) before the case-specific driver (inside view). This is the most teachable superforecasting habit and should be modeled on screen every time.
- Always include at least one disconfirmer — this is the strongest single credibility signal in the beat. A forecast with no disconfirmer reads as advocacy, not analysis.
- Show the prediction market benchmark. State whether Parallax is above, below, or aligned — and in one sentence, why. This models respect without deference to markets.
- Resolution criteria must pass the clairvoyance test: a hypothetical person with perfect knowledge of the future could unambiguously score this on the specified date. Vague resolutions ("will China become stronger?") fail. Specific resolutions ("will China achieve domestic EUV lithography at 7nm or below by January 2028?") pass.
- Record the full whole-number percentage internally, even if the graphic simplifies it for display.
- Distinguish "my estimate of the event probability" from "my confidence in this estimate" — these are different. When uncertainty is especially high, say so explicitly: "65%, with low confidence in the estimate itself."

**Framing prediction markets correctly:**
Markets are disciplined rivals, not authorities. The useful move: "The market is at 58%; I'm at 67% because I think the market is underweighting X. If I'm wrong about X, I should defer to the market." This teaches viewers how to use benchmarks analytically rather than deferentially.

---

## The "Was I Right?" Retrospective Structure

For `publish-retro` sessions after forecast resolution. Lead with the score, not the story.

1. **Original clip/timestamp** — the exact moment the forecast was made, reproduced verbatim
2. **Original probability + resolution criteria** — reproduced verbatim, no paraphrasing or reframing
3. **All interim updates** — every revision logged with the evidence that triggered it and the date
4. **Final outcome + Brier score** — scored against the stated criteria without adjustment
5. **Error taxonomy** — which kind of miss was this?
   - *Base-rate miss* — wrong outside view; comparison class was off
   - *Causal-model miss* — inside view was structurally wrong
   - *Timing miss* — direction correct, timing wrong
   - *Underreaction* — evidence moved; estimate didn't move enough
   - *Genuine tail event* — correct process, statistically unavoidable miss
6. **Process verdict** — "I would make the same call under the same information" (outcome luck) or "here is the specific process rule that changes" (process error)

**Critical:** The analysis in step 6 comes after the score in step 4, never before. The narrative justification should not precede the evidence. Trust repair research shows corrections are credible when original uncertainty was disclosed and the postmortem distinguishes process quality from outcome luck — and damaging when they look like retrospective goalpost-moving.

---

## Narrator Voice Calibration Checklist

Run this on any narration pass before finalizing:

- [ ] Outside view (base rate) stated before inside view (case-specific reasoning)
- [ ] Multiple hypotheses named, not just the favored one
- [ ] At least one "what would change this assessment" per major analytical claim
- [ ] Uncertainty is specific and anchored ("the highest-uncertainty variable is X" not "this is uncertain")
- [ ] No causal claims pointing to coordinated hidden-agent intent — structural/incentive framing only
- [ ] No Level 3 vague phrases (maybe, perhaps, who knows, only time will tell, it's complicated)
- [ ] Update language shows incremental revision, not heroic reversals ("new evidence shifts this toward X" not "I was completely wrong")
- [ ] Where probabilities are stated verbally, they're anchored to the structural claim ("this is likely" → "the structural incentives favor this, which I'd put at roughly 65%")
- [ ] Confidence intervals present on high-stakes forecasts, not just point estimates
- [ ] Every on-screen prediction has explicit resolution criteria and a disconfirmer

---

## The Anger vs. Anxiety Distinction

Two emotional activations that sound similar in analytical framing but produce opposite downstream behaviors in the audience (Marcus, Neuman & MacKuen; AIT research):

| Framing type | Emotional activation | Downstream behavior |
|---|---|---|
| "Something doesn't add up — the structural incentives produced this outcome" | Anxiety / surveillance system | Risk aversion, careful information processing, openness to revision |
| "Here's who is responsible — they coordinated to produce this" | Anger / grievance system | Punitive information seeking, threat content consumption, closed to updating |

**Parallax uses only the first framing.** Every causal claim should point to mechanisms, incentive structures, and emergent systemic behavior — never to coordinated hidden-agent intent. The structural/incentive framing is not softer. It is analytically more rigorous (systems produce outcomes that appear planned but arise from incentives) and psychologically more durable (anger-activated audiences leave; anxiety-to-inquiry audiences return).

Audit: for every "X happened because..." clause in the narration, the answer should be "the incentive structure / feedback loop / structural pressure produced this" — not "they decided to / they planned to / the cabal orchestrated."

---

## Reference Documents

- `project/psychology/SYNTHESIS.md` — Sections 6 (Epistemic Honesty), 8 (Narrator Voice), 9 (Forecast Format)
- `project/psychology/02-need-for-cognitive-closure.md` — NFC and assertive calibration; leader-uncertainty penalty
- `project/psychology/06-calibration-superforecasting.md` — Tetlock, probability format, "Was I Right?" structure
- `project/psychology/04-narrative-transportation-theory.md` — honesty beats inside narrative motion; trust
- `project/psychology/03-affective-intelligence-theory.md` — anger vs. anxiety distinction; emotional sequencing
- `project/SCRIPT_FORMAT.md` — Psychological Architecture section (operational script requirements)
- `remotion-templates/src/templates/ProbabilityGauge/` — on-screen forecast rendering implementation

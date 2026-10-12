# Lens 10 — Frontstage Rigor Density

Loaded on demand from `SKILL.md`. Run this lens only when the stub there says to.

### Lens 10: Frontstage Rigor Density

This lens owns the *frontstage voice* half of the Parallax editorial doctrine. Lens 9 catches Level-3 vague calibration ("maybe," "perhaps," "who knows"); this lens catches the *opposite* failure mode — backstage rigor leaking forward as **layered hedging**, **false-consensus or false-dispute framing**, or **verification-process narration**. All three read as evasive or anxious to the viewer regardless of how good the underlying research was.

The lens is **not** about reducing intellectual honesty. The bounded-analogy form (one sharp clause naming where an analogy breaks, per NAR-13 and PROJECT_VISION → Bounded Analogy) is *frontstage rigor done right* and should be validated when present. The failures below are specific failure modes, not blanket de-hedging.

#### Failure 1: Layered Hedging

A single hedge per claim, in the right place, is the form. Three hedges stacked is fear:

- "Some scholars have argued, with appropriate qualifications, that this might possibly suggest…"
- "It's worth noting, perhaps, that there may be reasons to think…"
- "While the evidence is incomplete and the debate is ongoing, it could be the case that…"

The test: would a smart advocate for the claim recognize this as *their* phrasing of it, or would they cringe? If they'd cringe, you've over-hedged. Each layered qualification subtracts narrative pull while adding nothing the bounded-analogy form doesn't already provide.

For each instance, suggest a rewrite that keeps the bounded form (one limit clause where it's earning its keep) but removes the fear (other layers):

- Before: *"Some scholars have argued, with appropriate qualifications, that this might possibly suggest a structural pattern, though the evidence remains contested..."*
- After: *"This suggests a structural pattern — though the strongest version of the counterclaim, that X, has real force."*

The "after" version is more confident *and* more honest: it names the specific counter-position rather than gesturing at "contested evidence."

#### Failure 2: False-Consensus or False-Dispute Framing

Two sides of the same coin:

- **False consensus** — a genuinely contested interpretive claim narrated as settled fact. If the brief's research-audit Lens 2d (Disagreement Handling) flagged the claim as contested, the script must honor the contestation. Smoothing it into singular truth is a frontstage failure.
- **False dispute** — a settled empirical claim narrated as if it were debated. Scattered "some say X, others say Y" framing applied to questions that have actual answers, usually because the writer is performing balance. Flag any "experts disagree about whether…" framing where the experts don't actually disagree.

For each, the fix is to match the narration to what the brief's disagreement-handling actually established. If the claim is contested, name one credible counter-position in a single clause — bounded-analogy style — and move on. If the claim is settled, narrate it as settled.

Cross-reference: if `brief.md` exists in the same folder and has Sub-Lens 2d output, use it. If the script-level claim diverges from the brief's contestation status, that's the highest-priority flag in this lens.

#### Failure 3: Verification-Process Narration

Any line where the narration talks about *how the claim was verified* is a frontstage failure. The work was done backstage. The narration's job is the analysis, not the audit trail. Examples to flag:

- "Verified as of [date]" — belongs in the research memo, never in narration
- "According to my research…"
- "I confirmed this with three sources…"
- "After cross-checking the original transcripts…"
- "The strongest version of this claim that survived audit is…"

These break the viewer's experience of the analysis to focus on the analyst's process. They also signal anxiety — the writer is reassuring themselves and the audience that the work was done. The work *was* done; that's why the claim is in the script.

The fix is always the same: cut the verification-process clause entirely. The claim either passes research-audit and gets stated, or it doesn't pass and gets cut. There's no third state where the script earns trust by performing its own verification.

#### Failure 4: Hedge Density Threshold

Beyond individual instances, scan for hedge *density*. Soft rule of thumb: if more than ~15% of declarative sentences carry a hedge marker (*might / perhaps / maybe / arguably / possibly / it's possible that / one could argue / it seems / it appears / suggests / suggests that*), the script has tipped from disciplined bounded analogy into pervasive uncertainty performance. Flag the script-level pattern, not just individual instances.

The fix: leave hedges where they're doing real work (naming where an analogy breaks; flagging a contested interpretive claim; framing a forecast). Remove them everywhere else — turning "this might suggest" into "this suggests" when the suggestion is well-supported, and "perhaps X" into "X" when X is what the writer actually thinks.

#### What to Validate (not flag)

Bounded-analogy moves that are *frontstage rigor done right* — note these as **Frontstage Rigor: Strong** rather than flagging them:

- A single sharp clause naming where an analogy breaks: *"this resembles X — though Z makes the parallel imperfect"*
- One contested-claim hedge that names a credible counter-position: *"the strongest version of the counterclaim is that…"*
- Honest "what would change my mind" lines (per NAR-19) — confidence signals, not hedges
- Falsifiable predictions with named criteria (per NAR-17) — specificity is rigor
- Herzog-style metaphor that earns its keep emotionally without straining literal accuracy

When these are present, count them. They are the form working as designed.

#### Output for this lens

```
Lens 10: Frontstage Rigor Density

Layered hedging instances: [N flagged] — [most common stacking pattern]
False-consensus framing: [N flagged]
False-dispute framing: [N flagged]
Verification-process narration: [N flagged] — [most common location]
Hedge density: [X%] of declarative sentences carry a hedge marker — [BELOW / AT / ABOVE 15% threshold]
Bounded-analogy moves validated: [N — list locations]
"What would change my mind" lines: [N present, N expected per NAR-19]

Verdict: STRONG / DISCIPLINED / OVER-HEDGED — [1-2 sentence summary]
```

A verdict of OVER-HEDGED is high-priority because it directly attacks the channel's interestingness without buying the rigor (which is research-audit's job, not narration's). The fix is rewriting, not researching.

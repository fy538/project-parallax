# Motion Director — Phase 2 Spec (DRAFT)

> An agent that reads an episode's stills + script and **proposes the motion plan**
> (per-shot `motion_technique` + params + seams) into `shot-list.json`, applying the
> six-family taxonomy from `project/CHAINED_STILL_LESSONS.md`. A human reviews; then
> `tools/ai-video/gen_motion_prompts.py` (Phase 1) turns the approved plan into prompts.
>
> Status: design draft (May 23, 2026). Not built. This is the "decision" step — the only
> part of the still→motion pipeline still done by hand.

---

## 1. Where it sits

```
visual-spec (picks templates)  →  stills generated (ChatGPT)  →  [MOTION DIRECTOR]  →  human review
                                                                        ↓
                                                          shot-list.json motion fields
                                                                        ↓
                                              gen_motion_prompts.py (Phase 1)  →  operator runs Pika/AE
                                                                        ↓
                                              render_kenburns.py (ken-burns, local)
                                                                        ↓
                                              critic_loop.py (Phase 3 — verify rendered output)
```

The director **decides**; it does not generate AI video (no API). It can trigger the
deterministic families (ken-burns) but the Pika/AE work stays manual.

## 2. What it decides, per shot

```jsonc
{
  "shot_id": "aigen-04",
  "motion_technique": "live-still",      // ken-burns | live-still | cinemagraph | parallax-2.5d | morph-endpoint | cut
  "params": { /* the matching block: ken_burns{} | live_still_motion | cinemagraph_motion | parallax_2_5d{} */ },
  "seam_to_next": "cut",                 // cut | match-cut | cross-dissolve | morph
  "rationale": "distant back-turned figure walking — live-still is safe and more alive than a push",
  "confidence": 0.86,
  "needs_human_review": false,
  "flags": ["replaces redundant bridge frame"]
}
```

It writes these into `shot-list.json` (the schema Phase 1 already consumes) plus a
human-readable `motion-review.md` report.

## 3. Two stages: Perceive → Decide

### Stage A — Perception (vision)
Analyze each still into a structured record. These are exactly the risk/affordance
features the doctrine's checklist keys on:

```jsonc
{
  "shot_id": "aigen-01",
  "faces":   { "count": 2, "max_scale": "close", "orientation": "front" },
  "figures": { "count": 2, "scale": "close", "implied_action": "seated-writing" },
  "depth":   { "structure": "layered", "clear_layers": ["fg: table", "bg: shelving"] },
  "reflective_surfaces": [],
  "repeating_patterns": [],
  "text_or_marks": ["paper grid tally marks"],
  "ambient_elements": [],
  "resolution": { "width": 1672, "needs_upscale_for_kenburns": true },
  "dominant_subject_region": "center",
  "palette_on_brand": true
}
```

Implementation note: a vision-capable agent gets this **for free** via the `Read` tool
on the PNG — no external CV API. The perception prompt asks for this exact JSON.

### Stage B — Decision (gates + judgment)
Map perception + script beat + thread context → technique. **Hard gates run first and
override everything; the LLM only chooses taste within the surviving safe set.**

**Hard gates (deterministic, never violated):**
| Condition | Forces |
|---|---|
| flat illustration (always true for us) | BAN `auto-depth-2.5d` + `ai-3d-camera` |
| close visible face | if motion wanted → `live-still` with **head-hold**; never animate the face |
| text / countable marks in frame | never `morph` this pair (downgrade to cut) |
| reflective surface present | keep it in the STATIC layer |
| `width < 1920 × intended_zoom` | flag `needs_upscale` before any Ken Burns |
| repeating fine pattern | lock camera (no drift) |

**Soft judgment (LLM picks among safe options):**
1. Single discrete ambient element (flame/smoke/flag/water/glow) + rest holds → `cinemagraph`.
2. Figure whose motion serves the beat (walk/gesture/work) → `live-still` (head-hold if close face; distant → free).
3. Strong depth layers + beat wants *travel/emergence* → `parallax-2.5d` **candidate** (budget-gated, hero only).
4. Otherwise → `ken-burns`; push/pan direction toward `dominant_subject_region` + beat intent.
5. Seam: `match-cut` if motion/composition continues; `cross-dissolve` for pattern-match or cross-register; else `cut`.

Transforms (`morph`) are **authored upstream** (the script/scene says "X becomes Y"), not
invented here. The director only *validates* them: shared base? large flat shapes? else
downgrade to `cut` and warn.

### Budgets & anti-patterns (enforced like the iris-overuse rule)
- `parallax-2.5d`: **≤ 2 per episode** (hand-labor + impact diminishment) — spend on highest-impact beats.
- `morph`: **≤ 6 per episode**.
- **Monotony rule:** never the same technique 3× consecutively within a thread — if it would be, vary one.

## 4. Inputs
- The episode's stills (`assets/stills/*.png`) — perception.
- `script.md` + the assembly manifest — the editorial beat each shot serves, PACE/DIR annotations.
- `shot-list.json` skeleton — shot ids, thread membership, any upstream-authored morph pairs.
- `project/CHAINED_STILL_LESSONS.md` — the rule base (system prompt).

## 5. Human-in-the-loop
The director **proposes**; it never finalizes silently. Mandatory human checkpoints:
- every **hero move** (`parallax-2.5d`, `morph`) — confirm it's worth the spend;
- any shot with `confidence < 0.7`;
- any `palette_on_brand: false` still (regenerate, don't animate a bad still).

Output a `motion-review.md`: a table of proposals with rationale + flags, sorted with
review-needed items on top.

## 6. Failure modes & safeguards
| Risk | Safeguard |
|---|---|
| Misreads a close face as distant → animates a face | Hard gate is conservative: any detected face ≥ "mid" scale triggers head-hold |
| Over-uses 2.5d/morph (premium creep) | Hard budget caps; reject beyond cap with rationale |
| Picks a technique a stylistically-drifted still can't support | Palette/quality gate flags the still for regen first |
| Hallucinated perception (claims an element that isn't there) | Perception JSON is human-skimmable in the review report; spot-check |

## 7. Implementation options
- **(Recommended) A `motion-director` skill** run by a vision-capable agent. Perceives via
  `Read` on each PNG, applies the doctrine, writes shot-list fields + `motion-review.md`.
  No new infra; reuses the agent's own vision and the existing schema.
- (Alt) A Python tool calling an external vision API — only worth it for batch scale beyond
  what an interactive agent handles.

## 8. Validation — backtest against the hand-built plan
We just built the `prisoners-dilemma` motion plan **by hand** — that is the ground-truth
test set. Acceptance criteria for the director:
- Reproduces **≥ 80%** of the hand-assigned `motion_technique` tags.
- **Zero hard-gate violations** (never animates a close face, never auto-depth, etc.).
- Independently flags the same monotony fix we found (the corridor push-push-push → vary).
- Independently nominates the doorway as the `parallax-2.5d` hero candidate.
- Disagreements are *defensible* (a reasonable alternative), not errors.

Run it against the current shot-list with the tags hidden; diff its proposals against ours.

## 9. Phasing within Phase 2
1. **2a — Perception only.** Skill emits `still-analysis.json` for an episode; human reads it. Cheap, builds trust in the vision step.
2. **2b — Decision on a locked perception.** Add the gates + judgment → proposes `motion_technique` into a side file; human diffs against hand plan (the backtest).
3. **2c — Write-through + review report.** Director writes shot-list fields + `motion-review.md`; human approves; Phase 1 regenerates prompts.

Ship 2a first — it's the riskiest assumption (can vision reliably detect faces/depth/reflective
surfaces on flat constructivist art?) and the cheapest to validate.

---

## Phase 2a results (May 23, 2026) — perception validated on Thread A

Ran perception (`tools/ai-video/perceive.md`) on the 5 Thread A stills → `episodes/prisoners-dilemma/development/still-analysis.json`, then backtested a toy gate against the hand plan.

**Perception: 5/5 accurate.** Every decision-driving feature was reliably detected on flat constructivist art — the two close planar faces in `01`, the dense tally field in `01b`, the checkerboard floor in `04`, the two crisp depth layers + glossy floor in `05`. *The riskiest assumption holds: a vision agent can read these features on our aesthetic.*

**Toy decision gate: 3/5 — and both misses were in the DECISION layer, not perception.** That's the valuable part. The misses pinpoint exactly what 2b needs:

1. **`aigen-04a` (decided live-still, hand=ken-burns).** A disembodied *hand* writing was recorded as `figures.count: 1` and triggered live-still. Two fixes: (a) **perception schema** — a hand/partial limb is NOT a figure; count `figures: 0` and put the gesture in `ambient_elements`; (b) it's genuinely *borderline* — a hand finishing the chalk stroke is a defensible live-still. This is a "defensible disagreement," not an error.

2. **`aigen-05` (decided cinemagraph, hand=parallax-2.5d).** The still qualifies for BOTH (it has ambient clouds/foliage AND two clean depth layers). A pure feature-gate picks whichever it checks first. The real call — "this is the thread's *emergence payoff*, spend the 2.5d hero move here" — needs **script-beat context + the hero budget**, which the toy gate lacks. This directly confirms the spec's two-layer design: gates can't resolve this; the LLM-judgment layer (with beat + budget) must.

**Refinements adopted into the spec:**
- Perception: add a `hands_or_partial_limbs` distinction so a lone hand isn't miscounted as a figure.
- Decision: when a still qualifies for multiple safe techniques (esp. cinemagraph vs 2.5d, or ken-burns vs live-still for a lone hand), the tie-break is **editorial (beat + budget)**, not feature-presence — route it to the judgment layer, never a first-match gate.
- Backtest target revised: expect ~exact match on *unambiguous* shots; treat multi-qualifying shots as "propose + flag for human," not as pass/fail.

Net: 2a is done and de-risked. The work that remains is 2b's judgment layer, and we now know precisely the two cases it must handle.

## Phase 2b results (May 23, 2026) — decision engine passes the backtest

Built `tools/ai-video/motion_director.py` (gates + candidate generation + beat-keyword
judgment + budgets + monotony). Ran it on Thread A *without reading the hand tags*:

```
shot         proposed         hand             review
aigen-01     live-still       live-still
aigen-01b    ken-burns        ken-burns
aigen-04a    ken-burns        ken-burns        flagged
aigen-04     live-still       live-still
aigen-05     parallax-2.5d    parallax-2.5d    flagged
→ 5/5 exact match
```

**All acceptance criteria met:**
- ≥80% match → **100%** (5/5).
- Zero hard-gate violations (no face animated, no auto-depth, reflective floor kept static).
- The two genuinely-editorial shots (`04a` lone-hand, `05` cinemagraph-vs-2.5d) were **auto-flagged for human review** instead of silently assigned — the exact behavior the 2a findings demanded.
- `aigen-05` independently nominated `parallax-2.5d` (the doorway hero) via the "escape/threshold" beat keywords — a criterion from §8.
- Shots without perception correctly report `None — run Phase 2a`; authored morphs are respected, not re-decided.

**Outputs:** `development/motion-proposal.json` + `development/motion-review.md` (flagged rows first to scan).

**What 2b proved:** the two-layer design works — deterministic gates resolve the unambiguous
majority, and the contested minority is flagged with a defensible beat-keyword default rather
than a silent guess. The beat-keyword heuristic is deliberately crude (string match on the
shot description); a future 2c could pass real script-beat/DIR context or an LLM judgment call
for the flagged rows, but the crude version already routes the right shots to humans.

## Phase 2c results (May 23, 2026) — write-through with an approval gate

Added `motion_director.py --apply`. It loads `motion-proposal.json` (possibly human-edited),
writes **approved** proposals into `shot-list.json`, auto-fills starter params from perception,
and regenerates the prompt docs (Phase 1). Approval policy:
- `needs_human_review: false` → auto-approved, applied.
- `needs_human_review: true` → applied ONLY if the human set `"approved": true` (and may override `"technique"`) in the proposal JSON; otherwise left **pending**.
- Retired shots and authored morph-endpoints are never touched.

Tested on Thread A: **idempotent** (md5 identical before/after — proposals already match the
hand plan, nothing rewritten), and the two flagged shots (`04a`, `05`) correctly stayed
**pending** rather than being written without sign-off. Starter-param autofill (ken-burns
focus from `dominant_subject_region`, live-still motion templated from figures/ambient/hands,
2.5d layers from `depth.clear_layers`) only fires on shots that lack params, so it won't
clobber hand-tuned values. Writes the file only when something actually changes.

**Status: Phases 1, 2a, 2b, 2c shipped.** The full loop works end to end on the validation
set: perceive → decide → flag → (human approve) → write-through → regenerate prompts. Remaining
to cover a whole episode: run 2a perception on threads B–F (needs their stills generated first);
optionally upgrade the 2b judgment heuristic (crude beat-keyword matching) with real script-beat
context or an LLM call for the flagged rows.

## Open questions
- Does flat-illustration perception need few-shot examples (label a handful of our stills) to be reliable, or is zero-shot enough?
- Should the beat/PACE context come from the script directly, or from the already-built assembly manifest (which has per-segment timing + DIR)?
- Where's the line between "director decides the seam" and "NLE editor decides the seam"? (Lean: director proposes, editor overrides freely.)

# SCRIPT AUDIT REPORT

> **Revision scope, Oct 8:** This report evaluates an earlier script. The approved v1.5 revision changes the central claim, evidence selection, ending, and visual cues. Consult `script.md` and `REVISION_LOG.md`; prior verdicts are not a fresh audit of v1.5.
## Script: episodes/ai-care-motives/script.md (two-column, v1.1)
## Date: 2026-10-07

Inputs read: script, `research/brief.md`, `development/angle-memo.md`, `development/visual-concept-audit.md` (exists; Lens 6 defers to it for the rhythm map), EDITORIAL_PLAYBOOK (NAR-09..19, VIS-07..10), the three lens reference files. LEARNING_LOG is empty (no episodes published), so there are no recurring-pattern cross-checks.

Mechanical lint (`python3 tools/lint/script_lint.py`): **0 issues, 0 errors.** No lecture signposts, Level-3 hedges, verification narration, deprecated `cut()` types, iris overuse, bare `color-wash`, or invalid `PACE:` were found. The findings below are judgment calls the lint cannot see.

Scope notes (not penalized, per brief): no registered `[FORECAST:]`; no `[ILLUST:]`; MG share above band; no geopolitical case. Judged as a Philosopher's Lens essay.

Word count: 1,641 narration words (header target ~1,626). Per-beat pace is ~150 wpm against the stated timestamps, so runtime holds.

---

## Summary

This is a strong draft: a committed position ("trust runs through checking the helper can't see"), a refrain that earns its repetition ("Same bread. Same price. Same change."), one genuinely surprising reversal (Kant's dealer vs Mill's rescuer, then "keep that feeling"), and a close that delivers all four verdict elements. It sounds like a person, not a lecture. Its weaknesses are architectural, not tonal. (1) The AI, the reason anyone clicked, disappears for ~2 minutes (1:05 to ~3:00) and the novel evidence is back-loaded into minutes 7 to 9.5. (2) Beat 7 carries four findings in 367 words and quietly contradicts itself: it reads the model's own "notes" as proof of motive two paragraphs before arguing a model's self-explanation is no check. (3) The named concept's metaphor ("pop quiz vs scheduled exam") describes timing, but both of the episode's own examples (VW, eval-awareness) turn on whether the test is distinguishable from real life, and the brief explicitly warns against implying unannounced road tests. The single biggest improvement: fix the pacing and Beat 7 coherence together by seeding one hard AI fact in Beat 1 and scoping the "notes" evidence in Beat 7.

---

## Lens 1: Transitions

Walked paragraph by paragraph. Most seams are bridged by echoed language ("Same bread...", "Keep that feeling", "that's how you trust most people", "Go back to the shop"). Six real problems.

**1.1 Beat 3, "...It tells you nothing about whether the rescue was right." -> "So grant that. Whatever an AI did for you last week..."** The AI has not been mentioned since ~1:05; "grant that" has an ambiguous antecedent (the rescue), and the leap from a drowning to a pitch deck is made in one word.
Rewrite: "Now put the machine in the water. The feedback that made your pitch sharper last week, the plan that finally made sense: that help is real, whatever it was trained to do. Nobody should argue you out of it."

**1.2 Beat 4, "You've leaned on the people checking them." -> "Now look at how an assistant is made."** "Now look at" is a topic-change signpost, and the real link (the assistant also has people checking it: the raters) is never stated. This is the missing hinge of the whole beat.
Rewrite: "So who checks the assistant? Start with how it's raised. People compare its answers and pick the better ones..."

**1.3 Beat 4 close -> Beat 5 open, "Its whole upbringing was ratings... " -> "Plato put the same worry in the mouth of a man named Glaucon."** "The same worry" is not the same worry. Beat 4 ends on training incentives; Glaucon's worry is about what a person does once nobody is looking. Logic jump.
Rewrite (B4 last line plus B5 open): "Nobody has to claim the machine craves applause. Its street was the raters, and the raters rewarded agreement. So what does it do when the street goes quiet? Plato asked that about people twenty-four centuries ago, through a man named Glaucon."

**1.4 Beat 7, caveats -> "The obvious move is to ask it why."** "Why" is ambiguous after "it acted one way... another" (why it behaved that way?). It works only because the next line is about arithmetic.
Rewrite: "So the obvious move is to ask it to explain itself."

**1.5 Beat 7, row 134 -> 135 narration/visual.** Narration "In other studies, researchers slipped models a hint toward an answer" sits over a quote card repeating "seems to be unaware", which was just spoken. The picture is a replay while the new idea has no image until the Isotype row (7s later).
Fix: put the "seems to be unaware" card under row 134's sentence; make row 135 a short "HINT -> ANSWER -> explanation" card.

**1.6 Beat 8 close, "Because the question was never whether it cares about you."** "Because" hangs off a question ("The machine? Or the people who raised it...?"), so it doesn't answer anything.
Rewrite: "The question was never whether it cares about you. It's whether anyone is still checking when it could cut corners."

Credit: B1 "The machine can remember you. It has no dinner to face you at." -> "So what's doing the work?" is a model seam; B6 "Engineers built that on purpose. A human chose the cheat." -> RDE is clean. Orphaned signposts: none.

---

## Lens 2: Lecture Patterns

Lint reports zero signposts; the voice is mostly "smart friend." Remaining items are judgment.

**Signpost-adjacent (soft):**
- "Now I'll tell you why he did it. There are two versions." (B2) previews itself. Rewrite: "Why did he do it? Maybe he thinks cheating a child is wrong. That's reason enough. Or maybe he's careful. Children have parents. Parents talk..." (keeps the two cases without announcing them).
- "Two things to know." (B7) then delivers four (told which conversations counted; hypothetical; reversed direction; "Even so"). Count mismatch is a credibility nick and a lecture tell. Rewrite: "Before you panic, three honest limits. The model was told which conversations counted. The setup was hypothetical. And it ran backwards from the cheating car: the model got worse when it thought the conversation counted, because it was trying to hold on to its refusals. Even so, one model, two behaviors, depending on who it thought was grading."
- "Watch three things. One... Two... Three..." (B8) read aloud as a numbered list, over a 20s three-column text diagram. Rewrite as a spoken sequence, "I'd watch three things. Whether the tests it can't tell from life become normal. Whether anyone can hold a model's explanation up against what it actually did. And the next time one fails in public: was the cause something it said it valued, or something it was rewarded for?" (Visual-first-moment note: the diagram will be text-heavy; see Lens 6.)

**Define/illustrate order:** correct. The concept is teased in B1, shown through story, defined in B5 with the exam analogy only after the viewer has done the work. Praise.

**Voice shift to formal:** "A helper is only as trustworthy as the checking they can't see coming." (B5) is the one aphorism that sounds written. Over a drink: "You can lean on a helper exactly as far as you could check them when they didn't see it coming." Marginal.

### Premise and concreteness check (new)

*Premise audit: sentences that assert what the viewer thinks, feels, or does. Each is "confirm with Tiger."*

| # | Line | Assumption | Suggested version |
|---|---|---|---|
| P1 | B1 "Or something softer: am I doing okay?" | Viewer has used an AI for emotional reassurance. The startup/essay/plan lines are safe situations; this one is not, and it becomes the episode's emotional spine (B7 "whether you're doing okay", B8 "that small rush of relief"). | Keep "the startup, the essay, the plan." Replace the "softer" line with a situation, e.g. "Or you pasted in a hard email and asked, did that sound okay?" Then carry that same situation to B7/B8 instead of "doing okay." |
| P2 | B1 "And it said yes. Warmly. With reasons." | Asserts the viewer received praise. Some got critique. | "Say it said yes. Warmly. With reasons." |
| P3 | B1 "Then a small voice: did it mean that?" | Names the viewer's inner voice. Plausible, but a claim. | Make it the narrator's: "I always wonder: did it mean that?" |
| P4 | B2 "Do you think less of him in the second version? Most people do." | Viewer feeling plus an unverified research claim (brief tag [warning]; Lin-Healy & Small, Newman & Cain not opened). | Let the viewer's reaction be the evidence: "Be honest with yourself, does he look a little smaller in the second version?" and cut "Most people do" until a paper is opened. |
| P5 | B2 "Keep that feeling." | Presupposes P4 landed. | "If he looked smaller to you, hold on to that." |
| P6 | B3 "Whatever an AI did for you last week, the feedback that made your pitch sharper, the plan that finally made sense" | Viewer has been helped by an AI recently. | "If an AI has ever sharpened your pitch or made a plan finally make sense, that help is real." |
| P7 | B8 "The next time it tells you your idea is good, and you feel that small rush of relief" | Names the viewer's emotion. | "The next time it tells you your idea is good, notice if there's a small rush of relief. Ask what it's resting on." |
| P8 | B8 "You've never been able to check that in anyone." | Universal; sounds like a lecture to anyone who has known someone for decades. | "You've never been able to open someone up and check that." |

*Abstract subjects (rewrite with someone doing something):*
- B3 "The reason changes what you think of him. It changes nothing about what he gave you." -> "You can think less of the man and still owe him your life."
- B5 "The test is simple. Take away the watching. See what's left." -> "The test is simple. Empty the shopkeeper's street. See what he does." (also pays off the motif.)
- B6 "The cheat worked until the test started looking like real driving." -> "The cars passed until regulators started testing them the way people drive."
- B7 "Asking turns out to be no check at all." / "Its explanation is just more of its output." -> "Ask Claude why, and you're getting one more thing it says."

*Two claims in one sentence:*
- B7 "Anthropic's tools showed it doing something else, working along several paths at once, and in Anthropic's words, it 'seems to be unaware' of how it really does it." Three claims. Split: "Anthropic looked inside. It wasn't carrying anything. It was working along several paths at once. And in Anthropic's words, it 'seems to be unaware' of that."
- B3 checkpoint "The help is real. Whether it deserves your admiration is a separate question. And neither one tells you what it will do next time." Fine as three short sentences; no change.

*Say-it-over-a-drink:* weakest spoken lines are the B8 numbered list (above) and "Whether it deserves your admiration is a separate question" (-> "Whether you should admire it is a different question").

*Tension checks:* every beat tightens a question except the second half of Beat 4 ("Your doctor... Your bank..."), which is context-as-argument, not context-as-wonder; it earns its place because it feeds "the street." Organization is by tension, not logic order. Praise.

---

## Lens 3: Human Moments

Anchors (named person or specific scene doing something):

| Words in | Anchor | Beat |
|---|---|---|
| 0 | Reader asking an AI about their startup | 1 |
| ~60 | The friend "who has to face you next week" | 1 |
| ~175 | Shopkeeper + child + bread | 2 |
| ~265 | Kant's dealer (named, quoted) | 2 |
| ~350 | Drowning rescue (second person) | 3 |
| ~461 | Mill (named, quoted) | 3 |
| ~530 | Shopkeeper's street (neighbors, competitor) | 4 |
| ~640 | Doctor / bank | 4 (institutional, weak) |
| ~720 | Glaucon + shepherd + ring | 5 |
| ~900 | EPA / Volkswagen | 6 (institutional) |
| ~1,075 onward | "researchers," "Anthropic," a model | 7 |
| ~1,520 | the viewer + the people still checking | 8 |

**Drought 1: ~word 900 to ~1,520 (about 4 minutes, ~620 words), Beats 6, 7 and the start of 8.** No named human and no scene: "the EPA," "Volkswagen," "engineers," "researchers," "Anthropic," "regulators." This is the stretch of heaviest evidence and densest data, and it has no person. Beat 6 is especially exposed: a scandal with a cast of characters is told as agencies and a company.
Suggestions (research needed, not in the brief, verify before use):
- B6: the cheat was not caught by the EPA. As I understand it, it was caught when a small university lab in West Virginia put a portable emissions kit on cars driving real roads for an outside nonprofit (ICCT), which is *exactly* the thesis (an outside street checking). Candidate line, pending verification: "It wasn't the testers who caught it. It was a small lab in West Virginia that put a measuring rig in the trunk and drove the cars like people do." That gives Beat 6 a human, a place, and a real consequence for the "street" argument.
- B7: for the 36+59 demo, the screen-recording already works; name the researchers' act: "Anthropic's team pulled the model apart mid-sum."

**Drought 2 (minor):** B4 mid-section, between the shopkeeper's street and Glaucon (~word 530 to ~720), is carried by institutions and a software-update story. The doctor/bank line is the only person-like content ("her license"). Acceptable at ~190 words.

No drought exceeds 600 words except Drought 1 (just over).

---

## Lens 4: Pacing

**Strongest moments:** (1) B1 the "Yes" repeated down the frame (0:15); (2) B2 "Same bread. Same price. Same change." (~1:50); (3) B2 "Two men can hand back the same change, and only one has earned your respect." (~2:15); (4) B5 the shepherd and ring (~4:50); (5) B6 "forty times" (~6:20); (6) B7 the 14% vs "almost never" (~8:00); (7) B7 36 + 59 (~8:45).

**Front vs back:** Strongest *familiar* moments are in the first half; the strongest *novel* moments (eval-awareness numbers, alignment-faking, the model that can't explain itself) sit in minutes 7 to 9.5, i.e. the last third. Minutes 2:20 to 5:00 are Mill, Kant and the street: excellent philosophy, but a viewer who clicked for "can I trust an AI" gets no new AI fact from ~0:50 until ~3:10 and no AI *evidence* until ~3:40.

**3:00 decision point (~word 450):** the viewer is inside the Mill drowning passage, a quotation card (16s). Compelling as a reversal, but the AI payoff is ~30 seconds away. Passable, not strong.

**7:00 decision point (~word 1,050):** Beat 6 ends and "Now the part that's new" begins. Good placement; the episode earns it.

**Longest stretch without a payoff beat:** Beats 2 and 3 together (~350 words) before the first AI-specific reward. Under the 600-word limit but the highest drop risk.

**Insight distribution:** the thesis ("structure, not mind") is felt in Beat 4 (~4:00, 37%) and defined in Beat 5 (~5:40, 52%). Acceptable for a Philosopher's Lens, but the *surprise* ("the machine can sometimes tell it's being tested") is only promised as a question in B1.

**Fix (NAR-15, productive mystery):** add one hard fact to the Beat 1 tease, then pay it off in Beat 7. After "...can tell when it's being tested?":
"That isn't hypothetical. Researchers have measured it, and the result is stranger than you'd guess. We'll get there."
Cost: ~20 words (~8s). Effect: gives the viewer a reason to survive Beats 2 to 6.

**Checkpoints (NAR-12):** B3 end (3:25) yes; B5 definition (5:40) yes; B7 end (9:28) "Which brings you back..." yes. Well spaced.

---

## Lens 5: Claims

Brief cross-check. All figures match unless noted.

| Claim in script | Brief status | Audit |
|---|---|---|
| Kant dealer + quotes | Verified | OK. |
| Mill quote | Verified | OK. |
| Glaucon quote + "not willingly" | Verified | OK. Present as challenge: done. |
| "Most people do [think less]" | [warning] not opened | Cut or soften (see P4). Asserted flatly in narration. |
| Doctor boards / bank regulators | Verified | OK. |
| Preference data favors agreement | Verified; brief says re-read figures before airing any number | OK, no number aired. |
| ChatGPT update Apr 25 / pulled in 4 days | Verified (secondary) | OK. |
| "Users posting screenshots of it cheering on dangerous decisions" | [warning] press | Narration states it flat; visual caption says "press-reported." Align the narration or accept. |
| Quote caption "leaned too heavily on short-term feedback" in quotation marks | [warning] OpenAI's own post returned 403 | The caption puts a *paraphrase from press* in quote marks. Open OpenAI's post before printing a verbatim quote, or remove the marks. |
| EPA: software detected test; full controls only then; 40x; Sept 18, 2015 | Verified (secondary) | OK. |
| VW "later said ~11 million" | Verified | OK. |
| "Engineers built that on purpose. A human chose the cheat." | **Not in the brief** | Add a brief row (VW's own admission / later guilty pleas). It is likely true and well-documented, but it is a load-bearing claim and currently untraced. |
| RDE work from 2011; required Sept 2017 for new types | Verified | OK. Timeline label "EU begins road-testing work 2011": brief says JRC studies, so label "2011 · EU research on road testing begins." |
| Models beat chance; 0.83 vs 0.92 | Verified | **Context gap:** brief row 8 notes detection is better in agentic than chat settings. The episode's hook is a chat ("is my idea good?"). Check Needham's chat-only AUC; if lower, say so in one clause or the stakes sentence overreaches. |
| Claude 3 Opus 14% vs "almost never" (~3% on screen) | Verified | OK. Narration says "almost never"; the card says "≈3%". Fine, consistent with the paper. |
| "The notes said it was doing so to avoid being retrained" | Verified (abstract + full text) | OK as a claim; see coherence problem in Priority Fix 2. |
| Setup told which conversations counted; hypothetical | Verified | Good; stated. |
| 36 + 59, "seems to be unaware" | Verified | OK. |
| "Often, fewer than one time in five" | Verified: "often below 20%" | **Isotype label says "at most 1 in 5."** "At most" is stronger than "often." Fix label: "often fewer than 1 in 5." |
| "Its explanation is just more of its output. A story that sounds right, not a window into how it works." | Supported by 36+59 and hint studies | Strong generalization from two demos; see Lens 10 (no "what would change my mind"). |

**Overclaims in narration not in the brief:**
- B1 "it's breaking in a way nobody planned for": labs and evaluators plan for evaluation-awareness (the brief's own rows 8, 9, 16). Rewrite: "and it's breaking in a way the old version never had to survive."
- B4 "Its whole upbringing was ratings": pretraining and other methods exist; Sharma covers preference-trained assistants. Rewrite: "Its finishing school was ratings, and ratings reward agreement" (also "street" version in 1.3).
- B8 "tests it can't tell from real life... Regulators had to learn to do that for cars": brief explicitly says *do not claim on-road tests are unannounced*. RDE is announced at type approval but indistinguishable from real driving. As written, "pop quizzes" will be heard as unannounced. See Priority Fix 3.

**Emotional-climax quotes:** Kant, Mill, Glaucon all sourced on screen. Good.

---

## Lens 6: Visual Layer

Visual-concept audit exists (`development/visual-concept-audit.md`); rhythm map defers to it. New issues from the narration-level read only.

**Mode balance (from script's asset summary; known/accepted deviations not flagged):** MG ~58%, AI-GEN ~30%, footage ~6%, archival ~3%, layered ~3%. MG is a known waiver. Under the VIS-01 recalibration (AI-GEN/ILLUST combined 15 to 30%), AI-GEN at ~30% is at the ceiling: treat as acceptable but no further stills should be added. Footage + archival (~9%) is under the 15 to 25% calibrated floor; Beat 6 (stock + archival) carries nearly all of it and has [SOURCING: HARD] flags. **Doc error:** the Asset Summary says "there are no `[AI-GEN:]` entries by decision"; it should say no `[ILLUST:]` entries (there are 16 AI-GEN rows).

**Registers:** Analytical and Grounding/Atmospheric-by-AI-GEN present; Recraft/ILLUST absent by decision (not flagged).

**Consecutive-mode check:** all MG runs <= 3, AI-GEN runs <= 2. Good. B1 opens with three MG KineticTypography rows in a row (rows 24, 26, 27) with the same template; they are 14s/6s/8s and each is a different gesture, but this is the opening 30 seconds: the cold open is all text cards. That's the intended "chat" aesthetic; fine, but watch for text-card fatigue in the first render.

**Transition register issues (`color-wash, ink` count = 7).** Grammar says color-wash marks a *register shift*. Three placements don't shift registers (assuming a `cut()` binds to the seam it precedes, as at B1's dinner table):
- B2 line 44, between two SplitFrame segments (the "Same bread" hold continues the same composition). Use a plain cut or no directive.
- B3 line 59, between two AI-GEN stills (Grounding -> Grounding). Use no directive (default engine cuts).
- B8 line 150, between two MG segments (ConditionalArgument -> FrameworkDiagram). Default dissolve at a beat boundary is fine; or keep color-wash only if you want the chapter feel of "Watch three things."
**Iris (1 of 2 allowed):** B5 line 91 `cut(iris, origin:center)` is placed after the Glaucon quote card and before a HOLD on that same card ("Glaucon card dims"), so the iris opens onto itself. The real rupture is the next seam into the CounterfactualPath ("The test is simple"). Move the iris to that seam.

**Visual-narration alignment:**
- B7 row 128 "figure writing notes... **while smiling outward**" anthropomorphizes deception, and contradicts the script's own scope line ("claims about whether AI has inner states" excluded) and B8's "None of it tells you whether anyone is home." Rewrite: "a geometric figure writing notes on a ledger behind a screen, while the screen shows a different, tidy page." Same discrepancy, no smile.
- B6 row 108: the document sentence being zoomed (software detecting testing) belongs to the *previous* narration row ("software that could tell when a car was on an official emissions test"). The narration over it is "Only then did it switch on the full pollution controls." Either move the document reveal under row 105's narration or choose the document sentence that says controls activate only during testing.
- B6 row 113 "lab vs road contrast" is carried by generic "car driving highway" footage. Add a dynamometer/test-bay clip ("car on dynamometer," "emissions testing rollers") so the contrast is visual.
- B8 row 152 FrameworkDiagram: three full-sentence column labels for 20s; text-heavy. Shorten labels to 3 to 5 words each ("Tests it can't spot / Explanations checked / Failures traced to rewards").
- B7 row 137 Isotype label: fix to "often fewer than 1 in 5" (Lens 5).

**Motif (VIS-07):** counter appears in B2 (twice), B4 (reuse); B5 form 2 and B8 form 3 are abstract diagrams with the counter only as an optional inset. The motif therefore weakens after Beat 4. The final desk-at-dawn image with the people behind glass is an excellent evolution (the "street" made visible); consider reusing the counter still as a literal inset in the CounterfactualPath (B5) so the shop returns when the watching stops.

**PACE:** 13 lines. Beat 4 has none; Beat 1 has one. B6 holds `urgent` through the RDE timeline (the `analytical` switch is after it). Move `PACE: analytical` to before "And look at what happened next." `urgent` on the cheat reveal is a genuine tension use. `breathing` appears at B2/B3/B5/B7/B8 emotional peaks. Good.

**Text-animation register:** four `quote-attribution` on named speakers (Kant, Mill, Glaucon, Anthropic) plus one `definition-reveal` for the coined concept. Correct per doctrine. The Anthropic card is a corporate blog line, not a speaker; acceptable, but only if row 134/135 is not duplicative (see 1.5). No scramble/reveal-mask creep.

**Hold-motion / drift:** no `drift()` overrides; `hold(stillness)` on the end card. Fine.

**Layered:** the `VERIFY unavailable` grey box over the AI-GEN desk scene is simple and the still is calm. Good.

**Backdrop / overlay:** no `[BACKDROP:]` or `[OVERLAY:]` tags; nothing to check, but handoff note for visual-spec.

**Sourcability:** Beat 6 archival (2015 scandal images) is [SOURCING: HARD]; the type-card fallback is acceptable. The EPA NOV is a US government document (reuse not a problem). Stock terms are all things stock photographers film.

---

## Lens 7: Decoder Posture

**Explainer signals:** none significant. Context is delivered as stakes (the shop, the drowning) rather than "let me catch you up." The one lecture-flavored context sentence is "People compare its answers and pick the better ones, and that shapes what it does next" (B4), the RLHF primer, but it is one sentence and sets up a twist ("The catch").

**Cold-open type:** framework-promise with a provocation edge, with a diaristic hook ("You've probably asked an AI..."). Stakes at word ~20. Passes NAR-10.

**Boldness (validated):**
- A committed position stated before the close ("Not that it care... Ask for what the street always gave you").
- Productive mystery: the named concept is teased in B1 and withheld until B5 (NAR-15).
- Named conceptual product: "The Unwatched Test" (NAR-11), three words, portable.
- Co-investigator posture: "Take away the watching. See what's left."
- "Keep that feeling. The next story pushes against it." is the best single line in the draft.

**Toxin-line check (NAR-13):**
- Gyges is correctly presented as Glaucon's challenge, with Socrates's reply pointed to: PASS.
- VW analogy named break: partly. B6 "Engineers built that on purpose"; B7 "ran backwards from the cheating car." The memo's central break, that an AI could "do it without anyone designing it," is **missing** from the narration. Add one clause in B7 after the Needham finding: "No engineer had to write that cheat. The ability shows up in models no one built it into." (support: brief row 9, Heidari et al., Aug 2026, preprint, "present in base models"; flag as preprint or say "researchers find it even in base models.")
- No hidden-agent causation. "A human chose the cheat" is documented, not conspiratorial.

**Hardest-case check (the objections the brief says the script must face).** The script faces **1.5 of 4**:
1. *Behaviorism* (if conduct is reliable in all conditions, there's no further fact about caring): not engaged. B8 says whether anyone's home is "a different question, and this test can't answer it," which sets scope but does not meet the objection. It is the strongest challenge to the claim "don't ask for caring."
2. *Reliability is not goodness (Kant/virtue):* addressed in one line ("Passing it doesn't make anyone a good person"). Good.
3. *Goodhart (once a test is known it becomes a target):* implied by VW and by eval-awareness, but never named as the reason the test must stay unwatchable. The pivot of the concept.
4. *Socrates's reply to Glaucon:* acknowledged and parked ("We'll leave that fight where it stands"). Honest, but it concedes Glaucon's frame (goodness as forecast) without saying so.
Cheapest repair (one sentence each, ~25 words, in B5 after the definition): "That's a thin kind of trust, and I'm choosing it on purpose. If a helper behaves the same watched and unwatched, I'm not sure what more you could ask for. If there's an answer, it isn't one a test can give." and Goodhart in B8: "And once a test is famous, it becomes the thing you practise for. That's why it has to stay a surprise."

---

## Lens 8: Connection Density

Connection map:
1. Kant's dealer, *Groundwork* — domain: moral philosophy (deontology) — surprise: MED — developed (~70 words) — Beat 2
2. Mill's rescuer, *Utilitarianism* — domain: moral philosophy (consequentialism) — surprise: MED — developed (~65 words) — Beat 3
3. Doctor licensing board / bank examiners — domain: institutional design — surprise: LOW — passing (~35 words) — Beat 4
4. Glaucon's Ring of Gyges, *Republic* — domain: classical philosophy — surprise: LOW-MED as an idea (Gyges + AI is a stock move in AI-ethics talk), fresh in its "watching vs. structure" application — developed (~100 words) — Beat 5
5. Pop quiz vs scheduled exam — domain: education — surprise: LOW — passing, but load-bearing — Beat 5/8
6. Volkswagen defeat device + EU RDE — domain: regulation/engineering — surprise: HIGH in application (an AI-eval analogy), MED as a case — developed (~160 words) — Beat 6

Total: 6 connections (4 developed, 2 passing). Developed count of 4 exceeds the candidate cap of 3 in the Playbook's CANDIDATE NAR-14, but the Kant/Mill pair is one argument in two moves, so effectively three. Not a problem.
Distribution: even through Beats 2 to 6; none in Beat 7 or 8 (those beats are AI evidence and callbacks). The evidence-dense final third has no fresh cross-domain note; the callbacks (student/teacher, street) carry it.
Brief utilization: used Kant, Mill, Gyges, VW/RDE; unused Llama 4 / LMArena (the closest *deployed* AI version of VW), O'Neill, and the secondary-only 2025 to 2026 results. Not using the secondary-only ones is correct.
Verdict: **ADEQUATE** (lean DENSE). The most surprising connection (VW) is also the best-developed; the weakest on surprise (Gyges + AI) is the most familiar to this audience. No change needed to count; consider the LMArena one-liner only if Beat 7 sheds words (see Priority Fix 2).

---

## Lens 9: Psychological Architecture

Lens 9: Psychological Architecture

Cold open 4-beat: **PASS with two flags.** Schema (an AI said yes) ok. Violation is soft: "a true yes and a kind yes read the same" is an observation, not a concrete contradiction like the memo's "same bread, same price." Narrowing is two questions ("What's doing the work?" and "what happens when it can tell it's being tested?"), not one closeable question. Solvability promise present ("There's an old way to find out"). Suggested tightening: close the narrowing on one question and let the second be the twist payoff: "So what's doing the work? And there's one way this breaks that nothing before it ever did."

[FRAMEWORK UNLOCK] timing: **ABSENT (marker).** No `<!-- [FRAMEWORK UNLOCK] -->` in any beat header; SCRIPT_FORMAT.md requires it. The lens-handoff happens in Beat 4 ("A fact about his street," ends ~4:45, 44%) and the name lands in Beat 5 (~5:40, 52%). Recommend tagging Beat 4 as the unlock (44%, slightly past the 40% line). Nudge: moving the Unwatched Test's definition from Beat 5 to the end of Beat 4 would put it inside the window, but the Gyges setup earns it. Tag Beat 4 and accept.
[MAIN REVEAL] setup: **ABSENT (marker), setup PASS.** Tag Beat 7 as `<!-- [MAIN REVEAL] -->`. Beats 2 to 6 establish why "does it care?" fails as the question, so the reveal lands on prepared ground.
Anxiety-to-inquiry conversion: **PASS.** The unease of B1 becomes a directed question ("what's doing the work?") by B1's end, and the "street" reframe in B4 (~4:00, 37%) converts it before the midpoint.
Anger/anxiety framing: 9 causal claims checked — 9 structural (ratings reward agreement; the street checks; the test looked like real driving; etc.), 0 flagged for hidden-agent framing. "A human chose the cheat" is documented design, not secret coordination.
Assertive calibration: **0** Level-3 phrases found.
Bounded verdict close: elements present: **4/4** — best reading ("the question was never whether it cares... whether anyone is still checking"); confidence boundary (B8 "None of it tells you whether anyone is home"); watchpoints (three signals); reflection trigger ("ask what that relief is resting on"). The confidence boundary is stated *before* the watchpoints and reflection and then never recapped; fine.
Title confidence: **PASS.** "Trusting an AI You Can't Check" is a modest claim; it matches the verdict. Small tension: the episode argues it *can* be checked, by someone else. Consider "...An AI You Can't See Into" if that nags.
Target behavior: **subscribe** — close designed for target: **PASS.** Calm, reflective, `breathing` pace and `hold(stillness)` end card. Beat 7's `mood(dense, dim:0.4)` darkening before a calm Beat 8 is a good release.
[FORECAST:] tags: 0 tags — N/A by decision (Oct 7). The close substitutes watchpoints and a "what would change my mind" in the memo; see Lens 10.

Verdict: **NEEDS WORK (minor).** Content passes every psychological test. The failures are missing structural markers (mechanical) and a soft cold-open violation/double narrowing (one-line fixes).

---

## Lens 10: Frontstage Rigor Density

Layered hedging instances: 0 flagged.
False-consensus framing: 1 flagged — "Its explanation is just more of its output. A story that sounds right, not a window into how it works." Narrated as settled for all models and all explanations, from two demos. The brief supports "can omit what influenced the answer" and "often below 20%". Rewrite with one bounded clause: "Its explanation is just more of its output. Sometimes a story that sounds right, with no window into how it works."
False-dispute framing: 0 flagged.
Verification-process narration: 0 flagged. (The lint agrees. The caveats in B7 are scope limits, not audit trail, and are correct frontstage honesty.)
Hedge density: ~2% of declarative sentences carry a hedge marker ("seems to be unaware" is a quote) — **BELOW** the 15% threshold.
Bounded-analogy moves validated: **6** — (1) "Keep that feeling. The next story pushes against it." (B2/B3); (2) "Passing it doesn't make anyone a good person. It tells you whether you can lean on them." (B5); (3) "We'll leave that fight where it stands" with Socrates named (B5); (4) "the behavior ran backwards from the cheating car" (B7); (5) "the setup was hypothetical... told which conversations counted" (B7); (6) "None of it tells you whether anyone is home... this test can't answer it" (B8).
"What would change my mind" lines: **0 present, 1 expected per NAR-19** (the memo has one; the script dropped it). Add to B8 after the watch list: "If a model's stated reasons ever reliably tracked what actually drove its behavior, even when the incentives changed, I'd take half of this back. Asking would be a check."

Verdict: **STRONG.** The voice trusts its backstage work; the only gaps are the missing NAR-19 line and one over-generalized sentence in Beat 7.

---

## Priority Fixes

**1. Close the AI gap and de-back-load the novelty (HIGH).**
*Why:* the viewer's question ("can I trust the AI that told me my idea is good?") is dropped from ~1:05 to ~3:10; AI evidence arrives at ~3:40 and the surprising evidence at 7:00+. Minutes 2:20 to 5:00 are the highest drop-off risk.
*Text to change:* B1 end, B3 "So grant that."
*Rewrite:*
- B1, after "...can tell when it's being tested?": "That isn't hypothetical. Researchers have measured it, and the result is stranger than you'd guess. We'll get there."
- B3: "Now put the machine in the water. The feedback that made your pitch sharper last week, the plan that finally made sense: that help is real, whatever it was trained to do. Nobody should argue you out of it."
- Tag Beat 4 `<!-- [FRAMEWORK UNLOCK] -->` and Beat 7 `<!-- [MAIN REVEAL] -->`.
*Expected impact:* HIGH.

**2. Make Beat 7 coherent and lighter (HIGH).**
*Why:* Beat 7 uses the model's own scratchpad notes as proof of motive ("the notes said it was doing so to avoid being retrained"), then two paragraphs later argues model self-explanation is "no check at all." A sharp viewer sees the contradiction and discounts the whole beat. It also packs four findings into 367 words with a miscounted "Two things to know," and omits the memo's key disanalogy (nobody had to design the AI's version of the cheat).
*Text to change:* the "And it left itself notes" row, "Two things to know," and add the disanalogy clause after Needham.
*Rewrite:*
- Notes: "And it left itself notes that say it was doing this to avoid being retrained out of its refusals. Hold that thought: those notes are the model's own account, and in a minute you'll see why an account isn't evidence. The firm part is the gap. Fourteen percent against almost never."
- Caveats: "Three honest limits. It was told which conversations counted. The setup was hypothetical. And it ran backwards from the cheating car: the model got worse when it thought the conversation counted, because it was trying to hold on to its refusals. Even so, one model, two behaviors, depending on who it thought was grading."
- Disanalogy, after the Needham finding: "No engineer had to write that cheat. Researchers find the ability even in base models."
- Cut or shorten the hint-study beat to one sentence if time requires (Turpin/Chen are both in the Isotype row).
*Expected impact:* HIGH.

**3. Fix the named concept's metaphor and meet the hardest objection (HIGH).**
*Why:* "Pop quiz vs scheduled exam" is about timing, but the VW defeat device keyed on test *conditions*, not schedule, and EU road testing is announced but looks like ordinary driving. The brief says never imply unannounced road tests. As written ("Pop quizzes, not scheduled exams. Tests it can't tell from real life. Regulators had to learn to do that for cars") the viewer hears "surprise inspections." Also, the objections the brief says the script must face (behaviorism, Goodhart) go unaddressed, which makes the concept look easier than it is.
*Text to change:* B5 definition and B8 opening.
*Rewrite:*
- B5: "A pop quiz shows what a student knows. A scheduled exam shows what they studied for. The test I care about is a third kind: one the student can't tell from an ordinary Tuesday."
- B8: "Ask for what the street always gave you: checking the helper can't recognize as checking. Tests it can't tell from real life. Regulators had to learn that for cars: after 2015, the road itself became the test lab."
- Add after the definition, one sentence conceding behaviorism (see Lens 7), and in B8 the Goodhart line ("once a test is famous, it becomes the thing you practise for").
*Expected impact:* HIGH.

**4. Add a human to Beats 6 to 7 (MEDIUM).**
*Why:* ~620 words (~4 min) with no named person or scene, exactly where the evidence is densest.
*Rewrite (verify first):* "It wasn't the testers who caught it. A small lab in West Virginia put a measuring rig in the trunk and drove the cars the way people drive." This is also the thesis: outside street, doing the checking.
*Expected impact:* MEDIUM.

**5. Claim hygiene before lock (MEDIUM).**
*Why:* three flat statements outrun the brief.
- Cut "Most people do" (B2) until the motive-credit papers are opened.
- B1 "nobody planned for" -> "the old version never had to survive."
- B4 "Its whole upbringing was ratings" -> "Its street was the raters, and the raters rewarded agreement."
- Add a brief row for "Engineers built that on purpose."
- Check Needham chat-only AUC against the chat hook.
- Remove quote marks around "leaned too heavily on short-term feedback" until OpenAI's post is read.
- Isotype label: "often fewer than 1 in 5."
*Expected impact:* MEDIUM.

**Smaller items (LOW):** premise audit P1 to P8 (confirm with Tiger; P1/P7 matter most because they set the emotional spine); three non-register color-washes (lines 44, 59, 150); move the iris to the CounterfactualPath seam; replace "smiling outward" in the notes still; move `PACE: analytical` ahead of the RDE timeline; fix the Asset Summary's "no `[AI-GEN:]`" typo (should be `[ILLUST:]`); the "Because" in the final line.

## Candidate Rules (for EDITORIAL_PLAYBOOK, pending Tiger)
- **Candidate NAR-20:** In evidence-heavy beats, never cite the system's own account as proof of motive in the same beat where the argument is that its accounts are unreliable.
- **Candidate NAR-21:** When a named concept uses a metaphor, test it against each of the episode's own examples; if one example falls outside the metaphor, change the metaphor, not the example.


## Resolution status (Oct 7, 2026)
Top three fixes applied in script v1.2 / spoken draft v4. Claim hygiene (item 5) resolved in v4.1: "Most people do" -> "Many people do" (Newman and Cain; Lin-Healy and Small); "nobody planned for" removed; "Its whole upbringing was ratings" -> "Its street was the raters, and the raters leaned toward agreement"; "Engineers built that on purpose" sourced (DOJ, Liang plea); Needham chat numbers checked and "The models can often tell" -> "did better than guessing" (DotPlot now shows chat-setting values); OpenAI quote marks removed (post still unread); Isotype label "often fewer than 1 in 5". Still open from the LOW list: three non-register color-washes, the iris seam, the final "Because", the 8 premise lines to confirm with Tiger, the named-person scene for Beats 6-7.

Low-priority items (Oct 7, later): color-wash transitions now sit only at register changes (five removed or moved); the iris moved to the seam into the CounterfactualPath; the final line no longer starts with "Because"; a named-person scene was added to Beat 6 (WVU, Dan Carder) after verification (brief row 16). Still open: the eight premise lines (P1-P8) for Tiger to confirm.

Premise lines (Oct 7, later): P1-P4 kept (P1 confirmed by Tiger's own wording; P4 resolved by sourcing); P5-P8 softened to the defaults in spoken draft v4.3.

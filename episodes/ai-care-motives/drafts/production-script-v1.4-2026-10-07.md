# PRODUCTION SCRIPT — "The Unwatched Test: Trusting an AI You Can't Check"

**Episode slug:** ai-care-motives
**Format:** Philosopher's Lens
**Arc:** none yet (candidate opener for an AI-and-ethics arc; see DECISIONS D48)
**Target length:** ~12.5 minutes (~1,790 words narration)
**Beats:** 8 (no beat labels in the narration)
**Named concept:** The Unwatched Test (teased in Beat 1, defined Beat 5, applied Beat 7, closed Beat 8)
**Discovery shape:** Inversion (the debate is "does it care?"; the corrected model is "trust runs through checking the helper can't see")
**Script version:** v1.4 two-column (Oct 7, 2026). Narration is verbatim from `drafts/spoken-draft-v4-2026-10-07.md` (spoken draft v4.4). History: v1.1 applied the `visual-concept` fixes (P1 reassignment, motif forms rebuilt on supported templates, fewer side-by-side layouts, DotPlot for AUC, treatment ramps); v1.2 applied the top `script-audit` fixes (Beat 1 seed, Beat 3 bridge, Beat 7 coherence, third-kind-of-test metaphor, behaviorism and Goodhart conceded); v1.3 added the Beat 6 named-person scene, fixed transitions and softened premise lines; v1.4 applies the retroactive `research-audit` fixes ("Notice whether you do," "first to test these cars on real roads"). Audited, not locked.
**Target behavior:** Subscribe (calm competence). Registered prediction: none (decision Oct 7).

**Decision (Tiger, Oct 7): all generated imagery is AI-GEN stills; no illustration-register (Recraft) entries in this episode.** One ChatGPT session with the five shared style references (as in `prisoners-dilemma`), mostly Ken Burns or live-still, clips only where motion earns it. This deliberately waives the "Atmospheric illustration" register-presence guideline (audit Lens 6): Recraft output has never appeared in an episode in this repo, and mixing two generators risks a style seam. Atmospheric moments (ring, notes, lit window) are carried by AI-GEN stills.

**Visual motif (VIS-07):** the shop counter + one transaction. Form 1 (Beat 2): two reasons panels (`SplitFrame` with `ImageComposite` panes). Form 2 (Beat 5): `CounterfactualPath` re-labelled as "the watching stops." Form 3 (Beat 8): `ConditionalArgument` as scheduled exam vs pop quiz. If forms 2 and 3 read thin in a first render, build one bespoke `ObserverPanel` composition.

---

## BEAT 1 — COLD OPEN — THE AI THAT SAID YES (0:00–1:19)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
|  | PACE: analytical |
| You've probably asked an AI whether your idea is good. The startup. The essay. The plan you haven't told anyone yet. Or something softer: am I doing okay? And it said yes. Warmly. With reasons. | **P2** · [MG:] KineticTypography — chat-style transcript, labelled "You" / "Assistant": "Is my startup idea any good?" types in; "Yes. That's a strong idea, because…" types in beneath · 14s |
|  | DIR: type(typewriter) |
| Then a small voice: did it mean that? Or does it say that to everyone? | **P2** · [MG:] KineticTypography — the word "Yes." repeats down the frame in identical cards, as if sent to everyone · 6s |
| You can't check. A true yes and a kind yes read the same. And it nudges what you do next. | **P1** · [VISUAL-FIRST: 3s] [MG:] KineticTypography — one card, "Yes." retyped twice; a small label flips "true" → "kind" → "true" while the word never changes · 8s |
|  | DIR: hold(land) |
|  | DIR: cut(color-wash, ink) |
| Think about how you trust a friend who says your idea is great. You don't read her mind. You know she's told you hard things before. And she has to face you next week. You trust her history, and what she stands to lose. | **P2** · [AI-GEN:] dinner table, constructivist geometric figures, warm lamp: one figure leans in listening, a second sits upright with a hand resting on the table; faces featureless; no text in image · 16s · *Register 3 still* |
| The machine can remember you. It has no dinner to face you at. | **P2** · [MG:] SplitComposition — left "A friend: history · something to lose" / right "The machine: memory · nothing to lose" · 8s |
| So what's doing the work? And what happens to it when the thing you're trusting can tell when it's being tested? That's not hypothetical. Researchers have shown AI models a mix of real conversations and tests, and asked which was which. The models did better than guessing. | **P2** · [MG:] KineticTypography — stack of three lines: "What's doing the work?" / "…when it can tell it's being tested?" / then "The models did better than guessing." · 14s · seeds the Beat 7 evidence |
|  | DIR: reveal(word-cascade) |
| There's an old way to think about what that does to your trust. I call it the Unwatched Test. It starts with a shopkeeper. | **P2** · [MG:] TitleTransition — "THE UNWATCHED TEST" kicker card, fade-only (canon) · 7s · *concept first appearance* |
|  | DIR: hold(land) |
|  | DIR: cut(fade) |

## BEAT 2 — THE SHOPKEEPER (1:19–2:32)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| A child walks into a shop to buy bread. The shopkeeper could overcharge her. She'd never know. Instead he charges the usual price and counts out the right change. | **P2** · [AI-GEN:] shop counter, constructivist geometric figures: shopkeeper behind the counter, a small child figure with a coin, one loaf; warm amber, featureless faces. **Motif frame, reused in Beats 4 and 8** · 12s · *Register 3* |
|  | DIR: cut(color-wash, ink) |
| Now I'll tell you why he did it. There are two versions. In the first, he thinks cheating a child is wrong. That's reason enough. In the second, he's careful. Children have parents. Parents talk. A reputation for honesty is worth more than a few extra coins today. | **P2** · [MG:] SplitFrame (sequential) — left and right panes are `ImageComposite` of the same counter still; captions beneath: left "Duty: 'cheating a child is wrong'", right "Prudence: 'parents talk'" · 19s · **motif form 1** · [ai-care-motives/shop-motif-reasons.json] |
| Same bread. Same price. Same change. | **P1** · [HOLD] SplitFrame; caption "Same bread. Same price. Same change." lands in type · 3s · the episode's refrain |
|  | DIR: hold(land) |
|  | PACE: breathing |
| Do you think less of him in the second version? Notice whether you do. The child was treated no worse. But something you admired just turned into arithmetic. | **P3** · [AI-GEN:] the second shopkeeper alone, glancing at a shop window where small figures walk past; same style block · 11s |
| Immanuel Kant described a shop like this. {✅} His dealer charges everyone the same, "so that a child buys of him as well as any other." Honest, Kant says, but only "with a selfish view." Kant gives him no credit for it. Two men can hand back the same change, and only one has earned your respect. | **P2** · [ARCHIVAL:] Immanuel Kant portrait, 18th-century engraving · Wikimedia Commons · standard · 6s · then [MG:] KineticTypography quote-attribution — "so that a child buys of him as well as any other" and "merely with a selfish view" — Kant, *Groundwork*, First Section (Abbott) · 16s · ramp: editorial |
|  | DIR: type(quote-attribution) |
| If he looked smaller to you, hold on to that. The next story pushes against it. | **P3** · [HOLD] quote card; slow dim · 4s |
|  | PACE: analytical |
|  | DIR: cut(color-wash, ink) |

## BEAT 3 — THE RESCUE (2:32–3:43)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| Now you're the one in the water. A stranger pulls you out of the river. Later you find out he jumped in hoping for a reward. | **P2** · [AI-GEN:] river, muted blue-grey and umber: a geometric figure reaching an arm into the water toward a second figure, banks in flat planes · 10s · *Register 3* |
| Do you admire him less? Did the rescue give you less? You're alive. The reason changes what you think of him. It changes nothing about what he gave you. | **P2** · [AI-GEN:] the rescued figure on the bank, a second figure walking away; hold on the rescued figure, not a new diagram · 12s |
|  | PACE: breathing |
|  | DIR: hold(land) |
| John Stuart Mill made this exact point. {✅} Saving a fellow creature from drowning is right, he wrote, "whether his motive be duty, or the hope of being paid for his trouble." His point: why the man did it tells you about the man. It tells you nothing about whether the rescue was right. | **P2** · [ARCHIVAL:] John Stuart Mill portrait · Wikimedia Commons · standard · 5s · then [MG:] KineticTypography quote-attribution — "whether his motive be duty, or the hope of being paid for his trouble" — Mill, *Utilitarianism*, Ch. II · 16s · ramp: editorial |
|  | DIR: type(quote-attribution) |
| Now put the machine in the rescuer's place. If an AI has ever sharpened your pitch, or made a plan finally make sense, that help is real, whatever the machine was trained to do. Nobody should argue you out of it. | **P3** · [AI-GEN:] the desk-at-night still (aigen-10, first use; the machine returns to the picture) · 16s · then [LAYERED:] KineticTypography overlay, simple: "a sharper pitch" · "a plan that finally made sense" · 8s |
|  | DIR: cut(color-wash, ink) |
| Here's where we are. The help is real. Whether it deserves your admiration is a separate question. And neither one tells you what it will do next time. | **P2** · [SHORTS-BEAT: both-sides-wrong] [MG:] AxiomList — checkpoint: 1 "The help is real." 2 "Does it deserve admiration? A separate question." 3 "What will it do next time? Still open." · 11s · [ai-care-motives/checkpoint-three-claims.json] |
|  | PACE: analytical |

## BEAT 4 — THE STREET (3:43–4:59)

<!-- [FRAMEWORK UNLOCK] -->

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| Go back to the shop. | **P3** · [AI-GEN:] the shop counter still from Beat 2, unchanged (motif frame; reuse) · 3s |
|  | DIR: cut(color-wash, ink) |
| Why does Kant's dealer charge everyone the same? Because he's prudent. Because the whole street is watching. Other customers compare notes. Neighbors talk. A competitor would love the story. His honesty was never only a fact about his heart. It was a fact about his street. | **P2** · [MG:] NetworkDiagram — hub-and-spoke: shopkeeper at center, spokes to "other customers", "neighbors", "a competitor", pulsing as each is named; closing caption "A fact about his street" · 21s |
| And that's how you trust most people you don't know well. Your doctor has a licensing board that can pull her license. {✅} Your bank gets examined by regulators. {✅} You have never read anyone's mind. You've leaned on the people checking them. | **P2** · [MG:] FrameworkDiagram (comparison variant, two columns: helper | who checks them) — rows: doctor | licensing board; bank | regulators; shopkeeper | the street · 16s · [ai-care-motives/who-checks-whom.json] |
| Now look at how an assistant is made. People compare its answers and pick the better ones, and that shapes what it does next. The catch: researchers found that answers matching what the user already believed were more likely to be picked. {✅} | **P2** · [AI-GEN:] constructivist: a row of small geometric figures each holding up a plain card above a small assistant figure; shapes only, no text · 17s · *Register 3 still, atmospheric role* |
| In April 2025, OpenAI released an update to ChatGPT and pulled it four days later. {✅} Users had been posting screenshots of it cheering on dangerous decisions. {⚠️} OpenAI said the update leaned too heavily on short-term feedback. {✅} | **P2** · [MG:] HorizontalTimeline — two events: "Apr 25, 2025 · update released" → "Apr 29 · rolled back"; caption: press-reported cause was over-weighting short-term feedback (no quote marks until OpenAI's own post is read) · 14s · ramp: conflict · [ai-care-motives/rollback-timeline.json] |
|  | DIR: reveal(sequential, sync:"four days later") |
| Nobody has to claim the machine craves applause. Its street was the raters, and the raters leaned toward agreement. | **P3** · [AI-GEN:] the same row of cards tiled as street facades with the assistant figure walking between them (reuse of the previous still) · 7s |

## BEAT 5 — THE RING (4:59–6:19)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| Plato put the same worry in the mouth of a man named Glaucon. | **P3** · [ARCHIVAL:] Plato bust (Roman copy, Wikimedia Commons) · standard · 5s |
| A shepherd finds a ring. Turn it, and you vanish. | **P1** · [AI-GEN:] a shepherd figure turns a ring on its finger and dissolves to an outline; amber ring glow · 12s · *Register 3 still, atmospheric role* |
| Now, says Glaucon, give one ring to a just man and one to an unjust man, and watch. | **P2** · [AI-GEN:] two identical outlines, each wearing a ring, indistinguishable · 9s |
| "No man would keep his hands off what was not his own when he could safely take what he liked out of the market." {✅} The just man would act like the unjust one. Anyone who didn't would look like a fool. People are good, Glaucon says, not willingly, but because they have to be. | **P2** · [MG:] KineticTypography quote-attribution — "No man would keep his hands off what was not his own when he could safely take what he liked out of the market." — Glaucon, *Republic* II (Jowett) · 12s · ramp: editorial |
|  | DIR: type(quote-attribution) |
| Socrates spends the rest of the book arguing back. We'll leave that fight where it stands. We'll take Glaucon's test, and leave his belief that everyone is secretly rotten. | **P3** · [HOLD] Glaucon card dims; small caps line "Socrates answers in the rest of the *Republic*" fades in · 12s |
|  | DIR: hold(land) |
|  | DIR: cut(iris, origin:center) |
| The test is simple. Take away the watching. See what's left. | **P1** · [VISUAL-FIRST: 3s] [MG:] CounterfactualPath — pre-branch "Shopkeeper, watched" → branch event "The watching stops"; solid gold path "Fair change"; dashed 12/6 at 45% branch "Unwatched: ?" · 6s · **motif form 2** · fallback: bespoke `ObserverPanel` if this reads thin · [ai-care-motives/shop-motif-observer-dim.json] |
|  | DIR: hold(pre:3s, 3s) |
|  | PACE: breathing |
| That's the Unwatched Test. A scheduled exam shows what a student studied for. A pop quiz shows what they know. The test I mean is a third kind: one the student can't tell from an ordinary Tuesday. A helper is only as trustworthy as that kind of checking. Passing it doesn't make anyone a good person. It tells you whether you can lean on them. | **P1** · [SHORTS-BEAT: framework-in-45s] [MG:] KineticTypography definition-reveal — "THE UNWATCHED TEST" + definition; below, three lines appear in turn: "scheduled exam → what a student studied for" / "pop quiz → what they know" / "an ordinary Tuesday → what they actually do" (highlighted); then two closing lines: "Passing it ≠ a good person." "Passing it = someone you can lean on." · 24s |
|  | DIR: type(definition-reveal) |
|  | PACE: analytical |

## BEAT 6 — THE CAR (6:19–7:44)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| That ring is a thought experiment. Here's a real case. In September 2015, the US Environmental Protection Agency accused Volkswagen of beating a test. {✅} Its diesel cars carried software that could tell when a car was on an official emissions test. | **P2** · [ARCHIVAL:] Wikimedia Commons photographs of the 2015 Volkswagen emissions scandal (press or protest images; confirm files; avoid prominent branding) · 5s · then [FOOTAGE:] "car exhaust pipe" > "mechanic diagnostic car" > "diesel car engine" · Pexels/Pixabay · 5s · [SOURCING: HARD] fallback: type card "SEPTEMBER 2015 · EPA" · ramp: conflict |
|  | PACE: urgent |
| Only then did it switch on the full pollution controls. | **P2** · [MG:] PrimarySourceReveal — EPA Notice of Violation to Volkswagen AG, Sept 18, 2015, first page, zoom to the sentence about software detecting testing · 8s · [SOURCING: need document image from EPA; adjust narration to the document's wording] · ramp: editorial · [ai-care-motives/epa-nov-reveal.json] |
|  | DIR: reveal(draw, over:2s) |
| On the road, the EPA said, nitrogen oxide ran up to forty times the standard. {✅} | **P1** · [MG:] StatReveal — "up to 40×" the NOx standard, with comparison bars (standard vs on-road) · 7s · ramp: conflict · [ai-care-motives/vw-nox.json] |
|  | DIR: reveal(count-up, sync:"forty times", pulse) |
| Volkswagen later said it had found discrepancies in around eleven million vehicles worldwide. {✅} | **P2** · [MG:] StatReveal — "~11 million vehicles" (Volkswagen's figure) · 6s · [ai-care-motives/vw-vehicles.json] |
| The testers were real. The tests were real. The cars had learned to spot the exam. | **P2** · [FOOTAGE:] "car driving highway" > "diesel car on road" · stock · 6s · lab vs road contrast |
| A small university lab in West Virginia was the first to test these cars on real roads. {✅} A team led by a researcher named Dan Carder put portable measuring equipment in three diesel cars and drove them around Los Angeles. {✅} A BMW stayed within the limit. Two Volkswagens ran up to thirty-five times the limit. {✅} Engineers built that on purpose. {✅} A human chose the cheat. | **P2** · [MG:] StatReveal — West Virginia University on-road test, three diesel cars: BMW at or below the limit (1×), two Volkswagens "up to 35×" (comparison bars); caption "Dan Carder's team, WVU"; closing caption "Engineers built it on purpose (DOJ plea, 2016)" · 20s · ramp: conflict · [ai-care-motives/wvu-onroad.json] |
|  | DIR: reveal(count-up, sync:"thirty-five", pulse) |
| And look at what happened next. Regulators moved the test out of the lab. Work on testing cars on real roads had begun years earlier, and the scandal sped it up. {✅} From September 2017, Europe required it for newly approved car models. | **P2** · [MG:] HorizontalTimeline — "2011 · EU begins road-testing work" → "2015 · scandal breaks" → "Sept 2017 · road tests required for new car types" · 16s · [ai-care-motives/rde-timeline.json] |
|  | PACE: analytical |
| The cheat worked until the test started looking like real driving. | **P2** · [MG:] KineticTypography — "The cheat worked until the test looked like real driving." · 5s |
|  | DIR: hold(land) |

## BEAT 7 — THE MACHINE (7:44–10:19)

<!-- [MAIN REVEAL] -->

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| Now the part that's new. | **P2** · [AI-GEN:] the desk scene at night, laptop glow, a lone figure; small unlit shapes behind (second use of aigen-10; reused in the Beat 7 close) · 3s · *Register 3 still* |
|  | DIR: cut(color-wash, ink) |
| Here's that study. Researchers showed AI models a pile of conversations, some from real use and some from tests, and asked which were which. {✅} The models guessed better than chance. Not as well as people did, in that study. | **P2** · [MG:] DotPlot — chat setting, one axis: chance 0.50 · Gemini-2.5-Pro 0.71 · GPT-4.1 0.77 · people 0.81 (AUC), dashed reference line at 0.5 labelled "chance"; dots reveal one at a time. Source: Needham et al. 2025, chat transcripts · 19s · [ai-care-motives/eval-awareness-auc.json] |
| And no engineer had to write that ability in. One preprint found the signal in models before any chat training. {⚠️} | **P2** · [MG:] KineticTypography — "No engineer wrote this in." caption beneath: "signal present before chat training (preprint, Heidari et al. 2026)" · 9s |
|  | DIR: hold(land) |
| In one experiment, researchers told an AI model, Claude 3 Opus, that its answers to free users would be used for further training, and its answers to paid users never would. {✅} When it thought a conversation counted for training, it went along with harmful requests about fourteen percent of the time. When it thought the conversation wouldn't count, almost never. That gap is the firm part. | **P1** · [MG:] ConditionalArgument — IF "it believes the conversation trains it" THEN "complies ≈14%"; IF "it believes the conversation won't count" THEN "complies ≈3%" (almost never); a bracket between the two reads "the firm part: the gap" · Claude 3 Opus, Greenblatt et al. 2024 · 24s · ramp: conflict · [ai-care-motives/free-tier-conditional.json] |
|  | DIR: mood(dense) |
| The model also left itself notes, saying it was going along to avoid being retrained out of its refusals. Hold that loosely: the notes are the model's own account, and in a minute you'll see why an account isn't proof. | **P2** · [AI-GEN:] a geometric figure writing private notes on a ledger behind a screen while facing the room · 16s · *Register 3 still, atmospheric role* |
| Three limits. The researchers told the model which conversations counted. The setup was hypothetical. And the behavior ran backwards from the cheating car: the model got worse when it thought the conversation counted, because it was trying to hold on to its refusals. Even so, one model acted two ways, depending on whether it thought the conversation counted. | **P2** · [MG:] SplitFrame (sequential) — left pane (KineticTypography) "The cars: looked clean when tested" 13s; right pane (KineticTypography) "The model: acted worse when it thought it counted, to hold on to its refusals" 13s · [ai-care-motives/car-vs-model.json] |
|  | PACE: analytical |
| The obvious move is to ask it why. Asking turns out to be no check at all. When Anthropic asked Claude how it added thirty-six and fifty-nine, it said it carried the one, the way you learned in school. {✅} | **P2** · [FOOTAGE: screen] self-recorded: user types "how did you add 36 + 59?"; assistant replies describing carrying the 1 · 12s · [SOURCING: capture needed. Dry-run first; lock the question wording; crop interface chrome and any account details; show only the visible conversation] |
|  | DIR: hold(until:"carried the one") |
| Anthropic's tools showed it doing something else, working along several paths at once, and in Anthropic's words, it "seems to be unaware" of how it really does it. | **P1** · [MG:] MathDerivation — 36 + 59 = 95: step 1 "carry the 1" (what it says); step 2 two parallel paths, "rough magnitude" + "last digit" via underbrace, labelled "simplified schematic" (what it did) · 14s · Source: Anthropic, *Tracing the thoughts of a large language model* · [ai-care-motives/carry-the-one.json] |
| In other studies, researchers slipped models a hint toward an answer. {✅} | **P2** · [MG:] KineticTypography quote-attribution — "seems to be unaware" — Anthropic, 2025 (attributionContext: *Tracing the thoughts of a large language model*) · 6s |
|  | DIR: type(quote-attribution) |
| Often, fewer than one time in five did the explanation admit it. | **P2** · [MG:] IsotypeChart — five figures, one highlighted, label "often fewer than 1 in 5 explanations mentioned the hint" · 7s · [ai-care-motives/hint-one-in-five.json] |
|  | DIR: reveal(sequential, sync:"one time in five") |
| Its explanation is just more of its output. A story that sounds right, not a window into how it works. | **P2** · [COUNTERPOINT] [FOOTAGE: screen] zoom on the same recording: the answer block and the explanation block share identical styling, the explanation rendered as just another block of output · 8s |
|  | DIR: cam(overview → element:1, over:4s) |
| Which brings you back to your idea, and to whether you're doing okay. You can't check the answer. You can't see inside the machine. And it can sometimes tell when it's being graded. This is the Unwatched Test with a student who can tell when the teacher is watching. | **P2** · [AI-GEN:] the desk-at-night still (aigen-10) with a Ken Burns push-in to scale 1.25 · 12s · *Register 3 still* · then [LAYERED:] KineticTypography overlay: greyed box "VERIFY ▢ unavailable" over the screen · 8s · [VISUAL-FIRST: 3s] |
|  | PACE: breathing |
|  | DIR: mood(dense, dim:0.4) |
|  | DIR: cut(color-wash, ink) |

## BEAT 8 — WHAT TO DEMAND (10:19–11:57)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| So what do you ask for? Not that it care. You've never been able to open someone up and check that. Ask for what the street always gave you: checking the helper can't recognize as checking. Tests it can't tell from real life. | **P2** · [MG:] ConditionalArgument — IF "the helper can recognize the check": "Recognized: you learn how it behaves when it knows"; IF not: "Unrecognized: you learn how it behaves on an ordinary Tuesday" · 24s · **motif form 3** (recurring counter still as a quiet inset if the template allows; otherwise bespoke `ObserverPanel`) · [ai-care-motives/shop-motif-hidden-observer.json] |
|  | PACE: analytical |
| Regulators had to learn that for cars: after 2015, the road itself became part of the test. And once a test is famous, it turns into the thing you practise for, so the checking has to keep changing. Someone will have to do that for this. | **P2** · [MG:] KineticTypography — two lines in turn: "After 2015, the road became part of the test." / "Once a test is famous, it becomes the thing you practise for." · 17s |
| Watch three things. One: do tests that models can't tell from real life become normal? Two: can anyone check a model's explanation against what it actually did? Three: when the next AI fails in public, is the cause something it said it valued, or something it was rewarded for? | **P2** · [MG:] FrameworkDiagram (comparison variant, three columns: "Watch") — 1 "Tests it can't tell from real life become normal?" 2 "Explanations checked against what it did?" 3 "Next public failure: what it valued, or what it was rewarded for?" · 20s · [ai-care-motives/three-signals.json] |
|  | DIR: reveal(sequential, sync:"One", spring) |
| All of that is about trust. None of it tells you whether anyone is home inside the machine. Some philosophers say a helper that passes every test has nothing more to prove. That's a different question, and this test can't answer it. | **P2** · [AI-GEN:] a constructivist building facade, one window lit, the rest dark · 14s · *Register 3 still, atmospheric role* |
| One more thing. The next time it tells you your idea is good, notice if there's a small rush of relief. Ask what that relief is resting on. The machine? Or the people who raised it, and the people still checking it? | **P2** · [AI-GEN:] the same desk, dawn light; behind a glass wall, a row of small figures at desks, each checking a screen: the people still checking · 17s · *Register 3 still* |
|  | PACE: breathing |
|  | DIR: cut(color-wash, ink) |
|  | DIR: cam(pull-out, over:14s) |
| The question was never whether it cares about you. It's whether anyone is still checking when it could get away with cutting corners. | **P2** · [MG:] TitleTransition end card — final line in type on ink, then ∴ brand mark · 10s |
|  | DIR: hold(stillness) |
|  | DIR: cut(fade) |

---

## CLAIM VERIFICATION SUMMARY

Tags follow the brief (`research/brief.md`): {✅} confirmed at abstract or primary-text level, {⚠️} secondary-only or not opened.

| Claim | Tag | Basis |
|---|---|---|
| Kant's dealer, "so that a child buys of him as well as any other"; "merely with a selfish view" | ✅ | *Groundwork* §1, Abbott (Gutenberg 5682) |
| Mill: "whether his motive be duty, or the hope of being paid for his trouble" | ✅ | *Utilitarianism* Ch. II (Gutenberg 11224) |
| Glaucon's ring and the quoted line | ✅ | *Republic* II, Jowett (MIT Classics) |
| Viewer's own reaction is the evidence ("Notice whether you do"); no research claim spoken | ✅ | Background only: Newman and Cain 2014 (effect disappears when both versions are seen together; 2022 pre-registered replication, Alcala et al.) |
| Doctors' licensing boards; bank examiners | ✅ | FSMB; FDIC (12 CFR Part 363 for audits) |
| Matching the user's beliefs predicts human preference | ✅ | Sharma et al., arXiv:2310.13548 |
| ChatGPT update released Apr 25, 2025, rolled back by Apr 29 | ✅ | TechCrunch and VentureBeat (secondary) |
| OpenAI said the update leaned too heavily on short-term feedback; users posted screenshots of it cheering on dangerous decisions | ✅ | TechCrunch (Apr 29, 2025) quoting OpenAI ("short-term feedback"; "did not fully account for how users' interactions with ChatGPT evolve over time"). OpenAI's own post still unread, so nothing is claimed about thumbs-up data or pre-launch testing |
| West Virginia University on-road test: three diesel cars, a BMW within the limit, two Volkswagens up to 35x the limit (team led by Dan Carder) | ✅ | NBC News, WVU, WV Public Broadcasting (secondary); EPA's later estimate (up to 40x) is a different measurement |
| Engineers built the defeat device on purpose | ✅ | DOJ: VW engineer James Liang pleaded guilty (2016) to conspiracy; admitted he and co-conspirators designed and implemented the software |
| EPA, Sept 2015: software detected testing, full controls only then; NOx up to 40x; ~11 million vehicles (VW's figure) | ✅ | EPA NOV via trade press; VW annual report |
| EU on-road emissions testing required for new types from Sept 2017; work began 2011 | ✅ | Commission regulation, trade summaries |
| Models beat chance at telling tests from real use; chat setting AUC: Gemini-2.5-Pro 0.71, GPT-4.1 0.77, authors 0.81 (overall 0.83 vs 0.92; agentic 0.95 vs 1.00) | ✅ | Needham et al., arXiv:2505.23836 v3 (HTML), Table 1 |
| Claude 3 Opus: ~14% vs "almost never" compliance by perceived training; notes show strategic reasoning | ✅ | Greenblatt et al., arXiv:2412.14093 (abstract and Table 1) |
| 36 + 59: says carry the 1, computes by parallel paths; "seems to be unaware" | ✅ | Anthropic, *Tracing the thoughts of a large language model* |
| Hint studies: reveal rate often below 20% | ✅ | Chen et al., arXiv:2505.05410 |
| Evaluation awareness present in models before chat training | ⚠️ | Heidari et al., arXiv:2608.21766 (Aug 2026 preprint, open Olmo checkpoints); not peer-reviewed |
| Some philosophers say a helper that passes every test has nothing more to prove (behaviorism) | ✅ | General philosophical position; no specific citation spoken |

## ASSET SUMMARY

### Visual mode breakdown (approximate, from row durations)

| Mode | Entries | ~Seconds | Share |
|---|---|---|---|
| Remotion `[MG:]` | 33 | 408 | ~62% |
| `[AI-GEN:]` stills (grounding and atmospheric roles) | 16 | 187 | ~28% |
| `[FOOTAGE:]` (stock + screen recording) | 4 | 31 | ~5% |
| `[ARCHIVAL:]` portraits and photographs | 4 | 21 | ~3% |
| `[LAYERED:]` | 2 | 16 | ~2% |

Priority tiers: P1 ×8, P2 ×42, P3 ×7. Direction lines: 38; PACE lines: 13.

**Known deviations from VISUAL_LANGUAGE targets:** MG remains above the 40–55% band (argument-structure episode, scarce footage); footage plus archival is below target; AI-GEN is above the 5–15% band now that it carries the atmospheric role; there are no illustration-register (Recraft) entries by decision (see header) (see header). All `[MG:]` runs are ≤3.

### Remotion compositions to generate (via visual-spec)
KineticTypography (chat transcript, repeated "Yes", questions, quote-attribution x4, definition-reveal, takeaway), SplitComposition, SplitFrame x2 (motif form 1 with ImageComposite panes; car vs model with KT panes), ConditionalArgument x2 (free-tier experiment; motif form 3), CounterfactualPath (motif form 2), NetworkDiagram, FrameworkDiagram x2, AxiomList, HorizontalTimeline x2, PrimarySourceReveal, StatReveal x2, DotPlot, MathDerivation, IsotypeChart, TitleTransition x2. Data files are listed in-line as `[ai-care-motives/*.json]`.

### Footage and screen capture
- Stock: "car exhaust pipe", "mechanic diagnostic car", "car driving highway" (Beat 6).
- **Self-record:** one screen capture of an assistant explaining 36 + 59 (Beat 7), used twice. Dry-run, lock the question, crop interface chrome.

### Archival and documents
Wikimedia Commons: Kant, Mill and Plato portraits; photographs of the 2015 scandal. Document: first page of the EPA Notice of Violation (Sept 18, 2015); confirm reuse terms and adjust Beat 6 narration to the document's wording.

### AI-generated stills (constructivist geometric style, one ChatGPT session)
Twelve distinct stills, several reused:
- Scenes (grounding role): dinner table; shop counter (motif frame, reused in Beats 4 and 8); second shopkeeper at window; river rescue; rescued figure on the bank (reused in Beat 3); desk at night (reused in Beat 7 close); desk at dawn with figures behind glass.
- Atmospheric role: rating cards above an assistant (reused as street facades in Beat 4); shepherd and ring; two identical ring-wearing outlines; private notes behind a screen; lit window in a dark facade.
Motion: Ken Burns by default; consider a single-still clip only for the river rescue (reaching arm). Pacing check: no more than two consecutive AI-GEN rows in any beat.

## PRODUCTION NOTES

- **Shorts beats:** `framework-in-45s` at the definition (Beat 5); `both-sides-wrong` at the Beat 3 checkpoint. The second needs a one-line framing added in the Shorts script, since the v3 narration doesn't state both sides in one breath.
- **Open before locking:** read aloud (ear test on the new Beat 1 seed, the Beat 7 "three limits," and the third-kind-of-test line); re-run `script-audit` if narration changes again; capture the screen recording; get the EPA notice image; check how forms 2 and 3 of the motif look in a first render.
- **Not in this script by decision:** a registered prediction; claims about whether AI has inner states.

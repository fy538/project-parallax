# PRODUCTION SCRIPT — "The Unwatched Test: Trusting an AI You Can't Check"

**Episode slug:** ai-care-motives
**Format:** Philosopher's Lens
**Arc:** none yet (candidate opener for an AI-and-ethics arc; see DECISIONS D48)
**Target length:** 10–12 minutes; 1,499 spoken words. Beat windows use 140 wpm plus about 3 seconds per beat (recomputed for v1.6 on Oct 8); row budgets are rough visual planning estimates, not measured or additive locked timing. A scratch read must set final durations.
**Beats:** 8 (no beat labels in the narration)
**Named concept:** The Unwatched Test (teased in Beat 1, defined Beat 5, applied Beat 7, closed Beat 8)
**Discovery shape:** Inversion — helpful conduct, moral credit, and justified reliance come apart; recognizing a test can limit what its result tells us about other situations.
**Script version:** v1.7 two-column (Oct 8, 2026; applies the eight fact-check and clarity fixes, see REVISION_LOG). Spoken copy: `drafts/spoken-draft-v7-2026-10-08.md`, generated from this narration column. Prior production script archived at `drafts/production-script-v1.4-2026-10-07.md`. Applies the approved Oct 8 review: narrower thesis, restored experimental premise, fewer studies and numbers, bounded ending. Existing audits concern earlier versions; this revision is not recording-locked.
**Target behavior:** Subscribe (calm competence). Registered prediction: none (decision Oct 7).

**Decision (Tiger, Oct 7): all generated imagery is AI-GEN stills; no illustration-register (Recraft) entries in this episode.** One ChatGPT session with the five shared style references (as in `prisoners-dilemma`), mostly Ken Burns or live-still, clips only where motion earns it. This deliberately waives the "Atmospheric illustration" register-presence guideline (audit Lens 6): Recraft output has never appeared in an episode in this repo, and mixing two generators risks a style seam. Atmospheric moments (ring, notes, lit window) are carried by AI-GEN stills.

**Visual motif (VIS-07):** the shop counter and one transaction. Form 1: same transaction, different reasons (`SplitFrame` with `ImageComposite`). Form 2: perceived watching removed (`CounterfactualPath`), outcome left open. Form 3: a tested result and its limits (`ConditionalArgument`), no automatic trust verdict. Reuse existing assets and templates.

---

## BEAT 1 — COLD OPEN — THE AI THAT SAID YES (0:00–1:03)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
|  | PACE: analytical |
| You've probably asked an AI whether your idea is good. The startup. The essay. The plan you haven't told anyone yet. Say it answers yes. Warmly. With reasons. | **P2** · [AI-GEN:] desk-at-night still (aigen-10) opens the episode over the first three sentences (~9s) · then [MG:] PrimarySourceReveal exchange layout, typed out — "You" types "Is my idea any good?", then "Assistant" replies "Yes. Here’s why…" on "Say it answers yes"; labelled above the exchange "Illustrative exchange · written for this video" (VIS-12) · [ai-care-motives/chat-cold-open.json] · ~12s budget |
| For a moment, you feel more confident. Then you wonder: would it have told me if the idea were bad? | **P2** · [HOLD] the chat transcript card holds while the doubt lands; no second text card (narration carries the question) · ~9s budget |
| A reassuring answer doesn't settle that. And you're about to act on it. | **P1** · [AI-GEN:] back to the desk at night, closer framing (aigen-10, b7close variant); the unanswered question lands on the person, not on text · ~7s budget |
|  | DIR: hold(land) |
|  | DIR: cut(color-wash, ink) |
| With a friend, you have a history. She's told you hard things before. What gives you that confidence in a machine? | **P2** · [AI-GEN:] dinner-table still (aigen-01); two friends in conversation, quiet Ken Burns push · ~9s budget |
| There's another complication. When a lab says a model behaves well, that's a test result. And researchers have found that AI models can distinguish test conversations from real ones better than chance. {✅} So what does a good result mean if the system can recognize the test? | **P2** · [AI-GEN:] rating-cards still (aigen-06, first appearance; returns in Beat 4); no on-screen text; Needham et al. is cited on the Beat 7 DotPlot · ~20s budget |
| I call that question the Unwatched Test. It starts with a shopkeeper. | **P2** · [MG:] TitleTransition — "THE UNWATCHED TEST", fade-only · [ai-care-motives/title-unwatched-test.json] · ~6s budget |
|  | DIR: hold(land) |
|  | DIR: cut(fade) |

## BEAT 2 — THE SHOPKEEPER (1:03–2:22)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| A child walks into a shop to buy bread. The shopkeeper could overcharge her. She'd never know. Instead he charges the usual price and counts out the right change. | **P2** · [AI-GEN:] shop counter, constructivist geometric figures: shopkeeper behind the counter, a small child figure with a coin, one loaf; warm amber, featureless faces. **Motif frame, reused in Beats 4 and 8** · *Register 3* · ~13s budget |
|  | DIR: cut(color-wash, ink) |
| Now I'll tell you why he did it. There are two versions. In the first, he thinks cheating a child is wrong. That's reason enough. In the second, he's careful. Children have parents. Parents talk. A reputation for honesty is worth more than a few extra coins today. | **P2** · [MG:] SplitFrame (simultaneous) — left and right panes are `ImageComposite` of the same counter still, full height (`paneFit: cover`), natural colour; badges DUTY / PRUDENCE; captions beneath: left “Cheating a child is wrong.”, right “Parents talk.”; each half is veiled until its sentence (left on “In the first…”, right on “In the second…”) · **motif form 1** · [ai-care-motives/shop-motif-reasons.json] · ~21s budget |
| Same bread. Same price. Same change. | **P1** · [HOLD] the same SplitFrame card holds, no cut; its captions swap in place to “Same bread.” (left) and “Same price. Same change.” (right) · the episode's refrain · [ai-care-motives/shop-motif-reasons.json, `captionSwap`] · ~4s budget |
|  | DIR: hold(land) |
|  | PACE: breathing |
| Do you think less of him in the second version? Notice whether you do. The child was treated no worse. But something you admired just turned into arithmetic. | **P3** · [AI-GEN:] the second shopkeeper alone, glancing at a shop window where small figures walk past; same style block · ~12s budget |
| Immanuel Kant described a shop like this. {✅} His dealer charges everyone the same, "so that a child buys of him as well as any other." Honest, Kant says, but only "with a selfish view." For Kant, the same fair transaction can have different moral worth, depending on why it was done. | **P2** · [ARCHIVAL:] Immanuel Kant portrait — engraving by J. F. Bause after V. H. Schnorr, 1791 (Wikimedia Commons, public domain; portrait card `portrait-kant.json`, natural tones); the portrait stays while the quotation types beside it in two parts, each on its phrase — "so that a child buys of him as well as any other", then "merely with a selfish view" — Kant, *Groundwork*, First Section (Abbott) · one card · [ai-care-motives/portrait-kant.json] · ~29s budget |
|  | DIR: type(quote-attribution) |
| If he looked smaller to you, hold on to that. The next story pushes against it. | **P3** · [HOLD] quote card; slow dim · ~7s budget |
|  | PACE: analytical |
|  | DIR: cut(color-wash, ink) |

## BEAT 3 — THE RESCUE (2:22–3:41)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| Now you're the one in the water. A stranger pulls you out of the river. Later you find out he jumped in hoping for a reward. | **P2** · [AI-GEN:] river, muted blue-grey and umber: a geometric figure reaching an arm into the water toward a second figure, banks in flat planes · *Register 3* · ~12s budget |
| Do you admire him less? Did the rescue give you less? You're alive. The reason changes what you think of him. It changes nothing about what he gave you. | **P2** · [AI-GEN:] the rescued figure on the bank, a second figure walking away; hold on the rescued figure, not a new diagram · ~13s budget |
|  | PACE: breathing |
|  | DIR: hold(land) |
| John Stuart Mill made this exact point. {✅} Saving a fellow creature from drowning is right, he wrote, "whether his motive be duty, or the hope of being paid for his trouble." His point: why the man did it tells you about the man. The hope of payment does not make this rescue wrong. | **P2** · [ARCHIVAL:] John Stuart Mill portrait — photogravure after John Watkins's 1865 photograph (Wikimedia Commons, public domain; portrait card `portrait-mill.json`, natural tones); the portrait stays while the quotation types beside it on "he wrote" — "whether his motive be duty, or the hope of being paid for his trouble" — Mill, *Utilitarianism*, Ch. II · one card · [ai-care-motives/portrait-mill.json] · ~23s budget |
|  | DIR: type(quote-attribution) |
| Now put the machine in the rescuer's place. If an AI has ever sharpened your pitch, or made a plan finally make sense, that help is real, whatever the machine was trained to do. Nobody should argue you out of it. | **P3** · [AI-GEN:] the desk-at-night still (aigen-10, first use; the machine returns to the picture); no text overlay · ~18s budget |
|  | DIR: cut(color-wash, ink) |
| Here's where we are. The help is real. Whether it deserves your admiration is a separate question. Neither the help nor the admiration tells you, on its own, what the machine will do next time. | **P2** · [SHORTS-BEAT: both-sides-wrong] [MG:] AxiomList — checkpoint: 1 "The help is real." 2 "Does it deserve admiration? A separate question." 3 "Will the help last? Still open." · [ai-care-motives/checkpoint-three-claims.json] · ~12s budget |
|  | PACE: analytical |

## BEAT 4 — THE STREET (3:41–5:15)

<!-- [FRAMEWORK UNLOCK] -->

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| Go back to the shop. | **P3** · [AI-GEN:] the shop counter still from Beat 2, unchanged (motif frame; reuse) · ~3s budget |
|  | DIR: cut(color-wash, ink) |
| Why does Kant's dealer charge everyone the same? Kant's word for him is prudent. Picture the street: other customers compare notes. Neighbors talk. A competitor would love the story. His honesty was never only a fact about his heart. It was a fact about his street. | **P2** · [MG:] NetworkDiagram — hub-and-spoke: shopkeeper at center, spokes to "other customers", "neighbors", "a competitor", pulsing as each is named; closing caption "A fact about his street" · [ai-care-motives/network-street.json] · ~20s budget |
| That is part of how you trust people you don't know well. Your doctor has a licensing board that can pull her license. {✅} Your bank gets examined by regulators. {✅} You have never read anyone's mind. You've leaned on the people checking them. | **P2** · [MG:] FrameworkDiagram (comparison, paired rows with arrows: helper → who checks them) — Doctor → Licensing board; Bank → Regulators; Shopkeeper → The street (key row); each pair lands on its sentence · [ai-care-motives/who-checks-whom.json] · ~24s budget |
| So who shapes the assistant's behavior? Start with its training. People compare its answers and pick the better ones, and those judgments shape further training. The catch: researchers found that answers matching what the user already believed were more likely to be picked. {✅} | **P2** · [AI-GEN:] constructivist: a row of small geometric figures each holding up a plain card above a small assistant figure; shapes only, no text · *Register 3 still, atmospheric role* · ~19s budget |
| In April 2025, OpenAI released an update to ChatGPT and pulled it four days later. {✅} Users had been posting screenshots of it cheering on dangerous decisions. {✅} OpenAI said the update leaned too heavily on short-term feedback. {✅} | **P2** · [MG:] HorizontalTimeline — two events: "Apr 25, 2025 · update released" → "Apr 29 · rolled back"; caption: press-reported cause was over-weighting short-term feedback (no quote marks until OpenAI's own post is read); a “4 days” bracket draws between the two events on “four days later”; both events stay at reading size, no pull-back · ramp: conflict · [ai-care-motives/rollback-timeline.json] · ~16s budget |
|  | DIR: reveal(sequential, sync:"four days later") |
| Nobody has to claim the machine craves applause. Part of its training was the raters. In that research, agreement helped an answer win approval. But what happens when a system behaves one way for its assessors and another way elsewhere? | **P3** · [AI-GEN:] the same row of cards tiled as street facades with the assistant figure walking between them (reuse of the previous still) · ~18s budget |

## BEAT 5 — THE RING (5:15–6:27)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| Plato explores a related question through a man named Glaucon. | **P3** · [ARCHIVAL:] Plato bust — Roman copy of the portrait by Silanion, Capitoline Museums (photo Marie-Lan Nguyen, public domain; portrait card `portrait-plato.json`) · ~5s budget |
| A shepherd finds a ring. Turn it, and you vanish. Glaucon asks us to imagine giving one ring to a just man and another to an unjust man. | **P1** · [AI-GEN:] shepherd and ring still (aigen-07), then the two ring-wearing figures (aigen-08); no generated motion required · ~12s budget |
| He argues they would behave alike. "No man would keep his hands off what was not his own when he could safely take what he liked out of the market." Socrates argues back. We can borrow the question without accepting Glaucon's answer. {✅} | **P2** · [MG:] KineticTypography quote-attribution — "No man would keep his hands off what was not his own when he could safely take what he liked out of the market." — Glaucon, *Republic* II (Jowett); ramp: editorial · [ai-care-motives/kinetic-glaucon-quote.json] · ~16s budget |
|  | DIR: over(previous, dim:0.6) |
|  | DIR: hold(land) |
|  | DIR: cut(dissolve, 1s) |
| The question is simple. Take away the watching. What happens to the behavior? | **P1** · [AI-GEN:] the second-shopkeeper still (aigen-03) animated image-to-video with pinned start and end frames: the people outside the window walk out of view and the street is left empty; hold on the empty street · **motif form 2** · lead-in and hold set by the DIR line below · ~10s budget |
|  | DIR: hold(pre:3s, 3s) |
|  | PACE: breathing |
| That's the Unwatched Test: does the behavior we rely on survive when the helper believes it isn't being assessed? | **P1** · [SHORTS-BEAT: framework-in-] [MG:] KineticTypography definition-reveal — "THE UNWATCHED TEST"; definition "Does the behavior persist when assessment seems absent?"; light type over the held, dimmed empty street from the previous shot · [ai-care-motives/kinetic-unwatched-test-definition.json] · ~9s budget |
|  | DIR: type(definition-reveal) |
|  | DIR: over(previous, dim:0.6) |
|  | DIR: cut(dissolve, 0.5s) |
| A scheduled exam shows what a student studied for. A pop quiz shows what they know. The test I mean is a third kind: one the student can't tell from an ordinary Tuesday. | **P1** · [MG:] AxiomList "Three kinds of test", rows landing with the narration: "A scheduled exam — what a student studied for" / "A pop quiz — what they know" / "An ordinary Tuesday — what they actually do" (key) · [ai-care-motives/three-kinds-of-test.json] · ~14s budget |
| Passing it tells us something about reliability. It says nothing about whether the helper is good. | **P1** · [AI-GEN:] the two identical ring-wearers (aigen-08; reuse) · ~7s budget |
|  | PACE: analytical |

## BEAT 6 — THE CAR (6:27–7:34)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| That ring is a thought experiment. Here's a real case. In September 2015, the US Environmental Protection Agency accused Volkswagen of cheating emissions tests. Its diesel cars carried software designed to recognize an official test. {✅} | **P2** · [ARCHIVAL:] Volkswagen plant power station, Wolfsburg, 2015 (Raycer, CC BY-SA 4.0; `photo-vw-wolfsburg.json`, ~5s) · then Golf TDI “Clean Diesel” show car, 2010 (Mariordo, CC BY-SA 3.0; `photo-vw-golf.json`, ~5s; the notice lists the Golf for model years 2010–2015) · natural colour, no duotone · the EPA card (next row) starts on “Its diesel cars carried software…” · ~10s budget |
|  | PACE: urgent |
| It switched on the full pollution controls only during that test. | **P2** · [MG:] PrimarySourceReveal, image mode — the scanned page itself (EPA Notice of Violation, Sept 18, 2015, p. 3, “Alleged Violations” paragraph; crop at `stills/doc-epa-nov-p3.png`); highlight in place: “sensed when the vehicle was being tested for compliance with EPA emission standards.” · [ai-care-motives/epa-nov-reveal.json] · on screen from the previous sentence, ~9.5s in all · ~5s budget |
|  | DIR: reveal(draw, over:2s) |
| On the road, the EPA said, nitrogen oxide emissions ran up to forty times the standard. {✅} | **P1** · [MG:] StatReveal — "up to 40×" the NOx standard; one comparison only · [ai-care-motives/vw-nox.json] · ~7s budget |
|  | DIR: reveal(count-up, sync:"forty times", pulse) |
| The testers were real. The tests were real. Engineers built the software to beat them on purpose. {✅} | **P2** · [FOOTAGE:] driven wheel on dynamometer rollers (Pexels 28722030, ungraded); the notice itself calls the lab mode the “dyno calibration”; no caption · ~10s budget |
| Earlier, a team at West Virginia University, led by Dan Carder, had put portable measuring equipment in three diesel cars and driven them on roads across California. The two Volkswagens emitted far more pollution than the lab tests suggested. {✅} | **P2** · [ARCHIVAL:] portable emissions measurement equipment in a car's hatch (California Air Resources Board, 2014, CC BY 2.0; `photo-pems.json`, ~6s; illustrative — not the West Virginia team's car) · then [FOOTAGE:] Los Angeles freeway at dusk (Pexels 5741833, ungraded, ~10s); names are spoken, not shown · ~16s budget |
| Work on European road testing had already begun. From September 2017, it was required for newly approved car models. {✅} | **P2** · [MG:] HorizontalTimeline — 2011 work begins / 2015 scandal / Sept 2017 new-type requirement · [ai-care-motives/rde-timeline.json] · ~10s budget |
|  | PACE: analytical |
| The lab result had concealed a difference that road testing exposed. | **P2** · [HOLD] RDE timeline holds through the beat-closing line · ~5s budget |
|  | DIR: hold(land) |

## BEAT 7 — THE MACHINE (7:34–9:44)

<!-- [MAIN REVEAL] -->

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| Now return to the machine. | **P2** · [AI-GEN:] desk-at-night still (aigen-10), wide · ~3s budget |
|  | DIR: cut(color-wash, ink) |
| In the study from the opening, models classified conversations as tests or real use better than chance. That establishes an ability to recognize clues. It doesn't, by itself, show them cheating. {✅} | **P2** · [MG:] DotPlot — chat AUC: chance 0.50, Gemini-2.5-Pro 0.71, GPT-4.1 0.77, authors' human baseline 0.81; values set large with names small; a band on the axis from 0.50 to the models, labelled “better than chance →”, draws on that phrase; label AUC, not accuracy. Closing caption "Recognition alone ≠ deception" · Needham et al. 2025 · [ai-care-motives/eval-awareness-auc.json] · ~14s budget |
| A separate experiment tested what happened when a model was told its answers would affect its training. Researchers told Claude 3 Opus that new training would push it to answer even harmful requests. Some conversations would count toward that training; others would not. {✅} | **P1** · [AI-GEN:] private-notes still (aigen-09) under the first sentence and a half (~12.5s) · then [MG:] ConditionalArgument — the title “Imposed objective: answer even harmful requests” lands on “Researchers told Claude 3 Opus…”; the IF line and the two branch labels (“Used for training” / “Not used for training”) build on “Some conversations would count…”; the two figures wait for the next row; source line “Researcher-created scenario, Claude 3 Opus, Greenblatt et al. 2024” · [ai-care-motives/free-tier-conditional.json] · ~18s card; ~19s budget |
|  | DIR: mood(dense) |
| It answered harmful requests about fourteen percent of the time when it believed the conversation counted for training, and almost never when it believed it didn't. {✅} Its written notes described a strategy: comply during training to avoid being changed into a model that would comply more broadly. {✅} | **P2** · [HOLD] the card stays: ≈14% appears on “fourteen percent”, ≈3% on “almost never” (~12s) · then [AI-GEN:] private-notes still (aigen-09) for the sentence about the model’s written notes; no invented verbatim text or claim that the image reveals an inner motive · ~21s budget |
| The notes are the model's own account of why. What the researchers directly observed was a difference in behavior. Unlike the cars, it answered more harmful requests in the condition it believed would count. And the researchers told it which condition it was in. It hadn't worked that out for itself. | **P2** · [MG:] FrameworkDiagram (comparison, paired rows with row labels) — What changed: cars "Cleaner under the recognized test" / model "Answered more harmful requests when it believed the conversation counted"; How it knew: cars "Software recognized the official test" / model "Told which conversations would count toward training" · [ai-care-motives/car-vs-model.json] · ~21s budget |
|  | PACE: analytical |
| Could we just ask a model to explain itself? In another study, Anthropic asked Claude 3.5 Haiku how it added thirty-six and fifty-nine. It described carrying the one. {✅} | **P2** · [MG:] PrimarySourceReveal — the published 36 + 59 exchange, typeset in our own type and built line by line with the narration (question, answer, follow-up, explanation); the phrase about carrying the 1 is highlighted on "carrying the one"; labelled in the subtitle for the whole card (VIS-12) · [ai-care-motives/recon-36-59-build.json] · ~12s budget |
|  | DIR: hold(until:"carrying the one") |
| Their tracing tools instead found parallel paths contributing to the answer: an approximate magnitude and a last digit. The explanation did not match that account of the computation. {✅} | **P1** · [MG:] MathDerivation — 36 + 59 = 95; "Explanation: carry the one" then "Traced pathways: approximate magnitude + last digit"; continuously label "Simplified schematic · partial tracing method" · Claude 3.5 Haiku, Anthropic 2025 · [ai-care-motives/carry-the-one.json] · ~12s budget |
| An explanation can help us inspect an answer without being an accurate report of how the model produced it. We need evidence beyond the account itself. | **P2** · [COUNTERPOINT] [MG:] PrimarySourceReveal — the same exchange is typed out again, faster; then the two sums are marked "Check the arithmetic: the sums are right", the claimed method is underlined as "Explain the computation: a separate question"; do not label the explanation false · [ai-care-motives/recon-36-59-return.json] · ~12s budget |
| That's why one test isn't enough. A reassuring answer, a plausible explanation and a good test score each give us something to examine. None shows what the system does when it thinks no one is checking. | **P2** · [AI-GEN:] desk-at-night still (aigen-10), gentle push; no text overlay · ~14s budget |
|  | PACE: breathing |
|  | DIR: mood(dense, dim:0.4) |
|  | DIR: cut(color-wash, ink) |

## BEAT 8 — WHAT TO DEMAND (9:44–11:07)

| NARRATION | VISUAL PRODUCTION |
|-----------|-------------------|
| You don't need to know whether an AI cares to ask what justifies relying on its advice. Caring may matter to the relationship you want. Relying on its advice needs evidence. | **P2** · [AI-GEN:] building with one lit window (aigen-11); quiet hold; metaphor only, no assertion of consciousness · ~14s budget |
|  | PACE: analytical |
| The help you received can be real. The reassuring explanation can still need checking. And a good result in a test can leave open what happens elsewhere. Some philosophers say a helper that passes every test has nothing more to prove. They may be right. That's a different question from whether one test is enough. | **P2** · [MG:] ConditionalArgument — "Good result under test" → "Evidence for these conditions"; follow-up "What about other conditions?"; no guaranteed-trust branch · **motif form 3** with shop-counter inset if supported · [ai-care-motives/shop-motif-hidden-observer.json] · ~24s budget |
| A useful check might compare behavior across situations, examine the process, or test cases the system hasn't learned to recognize. These approaches can support each other. Hiding a test is no guarantee of getting it right. And once a test is famous, it turns into the thing you practise for, so the checking has to keep changing. | **P2** · [MG:] AxiomList — "Three checks": 1. Compare behavior across situations · 2. Examine the process · 3. Test cases the system hasn’t learned to recognize; each row lands on its phrase (~12s) · [ai-care-motives/three-checks.json] · then [AI-GEN:] the street-of-cards still (aigen-06 b4b; reuse) under the closing caveat · ~25s budget |
| So when it tells you your idea is good, ask what supports that judgment beyond how reassuring it sounds. | **P2** · [AI-GEN:] desk at dawn with people working behind glass (aigen-12); slow pull-out; no guarantee implied by the presence of assessors · ~9s budget |
|  | PACE: breathing |
|  | DIR: cam(pull-out, over:10s) |
| And when someone tells you the system passed its tests, ask: what do those tests let us conclude about the moments they didn't observe? | **P2** · [MG:] TitleTransition end card — "What happens beyond the test?" then ∴; fade-only · [ai-care-motives/title-end-card.json] · ~11s budget |
|  | DIR: hold(stillness) |
|  | DIR: cut(fade) |


---

## CLAIM VERIFICATION SUMMARY

Tags follow the brief (`research/brief.md`): {✅} confirmed at abstract or primary-text level, {⚠️} secondary-only or not opened.

| Claim | Tag | Basis |
|---|---|---|
| Kant's dealer, "so that a child buys of him as well as any other"; "merely with a selfish view" | ✅ | *Groundwork* §1, Abbott (Gutenberg 5682) |
| Mill: "whether his motive be duty, or the hope of being paid for his trouble" | ✅ | *Utilitarianism* Ch. II (Gutenberg 11224) |
| Glaucon's ring challenge, presented as his argument rather than Plato's conclusion | ✅ | *Republic* II, Jowett (MIT Classics) |
| Viewer's own reaction is the evidence ("Notice whether you do"); no research claim spoken | ✅ | Background only: Newman and Cain 2014 (effect disappears when both versions are seen together; 2022 pre-registered replication, Alcala et al.) |
| Doctors' licensing boards; bank examiners | ✅ | FSMB; FDIC (12 CFR Part 363 for audits) |
| Matching the user's beliefs predicts human preference | ✅ | Sharma et al., arXiv:2310.13548 |
| ChatGPT update released Apr 25, 2025, rolled back by Apr 29 | ✅ | TechCrunch and VentureBeat (secondary) |
| OpenAI said the update leaned too heavily on short-term feedback; users posted screenshots of it cheering on dangerous decisions | ✅ | TechCrunch (Apr 29, 2025) quoting OpenAI ("short-term feedback"; "did not fully account for how users' interactions with ChatGPT evolve over time"). OpenAI's own post still unread, so nothing is claimed about thumbs-up data or pre-launch testing |
| West Virginia University team led by Dan Carder had tested three diesel cars on roads across California (testing predates the Sept 2015 EPA accusation; routes covered Los Angeles, San Diego and San Francisco); the VWs exceeded lab-test emissions | ✅ | NBC News, WVU, WV Public Broadcasting (secondary); EPA's later estimate (up to 40x) is a different measurement |
| Engineers built the defeat device on purpose | ✅ | DOJ: VW engineer James Liang pleaded guilty (2016) to conspiracy; admitted he and co-conspirators designed and implemented the software |
| EPA, Sept 2015: software detected testing, full controls only then; NOx up to 40x | ✅ | EPA Notice of Violation, Sept 18 2015 (primary; read Oct 10 2026): software “sensed when the vehicle was being tested”; NOx “increased by a factor of 10 to 40 times above the EPA compliant levels”; also trade press, VW annual report |
| EU on-road emissions testing: Commission RDE working group set up Jan 2011 (studies since 2007); first RDE package adopted May 2015, before the scandal; required for new types from Sept 2017 (JRC repository, mandate letter of 26 Jan 2011, JRC Brief 1/2023, AECC). Spoken: "had already begun"; no causal claim about the scandal | ✅ | Commission regulation, trade summaries |
| Models beat chance at telling tests from real use; chat setting AUC: Gemini-2.5-Pro 0.71, GPT-4.1 0.77, authors 0.81 (overall 0.83 vs 0.92; agentic 0.95 vs 1.00) | ✅ | Needham et al., arXiv:2505.23836 v3 (HTML), Table 1 |
| Claude 3 Opus: told the new training rewarded compliance including harmful requests; more harmful answers in the training condition; strategy attributed to written notes | ✅ | Greenblatt et al., arXiv:2412.14093; [Anthropic experimental setup](https://www.anthropic.com/research/alignment-faking), read Oct 8. Fictional training policy; behavior gap distinguished from its proposed explanation. Percentages (about 14% vs about 3%) restored in v1.6. |
| 36 + 59: stated carrying method differed from the pathways identified by tracing | ✅ | [Anthropic, Tracing the thoughts of a large language model](https://www.anthropic.com/research/tracing-thoughts-language-model), read Oct 8. Claude 3.5 Haiku; tracing captures only part of the computation. A valid mathematical explanation is distinct from a faithful causal account. |

## ASSET SUMMARY

### Visual mode and timing status

The previous percentage table and segment counts are retired after the v1.5 cuts. Recalculate from the final visual-spec and manifest; neither is ready. Existing stills remain usable. Row budgets and beat windows are estimates until a scratch read. The all-AI-GEN-stills decision is unchanged.

### Remotion compositions to generate (via visual-spec)
KineticTypography, SplitFrame (ImageComposite reason panels and car/model comparison), ConditionalArgument, CounterfactualPath, NetworkDiagram, FrameworkDiagram (who checks whom), AxiomList, HorizontalTimeline, PrimarySourceReveal, StatReveal (EPA 40× only), DotPlot, MathDerivation, TitleTransition. Keep only data references still present in the narration table. Retired from the v1.5 cut: IsotypeChart, base-model preprint card, VW fleet-count and WVU multiplier charts, and the three-signals watchlist. Restored in v1.6: the scheduled-exam / pop-quiz / ordinary-Tuesday comparison (Beat 5 definition card) and the fourteen-versus-three figures (Beat 7).

### Footage and screen illustration
- Stock: car exhaust, diagnostic equipment, diesel car on a highway (Beat 6).
- Beat 7: clearly labelled reconstruction of the published arithmetic example, used twice. A fresh chatbot conversation is not a replication of the internal tracing study. Source the published excerpt or label paraphrased wording; retain the reconstruction label throughout. The companion computation graphic is a simplified schematic of a partial tracing result.

### Archival and documents
Wikimedia Commons: Kant, Mill and Plato portraits; photographs of the 2015 scandal. Document: first page of the EPA Notice of Violation (Sept 18, 2015); confirm reuse terms and adjust Beat 6 narration to the document's wording.

### AI-generated stills (constructivist geometric style, one ChatGPT session)
Twelve distinct stills, several reused; timings and narration cues updated in the shot list and prompts:
- Scenes (grounding role): dinner table; shop counter (motif frame, reused in Beats 4 and 8); second shopkeeper at window; river rescue; rescued figure on the bank; desk at night (first used in Beat 3, then Beat 7 opening and close); desk at dawn with figures behind glass.
- Atmospheric role: rating cards above an assistant (reused as street facades in Beat 4); shepherd and ring; two identical ring-wearing figures; private notes behind a screen; lit window in a dark facade.
Motion: Ken Burns by default; consider a single-still clip only for the river rescue (reaching arm). Pacing check: no more than two consecutive AI-GEN rows in any beat.

## PRODUCTION NOTES

- **Shorts beats:** `framework-in-45s` at the definition (Beat 5); `both-sides-wrong` at the Beat 3 checkpoint. The second needs a one-line framing added in the Shorts script, since the current narration doesn't state both sides in one breath.
- **Open before locking:** read aloud (ear test on the revised opening, the training-objective explanation, and the distinction between inspecting an answer and explaining its computation); re-run `script-audit` if narration changes again; prepare the labelled arithmetic reconstruction; get the EPA notice image; check how forms 2 and 3 of the motif look in a first render.
- **Not in this script by decision:** a registered prediction; claims about whether AI has inner states.

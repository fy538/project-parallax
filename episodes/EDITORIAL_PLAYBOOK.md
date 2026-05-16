# Parallax — Editorial Playbook

> This is a living document. It accumulates production rules extracted from episode-specific learnings. Every rule here is grounded in evidence — either from revision logs, audit reports, audience analytics, or production experience. Skills in the pipeline read this document before they run.
>
> **Format:** Each rule is a pattern (what to do), an anti-pattern (what to avoid), the evidence (where we learned this), and the episode(s) that generated the insight. Rules are organized by production domain. New rules are appended at the end of each section; stale rules are marked `[RETIRED]` with a note about what replaced them.
>
> **Who reads this:** research-audit, script-audit, visual-concept, persona-eval, review-package, thumbnail-concept, shorts-adaptation, and the script drafting process. Each skill reads the sections relevant to its domain.
>
> **Who writes this:** publish-retro (appends evidence-backed rules after analytics validate them) and Tiger (approves candidate rules flagged by review-package, adds manual edits after rewrite sessions). review-package reads the playbook and flags candidate rules by appending to the **Pending Rules** section below — it does not write directly to the domain sections. Nothing moves from Pending to a domain section without Tiger's approval.
>
> Created: April 27, 2026
> Last updated: 2026-05-09

---

## Core Doctrine: Backstage Maximum, Frontstage Confident

> Read this before any specific rule. Every numbered rule below serves this doctrine; if a numbered rule and this doctrine ever conflict, the doctrine wins and the rule is wrong.

Parallax operates on a single editorial doctrine: **backstage rigor is maximum, frontstage voice is confident.** Every quote, date, number, and named source is human-verified before it leaves research-audit — that work is paid in Tiger's time, not the viewer's experience. Every line of narration is then written with the confidence that the verification has already happened. "This suggests" — not "some scholars have argued that this might possibly suggest." Hedging language, "verified as of [date]" disclaimers in the voiceover, and false-consensus framing of contested claims are *frontstage failures* — they belong in the research memo, not the script.

The doctrine resolves a tension that wrecks credibility-driven channels. Maximum rigor that bleeds into the script reads as flat or evasive. Confident voice that skips backstage work reads as Jiang Xueqin — viral until the first serious critic shows up. Parallax does both: backstage discipline earns the frontstage license to be vivid.

**Bounded analogy is the wedge, not a tax.** *"This analogy is useful here, misleading there, dangerous if overextended"* is the form Parallax owns. Naming the imperfection in one sharp clause is more interesting than killing the analogy or pretending it's perfect — and it's the discipline that differentiates Parallax from civilizational-prophecy channels on one side and pure briefing channels on the other. The form is structural: setup the pattern confidently, name where it breaks in one sharp clause, return to the argument. Don't kill a strong analogy because it has a flaw; name the flaw and move on.

**Herzog's "ecstatic truth" license.** Vivid metaphor and evocative imagery are allowed — encouraged — when they serve emotional clarity, not when they strain literal accuracy. The stormy-sea shot for "technological anxiety" is fine; a fabricated quote attributed to Schelling is not. Backstage rigor protects the frontstage license; without the rigor, the license is unearned.

**Operational ownership across the pipeline:**
- **research-audit** owns backstage rigor — five lenses (Citation Existence / Source Support / Quote-Date-Number / Disagreement / Freshness), three tiers (MVP / Standard / Flagship). MVP runs on every episode.
- **script-draft** owns the bounded-analogy convention and the ecstatic-truth license. Confident frontstage voice; setup-break-return analogies; no narration of the verification process.
- **script-audit** owns frontstage voice — flag over-hedging, false-consensus framing, and any line that talks about how the claim was verified.
- **persona-eval** owns the audience-side test: did confidence land as authority or arrogance, did the bounded clause read as honesty or evasion.

Source: May 9, 2026 doctrine session, derived from §17 (Verification Architecture), §15 (White Space), §13 (Documentary Techniques) in `project/RESEARCH_LOG.md`.

---

## Pending Rules (awaiting Tiger approval)

> **Skills:** append candidate rules here using the format below. Do not write directly to domain sections.
> **Tiger:** review this section during the script-review checkpoint (~30 min session). For each candidate: approve (move to domain section, assign rule ID), modify (edit here then move), or reject (delete with a one-line note).

| # | Proposed by | Episode | Domain | Candidate rule (one line) | Evidence summary |
|---|---|---|---|---|---|
| 1 | pipeline-alignment-audit | (cross-cutting) | VIS | **Anticipatory reveals must complete BEFORE the narrator names the element** — reuse `anticipatoryStartFrame(...)` from `utils/animation.ts`; on multi-entity templates emit `_direction.syncPoints[]` positionally so each entity settles before its own word, not just the first | Economist's 150ms convention; D17 + D17.1 in `remotion-templates/POLISH.md`; 7 analytical templates extended May 16 (AnnotatedImage, ArcDiagram, BumpChart, EscalationLadder, FrameworkDiagram, HorizontalTimeline, NetworkDiagram). Compounding rule — every future multi-entity template should adopt the per-element form by default. |
| 2 | pipeline-alignment-audit | (cross-cutting) | VIS | **Pick a text-animation technique whose implicit claim matches editorial intent, not aesthetic preference** — every named technique (typewriter / tracking-in / reveal-mask / number-ticker / scramble / backspace / word-cascade + the three composite patterns) carries a register signal; defaulting to `word-cascade` when no register fits is the editorial-safe path | Eight atomic + three composite techniques shipped May 15–16; doctrine + use/avoid table in `project/TEXT_ANIMATION_REGISTER.md`; selection rules in `skills/visual-spec/SKILL.md` → "Text-animation register"; M-TEXT-ANIM lint catches vocabulary drift. Anti-pattern: `scramble` more than 1–2× per episode (drifts into spy-thriller register); `backspace` outside a bounded-analogy "actually" beat. |

**Format for new entries:**
```
| [N] | [skill name] | [slug] | [NAR/VIS/PER/RES/PROD] | [pattern in one sentence] | [brief evidence: what happened, what it suggests] |
```

---

## How to Use This Document

**If you're drafting a script:** Read Sections 1-4 before writing. These are the patterns that make scripts work and the anti-patterns that waste revision cycles.

**If you're running an audit skill:** Read the section relevant to your domain. Flag any violations as "Playbook: [rule ID]" in your report so Tiger can see which rules are being triggered.

**If you're running publish-retro:** After generating the retrospective report, check whether any finding is strong enough to become a new rule (see "When to Add a Rule" below).

**If you're running review-package:** When synthesizing audits, check whether recurring issues across audit lenses correspond to existing playbook rules. If an issue appears that *should* be a rule but isn't, append a candidate entry to the **Pending Rules** table at the top of this document. Do not write it directly into a domain section.

### When to Add a Rule

A finding becomes a rule when it has:
1. **Evidence from at least one episode** (revision log, audit report, or analytics data)
2. **A clear pattern/anti-pattern pair** (not just "this was bad" but "do this instead")
3. **Relevance beyond a single episode** (applies to the channel's content type broadly, not just one specific topic)

After 3+ episodes, rules supported by multiple episodes get tagged `[VALIDATED]`. Rules contradicted by new evidence get tagged `[RETIRED]` with an explanation.

### Rule ID Format

`[domain]-[number]`: e.g., `NAR-01` (narrative), `VIS-01` (visual), `PER-01` (persona/audience), `RES-01` (research), `PROD-01` (production/technical).

### Section Stability

Section numbers (1-6) are referenced by skills in their input instructions. New sections must be appended before the Appendix — never reorder or renumber existing sections, as this would break skill references.

---

## 1. Narrative Structure

Rules about how scripts are built — story architecture, pacing, voice, and the relationship between information and tension.

### NAR-01: Organize by tension, not by logic
**Pattern:** Every beat should tighten a question. Structure the script as a sequence of escalating tensions, not a sequence of information blocks.
**Anti-pattern:** Setup → history → present → analysis → conclusion. This is essay structure. It front-loads setup and back-loads the interesting parts — but YouTube viewers decide in 3-4 minutes whether to stay.
**Evidence:** EP01 v2→v3 restructure. v2 was logic-ordered (setup → history → present → analysis → conclusion). v3 reorganized to tension-order (paradox → denial logic → China's experience → the trap → personal stakes). The restructure solved multiple problems simultaneously: the 7-minute pacing sag, the back-loaded thesis, and the abstract ending.
**Source:** EP01 REVISION_LOG, v2→v3 section.

### NAR-02: Dissolve weak beats, don't compress them
**Pattern:** When a beat isn't working, redistribute its strongest insights into other beats where they serve as evidence within a story. The information survives — it just works harder.
**Anti-pattern:** Making a weak beat shorter. A compressed lecture is still a lecture. If a beat exists only to "deliver information," it probably shouldn't be a standalone beat.
**Evidence:** EP01 v2→v3. Old Beat 4 ("What We Thought vs. What Happened") was compressed from ~350 to ~250 words in v2 but still felt like a standalone analytical section. In v3 it was dissolved entirely — its best insights (Nvidia's $5.5B write-down, Huawei's profit surge, "controls constrained scale but not capability") were redistributed into Beats 2 and 3 where they appear as evidence inside the narrative.
**Source:** EP01 REVISION_LOG, v2→v3 lessons.

### NAR-03: Signpost phrases are a symptom, not the disease
**Pattern:** If you need "Here's the problem" or "Think about what that means" to keep the viewer oriented, the structure itself is too information-dense. Fix the structure; the signposts become unnecessary.
**Anti-pattern:** Removing signpost phrases without restructuring. The phrases exist because the audience would get lost without them — removing them without fixing the underlying density makes things worse.
**Evidence:** EP01 v2 had 6+ signpost phrases ("Here's the problem," "Here's the critical difference," "Think about what that means," etc.). All removed in v3 — but only after restructuring from logic-order to tension-order made them unnecessary.
**Source:** EP01 REVISION_LOG, v2→v3 lessons.

### NAR-04: Human moments don't have to be long
**Pattern:** A single sentence anchoring an abstraction to a specific person's experience is more effective than a paragraph of data. Find 3-4 human moments per episode — they can be one sentence each.
**Anti-pattern:** All-data, no-people scripts. If an 18-minute script has zero moments where a named human being does something specific, it's a lecture.
**Evidence:** EP01 v2→v3. v2 had one human moment (Jensen/Trump negotiation) in 18 minutes. v3 added three more: (1) Taiwanese engineers in temporary desert housing (one sentence), (2) SMIC engineers running 34 lithography passes with typewriter metaphor (two sentences), (3) Morris Chang declaring "globalization is almost dead" (one quote). None are longer than two sentences. All anchor abstractions to reality.
**Source:** EP01 REVISION_LOG, v2→v3 section.

### NAR-05: End on personal stakes, not epistemological observations
**Pattern:** The closing beat should make the viewer feel *personally implicated*. Concrete, tangible, in-their-life. "Your car has 3,000 chips" > "Nobody knows how this ends."
**Anti-pattern:** Ending on abstract philosophical contemplation. "And that uncertainty... is the real story" is a professor's closing, not a storyteller's. The uncertainty is still there — it lives inside the concrete stakes.
**Evidence:** EP01 v2→v3. v2 ended: "Nobody knows how this ends. And that uncertainty... is the real story." v3 replaced with concrete personal stakes: your car's 3,000 chips, COVID shortage as preview, app incompatibility across bifurcated ecosystems. Final line is direct address to the viewer.
**Source:** EP01 REVISION_LOG, v2→v3 section.

### NAR-06: Balance bilateral conflicts by showing internal logic, not equal airtime
**Pattern:** When covering a conflict between two sides, show each side's internal logic *on its own terms* — motivations, emotional drivers, cultural context. This creates genuine balance.
**Anti-pattern:** Underdeveloping one side. If China is only a "reactive player" responding to US actions, you've created a lecture about one side with footnotes about the other. Even if the word count is roughly equal, the analytical depth isn't.
**Evidence:** EP01 v1→v2. v1 treated China as reactive. v2 expanded China coverage by ~400 words: added 卡脖子 emotional framing, ballpoint pen parable, 举国体制 mobilization concept. The key wasn't more words — it was showing China's *internal emotional and strategic logic* rather than just its policy responses.
**Source:** EP01 REVISION_LOG, v1→v2 section.

### NAR-07: Beat 3 breathing room — max 3 stories per beat
**Pattern:** When a beat covers multiple examples or stories, limit to 3 and give each breathing room (silence around the strongest moments). The strongest beats have silence after them.
**Anti-pattern:** Packing 10+ topics into a single beat. The best moments (a striking parable, a counterintuitive fact, a whiplash reversal) can't land if they're rushed through.
**Evidence:** EP01 v2→v3. Beat 3 went from ~12 topics to 3 stories told with breathing room: SMIC's 34-pass method, the Kirin relabeling, the DeepSeek whiplash. Cut material was either moved (ASML/Korea/Japan → Beat 4) or dropped (Big Fund corruption details — interesting but not narrative).
**Source:** EP01 REVISION_LOG, v2→v3 section.

### NAR-08: Labeling your structure is essay writing
**Pattern:** Story structure should be felt, not labeled. If you find yourself writing "Parallel A" / "Parallel B" or "Case Study 1" / "Case Study 2," the framing itself is the problem.
**Anti-pattern:** Named structural sections within the narration. "The first parallel..." "The second case..." These are organizational crutches that signal essay, not story.
**Evidence:** EP01 v2→v3. The "Parallel A / Parallel B" framing for COCOM vs. export controls was cut. Instead, the oil embargo flows directly into present-day chip controls — same logic, same mistake, 80 years apart — without labeling the connection.
**Source:** EP01 REVISION_LOG, v2→v3 cuts section.

### NAR-09: Decode, don't explain — narrative posture is insider, not lecturer
**Pattern:** Frame every video as revealing a hidden structure, not explaining a known topic. The viewer should feel like a co-investigator being let in on a pattern, not a student receiving a lesson. Open with contradictions, stakes, or provocations — not context. Introduce frameworks inductively (apply first, name later) rather than deductively ("Today we'll discuss game theory").
**Anti-pattern:** "Let me explain the semiconductor situation." "To understand this, we first need to cover some background." "A fab — a fabrication plant — is where chips are physically made." These are explainer moves. They position the viewer as someone who needs to be caught up, not someone about to discover something.
**Evidence:** Jiang narrative research (April 2026). Comparative analysis of Predictive History vs. standard geopolitics channels (CaspianReport, TLDR, VisualPolitik). The core difference is posture: "here's what's actually going on" vs. "here's what happened and why." Same analytical content, completely different viewer contract. EP01 v4 opens with context-setting (what a fab is) rather than the contradiction ($165B spent, problem got worse). The content is strong; the framing undersells it.
**Source:** JIANG_NARRATIVE_RESEARCH.md, EP01 v4 analysis.

### NAR-10: Stakes in the first 30 seconds, not the last beat
**Pattern:** The viewer must feel personally implicated within the first 30 seconds. Lead with why this matters to *them*, then earn the right to explain the structure. Use a stakes-shock ("$165 billion, and it made the problem worse"), a provocation ("What if I told you…"), or a framework promise ("There's a pattern nobody's talking about").
**Anti-pattern:** Building context for 3 minutes before the viewer knows why they should care. Saving "Your Chips" (personal stakes) for Beat 5 of a 5-beat script. By minute 3-4, YouTube viewers have already decided whether to stay.
**Evidence:** Jiang narrative research — opening-hook taxonomy. His 6 verified opener types all ground stakes immediately. EP01 v4's personal-stakes content is in Beat 5 (15:30+). NAR-01 partially addresses this (tension over logic), but this rule is specifically about the *first impression*.
**Source:** JIANG_NARRATIVE_RESEARCH.md opening hooks section, YouTube retention research.

### NAR-11: Name your conceptual products
**Pattern:** Coin a memorable 2-3 word name for the core analytical insight of each episode. "The Silicon Trap" is good. Build a vocabulary of named ideas viewers can carry into the next news cycle and redeploy. Define each named concept rigorously, including where it breaks down.
**Anti-pattern:** Unnamed analysis. If the viewer can't summarize your insight in 3 words to a friend, the episode hasn't produced a portable idea. Also avoid totalizing brands that carry covert ideological payloads ("Empire of Evil," "Pax Judaica").
**Evidence:** Jiang narrative research — "named conceptual products" section. Jiang's named ideas ("Iran Trap," "Strategy Matrix," "Law of Asymmetry") function like business-book branding and are the #1 shareability driver. Parallax already does this with "The Silicon Trap" — formalize it as a rule.
**Source:** JIANG_NARRATIVE_RESEARCH.md.

### NAR-12: Checkpoint beats every 3-5 minutes
**Pattern:** Every 3-5 minutes, pause and reduce the preceding section to a 2-3 line summary. Can be visual (on-screen text), verbal ("Here's where we are"), or both. Use checkpoints to flag uncertainty as well as content ("This claim rests on the drone-cost figure; if that's off by 5x, the argument changes").
**Anti-pattern:** 18-minute analytical videos with no comprehension handholds. The viewer's working memory is limited; without periodic consolidation, earlier insights get lost as new ones arrive.
**Evidence:** Jiang narrative research — "Checkpoint Beat" technique. Recurring "Keep it simple. Checkpoint." beats every 3-5 minutes across Jiang's long-form content. Rare in geopolitics content and directly transferable.
**Source:** JIANG_NARRATIVE_RESEARCH.md, technique #8.

### NAR-13: The toxin line — honesty test, not percentage cap
**Pattern:** Historical analogies are hypothesis generators ("this resembles X — if the pattern holds, watch for Y"). Always name at least one way the analogy breaks. Use: "this resembles," "structural resonance," "an under-discussed factor," "what doesn't fit the standard frame." The test for whether analysis has crossed the toxin line is *intellectual honesty*, not a word-count ratio. Ask three questions: (1) Does the claim identify structural incentives, or does it require believing specific people coordinated in secret? (2) Is the claim falsifiable — what evidence would change your mind? (3) Would a well-informed skeptic say "I disagree but that's a fair reading" or "that's conspiratorial"? If any answer points toward conspiracy, restructure.
**Anti-pattern:** Treating analogies as conclusions ("this IS X happening again"). Naming hidden agents instead of structural incentives. Using "what they don't want you to know" or "the real reason." Making unfalsifiable totalizing claims hedged with performed humility. But note: strong analytical positions defended with evidence are *not* toxin. Saying "the export controls are structurally likely to fail because..." is analysis. Saying "they designed the controls to fail because..." is conspiracy. The line is between structural reasoning and imputed secret intent.
**Evidence:** Jiang narrative research — toxin analysis. Critics (Free Press, SCMP, TripleAmpersand) converge on the same diagnosis: the tip from analysis to conspiracy happens when structural resonance is presented as causal proof and when named hidden agents replace incentive analysis. This is the line Parallax must never cross.
**Source:** JIANG_NARRATIVE_RESEARCH.md section 6, Parallax content philosophy ("educated mysticism").

### NAR-14: Take positions — hedged analysis is not the same as neutral analysis
**Pattern:** The episode should arrive at a defensible analytical position, not split the difference between sides. "Both sides have a point" is the weakest possible conclusion. Strong positions sound like: "The structural incentives point toward X, and here's why the counterargument — while reasonable — underweights Y." Present the steelman, then explain why your reading is different. The viewer came for a perspective they can't get from a news summary.
**Anti-pattern:** Ending every analysis with "it's complicated" or "only time will tell." These are true but useless — the viewer already knew that. Also: conflating neutrality with intellectual honesty. Intellectual honesty means showing your reasoning transparently, not refusing to reason to a conclusion.
**Evidence:** Editorial rebalancing review (May 2, 2026). The pipeline had accumulated caution-oriented rules (NAR-09 through NAR-13) without counterweighting boldness. The priority is interesting, rigorous analysis — caution should serve that goal, not constrain it.
**Source:** Editorial rebalancing, May 2026.

### NAR-15: Mystery and withholding are narrative tools, not evasion
**Pattern:** Sometimes the most engaging move is to show the audience a pattern and let them sit with it before you name it. Withholding your thesis for 60-90 seconds while building the evidence creates productive tension. Opening with a question rather than a thesis can be more compelling than a thesis statement — if the question genuinely organizes the analysis. Use mystery when the payoff is insight; avoid it when the payoff is "I told you so."
**Anti-pattern:** Stating everything upfront because you're worried about being accused of manipulation. Also: withholding that goes nowhere (building mystery without a structural payoff is just vague). The test: does the withholding serve the viewer's understanding, or the creator's ego?
**Evidence:** Jiang narrative research — opening hooks, decoder posture. The most effective openers create a micro-mystery ("here's a $165 billion puzzle") that the episode then solves. This is fundamentally different from clickbait, which withholds to extract clicks without delivering insight.
**Source:** JIANG_NARRATIVE_RESEARCH.md, editorial rebalancing May 2026.

### NAR-16: Your cross-cultural identity is an analytical asset, not a liability
**Pattern:** Tiger's native fluency in both Chinese and Western intellectual traditions is the channel's hardest-to-copy differentiator. Use it. Introduce Chinese strategic frameworks (Shi/势, Tianxia, Legalist thought) as genuine analytical tools alongside Western ones. Present both traditions' internal logic. The Translator identity direction exists because this is genuinely rare and valuable — lean into it when the topic calls for it.
**Anti-pattern:** Avoiding all identity-adjacent analysis out of fear it "becomes the story." The test is whether identity *serves* the analysis or *replaces* it. "Here's how the concept of 势 (shi) reveals something about chip supply chains that balance-of-power theory misses" is analysis. "As a Chinese-American, I feel torn about..." is memoir. The first is the channel's superpower; the second is a different show.
**Evidence:** Content Identity Direction 4 (The Translator) — identified as the strongest moat and most differentiated position. Competitive gap analysis confirms no credible English-language channel occupies this space. Editorial rebalancing found that negative filter 2 ("identity never becomes the story") was overcorrecting against this strength.
**Source:** CONTENT_IDENTITY.md Direction 4, editorial rebalancing May 2026.

### NAR-17: Every episode should make a forward-looking claim
**Pattern:** The episode should not end at "here's what happened and here's the pattern." Push into "if this pattern holds, here's what to watch for." This can be a named scenario with a probability, a single falsifiable prediction with a timeframe, or a set of watch signals the audience can track. The form is decided in the angle memo's speculation budget. The prediction gets registered in `data/concepts.json` as a prediction-type concept — this creates the infrastructure for future "Was I Right?" episodes (Oracle identity direction).
**Anti-pattern:** Ending every episode with "only time will tell" or "the situation remains fluid." These are true but useless — the viewer already knew that. Also: making predictions without falsification criteria. If you can't name what would prove you wrong, you're not predicting — you're performing confidence.
**Evidence:** Oracle identity direction in CONTENT_IDENTITY.md. Competitive analysis: channels that make falsifiable predictions and track their record (Zeihan's hit rate, Good Judgment Project's calibration) build deeper trust than channels that only analyze the past. The prediction tracking infrastructure (concept registry + lookup CLI) was built to operationalize this.
**Source:** CONTENT_IDENTITY.md Direction 2, editorial rebalancing May 2026.

### NAR-18: Scenario analysis beats hedging
**Pattern:** When the analysis reveals genuine uncertainty, present 2-3 named scenarios with rough probability estimates rather than hedging. "There are three ways this plays out: the Murano Scenario (40%), the Boomerang Scenario (35%), and the wildcard (25%)" is more interesting, more honest, and more useful than "it's complicated." Each scenario should be structurally grounded — it should follow from the episode's cross-domain connections, not be invented from thin air. Name the scenarios memorably (they're conceptual products too).
**Anti-pattern:** "It could go either way." "Both outcomes are possible." "The situation is complex." These are hedges disguised as analysis. If you genuinely can't distinguish scenarios, you haven't analyzed deeply enough. Also: scenarios without structural rationale. Each scenario should connect back to a specific cross-domain parallel or structural mechanism from the episode.
**Evidence:** Superforecasting research (Tetlock) shows that people who think in scenarios and assign probabilities outperform those who think in narratives. Named scenarios with probabilities are simultaneously more engaging (narrative) and more rigorous (quantified uncertainty). The prediction registry makes these trackable.
**Source:** CONTENT_IDENTITY.md Direction 2, Tetlock superforecasting framework, editorial rebalancing May 2026.

### NAR-19: "What would change my mind" is the strongest credibility signal
**Pattern:** Every episode should include at least one moment where Tiger names the strongest evidence against the thesis. "Here's what would make me wrong: if SMIC demonstrates consistent sub-7nm yields at scale by Q4 2027, the entire export control thesis collapses." This is the ultimate decoder move — it shows the viewer you're reasoning transparently, not advocating for a conclusion. Place it in the scenario/prediction beat or the closing.
**Anti-pattern:** Presenting counterarguments without genuinely engaging them. "Some people say X, but actually Y" is not intellectual honesty — it's a rhetorical move. The test: would a smart advocate for the opposing view feel their argument was represented fairly? Also: never naming what would change your mind, which signals you've already decided and are building the case backward.
**Evidence:** Bayesian epistemology (updating beliefs on evidence) is one of the channel's three philosophical pillars. Naming falsification criteria operationalizes it. Competitive analysis: this is extremely rare in geopolitics content and would be a strong differentiator.
**Source:** Content philosophy ("educated mysticism"), Bayesian updating framework, editorial rebalancing May 2026.

---

## 2. Visual Production

Rules about visual pacing, tool assignment, mode balance, and the relationship between what's seen and what's heard.

### VIS-01: MG 40-55%, Footage 15-25% (archival-weighted), AI-gen 15-30%, Layered 5-10%
**Pattern:** The visual mode breakdown should stay within these ranges post-May 4 calibration. Three content types fill the episode: Remotion MG (code-locked analytical, 40-55%) carries the intellectual argument; AI-generated content (Recraft constructivist illustrations 5-15% atmospheric + AI-GEN grounded scenes 5-15%, total 15-30%) carries mood and presence in unsourceable spaces; FOOTAGE (15-25%, archival-weighted post-calibration) carries documentary credibility for named figures, real events, and software interfaces. LAYERED (5-10%) is a composition pattern combining MG + FOOTAGE for hero data-over-real-world moments. Transitions account for the remaining 5-10%.
**Anti-pattern:** Generic stock footage carrying the "real-world grounding" function broadly. Pre-migration this was VIS-01's accepted default (footage 30-40%); post-migration generic stock should be displaced by AI-generated atmospheric backdrops or grounded scenes wherever named figures/events aren't being depicted. Also: all-MG scripts (data visualization after data visualization), photoreal mannequin scenes (deprecated post-migration in favor of constructivist figurative), or footage-dominant scripts that underserve the analytical content.
**Evidence:** Research into top analytical channels (May 2, 2026): Wendover, Vox, PolyMatter are MG-dominant (50-60% MG). Post-May 4 architectural maturation: AI-generated constructivist content displaces generic stock with brand-distinctive output (Soviet 1972, Silicon Valley v2, SMIC re-test all validated). The displacement is the intended consequence of the AI-GEN migration; FOOTAGE target shifts down to reflect archival-only as the non-substitutable use. EP01 v4 used pre-migration ratios; post-migration episodes should land closer to the new targets.
**Source:** VISUAL_LANGUAGE.md → "Three Content Types" (May 4 update), D37, EP01 v4 production analysis, EP02 stress test, May 4 AI-GEN migration validation, competitive research.

### VIS-02: Max 3 consecutive MG entries without a footage break
**Pattern:** After 3 motion graphics in a row, cut to footage for breathing room. The viewer's analytical attention needs a reset.
**Anti-pattern:** 4+ consecutive charts, maps, or diagrams. Even if each is individually excellent, the cumulative effect is fatigue.
**Evidence:** VISUAL_LANGUAGE.md pacing rules. Reinforced by persona-eval: Marcus (algorithm discovery) treats visual monotony as exit trigger.
**Source:** VISUAL_LANGUAGE.md, persona-eval skill.

### VIS-03: Don't write footage specs for things cameras can't capture
**Pattern:** Before writing a `[FOOTAGE:]` spec, ask: "Could a camera physically capture this?" If the answer is an abstract concept, a hypothetical scenario, or an internal process — use `[MG:]` instead.
**Anti-pattern:** `[FOOTAGE:] "supply chain interdependence"` or `[FOOTAGE:] "strategic calculus"`. These concepts don't exist as things you can film.
**Evidence:** FOOTAGE_SOURCING.md sourcability tiers. Abstract concepts are "Unsourceable" tier.
**Source:** FOOTAGE_SOURCING.md, visual-concept skill Lens 2.

### VIS-04: Claude SVG for geometric/diagrammatic, never for organic
**Pattern:** Claude SVG excels at information-rich geometric visuals: network diagrams, flow charts, framework comparisons, data callouts. Lean into these strengths.
**Anti-pattern:** Asking Claude SVG for organic illustration (people, landscapes, emotional scenes). Spatial reasoning without visual feedback causes consistent failures (misaligned bezier paths, disconnected endpoints).
**Evidence:** Session 10 testing. Engraved hand illustration — rejected. Sankey flow diagram — approved. Curved bezier paths consistently misaligned; straight lines dramatically more reliable.
**Source:** D33, D35, Session 10 insights.

### VIS-05: Straight lines over curves in SVG
**Pattern:** All flow/connection lines in Claude-generated SVG should be straight. If a direction change is needed, use a single right-angle elbow.
**Anti-pattern:** Bezier curves for supply chain flows, trade routes, or connection diagrams. Endpoints consistently misalign with node edges.
**Evidence:** EP01 supply chain illustration — 4 iterations. v1 (curved lines — failed), v3 (curves still disconnecting), v4 (straight lines — clean).
**Source:** D35, Session 10.

### VIS-06: Break synchronization at turning points — use visual-first or counterpoint
**Pattern:** At key turning points (thesis complications, surprise reveals, emotional pivots), break the default synchronized timing. Either let the visual arrive 3-5 seconds before narration explains it (visual-first — creates micro-mystery) or show something that tensions with the narration (counterpoint — creates productive unease). Plan 2-3 visual-first and 1-2 counterpoint moments per episode in the angle memo's visual arc.
**Anti-pattern:** Every visual illustrating the narration in lockstep for the entire episode. Synchronized mode is the correct default (~70% of runtime), but an episode with zero timing breaks feels like a slideshow with voiceover.
**Evidence:** Research into video essayist techniques (Johnny Harris visual-first maps, Adam Curtis archival counterpoint, Errol Morris visual irony). The highest-engagement moments in successful video essays consistently break visual-audio synchronization.
**Source:** Visual-narrative integration research, April 30, 2026.

### VIS-07: One visual motif per episode, introduced early, evolved across beats
**Pattern:** Each episode's named concept should have a visual motif — a simple geometric/diagrammatic element that appears in the first 2 minutes and returns at least twice, evolving to track the emotional arc. The motif gives the concept a visual identity that accumulates meaning.
**Anti-pattern:** Introducing a cool visual element once and never returning to it. Or having no recurring visual thread — each beat's visuals are isolated from every other beat's.
**Evidence:** Kurzgesagt recurring elements, CaspianReport evolving map styles, The Pudding's transforming data visualizations. Recurring visual elements create memory and tracking engagement.
**Source:** Visual-narrative integration research, April 30, 2026.

### VIS-08: Radio edit test before visual planning — narration must stand alone
**Pattern:** After drafting the script, read the narration column as a podcast script (no visuals). If the argument is clear, transitions work, and pacing holds, the visual layer can be additive. If not, fix the narration first.
**Anti-pattern:** Designing visuals to compensate for weak narration. "This transition is confusing but the map will make it clear" means the transition is broken — fix the words.
**Evidence:** Documentary radio edit workflow (industry standard practice). Ensures the visual layer deepens rather than props up.
**Source:** Visual-narrative integration research, April 30, 2026.

### VIS-09: Three registers present, each serving its cognitive function
**Pattern:** Every episode 8+ minutes should use all three visual registers: Analytical (Remotion templates — where the viewer reads data), Atmospheric (constructivist backgrounds — where the viewer feels mood), and Grounding (constructivist figurative scenes — where the viewer inhabits a space). Registers 2 and 3 share the same constructivist visual vocabulary post-May 4, 2026 — they differ in role (background vs. foreground figurative), not in aesthetic. All three pass through the same brand treatment ramps (palette.json), giving them shared tonal DNA. Target proportions: MG 40-55%, FOOTAGE 25-40%, ILLUST 5-15% (Register 2 atmospheric backgrounds), AI-GEN 5-15% (Register 3 grounded scenes). Max 3 consecutive same-register entries without a break. Transition grammar between registers: Analytical↔Grounding = color-wash, Grounding↔Atmospheric = dissolve (now a soft transition since they share visual language), Atmospheric→Analytical = iris. Hard cuts within the constructivist registers (Grounding↔Grounding, Atmospheric↔Atmospheric, or Grounding↔Atmospheric) are now valid since they share aesthetic. Texture hierarchy signals function: Registers 2+3 get grain+vignette (signaling "the illustrated world"), Register 1 stays clean (signaling "the analysis").
**Anti-pattern:** All-MG episodes (pure analytical slideshow), or atmospheric-dominant sequences (2+ foreground ILLUST in a row — viewer fatigue from sustained mood without data resolution). Also: using atmospheric backgrounds for data-carrying visuals (anything the viewer needs to *read* belongs in MG), or using AI-GEN grounded scenes for spaces that stock footage can adequately cover (grounded is for genuinely unsourceable physical spaces only). Photorealism as a primary aesthetic in either Register 2 or Register 3 is now off-pattern — the channel is unified constructivist post-May 4.
**Evidence:** Three-register visual system design (May 3, 2026), refined May 4 with the constructivist unification. May 4 testing on intimate-domestic test case (Beijing apartment) demonstrated that constructivist DNA holds at conversational human scale — the aesthetic has range from monumentalist propaganda-poster to eye-level intimate, controlled by the per-scene `realism` parameter. The unified approach replaces the prior photoreal-mannequin Register 3 convention, which had become a category marker for AI-geopolitics-explainer channels broadly.
**Source:** VISUAL_LANGUAGE.md "Three Visual Registers" section (updated May 4), AI_VIDEO_PIPELINE.md (rewrote "Stylized Realism" → "Stylized Constructivism"), May 4 register migration.

### VIS-10: Treatment ramp must pair sensibly with register — atmospheric + editorial is forbidden
**Pattern:** The `treatment` field on a shot list entry (`standard` / `conflict` / `editorial`) is not independent of `register`. Each register has a default ramp and a small set of valid alternates; mismatched pairings either undercut the register's editorial purpose or destroy its palette. Use the matrix:

| Register | standard | conflict | editorial |
|---|---|---|---|
| **atmospheric** | ✓ default — civilizational mood, industrial ambition | ✓ rare (max 1-2/ep) — high-tension constructivist | ✗ AVOID — desaturates the constructivist palette into mush |
| **grounding** | ✓ default — present-day reconstruction (fab interiors, command centers) | ✓ adversarial reconstruction (military, sanctions, contested) | ✓ historical reconstruction (pre-1980s — embargo signings, Cold War) |
| **analytical** | ✓ omit or `standard` — code-clean default | ✗ rarely meaningful — analytical doesn't carry tonal mood | ✗ rarely meaningful |

The render-qa skill validates this matrix per shot before assembly; visual-spec should pre-validate it when emitting shot lists. Atmospheric + editorial is the most common error mode — the editorial ramp is calibrated for archival/desaturated grounding scenes, and applying it to constructivist illustration kills the saturated umber/amber/rust palette the register depends on.

**Anti-pattern:** Letting `treatment` default to `standard` everywhere without thinking about register pairing. Also: assuming the LUT can rescue a mismatched pairing — it can't. The treatment ramp is a duotone remap, not a stylistic translator. Atmospheric content with editorial treatment doesn't become "softer atmospheric"; it becomes muddy.

**Evidence:** Three-register implementation work (May 4, 2026). The treatment field and register field were originally independent in the shot-list schema. Walking through the 9-cell pairing matrix surfaced three forbidden combinations and three rare-but-valid ones; the rest are defaults. Without this rule, shot lists drift toward `treatment: standard` everywhere, which works for grounding but flattens grounding × historical (should be editorial) and grounding × adversarial (should be conflict) into the same tonal register — destroying the visual differentiation those treatments were designed to carry.

**Source:** PROMPT_PREAMBLES.md (two-stage brand unification), `data/shot-list.schema.json` (where the fields live), `tools/brand-treatment/palette.json` (where the ramps are defined), May 2026 register integration work.

### VIS-11: Illustration style constant, palette and composition adapt per cultural context
**Pattern:** The channel's visual identity lives in the **illustration style** (planar figures with 4-5 color-blocked face planes drawing on Rodchenko's 1924 portrait series and Lissitzky's Self-Portrait, color-blocked forms, no soft shading, no continuous skin tonality, no rendered facial features) and in the **palette range** (palette.json's umber/walnut/gold/rust/bone/paper — same colors available everywhere, no new palettes introduced per scene). Cultural specificity is achieved by varying which **subset of the palette gets emphasized** and which **compositional grammar** applies, both encoded in the per-scene `text_treatment` field. Soviet/Russian content uses full saturated revolutionary palette (rust + gold dominant) with diagonal monumentalist composition (Rodchenko / Klutsis intensity). American mid-century / contemporary tech content uses the softer subset (walnut + umber + gold + bone, rust as sparing accent only) with balanced asymmetric editorial layouts (Saul Bass / Push Pin / Charley Harper restraint). Chinese state content uses Chinese vermillion (lacquer-influenced, distinct from Soviet crimson) with frontal-vertical composition. Chinese traditional / classical content uses ink-wash dominance with sparse red seal accents only and literati restraint. Japanese Showa-era content minimizes to black/red/cream (2-3 colors total) with vertical orientation. Same constructivist DNA throughout; culturally responsive emphasis per scene.
**Anti-pattern:** Treating uniform palette dominance as the channel's brand identity. This was the May 4 v1 SV failure — the Soviet-rust palette emphasis baked into the BASE preamble meant a 2026 Silicon Valley AI startup scene visually echoed Soviet propaganda regardless of the English Modernist typography on the wall. The viewer's eye reads color associations before it reads typography, so a uniform Soviet palette across all grounded scenes makes every scene feel Soviet whatever the content. Also: introducing colors outside palette.json — every cultural context must work within the brand range; new palettes break tonal coherence across registers.
**Evidence:** May 4, 2026 Silicon Valley re-test. v1 (uniform Soviet palette emphasis from base preamble) produced a 2026 SV office that read as Soviet five-year-plan poster despite English typography. v2 (English Modernist palette emphasis: softer walnut/umber/gold dominance, rust as sparing accent, balanced asymmetric composition) produced a recognizable Saul Bass / Push Pin editorial illustration of a Bay Area startup — unmistakably Parallax-coded but unmistakably American. The same architectural fix — typography blocks carrying palette + compositional emphasis — applies to all cultural contexts (Chinese vermillion vs. Russian crimson, Japanese Showa minimalism vs. Soviet industrial saturation, etc.).
**Source:** May 4 SV re-test, `tools/recraft/recraft.py` TYPOGRAPHY_BLOCKS architectural extension, TYPOGRAPHY_TRADITIONS.md per-tradition palette/compositional emphasis sections, PROMPT_PREAMBLES.md Block 4 description.

---

## 3. Persona & Audience

Rules about serving the five target personas and managing the tension between their needs.

### PER-01: Wei requires visual balance, not just narrative balance
**Pattern:** If every shot of China uses conflict treatment (ink → rust) while US shots use standard treatment, the visual layer says "China = danger" even if the narration is balanced. Alternate treatments or use standard for both.
**Anti-pattern:** Unconscious visual threat-coding. Applying conflict treatment to one side of a bilateral story and standard to the other.
**Evidence:** Persona-eval skill definition. Wei (Chinese diaspora viewer) is "hypersensitive to how China is visually coded."
**Source:** persona-eval SKILL.md, Wei persona definition.

### PER-02: Marcus needs visual variety every 15-20 seconds
**Pattern:** For algorithm-discovery viewers (the largest potential audience), the visual type should change every 15-20 seconds — map, then footage, then chart, then typography. Visual monotony is the #1 exit trigger.
**Anti-pattern:** Three consecutive stock footage segments. Or three consecutive data charts. Even if content is strong, visual sameness reads as "low production quality" to this persona.
**Evidence:** Persona-eval skill definition. Marcus is "the persona most affected by visual quality."
**Source:** persona-eval SKILL.md, Marcus persona definition.

### PER-03: Sofia needs framework diagrams held 12+ seconds
**Pattern:** When a FrameworkDiagram or conceptual visual carries real intellectual weight, hold it on screen for 12+ seconds. Fill the time with narration that makes the diagram richer, not repetitive.
**Anti-pattern:** Flashing a complex framework for 4-6 seconds. Sofia mentally screenshots these — if they're gone before she's absorbed them, the visual layer underperformed for her.
**Evidence:** Persona-eval skill definition. "She needs these visuals to hold on screen long enough to absorb (12+ seconds for a complex diagram). If a deep framework visual flashes by in 4 seconds, it feels wasted."
**Source:** persona-eval SKILL.md, Sofia persona definition.
**Status:** Hypothesis — needs validation from EP01 analytics (publish-retro).

### PER-04: James scrutinizes data accuracy — source attribution builds trust
**Pattern:** Data visualizations should include source attribution on screen. Bar proportions must match stated numbers exactly. If a DataChart says "78% market share," the bar must represent exactly 78%.
**Anti-pattern:** Data charts without source attribution. Approximate bar heights that don't match narrated numbers. Missing units or decimal places on axes.
**Evidence:** Persona-eval skill definition. James (tech insider) "instantly turned off by inaccurate charts or misleading comparisons. Source attribution text on data visuals builds trust; its absence erodes it."
**Source:** persona-eval SKILL.md, James persona definition.

---

## 4. Research & Brief Quality

Rules about what makes a research brief script-ready and what causes downstream problems.

### RES-01: Missing counterarguments cascade into script problems
**Pattern:** The brief must include strong counterarguments to the episode's thesis. If these are missing, the script either becomes one-sided (fails PER-01/NAR-06) or the scripter invents unverified counterarguments ({NEW} claims).
**Anti-pattern:** A brief that only argues for the thesis without presenting the strongest opposing case.
**Evidence:** research-audit skill design. Without counterarguments, script-audit catches balance issues, but by then the script needs restructuring rather than minor edits.
**Source:** research-audit SKILL.md, D30.

### RES-02: Unverified load-bearing claims are the most expensive failure mode
**Pattern:** Every claim that anchors a key beat or supports the episode thesis must be verified in the brief's claims table. Catching a wrong number in the brief costs 2 minutes; catching it in a rendered DataChart costs an hour.
**Anti-pattern:** Marking claims as "likely correct" and hoping script-audit catches them. Script-audit should verify {⚠️} and {NEW} claims, but the brief should minimize how many need checking.
**Evidence:** research-audit skill design, claim verification tag system in SCRIPT_FORMAT.md.
**Source:** D30, SCRIPT_FORMAT.md claim verification section.

### RES-03: Viability check before committing research time
**Pattern:** Before running Deep Research (~30 min), write a 5-question viability brief: structural resonance, named historical parallel, decoder framing, quick rubric gut check, angle gap. If you can't fill this page without handwaving, the topic stays in incubation.
**Anti-pattern:** Going straight from "interesting idea" to a full Deep Research session. Some topics fail at research-audit because the historical depth was never there — the viability check catches this in 5 minutes instead of 30+.
**Evidence:** Documentary production "treatment" workflow (viability gate before committing production resources). EP01 went through 4 script versions partly because narrative decisions were discovered late; earlier viability testing would surface structural weaknesses sooner.
**Source:** Visual-narrative + editorial pipeline research, May 1, 2026.

### RES-04: Multi-pass research for knowledge density — don't rely on a single sweep
**Pattern:** Structure Deep Research as three passes: (1) foundation sweep (the current approach), (2) targeted cross-domain connection hunt using the bisociation method (list core structural concepts, then deliberately search across adjacent civilizations and domains), (3) verification and depth on the strongest 2-3 connections. The knowledge density requirement (4-5 surprising connections) demands this.
**Anti-pattern:** Running one big Deep Research query and hoping it surfaces genuinely surprising cross-domain connections. A single pass finds the obvious parallels; the surprising ones (Venice's Murano glass → TSMC) require deliberate cross-domain searching.
**Evidence:** Research into bisociation methodology (Koestler) and cross-domain synthesis practices. The knowledge density requirement added in NAR-09/Jiang research demands connections that won't surface from a broad sweep alone.
**Source:** Editorial pipeline research, May 1, 2026.

### RES-05: Competitive landscape check before research — find the angle gap
**Pattern:** Before committing to a topic, spend 10 minutes checking what exists on YouTube: search the topic, watch top 3-5 video intros, scan comment sections for repeated questions. The angle gap is what Parallax says that nobody else is saying. If you can't state the gap in one sentence, the topic needs a different angle.
**Anti-pattern:** Researching and scripting a topic without checking whether the exact same angle has already been covered well. The goal isn't to avoid covered topics — it's to ensure the Parallax angle (cross-domain connections, decoder framing, structural resonance) is genuinely differentiated.
**Evidence:** Competitive intelligence practices from successful video essayists. Comment sections on competitor videos are direct demand signals for underserved angles.
**Source:** Editorial pipeline research, May 1, 2026.

---

## 5. Production & Technical

Rules about the Remotion pipeline, asset sourcing, and production workflow.

### PROD-01: CJK font failures are silent and catastrophic
**Pattern:** Always verify Noto Sans SC renders correctly before full render. Chinese text silently becomes tofu boxes (□□□) if the font isn't available on the render system.
**Anti-pattern:** Assuming fonts are installed because they worked last time. Font availability can change between systems, Docker containers, or CI environments.
**Evidence:** render-qa skill design, LESSONS.md.
**Source:** render-qa SKILL.md, LESSONS.md.

### PROD-02: Maps require network access — plan for offline rendering
**Pattern:** ChoroplethMap and RouteAnimation load TopoJSON and Mapbox tiles via network. If rendering offline (CI/CD, isolated machine), maps fail silently (blank output).
**Anti-pattern:** Rendering in an offline environment without pre-cached tiles.
**Evidence:** LESSONS.md, render-qa skill design.
**Source:** LESSONS.md, render-qa SKILL.md.

### PROD-03: Timing model — narration is the clock, not visuals
**Pattern:** Visual segments accompany narration (simultaneous), they don't follow it (sequential). Duration estimates should be based on narration word count at ~150 WPM.
**Anti-pattern:** Summing visual durations to estimate episode length. This double-counts time where narration and visuals overlap, producing estimates at ~50-60% of actual.
**Evidence:** EP01 assembly manifest. First implementation had 8.9 min (summing visuals); corrected to 13.1 min (narration as clock).
**Source:** Session 9 insights, D32.

### PROD-05: Geopolitics demonetization-framing check on every episode that touches contemporary conflict
**Pattern:** Before publishing any episode that engages with named ongoing wars, terrorism, sanctions, or active geopolitical crises, run a four-point trigger check on the title, thumbnail, description first-150-characters, and Checks questionnaire. The trigger words to avoid in title and thumbnail text: *war, massacre, genocide, killed, attack, bombing, atrocity*, plus any explicitly graphic conflict imagery (bodies, explosions, weapons aimed, visible casualties). Replace with the structural-framing register (collapse, brittleness, succession, overstretch, sclerosis) per the title rule. The constructivist visual aesthetic does most of the thumbnail work naturally; the check is whether a specific episode's framing drifted toward sensationalism.
**Anti-pattern:** Treating "yellow icon" demonetization as a mystery to react to after publish. The triggers are documented; the cost of not running the framing check is direct revenue loss per affected episode plus the 7-day appeal cycle.
**Evidence:** YouTube's documented advertiser-friendly content guidelines plus post-Ukraine/Gaza policy tightening (2023–2026). The May 2026 operational risk management report (`project/research/2026-05-operational-risk-management.md`) catalogs the trigger word and imagery patterns; YouTube's policy explicitly demonetizes content that *"exploits, dismisses, or condones"* active conflicts, and even neutrally-framed coverage of Ukraine and Gaza has been limited. Disputed Content ID claims resolve in the creator's favor at ~62% — appeals work but cost a week. Framing prevention is cheaper. Compatible with and reinforced by the existing title rule (PROJECT_VISION → "answer what structure am I revealing, not what topic am I covering"); episodes named for structures pass the check naturally.
**Source:** `project/research/2026-05-operational-risk-management.md` Monetization & Demonetization section, RESEARCH_LOG §21, `episodes/PRE_LAUNCH_CHECKLIST.md` Section 5.

### PROD-06: Don't iterate titles or thumbnails before ~2–4K impressions
**Pattern:** When a video is published, do not retitle or rethumb in the first 24–48 hours regardless of CTR signal. Wait until the video has accumulated at least ~2–4K impressions before launching a YouTube Test & Compare cycle or making a manual change. Below that threshold, the signal-to-noise ratio is too low — early CTR is dominated by the test-audience composition, not by the title's intrinsic effectiveness. Once ~2–4K impressions accumulate, run Test & Compare for the documented test duration (1–2 weeks) and let it pick the winner by watch-time share rather than overriding mid-test.
**Anti-pattern:** Panic-iterating titles after 100–500 views because CTR looks low. The CTR figure on a small-channel video at 200 views is essentially noise; changing the title or thumbnail at that volume confuses the algorithm without producing actionable signal, and resets whatever first-impression learning the video had accumulated.
**Evidence:** TubeAnalytics 2026 algorithm analysis (cited in `project/research/2026-05-launch-operations.md`): the new-channel test audience runs at 100–500 impressions, and reliable A/B testing requires roughly ~3–4K impressions per variant before producing a defensible winner. YouTube's Test & Compare feature is documented to take days to ~2 weeks to conclude depending on impression volume. The implication: meaningful iteration is a week-2-to-week-3 activity, not a day-1 reaction.
**Source:** `project/research/2026-05-launch-operations.md` Titles & Thumbnails section, RESEARCH_LOG §18, `episodes/PRE_LAUNCH_CHECKLIST.md` Section 4.

---

## 6. Analytics & Performance

*This section is populated by publish-retro after episodes go live. No published episodes yet — hypotheses and candidate rules below await validation.*

### Candidate Rules from EP02 Stress Test

These emerged from the EP02 end-to-end pipeline stress test (May 2, 2026). All three audit skills (visual-concept, script-audit, persona-eval) converged on the same structural issues, giving high confidence. Awaiting Tiger's approval to promote to active rules.

#### CANDIDATE NAR-14: Cap detailed cross-domain parallels at 3 per episode
**Pattern:** Develop at most 3 cross-domain connections as full parallels (each with setup, resonance, and named breakage — typically 150-250 words). Additional connections should appear as brief evidence callouts (one sentence, e.g., "The same defection logic shows up in Atlantic fishing quotas").
**Anti-pattern:** Four or more fully developed parallels in a single episode. Each detailed parallel requires 4-5 MG compositions and 150-250 words. Beyond three, they compress pacing, create visual monotony (consecutive MG blocks), and fatigue the viewer — even when individually excellent.
**Evidence:** EP02 script-v1 had 4 detailed parallels in Beat 5 (Venice, COCOM, Atlantic fisheries, Cold War). All three audits independently flagged this: visual-concept found 6 consecutive MGs, script-audit found pacing compression, persona-eval found Marcus fading. Review-package elevated it as the #1 priority fix.
**Source:** EP02 pipeline-retrospective.md, review-package.md. Rule already added to script-draft SKILL.md.

#### CANDIDATE VIS-09: Framework-heavy formats need deliberate footage anchoring
**Pattern:** The Philosopher's Lens format (framework-primary, geopolitics-illustrative) is inherently MG-heavy because frameworks are abstract. To stay within VIS-01 targets (MG 40-55%, FOOTAGE 30-40%), deliberately plan footage anchoring: open each beat with establishing footage before the framework analysis, and insert footage breathing room between framework diagrams.
**Anti-pattern:** Letting framework episodes drift to 35%+ MG by default. The Philosopher's Lens format creates structural tension with visual pacing rules — every framework needs a diagram, and the format has more frameworks than other formats. Without deliberate planning, MG density accumulates.
**Evidence:** EP02 (Philosopher's Lens format) hit MG 33% at aggregate level — within tolerance but above the 30% soft cap. Beats 3-5 exceeded the max-3 consecutive MG rule. The format itself, not the script quality, drives the MG pressure.
**Source:** EP02 visual-concept-audit.md, pipeline-retrospective.md.

#### CANDIDATE PROD-04: Convergent audit findings are high-confidence signals
**Pattern:** When visual-concept, script-audit, and persona-eval independently flag the same issue through different analytical paths, treat it as a confirmed problem — not a maybe. Review-package should elevate convergent findings to highest priority regardless of individual severity ratings.
**Anti-pattern:** Treating each audit's findings independently and averaging severity. If all three audits flag Beat 4-5 rhythm (visual-concept via MG density, script-audit via pacing compression, persona-eval via Marcus fading), that's not three minor issues — it's one major issue seen from three angles.
**Evidence:** EP02 stress test. Beat 4-5 MG monotony was flagged by all three audits through completely different lenses. Review-package correctly elevated it to #1 priority. The parallel audit design produces this convergent signal by construction.
**Source:** EP02 pipeline-retrospective.md Finding 2.

### Hypotheses awaiting EP01 validation

These are not active rules — they are testable predictions derived from persona definitions and EP01 production experience. publish-retro should validate or reject each after EP01 analytics are available. If validated, promote to an active rule with a PERF-[XX] ID.

- **Hypothesis A:** FrameworkDiagrams held 12+ seconds will outperform <6 second holds in retention. Derived from: PER-03.
- **Hypothesis B:** Visual type changes every 15-20 seconds will correlate with higher retention for algorithm-discovery viewers. Derived from: PER-02.
- **Hypothesis C:** The chess/go metaphor is a channel signature — game-theory framing will consistently resonate across all 5 personas. Derived from: EP01 REVISION_LOG (chess vs. go was the structural spine that worked from v1).

---

## Appendix: Rule Lifecycle

```
CANDIDATE → ACTIVE → VALIDATED → (or) RETIRED

CANDIDATE:  Flagged during production (review-package or Tiger).
            Has evidence from 1 episode. Not yet confirmed by analytics.

ACTIVE:     Accepted into the playbook. Skills reference it.
            Has evidence from 1-2 episodes.

VALIDATED:  Confirmed by analytics data across 3+ episodes.
            publish-retro tags rules as validated when data supports them.

RETIRED:    Contradicted by new evidence. Kept in the doc (struck through)
            with a note about what replaced it and why.
```

---

## Revision History

| Date | Change | Source |
|------|--------|--------|
| April 27, 2026 | Initial playbook created. 8 NAR rules, 5 VIS rules, 4 PER rules, 2 RES rules, 3 PROD rules seeded from EP01 REVISION_LOG and skill designs. | EP01 REVISION_LOG, skill definitions, DECISIONS.md |
| April 30, 2026 | Added NAR-09 through NAR-13: narrative posture (insider/decoder), stakes-first opens, named conceptual products, checkpoint beats, toxin line. All derived from Jiang narrative research. | JIANG_NARRATIVE_RESEARCH.md |
| April 30, 2026 | Pipeline structural update: added script angle memo step (Stage 4), title/hook workshop (post-review), script-audit expanded to 8 lenses (Lens 7: decoder posture, Lens 8: connection density), review-package now generates cold-open alternatives. | Pipeline gap analysis session |
| May 1, 2026 | Added VIS-06 through VIS-08: visual-narrative timing (visual-first + counterpoint), visual motifs, radio edit test. Added visual arc to angle memo (item 9). Updated VISUAL_LANGUAGE.md with timing framework section. Added radio edit checkpoint to pipeline Stage 6. | Visual-narrative integration research |
| May 1, 2026 | Added RES-03 through RES-05: viability check before research, multi-pass research for knowledge density, competitive landscape check. Restructured IDEAS.md into topic lifecycle funnel. Added signal monitoring, viability check (Stage 2), and sequencing intelligence to PRODUCTION_PIPELINE.md. Updated RESEARCH_WORKFLOW.md with 3-pass research, cross-domain connection hunt prompt, and signal monitoring workflow. Pipeline now has 10 stages. | Editorial pipeline research |
| May 2, 2026 | Added 3 CANDIDATE rules from EP02 stress test: NAR-14 (cross-domain parallel cap at 3), VIS-09 (framework-heavy format footage anchoring), PROD-04 (convergent audit signals). All supported by convergent findings across 3 audit skills. Awaiting Tiger approval. | EP02 pipeline-retrospective.md |
| May 4, 2026 | Added VIS-10: treatment-ramp × register pairing matrix. Forbids atmospheric+editorial; documents 3 valid grounding × treatment combinations and 1 rare-but-valid atmospheric+conflict. Closes the second cosmetic gap from the register integration audit. Note: existing playbook has a numbering collision — both an active VIS-09 ("three registers present") and a CANDIDATE VIS-09 ("framework-heavy formats need footage anchoring"). The candidate should be renumbered VIS-11 if/when promoted. | Register integration gap closure, May 2026 |
| May 4, 2026 | Updated VIS-09 to reflect the unified constructivist aesthetic: Registers 2 and 3 now share the same Rodchenko/Heartfield/Masereel visual vocabulary, differing only in role (background vs. foreground figurative). Replaces the prior split (atmospheric=constructivist illustration, grounding=photoreal mannequin). Hard cuts now valid within the constructivist registers since they share aesthetic. Aesthetic validated on intimate-domestic test case. | May 4 register migration (mannequin→constructivist) |
| May 4, 2026 | Added VIS-11: illustration style constant, palette and composition adapt per cultural context. Captures the architectural insight from the May 4 SV re-test — brand identity lives in illustration style + palette range, cultural specificity in palette/compositional emphasis per scene. Closes the architectural validation loop: Soviet, American, and (pending SMIC re-test) Chinese cultural inflections all confirmed within the same constructivist DNA. | May 4 SV re-test, palette/compositional emphasis architecture |
| May 4, 2026 | Calibration: VIS-01 budget targets shifted to reflect post-AI-GEN-migration displacement. FOOTAGE drops 30-40% → 15-25% (archival-weighted, reserved for named figures/real events/software UIs). AI-GEN/ILLUST jumps 5-15% each → 15-30% combined. Generic stock displaced by constructivist illustration. Three-content-type mental model codified in VISUAL_LANGUAGE.md. | May 4 post-migration calibration |
| May 9, 2026 | Added **Core Doctrine: Backstage Maximum, Frontstage Confident** as a meta-section above the numbered domain sections. Codifies the rigor / interestingness tradeoff: maximum verification effort backstage; confident, vivid, bounded-analogy voice frontstage. Names operational ownership across research-audit, script-draft, script-audit, persona-eval. Doctrine derived from §17 (Verification Architecture), §15 (White Space), §13 (Documentary Techniques). Companion edits to PROJECT_VISION.md, CLAUDE.md, research-audit, script-audit, script-draft. | May 9 doctrine session, RESEARCH_LOG.md §§13-17 |
| May 10, 2026 | Added PROD-05 (geopolitics demonetization-framing check on every episode touching contemporary conflict — title/thumbnail/description trigger-word scan + Checks questionnaire) and PROD-06 (don't iterate titles or thumbnails before ~2–4K impressions). Both derived from May 2026 channel-operations research. PROD-05 is compatible with and reinforces the existing PROJECT_VISION title rule. New companion document `episodes/PRE_LAUNCH_CHECKLIST.md` consolidates the security, AI compliance, channel-page-setup, first-week-ops, and demonetization-framing checks into one runnable checklist for episode 1. | May 10 channel-operations research, RESEARCH_LOG.md §§18, 20, 21 |

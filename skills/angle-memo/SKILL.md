---
name: angle-memo
description: >
  Generate a script angle memo that locks 10 narrative decisions (named concept, cold open, cross-domain connections, emotional arc, stakes sentence, decoder framing, series tag, title options, visual arc, speculation budget) before scripting begins. Use whenever someone asks 'write the angle memo', 'angle this episode', 'what's the angle', 'narrative strategy', 'how should we tell this story', 'decoder framing', 'prep for scripting', or when a research brief has passed audit and the next pipeline step is script development. This is the bridge between research and scripting — always use it before script-draft.
---

# Angle Memo Skill

You are writing the narrative strategy for a Parallax episode. The angle memo is a two-phase process that compresses a rich research brief into a single story with locked decisions.

**The core problem this skill solves:** Deep Research produces 10,000-15,000+ words of material — far more than an 18-minute episode can hold. The most important creative decision is *which story to tell* from that material. This is fundamentally an editorial judgment that belongs to Tiger, not an execution task. The skill's job is to surface the best options clearly enough for a 5-minute decision.

## Phase 1: Story Options (present to Tiger for selection)

Before locking any decisions, identify 3 distinct storylines that could be built from the research. Each storyline is a different *compression strategy* — it keeps different connections, cuts different material, and produces a different emotional experience.

**What makes storylines genuinely distinct:** They must differ on *spine* (what question drives the episode forward), not just on which connections to include. Two storylines that use different examples to tell the same story aren't distinct — they're variants. Push for genuinely different narrative engines.

For each storyline, provide:

| Element | What to write |
|---------|--------------|
| **Spine** | One sentence: the dramatic question that drives the episode forward. Format: "How/why does [X]?" |
| **Keeps** | Which 2-3 connections from the research anchor this story |
| **Cuts** | What gets dropped entirely or compressed to a single sentence |
| **Emotional shape** | The arc in ~5 emotions (e.g., "surprise → dread → recognition → relief → urgency") |
| **Why it entertains** | One sentence: what makes this *fun to watch*, not just informative |
| **Risk** | One sentence: where this storyline could fail |

End Phase 1 with a **recommendation** (which storyline + any elements worth stealing from the others) and a brief rationale.

**Present Phase 1 to Tiger and wait for his pick.** He may choose one, mix elements, or redirect entirely. Do not proceed to Phase 2 until he's chosen.

---

## Phase 2: Full Angle Memo (after Tiger picks)

Once the storyline is selected, lock the 10 decisions below. The memo should be opinionated and tight (~300-500 words). Every decision should serve the chosen spine. If something from the research doesn't serve the spine, it doesn't make the memo — no matter how interesting it is.

## Before You Start (both phases)

Read these files:

1. **The research brief** — your raw material. Pay special attention to: the thesis, the cross-domain connections, the key claims table, the counterarguments, and any "Visual opportunities" notes.
2. **EDITORIAL_PLAYBOOK.md** (`/episodes/EDITORIAL_PLAYBOOK.md`) — sections 1 and 4. The narrative rules (especially NAR-01, NAR-09 through NAR-13) and research rules shape every decision in the memo.
3. **JIANG_NARRATIVE_RESEARCH.md** (`/project/JIANG_NARRATIVE_RESEARCH.md`) — the opening hook taxonomy (6 types), the decoder posture, and the named conceptual product guidance.
4. **CONTENT_IDENTITY.md** (`/project/CONTENT_IDENTITY.md`) — the 7 episode formats. You need to select one.
5. **VISUAL_LANGUAGE.md** (`/project/VISUAL_LANGUAGE.md`) — the visual-narrative timing section (visual-first, counterpoint, motifs). The visual arc item requires this.
6. **SEO_KEYWORDS.md** (`/project/SEO_KEYWORDS.md`) — keyword constraints for titles (if it exists for this arc).
7. **Concept registry** — run `tools/concepts/lookup.py reuse-check` against the brief to identify any concepts that already exist. Callbacks to established concepts are more powerful than cold intros.

Also check IDEAS.md to see where this episode sits in its arc — what came before, what comes after. The angle should account for the arc's trajectory.

## Discovery Shape → Narrative Arc

Check IDEAS.md to see which **discovery path** generated this topic (the entry in the State column should note it — e.g., "discovered via Actor-Constraint scan"). If a discovery path is identified, use the corresponding narrative arc guidance below to shape your decisions in Phase 1 and Phase 2. If the topic was found through responsive discovery (event-first or framework-first) without a specific shape tag, skip this section — the standard 10-decision process is sufficient.

The discovery shape doesn't override the 10 decisions — it provides a structural *tendency* for each one. Think of it as: the shape tells you what kind of story the material naturally wants to be. You can deviate, but you should deviate consciously.

### Actor-Constraint → "Map the Trap"

**The viewer's journey:** They start thinking the actor is irrational → gradually see the walls closing in → realize the "irrational" behavior is the only rational option → feel the vertigo of understanding a trap from the inside.

**Beat structure tendency:** Outside-in spiral. Start where the audience is ("this actor seems crazy"), then tighten inward through successive constraints until the viewer is standing inside the decision space and can feel the walls.

**How it shapes the 10 decisions:**

| Decision | Shape influence |
|----------|---------------|
| Named concept | Usually names the trap itself ("The Silicon Trap," "The Exit Tax"). The concept should feel like something *closing* around the actor. |
| Cold open | Provocation or stakes-shock. Lead with the apparent irrationality: "Why would a leader choose an unwinnable war over a negotiated peace?" |
| Cross-domain connections | Historical parallels should be other trapped leaders (Napoleon in Spain, USSR in Afghanistan). The resonance is the *trap structure*, not the specific policy domain. |
| Emotional arc | Confusion → recognition → dread → empathy → vertigo. The viewer should end feeling trapped themselves. |
| Visual arc | Motif is a closing/shrinking element (closing doors, narrowing paths, tightening circles). Decision trees showing eliminated options are central. |
| Speculation | Naturally lends to "watch signals" — the trap predicts what the actor *can't* do, which makes certain outcomes structurally foreseeable. |

### Mechanism → "Peel the Onion"

**The viewer's journey:** They think they understand how X works → you show the surface mechanism → then the layer underneath → then the layer underneath *that* → they realize the real mechanism is nothing like what they imagined.

**Beat structure tendency:** Progressive revelation. Each beat strips away one layer of the standard model and shows what's beneath. The beats go *deeper*, not wider.

**How it shapes the 10 decisions:**

| Decision | Shape influence |
|----------|---------------|
| Named concept | Usually names the hidden mechanism or the gap between the standard and real model ("The Deterrence Illusion," "The Sanctions Mirage"). |
| Cold open | Stakes-shock (a number that only makes sense if the mechanism is different from what people think) or framework-promise ("The textbook says X. The textbook is wrong."). |
| Cross-domain connections | Parallels should be other mechanisms that look similar on the surface but work differently underneath (e.g., sanctions → blockades → quarantines — same surface logic, different plumbing). |
| Emotional arc | Confidence → doubt → curiosity → alarm → urgency. The viewer's confidence in their existing model erodes progressively. |
| Visual arc | Highest MG density of any shape — mechanisms are inherently diagrammatic. Plan extra footage anchoring to avoid slideshow. Motif is a diagram that complexifies across the episode (simple → revealed complexity). |
| Speculation | Naturally lends to named scenarios — once you understand the real mechanism, you can see how it breaks in different ways. |

### Convergent Drift → "Parallax View"

**The viewer's journey:** They see isolated events → you show the same pattern in a second place → then a third → the convergence becomes undeniable → you reveal the hidden structural force driving all of them.

**Beat structure tendency:** Accumulation then reveal. Build evidence from multiple independent cases (each a mini-narrative), then the reveal beat names the structural force. This is literally what the channel is named after.

**How it shapes the 10 decisions:**

| Decision | Shape influence |
|----------|---------------|
| Named concept | Usually names the structural force driving the convergence, not the convergence itself ("The Subsidy Trap," "The Sovereignty Reflex"). |
| Cold open | List that creates pattern recognition: "In 2024, Japan did X. In 2025, India did Y. This month, Germany did Z. They didn't coordinate. So why are they all doing the same thing?" |
| Cross-domain connections | The connections ARE the episode — each case is a connection. Select for maximum independence (different continents, different regimes, different ideologies) to make the convergence more striking. |
| Emotional arc | Curiosity → recognition → awe → understanding → prediction. The accumulation should feel like a conspiracy that turns out to be structural. |
| Visual arc | Most visually varied shape — each case is a different country/context, giving natural footage variety and geographic diversity. Maps are central. Motif is something that appears in each case and accumulates (pins on a map, a pattern that emerges). |
| Speculation | Naturally lends to "single prediction" — if you can name the structural force, you can predict who does it next. |

### Inversion → "Flip the Model"

**The viewer's journey:** You present the standard model as they know it → stress-test it against real cases → it breaks in a specific, surprising way → you show what the corrected model reveals.

**Beat structure tendency:** Build then break. Steelman the standard model first (so the inversion has weight), then systematically break it, then present the corrected version. The episode has a clear before/after pivot.

**How it shapes the 10 decisions:**

| Decision | Shape influence |
|----------|---------------|
| Named concept | Usually names either the broken model or the corrected insight. "The Interdependence Illusion" (names the broken model) or "Weaponized Interdependence" (names the corrected insight). |
| Cold open | Provocation: "Everything you learned about X is wrong — and the stakes couldn't be higher." Or stakes-shock with the corrected model's most surprising implication. |
| Cross-domain connections | Best connections are cases where the standard model predicted one thing and reality delivered another. The breakage pattern across cases IS the argument. |
| Emotional arc | Confidence → unease → crack → collapse → rebuild → clarity. The viewer needs to feel the standard model breaking, not just be told it's broken. |
| Visual arc | Natural split-screen / before-after visual structure. Motif is a model/diagram that transforms — the standard version appears early, the corrected version replaces it at the pivot point. Strong counterpoint potential at the break point (narration presents the model, visual shows the contradicting reality). |
| Speculation | "What would change my mind" is especially important here — you just broke someone else's model, so you must show what would break yours. |

### Conspicuous Silence → "Name the Unspoken"

**The viewer's journey:** You point at a conspicuous absence → show evidence that the silence is strategic → explain why the silence is maintained → name what nobody's saying → show what becomes visible once you name it.

**Beat structure tendency:** Negative space then revelation. First beats establish what *is* being said (the adjacent discourse), then the turning point is noticing what *isn't*. The naming itself is the climax.

**How it shapes the 10 decisions:**

| Decision | Shape influence |
|----------|---------------|
| Named concept | Usually names the silence or the thing being silenced. "The Polite Fiction" (names the silence mechanism) or "The Post-Order World" (names the unspoken reality). |
| Cold open | Framework-promise: "There's a question nobody in Washington will ask out loud. Once you hear it, you'll wonder why." The withholding in the open mirrors the silence being analyzed. |
| Cross-domain connections | Best connections are other historical silences that eventually broke — and what happened when they did. The structural function of the silence (why it's maintained) is more interesting than what's being silenced. |
| Emotional arc | Unease → recognition → "oh" → transgression → clarity. The viewer should feel the taboo of naming the unsaid — then the relief of having it named. |
| Visual arc | Strong counterpoint moments (narration about what's being said while visuals show the gap). Lower MG density, more atmospheric footage. Motif could be an absence that gradually fills, or a redaction that lifts. |
| Speculation | Naturally bold — you're already saying the thing nobody else will. The prediction follows from naming the silence: "If X is already true, then Y is coming." |

### Second-Order Consequence → "Follow the Thread"

**The viewer's journey:** You present the obvious first-order analysis → agree with it → pull the thread one step further → reveal the second-order consequence nobody is tracking → show it's more important than the first-order event.

**Beat structure tendency:** Agreement then extension. Validate the audience's existing understanding first (builds trust), then take them somewhere unexpected. The first half of the episode feels like a good version of what competitors would make; the second half is the Parallax contribution.

**How it shapes the 10 decisions:**

| Decision | Shape influence |
|----------|---------------|
| Named concept | Usually names the second-order consequence, not the first-order event. "The Identity Cascade" (Europe), "The Dollar Spiral" (reserve currency feedback). |
| Cold open | Stakes-shock — lead with the second-order consequence (which is surprising), then reveal how you got there. Or provocation: "Everyone is analyzing X. They're looking at the wrong thing." |
| Cross-domain connections | Best connections are historical cases where a first-order event produced a surprising second-order transformation that mattered more. (WWI → collapse of empires was "obvious"; WWI → women entering the workforce was second-order and more transformative.) |
| Emotional arc | Familiarity → agreement → extension → surprise → reorientation. The viewer should feel the "zoom out" moment — the frame expanding to include something they weren't seeing. |
| Visual arc | Causal chain diagrams (A → B → C) are central. Strong visual-first potential at the second-order reveal — show the consequence before you explain it. Motif is a chain or connection that extends, or a map that zooms out. |
| Speculation | Feedback loops are the strongest prediction structure for this shape. If the second-order consequence reinforces the first-order cause (C → A), name the loop and predict where it leads. |

## The 10 Decisions

Work through these in order. Each one builds on the previous.

### 1. Named Conceptual Product

Coin a 2-3 word name for the episode's core analytical insight. This is the portable idea viewers carry away — the thing they explain to a friend the next day. 

The name must be:
- **Memorable** — short, rhythmic, slightly surprising
- **Rigorously defined** — include a one-sentence definition AND where the concept breaks down
- **Not ideologically loaded** — avoid totalizing brands ("Empire of Evil," "Pax Judaica"). The name should describe a structural pattern, not assign blame.

Test it: "Did you see that Parallax video about ___?" If the blank fills naturally with your name, it works.

### 2. Cold Open Approach

Choose from the 6-type taxonomy (from JIANG_NARRATIVE_RESEARCH.md):

1. **Stakes-shock** — counterintuitive number or fact that violates expectations
2. **Diaristic** — mundane personal detail → world-historical event *(save for episode 5+)*
3. **News-anchor + assumed prep** — "As you know from your research..." *(requires existing audience)*
4. **Framework-promise** — "There's a pattern nobody's talking about."
5. **Track-record callback** — "I predicted X. Now I'm predicting Y." *(save for episode 5+)*
6. **Provocation/dare** — "What if I told you..."

For pre-launch episodes, stakes-shock (#1) and framework-promise (#4) are the safest. Write 2-3 draft openers (2-4 sentences each) using your chosen type. The best opener usually comes from the brief's most surprising finding.

The opener must ground stakes within 30 seconds (NAR-10). The viewer needs to feel personally implicated before any context or history.

**Mandatory 4-beat structure:** Every cold open must complete these four beats regardless of which type is chosen:

1. **Schema** — activate a prior belief the viewer already holds ("The standard story is X")
2. **Violation** — disrupt it with a single concrete contradiction ("But here's what that story doesn't explain...")
3. **Narrowing** — reduce to one closeable question ("The real question is: why does Y happen even when Z?")
4. **Solvability promise** — signal the route to closure without giving the answer ("The answer turns out to involve something most analysts overlook entirely.")

These four beats must be identifiable within the first 60 seconds. Information Gap Theory research shows that curiosity is triggered by a *specific knowledge gap*, not by mystery in general — the narrowing and solvability promise do this work. A cold open without the solvability promise creates diffuse unease rather than directed curiosity.

### 3. Cross-Domain Connections

The research brief should contain 4-5 cross-domain connections (from the 3-pass research process). Select 2-3 that will anchor the script. Rank by:

- **Surprise** — would an educated viewer find this unexpected? (Venice's Murano glass → TSMC's Taiwan monopoly is surprising; "empires decline" is not)
- **Resonance** — does this connection deepen the thesis, or is it just interesting?
- **Breakage** — can you name where the analogy breaks? If you can't, the connection is too loose to use.

For each selected connection, write: the connection (one sentence), the structural resonance (what makes it apt), and where it breaks (what makes it imperfect). The breakage is not a weakness — it's intellectual honesty, and it's what separates Parallax from conspiracy content (NAR-13).

### 4. Emotional Arc

One sentence per beat: what the viewer **feels**, not what they **learn**. The emotional arc is the beat structure. If you can't name an emotion for a beat, the beat is probably an information dump that should be dissolved into other beats (NAR-02).

Format:
```
1. [Emotion] (Beat 1) — [one-line description of the feeling]
2. [Emotion] (Beat 2) — ...
...
```

The arc should follow a tension curve, not a flat line. Typical patterns: disorientation → recognition → complexity → dread → personal stakes. The last beat must be personal implication (NAR-05).

**Target behavior — design the closing beat for one outcome:**

| Closing emotional state | Viewer behavior produced | Design for this when... |
|------------------------|--------------------------|-------------------------|
| Calm competence (expert has it in hand) | Subscribe | The episode's thesis is settled and reassuring; analytical closure is possible |
| High arousal (awe, alarm, urgency) | Share | The thesis is revelatory and the stakes feel immediate — the viewer needs to tell someone |
| Unfinished curiosity (question slightly open) | Return visit | The series arc has a next episode that answers the remaining question |
| Lingering dread (no resolution) | Disengage | **Avoid** — exits permanently |

Identify the target behavior in the memo (subscribe, share, or return visit) and design the closing beat accordingly. Dread without resolution is the only outcome to actively prevent. For launch episodes, "subscribe" and "share" are both valid; "share" requires a higher arousal endpoint and is harder to sustain without the existing trust that subscriptions provide — default to "subscribe" for cold audiences.

### 5. Stakes Sentence

One sentence that answers: "Why should the viewer care about this in their own life?" This sentence (or something close to it) will appear in the first 30 seconds of the episode AND return in the closing beat.

Bad: "The semiconductor supply chain is important." (Abstract, no personal stakes.)
Good: "Every device you own runs on chips that two governments are actively trying to pull apart."

### 6. Decoder Framing

Two sentences:
- **The standard frame** — what a normal viewer thinks this topic is about
- **The Parallax frame** — the hidden structure being revealed

The gap between these two frames is the episode's value proposition. If they're the same ("everyone already knows this"), the episode doesn't have an angle.

Format: "The standard frame: [X]. Our frame: [Y]."

### 7. Series Tag

Does this episode belong to a numbered arc? If so, what's the series tag? (e.g., "Great Power Competition #1"). Check IDEAS.md for arc placement. If the episode is standalone, say so.

### 8. Working Title Options

3-5 titles following Jiang titling mechanics:
- The named concept as title ("The Silicon Trap")
- An information-asymmetry frame ("What Nobody's Telling You About...")
- A provocation ("How America Made China's Chip Industry")
- A stakes-shock ("The $165B Mistake Nobody Can Stop")
- A series-tagged variant ("Great Power Competition #1: The Silicon Trap")

Check SEO_KEYWORDS.md for keyword constraints. The title locks during the title/hook workshop step after script review, so these are working options, not final.

### 9. Visual Arc

Three elements that plan the visual layer as a co-equal storytelling channel:

**(a) Visual motif.** A simple, recurring visual element tied to the named concept that evolves across the episode. Describe: what it looks like in its simple form (first appearance, first 2 minutes), how it evolves mid-episode, and what its final form looks like. The motif should track the emotional arc, not the informational arc. Suggest which Remotion template could implement it.

**(b) Visual-first moments (2-3).** Identify turning points where the image should arrive 3-5 seconds before narration explains it. For each, name: the beat, what the viewer sees, and what question it raises in their mind before the narration answers.

**(c) Counterpoint moments (1-2).** Identify thesis complications where the visual should deliberately tension with the narration. For each, name: the beat, what the narration says, and what the visual shows that complicates it.

### 10. Speculation Budget

Decide how far forward this episode pushes and what form the speculation takes. Read the research brief's Section 9 (Speculative Implications) to see what raw material is available. Then choose:

**Speculation structure** (pick one):
- **Named scenarios** — 2-3 scenarios with names and rough probabilities. Best when the analysis reveals a genuine fork in the road.
- **Single prediction** — one strong, falsifiable claim with a timeframe. Best when the structural logic points clearly in one direction.
- **Watch signals** — 2-3 specific observables for the audience to track. Best when the situation is genuinely uncertain but you can identify the leading indicators.

**Speculation depth:**
- **Bold** — the episode makes a clear predictive claim: "the structural incentives point toward X within Y timeframe." Appropriate when the evidence is strong and the episode's cross-domain connections all point the same direction.
- **Moderate** — named scenarios with probabilities, acknowledging genuine uncertainty. Appropriate for most episodes.
- **Light** — watch signals only. Appropriate when the topic is too complex for scenarios or the episode is more retrospective.

**"What would change my mind":** Write the single strongest piece of evidence that would undermine the episode's thesis. This goes in the scenario beat and is non-negotiable — it's the credibility cornerstone.

**Falsifiable prediction for registry:** Write one concrete, testable claim with a timeframe that gets registered in `data/concepts.json` as a prediction. This becomes the raw material for future "Was I Right?" episodes (Oracle identity direction). If this episode is genuinely retrospective and no forward-looking claim is warranted, say so — but this should be rare.

---

## Output Format

### Phase 1 Output (Story Options)

```markdown
# [episode-slug] — Story Options

## Option A: "[Spine as short title]"
**Spine:** [One-sentence dramatic question]
**Keeps:** [2-3 connections]
**Cuts:** [What gets dropped or compressed to one sentence]
**Emotional shape:** [5 emotions in sequence]
**Why it entertains:** [One sentence]
**Risk:** [One sentence]

## Option B: "[Spine as short title]"
[same format]

## Option C: "[Spine as short title]"
[same format]

## Recommendation
[Which option + any elements to steal from others. 2-3 sentences max.]
```

Present this to Tiger. Wait for his pick before proceeding.

---

### Phase 2 Output (Full Angle Memo)

```markdown
# [episode-slug] Angle Memo — [Working Title]
**Storyline chosen:** [A/B/C + any modifications Tiger requested]

## Named Concept
**[Name]** — [one-sentence definition]. [Where it breaks down.]

## Decoder Framing
The standard frame: [X]. Our frame: [Y].

## Cold Open Approach
**[Type].** [2-3 draft openers, 2-4 sentences each.]

## Cross-Domain Connections
1. **[Connection A]** — [resonance]. Where it breaks: [breakage].
2. **[Connection B]** — [resonance]. Where it breaks: [breakage].
3. **[Connection C]** — [resonance]. Where it breaks: [breakage].

## Emotional Arc
1. **[Emotion]** (Beat 1) — [description]
2. **[Emotion]** (Beat 2) — [description]
...

## Stakes Sentence
[One sentence.]

## Visual Arc
**Motif:** [description + evolution + suggested template]

**Visual-first moments:**
- Beat [X]: [what viewer sees] → [question it raises]
- Beat [Y]: [what viewer sees] → [question it raises]

**Counterpoint moment:**
- Beat [Z]: Narration says [X], visual shows [Y]

## Speculation Budget
**Structure:** [Named scenarios / Single prediction / Watch signals]
**Depth:** [Bold / Moderate / Light]
**What would change my mind:** [one sentence]
**Falsifiable prediction:** "[claim]" — check by [date]. Register as prediction in concepts.json.

## Concept Registry

**Callbacks to prior episodes** (concepts already registered in `data/concepts.json`):

| Concept | Source Episode | How This Episode Uses It |
|---------|---------------|--------------------------|
| [e.g. technology-denial] | silicon-trap, Beat 2 | [reinforced throughout as foundation] |
| ... | | |

**New concepts to register after scripting:**

| Concept Name | Type | Definition | Introduction Beat |
|-------------|------|-----------|-------------------|
| [e.g. the-blockade-paradox] | named-concept | [one-sentence definition] | Beat 2 |
| ... | | | |

This section is a checklist for script-draft — every callback should appear in the narration, and every new concept should be introduced at the specified beat.

## Title Options
1. [Primary]
2. [Alternative]
3. [Alternative]
4. [Alternative]
5. [Alternative]

## Episode Format
[Format name from CONTENT_IDENTITY.md] — [one-line rationale]

## Target Length
~[X] minutes ([Y] words). [N] beats.
```

## Self-Check

### Phase 1 self-check:
- [ ] Three storylines have genuinely different spines (different driving questions, not just different examples)
- [ ] Each storyline makes hard cuts — if nothing is dropped, the compression hasn't happened
- [ ] "Why it entertains" answers a viewer question, not an academic one
- [ ] Recommendation is opinionated with clear rationale

### Phase 2 self-check:
- [ ] Every decision serves the chosen spine — nothing survives on "it's interesting" alone
- [ ] Named concept is 2-3 words, defined with boundary conditions
- [ ] Cold open grounds stakes within 30 seconds — no context-first openers
- [ ] Each cross-domain connection has named breakage (NAR-13)
- [ ] Emotional arc has one emotion per beat, ends on personal stakes
- [ ] Decoder framing shows a clear gap between standard and Parallax frame
- [ ] Visual motif is simple enough to evolve (geometric, not literal)
- [ ] At least 2 visual-first and 1 counterpoint moment planned
- [ ] Title options include at least one named-concept title and one provocation
- [ ] Speculation budget is set: structure chosen, depth chosen, "what would change my mind" written, falsifiable prediction drafted
- [ ] Total length is 300-500 words (this is a memo, not a brief)
- [ ] Material that was cut could NOT be reinserted without breaking the spine
- [ ] Cold open completes all four beats in order: schema → violation → narrowing → solvability promise
- [ ] Target behavior identified (subscribe / share / return visit) and closing beat designed for that target
- [ ] Title confidence check: no working title makes a stronger claim than the bounded verdict the episode will actually deliver

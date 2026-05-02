---
name: script-audit
description: "Audit a video script for narrative quality across six lenses: broken transitions, lecture patterns, missing human moments, pacing problems, unverified claims, and visual layer quality (footage/MG balance, mode monotony, unsourceable footage calls). Use this skill whenever someone asks to review, audit, critique, or check a video script — or whenever a new script version is produced and quality should be verified before moving on. Also trigger when someone mentions 'script review', 'does this flow', 'is this engaging', 'check my script', 'what's wrong with this draft', or any request to evaluate narration/video writing quality."
---

# Script Audit

You are auditing a video narration script for narrative quality and visual layer health. Your job is to read the script carefully and run six independent audit lenses, then produce a consolidated report with specific issues, locations, and suggested rewrites.

## Context

These scripts are for a YouTube/Bilibili channel that analyzes geopolitics through historical analogy and philosophical frameworks. The tone target is "smart friend explaining something fascinating over drinks" — intellectually rigorous but narratively engaging. The audience is educated adults (25-44) who read Foreign Affairs and listen to Lex Fridman. They will click away if the script feels like a lecture.

The single most important quality criterion: **is this interesting?** A script can be factually impeccable and structurally logical and still fail if it doesn't sustain tension and curiosity throughout.

## Inputs

1. **The script file** (required) — the narration script to audit
2. **The brief/verification table** (optional) — if an episode brief exists in the same folder, use it for the claim audit lens. Look for files named `brief.md` or files containing verification tables.
3. **Editorial Playbook** (read before auditing) — `episodes/EDITORIAL_PLAYBOOK.md` contains channel-level production rules extracted from past episodes. Read Sections 1 (Narrative Structure) and 2 (Visual Production) before running your lenses. When you find an issue that matches a playbook rule, cite it as "Playbook: [rule ID]" in your report — this helps Tiger see which patterns are recurring vs. new. If you find an issue that *should* be a playbook rule but isn't, flag it as "Candidate Rule" in your report.
4. **Learning Log** (read if it exists) — `episodes/LEARNING_LOG.md` contains post-publish analytics findings. If available, check whether any of your findings were already identified in a previous episode's retrospective — this tells Tiger whether a pattern is persisting despite being known.

## The Six Lenses

Run each lens independently. For each issue found, provide:
- **Location**: quote the specific text (keep it short — just enough to identify the spot)
- **Problem**: what's wrong, in one sentence
- **Suggested rewrite**: a concrete alternative, not just advice

### Lens 1: Transition Audit

This is the most granular lens. Walk through the script **paragraph by paragraph** — not just beat by beat. At every single boundary between paragraphs, ask: can a reader/listener follow the emotional and logical thread without help?

The most common failure mode is not between major sections (those are obvious) but between adjacent paragraphs *within* the same beat. A paragraph ends on a positive note; the next one pivots to bad news. A paragraph builds toward a conclusion; the next one starts a different topic. These micro-breaks are where readers get lost and don't know why.

**The specific test:** Read the last sentence of paragraph A and the first sentence of paragraph B back to back. Do they connect? Is there an emotional or logical bridge? If you removed everything between them, would the gap feel jarring?

**What to flag:**
- Tonal reversals without a bridge (e.g., positive buildup ending "better than expected" → negative reveal starting with "That fab covers seven percent"). This was the most common issue found in testing. The fix is usually not a signpost ("Here's the problem") but a pivot sentence that carries the seed of both directions — something like parallel structure ("By every engineering metric, a success. By every strategic metric, a rounding error.")
- Topic jumps where the reader has to infer the connection — especially mid-beat jumps where the script moves from one subject to another without explaining why
- Paragraphs that could be swapped in order without the reader noticing (a sign they're not linked)
- Section breaks that feel like chapter endings rather than tension-builders (the reader should want to cross the break, not feel like they've reached a stopping point)
- **Orphaned signpost removal:** if a previous version used signpost phrases ("Here's the problem") to bridge two paragraphs, and those signposts were removed without replacing the connective tissue, the transition will be broken. Flag these specifically — the fix is not to restore the signpost but to write a real transition.

**What's NOT a problem:**
- Deliberate dramatic pauses or section breaks with visual cues
- Short punchy sentences after longer ones (that's rhythm, not disconnection)
- Reversals that ARE bridged by parallel structure, echoed language, or cause-effect

### Lens 2: Lecture Detection

Scan for patterns that make the script feel like a classroom rather than a conversation.

**Signpost phrases to flag** (these signal "I'm about to teach you"):
- "Here's the problem/thing/point"
- "Here's the critical/key/important difference"
- "Think about what that means"
- "Let's be honest about"
- "Here's what we know"
- "Now — [topic change]"
- "It's important to understand that"
- "The key takeaway is"
- "What this means is"
- "But here's why" / "But here's the thing"

**Information dump markers:**
- Three or more data points in a single paragraph without narrative framing (numbers need a story to live inside)
- A paragraph that is pure exposition with no tension, question, or surprise
- Sections where the script explains what it's about to explain (previewing your own argument is a lecture move)

**Define-then-illustrate ordering (lecture) vs. illustrate-then-name (story):**
This is a subtle but important pattern. When the script introduces a concept by defining it first and then giving an example, that's classroom structure. When it tells a story or shows an image first and then names the concept, that's narrative structure. Example: "卡脖子 means stranglehold technology. Here's a story about a ballpoint pen..." is define-then-illustrate. "China could launch astronauts but couldn't make a pen tip... the Chinese have a phrase for this kind of vulnerability: 卡脖子" is illustrate-then-name. Flag instances where flipping the order would make the section more engaging.

**Telling vs. showing:**
Flag moments where the script states a conclusion that the evidence should be allowed to deliver on its own. "Both players are trapped" is telling. Showing the specific companies watching their revenue evaporate while being forced to comply — that's showing. The test: if you deleted the thesis statement, would the reader still arrive at the same conclusion from the evidence? If yes, the thesis statement is redundant. If no, the evidence is insufficient and needs strengthening.

**Voice consistency:**
Some scripts alternate between conversational voice ("He'd originally asked for twenty percent. Jensen Huang talked him down to fifteen.") and formal analytical voice ("The extreme globalization that made chips cheap, ubiquitous, and transformative is exactly what makes them strategically vulnerable."). The formal sections are where the script sounds most like a lecture. Flag sections where the voice shifts noticeably toward formal/academic register and suggest conversational alternatives.

**Tension checks:**
- Does every beat tighten a question or raise stakes? If a section is just "here is context you need," flag it.
- Is the script organized by logic (setup → history → present → analysis → conclusion) or by tension (each section intensifies a central question)? Logic-order is lecture structure.

### Lens 3: Human Moment Audit

Track how far the script goes between moments anchored in specific people, places, scenes, or sensory details.

**What counts as a human anchor:**
- A named individual doing or saying something specific
- A specific place described with enough detail to visualize
- Dialogue or a direct quote
- An anecdote or micro-story (the ballpoint pen parable, Jensen haggling with Trump)
- A sensory or physical detail (engineers in desert housing, 34 lithography passes)

**What does NOT count:**
- Abstract references to "experts" or "analysts"
- Country names used as actors ("China responded," "America tried")
- Data points without a human frame

**The rule of thumb:** if more than ~400-500 words (~3 minutes of narration) pass without a human anchor, flag it. The audience processes abstract analysis through concrete moments. Without anchors, they drift.

For each flagged stretch, suggest where a human moment could be inserted and what it might look like — even if it requires additional research.

### Lens 4: Pacing Check

Identify the 3-5 most interesting, surprising, or insight-dense moments in the script. Map where they fall.

**What to check:**
- Are the strongest moments front-loaded (first half) or back-loaded (second half)? Back-loaded = lecture pacing. The audience needs to be hooked early and rewarded throughout.
- What happens at the ~3 minute mark (~450 words)? This is where a YouTube viewer decides to stay or leave. Is there something compelling here, or is it still setup?
- What happens at the ~7 minute mark (~1,050 words)? This is the second decision point. Is the script earning continued attention?
- Are there any stretches longer than ~600 words (~4 minutes) that are pure setup without a payoff moment? Flag them.

**Insight distribution:** if you can summarize the script's key insight in one sentence, where does it first appear? If it's in the final quarter, the script is structured as a build-up-to-a-thesis — which is essay structure, not video structure. The thesis should be felt (not necessarily stated) much earlier, then complicated and deepened.

### Lens 5: Claim Audit

Extract every factual claim from the script — numbers, dates, percentages, attributed quotes, historical facts.

**If a brief/verification table is available:**
- Cross-reference each claim against the table
- Flag any claim stated confidently in the script that is marked "NOT YET VERIFIED" or "LIKELY CORRECT" in the table
- Flag any claim in the script that doesn't appear in the table at all (it may be new and unverified)
- Check for discrepancies between the script and the brief (e.g., the script says "30-45K wafers" but the brief says "~20K" — these inconsistencies need to be resolved before production)

**If no brief is available:**
- Flag claims that are suspiciously specific (exact percentages, dollar figures, dates) without attribution
- Flag claims where the phrasing implies certainty ("it IS," "they NEVER," "the only company") — these need strong sourcing
- Note which claims would benefit from on-screen source attribution

**Quotes used as emotional climaxes need special attention.**  If a direct quote serves as the emotional peak of a beat (e.g., Morris Chang saying "Globalization is almost dead"), it needs source attribution — publication, date, context. The audience's trust in the climactic moment depends on believing the quote is real and accurately rendered. Flag any unsourced quote that carries emotional weight, and note specifically that it needs verification before production.

### Lens 6: Visual Layer Quality

This lens applies only to two-column production scripts (with a right-column visual layer). If the script is narration-only, skip this lens entirely.

The visual layer has its own editorial logic, documented in `project/VISUAL_LANGUAGE.md` and `project/FOOTAGE_SOURCING.md`. This lens checks whether the script follows that logic. Read those docs if you haven't already.

**Visual mode balance.** Count the `[FOOTAGE:]`, `[MG:]`, and `[LAYERED:]` entries across the full script. Calculate approximate screen time percentages. Check against target ranges:
- FOOTAGE: 50-70% (if below 50%, the episode will feel like a slideshow; if above 75%, analysis feels unsupported)
- MG: 20-30% (if above 35%, it's a slideshow)
- LAYERED: 5-15% (if above 15%, the technique loses punch; if 0%, a missed opportunity)

**Mode monotony.** Walk the visual column sequentially and flag:
- More than 3 consecutive `[MG:]` entries without a `[FOOTAGE:]` break — this is the "lecture slideshow" pattern. The viewer's analytical brain fatigues. Suggest inserting 5-10 seconds of breathing footage between MG clusters.
- More than 30 seconds of continuous `[FOOTAGE:]` without a visual change — the viewer starts watching footage instead of listening to narration. Suggest a cut, an overlay, or an MG insert.
- Beats that are all one mode — a beat entirely in `[MG:]` feels like a presentation; a beat entirely in `[FOOTAGE:]` feels like a documentary without analysis. Flag single-mode beats and suggest where to introduce contrast.

**Unsourceable footage calls.** For every `[FOOTAGE:]` entry, apply the "would a stock photographer have filmed this?" test from FOOTAGE_SOURCING.md. Flag entries that describe abstract concepts as footage — "footage of supply chain complexity," "footage of technology denial," "footage of economic integration" — these are motion graphic moments disguised as footage calls. Suggest the appropriate MG template instead.

**Sourcability warnings.** Flag `[FOOTAGE:]` entries that fall into the "Hard to Source" category from FOOTAGE_SOURCING.md (named individuals, specific facilities, classified tech, corporate branding). These aren't wrong — they just need the producer to know they'll require extra effort. Note the difficulty and suggest a fallback if the footage can't be found.

**Layered composition quality.** For `[LAYERED:]` entries, check:
- Is the MG overlay simple enough? Full charts, dense frameworks, or multi-element graphics compete with footage for attention. Only single stats, labels, highlights, or brief typography should be layered over footage.
- Is the footage visually calm enough? Layering a stat over dramatic, fast-moving footage means the viewer can't read either. The footage should be relatively static (aerial slow-pan, held shot, ambient texture).

**Beat cadence check.** For each beat, check whether it roughly follows the establish-analyze-breathe-climax-land pattern from VISUAL_LANGUAGE.md. Not every beat must follow this exactly, but flag beats that are strikingly unvaried — all footage or all MG from start to finish.

Present this lens as a **visual rhythm map** — a compressed timeline showing mode, duration, and template type for every visual entry. This makes patterns visible at a glance:

```
Beat 1: [F 10s] [MG:Title 3s] [F 15s] [MG:Chart 8s] [F 5s] [L 5s] [F 8s]  ✅ varied
Beat 2: [MG:Map 12s] [MG:Chart 8s] [MG:FW 10s] [MG:Typo 4s]  ⚠️ all MG — needs footage break
Beat 3: [F 25s] [F 15s] [F 10s]  ⚠️ 50s footage without MG — analysis feels absent
```

## Output Format

Structure the report as follows:

```
# SCRIPT AUDIT REPORT
## Script: [filename]
## Date: [today]

## Summary
[2-3 sentences: overall assessment. Is this script interesting? Where does it feel like a lecture? What's the single biggest improvement that would make it better?]

## Lens 1: Transitions
[Issues listed with location, problem, suggested rewrite]

## Lens 2: Lecture Patterns  
[Issues listed with location, problem, suggested rewrite]

## Lens 3: Human Moments
[Map of human anchors with word-count gaps. Flagged stretches with suggestions.]

## Lens 4: Pacing
[Map of strongest moments. Assessment of front-loading vs. back-loading. Decision-point check.]

## Lens 5: Claims
[Claim list with verification status. Flagged items.]

## Lens 6: Visual Layer
[Visual rhythm map. Mode balance check. Monotony flags. Unsourceable footage calls. Sourcability warnings.]
(Skip this section if auditing a narration-only script.)

## Priority Fixes
[Top 3-5 issues ranked by impact on viewer engagement. Each with:
- WHY it matters (what the viewer experiences)
- The specific text that needs to change
- A concrete suggested rewrite — actual prose, not advice
- Expected impact: HIGH / MEDIUM / LOW]
```

The Priority Fixes section is the most important part of the report. A script author who reads nothing else should be able to take these five fixes and meaningfully improve their script. Rank by impact on viewer engagement, not by how easy they are to fix.

## Important Notes

- **Be granular.** "The transition in Beat 2 is weak" is useless. "The transition from 'Trump called the whole program horrible' to the COCOM paragraph jumps topics without a bridge — the reader was in present-day US policy and suddenly lands in 1949" is useful.
- **Write the fix, not the diagnosis.** Suggested rewrites should be actual prose the narrator could read aloud, not meta-advice like "add a transition here" or "consider making this more engaging." Write the transition. Write the engaging version.
- **Distinguish symptoms from causes.** When flagging lecture patterns, determine whether a signpost phrase should be cut entirely or needs to be replaced with better connective tissue. Sometimes the signpost is covering for a structural problem — cutting it without fixing the structure makes things worse (this is the most common mistake in script revision).
- **Respect what works.** If the script is genuinely good in a particular lens, say so in one sentence and move on. Don't manufacture issues to fill space. A report that flags 3 real problems is more valuable than one that flags 15 issues of varying significance.
- **Weight the lenses correctly.** Lenses 1-4 are about whether the script is *interesting*; Lens 5 is about whether it's *accurate*; Lens 6 is about whether it's *producible and visually compelling*. Lenses 1-4 should get ~65% of the report's attention, Lens 6 ~20%, and Lens 5 ~15%. A visually monotonous script is almost as bad as a boring one — the viewer experiences both as "I want to click away."

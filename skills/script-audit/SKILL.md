---
name: script-audit
description: >
  Audit a video script for narrative quality across 9 lenses: broken transitions, lecture patterns, missing human moments, pacing problems, unverified claims, visual layer quality, decoder posture, connection density, and psychological architecture. Produces specific issues with locations and suggested rewrites. Use whenever someone asks to 'review the script', 'audit the script', 'check my script', 'does this flow', 'is this engaging', 'what's wrong with this draft', or when a new script version needs quality verification. This evaluates craft quality — distinct from persona-eval (audience fit) and visual-concept (visual feasibility). Always run after script-draft, before review-package.
---

# Script Audit

You are auditing a video narration script for narrative quality and visual layer health. Your job is to read the script carefully and run eight independent audit lenses, then produce a consolidated report with specific issues, locations, and suggested rewrites.

## Context

These scripts are for a YouTube/Bilibili channel that analyzes geopolitics through historical analogy and philosophical frameworks. The tone target is "smart friend explaining something fascinating over drinks" — intellectually rigorous but narratively engaging. The audience is educated adults (25-44) who read Foreign Affairs and listen to Lex Fridman. They will click away if the script feels like a lecture.

The single most important quality criterion: **is this interesting?** A script can be factually impeccable and structurally logical and still fail if it doesn't sustain tension and curiosity throughout.

## Inputs

1. **The script file** (required) — the narration script to audit
2. **The brief/verification table** (optional) — if an episode brief exists in the same folder, use it for the claim audit lens. Look for files named `brief.md` or files containing verification tables.
3. **Editorial Playbook** (read before auditing) — `episodes/EDITORIAL_PLAYBOOK.md` contains channel-level production rules extracted from past episodes. Read Sections 1 (Narrative Structure) and 2 (Visual Production) before running your lenses. When you find an issue that matches a playbook rule, cite it as "Playbook: [rule ID]" in your report — this helps Tiger see which patterns are recurring vs. new. If you find an issue that *should* be a playbook rule but isn't, flag it as "Candidate Rule" in your report.
4. **Learning Log** (read if it exists) — `episodes/LEARNING_LOG.md` contains post-publish analytics findings. If available, check whether any of your findings were already identified in a previous episode's retrospective — this tells Tiger whether a pattern is persisting despite being known.

## The Nine Lenses

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

**Visual mode balance.** Count all mode tags (`[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`, `[AI-GEN:]`, `[ILLUST:]`) across the full script. Calculate approximate screen time percentages. Check against target ranges:
- MG: 40-55% (analytical video essays are naturally MG-dominant; if above 60%, it's a slideshow)
- FOOTAGE: 25-40% (if below 25%, the analysis feels disconnected from reality)
- ILLUST: 5-15% (atmospheric illustrations for emotional texture; if 0% in a 10+ min episode, flag as opportunity)
- AI-GEN: 5-15% (photorealistic grounding; if above 15%, too expensive and fatiguing)
- LAYERED: 5-10% (if above 15%, the technique loses punch)

**Three-register check.** The channel uses three visual registers (see VISUAL_LANGUAGE.md):
- Register 1 (Analytical): `[MG:]` entries — where the viewer reads information
- Register 2 (Atmospheric): `[ILLUST:]` entries — where the viewer feels emotion
- Register 3 (Grounding): `[AI-GEN:]` entries — where the viewer inhabits a space

All three registers should be present in any episode longer than 8 minutes. If a register is completely absent, flag it with a suggestion for where it could be inserted. Common gaps:
- Missing Atmospheric → the episode is all-data, all the time. Suggest 3-5 moments where constructivist illustrations would add emotional weight (typically at turning points, trap-closing moments, or dystopian implications).
- Missing Grounding → the viewer never physically enters the spaces being discussed. Suggest 2-3 moments where a photorealistic AI scene would make the abstract concrete.

**Register transition grammar.** When the script switches between registers, check that transitions respect the grammar from SCRIPT_FORMAT.md:
- Analytical → Grounding: color-wash
- Grounding → Atmospheric: blur-through
- Atmospheric → Analytical: iris
- Analytical → Atmospheric: dissolve
- Hard cuts between stylistically distant registers (e.g., constructivist art directly to photorealistic AI) should be flagged as jarring.

**Mode monotony.** Walk the visual column sequentially and flag:
- More than 3 consecutive `[MG:]` entries without a non-MG break — this is the "lecture slideshow" pattern. The viewer's analytical brain fatigues. Suggest inserting breathing footage, an atmospheric illustration, or a grounding AI scene between MG clusters.
- More than 2 consecutive `[ILLUST:]` or `[AI-GEN:]` entries — these registers fatigue faster than MG because their stylized quality is more demanding on attention.
- More than 30 seconds of continuous `[FOOTAGE:]` without a visual change — the viewer starts watching footage instead of listening to narration. Suggest a cut, an overlay, or an MG insert.
- Beats that are all one mode — a beat entirely in `[MG:]` feels like a presentation; a beat entirely in `[FOOTAGE:]` feels like a documentary without analysis. Flag single-mode beats and suggest where to introduce contrast.

**Unsourceable footage calls.** For every `[FOOTAGE:]` entry, apply the "would a stock photographer have filmed this?" test from FOOTAGE_SOURCING.md. Flag entries that describe abstract concepts as footage — "footage of supply chain complexity," "footage of technology denial," "footage of economic integration." For each, suggest the appropriate alternative:
- If the concept needs the viewer to *understand data* → `[MG:]` with the right Remotion template
- If the concept needs the viewer to *feel something* → `[ILLUST:]` atmospheric illustration
- If the concept describes a physical space cameras can't access → `[AI-GEN:]`

**Sourcability warnings.** Flag `[FOOTAGE:]` entries that fall into the "Hard to Source" category from FOOTAGE_SOURCING.md (named individuals, specific facilities, classified tech, corporate branding). These aren't wrong — they just need the producer to know they'll require extra effort. Note the difficulty and suggest a fallback if the footage can't be found.

**Layered composition quality.** For `[LAYERED:]` entries, check:
- Is the MG overlay simple enough? Full charts, dense frameworks, or multi-element graphics compete with footage for attention. Only single stats, labels, highlights, or brief typography should be layered over footage.
- Is the footage visually calm enough? Layering a stat over dramatic, fast-moving footage means the viewer can't read either. The footage should be relatively static (aerial slow-pan, held shot, ambient texture).

**Beat cadence check.** For each beat, check whether it roughly follows the establish-analyze-breathe-climax-land pattern from VISUAL_LANGUAGE.md. Not every beat must follow this exactly, but flag beats that are strikingly unvaried — all footage or all MG from start to finish.

**Visual rhythm map.** If a visual-concept audit already exists for this script (check the episode folder for `visual-concept-audit.md`), reference its rhythm map rather than re-deriving one — visual-concept is the authoritative source for visual rhythm analysis. In that case, summarize the key rhythm findings from visual-concept and note any *new* rhythm issues created by narration patterns that visual-concept wouldn't catch (e.g., a narration-level pacing sag that makes an already-dense MG section feel even longer).

If no visual-concept audit exists, generate the rhythm map yourself using this format:

```
Beat 1: [F 10s] [MG:Title 3s] [F 15s] [MG:Chart 8s] [ILLUST 6s] [F 8s]  ✅ varied, 3 registers
Beat 2: [MG:Map 12s] [MG:Chart 8s] [MG:FW 10s] [MG:Typo 4s]  ⚠️ all Analytical — needs register break
Beat 3: [F 25s] [F 15s] [F 10s]  ⚠️ 50s footage without MG — analysis feels absent
Beat 4: [MG:Chart 8s] [AI-GEN 7s] [ILLUST 5s] [MG:FW 10s]  ✅ register variety
```

**Visual density annotations (`PACE:`) check.** If the script uses `PACE:` annotations, verify:
- Total PACE changes are 2-4 per episode (more than 4 fragments the rhythm rather than shaping it)
- `PACE: breathing` appears on at least one emotional peak or philosophical pause (if the script has these moments but no breathing pace, flag as a missed opportunity)
- `PACE: urgent` is only used on genuine tension sequences, not routine analytical sections
- PACE changes align with narrative structure (e.g., breathing at act breaks, urgent during crisis escalation) rather than being randomly scattered
- If no PACE annotations exist, note this as informational — they're optional but recommended for scripts with clear tempo shifts

### Lens 7: Decoder Posture Check

This lens operationalizes the narrative rules NAR-09 through NAR-16 from the Editorial Playbook. The core question: **is this script interesting, bold, and intellectually honest?** Note: "decoder" posture is about *engagement quality*, not about avoiding all context or hedging every claim. Context that creates wonder is good. Strong positions defended with evidence are good. The enemy is boring, not bold.

**Explainer signals to flag:**
- Context-setting that *lectures* rather than *creates curiosity*. The problem isn't context per se — it's context delivered as "let me catch you up" rather than "here's something remarkable." "A fab — a fabrication plant — is where chips are physically made" is lecture. "Buildings that cost tens of billions of dollars, where the air is a thousand times cleaner than a hospital operating room" is context-as-wonder. Flag the former, praise the latter. (Playbook: NAR-09)
- Any opening that doesn't establish stakes or tension within the first ~150 words (~60 seconds). Stakes can be intellectual ("here's a puzzle no one is asking"), personal ("this affects the phone in your pocket"), or provocative ("$165 billion, and it made the problem worse"). Check: by word 150, does the viewer have a reason to keep watching? (Playbook: NAR-10)
- Framework introductions that define-then-apply rather than apply-then-name. Deductive framing ("Let's look at this through game theory...") is lecture; inductive framing (walk through the analysis, name the framework after the viewer has already done it with you) is decoder. (Playbook: NAR-09)
- Missing checkpoint beats. If the script goes longer than ~750 words (~5 minutes) without a consolidation moment, flag it. (Playbook: NAR-12)
- Wishy-washy conclusions. If the episode ends at "it's complicated" or "only time will tell" without a defensible analytical position, flag it. The viewer came for a perspective. (Playbook: NAR-14)

**Boldness signals to validate (good — note when present):**
- Strong analytical positions defended with evidence and transparent reasoning — the script arrives at a conclusion, not a shrug (Playbook: NAR-14)
- Productive mystery or withholding — showing a pattern before naming it, using tension to make the payoff land harder (Playbook: NAR-15)
- Cross-cultural analytical fluency — Chinese frameworks (势/shi, Tianxia, Legalist thought) deployed as genuine analytical tools alongside Western ones, not as decoration (Playbook: NAR-16)
- Cold open that uses one of the 6 hook types: stakes-shock, diaristic, news-anchor + assumed prep, framework-promise, track-record callback, provocation/dare
- Named conceptual product — a 2-3 word portable idea the viewer can carry away (Playbook: NAR-11)
- "Hidden structure" framing — the script promises to reveal a pattern, not explain a topic
- Viewer positioned as co-investigator ("once you see this pattern...") rather than student ("to understand this, we need to...")

**Toxin-line check (Playbook: NAR-13):**
The toxin line is an *honesty test*, not a boldness limiter. Scan for:
- Historical analogies used as conclusions rather than hypotheses (missing "where this analogy breaks" for any major parallel)
- Hidden-agent causation — "what they don't want you to know" / "the real reason" / claims that require believing specific people coordinated in secret
- Unfalsifiable totalizing claims, even if hedged with performed humility
- Analogy without named breakdown: every historical parallel must have at least one explicit way it could fail
But do NOT flag: strong structural arguments ("export controls are likely to fail because X, Y, Z"), surprising framework applications that are well-defended, or analytical boldness that names its reasoning transparently. The line is between structural analysis and imputed secret intent.

For each flagged item, provide the specific text, whether it's an explainer signal or a toxin-line issue, and a concrete rewrite.

### Lens 8: Connection Density

This lens checks whether the script delivers on the knowledge-density promise from the research brief. Cross-domain connections are the core product; this lens verifies they're present, surprising, and well-distributed.

**What to count:**
- Identify every cross-domain connection in the script — a moment where the narration links the current topic to a different domain (historical period, philosophical framework, civilization, scientific concept, literary reference, game-theoretic model).
- For each connection, note: (a) the domain, (b) whether it's genuinely surprising to an educated viewer or obvious, (c) how much script space it gets (a passing mention vs. a developed parallel).

**What to check:**
- **Count:** Are there at least 2-3 developed cross-domain connections? If the script relies on a single parallel (even a good one), it lacks the knowledge density that makes the content feel electric. Flag scripts with fewer than 2 developed connections.
- **Surprise level:** For each connection, apply the "would an educated viewer already know this?" test. Connections like "empires rise and fall" are obvious. Connections like "Venice's Murano glass monopoly has the same island-concentration logic as TSMC" are surprising. Flag connections where the surprise level is low and suggest more unexpected alternatives if the brief provides them.
- **Distribution:** Are the connections clustered in one beat or spread across the script? A script that front-loads all its historical parallels in Beat 2 and then runs on pure analysis for 10 minutes has a distribution problem. Connections should reward the viewer throughout.
- **Brief utilization:** If the research brief surfaced 4-5 connections and the script only uses 1, flag the unused connections and ask whether any of the dropped ones would strengthen weak beats.

**Output format:**
```
Connection map:
1. [connection] — domain: [X] — surprise: HIGH/MED/LOW — developed/passing — Beat [N]
2. [connection] — domain: [X] — surprise: HIGH/MED/LOW — developed/passing — Beat [N]
...

Total: [N] connections ([N] developed, [N] passing)
Distribution: [even / front-loaded / clustered in Beat X]
Brief utilization: [N] of [N] brief connections used
Verdict: DENSE / ADEQUATE / THIN
```

If the verdict is THIN, suggest specific connections from the brief that could be woven into weak beats, with a concrete placement suggestion for each.

### Lens 9: Psychological Architecture

This lens checks whether the script's structure is built to satisfy viewers under ambient uncertainty — not just intellectually, but emotionally and motivationally. The audience is educated, curious, and operating under real-world cognitive load. The source material is `project/psychology/SYNTHESIS.md`.

**Cold open four-beat structure.** The opening must complete all four beats before any substantive content arrives. Check for each:
1. **Schema activation** — a familiar concept, situation, or belief the viewer already holds is named or evoked (the mental model the episode will complicate)
2. **Violation** — that schema is immediately disrupted: a paradox, a counterintuitive finding, a contradiction the viewer hasn't resolved. This creates the information gap.
3. **Narrowing** — the scope of the question contracts to something tractable. Generic complexity (what does this all mean?) sharpens into a specific puzzle (why did X happen despite Y?)
4. **Solvability promise** — explicit signal that the episode will close the gap: a named framework, a named mechanism, or a direct "here's what we're going to untangle"

If any beat is missing, flag it and write a suggested rewrite. The most common failure: opening with a schema violation but skipping the narrowing and solvability promise, leaving the viewer in anxiety without a promised resolution path.

**Emotional arc integrity.** Map the script against the intended arc:
- Surveillance/anxiety (beginning): viewer feels the problem is real and personally relevant
- Inquiry (early-middle): analytical engagement; the investigation is underway and tractable
- Micro-resolutions (middle): sub-questions answered, building toward the larger frame — each beat should offer partial closure
- Restored efficacy + forward curiosity (close): viewer leaves feeling more capable, not more confused or resigned

Flag deviations: an episode that stays in anxiety too long without pivoting to inquiry produces dread and disengagement. An episode that resolves too quickly without sufficient anxiety phase feels trivial. An episode that ends in a second anxiety spike (new threat introduced without a resolution beat) destroys the subscribe-and-return motivation.

**Anger/anxiety activation check.** This is the most important single flag in this lens. Read every passage that assigns causation to specific actors' intent, coordination, or hidden motives. Ask: is this structural analysis (incentives, constraints, game-theoretic payoffs) or agency-attribution (what they planned, what they don't want you to know, the real reason)?

- **Anxiety-producing framing** (productive): "The incentive structure makes defection rational regardless of what either side wants." "Even a cooperative actor would face this constraint." → Activates surveillance system → viewer seeks more information, updates beliefs.
- **Anger-producing framing** (epistemically risky): "China is deliberately undermining..." / "The establishment wants you to think..." / "Washington's real agenda is..." → Activates disposition system → viewer seeks confirmation, closes to counterargument.

Flag any passage where the emotional activation is plausibly anger rather than anxiety. This is the toxin-line test for the psychological dimension — it compounds with Lens 7 (Decoder Posture). Provide a rewrite that preserves the analytical point while shifting causation from intent to structure.

**Assertive calibration language.** Scan for hedging language that reads as intellectual weakness rather than honest uncertainty: "maybe," "perhaps," "it's complicated," "we might see," "some people think," "it's hard to say." These are not calibrated — they're diffuse.

Flag each instance. For each, check: is this a genuine uncertainty or is the writer hiding behind vagueness? If genuine, rewrite using assertive calibration: "The most defensible reading is..." / "What the evidence supports strongly is..." / "What remains open is..." / "The highest-uncertainty variable is..." / "Three developments would change this assessment." If not genuine (just hedging that could be stated plainly), flag it as a claim that should be made directly.

Distinguish from deliberate uses of uncertainty that enhance credibility — a single well-framed "we don't yet know X, but here's how to think about it when the data comes in" is excellent. The problem is habitual hedging where no landing position is ever offered.

**Bounded verdict close.** Check that the ending section contains all three elements:
1. **Best current reading** — a specific, defensible analytical position stated directly (not a restatement of the complexity)
2. **Confidence boundary** — what the position depends on; what would have to be true for this reading to be wrong
3. **Watchpoints** — 2-3 concrete, observable signals the viewer can track to know whether the analysis is aging well

If any element is missing, flag it and write the missing piece. Common failure: strong best-current-reading but no watchpoints, leaving the viewer with a position but no way to verify it over time. This is what separates analysis from assertion — watchpoints are the accountability mechanism.

**Output format:**

```
Cold open: PASS / FAIL
  Beat 1 (schema): [present/missing]
  Beat 2 (violation): [present/missing]
  Beat 3 (narrowing): [present/missing]
  Beat 4 (solvability): [present/missing]

Emotional arc: [intact / deviation at beat N: describe]
  Longest anxiety section without pivot: [~N words / ~N min]
  Episode close: [restored efficacy + forward curiosity / lingering dread / resignation]

Anger/anxiety check: [CLEAN / N flags]
  [Each flagged passage with rewrite]

Assertive calibration: [N hedging instances]
  [Each flagged phrase with rewrite]

Bounded verdict: PRESENT / PARTIAL / ABSENT
  Best current reading: [present/absent]
  Confidence boundary: [present/absent]
  Watchpoints: [present/absent / count]
```

---

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

## Lens 7: Decoder Posture
[Explainer signals flagged. Decoder signals validated. Toxin-line check. Cold-open type assessment.]

## Lens 8: Connection Density
[Connection map. Count, surprise level, distribution, brief utilization. Verdict.]

## Lens 9: Psychological Architecture
[Cold open four-beat check. Emotional arc map. Anger/anxiety flags with rewrites. Assertive calibration flags. Bounded verdict close check.]

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
- **Weight the lenses correctly.** Lenses 1-4 are about whether the script is *interesting*; Lens 5 is about whether it's *accurate*; Lens 6 is about whether it's *producible and visually compelling*; Lens 9 is about whether it *satisfies the viewer psychologically*. Lenses 1-4 should get ~55% of the report's attention; Lens 9 ~15%; Lens 6 ~15%; Lens 5 ~10%; Lenses 7-8 ~5% combined. A script that leaves the viewer in unresolved anxiety or relying on anger activation will underperform regardless of how interesting or accurate it is.

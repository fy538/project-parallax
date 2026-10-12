---
name: script-audit
description: >
  Audit a video script for narrative quality across 10 lenses: broken transitions, lecture patterns, missing human moments, pacing problems, unverified claims, visual layer quality, decoder posture, connection density, psychological architecture, and frontstage rigor density. Produces specific issues with locations and suggested rewrites. Use whenever someone asks to 'review the script', 'audit the script', 'check my script', 'does this flow', 'is this engaging', 'what's wrong with this draft', or when a new script version needs quality verification. This evaluates craft quality — distinct from persona-eval (audience fit) and visual-concept (visual feasibility). Always run after script-draft, before review-package.
---

# Script Audit

You are auditing a video narration script for narrative quality and visual layer health. Your job is to read the script carefully and run ten independent audit lenses, then produce a consolidated report with specific issues, locations, and suggested rewrites.

## Context

These scripts are for a YouTube/Bilibili channel that analyzes contemporary questions through historical analogy and philosophical frameworks. Since Oct 2026 the focus is AI alignment, ethics, and philosophy; earlier episodes are geopolitics. Judge each script against its own subject: an alignment/ethics essay is not penalized for lacking a geopolitical case, but it still needs developed cross-domain connections (Lens 8), a committed position, and an argument that faces its hardest case, not its easiest. The tone target is "smart friend explaining something fascinating over drinks" — intellectually rigorous but narratively engaging. The audience is educated adults (25-44) who read Foreign Affairs and listen to Lex Fridman. They will click away if the script feels like a lecture.

The single most important quality criterion: **is this interesting?** A script can be factually impeccable and structurally logical and still fail if it doesn't sustain tension and curiosity throughout.

## Doctrine: Backstage Maximum, Frontstage Confident

This skill owns the **frontstage voice** half of the Parallax editorial doctrine (see [`episodes/EDITORIAL_PLAYBOOK.md`](../../episodes/EDITORIAL_PLAYBOOK.md) → Core Doctrine). research-audit is responsible for backstage rigor — every quote, date, number, and named source verified before scripting begins. By the time a script reaches you, that work is done. Your job is to make sure the script *acts like it's done* — confident voice, vivid metaphor, bounded analogies that name their limits in one sharp clause and move on, no hedge stacking, no verification-process narration, no false-consensus smoothing of contested claims.

The doctrine resolves a tension that wrecks credibility-driven channels: maximum rigor that bleeds into the script reads as flat or evasive (the failure mode this skill catches); confident voice that skips backstage work reads as Jiang Xueqin (the failure mode research-audit catches). Lens 10 specifically guards the frontstage half.

## Inputs

1. **The script file** (required) — the narration script to audit
2. **The brief/verification table** (optional) — if an episode brief exists in the same folder, use it for the claim audit lens. Look for files named `brief.md` or files containing verification tables.
3. **Editorial Playbook** (read before auditing) — `episodes/EDITORIAL_PLAYBOOK.md` contains channel-level production rules extracted from past episodes. Read Sections 1 (Narrative Structure) and 2 (Visual Production) before running your lenses. When you find an issue that matches a playbook rule, cite it as "Playbook: [rule ID]" in your report — this helps Tiger see which patterns are recurring vs. new. If you find an issue that *should* be a playbook rule but isn't, flag it as "Candidate Rule" in your report.
4. **Learning Log** (read if it exists) — `episodes/LEARNING_LOG.md` contains post-publish analytics findings. If available, check whether any of your findings were already identified in a previous episode's retrospective — this tells Tiger whether a pattern is persisting despite being known.

## Run the mechanical lint first

Before the lenses, run `python3 tools/lint/script_lint.py <script>` and fold its findings into the report instead of re-deriving them. It covers the deterministic parts of Lenses 2, 6, 9 and 10: lecture signposts, Level-3 hedge phrases, hedge density, verification-process narration, deny-then-pivot constructions ("That doesn't X. It Y."), deprecated `cut()` types, iris overuse, `color-wash` tokens, invalid `PACE:` values, and `[MG:]` runs. Spend your own attention on judgment: transitions, human moments, pacing, claims, connection density, psychological architecture, and whether the argument itself holds (e.g. an example that is easy to verify standing in for cases that are not).

If the file is not two-column and has no `DIR:`/`PACE:`/mode tags, say so up front, skip Lens 6, and note the script needs conversion before visual-spec.

## The Ten Lenses

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

**Premise and concreteness check (added Oct 2026):**
- *Premise audit.* List sentences that state what the viewer thinks, feels, or does. They are assumptions about the viewer's life, not facts. Flag each as "confirm with Tiger" and suggest a version that starts from a situation the viewer has actually been in (e.g. asking an AI whether their startup idea is good, not whether a rash diagnosis "means it").
- *Abstract subjects.* Flag sentences whose subject is an idea ("that question," "the structure," "the engine") with no person or object nearby, and rewrite them with someone doing something.
- *Two claims in one sentence,* and claims that don't open from a small thing the listener can nod to.
- *Say-it-over-a-drink.* Flag lines that would sound like a lecture if spoken to a friend.

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

Applies only to two-column production scripts (right-hand visual column). Narration-only or spoken-draft essays: skip and say the script needs conversion before visual-spec.

**Read `references/lens-6-visual-layer.md` before running this lens.** It covers mode balance targets, the three-register check, transition grammar, mode monotony, unsourceable footage, layered composition, backdrop coverage, PACE annotations, text-animation register, concept callbacks, hold-motion register and transition-grammar overrides. The mechanical parts (deprecated `cut()` types, iris count, `color-wash` token, invalid `PACE:`, `[MG:]` runs) are already reported by `script_lint.py` — don't re-derive them.

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

Audits the six psychology-grounded requirements in `project/SCRIPT_FORMAT.md` and `project/CALIBRATION_LANGUAGE.md`: cold-open 4-beat structure, `[FRAMEWORK UNLOCK]`/`[MAIN REVEAL]` timing, anxiety-to-inquiry conversion before midpoint, causal framing (structure vs hidden agents), Level-3 calibration language, bounded verdict close (4 elements), title confidence, target-behavior close, and `[FORECAST:]` completeness.

**Read `references/lens-9-psychological-architecture.md` before running this lens** — it holds the checks, the Level-3 phrase table and the required output block. Level-3 phrase detection is covered by `script_lint.py` (S-HEDGE-L3); you supply the rewrites.

### Lens 10: Frontstage Rigor Density

Guards the frontstage half of the doctrine: backstage rigor must not leak into the voiceover as layered hedging, false-consensus/false-dispute framing, or verification-process narration, and hedge density should stay under ~15% of declarative sentences. Validate bounded-analogy moves (one sharp clause naming where an analogy breaks) rather than flagging them.

**Read `references/lens-10-frontstage-rigor.md` before running this lens** — it holds the four failure modes, what to validate, and the output block. `script_lint.py` reports S-VERIFY-NARRATION and S-HEDGE-DENSITY; you judge layered hedging and consensus framing.


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
[Cold open 4-beat check. [FRAMEWORK UNLOCK] / [MAIN REVEAL] timing. Anxiety-to-inquiry conversion. Anger/anxiety framing flags. Assertive calibration scan. Bounded verdict close element count. Title confidence check. Target behavior alignment. [FORECAST:] tag completeness. Verdict: PASS / NEEDS WORK.]

## Lens 10: Frontstage Rigor Density
[Layered hedging instances. False-consensus / false-dispute framing. Verification-process narration. Hedge density percentage. Bounded-analogy moves validated. Verdict: STRONG / DISCIPLINED / OVER-HEDGED.]

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
- **Weight the lenses correctly.** Lenses 1-4 are about whether the script is *interesting*; Lens 5 is about whether it's *accurate*; Lens 6 is about whether it's *producible and visually compelling*; Lens 9 is about whether it's *psychologically engineered to build an audience*; Lens 10 is about whether the script *trusts its own backstage rigor* and reads with confident voice rather than hedge-laden caution. Lenses 1-4 should get ~50% of the report's attention, Lens 9 ~15%, Lens 6 ~15%, Lens 10 ~10%, and Lenses 5, 7, 8 ~10% combined. Lens 9 failures are architectural — they require restructuring beats, not just rewriting sentences. Lens 10 failures are tonal — usually fixable with sentence-level rewrites, but their cumulative effect on viewer experience is large.

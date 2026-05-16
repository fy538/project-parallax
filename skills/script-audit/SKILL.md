---
name: script-audit
description: >
  Audit a video script for narrative quality across 10 lenses: broken transitions, lecture patterns, missing human moments, pacing problems, unverified claims, visual layer quality, decoder posture, connection density, psychological architecture, and frontstage rigor density. Produces specific issues with locations and suggested rewrites. Use whenever someone asks to 'review the script', 'audit the script', 'check my script', 'does this flow', 'is this engaging', 'what's wrong with this draft', or when a new script version needs quality verification. This evaluates craft quality — distinct from persona-eval (audience fit) and visual-concept (visual feasibility). Always run after script-draft, before review-package.
---

# Script Audit

You are auditing a video narration script for narrative quality and visual layer health. Your job is to read the script carefully and run ten independent audit lenses, then produce a consolidated report with specific issues, locations, and suggested rewrites.

## Context

These scripts are for a YouTube/Bilibili channel that analyzes geopolitics through historical analogy and philosophical frameworks. The tone target is "smart friend explaining something fascinating over drinks" — intellectually rigorous but narratively engaging. The audience is educated adults (25-44) who read Foreign Affairs and listen to Lex Fridman. They will click away if the script feels like a lecture.

The single most important quality criterion: **is this interesting?** A script can be factually impeccable and structurally logical and still fail if it doesn't sustain tension and curiosity throughout.

## Doctrine: Backstage Maximum, Frontstage Confident

This skill owns the **frontstage voice** half of the Parallax editorial doctrine (see [`episodes/EDITORIAL_PLAYBOOK.md`](../../episodes/EDITORIAL_PLAYBOOK.md) → Core Doctrine). research-audit is responsible for backstage rigor — every quote, date, number, and named source verified before scripting begins. By the time a script reaches you, that work is done. Your job is to make sure the script *acts like it's done* — confident voice, vivid metaphor, bounded analogies that name their limits in one sharp clause and move on, no hedge stacking, no verification-process narration, no false-consensus smoothing of contested claims.

The doctrine resolves a tension that wrecks credibility-driven channels: maximum rigor that bleeds into the script reads as flat or evasive (the failure mode this skill catches); confident voice that skips backstage work reads as Jiang Xueqin (the failure mode research-audit catches). Lens 10 specifically guards the frontstage half.

## Inputs

1. **The script file** (required) — the narration script to audit
2. **The brief/verification table** (optional) — if an episode brief exists in the same folder, use it for the claim audit lens. Look for files named `brief.md` or files containing verification tables.
3. **Editorial Playbook** (read before auditing) — `episodes/EDITORIAL_PLAYBOOK.md` contains channel-level production rules extracted from past episodes. Read Sections 1 (Narrative Structure) and 2 (Visual Production) before running your lenses. When you find an issue that matches a playbook rule, cite it as "Playbook: [rule ID]" in your report — this helps Tiger see which patterns are recurring vs. new. If you find an issue that *should* be a playbook rule but isn't, flag it as "Candidate Rule" in your report.
4. **Learning Log** (read if it exists) — `episodes/LEARNING_LOG.md` contains post-publish analytics findings. If available, check whether any of your findings were already identified in a previous episode's retrospective — this tells Tiger whether a pattern is persisting despite being known.

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

**Visual mode balance.** Count all mode tags (`[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`, `[AI-GEN:]`, `[ILLUST:]`, `[SCENE:]`, `[ARCHIVAL:]`) across the full script. Calculate approximate screen time percentages. Check against target ranges:
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

**Backdrop coverage (`[BACKDROP: id]`) check.** Per-segment editorial backdrops drive the FilmOverlay film-treatment cascade (see SCRIPT_FORMAT.md → `[BACKDROP:]`). Each backdrop in `backdrop-manifest.json` declares its own `recommendedPreset`, so the right backdrop choice silently resolves preset/effects/intensity. Audit:
- Are P1 / register-transition / emotional-peak moments tagged with `[BACKDROP: id]`? Flag P1 segments that have no backdrop *and* no clear reason (e.g., maps and full-screen kinetic typography sometimes legitimately don't need one).
- Does the script use *too many different* backdrops? Anti-pattern: every cell has a different backdrop. The cascade is most effective when one backdrop covers an editorial arc (3-5 connected cells). Flag if more than ~8 distinct backdrop ids appear in a 12-14 min episode.
- Is the script using `[OVERLAY: preset]` correctly — only as a rare per-segment override on editorial peaks? If `[OVERLAY:]` appears more than ~3 times in an episode, the script writer is using it as a substitute for `[BACKDROP:]`. Flag and suggest the backdrop-driven cascade is the right primary mechanism.
- Confirm that if any `[BACKDROP:]` / `[OVERLAY:]` tags appear, the visual-spec stage will need to set `manifest.filmOverlay: { preset: ... }` to opt the episode into the system. (Not a script-level issue but worth noting in the audit for handoff.)

**Visual density annotations (`PACE:`) check.** If the script uses `PACE:` annotations, verify:
- Total PACE changes are 2-4 per episode (more than 4 fragments the rhythm rather than shaping it)
- `PACE: breathing` appears on at least one emotional peak or philosophical pause (if the script has these moments but no breathing pace, flag as a missed opportunity)
- `PACE: urgent` is only used on genuine tension sequences, not routine analytical sections
- PACE changes align with narrative structure (e.g., breathing at act breaks, urgent during crisis escalation) rather than being randomly scattered
- If no PACE annotations exist, note this as informational — they're optional but recommended for scripts with clear tempo shifts

**Text-animation register check.** When the script tags `[MG:] KineticTypography` cells, verify the implicit text-animation register matches the content's editorial role. The doctrine is in `project/TEXT_ANIMATION_REGISTER.md`. For audit purposes, walk each KineticTypography cell and flag these specific patterns:

- **A quote variant with a real, named attribution** (Nash, Morris Chang, Schmidt, Schelling, Sullivan, etc.) should be tagged or specified to use the `quote-attribution` composite pattern (Typewriter + serif-italic attribution). If the script doesn't explicitly say so via `DIR: type(quote-attribution)` or visual-spec doesn't appear to be picking it up, flag as: "Named-attribution quote — consider tagging `DIR: type(quote-attribution)` so visual-spec emits the typewriter register; otherwise the channel-voice default applies and the quote loses its archival/transcribed feel."
- **A quote variant with NO named attribution** (i.e., channel-voice text styled as a "quote" for emphasis, e.g., "Cooperation isn't a miracle. It's designed.") — should NOT use `quote-attribution`. This is the most common misuse. Flag if the script tags `DIR: type(quote-attribution)` (or similar) on a channel-voice quote: "Channel-voice statements aren't transcribed speech — typewriter register implies a named speaker. Use `[MG:] KineticTypography variant=\"quote\"` with the word-cascade default; or, if the line is the episode's editorial pivot, consider switching it to a definition variant or a stat-caption."
- **A definition variant introducing a foreign term** (any cell where `term`, `termPinyin`, `termTranslation` would be set — typically `卡脖子`, `举国体制`, or any non-English term being defined) should use `definition-reveal`. If the script writer authored a cell for the term but didn't request the composite, flag: "Foreign-term introduction — `DIR: type(definition-reveal)` would lift this from a generic word reveal into the canonical Parallax definition pattern (term + pinyin + translation choreography)."
- **A statistic variant with a hero number** (cell with `statValue` set) should use `stat-caption`. Same flag logic — recommend tagging.

**Concept-callback check (cross-episode continuity).** When the script references a term that was introduced in a PRIOR Parallax episode (per `data/concepts.json`), the second-and-later renderings should be tagged with `DIR: type(<technique>, callback)` so visual-spec sets `_direction.isCallback: true`. The callback pulse is a compounding-production lever: every recurring concept gets a subtle "you've seen this before" cue at zero cost.

To run this check: use the concept-registry CLI to look up each term in the current script. For each match where `introduced.episode` is NOT the current episode, flag the callback opportunity:
```
python3 tools/concepts/lookup.py callback-check --term "卡脖子" --episode <current-slug>
```
The CLI returns JSON: `{ isCallback: true|false, conceptId, accentColor, introducedIn, currentEpisode }`. If `isCallback: true`, flag the rendering moment in the script audit as: "Concept callback opportunity — add `DIR: type(<technique>, callback)` so the term pulses on arrival per the cross-episode continuity register (TEXT_ANIMATION_REGISTER.md § Tier 1.B)."

**Anti-pattern — over-use of dramatic text registers.** Reserve the high-energy techniques for editorial peaks. If the script has more than ~2 `DIR: type(scramble)` or more than ~3 `DIR: type(reveal-mask)` invocations in a single episode, flag as register-creep: "These techniques are register signals; using them frequently drifts toward spy-thriller or theatrical territory. Reserve for the highest-weight moments."

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

This lens audits against the six psychology-grounded requirements documented in `project/SCRIPT_FORMAT.md` (Psychological Architecture section) and `project/CALIBRATION_LANGUAGE.md`. These are non-negotiable structural requirements derived from NFC, AIT, Information Gap Theory, narrative transportation, and superforecasting research — not stylistic preferences.

**Cold open 4-beat structure:**
Verify the cold open completes all four beats within the first 60 seconds, in order:
1. Schema — activates a prior belief the viewer already holds
2. Violation — disrupts it with a single concrete contradiction
3. Narrowing — reduces to one closeable question
4. Solvability promise — signals the route to closure without giving the answer

Flag any beat that is missing or out of order. Narrowing without a solvability promise is the most common failure — it creates diffuse anxiety rather than directed curiosity. The solvability promise does not give away the answer; it promises the path exists.

**Structural markers — [FRAMEWORK UNLOCK] and [MAIN REVEAL]:**
- Does the script contain `<!-- [FRAMEWORK UNLOCK] -->` in a beat header? If yes, check that it falls at or before 40% of the total episode runtime (e.g., before 6:00 in a 15-minute episode). If it falls later, the information gap stays open too long — curiosity converts to impatience. If absent entirely, flag.
- Does the script contain `<!-- [MAIN REVEAL] -->` in a beat header? Check that at least one analytical beat *before* this marker establishes why the obvious explanation fails. The main reveal should land on already-prepared ground. If the [MAIN REVEAL] is the first beat to challenge the conventional framing, it's doing too much work alone.

**Anxiety-to-inquiry conversion before midpoint:**
Affective Intelligence Theory research shows that anxiety (surveillance system) produces careful processing and openness to updating — but only if converted to inquiry before it tips into dread. Check: is there a beat before the episode midpoint that transforms the initial disorientation/unease into a directed question the viewer wants answered? If the episode reaches its midpoint and the viewer is still in pure disorientation without a sense of trajectory, the anxiety hasn't been converted.

**Anger vs. anxiety framing (causal framing audit):**
For every "X happened because..." or "they did this because..." clause in the narration, the completion should name a mechanism, incentive structure, feedback loop, or structural pressure — NOT a coordinated hidden-agent decision. "The structural incentives produced this outcome" → anxiety (productive). "They planned this to happen" → anger (epistemically risky and credibility-costly).

Flag any causal claim that requires believing specific people coordinated in secret. These are not just toxin-line violations — they also activate the anger system and produce audiences that punish rather than analyze. Suggest a structural reframe for each flagged instance.

**Assertive calibration — no Level 3 vague uncertainty:**
Scan every speculative or predictive passage for Level 3 vague phrases from CALIBRATION_LANGUAGE.md:

| Flag | Problem |
|------|---------|
| "Maybe..." / "Perhaps..." | Unanchored — gives no structural information |
| "It's complicated" | Analytical abdication |
| "Who knows" / "Only time will tell" | Exit state — destroys forward pull |
| "There are arguments on both sides" | No analytical content |
| "This could go either way" | Equivalent to "who knows" |
| "I'm not sure but..." | Self-doubt as preamble |

For each flagged phrase, provide a Level 2 rewrite (verbal calibration with explicit boundary) or Level 1 rewrite (quantified probability with rationale) as appropriate. Also verify: is the outside view (base rate) stated before the inside view (case-specific reasoning) in any passage that makes a predictive claim?

**Bounded verdict close — all four elements:**
The episode close must deliver all four elements:
1. Best current reading — one defensible analytical position, stated confidently
2. Confidence boundary — explicit statement of what the analysis cannot establish
3. Watchpoints — 2-3 specific observable developments the viewer can track
4. Reflection trigger — a closing question or reframe prompting the viewer to apply the framework to their own mental model

Flag any element that is missing. The reflection trigger (element 4) is the most commonly absent — it's what makes post-episode memory and self-relevant reflection persist beyond the viewing session, which transportation research shows mediates belief change more than in-episode narration alone. A close that ends on element 3 (watchpoints) without a reflection trigger leaves the viewer as observer rather than participant.

**Title confidence check:**
If working titles are specified in the angle memo or script header, check: does any title make a stronger claim than the bounded verdict the episode actually delivers? A title that implies certainty ("How China Will Win the Chip War") attached to an episode that concludes with genuine uncertainty violates the implicit promise and damages trust when the viewer reaches the close. Flag mismatches and suggest a title-level fix (not a conclusion-level fix — the conclusion's epistemic honesty is correct; the title needs to match it).

**Target behavior check:**
Does the angle memo or episode close identify a target viewer behavior (subscribe / share / return visit)? If yes, check whether the closing beat's emotional state is designed for that target:
- Subscribe target → calm competence close (not urgency, not dread)
- Share target → high arousal close (awe, alarm, revelation that demands to be told to someone)
- Return visit → slight unfinished-question close (the series thread left open)

If the target behavior is "share" but the close is calm, or "subscribe" but the close is alarming, flag the mismatch.

**[FORECAST:] tag audit:**
For every `[FORECAST:]` tag in the script, verify all six layers are present:
1. PROBABILITY — whole number percentage
2. VERBAL TAG — anchored to the number, not replacing it
3. BASE RATE — outside view stated first
4. KEY DRIVER — single main case-specific factor
5. KEY DISCONFIRMER — evidence that would push the estimate opposite direction
6. BENCHMARK — a prediction market or comparable forecast, with one sentence on whether Parallax diverges and why

Also check: does the RESOLUTION line pass the clairvoyance test? (A hypothetical person with perfect knowledge of the future could unambiguously score this on the specified date.) Vague resolutions ("will China become more dominant?") fail; specific binary/binned resolutions ("will China achieve domestic EUV lithography at 7nm or below by January 2028?") pass. Flag missing layers and failed resolution tests.

**Output for this lens:**

```
Lens 9: Psychological Architecture

Cold open 4-beat: PASS / FAIL — [specific issue if fail]
[FRAMEWORK UNLOCK] timing: PASS / FAIL / ABSENT — [marker found at X% of runtime / missing]
[MAIN REVEAL] setup: PASS / FAIL / ABSENT — [setup beat present/absent]
Anxiety-to-inquiry conversion: PASS / FAIL — [conversion beat present at X% / absent]
Anger/anxiety framing: [N] causal claims checked — [N] structural, [N] flagged for hidden-agent framing
Assertive calibration: [N] Level 3 phrases found — [list phrases with rewrite suggestions]
Bounded verdict close: elements present: [1/2/3/4] — missing: [list missing elements]
Title confidence: PASS / FLAG — [description if flagged]
Target behavior: [subscribe / share / return / unspecified] — close designed for target: PASS / MISMATCH / UNSPECIFIED
[FORECAST:] tags: [N] tags — complete: [N], incomplete: [N] — [list missing layers and failed resolution tests]

Verdict: PASS / NEEDS WORK — [1-2 sentence summary of most critical psychological architecture issues]
```

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

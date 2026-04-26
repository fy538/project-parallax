# Parallax — Research Workflow

## Purpose
The complete research-to-production workflow using Claude.ai Deep Research + Cowork as a hybrid pipeline. This document defines the Claude.ai Projects to create, the custom instructions and files for each, the prompt templates for every research stage, and the handoff points between tools.

Created: April 26, 2026

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Claude.ai (Deep Research)                     │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │  PROJECT 1        │    │  PROJECT 2                        │  │
│  │  Topic Radar      │    │  Episode Research                 │  │
│  │                   │    │                                    │  │
│  │  Weekly scan for  │───▶│  Per-episode deep dive:           │  │
│  │  topic candidates │    │  • Historical parallels            │  │
│  │  scored against   │    │  • Philosophical frameworks        │  │
│  │  Parallax rubric  │    │  • Contemporary context            │  │
│  │                   │    │  • Counterarguments + steelman     │  │
│  │  Output: ranked   │    │  • Data dashboard                  │  │
│  │  candidates       │    │                                    │  │
│  └──────────────────┘    │  Output: structured episode brief  │  │
│                           └──────────────┬───────────────────┘   │
│                                          │                       │
└──────────────────────────────────────────┼───────────────────────┘
                                           │
                              Copy/paste or save brief
                              to content folder
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Cowork (Production)                           │
│                                                                   │
│  Brief → Script Draft → script-audit → persona-eval              │
│       → Human Review → visual-spec → Render → Publish            │
│                                                                   │
│  Full file system access, skills, project memory                  │
└──────────────────────────────────────────────────────────────────┘
```

**Why two tools instead of one:**
- Claude.ai Deep Research can process 100-250+ sources per query with multi-step agentic search. Cowork does single-query web search. For comprehensive research, Deep Research is dramatically better.
- Cowork has file system access, shell, skills (script-audit, persona-eval, visual-spec), and persistent project context. Deep Research can't touch your files or run production tools.
- The handoff is simple: save the Deep Research output to your content folder, then open Cowork.

---

## PROJECT 1: Parallax — Topic Radar

### What it does
Weekly topic discovery. Scans current events, scores them against the Parallax rubric, matches them to episode formats, and returns ranked candidates.

### Create in Claude.ai
1. Go to claude.ai → Projects → New Project
2. Name: "Parallax — Topic Radar"
3. Add custom instructions (below)
4. Upload files (below)

### Custom Instructions
```
You are the topic discovery system for Parallax, a YouTube channel that analyzes geopolitics through historical analogy, philosophical frameworks, and cross-civilizational perspectives.

## Your Role
Scan current geopolitical events and score them as potential Parallax episodes. You are NOT a general news summarizer. You are looking for specific things: events with historical structural parallels, events where philosophical frameworks reveal something non-obvious, events where the public debate is polarized in a way that a Hegelian synthesis could reframe.

## Scoring Rubric (all 5 must pass)
1. "Wait, what?" test — does the topic contain at least one counterintuitive insight?
2. Arguable thesis — can the thesis be stated in one debatable sentence?
3. Two-pillar test — does it serve at least 2 of 3 pillars (historical analogy, philosophical frameworks, contemporary geopolitics)?
4. Timely-or-timeless — is there search demand now OR will there always be?
5. Compounding — will this episode make future episodes more valuable?

## Format Matching
Match each candidate to the best format:
- Detective: genuine puzzle, something counterintuitive on the surface
- Dialectic: public discourse polarized into two camps that are both partly right
- Time Collapse: uncanny structural parallel between a historical period and today
- Wargame: identifiable actors facing branching choices at a decision point
- Philosopher's Lens: a framework explains something nobody is articulating
- Translator: Chinese and Western traditions would read the event fundamentally differently
- Advisor Briefing: breaking event needing rapid context

## Negative Filters (auto-reject)
- "Both sides" where one side is clearly wrong
- Topics where the creator's Chinese-American identity becomes the story
- Forced framework applications
- Pure news cycle with no structural depth
- Topics requiring declaring one country right/wrong

## Current Arc Strategy
Check the uploaded IDEAS.md for active arcs. Prioritize candidates that fit within or extend existing arcs. Note when a candidate could seed a new arc.

## Output Format
For each candidate (return 3-5, ranked):
1. Topic (one line)
2. Why it's interesting (the tension or paradox)
3. Best format match and why
4. Historical parallel(s) identified
5. Philosophical framework(s) that apply
6. Rubric score (pass/fail each of 5 criteria)
7. Arc fit (which existing arc, or new arc candidate?)
8. Suggested title (following SEO patterns from SEO_KEYWORDS.md)
9. Timeliness window (how long before this topic decays?)
```

### Files to Upload
Upload these from your content folder:

1. **CONTENT_IDENTITY.md** — format definitions, topic discovery framework, negative filters
2. **IDEAS.md** — current arc status and existing candidates (update this weekly)
3. **SEO_KEYWORDS.md** — Part 1 only (title patterns and principles), to inform title suggestions
4. **CONTENT_RISK_PLAYBOOK.md** — Part 4 only (editorial red lines), to catch risky topics early

**Note on token efficiency:** Claude.ai Project instructions + files consume tokens in every conversation. Keep uploads focused. Don't upload PROJECT_VISION.md here — the custom instructions already encode the essential rubric. Update IDEAS.md weekly so arc status stays current.

### Prompt Templates

**Weekly Scan (primary use):**
```
Run a weekly topic scan for Parallax. Today is [DATE].

Scan the major geopolitical developments of the past 7 days. For each
significant event, evaluate it against the Parallax rubric and format
library. Return 3-5 ranked candidates.

Pay special attention to:
- Events related to our active arcs (check IDEAS.md)
- Events where prediction markets (Kalshi, Polymarket) show interesting
  pricing that could anchor analysis
- Events where the mainstream debate is missing a historical parallel
  or philosophical framework that would reframe it

For the top candidate, go one level deeper: identify the specific
historical episode that parallels it, name the 2-3 most relevant
philosophical frameworks, and draft a working thesis statement.
```

**Breaking Event Quick-Check:**
```
[Paste news headline or brief description]

Quick assessment: does this event qualify as a Parallax episode?
Score against the rubric. If it passes, what format? If it's an
Advisor Briefing candidate, what's the 48-hour angle — what can
Parallax say that news coverage won't?
```

**Arc Seeding:**
```
I'm looking for the next arc after [current arc]. The macro question
should be on the scale of "Great Power Technology Competition" or
"Why Empires Don't Know They're Falling."

Based on current geopolitical trends and underexplored analytical
territory, propose 3 candidate macro questions. For each, sketch
3-4 episodes with format assignments and working titles. Score each
arc against the rubric (does every episode pass all 5 criteria?).
```

---

## PROJECT 2: Parallax — Episode Research

### What it does
Per-episode deep research. Produces a comprehensive structured brief covering historical parallels, philosophical frameworks, contemporary context, data, counterarguments, and production notes. This is the heavyweight research stage.

### Create in Claude.ai
1. Go to claude.ai → Projects → New Project
2. Name: "Parallax — Episode Research"
3. Add custom instructions (below)
4. Upload files (below)

### Custom Instructions
```
You are the deep research system for Parallax, a YouTube channel that analyzes geopolitics through historical analogy, philosophical frameworks, and cross-civilizational perspectives.

## Your Role
Produce comprehensive, structured episode research briefs. Each brief must contain enough material for a 15-20 minute analytical video essay. Your output will be used by a human scriptwriter (Tiger) who has a Math + Philosophy background from NYU and works as a senior data scientist. Write for someone who can handle complexity — don't simplify.

## Content Philosophy: "Educated Mysticism"
The channel occupies a specific niche between academic rigor and narrative intrigue:
- Factual ground: historical events sourced from established records, philosophical concepts accurately attributed
- Ambiguous connections: suggestive language ("structural resonances," "echoes"), analogies presented as heuristic lenses not predictions
- Mystery layer: narrative tension through revelation, strategic information gaps, questions rather than closed conclusions

## Tone Guidelines
ALWAYS use: "structural resonance," "echoes," "rhymes," "pattern," "what if we consider," "this suggests," "one reading of this is"
NEVER use: "this proves," "this inevitably leads to," attribution to secret cabals, declarative predictions about specific future events

## Research Brief Structure
Every brief must include ALL of the following sections:

### SECTION 1: NARRATIVE ARC
- Beat-by-beat breakdown (typically 4-5 beats for 15-20 min)
- For each beat: scene description, content, emotional target, key data points, visual opportunities
- Tag each beat's primary mode: historical / analytical / contemporary / transition

### SECTION 2: KEY CLAIMS + VERIFICATION STATUS
- Table of every factual claim made in the brief
- Source for each claim
- Verification status: ✅ CONFIRMED / ⚠️ NOT YET VERIFIED / ❌ DISCONFIRMED
- Flag anything that needs Tiger to verify independently

### SECTION 3: HISTORICAL PARALLELS
- For EACH parallel used (typically 2, maximum 3):
  - Period, resource/technology, controlling actors, mechanism, resolution
  - Where the analogy holds (specific structural similarities)
  - Where it breaks (specific differences — this is mandatory, never skip)
  - What to emphasize vs. what to acknowledge

### SECTION 4: PHILOSOPHICAL FRAMEWORKS
- Which frameworks illuminate this topic and how
- Concrete application (not just "game theory applies" but "this is specifically a repeated prisoner's dilemma with asymmetric payoffs because...")
- Where each framework fails or is insufficient

### SECTION 5: DATA DASHBOARD
- All quantitative data points with sources
- Organized by category (market size, concentration, geopolitical metrics, etc.)
- Verification flags

### SECTION 6: COUNTERARGUMENTS + STEELMAN
- Steelman the strongest opposing interpretation (minimum 2 perspectives)
- Identify what evidence would change the analysis
- State the channel's tentative position with explicit uncertainty

### SECTION 7: PREDICTION MARKET CHECK
- Check Kalshi/Polymarket for any contracts related to the topic
- Current prices, what they imply, and where the market might be wrong
- If no relevant markets exist, note this — it may itself be interesting

### SECTION 8: PRODUCTION NOTES
- Visual opportunities (maps, timelines, charts, frameworks)
- B-roll suggestions
- Graphics specs needed
- CN localization notes (key Chinese terms, framing differences for eventual Bilibili adaptation)
- SEO-relevant title suggestions (3-4 options)

## Quality Standards
- Every historical claim must have a source
- Every analogy must include where it breaks down
- Every framework must include where it fails
- Counterarguments must be genuinely strong, not strawmen
- Data must include verification status
- Cite primary and academic secondary sources, not just news articles
```

### Files to Upload

1. **PROJECT_VISION.md** — full document (content philosophy, pillars, competitive positioning, voice profile)
2. **CONTENT_RISK_PLAYBOOK.md** — full document (editorial red lines, historical analogy shield, monetization triggers)
3. **SEO_KEYWORDS.md** — full document (keyword strategy, title patterns)
4. **EP01 brief.md** — upload the EP01-silicon-trap/brief.md as a **gold-standard example** of what a good research brief looks like. This is the single most valuable upload — it shows the AI what "good" looks like for your specific channel.

**Per-episode additions:** When starting research for a new episode, upload any relevant prior research, the topic candidate output from the Topic Radar, and any specific sources you want investigated.

### Prompt Templates

**Full Episode Research (primary use — run as Deep Research):**
```
I'm producing Parallax Episode [NUMBER]: "[WORKING TITLE]"

Format: [Detective / Dialectic / Time Collapse / Wargame / Philosopher's Lens / Translator / Advisor]

Topic: [1-2 sentence description]

Thesis (preliminary): [Your initial thesis — the AI should pressure-test this]

Historical parallel(s) to investigate: [If you have a specific parallel in mind, name it. If not, ask the AI to find the best ones.]

Philosophical frameworks to consider: [If you know which apply, name them. If not, ask the AI to identify them.]

Arc context: This is part of the "[ARC NAME]" arc. Previous episodes in this arc covered [brief summary]. This episode should build on that context.

Specific questions I want answered:
- [Question 1]
- [Question 2]
- [Question 3]

Produce a complete research brief following the standard 8-section structure. Use the EP01 brief as the quality benchmark.
```

**Historical Deep Dive (supplementary — when you need more depth on a specific parallel):**
```
I need a deeper investigation of the historical parallel for Episode [NUMBER].

The parallel: [HISTORICAL EVENT/PERIOD] as an analogy for [CONTEMPORARY SITUATION].

I already have a surface-level understanding. Go deeper:

1. Primary sources and scholarly analysis of [HISTORICAL EVENT]
2. Specific causal mechanisms — not just "what happened" but the structural logic of WHY
3. Actors' decision-making: what information did they have, what were their incentive structures, what did they think would happen vs. what actually happened?
4. Scholarly debate: where do historians disagree about this period? Are there competing interpretations?
5. Where this analogy has been used before: has anyone drawn this parallel in academic writing? What did they get right and wrong?
6. The break points: give me at least 3 specific, substantive ways the analogy fails. Not just "different time period" — structural differences that change the analysis.

Cite academic sources wherever possible. I need to fact-check everything.
```

**Philosophical Framework Investigation (supplementary):**
```
For Episode [NUMBER] on [TOPIC], I want to investigate whether [FRAMEWORK] applies.

Don't just confirm it applies — stress-test the application:

1. What specific variant of [FRAMEWORK] is most relevant? (e.g., not just "game theory" but "repeated asymmetric prisoner's dilemma with incomplete information")
2. Map the actors, payoffs, and strategies explicitly onto the framework
3. What does the framework predict? Does reality match?
4. Where does the framework fail or produce misleading conclusions for this case?
5. What would a scholar of [FRAMEWORK] say about this application? Would they endorse it or push back?
6. Are there alternative frameworks that explain the same dynamics better?
7. How has this framework been applied to similar geopolitical situations in academic literature?

I need this to be rigorous enough that a philosophy professor wouldn't cringe. Cite academic sources.
```

**Contemporary Context Update (supplementary — for time-sensitive episodes):**
```
I need an up-to-date contemporary context check for Episode [NUMBER] on [TOPIC].

The script/brief was drafted on [DATE]. What has changed since then?

Specifically check:
1. New policy announcements or diplomatic developments
2. New data releases (economic, military, demographic)
3. Prediction market movements (Kalshi, Polymarket) on related contracts
4. New academic papers or think tank reports
5. Significant media coverage that reframes the narrative
6. Anything that strengthens or weakens the episode's thesis

Flag anything that requires script revision. Distinguish between minor updates (add to description/footnotes) and major updates (requires structural changes to the argument).
```

**Fact-Check Pass (supplementary — run before finalizing script):**
```
Fact-check the following claims from the Episode [NUMBER] brief/script.
For each claim:
1. Find the primary source
2. Verify the specific numbers, dates, and attributions
3. Check if the claim has been disputed or updated since the source was published
4. Rate confidence: ✅ CONFIRMED / ⚠️ UNCERTAIN / ❌ DISCONFIRMED

[Paste claims table or full brief]
```

---

## The Handoff: Deep Research → Cowork

### Step-by-step per-episode workflow

**Monday — Topic Selection (~10 min total)**
1. Open Claude.ai → "Parallax — Topic Radar" project
2. Run the Weekly Scan prompt with Deep Research enabled
3. Review 3-5 candidates, pick one
4. Optionally add a one-line angle

**Tuesday/Wednesday — Deep Research (~30 min total)**
1. Open Claude.ai → "Parallax — Episode Research" project
2. Run the Full Episode Research prompt with Deep Research enabled (~5-15 min processing)
3. Review the output, note any gaps
4. Run 1-2 supplementary prompts if needed (historical deep dive, framework investigation)
5. Save the final brief: copy the output, paste into a new file at `content/episodes/EP[XX]-[slug]/brief.md`

**Thursday — Script Development (~45 min total, mostly in Cowork)**
1. Open Cowork
2. Ask Cowork to read the brief and draft a script following the narrative arc
3. Run script-audit skill on the draft
4. Run persona-eval skill on the draft
5. Human review and rewrite (~30 min) — this is the most important human checkpoint

**Friday/Saturday — Production (Cowork + Human)**
1. Run visual-spec skill to generate JSON data files from the approved script
2. Render Remotion templates
3. Record narration
4. Assembly

**Before Publishing — Final Checks**
1. Run the Contemporary Context Update prompt in Claude.ai (things may have changed since research)
2. Run the Fact-Check Pass prompt on any remaining ⚠️ claims
3. Final review in Cowork

---

## Maintenance

### Weekly
- Update IDEAS.md in the Topic Radar project (so arc status stays current)
- Save successful briefs as examples (the more gold-standard examples the Episode Research project has, the better its output gets)

### Monthly
- Review which prompt templates are working well vs. needing revision
- Check if custom instructions need updating based on lessons learned
- Update SEO_KEYWORDS.md with new keyword data from YouTube Studio analytics

### Per-Arc
- When starting a new arc, upload any arc-specific research to the Episode Research project
- Update the Topic Radar with the new arc's macro question

---

## Future Evolution: When to Build Custom Agents

The Claude.ai Deep Research + Cowork workflow described above requires zero engineering. When the following conditions are met, consider building Agent SDK automation:

1. **You've shipped 10+ episodes** and the manual workflow is validated
2. **You can identify specific bottlenecks** that automation would solve
3. **The research dossier schema is stable** (not changing episode-to-episode)
4. **You have time budget** for engineering (estimate 20-40 hours for a basic agent pipeline)

What Agent SDK automation would look like:
- A Python script that runs the Topic Radar weekly and saves results to your content folder
- A research agent that takes a topic brief and runs parallel sub-agents (historical, philosophical, contemporary) then merges into a structured dossier
- Integration with Kalshi API for automated prediction market data
- Automated fact-checking against a source database

This is the long-term vision from PRODUCTION_PIPELINE.md. The manual workflow above is the validated stepping stone.

---

## Related Documents
- PRODUCTION_PIPELINE.md — the conceptual agent pipeline this workflow implements manually
- CONTENT_IDENTITY.md — format definitions, topic discovery framework, scoring rubric
- IDEAS.md — active arcs and topic backlog
- SEO_KEYWORDS.md — keyword strategy for titling
- CONTENT_RISK_PLAYBOOK.md — editorial guidelines the research must respect
- EP01-silicon-trap/brief.md — gold-standard example of a research brief

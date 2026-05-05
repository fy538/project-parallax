# Episode 01 Pipeline Design
## Semiconductor Geopolitics + Production Workflow MVP

*Working document — April 2026*

> **Status:** Three Research Mode prompts ready. Run in parallel in separate claude.ai tabs:
> 1. **Audience research** → `prompt-audience-research.md`
> 2. **EP01 deep research** → `prompt-ep01-research-v2.md` (revised with all four philosophical pillars)
> 3. **Scriptwriting workflow** → `prompt-scriptwriting-research.md` (how to make AI scripts sound narrated, not written)
>
> Audience + scriptwriting research inform the pipeline design. EP01 research produces the raw material for the first structured brief.

---

## Part A: The Workflow Architecture

### The Core Insight: You Don't Need the API

Your Max 20x plan ($200/mo) already includes every tool you need. The key is using the right Claude interface for each stage of production. Here's the breakdown:

| Interface | Best For | Research Depth | Cost |
|-----------|----------|---------------|------|
| **Claude Web — Research Mode** | Deep investigation, multi-source synthesis, citations | Up to 45 min, hundreds of sources | Included in Max |
| **Claude Web — Standard chat** | Brainstorming, quick questions, editorial feedback | Instant, 1-2 searches | Included in Max |
| **Cowork (Desktop)** | File creation, document assembly, structured work, fact-checking | Web search + Chrome automation | Included in Max |
| **Claude Code** | If you ever build custom tooling/scripts | Terminal-based, agentic | Included in Max |

**The API is for developers building apps on top of Claude.** For a content production pipeline where *you* are the human-in-the-loop, the subscription interfaces are both cheaper and more capable for your use case.

### The 5-Stage Pipeline (Zero API Cost)

```
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: Topic Discovery                                   │
│  Tool: Claude Web (standard chat) + Web Search              │
│  Input: News cycle, editorial calendar, audience signals    │
│  Output: 3-5 candidate topics with hook + depth assessment  │
│  Time: ~15 min conversation                                 │
│  Human role: Select topic, define angle                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  STAGE 2: Deep Research                                     │
│  Tool: Claude Web — RESEARCH MODE (the 45-min deep dive)    │
│  Input: Selected topic + angle + specific research questions│
│  Output: Raw research report with citations                 │
│  Time: 15-45 min (runs in background)                       │
│  Human role: Craft the research prompt, review findings     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  STAGE 3: Dossier Assembly + Fact Verification              │
│  Tool: Cowork (this tool!)                                  │
│  Input: Copy-paste Research output + your editorial notes   │
│  Output: Structured brief (template below)                  │
│  Time: ~20-30 min                                           │
│  Human role: Guide structure, flag claims to verify         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  STAGE 4: Script Development                                │
│  Tool: Cowork OR Claude Web (standard chat)                 │
│  Input: Structured brief + narrative preferences            │
│  Output: Bilingual script (EN/CN) with visual cues          │
│  Time: ~30-60 min iterative                                 │
│  Human role: Voice, tone, narrative judgment                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  STAGE 5: Production Planning                               │
│  Tool: Cowork                                               │
│  Input: Final script                                        │
│  Output: Visual brief, B-roll list, graphics specs, SEO     │
│  Time: ~15-20 min                                           │
│  Human role: Approve, send to production                    │
└─────────────────────────────────────────────────────────────┘
```

### Why This Architecture Works

**Research Mode is your power tool.** It does exactly what a "deep research agent" would do via the API — it decomposes your question into subtasks, runs parallel searches, synthesizes across sources, and produces cited reports. The difference: it's already built, it's already paid for, and it has access to Claude's full reasoning capabilities (extended thinking activates automatically).

**Cowork is your assembly line.** Once you have raw research, Cowork excels at structured work: transforming messy findings into templated documents, running fact-verification searches, creating production files (scripts, briefs, spreadsheets), and maintaining project consistency across episodes.

**The human-in-the-loop between stages is a feature, not a bug.** Your editorial judgment between Stage 2 (raw research) and Stage 3 (structured brief) is where the channel's intellectual identity gets baked in. Automating this away would actually hurt quality.

### When You *Would* Want the API

Save API usage for if/when you want to:
- Build a custom tool that auto-monitors news feeds for topic candidates (Stage 1 automation)
- Create a scheduled agent that runs daily scans (possible via Cowork's scheduled tasks, actually)
- Build a custom web scraper for specific data sources
- Process large volumes programmatically (e.g., analyzing 100 historical speeches)

For now, the manual pipeline with Research Mode + Cowork covers Stage 1-5 at zero marginal cost.

---

## Part B: Episode 01 — US-China Semiconductor Geopolitics

### Narrative Approach: News-Hook-First

Open with the current tension (April 2026 summit context, tariff escalation, CHIPS Act implementation), then pull the historical thread to show this is a recurring pattern of great-power resource competition.

### Research Prompt for Stage 2 (Research Mode)

Use this prompt in Claude Web with Research Mode enabled:

> **Research prompt:**
>
> I'm producing a 15-20 minute video essay on US-China semiconductor geopolitics for a bilingual (EN/CN) channel that uses historical analogy as an analytical framework.
>
> Please investigate the following areas in depth:
>
> **1. Current State (the hook)**
> - Latest developments in US-China semiconductor tensions (2025-2026): tariffs, export controls, the CHIPS Act implementation status, any recent diplomatic developments or summit outcomes
> - TSMC's position and any recent moves (Arizona fab progress, any geopolitical pressure from either side)
> - China's semiconductor self-sufficiency progress: SMIC's capabilities, Huawei's chip development, government investment figures
>
> **2. Historical Parallels (the depth)**
> - How have great powers historically weaponized control of critical resources? I need 3-4 strong analogies:
>   - British control of coal/steam technology during industrialization
>   - US/Allied control of oil in WWII (particularly the oil embargo on Japan)
>   - The rare earth minerals story (China's 2010 embargo on Japan)
>   - Any other compelling parallels (rubber, uranium, etc.)
> - For each parallel: what was the resource, who controlled it, what was the geopolitical leverage mechanism, and how did it resolve?
>
> **3. Structural Analysis**
> - What does game theory say about technology denial strategies? (security dilemma, commitment problems)
> - What are the strongest arguments that semiconductor controls will succeed in maintaining US advantage?
> - What are the strongest arguments they will backfire (accelerating Chinese self-sufficiency)?
> - What does the historical pattern suggest about the long-term outcome?
>
> **4. Data Points I Need**
> - Global semiconductor market size and growth
> - Market share by country/company for advanced chips (sub-7nm)
> - US CHIPS Act funding allocated vs. disbursed
> - China's semiconductor investment figures (Big Fund I, II, III)
> - Timeline of key export control escalations (2019-2026)
>
> **5. Contrarian and Underreported Angles**
> - What are experts saying that mainstream coverage is missing?
> - Are there credible voices arguing the "chip war" framing is overblown?
> - What's the view from Taiwan, Japan, South Korea, and the Netherlands (ASML)?
>
> Please provide citations for all claims so I can verify them.

### Structured Brief Template (Stage 3 Output)

This is the contract between research and scriptwriting. Cowork produces this document after you paste in the Research Mode output:

```
═══════════════════════════════════════════════════════
EPISODE STRUCTURED BRIEF
═══════════════════════════════════════════════════════

EPISODE NUMBER:    01
WORKING TITLE:     [EN] / [CN]
TARGET LENGTH:     15-20 minutes
HOOK:              [1-2 sentence description of the opening moment]
THESIS:            [Core argument in one sentence]
HISTORICAL LENS:   [Which analogy/framework anchors the episode]

───────────────────────────────────────────────────────
SECTION 1: NARRATIVE ARC
───────────────────────────────────────────────────────

Beat 1 — The Hook (0:00-2:00)
  Scene:    [What the viewer sees/hears]
  Content:  [Key information delivered]
  Emotion:  [What the viewer should feel]

Beat 2 — The Pattern (2:00-6:00)
  Scene:    [...]
  Content:  [Historical parallel #1 and #2]
  Emotion:  [Recognition — "this has happened before"]

Beat 3 — The Current Chapter (6:00-11:00)
  Scene:    [...]
  Content:  [Semiconductor specifics, data, players]
  Emotion:  [Understanding — the stakes become clear]

Beat 4 — The Analysis (11:00-16:00)
  Scene:    [...]
  Content:  [Game theory framing, competing scenarios]
  Emotion:  [Intellectual engagement — viewer forms own view]

Beat 5 — The Takeaway (16:00-18:00)
  Scene:    [...]
  Content:  [What history suggests, epistemic humility]
  Emotion:  [Thoughtful uncertainty — not false certainty]

───────────────────────────────────────────────────────
SECTION 2: KEY CLAIMS + VERIFICATION STATUS
───────────────────────────────────────────────────────

| # | Claim | Source | Verified? | Notes |
|---|-------|--------|-----------|-------|
| 1 | [claim] | [source] | ✅/⚠️/❌ | [any caveats] |
| 2 | ... | ... | ... | ... |

───────────────────────────────────────────────────────
SECTION 3: HISTORICAL PARALLELS
───────────────────────────────────────────────────────

PARALLEL 1: [Name]
  Period:       [dates]
  Resource:     [what]
  Controller:   [who]
  Mechanism:    [how leverage was applied]
  Resolution:   [what happened]
  Analogy fit:  [Strong/Moderate/Weak + why]

PARALLEL 2: [Name]
  [same structure]

PARALLEL 3: [Name]
  [same structure]

───────────────────────────────────────────────────────
SECTION 4: DATA DASHBOARD
───────────────────────────────────────────────────────

[Key statistics with sources, formatted for quick reference
 during scriptwriting. Include date of data.]

───────────────────────────────────────────────────────
SECTION 5: COUNTERARGUMENTS + STEELMAN
───────────────────────────────────────────────────────

Against thesis:   [strongest objection to our framing]
Steelman:         [best version of opposing view]
Our response:     [how we address it in the episode]
Epistemic note:   [what we genuinely don't know]

───────────────────────────────────────────────────────
SECTION 6: PRODUCTION NOTES
───────────────────────────────────────────────────────

Visual opportunities:  [moments that need graphics/maps/data viz]
B-roll suggestions:    [stock footage categories needed]
Graphics specs:        [any specific charts, timelines, maps]
CN localization notes: [terms, framing differences for CN version]

───────────────────────────────────────────────────────
SECTION 7: SOURCE LIST
───────────────────────────────────────────────────────

[Numbered list of all sources with URLs, organized by section]
```

---

## Part C: Immediate Next Steps

### To produce Episode 01 right now:

1. **Open Claude Web (claude.ai)** → Enable Research Mode (blue button, bottom-left)
2. **Paste the Research Prompt above** (Section B) → Let it run (15-45 min, can run in background)
3. **Review the output** → Add your editorial notes, flag anything that feels wrong or missing
4. **Come back to Cowork** → Paste the research output + your notes → Ask me to assemble the Structured Brief using the template above
5. **Iterate on the brief** → We refine together, I can run additional fact-checks via web search
6. **Move to scriptwriting** → Once the brief is solid, we develop the script (EN first, then CN adaptation)

### To systematize for future episodes:

- Save this document as the pipeline reference
- The Research Prompt template (Part B) can be adapted per episode — swap the topic-specific questions, keep the structural framework
- The Structured Brief template stays consistent across episodes — it becomes your "production bible" format
- Consider setting up a scheduled task in Cowork to scan news sources weekly for potential hooks (I can help build this)

---

## Appendix: Cost Comparison

| Approach | Monthly Cost | Capability |
|----------|-------------|------------|
| **Current (Max 20x)** | **$200 flat** | Research Mode (45-min deep dives), Cowork, Claude Code, 20x usage, Opus 4.6 |
| API-based pipeline | ~$50-200+ variable | Custom agents, but requires coding + maintenance overhead |
| Hybrid (Max + light API) | $200 + ~$10-30 | Add scheduled monitoring or batch processing when needed |

**Recommendation:** Stay with Max-only for now. The subscription tools (Research Mode + Cowork) cover your Stage 1-5 pipeline completely. Revisit API usage only if you need automation beyond what scheduled tasks can handle.

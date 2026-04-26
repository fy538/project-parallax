# Parallax — Production Pipeline

## Design Constraint
Tiger has 5-10 hours/week alongside a full-time senior data scientist role. The pipeline must minimize human time while keeping human judgment at the points that matter most for content quality and brand integrity.

**Target: ~2-3 hours of human time per video.**

---

## Pipeline Overview

```
[Fully Automated]          [Human Touch]              [Fully Automated]
Topic Scanning       -->   Topic Selection (5 min) --> Deep Research
Script Drafting      -->   Script Review (30 min)  --> Visual Spec Generation
                           Narration Recording       --> Template Population
                           (20-30 min)               --> Assembly
Risk Assessment      -->   Final Review (10 min)   --> Platform Adaptation
                                                    --> Publishing
```

---

## Stage 1: Topic Discovery ("Radar" Agents)

### Agent: Event Monitor
- Scans news feeds, RSS, social media trends, geopolitical briefings
- Identifies current events with high narrative potential
- Filters for: timeliness, search volume, emotional resonance

### Agent: Resonance Finder
- Takes candidate events from Event Monitor
- Runs each against historical and philosophical knowledge
- Returns: structural analogies, philosophical frameworks that apply, and where the analogy breaks down
- Output format: ranked list of 3-5 candidate topics with preliminary connection maps

### Human checkpoint: Topic Selection (~5 minutes)
- Review 3-5 candidates
- Select one
- Optionally add a one-line angle ("focus on the trade parallel, not the military one")

---

## Stage 2: Deep Research ("Scholar" Agents)

Three parallel specialist agents:

### Agent: Historical Research
- Deep dive on specific analogies from Stage 1
- Primary and secondary sources, timelines, key actors, causal chains
- Output: structured historical context with citations

### Agent: Philosophical Framework
- Identifies which formal frameworks illuminate the topic
- Is this a prisoner's dilemma? Tragedy of the commons? Bayesian updating problem?
- Output: framework descriptions with concrete application to the topic

### Agent: Contemporary Context
- Gathers current state of play
- Actors, stated positions, revealed incentive structures
- Output: structured contemporary analysis with source links

### Combined Output: Research Dossier (structured data)
```json
{
  "historical_parallels": [...],
  "philosophical_frameworks": [...],
  "contemporary_actors": [...],
  "key_tensions": [...],
  "open_questions": [...],
  "sources": [...]
}
```

### Optional human checkpoint: Dossier Review
- Skim for factual issues or forced analogies
- Can skip if time-constrained (Gate agent in Stage 4 provides backup)

---

## Stage 3: Script Writing ("Narrator" Agents)

### Agent: Structure
- Takes research dossier
- Creates narrative arc: where does the historical analogy enter, where does the philosophical "aha" land, where does the contemporary hook connect, what question stays open
- Output: scene-by-scene outline with timing estimates

### Agent: Voice
- Writes prose within the structure
- Tuned to Tiger's editorial voice (see PROJECT_VISION.md for voice profile)
- Few-shot examples from Tiger's own writing and approved past scripts
- Each segment tagged with visual mode: "historical," "analytical," "contemporary," "transition"
- Output: full script with visual direction tags and segment timestamps

### Human checkpoint: Script Review and Rewrite (~30 minutes)
- Read full script
- Flag intellectually dishonest or forced connections
- Adjust tone where it drifts from your voice
- This is the most important human checkpoint — it's where philosophy training earns its keep

---

## Stage 4: Risk Assessment ("Gate" Agent)

### Agent: Editor
Evaluates the approved script on four dimensions:

1. **Factual accuracy:** Are historical claims sourced and correct? Dates, names, causal relationships.
2. **Epistemological discipline:** Is language appropriately hedged? "Structural resonance" not "this proves"? Has it drifted into conspiracy framing?
3. **Platform risk:** Does content touch demonetization triggers? Geopolitical content is sensitive. Flag segments needing alternative phrasing per platform.
4. **Sensitivity and bias:** Fair to all parties? Not serving one geopolitical perspective over another?

Output: Risk report with flagged passages and suggested revisions.

The Gate agent does NOT have veto power. Tiger makes final call.

---

## Stage 5: Visual Production (Remotion + Skills)

### Approach: Template-Based, Data-Driven
7 reusable Remotion templates (React → MP4) that accept JSON data files. Each template handles a category of visual; each episode needs only new JSON data, not new code.

### Templates Built (all ✅):
1. **ChoroplethMap** — Phase-based country highlighting on world maps (alliance shifts, trade blocs)
2. **RouteAnimation** — Animated trade/supply route lines between geographic points
3. **TimelineComparison** — Dual-column historical comparison timelines with connections
4. **DataChart** — Animated bar charts and side-by-side comparisons
5. **KineticTypography** — Quotes, definitions (with pinyin), bilingual text, animated statistics
6. **FrameworkDiagram** — Comparison columns, flow diagrams, matrices (game theory, etc.)
7. **TitleTransition** — Episode titles, section headers, end cards with CTA

### Workflow: visual-spec skill
- Reads the approved script
- Produces a visual breakdown table (human checkpoint — approve before generating)
- Generates all JSON data files for the episode
- EP01 validated: 24 compositions generated from script-v3

### QA: Self-render loop
- `npx remotion still` renders individual frames as PNG
- Claude reads the PNG, critiques against BRAND.md rules
- Edit code or data → re-render → verify
- Works for non-map templates in sandbox; all templates work in local Remotion Studio

### Assembly (future)
- Define render order and segment durations
- Sync visual segment timing to narration audio timestamps
- Concatenate rendered segments (Remotion sequence or FFmpeg concat)

### Platform Adapter (future)
- Reformats long-form into short-form cuts (30-90 sec)
- Different hooks, aspect ratios (vertical for Shorts/TikTok), pacing
- Thumbnail generation via Remotion compositions

---

## Stage 6: Narration Recording (Human)

### Process (~20-30 minutes per episode)
- Record in batches: script 3 episodes, record all in one sitting (~90 min for 3 weeks of content)
- Equipment: good microphone (Blue Yeti, Audio-Technica minimum), quiet room, pop filter
- Style: conversational and thoughtful, not performative. "Smart friend explaining" tone.
- Light post-processing: noise removal, compression, EQ (can be automated)

### Future option: Voice Clone
- Once established voice identity exists (50+ episodes), can clone voice in ElevenLabs for occasional use
- Never replace human recording entirely — periodic fresh samples keep clone aligned
- Use clone only for supplementary content (Shorts narration, platform adaptations)

---

## Production Cadence

### Target: 1 long-form video per week + 3-5 Shorts

**Current implementation (Claude.ai Deep Research + Cowork hybrid — see RESEARCH_WORKFLOW.md):**
- Monday: Topic selection via Claude.ai "Topic Radar" project with Deep Research (~10 min)
- Tuesday-Wednesday: Deep research via Claude.ai "Episode Research" project (~30 min human time, Deep Research does the heavy lifting)
- Wednesday: Research audit in Cowork (research-audit skill) — verify claims, check brief quality, get verdict before scripting (~10 min)
- Wednesday-Thursday: Script development in Cowork (draft + script-audit + persona-eval skills) + human review (~45 min)
- Friday: Visual spec generation in Cowork (visual-spec skill) + template rendering
- Saturday: Batch narration recording (covers 2-3 episodes)
- Sunday: Final review, contemporary context update check, publish

**Future implementation (Agent SDK automation):**
- Monday: Automated topic scan delivers ranked candidates (5 min to review)
- Tuesday-Wednesday: Automated research agents produce structured dossier (review only)
- Thursday: Script review and rewrite (30 min)
- Saturday: Batch narration recording
- Sunday: Final review of assembled video (10 min)

### Total human time: ~3 hours/week for 1 video + Shorts
- Topic selection: 5 min
- Script review: 30 min
- Narration: 20-30 min (amortized if batched)
- Final review: 10 min
- Buffer/iteration: 30-60 min

---

## Technical Stack

### Visual Production (✅ built)
- **Remotion** — React-based video renderer (templates → MP4)
- **react-simple-maps** — Geographic visualizations (choropleth, route animations)
- **TypeScript + React** — Template components with typed JSON inputProps
- **Design system** — BRAND.md (canonical) + theme.ts (code), shared across all templates
- **BrandImage component** — Remotion component applying 4-step image treatment (desaturate → duotone → grain → composite) at render time via SVG filters. Supports standard/conflict/editorial ramps and background/inset/antipode composite modes.
- **Brand treatment CLI** — Python tool (`tools/brand-treatment/treat.py`) for batch-processing images through the brand pipeline outside Remotion. Produces identical output for previews and asset preparation.
- **Asset sourcing tool** — Python tool (`tools/asset-source/source.py`) for searching Pexels/Pixabay/Unsplash APIs. Supports batch mode via JSON shot lists, auto-downloads top results per asset.
- Stock footage libraries: Pexels, Pixabay, Unsplash (free tier). Paid options (Storyblocks) deferred.

### Production Skills (✅ built)
- **research-audit** — Research brief → 7-lens quality audit → verdict (READY / CONDITIONAL / NEEDS MORE RESEARCH). Verifies claims via web search, checks historical parallel integrity, scores against rubric, flags editorial risks. Quality gate between Deep Research and scripting.
- **script-audit** — Narrative quality review (transitions, pacing, claims)
- **persona-eval** — Audience resonance check against 5 target personas
- **visual-spec** — Script → visual breakdown → JSON data files

### Research (✅ designed, ready to use)
- **Claude.ai Deep Research** — multi-step agentic web research (100-250+ sources per query)
- **Claude.ai Projects** — persistent context for Topic Radar and Episode Research
- Two projects defined with custom instructions, file lists, and prompt templates
- Full workflow documented in RESEARCH_WORKFLOW.md

### Orchestration (partially built)
- Claude.ai Projects + Cowork skills for current pipeline stages (working now)
- Full multi-agent orchestration (Claude Agent SDK) deferred until 10+ episodes validate the manual workflow
- Research dossier schema defined in RESEARCH_WORKFLOW.md; automated topic discovery is future work

### Script Format (✅ designed)
- **Two-column production script** — narration (left) + visual production specs (right). See SCRIPT_FORMAT.md.
- Every visual moment specified with: template/source type, search terms, brand treatment, composite mode, duration, priority tier (P1/P2/P3)
- Asset summary table at end of script: Remotion compositions, stock footage, archival images, AI generations
- Machine-readable shot list (JSON) auto-generated for asset sourcing tool
- Pipeline: script draft → script-audit → persona-eval → asset sourcing → visual-spec → render

### Script/Research
- Claude for research aggregation and drafting
- Human editorial judgment at script review checkpoint
- RAG pipeline for fact-checking (future)

### Audio
- Recording: Audacity or GarageBand (free)
- Post-processing: automated noise removal + EQ
- Future: ElevenLabs voice clone (Tiger's own voice, after 50+ episodes)

### Publishing
- YouTube Studio for long-form
- TikTok/YouTube Shorts for short-form
- Thumbnail generation via Remotion compositions (planned)

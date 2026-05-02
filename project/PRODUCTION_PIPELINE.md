# Parallax — Production Pipeline

## Design Constraint
Tiger has 5-10 hours/week alongside a full-time senior data scientist role. The pipeline must minimize human time while keeping human judgment at the points that matter most for content quality and brand integrity.

**Target: ~2-3 hours of human time per video.**

---

## Pipeline Overview (Actual — as of April 2026)

```
TOOL                          STAGE                         HUMAN TIME
────────────────────────────  ────────────────────────────  ──────────
Claude.ai (Topic Radar)       Topic Discovery               ~10 min
Claude.ai (Episode Research)  Deep Research                 ~30 min
Cowork (research-audit)       Research Quality Gate          ~10 min
Cowork (script draft)         Script Writing                   —
Cowork (visual-concept)       Visual Feasibility Audit         —
  ↕ iterate script ↔ visuals  (reshaping loop)                —
Cowork (script-audit)         Narrative QA                     —
Cowork (persona-eval)         Audience Resonance Check         —
HUMAN                         Script Review + Rewrite       ~30 min
Cowork (visual-spec)          Visual Spec → JSON             ~5 min
Python CLI (source.py)        Asset Sourcing                   —
Python CLI (treat.py)         Image Treatment                  —
Remotion                      Template Rendering               —
HUMAN                         Narration Recording           ~25 min
NLE (DaVinci/Premiere)        Final Assembly                ~20 min
HUMAN                         Final Review + Publish        ~10 min
```

**Total: ~2.5 hours human time per episode.**

The pipeline uses two tools: **Claude.ai** (Deep Research for heavyweight information gathering) and **Cowork** (file system, skills, production). The handoff is a copy-paste of the research brief. See RESEARCH_WORKFLOW.md for the full research stage design.

---

## Stage 1: Topic Discovery

**Tool:** Claude.ai → "Parallax — Topic Radar" project (with Deep Research enabled)

A Claude.ai Project with custom instructions that encode the Parallax scoring rubric, format library, negative filters, and current arc status. Weekly scan returns 3-5 ranked candidates.

**What it does:**
- Scans current geopolitical developments
- Scores each against 5-criteria rubric (see CONTENT_IDENTITY.md)
- Matches to episode format (Detective, Dialectic, Time Collapse, etc.)
- Checks fit against active arcs (from IDEAS.md)
- Suggests SEO-informed titles

**Human checkpoint:** Review candidates, pick one, optionally add an angle (~5 min).

**Files uploaded to this project:** CONTENT_IDENTITY.md, IDEAS.md, SEO_KEYWORDS.md (Part 1), CONTENT_RISK_PLAYBOOK.md (Part 4).

**Prompt templates:** See RESEARCH_WORKFLOW.md → "PROJECT 1" section.

---

## Stage 2: Deep Research

**Tool:** Claude.ai → "Parallax — Episode Research" project (with Deep Research enabled)

Per-episode deep research producing a structured 8-section brief: narrative arc, claims + verification, historical parallels, philosophical frameworks, data dashboard, counterarguments, prediction market check, production notes.

**What it does:**
- Multi-step agentic web research (100-250+ sources per query)
- Produces comprehensive episode brief matching EP01 quality standard
- Supplementary prompts available for: historical deep dives, framework investigations, contemporary context updates, fact-check passes

**Human checkpoint:** Review brief for factual issues or forced analogies (~15-30 min, can overlap with other work).

**Output:** Save brief to `episodes/EP[XX]-[slug]/brief.md`

**Files uploaded to this project:** PROJECT_VISION.md, CONTENT_RISK_PLAYBOOK.md, SEO_KEYWORDS.md, EP01 brief.md (as gold-standard example).

**Prompt templates:** See RESEARCH_WORKFLOW.md → "PROJECT 2" section.

---

## Stage 3: Research Quality Gate

**Tool:** Cowork → research-audit skill

Automated quality audit of the research brief before scripting begins. Seven analytical lenses with explicit pass/fail criteria.

**What it does:**
- Structural completeness check (all 8 sections present and substantive)
- Claims verification via web search (flags unverified or contradicted claims)
- Historical parallel integrity (checks for break-point analysis)
- Counterargument quality (rejects strawmen)
- Scoring rubric (25-point scale)
- Risk and editorial review
- Arc coherence check

**Output:** Verdict — READY FOR SCRIPTING / CONDITIONAL / NEEDS MORE RESEARCH

**Hard triggers for NEEDS MORE RESEARCH:** Missing required sections, unverified load-bearing claims, missing counterarguments, overconfident thesis language, rubric score <15/25, >40% unverified claims.

**Skill location:** `skills/research-audit/SKILL.md` (also installed in Cowork plugins directory for auto-triggering).

---

## Stage 4: Script Development

**Tool:** Cowork (conversational drafting + skills)

Script development happens in Cowork with access to the research brief, project memory files, and production skills. The key insight: script and visuals are co-developed iteratively, not sequentially. The visual-concept skill enables this by feeding visual feasibility back into the script before it locks.

**Workflow:**
1. Ask Cowork to read the brief and draft a two-column production script (see SCRIPT_FORMAT.md)
2. Run **visual-concept** skill — audits the right column for feasibility, tool fit, visual variety, and treatment-narrative alignment. Returns script reshaping suggestions where the narration should adapt to visual reality.
3. Iterate script based on visual-concept feedback (reshape narration to enable better visuals, reassign tool choices, fix monotony)
4. Run **script-audit** skill — checks for broken transitions, lecture patterns, missing human moments, pacing problems, unverified claims
5. Run **persona-eval** skill — evaluates resonance across 5 target audience personas, including visual engagement per persona and visual tension map
6. Iterate based on audit findings.
7. Run **review-package** skill — synthesizes visual-concept + script-audit + persona-eval into a single prioritized review document for Tiger's 30-minute session. Produces cross-audit priority fix list, persona-visual cross-analysis, and 2-3 decision points.

**Human checkpoint:** Script review and rewrite (~30 min). Tiger reads the **review-package** output — one document that merges all three audits, ranks fixes by cross-audit impact, and surfaces only the decisions he needs to make. This replaces reading three separate reports.

8. After rewrite: run **visual-concept re-validation** (quick-check mode) — lightweight 3-lens check that the revised narration still aligns with the visual layer. Catches template-narration drift, P1 misalignment, and rhythm breaks from the rewrite.

**Output:** Two-column production script at `episodes/EP[XX]-[slug]/script-v[N]-production.md`, containing:
- Left column: full narration text with delivery notes
- Right column: visual production specs (source type, search terms, treatment, composite mode, duration, priority)
- Asset summary tables (Remotion compositions, stock footage, archival images)
- Machine-readable shot list (`shot-list.json`) for the asset sourcing tool

**Script format spec:** See SCRIPT_FORMAT.md for the complete two-column format definition.

**Skills used:**
- **visual-concept** — visual feasibility + tool fit + monotony + treatment-narrative alignment across 5 lenses; includes re-validation quick-check mode (installed in Cowork plugins)
- **script-audit** — narrative quality across 6 lenses (5 narrative + 1 visual layer: mode balance, monotony, unsourceable footage, sourcability warnings) (installed in Cowork plugins)
- **persona-eval** — audience resonance check against 5 personas, now with visual engagement scoring and visual tension map (installed in Cowork plugins)
- **review-package** — cross-audit synthesis into single review document for human checkpoint (installed in Cowork plugins)

---

## Stage 5: Visual Production

Four parallel tracks feed into final assembly:

### Track A: Remotion Template Rendering + Footage Planning

**Tool:** Cowork → visual-spec skill → Remotion + source.py

1. Run **visual-spec** skill on the approved script → produces visual breakdown table covering ALL three visual modes (`[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`), with mode balance check against targets (FOOTAGE 50-70%, MG 20-30%, LAYERED 5-15%)
2. Human approves the visual plan (~5 min)
3. Skill generates two outputs: (a) Remotion JSON data files for all MG compositions, and (b) `footage-manifest.json` — structured list of every stock footage and archival need with search terms, platform recs, sourcability ratings, and compositing notes
4. Render via local scripts or Lambda
5. Run **render-qa** skill → generates `npx remotion still` commands for P1/P2 compositions, produces per-template verification checklists (data accuracy, CJK rendering, color coding, text readability). Tiger spot-checks stills before assembly.

**Templates (7 types, all built):**
1. **ChoroplethMap** — Phase-based country highlighting on world maps
2. **RouteAnimation** — Animated trade/supply route lines between geographic points
3. **TimelineComparison** — Dual-column historical comparison timelines
4. **DataChart** — Animated bar charts and comparisons
5. **KineticTypography** — Quotes, definitions (with pinyin), bilingual text, statistics
6. **FrameworkDiagram** — Comparison columns, flow diagrams, matrices
7. **TitleTransition** — Episode titles, section headers, end cards

Plus 4 format-specific templates: DecisionTree, SplitComposition, ProbabilityGauge, ImageComposite. Plus 3 Shorts variants (vertical 9:16).

**Render pipeline:**
- Local: `scripts/render-episode.mjs` (supports `--only`, `--from`, `--preview`, `--concat`)
- Cloud: `scripts/render-lambda.mjs` (via Remotion Lambda on AWS)
- QA: `npx remotion still` renders individual frames for visual review

**Data files:** `remotion-templates/data/episodes/ep[XX]/` — JSON files following naming convention `{template-type}-{descriptive-slug}.json`

**Design system:** BRAND.md (canonical) → theme.ts (code implementation). Meridian dual-mode system. See `remotion-templates/BRAND.md`.

### Track B: Stock Footage + Image Sourcing

**Tool:** Python CLI → `tools/asset-source/source.py`

Searches Pexels, Pixabay, and Unsplash APIs for stock footage and images specified in the shot list.

**Usage:**
```bash
# Single search
python tools/asset-source/source.py "semiconductor cleanroom" --type photo

# Batch from shot list (generated by script format)
python tools/asset-source/source.py --batch episodes/EP01-silicon-trap/shot-list.json -o assets/
```

**Output:** Downloaded assets + `asset-manifest.json` mapping shot-list IDs to local files.

**Note:** Requires API keys (PEXELS_API_KEY, PIXABAY_API_KEY, UNSPLASH_ACCESS_KEY). Fails gracefully without them — reports which APIs are unavailable.

**Post-sourcing feedback loop:** After source.py runs, the **source-feedback** skill reads `asset-manifest.json`, identifies search terms that returned zero or low-quality results, and suggests alternative visual approaches for each gap. Alternatives include: better search terms (with exact re-source commands), Remotion template substitution, Claude SVG illustration, AI-generated engraved images, or "hold on narration" (keep previous composition on screen). P1 hero gaps are flagged as critical blockers; P3 ambient gaps get lightweight fallback suggestions. If a gap requires script reshaping (P1 hero visual fundamentally unavailable), the skill escalates back to script revision.

**Skill location:** `skills/source-feedback/SKILL.md`

### Track C: Image Treatment

**Tool:** Python CLI → `tools/brand-treatment/treat.py` (offline) or Remotion BrandImage component (at render time)

4-step brand treatment pipeline from BRAND.md:
1. Desaturate (20-30%)
2. Duotone remap (3-stop color ramp: shadows → midtones → highlights)
3. Film grain (8-12%) + vignette (15-20%)
4. Composite (opacity by mode: background @ 25-40%, inset @ 60-80%, antipode @ 40-50%)

**Three duotone ramps:**
- Standard: ink → bronze → amber (default)
- Conflict: ink → rust (geopolitical tension)
- Editorial: folder → bone → paper (documents, data)

**Usage:**
```bash
# Single image
python tools/brand-treatment/treat.py input.jpg -r conflict --preview -o processed/

# Batch
python tools/brand-treatment/treat.py assets/*.jpg -o processed/
```

**At render time:** The `BrandImage` Remotion component (`remotion-templates/src/components/BrandImage.tsx`) applies the same 4-step treatment via SVG filters — GPU-accelerated, resolution-independent. Used inside Remotion compositions for photos that appear alongside motion graphics.

### Track D: SVG Illustrations

**Tool:** Cowork (Claude SVG generation) or Recraft V4 / Flux 2 Pro API

For visual concepts that don't exist as stock footage and aren't covered by Remotion templates — abstract metaphors, structural diagrams, information-dense flow visualizations.

**Decision tree:** Geometric/diagrammatic → Claude SVG (free). Organic/artistic → Recraft or Flux ($0.04-0.08/image).

**Workflow:**
1. Identify illustration candidates from script's right column (`AI-GENERATE` tags and conceptual visual moments)
2. Write structured prompts (concept, content requirements, brand compliance, polish requirements)
3. Generate at 1920×1080 with Meridian palette compliance
4. Polish audit against POLISH.md (spacing grid, typography tiers, depth, hierarchy)
5. Integrate into Remotion (static SVG import, animated React component, or hybrid)

**Full spec:** See `project/SVG_ILLUSTRATION_PIPELINE.md` for prompt templates, quality checklist, and Remotion integration patterns.

**File organization:** SVGs to `remotion-templates/public/illustrations/ep[XX]/`, animated versions to `src/illustrations/ep[XX]/`.

---

## Stage 6: Narration Recording

**Tool:** Human + Audacity/GarageBand

**Process (~20-30 minutes per episode):**
- Record in batches when possible (3 episodes in one sitting = ~90 min for 3 weeks of content)
- Equipment: good microphone, quiet room, pop filter
- Style: conversational and thoughtful, "smart friend explaining" tone
- Post-processing: noise removal, compression, EQ (can be automated)

**Future option:** Voice clone (ElevenLabs, Tiger's own voice) for supplementary content after 50+ episodes establish vocal identity.

---

## Stage 7: Final Assembly

**Tools:** `tools/assembly/generate_manifest.py` → Remotion `EP01-Full` composition → NLE for final polish

The assembly pipeline has two stages:

**Stage 7a — Assembly manifest generation.** `generate_manifest.py` parses the production script's right column and produces `assembly-manifest.json` mapping every second of the video to a visual element (footage, image, template, transition, hold). Two modes: "estimate" (from word count at 150 WPM, before narration is recorded) and "precise" (from Whisper word-level timestamps after narration).

```
python tools/assembly/generate_manifest.py \
  --script episodes/EP01-silicon-trap/script-v4-production.md \
  --episode EP01 --title "The Silicon Trap" \
  --output remotion-templates/data/episodes/ep01/assembly-manifest.json
```

**Stage 7b — Full-episode Remotion render.** `FullEpisode.tsx` reads the assembly manifest and renders the complete video in one pass: `<Audio>` narration + `<Sequence>`-positioned motion graphics + stock footage with BrandImage treatment. Registered as `EP01-Full` in Remotion Studio. This eliminates the NLE for rough cuts — iteration becomes a data-editing session (edit the manifest JSON, re-render).

The NLE (DaVinci Resolve) is still used for final polish: audio mastering, color grading tweaks, and any manual timing adjustments that go beyond what the manifest captures.

---

## Stage 8: Publishing

**Tool:** YouTube Studio (long-form), TikTok/YouTube Shorts (short-form)

**Before publishing:**
1. Run Contemporary Context Update prompt in Claude.ai (things may have changed since research)
2. Run Fact-Check Pass on any remaining unverified claims
3. Final review in Cowork (~10 min)

**Platform targets:**
- YouTube (primary): long-form 15-20 min analytical videos
- YouTube Shorts + TikTok: 30-90 sec discovery content (4 series concepts defined in IDEAS.md)
- Bilibili: deferred to Phase 2 (Year 2) — see D10, D20

**Not yet built:** Thumbnail generation via Remotion compositions, platform-specific reformatting, Shorts extraction workflow.

**Post-publish learning loop (7-14 days after launch):** Run **publish-retro** skill with YouTube Studio analytics data (retention curve, CTR, demographics, top comments). The skill compares actual viewer behavior against persona-eval predictions and the visual rhythm map, produces a retrospective report identifying which production decisions worked and which didn't, and appends findings to `episodes/LEARNING_LOG.md` for cumulative pattern tracking across episodes. After 3+ episodes, the learning log becomes an evidence-based production playbook.

**Skill location:** `skills/publish-retro/SKILL.md`

---

## Production Cadence

### Target: 1 long-form video per week + 3-5 Shorts

**Weekly schedule:**
- Monday: Topic selection via Claude.ai Topic Radar (~10 min)
- Tuesday–Wednesday: Deep research via Claude.ai Episode Research (~30 min human time)
- Wednesday: Research audit in Cowork (research-audit skill) (~10 min)
- Wednesday–Thursday: Script development in Cowork (draft + script-audit + persona-eval) + human review (~45 min)
- Friday: Visual spec generation + asset sourcing + template rendering
- Saturday: Narration recording (batch covers 2-3 episodes)
- Sunday: Final review, contemporary context check, publish

### Total human time: ~2.5 hours/week
- Topic selection: 10 min
- Research review: 30 min
- Research audit review: 10 min
- Script review + rewrite: 30 min
- Visual spec approval: 5 min
- Narration: 25 min (amortized if batched)
- Final review: 10 min

---

## Technical Stack Summary

### Research (designed, ready to use)
- **Claude.ai Deep Research** — multi-step agentic web research
- **Claude.ai Projects** — persistent context for Topic Radar and Episode Research
- Full workflow: RESEARCH_WORKFLOW.md

### Production Skills (built, installed in Cowork)
- **research-audit** — 7-lens brief quality gate (also at `skills/research-audit/SKILL.md`)
- **visual-concept** — 5-lens visual feasibility audit with script reshaping feedback + re-validation quick-check mode (also at `skills/visual-concept/SKILL.md`)
- **script-audit** — narrative quality review
- **persona-eval** — audience resonance check with visual engagement scoring and visual tension map (also at `skills/persona-eval/SKILL.md`)
- **review-package** — cross-audit synthesis for Tiger's 30-min review session (also at `skills/review-package/SKILL.md`)
- **visual-spec** — script → Remotion JSON data files + footage manifest (with visual mode breakdown and sourcability ratings)
- **render-qa** — pre-assembly composition verification with frame-check commands and per-template checklists (also at `skills/render-qa/SKILL.md`)
- **source-feedback** — post-sourcing gap analysis and alternative visual suggestions (also at `skills/source-feedback/SKILL.md`)
- **publish-retro** — post-publish analytics retrospective with persona prediction validation and cumulative learning (also at `skills/publish-retro/SKILL.md`)

### Visual Production (built)
- **Remotion** — React-based video renderer (7 core + 4 format-specific + 3 Shorts templates)
- **Design system** — `remotion-templates/BRAND.md` (canonical) + `remotion-templates/src/design/theme.ts` (code)
- **Brand treatment CLI** — `tools/brand-treatment/treat.py`
- **BrandImage component** — `remotion-templates/src/components/BrandImage.tsx` (render-time SVG filters)
- **Asset sourcing** — `tools/asset-source/source.py` (Pexels/Pixabay/Unsplash)
- **Render scripts** — `remotion-templates/scripts/` (local bash/Node + Lambda)

### Script Format (designed)
- **Two-column production script** — SCRIPT_FORMAT.md
- Narration (left) + visual production specs with mode tags (right): `[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`
- Visual mode balance targets: FOOTAGE 50-70%, MG 20-30%, LAYERED 5-15%
- Editorial guides: VISUAL_LANGUAGE.md (when to use each mode) + FOOTAGE_SOURCING.md (what's actually available)
- Machine-readable shot list (JSON) for asset sourcing

### Audio
- Recording: Audacity or GarageBand
- Post-processing: automated noise removal + EQ
- Future: ElevenLabs voice clone (after 50+ episodes)

### Publishing
- YouTube Studio for long-form
- TikTok/YouTube Shorts for short-form
- Thumbnail generation: planned, not built

---

## What's Not Built Yet

These items are documented in the pipeline but don't exist as runnable tools:

1. **Platform adapter** — Reformat long-form into Shorts cuts with different hooks, aspect ratios, pacing. Currently manual.
3. **Thumbnail generator** — Remotion compositions for thumbnails. Planned, not built.
4. **Full Agent SDK orchestration** — Custom multi-agent pipeline replacing the Claude.ai Projects + Cowork workflow. Deferred until 10+ episodes validate the manual workflow. See RESEARCH_WORKFLOW.md → "Future Evolution" section.
5. **RAG fact-checking pipeline** — Automated verification against a source database. Currently handled by research-audit skill's web search + human judgment.
6. **Automated Shorts extraction** — Identify clip-worthy moments in long-form scripts and generate vertical cuts. Currently, Shorts are planned manually from IDEAS.md series concepts.

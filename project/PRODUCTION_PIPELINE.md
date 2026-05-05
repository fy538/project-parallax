# Parallax — Production Pipeline

## Design Constraint
Tiger has 5-10 hours/week alongside a full-time senior data scientist role. The pipeline must minimize human time while keeping human judgment at the points that matter most for content quality and brand integrity.

**Target: ~2-3 hours of human time per video.**

---

## Pipeline Overview (Actual — as of May 4, 2026)

```
TOOL                          STAGE                         HUMAN TIME
────────────────────────────  ────────────────────────────  ──────────
Claude.ai (Topic Radar)       1. Topic Discovery + Signals   ~15 min
  + weekly signal monitoring     (scan + monitor + comp check)
Cowork / manual               2. Viability Check              ~5 min
Claude.ai (Episode Research)  3. Deep Research (3-pass)      ~30 min
Cowork (research-audit)       4. Research Quality Gate        ~10 min
Cowork (angle memo)           5. Script Angle Memo             ~5 min
Cowork (script draft)         6. Script Writing + Direction      —
  radio edit test                (narration-only check)         —
  DIR: annotations               (cam/reveal/hold/cut/mood)    —
Cowork (visual-concept)          Visual Feasibility Audit       —
  ↕ iterate script ↔ visuals     (reshaping loop)               —
Cowork (script-audit)            Narrative QA (8 lenses)        —
Cowork (persona-eval)            Audience Resonance Check       —
Cowork (review-package)          Review Package + Openers       —
HUMAN                            Script Review + Rewrite     ~30 min
Cowork (title workshop)          Title/Hook Workshop          ~5 min
Cowork (visual-spec)          7. Visual Spec → JSON+_direction  ~5 min
Cowork (audio-spec)              Audio Spec → Cue Sheet (DIR-aware) ~5 min
Python CLI (source.py)           Asset Sourcing                 —
Kling 3.0 / Sora 2              AI Video Generation ([AI-GEN:])  —
Python CLI (treat.py)            Image Treatment                —
Python CLI (treat_video.py)      Video Treatment (LUT+ffmpeg)   —
Remotion                         Template Rendering             —
HUMAN                         8. Narration Recording         ~25 min
NLE (DaVinci/Premiere)        9. Final Assembly              ~20 min
HUMAN                        10. Final Review + Publish      ~10 min
```

**Total: ~2.75-3 hours human time per episode** (viability check and signal monitoring add ~20 min but save time by preventing research on weak topics).

The pipeline uses two tools: **Claude.ai** (Deep Research for heavyweight information gathering) and **Cowork** (file system, skills, production). The handoff is a copy-paste of the research brief. See RESEARCH_WORKFLOW.md for the full research stage design.

---

## Stage 1: Topic Discovery + Signal Monitoring

**Tool:** Claude.ai → "Parallax — Topic Radar" project (with Deep Research enabled) + weekly signal monitoring habit

Two parallel activities feed the topic pipeline:

### 1a. Weekly Topic Radar Scan
A Claude.ai Project with custom instructions that encode the Parallax scoring rubric, format library, negative filters, and current arc status. Weekly scan returns 3-5 ranked candidates.

**What it does:**
- Scans current geopolitical developments
- Scores each against 5-criteria rubric (see CONTENT_IDENTITY.md)
- Matches to episode format (Detective, Dialectic, Time Collapse, etc.)
- Checks fit against active arcs (from IDEAS.md)
- Suggests SEO-informed titles

**Human checkpoint:** Review candidates, pick one or add to pipeline, optionally add an angle (~5 min).

**Files uploaded to this project:** CONTENT_IDENTITY.md, IDEAS.md, SEO_KEYWORDS.md (Part 1), CONTENT_RISK_PLAYBOOK.md (Part 4).

**Prompt templates:** See RESEARCH_WORKFLOW.md → "PROJECT 1" section.

### 1b. Signal Monitoring (ongoing, ~30 min/week)
Lightweight weekly habit that feeds IDEAS.md's Signal Watch List. Not a research session — a scanning session.

**Primary sources to monitor (pick 5-7 relevant to active arcs):**
- Foreign Affairs, The Economist, Financial Times (geopolitical analysis)
- Council on Foreign Relations, CSIS, Brookings (think tank output)
- Kalshi, Polymarket, Metaculus (prediction market movements)
- Google Trends for 8-12 core keywords (search velocity, not just volume)
- Comment sections on competitor videos (repeated audience questions = demand signals)
- Academic preprints relevant to active arcs (SSRN, arXiv for AI/tech policy)

**Signal detection test (from intelligence tradecraft):**
A signal is worth capturing when it passes 3 criteria:
1. **Multiple sources** — appears in 3+ independent, credible sources (not echo chamber)
2. **Temporal clustering** — signals clustering in the same month/quarter, not isolated
3. **Causal mechanism** — you can articulate *why* this is happening, not just *that* it's happening

**Output:** Add signals to IDEAS.md → Signal Watch List. Promote to 📡 SIGNAL on an arc topic when the signal connects to an existing idea. See RESEARCH_WORKFLOW.md for detailed monitoring workflow.

### 1c. Competitive Landscape Check (~10 min per topic)
Before advancing any topic past SIGNAL state, check what already exists:
1. Search YouTube for the topic — watch the top 3-5 video intros and read descriptions
2. Scan comment sections for repeated questions the videos didn't answer
3. Identify the **angle gap**: what structural connection, historical parallel, or decoder framing is nobody making?

The goal isn't to avoid covered topics — it's to find the angle only Parallax can take. If you can't articulate the angle gap in one sentence, the topic stays in SIGNAL.

---

## Stage 2: Viability Check (NEW)

**Tool:** Cowork or manual (5 minutes per topic)

The gate between "interesting idea" and "committing 30+ minutes to Deep Research." A one-page viability brief that forces you to confirm depth exists before investing research time.

**The Viability Brief (answer all 5 — if you can't fill this without handwaving, the topic stays in INCUBATING):**

1. **Structural resonance (one sentence):** What hidden structure or pattern are you revealing? Not "here's the semiconductor situation" but "there's a pattern in how empires weaponize technology — and it backfires every time."
2. **Historical parallel (named):** At least one specific historical case you can already name — not "there are parallels" but "Venice's Murano glass monopoly has the same island-concentration logic as TSMC." If you can't name one without research, the depth might not be there.
3. **Decoder framing:** What does the viewer *think* the story is about vs. what it's *actually* about? The gap between surface reading and structural reading is the episode's engine.
4. **Quick rubric (gut check):** Does it pass at least 3 of 5 criteria from CONTENT_IDENTITY.md without deep research? (Wait-what, arguable thesis, two-pillar, timely-or-timeless, compounding)
5. **Angle gap (from competitive check):** What is Parallax saying about this that nobody else is? One sentence.

**Verdicts:**
- **VIABLE** — all 5 answered substantively → advance to Deep Research (Stage 3)
- **INCUBATING** — 3-4 answered but gaps remain → return to monitoring, check back in 2-4 weeks
- **REJECT** — fewer than 3 answered → archive the idea or demote to Signal Watch List

**Human checkpoint:** Tiger reviews the viability brief (~5 min). This is a fast kill-or-proceed decision.

**Output:** Update IDEAS.md status to ✅ VIABLE. Save viability brief to `episodes/<slug>/viability.md` (optional — can also be a note in IDEAS.md).

---

## Stage 3: Deep Research (multi-pass)

**Tool:** Claude.ai → "Parallax — Episode Research" project (with Deep Research enabled)

Per-episode deep research producing a structured 8-section brief. Now structured as three passes instead of one big run, to ensure knowledge density and cross-domain connection quality.

**Pass 1 — Foundation Sweep:**
- Multi-step agentic web research (100-250+ sources per query)
- Produces the initial 8-section brief structure
- Focus: get the core argument, key claims, obvious historical parallels, data points
- This is the current Deep Research workflow — one big run

**Pass 2 — Cross-Domain Connection Hunt:**
- Targeted follow-up specifically designed to surface surprising connections
- Use the bisociation method: list the topic's core structural concepts (monopoly, geographic concentration, geopolitical leverage), then deliberately search across adjacent civilizations and domains (Chinese, Islamic, Roman, Venetian, Ottoman, Mongol history; game theory, economics, philosophy, literature, science)
- The goal: find the 2-3 connections that make viewers think "I never would have put those two things together"
- This pass often requires 2-3 separate Deep Research prompts, each targeting a different domain

**Pass 3 — Verification + Depth:**
- Verify the top 3-5 load-bearing claims from Passes 1-2
- Deepen the strongest 2-3 cross-domain connections: confirm the structural mechanism holds, find where the analogy breaks, locate primary sources
- Run the fact-check prompt on anything that will anchor a key narrative beat

**Human checkpoint:** Review brief for factual issues or forced analogies (~15-30 min, can overlap with other work).

**Output:** Save brief to `episodes/<slug>/brief.md`

**Supplementary prompts available for:** historical deep dives, framework investigations, contemporary context updates, fact-check passes. See RESEARCH_WORKFLOW.md for all prompt templates including the new Pass 2 cross-domain prompt.

**Files uploaded to this project:** PROJECT_VISION.md, CONTENT_RISK_PLAYBOOK.md, SEO_KEYWORDS.md, silicon-trap brief.md (as gold-standard example).

**Prompt templates:** See RESEARCH_WORKFLOW.md → "PROJECT 2" section.

---

## Stage 4: Research Quality Gate

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

## Stage 5: Script Angle Memo

**Tool:** Cowork (structured ideation step)

The bridge between analytical brief and narrative script. This is where the *narrative strategy* gets decided — before anyone writes 2,700 words of narration. The brief is organized analytically (8 sections). The script needs to be organized by tension. This step makes the translation explicit.

**What it produces:** A one-page memo (~300-500 words) that locks the following decisions:

1. **Named conceptual product** — the 2-3 word portable idea viewers carry away ("The Silicon Trap," "The Strategy Matrix"). Must be rigorously defined including where it breaks down.
2. **Cold open type + draft** — choose from the 6-type taxonomy (stakes-shock, diaristic, news-anchor + assumed prep, framework-promise, track-record callback, provocation/dare). Write 2-3 draft openers. See JIANG_NARRATIVE_RESEARCH.md opening hooks section.
3. **Cross-domain connections selected** — from the brief's 4-5 connections, which 2-3 will anchor the script? Rank by surprise ("would an educated viewer find this unexpected?") and resonance ("does this connection deepen the thesis?").
4. **Emotional arc** — one sentence per beat: what the viewer *feels*, not what they *learn*. E.g., "disorientation → recognition → empathy → entrapment → personal stakes."
5. **Stakes sentence** — how is the viewer personally implicated? Must appear in the first 30 seconds.
6. **Decoder framing** — what's the "hidden structure" being revealed? Not "here's the semiconductor situation" but "there's a pattern in how empires weaponize technology — and it backfires every time."
7. **Series tag** (if applicable) — does this episode belong to a numbered series? What's the tag?
8. **Working title options** (3-5) — following Jiang titling mechanics: named concept, information-asymmetry framing, series tag. See SEO_KEYWORDS.md for keyword constraints.
9. **Visual arc** — the visual layer's parallel narrative plan. Three elements: (a) the visual motif — a recurring element tied to the named concept that evolves across the episode (e.g., a net diagram that tangles progressively for "The Silicon Trap"), (b) 2-3 visual-first moments where the image should arrive before narration explains it, and (c) 1-2 visual counterpoint moments where the visual deliberately tensions with the narration. See VISUAL_LANGUAGE.md → "Visual-Narrative Timing" section. This ensures the visual layer is planned as a co-equal storytelling channel, not back-filled after the narration locks.

**Why this step exists:** silicon-trap went through 4 script versions. The biggest structural changes (v2→v3 reorganization from logic-order to tension-order, v4 visual layer overhaul) happened because narrative decisions were discovered during revision rather than made upfront. The angle memo front-loads these decisions. It doesn't prevent revision — it prevents *discovering your story on draft 3*.

**Human checkpoint:** Tiger reviews the memo (~5 min) and picks or modifies the cold open, title direction, and connection selection. This is a fast decision-making step, not a reading step.

**Output:** `episodes/<slug>/angle-memo.md`

---

## Stage 6: Script Development

**Tool:** Cowork (conversational drafting + skills)

Script development happens in Cowork with access to the research brief, angle memo, project memory files, and production skills. The key insight: script and visuals are co-developed iteratively, not sequentially. The visual-concept skill enables this by feeding visual feasibility back into the script before it locks.

**Workflow:**
1. Ask Cowork to read the brief AND the angle memo, then draft a two-column production script with direction annotations (see SCRIPT_FORMAT.md + DIRECTING_LANGUAGE.md). The angle memo's cold open, emotional arc, decoder framing, visual arc, and connection selections direct the draft — the script should execute the narrative strategy, not discover it. Phase 3 of drafting adds `DIR:` annotations for camera (`cam()`), reveal choreography (`reveal()`), timing (`hold()`), transitions (`cut()`), and mood (`mood()`) on P1/P2 hero moments.
2. **Radio edit test** — read the narration column alone (left column only) as if it were a podcast. Does the argument hold? Do transitions work? Is the pacing engaging without any visuals? If yes, the visual layer can be designed as additive (the ideal state). If no, fix the narration first — visuals that prop up weak narration create a fragile script. See VISUAL_LANGUAGE.md → "The Radio Edit Test."
3. Run **visual-concept** skill — audits the right column for feasibility, tool fit, visual variety, and treatment-narrative alignment. Returns script reshaping suggestions where the narration should adapt to visual reality.
4. Iterate script based on visual-concept feedback (reshape narration to enable better visuals, reassign tool choices, fix monotony)
5. Run **script-audit** skill — checks for broken transitions, lecture patterns, missing human moments, pacing problems, unverified claims, decoder posture (Lens 7), and connection density (Lens 8)
6. Run **persona-eval** skill — evaluates resonance across 5 target audience personas, including visual engagement per persona and visual tension map
7. Iterate based on audit findings.
8. Run **review-package** skill — synthesizes visual-concept + script-audit + persona-eval into a single prioritized review document for Tiger's 30-minute session. Produces cross-audit priority fix list, persona-visual cross-analysis, 2-3 cold-open variants (refined from angle memo), and 2-3 decision points.

**Human checkpoint:** Script review and rewrite (~30 min). Tiger reads the **review-package** output — one document that merges all three audits, ranks fixes by cross-audit impact, presents cold-open alternatives, and surfaces only the decisions he needs to make. This replaces reading three separate reports.

9. After rewrite: run **visual-concept re-validation** (quick-check mode) — lightweight 3-lens check that the revised narration still aligns with the visual layer. Catches template-narration drift, P1 misalignment, and rhythm breaks from the rewrite.
10. **Title/hook workshop** — finalize the title, cold open, and thumbnail concept as a package. This is a structured step, not an afterthought. Inputs: the angle memo's working titles, the review-package's cold-open variants, the named conceptual product, and SEO_KEYWORDS.md. Outputs: final title (with series tag if applicable), final cold-open paragraph, and a thumbnail concept brief (visual + text overlay + emotion). The title and open should work as a unit — the title promises, the open delivers, the thumbnail sells both. See JIANG_NARRATIVE_RESEARCH.md titling mechanics section.

**Human checkpoint:** Tiger approves title + open + thumbnail concept (~5 min). This is a pick-or-tweak step.

**Output:** Two-column production script at `episodes/<slug>/script-v[N]-production.md`, containing:
- Left column: full narration text with delivery notes
- Right column: visual production specs (source type, search terms, treatment, composite mode, duration, priority) + `DIR:` annotations for camera, reveals, timing, transitions, and mood on hero moments
- Asset summary tables (Remotion compositions, stock footage, archival images) + direction summary (segments directed, sync points, register transitions with explicit cut())
- Machine-readable shot list (`shot-list.json`) for the asset sourcing tool

**Script format spec:** See SCRIPT_FORMAT.md for the complete two-column format definition. See DIRECTING_LANGUAGE.md for the `DIR:` annotation syntax (five directives: `cam()`, `reveal()`, `hold()`, `cut()`, `mood()`).

**The script IS the edit.** After direction annotations are added, no directing decisions happen outside the script. Everything downstream (visual-spec JSON, AI-GEN briefs, audio cues, assembly manifest timing) executes the script's decisions deterministically.

**Skills used:**
- **visual-concept** — visual feasibility + tool fit + monotony + treatment-narrative alignment across 5 lenses; includes re-validation quick-check mode (installed in Cowork plugins)
- **script-audit** — narrative quality across 8 lenses (5 narrative + visual layer + decoder posture + connection density) (installed in Cowork plugins)
- **persona-eval** — audience resonance check against 5 personas, now with visual engagement scoring and visual tension map (installed in Cowork plugins)
- **review-package** — cross-audit synthesis into single review document for human checkpoint (installed in Cowork plugins)
- **thumbnail-concept** — 3 thumbnail composition concepts (Juxtaposition, Data Provocation, Symbolic) with text overlays and A/B variants, used during title/hook workshop (installed in Cowork plugins)

---

## Stage 7: Visual Production

Four parallel tracks feed into final assembly:

### Track A: Remotion Template Rendering + Footage Planning

**Tool:** Cowork → visual-spec skill → Remotion + source.py

1. Run **visual-spec** skill on the approved script → Step 1.5 checks `data/concepts.json` for prior-episode concepts (use `tools/concepts/lookup.py reuse-check` as CLI shortcut) and marks callbacks with 🔄 → produces visual breakdown table covering ALL five visual modes (`[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`, `[AI-GEN:]`, `[ILLUST:]`), with mode balance check against targets and direction column showing parsed `DIR:` annotations
2. Human approves the visual plan (~5 min)
3. Skill generates four outputs: (a) Remotion JSON data files for all MG compositions — including `_direction` blocks parsed from `DIR:` annotations (camera paths, reveal modes, hold timing, transition specs, atmosphere); (b) `footage-manifest.json` with `_direction` for hold/mood/cut per clip; (c) Recraft illustration specs for `[ILLUST:]` segments with direction-informed treatment and mood; (d) AI video briefs for `[AI-GEN:]` segments with `cam()` translated to natural-language camera direction and `mood()` to scene atmosphere
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

**Data files:** `remotion-templates/data/episodes/<slug>/` — JSON files following naming convention `{template-type}-{descriptive-slug}.json`

**Design system:** BRAND.md (canonical) → theme.ts (code implementation). Meridian dual-mode system. See `remotion-templates/BRAND.md`.

### Track A2: Audio Spec → Cue Sheet

**Tool:** Cowork → audio-spec skill

Runs immediately after visual-spec. Reads the same production script (including `DIR:` annotations) and generates an audio cue sheet. Direction annotations drive audio decisions: `cut()` determines transition SFX type, `hold()` creates silence moments, `mood()` maps to music bed shifts, and `reveal(sync:"word")` places SFX at narration-synced timestamps.

1. Run **audio-spec** skill on the production script
2. Skill analyzes beat structure, emotional arc, visual mode distribution, AND `DIR:` annotations
3. Produces a consolidated cue sheet with three layers:
   - **Music bed plan** — mood assignments per beat with crossfade timings
   - **Transition SFX** — 15-25 event-driven sound markers at segment boundaries and key moments
   - **Texture hits** — 30-50 micro-SFX tied to template animation events
4. Optionally generates assembly manifest JSON extensions (`musicBed` root object, `soundCue`/`textureCues` per segment)

**Reference:** `project/AUDIO_DESIGN.md` (3-layer model, SFX palette, template event → cue mappings, volume hierarchy)

### Track B: Stock Footage + Image Sourcing

**Tool:** Python CLI → `tools/asset-source/source.py`

Searches Pexels, Pixabay, and Unsplash APIs for stock footage and images specified in the shot list.

**Usage:**
```bash
# Single search
python tools/asset-source/source.py "semiconductor cleanroom" --type photo

# Batch from shot list (generated by script format)
python tools/asset-source/source.py --batch episodes/silicon-trap/shot-list.json -o assets/
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

### Track C.5: Video Treatment

**Tool:** Python CLI → `tools/brand-treatment/treat_video.py` (offline) or .cube LUT import (NLE manual grading)

Applies the same 4-step brand treatment to stock video clips via ffmpeg. The desaturation + duotone steps are baked into a .cube 3D LUT file; grain and vignette are ffmpeg filter chain effects.

**Three approaches (choose per clip):**
- **Option A — Automated pipeline:** `treat_video.py` applies LUT + grain + vignette via ffmpeg. Fastest; use for batch processing.
- **Option B — LUT-only treatment:** `treat_video.py --lut-only-treatment` applies only the LUT (skip grain/vignette). Use when grain/vignette will be added in NLE for finer control.
- **Option C — NLE manual grading:** Import `.cube` LUT files into DaVinci Resolve / Premiere Pro / Final Cut Pro. Use when clips need shot-specific adjustments beyond the standard pipeline.

**Usage:**
```bash
# Full treatment (standard ramp)
python tools/brand-treatment/treat_video.py clip.mp4 -r standard -o treated/

# Conflict ramp (geopolitical tension segments)
python tools/brand-treatment/treat_video.py clip.mp4 -r conflict

# Batch all clips
python tools/brand-treatment/treat_video.py clips/*.mp4 -o treated/

# Export LUT files only (for NLE import)
python tools/brand-treatment/treat_video.py --all-luts -o luts/

# Side-by-side preview (first 5 seconds)
python tools/brand-treatment/treat_video.py clip.mp4 --preview
```

**Pre-generated LUTs:** `tools/brand-treatment/luts/` contains all three ramps (parallax_standard.cube, parallax_conflict.cube, parallax_editorial.cube). These are ready to import into any NLE.

**Color math verification:** The LUT encodes identical color science to `treat.py` (max per-channel deviation ≤ 1.76 from float→uint8 rounding). Treated video and treated photos will match.

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

**File organization:** SVGs to `remotion-templates/public/illustrations/<slug>/`, animated versions to `src/illustrations/<slug>/`.

---

## Stage 8: Narration Recording

**Tool:** Human + Audacity/GarageBand

**Process (~20-30 minutes per episode):**
- Record in batches when possible (3 episodes in one sitting = ~90 min for 3 weeks of content)
- Equipment: good microphone, quiet room, pop filter
- Style: conversational and thoughtful, "smart friend explaining" tone
- Post-processing: noise removal, compression, EQ (can be automated)

**Future option:** Voice clone (ElevenLabs, Tiger's own voice) for supplementary content after 50+ episodes establish vocal identity.

---

## Stage 9: Final Assembly

**Tools:** `tools/assembly/generate_manifest.py` → Remotion FullEpisode composition → NLE for final polish

The assembly pipeline has two stages:

**Stage 9a — Assembly manifest generation.** `generate_manifest.py` parses the production script's right column — including `DIR:` annotations — and produces `assembly-manifest.json` mapping every second of the video to a visual element (footage, image, template, transition, hold). Direction annotations affect timing: `hold()` extends segment durations, `cut()` overrides default transitions with register-appropriate types (color-wash, blur-through, iris, etc.), `cam(sync:"word")` creates sync word anchors for Whisper alignment. Two modes: "estimate" (from word count at 150 WPM, before narration is recorded) and "precise" (from Whisper word-level timestamps after narration).

```
python tools/assembly/generate_manifest.py \
  --script episodes/silicon-trap/script-v4-production.md \
  --episode silicon-trap --title "The Silicon Trap" \
  --output remotion-templates/data/episodes/silicon-trap/assembly-manifest.json
```

**Stage 9b — Full-episode Remotion render.** `FullEpisode.tsx` reads the assembly manifest and renders the complete video in one pass: `<Audio>` narration + `<Sequence>`-positioned motion graphics + stock footage with BrandImage treatment. Registered as `<slug>-full` in Remotion Studio (e.g., `silicon-trap-full`). This eliminates the NLE for rough cuts — iteration becomes a data-editing session (edit the manifest JSON, re-render).

The NLE (DaVinci Resolve) is still used for final polish: audio mastering, color grading tweaks, and any manual timing adjustments that go beyond what the manifest captures.

---

## Stage 10: Publishing

**Tool:** YouTube Studio (long-form), TikTok/YouTube Shorts (short-form)

**Before publishing:**
1. Run Contemporary Context Update prompt in Claude.ai (things may have changed since research)
2. Run Fact-Check Pass on any remaining unverified claims
3. Final review in Cowork (~10 min)

**Platform targets:**
- YouTube (primary): long-form 15-20 min analytical videos
- YouTube Shorts + TikTok: 30-90 sec discovery content (6 series concepts defined in IDEAS.md)
- Bilibili: deferred to Phase 2 (Year 2) — see D10, D20

**Shorts extraction:** After publish, run **shorts-adaptation** skill on the full episode script. Produces 3-4 standalone Shorts briefs assigned to series (Framework in 45s, History Rhymes, Both Sides Are Wrong, What Happens Next?, The Market Says, Was I Right?), each with hook, narration, Remotion template spec, and scheduling notes (1-2 pre-release, 1-2 post-release). Skill location: `skills/shorts-adaptation/SKILL.md`.

**Not yet built:** Thumbnail image generation via Remotion compositions, platform-specific reformatting, automated Shorts Remotion rendering from briefs.

**Post-publish learning loop (7-14 days after launch):** Run **publish-retro** skill with YouTube Studio analytics data (retention curve, CTR, demographics, top comments). The skill compares actual viewer behavior against persona-eval predictions and the visual rhythm map, produces a retrospective report identifying which production decisions worked and which didn't, and appends findings to `episodes/LEARNING_LOG.md` for cumulative pattern tracking across episodes. After 3+ episodes, the learning log becomes an evidence-based production playbook.

**Skill location:** `skills/publish-retro/SKILL.md`

---

## Episode Sequencing

When multiple topics are VIABLE or RESEARCH READY in the pipeline, use these heuristics to decide what gets produced next:

### Sequencing Heuristics

1. **Format intensity rotation.** Don't schedule two research-heavy formats back-to-back. Time Collapse and Wargame require the deepest research; Detective and Dialectic are moderate; Philosopher's Lens and Advisor Briefing are lighter. Alternate heavy/moderate/light across consecutive episodes.

2. **Arc pacing.** Don't exhaust one arc before starting another. After 2 consecutive episodes in the same arc, switch arcs for at least 1 episode. This keeps each arc fresh and lets slow-burn topics in other arcs continue incubating.

3. **Emotional register variety.** Follow a heavy/dark episode (empire decline, conflict) with something lighter or more hopeful (small state resilience, framework beauty). Audience energy management matters — viewers who just watched a heavy Time Collapse need a different register next.

4. **Buffer maintenance.** Always have 1-2 topics at RESEARCH READY or VIABLE so you can respond to breaking events (Advisor Briefing format) without derailing the planned production schedule. The reactive slot (30-40% of calendar) draws from this buffer.

5. **Production difficulty awareness.** Some weeks Tiger has 10 hours, some weeks 5. Time Collapse and Wargame episodes should be scheduled for high-availability weeks. Philosopher's Lens and Dialectic can fit lighter weeks.

### 90-Day Rolling Calendar

Maintain three planning horizons:
- **Immediate (2-4 weeks):** Topics that are RESEARCH READY or in production. Specific, scheduled.
- **Medium (1-3 months):** Topics that are VIABLE, in rough sequence order based on heuristics above. Flexible.
- **Long (3-12 months):** Topics INCUBATING. Check monthly for ripeness signals.

---

## Production Cadence

### Target: 1 long-form video per week + 3-5 Shorts

**Weekly schedule:**
- Monday: Signal monitoring scan + Topic Radar (if needed) (~15 min)
- Monday: Viability check on next candidate topic (~5 min)
- Tuesday–Wednesday: Deep research via Claude.ai Episode Research, 3-pass (~30 min human time)
- Wednesday: Research audit in Cowork (research-audit skill) (~10 min)
- Wednesday: Script angle memo in Cowork → Tiger reviews (~5 min)
- Wednesday–Thursday: Script development in Cowork (draft + radio edit + audits + review-package) + human review (~30 min)
- Thursday: Title/hook workshop → Tiger approves (~5 min)
- Friday: Visual spec generation + asset sourcing + template rendering
- Saturday: Narration recording (batch covers 2-3 episodes)
- Sunday: Final review, contemporary context check, publish

### Total human time: ~3 hours/week
- Signal monitoring + topic selection: 15 min
- Viability check: 5 min
- Research review: 30 min
- Research audit review: 10 min
- Angle memo review: 5 min
- Script review + rewrite: 30 min
- Title/hook approval: 5 min
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
- **research-audit** — 8-lens brief quality gate incl. connection density (also at `skills/research-audit/SKILL.md`)
- **angle-memo** — 10 narrative decisions before script drafting (also at `skills/angle-memo/SKILL.md`)
- **script-draft** — 3-phase production script drafting (narration → radio edit → visual + DIR: annotations); emits `DIR:` lines for P1/P2 moments (also at `skills/script-draft/SKILL.md`)
- **visual-concept** — 6-lens visual feasibility audit with script reshaping feedback + re-validation quick-check mode (also at `skills/visual-concept/SKILL.md`)
- **script-audit** — 8-lens narrative quality review incl. decoder posture, connection density, and 6 direction-specific checks (also at `skills/script-audit/SKILL.md`)
- **persona-eval** — audience resonance check with visual engagement scoring and visual tension map (also at `skills/persona-eval/SKILL.md`)
- **review-package** — cross-audit synthesis with cold-open variants for Tiger's 30-min review session (also at `skills/review-package/SKILL.md`)
- **visual-spec** — script → 4 outputs: Remotion JSON data files (with `_direction` blocks parsed from DIR: annotations), Recraft illustration specs, footage manifest, AI video briefs (also at `skills/visual-spec/SKILL.md`)
- **audio-spec** — 3-layer cue sheet (music bed + transition SFX + texture hits); direction-aware: cut()→SFX type, hold()→silence, mood()→music shifts, reveal(sync:)→SFX timestamps (also at `skills/audio-spec/SKILL.md`)
- **render-qa** — pre-assembly composition verification with frame-check commands and per-template checklists (also at `skills/render-qa/SKILL.md`)
- **source-feedback** — post-sourcing gap analysis and alternative visual suggestions (also at `skills/source-feedback/SKILL.md`)
- **publish-retro** — post-publish analytics retrospective with persona prediction validation and cumulative learning (also at `skills/publish-retro/SKILL.md`)
- **thumbnail-concept** — 3 composition approaches (Juxtaposition, Data Provocation, Symbolic) + A/B text variants (also at `skills/thumbnail-concept/SKILL.md`)
- **shorts-adaptation** — 6 series, standalone Shorts briefs from full script (also at `skills/shorts-adaptation/SKILL.md`)

### Visual Production (built)
- **Remotion** — React-based video renderer (7 core + 4 format-specific + 3 Shorts templates)
- **Design system** — `remotion-templates/BRAND.md` (canonical) + `remotion-templates/src/design/theme.ts` (code)
- **Brand treatment CLI (images)** — `tools/brand-treatment/treat.py`
- **Brand treatment CLI (video)** — `tools/brand-treatment/treat_video.py` (ffmpeg + 3D LUT)
- **Pre-generated LUTs** — `tools/brand-treatment/luts/` (standard, conflict, editorial .cube files for NLE import)
- **BrandImage component** — `remotion-templates/src/components/BrandImage.tsx` (render-time SVG filters)
- **Asset sourcing** — `tools/asset-source/source.py` (Pexels/Pixabay/Unsplash)
- **Render scripts** — `remotion-templates/scripts/` (local bash/Node + Lambda)

### Script Format (designed)
- **Two-column production script** — SCRIPT_FORMAT.md
- Narration (left) + visual production specs with mode tags (right): `[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`, `[AI-GEN:]`, `[ILLUST:]`
- **DIR: annotations** — inline directing language (`cam()`, `reveal()`, `hold()`, `cut()`, `mood()`) embedded in the visual column for P1/P2 moments. Spec: DIRECTING_LANGUAGE.md. Target density: ~25% of compositions directed, ~20-35 DIR: lines per episode
- Visual mode balance targets: MG 40-55%, FOOTAGE 30-40%, LAYERED 5-15%, AI-GEN/ILLUST as needed
- Editorial guides: VISUAL_LANGUAGE.md (when to use each mode) + FOOTAGE_SOURCING.md (what's actually available)
- **Direction pipeline**: script-draft emits DIR: → visual-spec parses to `_direction` JSON → audio-spec reads for SFX/music decisions → generate_manifest.py consumes hold/cut/sync timing
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

1. **Platform adapter** — Automated Remotion rendering of Shorts from briefs (the shorts-adaptation skill generates briefs, but rendering to 9:16 video is manual). Currently manual.
2. **Thumbnail image generator** — Remotion compositions for thumbnail images (the thumbnail-concept skill generates composition briefs, but no automated image generation yet).
3. **Full Agent SDK orchestration** — Custom multi-agent pipeline replacing the Claude.ai Projects + Cowork workflow. Deferred until 10+ episodes validate the manual workflow. See RESEARCH_WORKFLOW.md → "Future Evolution" section.
4. **RAG fact-checking pipeline** — Automated verification against a source database. Currently handled by research-audit skill's web search + human judgment.

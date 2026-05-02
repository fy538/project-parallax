# Parallax — Project Overview

> Last updated: April 26, 2026

## What this is

**Parallax** is a solo YouTube channel analyzing contemporary geopolitics through historical analogy and philosophical frameworks. Created by Tiger (senior data scientist, Math + Philosophy from NYU). AI-assisted research and production pipeline, human narration and editorial judgment.

**Current status:** Pre-launch. EP01 ("The Silicon Trap" — US-China semiconductor geopolitics) has a finalized production script (v4), 7 Remotion templates built, brand system designed, and production tools ready. No episodes published yet.

## Folder structure

```
project-parallax/
├── CLAUDE.md                  ← YOU ARE HERE — project overview for AI sessions
├── project/                   # Strategy and planning docs
│   ├── PROJECT_VISION.md      # Content philosophy, audience, competitive positioning, voice profile
│   ├── PRODUCTION_PIPELINE.md # End-to-end pipeline with actual tools and handoff steps
│   ├── RESEARCH_WORKFLOW.md   # Claude.ai Deep Research + Cowork hybrid workflow
│   ├── SCRIPT_FORMAT.md       # Two-column production script format spec (with visual mode tags)
│   ├── VISUAL_LANGUAGE.md     # Editorial guide: when to use footage vs. MG vs. layered
│   ├── FOOTAGE_SOURCING.md    # Sourcability map for geopolitics footage
│   ├── CONTENT_IDENTITY.md    # 8 identity directions, 7 episode formats, topic scoring rubric
│   ├── SVG_ILLUSTRATION_PIPELINE.md # AI illustration generation, polish, and Remotion integration
│   ├── CONTENT_RISK_PLAYBOOK.md # Editorial red lines, platform risks, crisis playbook
│   ├── DECISIONS.md           # 37 decisions with rationale + open questions
│   ├── IDEAS.md               # Arc-based topic backlog (5 arcs seeded)
│   ├── SEO_KEYWORDS.md        # Keyword strategy for Arc 1 episodes
│   ├── RESEARCH_LOG.md        # Session-by-session research log
│   └── JIANG_NARRATIVE_RESEARCH.md # Narrative technique reference (decoder posture, 12 extractable techniques, toxin line)
├── episodes/                  # Per-episode work
│   ├── EDITORIAL_PLAYBOOK.md  # Living production rules (compounding knowledge — skills read this)
│   ├── LEARNING_LOG.md        # Post-publish analytics findings (populated by publish-retro)
│   └── EP01-silicon-trap/
│       ├── brief.md           # Research brief (gold standard example)
│       ├── script-v4-production.md  # Current production script (two-column format)
│       ├── script-v3.md       # Previous narration-only script
│       ├── shot-list.json     # 21 assets for sourcing tool (16 stock + 5 archival)
│       ├── REVISION_LOG.md    # Script revision history
│       ├── drafts/            # Earlier script versions (v1, v2)
│       └── research/          # Research prompts and pipeline design notes
├── remotion-templates/        # Remotion project (React → MP4)
│   ├── BRAND.md               # Canonical design system (Meridian dual-mode)
│   ├── CLAUDE.md              # Remotion-specific project context
│   ├── IMAGES.md              # Image sourcing and treatment pipeline
│   ├── LESSONS.md             # Technical gotchas (52 lessons)
│   ├── POLISH.md              # Visual quality spec
│   ├── src/templates/         # 12 core + 4 format-specific + 3 Shorts templates
│   ├── src/design/theme.ts    # Code implementation of BRAND.md
│   ├── src/components/        # Shared components (Background, MetadataStrip, BrandImage, etc.)
│   ├── data/episodes/ep01/    # 24 JSON data files + assembly-manifest.json for EP01
│   ├── data/assembly-manifest.schema.json  # Assembly manifest JSON schema
│   └── scripts/               # Render scripts (local + Lambda)
├── tools/
│   ├── assembly/generate_manifest.py  # Assembly manifest generator (script → JSON)
│   ├── brand-treatment/treat.py  # 4-step image treatment CLI (BRAND.md pipeline)
│   └── asset-source/source.py    # Stock photo/video sourcing (Pexels/Pixabay/Unsplash)
├── skills/
│   ├── research-audit/SKILL.md   # Research brief quality gate (7 lenses + verdict)
│   ├── visual-concept/SKILL.md   # Visual feasibility audit (5 lenses + script reshaping + re-validation mode)
│   ├── review-package/SKILL.md   # Cross-audit synthesis for human review session
│   ├── persona-eval/SKILL.md     # Audience resonance (5 personas, visual-aware)
│   ├── source-feedback/SKILL.md  # Post-sourcing gap analysis + alternative suggestions
│   ├── render-qa/SKILL.md        # Pre-assembly composition verification + frame checks
│   ├── publish-retro/SKILL.md    # Post-publish analytics retrospective + learning loop
│   └── asset-source/SKILL.md     # Stock asset sourcing, scoring, and ranking
└── prompts/                   # Reusable prompt templates
```

## Key relationships between files

- **BRAND.md** is the single source of truth for colors, typography, and visual treatment. `theme.ts` implements it in code. `treat.py` implements the same 4-step image pipeline in Python. `BrandImage.tsx` implements it as SVG filters for Remotion.
- **SCRIPT_FORMAT.md** defines the two-column format with visual mode tags (`[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`). `script-v4-production.md` is the working example. The right column feeds `visual-spec` (for Remotion JSON + footage manifest), `source.py` (for stock footage), and `generate_manifest.py` (for assembly manifest).
- **VISUAL_LANGUAGE.md** is the editorial guide for *when* to use footage vs. MG vs. layered. It defines the three visual modes, pacing rules (max 3 consecutive MGs, max 30s footage), and the decision heuristic. Script writers and script-audit consult this.
- **FOOTAGE_SOURCING.md** is the *where* guide — what footage exists for geopolitics content, organized by sourcability tier (Easy/Moderate/Hard/Unsourceable). Visual-spec and source-feedback skills consult this.
- **Assembly manifest** (`assembly-manifest.json`) is the bridge between script and rendered video. Generated by `tools/assembly/generate_manifest.py`, consumed by `FullEpisode.tsx`. Maps every second to a visual element.
- **RESEARCH_WORKFLOW.md** documents the exact Claude.ai Project configurations, custom instructions, and prompt templates for both Topic Radar and Episode Research.
- **PRODUCTION_PIPELINE.md** is the end-to-end map — every stage lists the actual tool, skill, or human action involved.
- **SVG_ILLUSTRATION_PIPELINE.md** covers AI-generated illustrations — when to use SVG vs raster API, prompt engineering, polish audit checklist, and Remotion integration patterns. Companion to IMAGES.md (stock photos) and BRAND.md (design system).
- **DECISIONS.md** is the decision log — 36 decisions with rationale. Check here before proposing something that may already be decided.
- **JIANG_NARRATIVE_RESEARCH.md** is the narrative technique reference. It defines the "decoder, not explainer" posture, 12 extractable techniques, and the toxin-vs-technique line. Referenced by PROJECT_VISION.md (voice profile), EDITORIAL_PLAYBOOK.md (NAR-09 through NAR-13), and the script drafting process. Script-audit should check scripts against the toxin line (NAR-13).
- **EDITORIAL_PLAYBOOK.md** is the compounding knowledge system. It contains channel-level production rules extracted from episode-specific learnings (revision logs, audit reports, analytics). Six skills read from it before running (research-audit, script-audit, visual-concept, persona-eval, review-package, publish-retro). publish-retro writes back to it after analytics validate or contradict rules. This is the mechanism that makes episode 10 structurally better than episode 1.
- **LEARNING_LOG.md** is the post-publish analytics record. Populated by publish-retro, it tracks persona prediction accuracy, visual type performance, and retention patterns. persona-eval reads it to self-correct predictions; other skills reference it for evidence-based decision-making.

## Production pipeline (quick reference)

```
Claude.ai (Topic Radar)  →  Claude.ai (Episode Research)  →  Cowork: research-audit
     →  Cowork: script draft  →  visual-concept (feasibility ↔ script reshaping loop)
     →  script-audit  →  persona-eval (visual-aware)  →  review-package (synthesis)
     →  Human review (reads one doc)  →  visual-concept re-validation (quick check)
     →  visual-spec  →  asset sourcing  →  source-feedback (gap analysis)
     →  image treatment  →  Remotion render  →  render-qa (composition verification)
     →  Human narration  →  NLE assembly  →  Publish
     →  publish-retro (7-14 days post-launch → LEARNING_LOG.md + EDITORIAL_PLAYBOOK.md)

Knowledge feedback loops (skills read before running, publish-retro writes after analytics):
     EDITORIAL_PLAYBOOK.md ←── publish-retro (validates/retires rules from analytics)
            ↓ read by
     research-audit, script-audit, visual-concept, persona-eval, review-package
            ↓ flag
     Candidate Rules (proposed in review-package → approved by Tiger → added to playbook)
```

Ten Cowork skills are installed: **research-audit**, **visual-concept** (+ re-validation mode), **script-audit**, **persona-eval** (visual-aware), **review-package**, **visual-spec**, **source-feedback**, **render-qa**, **publish-retro**, and **asset-source**.

## What's built vs. what's not

**Built and verified:**
- 12 core Remotion templates + 4 format-specific + 3 Shorts variants (new: NetworkDiagram, TimeSeriesChart, SankeyFlow, GameBoard, PhotoMontage)
- Full-episode Remotion composition (FullEpisode.tsx — manifest-driven, renders complete video)
- Assembly manifest generator (tools/assembly/generate_manifest.py — estimate + Whisper modes)
- Assembly manifest schema (assembly-manifest.schema.json)
- Brand system (BRAND.md + theme.ts + shared components)
- Image treatment pipeline (Python CLI + Remotion component)
- Asset sourcing tool (Pexels/Pixabay/Unsplash) + asset-source skill (5-dimension scoring)
- SVG illustration pipeline (visual vocabulary, prompt template, polish process — Claude SVG only)
- 10 production skills (research-audit, visual-concept, script-audit [6 lenses incl. visual layer], persona-eval, review-package, visual-spec [MG JSON + footage manifest], source-feedback, render-qa, publish-retro, asset-source)
- Compounding knowledge system (EDITORIAL_PLAYBOOK.md + LEARNING_LOG.md + feedback loops wired into 6 skills)
- Footage layer framework (VISUAL_LANGUAGE.md editorial guide + FOOTAGE_SOURCING.md sourcability map + visual mode tags in SCRIPT_FORMAT.md)
- Research workflow design (two Claude.ai Projects with instructions + prompts)
- EP01 production script + shot list
- Render scripts (local + Lambda)
- Shared template utilities (layoutPresets, drawLine, countUp, mapUtils)
- MapGL shared component (real Mapbox GL + react-map-gl v8 + deck.gl v9 — terrain, DeckGLOverlay, delayRender lifecycle)
- Mapbox GL migration complete: ChoroplethMap (vector tile country fills) + RouteAnimation (ArcLayer routes, Marker labels)
- mapUtils: hexToRgba, scaleToZoom (legacy conversion), CameraState, cameraPresets, interpolateCamera

**Not built:**
- Mapbox Studio custom "Meridian Dark" style (using dark-v11 fallback — warm umber palette documented in MAPBOX_STUDIO_GUIDE.md, awaiting Studio setup)
- Platform adapter (long-form → Shorts reformatting)
- Thumbnail generator
- Full Agent SDK orchestration (deferred to 10+ episodes)

## EP01 status

- Research brief: complete (gold standard)
- Script: v4 production format (two-column, fully specified)
- Shot list: 21 assets (16 stock footage, 5 archival images)
- Remotion data files: 24 files generated from v3 — **need regeneration from v4** (composition list changed)
- Assembly manifest: generated (estimate mode, 53 segments, 13.1 min estimate)
- Full-episode composition: registered as EP01-Full (renders complete video from manifest)
- Stock footage: not yet sourced (shot-list.json ready for source.py)
- Narration: not recorded
- Assembly: tooling built, awaiting narration + sourced assets for full render

## Channel identity

**Name:** Parallax — viewing the same object from different analytical positions.
**Brand mark:** ∴ (therefore symbol)
**Visual system:** Meridian dual-mode (Light for in-video [primary], Dark for dramatic moments [secondary])
**Palette:** ink (#1C1814, warm umber), amber (#E5A544), rust (#C23B22), bone (#F0E6D0), paper (#F5F0E8), oxblood (#6B1D1D)
**Fonts:** Space Grotesk (display), IBM Plex Mono (body/metadata), JetBrains Mono (data), Noto Sans SC (Chinese)

## Content philosophy

"Educated mysticism" — structural patterns across civilizations presented as heuristic lenses, not predictions. Three pillars: historical analogy, philosophical frameworks, contemporary geopolitics. Tone: intellectually rigorous but narratively engaging. "Smart friend explaining something fascinating over drinks."

**Always:** "structural resonance," "echoes," "this suggests," explicit uncertainty
**Never:** "this proves," conspiracy framing, declarative predictions, false confidence

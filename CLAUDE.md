# Parallax — Project Overview

> **For build/test/lint commands and dev conventions, read [AGENTS.md](./AGENTS.md) first.** This file is the project context (what Parallax is, what's queued, voice anchors).
>
> Last updated: May 16, 2026

## What this is

**Parallax** is a solo YouTube channel analyzing contemporary geopolitics through historical analogy and philosophical frameworks. Created by Tiger (senior data scientist, Math + Philosophy from NYU). AI-assisted research and production pipeline, human narration and editorial judgment.

## Status

**Pre-launch.** Episode numbers are assigned at publish time via `episodes/publish-order.json`; during development everything is identified by slug.

| Slug | State | Notes |
|---|---|---|
| `prisoners-dilemma` | **Launch candidate** | VIABLE — needs Deep Research, then full pipeline. Format: Philosopher's Lens. Why first: evergreen, high compounding, showcases the analytical method. |
| `silicon-trap` | Queued | Production-ready: script v5, 21-asset shot list, 24 Remotion data files, assembly manifest (53 segments, 13.1 min). Stock footage and narration not yet sourced. |
| `blockades-leak` | Draft | v1 script, needs viability re-check for historical depth. |

**Built but pending manual deployment:** Mapbox Studio "Meridian Dark" custom style — code wired in `MapGL.tsx`, preset JSON ready at `remotion-templates/meridian-dark-preset.json`, 15-step guide at `tools/mapbox-meridian-setup.md`. Remaining work is the 2–3 hour manual procedure in Mapbox Studio web UI (fork + customize + publish + paste URL into `.env`). Until then, fallback is dark-v11.

**Shipped May 14, 2026:**
- Thumbnail image generator: `remotion-templates/scripts/generate-thumbnails.mjs` + `npm run thumbnails -- --episode=<slug>` renders all concepts from `episodes/<slug>/thumbnail-spec.json`.
- Automated Shorts rendering: `remotion-templates/scripts/render-shorts.mjs` + `npm run shorts -- --episode=<slug>` renders 9:16 clips from `episodes/<slug>/shorts-manifest.json`.
- AI reference library (Recraft side): 7 anchor categories at `tools/recraft/anchor-library.json` with prompts + generation script. The complementary Flux/fal.ai style-reference library at `tools/ai-video/style-references/` (15 images by typography tradition) was already shipped; they form a 2-tier cascade documented in `tools/recraft/ANCHOR_LIBRARY.md`.

**Shipped May 15–16, 2026:**
- **Text-animation register** — 8 atomic primitives + 3 composite patterns (`typewriter`, `tracking-in`, `reveal-mask`, `underline-draw`, `number-ticker`, `scramble`, `backspace`, `word-cascade` + `definition-reveal`, `stat-caption`, `quote-attribution`). Doctrine: [`project/TEXT_ANIMATION_REGISTER.md`](./project/TEXT_ANIMATION_REGISTER.md). Schema field: `_direction.textAnimation` (Zod-validated enum). KineticTypography dispatches to composite components automatically; archival quotes auto-detect. Lint rule: M-TEXT-ANIM. visual-spec / script-audit / audio-spec skills updated.
- **Cross-episode concept callbacks** — `_direction.isCallback` triggers a one-time accent pulse (color overlay + underline flash + indicator dot, peak 0.75 opacity). Determined automatically by visual-spec via `python tools/concepts/lookup.py callback-check`.
- **Per-element anticipatory reveal (D17 per-element)** — `syncPoints[]` is now positionally indexed across the 7 analytical templates that surface multiple labeled entities (AnnotatedImage, ArcDiagram, BumpChart, EscalationLadder, FrameworkDiagram, HorizontalTimeline, NetworkDiagram). Each entity settles ~150ms before the narrator names it; legacy single-cue fallback preserved.
- **Sourcing brief generator** — `python tools/sourcing_brief.py --episode=<slug>` joins the assembly manifest with `episodes/<slug>/shot-list.json` to emit a Markdown (or CSV) brief listing pending shots with platform search URLs (Pexels / Pixabay / Unsplash / Wikimedia / Internet Archive / Openverse). 38 unit tests; entry in `AGENTS.md`.
- **Camera-primitive consolidation (internal hygiene)** — `src/utils/stepFramework.ts` (`computeStepBoundaries` / `getCurrentStepIndex` / `getStepProgress` / `motionEasings` / `EMPTY_BOUNDARY`) and `src/hooks/useStepFramework.ts` (React wrapper + pure `computeStepFrameworkState`). 6 hook/template consumers migrated + 3 sister map templates. 486 unit tests pass. External research: [`project/CAMERA_CONSOLIDATION_RESEARCH.md`](./project/CAMERA_CONSOLIDATION_RESEARCH.md).
- **Transition grammar** — 6 canonical transitions (cut, dissolve, fade, match-cut/match-cut-still, color-wash, iris), 6 deprecated (wipe-*, blur-through, whip-pan, spatial-zoom). Doctrine: [`project/TRANSITION_GRAMMAR.md`](./project/TRANSITION_GRAMMAR.md). Parser: `DIR: cut(<type>)`, `DIR: jcut(N)` / `DIR: lcut(N)` (J/L-cut NLE bridges, default `narrationLeadIn: 0.7` on every hard cut), `DIR: chapter("TITLE")` sugar (desugars to `TitleTransition` segment). Implicit-default engine in `apply_default_transitions()` handles most seams; match-cut-still auto-applied for same-template map/image seams. Lint rules: M-TRANSITION-DEPRECATED, M-TRANSITION-IRIS-CHART, M-TRANSITION-DISSOLVE-CREEP, M-TRANSITION-IRIS-OVERUSE, M-TRANSITION-COLOR-WASH-TOKEN. Visual reference: `catalog-showcase-transition-grammar`. POLISH.md D21. visual-spec / script-draft / script-audit / audio-spec skills updated.

**Backlog (deferred):**
- BL-03 RAG fact-checking pipeline (P2) — substantial new infra; not blocking pre-launch.
- BL-04 full Agent SDK orchestration (P3) — current skill-based workflow handles the pipeline; promote to orchestrated only when scale demands it (see `project/DECISIONS.md`).

## Channel identity

- **Name:** Parallax — viewing the same object from different analytical positions
- **Brand mark:** ∴ (therefore symbol)
- **Visual system:** Meridian dual-mode — Light (in-video, primary), Dark (dramatic moments, secondary)
- **Palette:** ink `#1C1814`, gold `#C4A747`, bone `#F0E6D0`, paper `#F5F0E8`, walnut `#5C4A3D`, umber `#8B7355`, taupe `#B8A189`, sand `#D9C9B0`, midnight `#2A2520`, dustblue `#7AA3C9`, plus semantic us `#4A7BA7` / china `#A64D46` / neutral `#888780` — single source of truth: [`tools/brand-treatment/palette.json`](./tools/brand-treatment/palette.json)
- **Fonts:** IBM Plex Sans (display, since May 10 2026 — was Space Grotesk), IBM Plex Serif (long-form body), IBM Plex Mono (metadata/kicker/byline), JetBrains Mono (data), Noto Sans SC (Chinese). The Plex superfamily anchors the system in the mid-century corporate-modernist (Burtin/Bayer/Fortune) lineage; see `remotion-templates/BRAND.md` → Typography for rationale.

## Content philosophy

> **Elevator pitch:** *Not a news explainer, not a doom oracle, not an academic lecture — a rigorously argued analogy essay with philosophical guardrails.*

"Educated mysticism" — structural patterns across civilizations presented as heuristic lenses, not predictions. Three pillars: historical analogy, philosophical frameworks, contemporary geopolitics. Tone: intellectually rigorous but narratively engaging — "smart friend explaining something fascinating over drinks."

- **Always:** "structural resonance," "echoes," "this suggests," explicit uncertainty
- **Never:** "this proves," conspiracy framing, declarative predictions, false confidence

**Signature form: bounded analogy.** *"This analogy is useful here, misleading there, dangerous if overextended."* Setup the structural pattern confidently → name where it breaks in one sharp clause → return to the argument. This is the form that differentiates Parallax from civilizational-prophecy channels (Whatifalthist/Zeihan/Jiang) and pure briefing channels (CaspianReport/TLDR). Don't kill a strong analogy because it has a flaw; name the flaw and move on. See `project/PROJECT_VISION.md` → "Bounded Analogy: The Signature Form."

**Editorial doctrine: backstage maximum, frontstage confident.** Verify every quote/date/number/named source backstage; write narration with the confidence that verification has happened. Hedging language and "verified as of" disclaimers belong in the research memo, not the voiceover. Maximum rigor that bleeds into the script reads as flat or evasive; confident voice that skips backstage work reads as Jiang Xueqin. Parallax does both. See [`episodes/EDITORIAL_PLAYBOOK.md`](./episodes/EDITORIAL_PLAYBOOK.md) → Core Doctrine.

**Title rule:** Titles answer *"what structure am I revealing?"*, not *"what topic am I covering?"*. Whatever the present event, the title promises a structure (brittle empires, succession traps, legitimacy crises, imperial overstretch).

## Repo map

```
project-parallax/
├── AGENTS.md             # ★ Build/test/lint commands and dev conventions (read first)
├── CLAUDE.md             # This file — project context and voice anchors
├── project/              # Strategy, pipeline, vision docs
├── episodes/             # Per-episode work (slug-based, not numbered until publish)
├── remotion-templates/   # Remotion (React→MP4) video templates
├── tools/                # Python CLIs: assembly, brand-treatment, asset-source (incl. zerohit_fallback), recraft, concepts, lint (manifest_lint, polish_lint), validate_data, check_audio_cues, check_concept_coverage, check_script_manifest, list_orphan_episode_json, sourcing_brief, preflight/postflight, pipeline_validator, cost_tracker, render_log, migrate_manifest, qa, ai-video, shared (see AGENTS.md for full list; retired tools at tools/_archive/)
├── data/                 # Cross-episode data (concept registry)
├── skills/               # Production skills (research-audit and version-controlled siblings)
├── prompts/              # Reusable prompt templates
└── scripts/              # Single-entrypoint dev scripts (test.sh, typecheck.sh, lint.sh)
```

## Pipeline (one-line)

`signal-scan → topic-viability → research → research-audit → angle-memo → script-draft → visual-concept → script-audit → persona-eval → review-package → title/hook → thumbnail-concept → visual-spec → asset-source → audio-spec → render → narration → NLE assembly → publish → shorts-adaptation → publish-retro`

Full version with handoffs: [`project/PRODUCTION_PIPELINE.md`](./project/PRODUCTION_PIPELINE.md).

## Key documents

Read these when the task requires them:

- [`project/PROJECT_VISION.md`](./project/PROJECT_VISION.md) — content philosophy, audience, voice profile
- [`project/PRODUCTION_PIPELINE.md`](./project/PRODUCTION_PIPELINE.md) — every stage with the actual tool/skill that runs it
- [`project/SCRIPT_FORMAT.md`](./project/SCRIPT_FORMAT.md) — two-column production script spec (with `[FOOTAGE:]`, `[MG:]`, `[LAYERED:]`, `[AI-GEN:]`, `[ILLUST:]` tags)
- [`project/VISUAL_LANGUAGE.md`](./project/VISUAL_LANGUAGE.md) — *when* to use which visual mode; three-register system (Analytical/Atmospheric/Grounding); pacing rules
- [`project/DIRECTING_LANGUAGE.md`](./project/DIRECTING_LANGUAGE.md) — `DIR:` annotation vocabulary (`cam`, `reveal`, `hold`, `cut`, `mood`); how it threads through script-draft → visual-spec → audio-spec → `generate_manifest.py`
- [`project/TEXT_ANIMATION_REGISTER.md`](./project/TEXT_ANIMATION_REGISTER.md) — eight canonical text-animation techniques (Number Ticker, Tracking-In, Reveal Mask, Underline Draw, Typewriter, Backspace, Scramble, Word Cascade); the implicit editorial claim each technique makes; per-technique use/avoid rules with concrete Parallax episode examples; decision matrix for visual-spec skill
- [`project/HOLD_MOTION_REGISTER.md`](./project/HOLD_MOTION_REGISTER.md) — eight canonical hold-beat motion techniques (Stillness, Editorial, Breathing, Settle, Sway, Documentary Ken Burns, Atmospheric particles, Mood pulse) mapped to the existing `DRIFT_PRESETS` cascade. Four registers — A analytical / B editorial-hero / C documentary / D cartographic — with per-template assignments. Sibling of TEXT_ANIMATION_REGISTER for the *between-reveals* moments. Wired via `DIR: drift(<preset>)` / `DIR: hold(stillness)` script directives, `useDirection(data._direction, defaultPreset)` template-default cascade, POLISH.md D20, M-DRIFT-DEFAULT lint, and the `catalog-showcase-drift-register` visual reference card.
- [`project/PACING_SYSTEM.md`](./project/PACING_SYSTEM.md) — proportional camera paths, Whisper sync loop, `PACE:` density budgeting
- [`project/AUDIO_DESIGN.md`](./project/AUDIO_DESIGN.md) — 3-layer model (music bed, transition SFX, texture hits)
- [`project/CONTENT_IDENTITY.md`](./project/CONTENT_IDENTITY.md) — 8 identity directions, 7 episode formats, 3 topic-discovery entry points
- [`project/DECISIONS.md`](./project/DECISIONS.md) — decision log; check before proposing something that may already be decided
- [`project/IDEAS.md`](./project/IDEAS.md) — topic pipeline (signal → incubating → viable → researching → ready → in production)
- [`episodes/EDITORIAL_PLAYBOOK.md`](./episodes/EDITORIAL_PLAYBOOK.md) — compounding production rules; 8 skills read this; `publish-retro` writes to it
- [`episodes/LEARNING_LOG.md`](./episodes/LEARNING_LOG.md) — post-publish analytics findings
- [`remotion-templates/CLAUDE.md`](./remotion-templates/CLAUDE.md) — Remotion-specific design system, templates, rendering
- [`remotion-templates/BRAND.md`](./remotion-templates/BRAND.md) — canonical design system spec (palette.json is the machine source)
- [`remotion-templates/LESSONS.md`](./remotion-templates/LESSONS.md) — technical gotchas worth remembering

## Critical relationships worth knowing

- **`palette.json` is the single source of truth for brand colors.** Changing a brand color: edit `tools/brand-treatment/palette.json` → run `python tools/brand-treatment/treat_video.py --all-luts -o tools/brand-treatment/luts/` to regenerate LUTs → done. Both `theme.ts` (TypeScript) and `palette_loader.py` (Python) read from it.
- **`assembly-manifest.json` is the bridge between script and rendered video.** Generated by `tools/assembly/generate_manifest.py`, consumed by `FullEpisode.tsx`. Maps every second to a visual element. See [`remotion-templates/data/assembly-manifest.schema.json`](./remotion-templates/data/assembly-manifest.schema.json).
- **`DIR:` and `PACE:` annotations in scripts thread through the entire pipeline.** Script writers emit them → `visual-spec` parses to `_direction` JSON → `audio-spec` reads them for SFX/music → `generate_manifest.py` consumes timing/transition overrides. Any change to the directing vocabulary touches all four.
- **Concept registry** (`data/concepts.json`) tracks every framework, foreign term, and prediction across episodes. `visual-spec` checks it (Step 1.5) for callback opportunities. CLI: `python tools/concepts/lookup.py search|reuse-check|graph|validate|predictions`. Schema at `data/concept-registry.schema.json`. `validate` runs automatically in `.githooks/pre-commit` when `data/concepts.json` is staged — broken cross-refs, malformed predictions, and ID-format violations block the commit before the registry drifts. Convenience: `npm run lint:concepts` from `remotion-templates/`.
- **Skills installed in `~/.claude/plugins/`** trigger automatically based on task. Production-pipeline skills (research-audit, script-draft, visual-spec, audio-spec, etc.) are listed in [`AGENTS.md`](./AGENTS.md#repo-map) and the `skills/` directory contains version-controlled copies of their `SKILL.md` files.

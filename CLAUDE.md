# Parallax — Project Overview

> **For build/test/lint commands and dev conventions, read [AGENTS.md](./AGENTS.md) first.** This file is the project context (what Parallax is, what's queued, voice anchors).
>
> Last updated: May 9, 2026

## What this is

**Parallax** is a solo YouTube channel analyzing contemporary geopolitics through historical analogy and philosophical frameworks. Created by Tiger (senior data scientist, Math + Philosophy from NYU). AI-assisted research and production pipeline, human narration and editorial judgment.

## Status

**Pre-launch.** Episode numbers are assigned at publish time via `episodes/publish-order.json`; during development everything is identified by slug.

| Slug | State | Notes |
|---|---|---|
| `prisoners-dilemma` | **Launch candidate** | VIABLE — needs Deep Research, then full pipeline. Format: Philosopher's Lens. Why first: evergreen, high compounding, showcases the analytical method. |
| `silicon-trap` | Queued | Production-ready: script v5, 21-asset shot list, 24 Remotion data files, assembly manifest (53 segments, 13.1 min). Stock footage and narration not yet sourced. |
| `blockades-leak` | Draft | v1 script, needs viability re-check for historical depth. |

**Not yet built:** AI video style reference library (7 anchor images), Mapbox Studio "Meridian Dark" custom style (using dark-v11 fallback), automated Shorts rendering, thumbnail image generator, full Agent SDK orchestration.

## Channel identity

- **Name:** Parallax — viewing the same object from different analytical positions
- **Brand mark:** ∴ (therefore symbol)
- **Visual system:** Meridian dual-mode — Light (in-video, primary), Dark (dramatic moments, secondary)
- **Palette:** ink `#1C1814`, amber `#E5A544`, rust `#C23B22`, bone `#F0E6D0`, paper `#F5F0E8`, oxblood `#6B1D1D` — single source of truth: [`tools/brand-treatment/palette.json`](./tools/brand-treatment/palette.json)
- **Fonts:** Space Grotesk (display), IBM Plex Mono (body/metadata), JetBrains Mono (data), Noto Sans SC (Chinese)

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
├── tools/                # Python CLIs: assembly, brand-treatment, asset-source, recraft, concepts
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
- **Concept registry** (`data/concepts.json`) tracks every framework, foreign term, and prediction across episodes. `visual-spec` checks it (Step 1.5) for callback opportunities. CLI: `python tools/concepts/lookup.py search|reuse-check|graph|validate|predictions`. Schema at `data/concept-registry.schema.json`.
- **Skills installed in `~/.claude/plugins/`** trigger automatically based on task. Production-pipeline skills (research-audit, script-draft, visual-spec, audio-spec, etc.) are listed in [`AGENTS.md`](./AGENTS.md#repo-map) and the `skills/` directory contains version-controlled copies of their `SKILL.md` files.

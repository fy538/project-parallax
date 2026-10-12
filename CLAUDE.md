# Parallax — Project Overview

> **For build/test/lint commands and dev conventions, read [AGENTS.md](./AGENTS.md) first.** This file is the project context (what Parallax is, what's queued, voice anchors).
>
> Last updated: October 12, 2026

## What this is

**Parallax** is a solo YouTube channel analyzing contemporary questions through historical analogy and philosophical frameworks. **As of Oct 7, 2026 the editorial focus is shifting to alignment, ethics, and philosophy** (see Focus below); the existing geopolitics episodes remain in the queue. Created by Tiger (senior data scientist, Math + Philosophy from NYU). AI-assisted research and production pipeline, human narration and editorial judgment.

## Focus (updated Oct 7, 2026)

The channel is shifting its focus to **AI alignment, ethics, and philosophy**. The first episode under this focus is the motives/AI-care essay (slug `ai-care-motives`, working title "The Unwatched Test: Trusting an AI You Can't Check"); its work lives in `episodes/ai-care-motives/`.

What this changes and what it doesn't:
- **Unchanged:** the voice and doctrine — rigorous, confident frontstage, bounded analogy ("useful here, misleading there, dangerous if overextended"), toxin line, backstage verification. Visual system, brand, and tooling are unchanged.
- **Changed:** the subject matter. "Contemporary geopolitics" is no longer the required third pillar; audits and viability checks should accept contemporary AI / alignment / ethics questions in that slot. Cross-domain connections can come from philosophy, moral theory, history of science and institutions, not only geopolitical history.
- **Not yet decided (open):** whether the geopolitics queue (`silicon-trap`, `blockades-leak`, `prisoners-dilemma`) publishes under the same channel, how the elevator pitch ("analogy essay with philosophical guardrails") and the title rule adapt, and which Argument-Primitive templates (Syllogism, ConditionalArgument, CounterfactualPath, DialecticFlow, ToulminMap, AnalogyCrossmap) become the default visual vocabulary. Strategy docs (`project/PROJECT_VISION.md`, `project/CONTENT_IDENTITY.md`, `project/CHANNEL_POSITIONING.md`) have not been updated yet and may still describe the geopolitics framing.

## Status

**Pre-launch.** Episode numbers are assigned at publish time via `episodes/publish-order.json`; during development everything is identified by slug.

> **State is canonical in [`episodes/pipeline-state.json`](./episodes/pipeline-state.json).** The `State` column below uses the lifecycle tokens from that file and is validated against it by `tools/pipeline_validator.py --check-sources` (wired into `scripts/lint.sh`). Don't hand-drift it — change state in the JSON, then rerun the validator.

| Slug | State | Notes |
|---|---|---|
| `prisoners-dilemma` | RENDER READY | Launch candidate (Philosopher's Lens). Script locked; full manifest (121 segments, ~14.9 min) across 50 template data files. Remaining: `visual-spec.md` (still missing — real gap), first full-episode render, narration, NLE. |
| `silicon-trap` | RENDER READY | Production-ready: script v5, 21-asset shot list, 32 Remotion data files, assembly manifest (99 segments, 13.5 min). Wall: 21 zero-hit footage slots + narration not yet recorded. |
| `blockades-leak` | INCUBATING | Awaiting viability re-gate (v1 returned CONDITIONAL on low historical depth). v1-pass artifacts present but state reverted to INCUBATING. |
| `ai-care-motives` | DRAFTING | First episode under the Oct 2026 AI alignment/ethics focus (working title "The Unwatched Test"). Two-column script v1.7 (~1,500 words, ~11 min est.); retroactive research-audit CONDITIONAL; all 12 stills generated and upscaled, and drawn in Remotion with a framing per use (`StillFrame`); visual-spec done (28 data files, hand-wired 53-segment manifest with no placeholders, visual QA at 1 fail after the re-time: the VW statistic card now waits for its sync words and sits empty for about 3 s); archival photos, EPA notice and stock clips sourced; the two 36 + 59 cards are statements in our own words ("Our summary of a published example"); audio plan written and thinned (no audio files sourced yet). The manifest is timed to a synthetic scratch read (written Oct 12, 11:04; `mode` reads precise but the words are a machine read, a timing aid only, and no narration is recorded). Three heads that read as a face part were fixed in `aigen-06` and `aigen-08`; the other stills predate the face rule and stay as they are by Tiger's decision. Remaining: audio sourcing, Tiger's narration (then `retime_manifest.py`), final render. What is waiting on Tiger is listed at the top of `episodes/ai-care-motives/_status.md`. |

**Built but pending manual deployment:** Mapbox Studio "Meridian Dark" custom style — code wired in `MapGL.tsx`, preset JSON ready at `remotion-templates/meridian-dark-preset.json`, 15-step guide at `tools/mapbox-meridian-setup.md`. Remaining work is the 2–3 hour manual procedure in Mapbox Studio web UI (fork + customize + publish + paste URL into `.env`). Until then, fallback is dark-v11.

**Shipped May 14–20, 2026:** thumbnail and Shorts rendering; the text-animation, transition, math, pacing, counterfactual and asset-generation registers; and the templates added that week (archival, argument, cross-frame, relationship, map, chart, diagram and timeline forms). The full entries are in [`CHANGELOG.md`](./CHANGELOG.md). For what exists now, read [`remotion-templates/TEMPLATE_FAMILIES.md`](./remotion-templates/TEMPLATE_FAMILIES.md).

**Shipped Oct 10, 2026:**
- **Transition engine on the episode timeline** — `src/utils/resolveSeams.ts` decides what each seam actually draws in `FullEpisode`. `dissolve` is a real cross-dissolve (the outgoing segment gets a short frozen "tail" so the two pictures overlap; manifest timings unchanged), `fade` is a dip through ink, dips are symmetric, and templates no longer fade themselves out inside an episode ("seam ownership"). **Hold-under:** a `KineticTypography` card with `layered.backgroundSegmentId` pointing at the picture before it renders as type over that held, dimmed picture (script: `DIR: over(previous)`). **`iris` is retired** (renders as a cut; `M-TRANSITION-IRIS-RETIRED` / `S-DIR-IRIS-RETIRED` warn). Seam-by-seam defaults: [`project/TRANSITION_GRAMMAR.md`](./project/TRANSITION_GRAMMAR.md) § "By seam type"; research: `analysis/transitions-research-2026-10-10.md`. Preview any segment in context: `node remotion-templates/scripts/preview-range.mjs --episode=<slug> --segment=<id>`.
- **AI image-to-video, first use** — `tools/ai-video/fal_i2v.py` generates one clip per call through fal.ai (MiniMax H3 Max; optional pinned end frame; JSON sidecar with prompt and cost). First clip in an episode: `ai-care-motives` `beat5-seg27` (the street empties). Findings and prompting rules: `analysis/ai-video-landscape-2026-10-10.md`.
- **Measured visual QA** — `npm run qa:episode -- --episode=<slug>` (rules: `project/VISUAL_QA.md`).
- **Engine changes, Oct 11** (research: `analysis/remotion-improvements-research-2026-10-11.md`, `analysis/beyond-remotion-tools-research-2026-10-11.md`):
  - *Stills drawn in Remotion.* A FOOTAGE segment whose `asset.file` is an image is drawn by `src/components/StillFrame.tsx` from the full-resolution still and moved by the segment's `framing` (`from` / `to` as `{cx, cy, zoom}`, optional `ease`). Replaces the clips baked by `tools/ai-video/render_kenburns.py`: one still can be a wide, a medium and a detail, a re-time carries the move, and a 2160p render draws from the still's own pixels. `ai-care-motives` uses it for all 22 still segments.
  - *Exchange cards.* `PrimarySourceReveal` gained an exchange layout (`dialogue`, `label`, `typeOut`, `typeSpeed`, `paragraphAtSec`, `legend`, `fontSize`); every exchange on screen is labelled per EDITORIAL_PLAYBOOK VIS-12.
  - *Cuts land on set cards.* Inside an episode `TitleBlock` and document cards are present from the first frame (the seam belongs to the wrapper).
  - *Reveals follow the slot.* `src/utils/scaleToSlot.ts` scales reveal times typed in seconds by slot ÷ authored length when data reaches a template; `retime_manifest.py` records `authoredDurationSec`.
  - *Music follows the narration.* `AudioLayer` keeps music down under any narrated segment, and follows word timings once narration is recorded.
  - *Fonts.* Chinese and Japanese families load only when such text is set (`ensureCjkFonts` in `src/design/fonts.ts`): 707 → 55 font files per page for a Latin-only episode.
- **Oct 12: rules first, timing first** — [`project/PICTURE_RULES.md`](./project/PICTURE_RULES.md) is the one page to read before any picture, clip or synthetic voice. The scratch read is now a gate before visual production (`project/PRODUCTION_PIPELINE.md` Stage 6b); `tools/narration/synthetic_scratch.py` makes a synthetic stand-in for timing when Tiger has not recorded. `pipeline-state.json` `blockedOn` holds the short list of what is waiting on Tiger and shows in each `_status.md`. The pre-commit hook is wired and picks a Python that has the project's packages (`scripts/_python.sh`; plain `python3` on this machine does not).
- **Hand-wired manifests + re-time** — a manifest marked `"handWired": true` is the source of truth for its episode (D49): `generate_manifest.py` will not overwrite it, and narration is applied with `python3 tools/assembly/retime_manifest.py <slug> --audio <wav>` (keeps the wiring, moves only time; dry run unless `--write`). `ai-care-motives` is marked.

**Backlog (deferred):**
- BL-03 RAG fact-checking pipeline (P2) — substantial new infra; not blocking pre-launch.
- BL-04 full Agent SDK orchestration (P3) — current skill-based workflow handles the pipeline; promote to orchestrated only when scale demands it (see `project/DECISIONS.md`).

## Channel identity

- **Name:** Parallax — viewing the same object from different analytical positions
- **Brand mark:** ∴ (therefore symbol)
- **Visual system:** Meridian dual-mode — Light (in-video, primary), Dark (dramatic moments, secondary)
- **Palette:** ink `#1C1814`, gold `#C4A747`, bone `#F0E6D0`, paper `#F5F0E8`, walnut `#5C4A3D`, umber `#8B7355`, taupe `#B8A189`, sand `#D9C9B0`, midnight `#2A2520`, dustblue `#7AA3C9`, text-safe accents goldText `#786526` / dustblueText `#3C6A95` (for text on light backgrounds), plus semantic us `#4A7BA7` / china `#A64D46` / neutral `#888780` — single source of truth: [`tools/brand-treatment/palette.json`](./tools/brand-treatment/palette.json)
- **Fonts:** IBM Plex Sans (display, since May 10 2026 — was Space Grotesk), IBM Plex Serif (long-form body), IBM Plex Mono (metadata/kicker/byline), JetBrains Mono (data), Noto Sans SC (Chinese). The Plex superfamily anchors the system in the mid-century corporate-modernist (Burtin/Bayer/Fortune) lineage; see `remotion-templates/BRAND.md` → Typography for rationale.

## Content philosophy

> **Elevator pitch:** *Not a news explainer, not a doom oracle, not an academic lecture — a rigorously argued analogy essay with philosophical guardrails.*

"Educated mysticism" — structural patterns across civilizations presented as heuristic lenses, not predictions. Three pillars: historical analogy, philosophical frameworks, contemporary stakes (geopolitics, or — under the Oct 2026 focus — AI alignment and ethics). Tone: intellectually rigorous but narratively engaging — "smart friend explaining something fascinating over drinks."

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

`signal-scan → topic-viability → research → research-audit → angle-memo → script-draft → visual-concept → script-audit → persona-eval → review-package → title/hook → thumbnail-concept → **scratch read (gate)** → visual-spec → asset-source → audio-spec → render → narration → NLE assembly → publish → shorts-adaptation → publish-retro`

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
- [`project/MATH_RENDER_REGISTER.md`](./project/MATH_RENDER_REGISTER.md) — six canonical math-rendering primitives (Reveal, Step-by-step, Term-highlight, Substitution, Annotation, Inline) plus the composite Bounded form. Sibling of TEXT_ANIMATION_REGISTER and HOLD_MOTION_REGISTER for moments where the editorial argument is quantifiable and the equation IS the load-bearing piece. Wired via `MathReveal` / `MathDerivation` templates, `<MathInline>` for prose-embedded math, KaTeX-native annotations (`\underbrace`/`\overbrace`), `\textcolor{HEX}{TERM}` brand-palette highlights, the `M-MATH-VALID` formula-parse lint, and the `catalog-showcase-math-render` sequential reference card.
- [`project/ASSET_GENERATION_REGISTER.md`](./project/ASSET_GENERATION_REGISTER.md) — canonical rules for AI-GEN stills (ChatGPT) and morph clips (Kling/Hailuo/Pika). Tool selection table, ChatGPT episode style block, Pika-friendly still principles, Kling/Hailuo prompt structure, quality gates, failure modes. Read when running the `asset-brief` skill or writing prompts manually.
- [`project/PACING_REGISTER.md`](./project/PACING_REGISTER.md) — editorial vocabulary for the three PACE: profiles (`analytical` / `urgent` / `breathing`); the implicit editorial claim each makes; episode arc template; interaction with Transition Grammar and Hold-Motion Register; anti-patterns. Sibling of TEXT_ANIMATION_REGISTER for pacing-as-register. Technical implementation in PACING_SYSTEM.md.
- [`project/COUNTERFACTUAL_REGISTER.md`](./project/COUNTERFACTUAL_REGISTER.md) — two-layer system for counterfactual styling: (1) in-chart ghost series/bars (`counterfactual: true` on `TimeSeriesLine` or `DataPoint` — dashed 12/6, 45% opacity, no glow) + `counterfactualZone` shading; (2) dedicated templates (`CounterfactualPath`, `MorphTransition`). Hawthorn test for admissibility. Decision rule: in-chart when counterfactual is a modifier; template when the fork is the entire argument.
- [`project/PACING_SYSTEM.md`](./project/PACING_SYSTEM.md) — proportional camera paths, Whisper sync loop, `PACE:` density budgeting
- [`project/AUDIO_DESIGN.md`](./project/AUDIO_DESIGN.md) — 3-layer model (music bed, transition SFX, texture hits)
- [`project/CONTENT_IDENTITY.md`](./project/CONTENT_IDENTITY.md) — 8 identity directions, 7 episode formats, 3 topic-discovery entry points
- [`project/DECISIONS.md`](./project/DECISIONS.md) — decision log; check before proposing something that may already be decided
- [`CHANGELOG.md`](./CHANGELOG.md) — what shipped and when (the May 2026 entries that used to sit in this file)
- [`project/IDEAS.md`](./project/IDEAS.md) — topic pipeline (signal → incubating → viable → researching → ready → in production)
- [`project/VISUAL_QA.md`](./project/VISUAL_QA.md) — the measured checks behind `npm run qa:episode` (28px text floor, safe area, contrast, still reuse, the components table) and what each warning means
- [`project/PICTURE_RULES.md`](./project/PICTURE_RULES.md) — **one page; read before generating, editing or accepting any picture, AI clip or synthetic voice.** Tiger's binding rules (no facial parts from any angle; anatomically coherent bodies; nothing new into an episode without his go-ahead; a synthetic voice is for timing only) and the short list of what has worked, each line with its evidence. Add a line when an experiment ends
- [`project/VISUAL_TOOLBOX.md`](./project/VISUAL_TOOLBOX.md) — exploration catalogue (Oct 2026): about 70 ways to treat a generated still, sorted by what the sentence in the script is doing, with test reels and a gallery linked inside. **Options only: nothing in it is wired into an episode or a skill, and adopting any of it needs Tiger's go-ahead (D50).** Read when planning pictures for a script
- [`project/visual-identity/handoff-2026-10-11/parallax-visual-research-handoff.md`](./project/visual-identity/handoff-2026-10-11/parallax-visual-research-handoff.md) — visual-identity research (Oct 10–11): the look under development (painted constructivism; featureless faceted heads with no eyes, nose or mouth; anatomically coherent bodies), what was tried and what Tiger rejected. Not a final identity. Read before generating or editing any picture of a person
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

# Episode Folder Structure — Canonical Spec

> Last updated: 2026-05-21
>
> This is the authoritative layout every episode folder must follow. The `new-episode` skill scaffolds it automatically. When in doubt, this document wins.

---

## Target tree

```
episodes/{slug}/
│
├── _status.md                   # [AUTO] pipeline dashboard — NEVER edit manually
├── _checkpoint.md               # [AUTO] validator output — NEVER edit manually
├── _state-history.jsonl         # [AUTO] state transition log — NEVER edit manually
│
├── REVISION_LOG.md              # [HUMAN] append-only episode changelog (stays at root)
├── script.md                    # [HUMAN] THE canonical locked script — always this name, no v-suffix
├── visual-spec.md               # [HUMAN] visual specification (stays at root — active production doc)
├── shot-list.json               # [HUMAN] asset list + morph pairs (stays at root)
├── asset-registry.json          # [AUTO] disk-state asset registry (appears at RENDER READY)
├── manifest-config.json         # [HUMAN] generate_manifest.py input (stays at root)
├── episode-style.json           # [HUMAN] ChatGPT style block config (stays at root)
├── shorts-manifest.json         # [AUTO] Shorts clip definitions (stays at root)
├── thumbnail-spec.json          # [HUMAN] thumbnail image specs (stays at root)
│
├── research/                    # Research phase artifacts
│   ├── brief.md                 # Research brief (canonical name)
│   ├── research-pass1.md        # Deep Research pass 1
│   ├── research-pass2.md        # Deep Research pass 2 (if used)
│   ├── research-pass3.md        # Deep Research pass 3 (if used)
│   ├── research-bridge-output.md
│   ├── research-audit.md        # research-audit skill output
│   └── deep-research-prompts.md # Prompts used for deep research
│
├── development/                 # Pre-lock editorial process artifacts
│   ├── viability.md             # topic-viability skill output (canonical name — not viability-check.md)
│   ├── angle-memo.md            # angle-memo skill output
│   ├── persona-eval.md          # persona-eval skill output (canonical — not persona-eval-v*.md)
│   ├── visual-concept-audit.md  # visual-concept skill output
│   ├── visual-thread-design.md  # Optional: visual thread design artifact
│   ├── review-package.md        # review-package skill output
│   ├── script-audit.md          # script-audit skill output (canonical — not script-audit-v*.md)
│   └── sourcing-brief.md        # sourcing_brief.py output
│
├── prompts/                     # AI generation prompts (paste-ready)
│   ├── chatgpt-prompts.md       # Still generation prompts (ChatGPT) — canonical name
│   ├── morph-prompts.md         # Morph clip prompts (Kling/Hailuo)
│   └── video-prompts.md         # Single-still animation prompts (Pika)
│
├── audio/                       # Narration + audio delivery
│   ├── audio-cue-sheet.md       # audio-spec skill output
│   ├── narration-readable.md    # Clean read-doc for recording
│   └── pronunciation-guide.md   # narrate skill output
│
├── publish/                     # Post-production + social assets
│   ├── thumbnail-concepts.md    # Thumbnail brief (canonical name)
│   ├── shorts-brief.md          # Shorts extraction brief (canonical name — not shorts-briefs.md)
│   ├── engagement-metrics.md    # Post-publish analytics
│   └── CREDITS.md               # Episode credits
│
├── drafts/                      # Old versions + experimental artifacts
│   └── (old script versions, superseded prompts, deprecated docs, bakeoff results, etc.)
│
└── assets/                      # Working binary assets (not version-critical)
    ├── stills/                  # Production stills (aigen-01-*.png, etc.)
    ├── clips/                   # Animated clips (Pika/Hailuo/NLE)
    ├── ep-refs/                 # Episode reference images (style anchors)
    └── style-refs/              # Channel-level style references (resized)
```

**Root item count:** 3 auto + REVISION_LOG + 8 canonical = **12 items max.**

---

## Core principle: root = current state

The root of an episode folder contains only files that are **alive and actively used** in the current production state. Everything else lives in a subfolder.

- If it is a current, locked canonical file → **root**
- If it is a research or pre-lock artifact → **research/** or **development/**
- If it is an AI generation prompt → **prompts/**
- If it is an audio or narration file → **audio/**
- If it is a post-production or social file → **publish/**
- If it is an old version, superseded, or experimental → **drafts/**
- If it is a binary asset → **assets/**

This rule means the root stays readable at a glance. Anyone opening the folder sees the current state of the episode without noise from history.

---

## Naming rules (enforced)

| Canonical name | Replaces | Notes |
|---|---|---|
| `script.md` | `script-v6-production.md`, `script-production.md`, etc. | No version suffix on the canonical script. Old versions go in `drafts/`. |
| `episode-style.json` | `visual-identity.json`, `style-config.json` | Single canonical name for the ChatGPT style block config. |
| `viability.md` | `viability-check.md`, `viability-v2.md` | In `development/`. No suffixes. |
| `shorts-brief.md` | `shorts-briefs.md`, `shorts-extraction.md` | In `publish/`. Singular, no "s". |
| `chatgpt-prompts.md` | `ai-gen-briefs.md`, `chatgpt-prompts-v2.md` | In `prompts/`. Canonical current version only; old versions go in `drafts/`. |
| `brief.md` | `research-brief.md` | In `research/`. |
| `research-audit.md` | | In `research/` — not at root. |

---

## What each folder is for (and what does NOT go there)

### `research/`
All artifacts from the research phase: briefs, deep-research passes, bridge output, research audit. Nothing editorial here — no script drafts, no visual specs.

**Does NOT contain:** script versions, persona evals, visual concepts, anything from after the angle-memo stage.

### `development/`
All pre-lock editorial artifacts: viability, angle-memo, persona-eval, visual-concept-audit, review-package, script-audit, sourcing brief. These are the decisions made before the script is locked.

**Does NOT contain:** research passes, the locked script, production prompts, audio files, or published artifacts.

### `prompts/`
Paste-ready generation prompts for AI tools. The three files map directly to the three tool tiers in `project/ASSET_GENERATION_REGISTER.md`: ChatGPT (stills), Kling/Hailuo (morphs), Pika (single-still animation).

**Does NOT contain:** shot-list.json (that's a root file), research prompts (those go in `research/`), anything that isn't a paste-ready generation prompt.

### `audio/`
Narration and audio delivery files. Generated by the `narrate` and `audio-spec` skills.

**Does NOT contain:** music files (those are in `assets/`), anything that isn't narration-related.

### `publish/`
Post-production and social media artifacts. Created during or after the publish stage.

**Does NOT contain:** pre-production artifacts, active production docs, anything created before the render stage.

### `drafts/`
Old script versions, superseded prompts, deprecated documents, bakeoff results, experimental artifacts. Anything that existed at some point but is no longer the canonical current version.

**Does NOT contain:** the canonical current version of any file (that lives at its proper location). If you're unsure whether something is "draft" or "current", it's current if it was the most recent output from a pipeline skill and hasn't been superseded.

### `assets/`
Binary working assets. Not version-critical in git — these are large files managed outside the git history.

**Does NOT contain:** text documents, JSON data files, anything that belongs in the semantic subfolders above.

---

## Machine-generated vs. human-maintained

### Never edit manually (machine-generated)
- `_status.md` — regenerated by `python tools/pipeline_validator.py`
- `_checkpoint.md` — regenerated by `python tools/pipeline_validator.py`
- `_state-history.jsonl` — append-only log written by the validator
- `asset-registry.json` — written by the asset-source pipeline
- `shorts-manifest.json` — written by `remotion-templates/scripts/render-shorts.mjs`

### Human-maintained (edit freely)
Everything else. Key ones:
- `script.md` — the production script; locked at RENDER READY
- `REVISION_LOG.md` — append-only by convention; every structural script change gets an entry
- `visual-spec.md` — written by the `visual-spec` skill; human edits welcome
- `manifest-config.json` — hand-tuned input to `generate_manifest.py`

---

## Required vs. optional by pipeline stage

| File / folder | INCUBATING | VIABLE | RESEARCH READY | DRAFTING | RENDER READY | IN POST |
|---|---|---|---|---|---|---|
| `development/viability.md` | — | ✓ required | ✓ | ✓ | ✓ | ✓ |
| `research/brief.md` | — | — | ✓ required | ✓ | ✓ | ✓ |
| `research/research-audit.md` | — | — | ✓ required | ✓ | ✓ | ✓ |
| `development/angle-memo.md` | — | — | — | ✓ required | ✓ | ✓ |
| `development/persona-eval.md` | — | — | — | — | ✓ required | ✓ |
| `development/script-audit.md` | — | — | — | — | ✓ required | ✓ |
| `development/visual-concept-audit.md` | — | — | — | — | ✓ required | ✓ |
| `development/review-package.md` | — | — | — | — | ✓ required | ✓ |
| `REVISION_LOG.md` | — | — | — | — | ✓ required | ✓ |
| `script.md` | — | — | — | — | ✓ required | ✓ |
| `visual-spec.md` | — | — | — | — | optional | ✓ required |
| `shot-list.json` | — | — | — | — | optional | ✓ required |
| `manifest-config.json` | — | — | — | — | — | ✓ required |
| `episode-style.json` | — | — | — | — | optional | ✓ required |
| `prompts/chatgpt-prompts.md` | — | — | — | — | — | optional |
| `audio/audio-cue-sheet.md` | — | — | — | — | — | optional |
| `publish/thumbnail-concepts.md` | — | — | — | — | optional | optional |
| `publish/shorts-brief.md` | — | — | — | — | — | optional |
| `asset-registry.json` | — | — | — | — | ✓ (auto) | ✓ |
| `thumbnail-spec.json` | — | — | — | — | — | optional |
| `shorts-manifest.json` | — | — | — | — | — | optional (auto) |

---

## What goes in `drafts/`

The `drafts/` folder is a landfill for history, not a working directory. Move things here when they are superseded. Never delete — git history aside, `drafts/` is the editorial paper trail.

**Typical contents:**
- Old script versions: `script-v1-production.md`, `script-v2-production.md`, `script-v5-production.md`
- Superseded prompts: `chatgpt-prompts-v1.md`, `chatgpt-regen-prompts.md`
- Deprecated process docs: `visual-pipeline.md` (superseded by `ASSET_GENERATION_REGISTER.md`), `NEXT_SESSION_HANDOFF.md`
- Experimental or comparison artifacts: `bakeoff/`, `v5-vs-v6-ab-review.md`
- Duplicate audio docs: `cue-sheet.md` (when `audio/audio-cue-sheet.md` is canonical)
- Old skill outputs that were superseded but not deleted: `script-audit-v1.md`, `persona-eval-v2.md`

**Rule of thumb:** if you would feel embarrassed showing it to someone as "the current state", it belongs in `drafts/`.

---

## New episode checklist

When scaffolding a new episode (or the `new-episode` skill does it automatically):

1. Copy `EPISODE_TEMPLATE/` to `episodes/{slug}/`
2. Rename `episodes/{slug}/README.md` → delete (it's template-internal)
3. Add the slug to `episodes/pipeline-state.json` with state `INCUBATING`
4. Add to `episodes/PIPELINE.md`
5. Run `python tools/pipeline_validator.py --check-sources` to verify registration

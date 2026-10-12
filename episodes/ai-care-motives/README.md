# EPISODE_TEMPLATE

> Copy this directory to `episodes/<slug>/` when starting a new episode. Run `/new-episode <slug>` to do this automatically.
>
> **Canonical structure spec:** `episodes/EPISODE_STRUCTURE.md` — that document wins on any naming or placement question.

## Directory structure

```
<slug>/
│
├── _status.md                   # [AUTO] pipeline dashboard — never edit
├── _checkpoint.md               # [AUTO] validator output — never edit
├── _state-history.jsonl         # [AUTO] state log — never edit
│
├── REVISION_LOG.md              # [HUMAN] append-only episode changelog
├── script.md                    # [HUMAN] canonical locked script (always this name)
├── visual-spec.md               # [HUMAN] visual specification
├── shot-list.json               # [HUMAN] asset list + morph pairs
├── asset-registry.json          # [AUTO] disk-state asset registry
├── manifest-config.json         # [HUMAN] generate_manifest.py input
├── episode-style.json           # [HUMAN] ChatGPT style block config
├── shorts-manifest.json         # [AUTO] Shorts clip definitions
├── thumbnail-spec.json          # [HUMAN] thumbnail image specs
│
├── research/                    # Research phase
│   ├── brief.md
│   ├── research-pass1.md
│   ├── research-pass2.md
│   ├── research-pass3.md
│   ├── research-bridge-output.md
│   ├── research-audit.md
│   └── deep-research-prompts.md
│
├── development/                 # Pre-lock editorial artifacts
│   ├── viability.md             # canonical name (not viability-check.md)
│   ├── angle-memo.md
│   ├── persona-eval.md
│   ├── visual-concept-audit.md
│   ├── review-package.md
│   └── script-audit.md
│
├── prompts/                     # AI generation prompts
│   ├── chatgpt-prompts.md       # ChatGPT still generation
│   ├── morph-prompts.md         # Kling / Hailuo morph clips
│   └── video-prompts.md         # Pika single-still animation
│
├── audio/                       # Narration + audio delivery
│   ├── audio-cue-sheet.md
│   ├── narration-readable.md
│   └── pronunciation-guide.md
│
├── publish/                     # Post-production + social
│   ├── thumbnail-concepts.md
│   └── shorts-brief.md          # canonical name (not shorts-briefs.md)
│
├── drafts/                      # Old versions + deprecated artifacts
│
└── assets/                      # Working binary assets
    ├── stills/
    ├── clips/
    ├── ep-refs/
    └── style-refs/
```

## Gate checklist

| Gate | Required artifacts | Skill that runs it |
|---|---|---|
| → VIABLE | `development/viability.md` | `topic-viability` |
| → RESEARCH READY | `research/brief.md`, `research/research-audit.md`, `research/research-pass*.md` | `research-audit` |
| → DRAFTING | `development/angle-memo.md` | `angle-memo` |
| → RENDER READY | `script.md`, `development/script-audit.md`, `development/visual-concept-audit.md`, `development/persona-eval.md`, `development/review-package.md`, `REVISION_LOG.md` | `script-audit`, `visual-concept`, `persona-eval`, `review-package` |
| → IN POST | `visual-spec.md`, `audio/audio-cue-sheet.md`, `shot-list.json`, `prompts/video-prompts.md`, validated JSON in `remotion-templates/data/episodes/<slug>/` | `visual-spec`, `audio-spec`, `render-qa`, `validate_data.py` |
| → PUBLISHED | Narration recorded, NLE assembled, Oracle track prediction registered | Human |
| → RETROED | `publish-retro` run, `LEARNING_LOG.md` updated | `publish-retro` |

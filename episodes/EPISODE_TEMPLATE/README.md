# EPISODE_TEMPLATE

> Copy this directory to `episodes/<slug>/` when starting a new episode. Run `/new-episode <slug>` to do this automatically.
>
> Every file here is a canonical stub. See `episodes/PIPELINE.md → File naming convention` for the full naming rules.

## Directory structure

```
<slug>/
├── viability.md                # Stage 2 output — required before Deep Research
├── brief.md                    # Stage 3 final combined brief (canonical)
├── angle-memo.md               # Stage 5 output
├── script-production.md        # Stage 6 final locked script (canonical)
├── persona-eval.md             # Stage 6 accepted persona eval (canonical)
├── script-audit.md             # Stage 6 accepted script audit (canonical)
├── visual-concept-audit.md     # Stage 6 accepted visual concept audit (canonical)
├── review-package.md           # Stage 6 accepted review package (canonical)
├── thumbnail-concepts.md       # Stage 6 thumbnail brief
├── REVISION_LOG.md             # Append-only rewrite decisions log — required
├── visual-spec.md              # Stage 7 visual plan
├── visual-pipeline.md          # Stage 7 episode-specific visual production workflow
├── shot-list.json              # Stage 7 machine-readable shot list
├── video-prompts.md            # Stage 7 image-to-video motion prompts (tool-agnostic)
├── chatgpt-prompts.md          # Stage 7 ChatGPT still generation prompts
├── chatgpt-regen-prompts.md    # Stage 7 regeneration prompts (if stills need rework)
├── episode-style.json          # Stage 7 style config (style IDs, palette overrides)
├── audio-cue-sheet.md          # Stage 7 Track A2 output
├── visual-qa.md                # Stage 7 visual QA report
├── shorts-briefs.md            # Stage 10 Shorts extraction
│
├── research/                   # Deep Research passes and audit
│   ├── deep-research-prompts.md
│   ├── research-pass1.md
│   ├── research-pass2.md
│   ├── research-pass3.md
│   ├── research-bridge-output.md
│   └── research-audit.md
│
├── drafts/                     # Versioned drafts (script-v2.md, persona-eval-v3.md, etc.)
│
└── assets/                     # All visual assets for this episode
    ├── ep-refs/                # Tier 1: episode reference images (style anchors)
    ├── stills/                 # Tier 2: production stills (aigen-01-*.png, etc.)
    ├── clips/                  # Tier 3: animated clips (from Pika/Hailuo/NLE)
    ├── stock/                  # Stock footage/photos (sourced via asset-source)
    └── style-refs-resized/     # Channel-level style references (resized)
```

## Gate checklist

Use this to verify the episode is ready to advance at each state boundary.

| Gate | Required artifacts | Skill that runs it |
|---|---|---|
| → VIABLE | `viability.md` | `topic-viability` |
| → RESEARCH READY | `brief.md`, `research-bridge-output.md`, `research/research-pass*.md` | `research-audit` |
| → DRAFTING | `angle-memo.md` | `angle-memo` |
| → RENDER READY | `script-production.md`, `script-audit.md`, `visual-concept-audit.md`, `persona-eval.md`, `review-package.md`, `REVISION_LOG.md` | `script-audit`, `visual-concept`, `persona-eval`, `review-package` |
| → IN POST | `visual-spec.md`, `visual-pipeline.md`, `audio-cue-sheet.md`, `shot-list.json`, `video-prompts.md`, `visual-qa.md`, validated JSON in `remotion-templates/data/episodes/<slug>/` | `visual-spec`, `audio-spec`, `visual-qa`, `validate_data.py` |
| → PUBLISHED | Narration recorded, NLE assembled, Oracle track prediction registered | Human |
| → RETROED | `publish-retro` run, `LEARNING_LOG.md` updated | `publish-retro` |

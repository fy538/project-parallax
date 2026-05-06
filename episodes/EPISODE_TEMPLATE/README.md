# EPISODE_TEMPLATE

> Copy this directory to `episodes/<slug>/` when starting a new episode. Run `/new-episode <slug>` to do this automatically.
>
> Every file here is a canonical stub. See `episodes/PIPELINE.md → File naming convention` for the full naming rules.

## Directory structure

```
<slug>/
├── README.md                   # this file → replace with episode-specific notes
├── viability.md                # Stage 2 output — required before Deep Research
├── brief.md                    # Stage 3 final combined brief (canonical)
├── research-pass1.md           # Stage 3 Pass 1 brief (keep if materially different from final)
├── research-pass2.md           # Stage 3 Pass 2 output
├── research-pass3.md           # Stage 3 Pass 3 output
├── research-bridge-output.md   # Stage 3 — ready-to-paste prompts between passes
├── angle-memo.md               # Stage 5 output
├── script-production.md        # Stage 6 final locked script (canonical)
├── persona-eval.md             # Stage 6 accepted persona eval (canonical)
├── script-audit.md             # Stage 6 accepted script audit (canonical)
├── visual-concept-audit.md     # Stage 6 accepted visual concept audit (canonical)
├── review-package.md           # Stage 6 accepted review package (canonical)
├── thumbnail-concepts.md       # Stage 6 thumbnail brief
├── REVISION_LOG.md             # Append-only rewrite decisions log — required
├── visual-spec.md              # Stage 7 visual plan
├── audio-cue-sheet.md          # Stage 7 Track A2 output
├── shot-list.json              # Stage 7 machine-readable shot list
├── visual-qa.md                # Stage 7 visual QA report
├── shorts-briefs.md            # Stage 10 Shorts extraction
├── drafts/                     # Versioned script drafts (script-v2-production.md, etc.)
└── assets/                     # Downloaded/treated assets for this episode
```

## Gate checklist

Use this to verify the episode is ready to advance at each state boundary.

| Gate | Required artifacts | Skill that runs it |
|---|---|---|
| → VIABLE | `viability.md` | `topic-viability` |
| → RESEARCH READY | `brief.md`, `research-bridge-output.md`, `research/research-pass*.md` | `research-audit` |
| → DRAFTING | `angle-memo.md` | `angle-memo` |
| → RENDER READY | `script-production.md`, `script-audit.md`, `visual-concept-audit.md`, `persona-eval.md`, `review-package.md`, `REVISION_LOG.md` | `script-audit`, `visual-concept`, `persona-eval`, `review-package` |
| → IN POST | `visual-spec.md`, `audio-cue-sheet.md`, `shot-list.json`, `visual-qa.md`, validated JSON in `remotion-templates/data/episodes/<slug>/` | `visual-spec`, `audio-spec`, `visual-qa`, `validate_data.py` |
| → PUBLISHED | Narration recorded, NLE assembled, Oracle track prediction registered | Human |
| → RETROED | `publish-retro` run, `LEARNING_LOG.md` updated | `publish-retro` |
